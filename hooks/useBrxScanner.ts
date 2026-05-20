'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type * as OrtLib from 'onnxruntime-web';

import {
  fetchAndCacheOnnxModel,
  ONNX_LOAD_PROGRESS_IDLE,
  type OnnxLoadProgress,
} from './useOnnxLoader';

import { resolveOnnxDownloadUrls } from './resolveOnnxUrls';

export type { OnnxLoadProgress } from './useOnnxLoader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScannerState =
  | 'idle'
  | 'requesting_camera'
  | 'scanning'
  | 'processing'
  | 'matched'
  | 'no_match'
  | 'error';

/** ONNX model load status for the edge pipeline. */
export type ModelStatus = 'loading' | 'ready' | 'failed';

export interface ScanResult {
  card_name: string;
  set_name: string;
  set_code: string;
  image_uri: string | null;
  confidence: number;
  method: string;
  search_url: string;
  search_query: string;
  latency_ms: number;
}

export interface UseBrxScannerOptions {
  onMatch?: (result: ScanResult) => void;
  onNoMatch?: () => void;
  onError?: (message: string) => void;
  /**
   * Minimum confidence to commit a match.
   * Floor is 0.80 — values below 0.80 are silently raised to 0.80.
   */
  confidenceThreshold?: number;
  /**
   * Minimum confidence to show a hint chip.
   * Floor is 0.72 — values below 0.72 are silently raised to 0.72.
   * Additionally requires 2 consecutive frames with the same card name.
   */
  hintConfidenceMin?: number;
  captureIntervalMs?: number;
  apiBaseUrl?: string;
  countdownSeconds?: number;
  requestTimeoutMs?: number;
  /** fast = CNN only (live scan); auto = server may skip ORB when confident. */
  scanMode?: 'auto' | 'fast' | 'full';
  /** Vote window for commit (default 5 for V3, 3 for legacy). */
  voteWindow?: number;
  /** Required votes within window for commit (default 3 for V3, 2 for legacy). */
  voteRequired?: number;
  maxInflight?: number;
  /** If false, caller opens camera after model is ready (recommended). */
  autoOpenCamera?: boolean;
}

export interface DebugInfo {
  framesSent: number;
  lastStatus: string | null;
  lastLatencyMs: number;
  lastError: string | null;
  lastOutcome: 'matched' | 'not_matched' | 'pending' | null;
  lastMethod: string | null;
}

export interface UseBrxScannerReturn {
  state: ScannerState;
  result: ScanResult | null;
  /** Live guess while scanning (before match commit). */
  hint: ScanResult | null;
  isBusy: boolean;
  errorMessage: string | null;
  countdown: number;
  debug: DebugInfo;
  /** ONNX edge pipeline status. */
  modelStatus: ModelStatus;
  /** ONNX download / cache progress (bytes + phase). */
  modelProgress: OnnxLoadProgress;
  /** Last ONNX load failure message (null when loading or ready). */
  modelError: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  openCamera: () => Promise<void>;
  stopScanning: () => void;
  restartScanning: () => void;
  /** Re-fetch ONNX model (e.g. after failed download or backend V3 deploy). */
  retryModelDownload: () => void;
  /** Skip Turbo and open camera with server-side /scan only. */
  continueWithStandardMode: () => void;
  /** User chose standard mode or ONNX was skipped — hide the pre-scan gate. */
  turboSkipped: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HINT_STALE_MS = 1200;

/** Enterprise thresholds — floors enforced regardless of options. */
const CONF_FLOOR = 0.80;
const HINT_CONF_FLOOR = 0.72;
const VECTOR_DIM = 384;
const ONNX_SIZE = 224;
/** Turbo: one ONNX+network pass at a time (parallel runs freeze mobile UI). */
const TURBO_MAX_INFLIGHT = 1;
/** High-confidence match → commit without waiting for vote window. */
const FAST_COMMIT_CONF = 0.87;
const FAST_COMMIT_MARGIN = 0.06;
/** ORB verify only when top-1/top-2 are very close (expensive JPEG upload). */
const VERIFY_MARGIN_THRESHOLD = 0.03;
const HINT_INSTANT_CONF = 0.85;

/** ImageNet normalisation constants (must match DINOv2 training). */
const IMAGENET_MEAN = [0.485, 0.456, 0.406] as const;
const IMAGENET_STD = [0.229, 0.224, 0.225] as const;

// ---------------------------------------------------------------------------
// Pure helpers (defined outside hook to keep them stable)
// ---------------------------------------------------------------------------

function l2Normalize(vec: Float32Array): Float32Array {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq);
  if (norm < 1e-8) return vec;
  const out = new Float32Array(vec.length);
  for (let i = 0; i < vec.length; i++) out[i] = vec[i] / norm;
  return out;
}

