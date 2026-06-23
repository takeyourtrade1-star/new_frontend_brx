'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { type OnnxLoadProgress } from '@/lib/scanner/onnx-loader';

import {
  BALANCED,
  hintStreakRequired,
  shouldCommitTurboMatch,
  shouldRunOrbVerify,
  shouldSkipDuplicateFrame,
} from '@/lib/scanner/balancedProfile';
import {
  captureFrame224,
  frameFingerprint,
  imageDataToTensor,
  vectorSearchJson,
} from '@/lib/scanner/preprocess';
import { useOnnxSession, type ModelStatus } from './scanner/useOnnxSession';

export type { OnnxLoadProgress } from '@/lib/scanner/onnx-loader';
export type { ModelStatus } from './scanner/useOnnxSession';

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

const TURBO_MAX_INFLIGHT = 1;

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
    confidenceThreshold: rawConf = BALANCED.confDefault,
    hintConfidenceMin: rawHint = BALANCED.hintDefault,
    captureIntervalMs = BALANCED.captureIntervalMs,
    apiBaseUrl = '/brx-match',
    countdownSeconds = 3,
    requestTimeoutMs = BALANCED.requestTimeoutMs,
    scanMode = 'auto',
    voteWindow = BALANCED.voteWindow,
    voteRequired = BALANCED.voteRequired,
    maxInflight = 3,
    autoOpenCamera = false,
  } = options;

  // Enforce floors
  const effectiveConf = Math.max(rawConf, BALANCED.confFloor);
  const effectiveHint = Math.max(rawHint, BALANCED.hintConfFloor);

  // ONNX edge pipeline: model load, worker, embedding, retry/standard controls.
  const {
    modelStatus,
    modelProgress,
    modelError,
    turboSkipped,
    retryModelDownload,
    continueWithStandardMode,
    runOnnxEmbed,
    isTurboReady,
    onnxCanvasRef,
    onnxCtxRef,
    tensorBufferRef,
  } = useOnnxSession({ apiBaseUrl });

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [state, setState] = useState<ScannerState>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [hint, setHint] = useState<ScanResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
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
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanLoopActiveRef = useRef(false);
  const scanLoopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanGapMsRef = useRef(captureIntervalMs);
  const lastFrameFpRef = useRef(0);
  const lastHintKeyRef = useRef('');
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inflightRef = useRef(0);
  const recentNamesRef = useRef<string[]>([]);
  const matchedRef = useRef(false);
  const hintStaleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** {name, count} — consecutive frames with the same card name, for hint gating. */
  const hintStreakRef = useRef<{ name: string; count: number }>({ name: '', count: 0 });

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
    }, BALANCED.hintStaleMs);
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
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.78);
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
      const needStreak = hintStreakRequired(scanResult.confidence);
      if (hintStreakRef.current.count >= needStreak && scanResult.confidence >= effectiveHint) {
        const hintKey = `${key}:${Math.round(scanResult.confidence * 100)}`;
        if (hintKey !== lastHintKeyRef.current) {
          lastHintKeyRef.current = hintKey;
          setHint(scanResult);
          scheduleHintStale();
        }
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
    const ctx = onnxCtxRef.current;
    const tensorBuf = tensorBufferRef.current;
    if (!video || !onnxCanvas || !ctx || !tensorBuf || video.readyState < 2) return;

    const imageData = captureFrame224(video, onnxCanvas, ctx);
    if (!imageData) return;

    const fp = frameFingerprint(imageData);
    const leaderKey = recentNamesRef.current[recentNamesRef.current.length - 1] ?? '';
    const leaderHits = leaderKey
      ? recentNamesRef.current.filter((n) => n === leaderKey).length
      : 0;
    if (shouldSkipDuplicateFrame(fp, lastFrameFpRef.current, recentNamesRef.current, leaderHits)) {
      return;
    }
    lastFrameFpRef.current = fp;

    syncBusy(inflightRef.current + 1, false);
    const t0 = performance.now();

    try {
      imageDataToTensor(imageData, tensorBuf);
      const vector = await runOnnxEmbed(tensorBuf.slice());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

      const searchResp = await fetch(`${apiBaseUrl}/search-vector`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: vectorSearchJson(vector, BALANCED.searchTopK),
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

      if (shouldRunOrbVerify(margin, top1.confidence)) {
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
      scanGapMsRef.current = Math.max(
        BALANCED.scanGapMinMs,
        Math.min(BALANCED.scanGapMaxMs, Math.round(elapsed * BALANCED.scanGapFactor)),
      );
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

      const key = top1.card_name.trim().toLowerCase();
      const voteBuf = recentNamesRef.current;
      voteBuf.push(key);
      while (voteBuf.length > voteWindow) voteBuf.shift();
      const voteHits = voteBuf.filter((n) => n === key).length;

      if (
        scanResult.search_url &&
        shouldCommitTurboMatch({
          finalConfidence,
          margin,
          voteHits,
          effectiveConf,
          voteRequired,
        })
      ) {
        commitMatch(scanResult);
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
    runOnnxEmbed,
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
    if (isTurboReady()) return sendFrameOnnx();
    return sendFrameLegacy();
  }, [isTurboReady, sendFrameOnnx, sendFrameLegacy]);

  const startScanLoop = useCallback(() => {
    clearScanLoop();
    scanLoopActiveRef.current = true;
    const tick = async () => {
      if (!scanLoopActiveRef.current || matchedRef.current) return;
      await sendFrame();
      if (!scanLoopActiveRef.current || matchedRef.current) return;
      scanLoopTimerRef.current = setTimeout(() => void tick(), scanGapMsRef.current);
    };
    void tick();
  }, [clearScanLoop, sendFrame]);

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
    lastFrameFpRef.current = 0;
    lastHintKeyRef.current = '';
    scanGapMsRef.current = captureIntervalMs;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640, max: 960 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 30, max: 30 },
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
    lastFrameFpRef.current = 0;
    lastHintKeyRef.current = '';
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