/**
 * Convert RGBA ImageData (224×224) to a CHW float32 tensor normalised
 * with ImageNet mean/std — identical to the Python `preprocess()` in
 * `app/scanner/embedder_dinov2.py`.
 */
function imageDataToOnnxTensor(imageData: ImageData): Float32Array {
  const { data } = imageData; // RGBA uint8, length = 4 * 224 * 224
  const pixels = ONNX_SIZE * ONNX_SIZE;
  const tensor = new Float32Array(3 * pixels); // CHW: [R_plane, G_plane, B_plane]
  for (let i = 0; i < pixels; i++) {
    tensor[i]              = (data[i * 4]     / 255 - IMAGENET_MEAN[0]) / IMAGENET_STD[0]; // R
    tensor[pixels + i]     = (data[i * 4 + 1] / 255 - IMAGENET_MEAN[1]) / IMAGENET_STD[1]; // G
    tensor[2 * pixels + i] = (data[i * 4 + 2] / 255 - IMAGENET_MEAN[2]) / IMAGENET_STD[2]; // B
  }
  return tensor;
}

/**
 * Draw a centre-square crop of the video frame at 224×224 px.
 * The canvas is re-used across calls (only dims change on first call).
 */
function captureFrame224(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): ImageData | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh || video.readyState < 2) return null;

  canvas.width = ONNX_SIZE;
  canvas.height = ONNX_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Centre-square crop → scale to 224×224
  const side = Math.min(vw, vh);
  const sx = (vw - side) / 2;
  const sy = (vh - side) / 2;
  ctx.drawImage(video, sx, sy, side, side, 0, 0, ONNX_SIZE, ONNX_SIZE);
  return ctx.getImageData(0, 0, ONNX_SIZE, ONNX_SIZE);
}

/** Compact vector payload (~2 KB) vs JSON number array (~4 KB). */
function vectorSearchBody(vec: Float32Array, topK: number): string {
  const u8 = new Uint8Array(vec.buffer, vec.byteOffset, vec.byteLength);
  let binary = '';
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]);
  return JSON.stringify({
    vector_b64: btoa(binary),
    top_k: topK,
    mode: 'fast',
  });
}

async function blobToBase64Strip(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBrxScanner(options: UseBrxScannerOptions = {}): UseBrxScannerReturn {
  const {
    onMatch,
    onNoMatch,
    onError,
    confidenceThreshold: rawConf = 0.80,
    hintConfidenceMin: rawHint = 0.72,
    captureIntervalMs = 240,
    apiBaseUrl = '/brx-match',
    countdownSeconds = 3,
    requestTimeoutMs = 3500,
    scanMode = 'auto',
    voteWindow = 4,
    voteRequired = 2,
    maxInflight = 3,
    autoOpenCamera = false,
  } = options;

  // Enforce floors
  const effectiveConf = Math.max(rawConf, CONF_FLOOR);
  const effectiveHint = Math.max(rawHint, HINT_CONF_FLOOR);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [state, setState] = useState<ScannerState>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [hint, setHint] = useState<ScanResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading');
  const [modelProgress, setModelProgress] = useState<OnnxLoadProgress>(ONNX_LOAD_PROGRESS_IDLE);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelLoadAttempt, setModelLoadAttempt] = useState(0);
  const [turboSkipped, setTurboSkipped] = useState(false);
  const cameraOpenedRef = useRef(false);
  const [debug, setDebug] = useState<DebugInfo>({
    framesSent: 0,
    lastStatus: null,
    lastLatencyMs: -1,
    lastError: null,
    lastOutcome: null,
    lastMethod: null,
  });

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Hidden 224×224 canvas for ONNX frame capture — never exposed to page. */
  const onnxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanLoopActiveRef = useRef(false);
  const scanLoopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inflightRef = useRef(0);
  const recentNamesRef = useRef<string[]>([]);
  const matchedRef = useRef(false);
  const hintStaleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** {name, count} — consecutive frames with the same card name, for hint gating. */
  const hintStreakRef = useRef<{ name: string; count: number }>({ name: '', count: 0 });

  /** ONNX InferenceSession (set once after model loads). */
  const sessionRef = useRef<OrtLib.InferenceSession | null>(null);
  /** Cached onnxruntime-web module reference (avoids repeated dynamic import). */
  const ortRef = useRef<typeof OrtLib | null>(null);

  // ---------------------------------------------------------------------------
  // ONNX model loading (runs once after mount)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (turboSkipped) return;

    let cancelled = false;

    // Create the hidden 224×224 canvas used for ONNX frame capture
    if (!onnxCanvasRef.current && typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = ONNX_SIZE;
      c.height = ONNX_SIZE;
      onnxCanvasRef.current = c;
    }

    async function loadOnnxModel() {
      setModelError(null);
      setModelProgress({ loaded: 0, total: 0, percent: -1, phase: 'downloading' });

      try {
        const modelUrls = await resolveOnnxDownloadUrls(apiBaseUrl);
        const modelData = await fetchAndCacheOnnxModel(modelUrls, (progress) => {
          if (!cancelled) setModelProgress(progress);
        });
        if (cancelled) return;

        if (!cancelled) {
          setModelProgress({
            loaded: modelData.byteLength,
            total: modelData.byteLength,
            percent: 100,
            phase: 'initializing',
            reason: 'Avvio motore AI…',
          });
        }

        const ort = await import('onnxruntime-web');
        if (cancelled) return;

        // Single-threaded WASM — no SharedArrayBuffer required; works in any
        // browser context including iOS Safari without COOP/COEP headers.
        // WASM files must be in /ort-wasm/ (copied by postinstall script).
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.simd = true;
        ort.env.wasm.wasmPaths = '/ort-wasm/';

        let session: OrtLib.InferenceSession;
        try {
          session = await ort.InferenceSession.create(modelData, {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all',
          });
        } catch (wasmErr) {
          console.warn('[BrxScanner] WASM EP failed, retrying with webgl:', wasmErr);
          session = await ort.InferenceSession.create(modelData, {
            executionProviders: ['webgl', 'wasm'],
            graphOptimizationLevel: 'all',
          });
        }
        if (cancelled) return;

        try {
          const warmup = new ort.Tensor(
            'float32',
            new Float32Array(3 * ONNX_SIZE * ONNX_SIZE),
            [1, 3, ONNX_SIZE, ONNX_SIZE],
          );
          await session.run({ [session.inputNames[0]]: warmup });
        } catch {
          /* non-fatal */
        }
        if (cancelled) return;

        ortRef.current = ort as unknown as typeof OrtLib;
        sessionRef.current = session;
        setModelError(null);
        setModelStatus('ready');
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : 'Download modello ONNX non riuscito';
          console.warn('[BrxScanner] ONNX model load failed — falling back to /scan:', msg);
          setModelError(msg);
          setModelProgress((p) => ({
            ...p,
            phase: 'failed',
            percent: 0,
            reason: msg,
          }));
          setModelStatus('failed');
        }
      }
    }

    loadOnnxModel();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl, modelLoadAttempt, turboSkipped]);

  const retryModelDownload = useCallback(() => {
    sessionRef.current = null;
    ortRef.current = null;
    setModelError(null);
    setModelStatus('loading');
    setModelProgress({ loaded: 0, total: 0, percent: -1, phase: 'downloading' });
    setModelLoadAttempt((n) => n + 1);
  }, []);

  const continueWithStandardMode = useCallback(() => {
    setTurboSkipped(true);
    setModelError(null);
    setModelStatus('failed');
    sessionRef.current = null;
    ortRef.current = null;
  }, []);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const syncBusy = useCallback((n: number, updateUi = true) => {
    inflightRef.current = n;
    if (updateUi) setIsBusy(n > 0);
  }, []);

  const clearScanLoop = useCallback(() => {
    scanLoopActiveRef.current = false;
    if (scanLoopTimerRef.current) {
      clearTimeout(scanLoopTimerRef.current);
      scanLoopTimerRef.current = null;
    }
  }, []);

  const clearHintStale = useCallback(() => {
    if (hintStaleRef.current) {
      clearTimeout(hintStaleRef.current);
      hintStaleRef.current = null;
    }
  }, []);

  const scheduleHintStale = useCallback(() => {
    clearHintStale();
    hintStaleRef.current = setTimeout(() => {
      if (!matchedRef.current) setHint(null);
    }, HINT_STALE_MS);
  }, [clearHintStale]);

  const stopScanning = useCallback(() => {
    clearScanLoop();
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    clearHintStale();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    syncBusy(0);
    matchedRef.current = false;
    recentNamesRef.current = [];
    hintStreakRef.current = { name: '', count: 0 };
    setHint(null);
    setCountdown(0);
    setState('idle');
  }, [clearHintStale, clearScanLoop, syncBusy]);

  useEffect(() => () => stopScanning(), [stopScanning]);

  // JPEG capture (legacy + verify) — 384 px wide
  const captureFrame = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) { resolve(null); return; }
      const W = 384;
      const H = Math.round(W * (video.videoHeight / Math.max(video.videoWidth, 1)));
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(video, 0, 0, W, H);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.68);
    });
  }, []);

  const commitMatch = useCallback(
    (scanResult: ScanResult) => {
      if (matchedRef.current) return;
      matchedRef.current = true;
      clearHintStale();
      setHint(null);
      setResult(scanResult);
      setState('matched');
      clearScanLoop();
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      setCountdown(countdownSeconds);
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      onMatch?.(scanResult);
    },
    [clearHintStale, clearScanLoop, countdownSeconds, onMatch],
  );

  /**
   * Hint gating: requires 2 consecutive frames with the same card name
   * AND confidence >= effectiveHint.
   */
  const applyHint = useCallback(
    (scanResult: ScanResult) => {
      if (matchedRef.current) return;
      const key = scanResult.card_name.trim().toLowerCase();
      if (hintStreakRef.current.name === key) {
        hintStreakRef.current.count++;
      } else {
        hintStreakRef.current = { name: key, count: 1 };
      }
      const needStreak = scanResult.confidence >= HINT_INSTANT_CONF ? 1 : 2;
      if (hintStreakRef.current.count >= needStreak && scanResult.confidence >= effectiveHint) {
        setHint(scanResult);
        scheduleHintStale();
      }
    },
    [effectiveHint, scheduleHintStale],
  );

  /**
   * Vote system: commit when the same card name appears in >= voteRequired
   * out of the last voteWindow frames, with confidence >= effectiveConf.
   */
  const recordVote = useCallback(
    (name: string, scanResult: ScanResult) => {
      const key = name.trim().toLowerCase();
      if (!key) return;
      const buf = recentNamesRef.current;
      buf.push(key);
      while (buf.length > voteWindow) buf.shift();
      const hits = buf.filter((n) => n === key).length;
      if (hits >= voteRequired && scanResult.confidence >= effectiveConf) {
        commitMatch(scanResult);
      }
    },
    [commitMatch, effectiveConf, voteRequired, voteWindow],
  );

  // ---------------------------------------------------------------------------
  // V3 edge pipeline — embed locally, POST /search-vector, optional /verify
  // ---------------------------------------------------------------------------

  const sendFrameOnnx = useCallback(async (): Promise<void> => {
    if (matchedRef.current) return;
    if (inflightRef.current >= TURBO_MAX_INFLIGHT) return;

    const video = videoRef.current;
    const onnxCanvas = onnxCanvasRef.current;
    if (!video || !onnxCanvas || video.readyState < 2) return;

    const imageData = captureFrame224(video, onnxCanvas);
    if (!imageData) return;

    syncBusy(inflightRef.current + 1, false);
    const t0 = performance.now();

    try {
      const ort = ortRef.current;
      const session = sessionRef.current;
      if (!ort || !session) return; // Shouldn't happen: caller checks modelStatus

      // --- Embed locally ---
      const tensorData = imageDataToOnnxTensor(imageData);
      const tensor = new ort.Tensor('float32', tensorData, [1, 3, ONNX_SIZE, ONNX_SIZE]);
      const feeds: Record<string, OrtLib.Tensor> = { [session.inputNames[0]]: tensor };
      const outputs = await session.run(feeds);
      const rawVec = outputs[session.outputNames[0]].data as Float32Array;
      // CLS token: first 384 floats (batch dim is 1)
      const clsVec = new Float32Array(rawVec.buffer, rawVec.byteOffset, VECTOR_DIM);
      const vector = l2Normalize(new Float32Array(clsVec));

      // --- POST /search-vector ---
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

      const searchResp = await fetch(`${apiBaseUrl}/search-vector`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: vectorSearchBody(vector, 3),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!searchResp.ok) {
        setDebug((d) => ({
          ...d,
          lastStatus: String(searchResp.status),
          lastLatencyMs: Math.round(performance.now() - t0),
          lastError: `HTTP ${searchResp.status}`,
          lastOutcome: 'not_matched',
          lastMethod: null,
        }));
        return;
      }

      const searchData = await searchResp.json();
      const candidates: {
        meta_idx: number;
        card_name: string;
        set_name: string;
        set_code: string;
        image_uri: string | null;
        confidence: number;
        search_url: string;
        search_query: string;
        scryfall_id: string;
      }[] = searchData.candidates ?? [];

      if (!candidates.length) return;

      const top1 = candidates[0];
      const top2 = candidates[1];
      const margin = top2 ? top1.confidence - top2.confidence : 1.0;

      let finalConfidence = top1.confidence;
      let method = 'v3+vec';

      // --- Optional /verify when margin is too small ---
      if (margin < VERIFY_MARGIN_THRESHOLD && top1.confidence >= effectiveHint) {
        try {
          const cropBlob = await captureFrame();
          if (cropBlob) {
            const b64 = await blobToBase64Strip(cropBlob);
            const verifyResp = await fetch(`${apiBaseUrl}/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ meta_idx: top1.meta_idx, image_b64: b64 }),
            });
            if (verifyResp.ok) {
              const vd = await verifyResp.json();
              if (vd.verified) {
                finalConfidence = Math.max(finalConfidence, vd.confidence);
                method = 'v3+vec+orb';
              }
            }
          }
        } catch {
          // /verify failed — continue with vector-only confidence
        }
      }

      const elapsed = Math.round(performance.now() - t0);
      const matched = finalConfidence >= effectiveConf;

      setDebug((d) => ({
        ...d,
        lastStatus: '200',
        lastLatencyMs: elapsed,
        lastError: null,
        lastOutcome: matched ? 'matched' : 'not_matched',
        lastMethod: method,
      }));

      if (!top1.card_name || !top1.search_url) return;

      const scanResult: ScanResult = {
        card_name: top1.card_name,
        set_name: top1.set_name,
        set_code: top1.set_code,
        image_uri: top1.image_uri ?? null,
        confidence: finalConfidence,
        method,
        search_url: top1.search_url,
        search_query: top1.search_query ?? '',
        latency_ms: elapsed,
      };

      applyHint(scanResult);

      if (
        scanResult.search_url &&
        top1.confidence >= FAST_COMMIT_CONF &&
        margin >= FAST_COMMIT_MARGIN
      ) {
        commitMatch(scanResult);
      } else if (matched && scanResult.search_url) {
        commitMatch(scanResult);
      } else {
        recordVote(top1.card_name, scanResult);
      }
    } catch (err) {
      const elapsed = Math.round(performance.now() - t0);
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      setDebug((d) => ({
        ...d,
        lastStatus: isAbort ? 'TIMEOUT' : 'NETWORK_ERROR',
        lastLatencyMs: elapsed,
        lastError: isAbort ? `TIMEOUT dopo ${requestTimeoutMs}ms` : String(err),
        lastOutcome: 'not_matched',
        lastMethod: null,
      }));
    } finally {
      syncBusy(Math.max(0, inflightRef.current - 1), false);
    }
  }, [
    apiBaseUrl,
    applyHint,
    captureFrame,
    commitMatch,
    effectiveConf,
    effectiveHint,
    recordVote,
    requestTimeoutMs,
    syncBusy,
  ]);

  // ---------------------------------------------------------------------------
  // Legacy pipeline — upload JPEG to POST /scan (fallback when ONNX not ready)
  // ---------------------------------------------------------------------------

  const sendFrameLegacy = useCallback(async (): Promise<void> => {
    if (matchedRef.current) return;
    if (inflightRef.current >= maxInflight) return;

    syncBusy(inflightRef.current + 1);
    const blob = await captureFrame();
    if (!blob) { syncBusy(Math.max(0, inflightRef.current - 1)); return; }

    const formData = new FormData();
    formData.append('image', blob, 'frame.jpg');

    const t0 = performance.now();
    setDebug((d) => ({ ...d, framesSent: d.framesSent + 1, lastOutcome: 'pending' }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const resp = await fetch(`${apiBaseUrl}/scan?mode=${encodeURIComponent(scanMode)}`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const elapsed = Math.round(performance.now() - t0);
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        setDebug((d) => ({
          ...d,
          lastStatus: String(resp.status),
          lastLatencyMs: elapsed,
          lastError: text.slice(0, 120) || `HTTP ${resp.status}`,
          lastOutcome: 'not_matched',
          lastMethod: null,
        }));
        return;
      }

      const data = await resp.json();
      const method = (data.method as string) ?? 'none';
      setDebug((d) => ({
        ...d,
        lastStatus: String(resp.status),
        lastLatencyMs: data.latency_ms ?? elapsed,
        lastError: null,
        lastOutcome: data.matched ? 'matched' : 'not_matched',
        lastMethod: method,
      }));

      const scanResult: ScanResult | null =
        data.card_name && (data.search_url || data.matched)
          ? {
              card_name: data.card_name ?? '',
              set_name: data.set_name ?? '',
              set_code: data.set_code ?? '',
              image_uri: data.image_uri ?? null,
              confidence: data.confidence ?? 0,
              method,
              search_url: data.search_url ?? '',
              search_query: data.search_query ?? '',
              latency_ms: data.latency_ms ?? elapsed,
            }
          : null;

      if (scanResult) applyHint(scanResult);

      if (data.matched && scanResult && scanResult.confidence >= effectiveConf && scanResult.search_url) {
        commitMatch(scanResult);
      } else if (scanResult?.card_name) {
        recordVote(scanResult.card_name, scanResult);
        if (!data.matched) onNoMatch?.();
      } else if (!data.matched) {
        onNoMatch?.();
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - t0);
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const msg = isAbort
        ? `TIMEOUT dopo ${requestTimeoutMs}ms`
        : err instanceof Error ? err.message : 'Unknown error';
      setDebug((d) => ({
        ...d,
        lastStatus: isAbort ? 'TIMEOUT' : 'NETWORK_ERROR',
        lastLatencyMs: elapsed,
        lastError: msg,
        lastOutcome: 'not_matched',
        lastMethod: null,
      }));
    } finally {
      syncBusy(Math.max(0, inflightRef.current - 1));
      if (!matchedRef.current) setState('scanning');
    }
  }, [
    apiBaseUrl,
    applyHint,
    captureFrame,
    commitMatch,
    effectiveConf,
    maxInflight,
    onNoMatch,
    recordVote,
    requestTimeoutMs,
    scanMode,
    syncBusy,
  ]);

  // ---------------------------------------------------------------------------
  // Unified sendFrame: routes to ONNX or legacy based on session availability
  // ---------------------------------------------------------------------------

  const sendFrame = useCallback(async (): Promise<void> => {
    if (sessionRef.current && ortRef.current) {
      return sendFrameOnnx();
    }
    return sendFrameLegacy();
  }, [sendFrameOnnx, sendFrameLegacy]);

  const startScanLoop = useCallback(() => {
    clearScanLoop();
    scanLoopActiveRef.current = true;
    const tick = async () => {
      if (!scanLoopActiveRef.current || matchedRef.current) return;
      await sendFrame();
      if (!scanLoopActiveRef.current || matchedRef.current) return;
      scanLoopTimerRef.current = setTimeout(() => void tick(), captureIntervalMs);
    };
    void tick();
  }, [captureIntervalMs, clearScanLoop, sendFrame]);

  // ---------------------------------------------------------------------------
  // Camera / interval management
  // ---------------------------------------------------------------------------

  const openCamera = useCallback(async (): Promise<void> => {
    setState('requesting_camera');
    setErrorMessage(null);
    setResult(null);
    setHint(null);
    matchedRef.current = false;
    recentNamesRef.current = [];
    hintStreakRef.current = { name: '', count: 0 };

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 24, max: 30 },
        },
        audio: false,
      });
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : 'Could not access camera.';
      setErrorMessage(msg);
      setState('error');
      onError?.(msg);
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }

    setState('scanning');
    setIsBusy(false);
    startScanLoop();
  }, [onError, startScanLoop]);

  useEffect(() => {
    if (!autoOpenCamera || cameraOpenedRef.current) return;
    if (turboSkipped) {
      cameraOpenedRef.current = true;
      void openCamera();
      return;
    }
    if (modelStatus === 'ready') {
      cameraOpenedRef.current = true;
      void openCamera();
    }
  }, [autoOpenCamera, modelStatus, turboSkipped, openCamera]);

  const restartScanning = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    clearHintStale();
    setCountdown(0);
    setResult(null);
    setHint(null);
    matchedRef.current = false;
    recentNamesRef.current = [];
    hintStreakRef.current = { name: '', count: 0 };
    syncBusy(0);
    setState('scanning');
    if (streamRef.current && !scanLoopActiveRef.current) {
      startScanLoop();
    }
  }, [clearHintStale, startScanLoop, syncBusy]);

  return {
    state,
    result,
    hint,
    isBusy,
    errorMessage,
    countdown,
    debug,
    modelStatus,
    modelProgress,
    modelError,
    videoRef,
    canvasRef,
    openCamera,
    stopScanning,
    restartScanning,
    retryModelDownload,
    continueWithStandardMode,
    turboSkipped,
  };
}
