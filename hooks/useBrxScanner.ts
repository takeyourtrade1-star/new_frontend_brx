'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

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

export type ScanPhase = 'idle' | 'live' | 'confirming';

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
  confidenceThreshold?: number;
  hintConfidenceMin?: number;
  instantCommitThreshold?: number;
  captureIntervalMs?: number;
  apiBaseUrl?: string;
  countdownSeconds?: number;
  requestTimeoutMs?: number;
  confirmTimeoutMs?: number;
  stableHintRequired?: number;
  maxInflight?: number;
}

export interface DebugInfo {
  framesSent: number;
  confirmsSent: number;
  lastStatus: string | null;
  lastLatencyMs: number;
  lastError: string | null;
  lastOutcome: 'matched' | 'not_matched' | 'pending' | null;
  lastMethod: string | null;
  phase: ScanPhase;
}

export interface UseBrxScannerReturn {
  state: ScannerState;
  phase: ScanPhase;
  result: ScanResult | null;
  hint: ScanResult | null;
  isBusy: boolean;
  errorMessage: string | null;
  countdown: number;
  debug: DebugInfo;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  openCamera: () => Promise<void>;
  stopScanning: () => void;
  restartScanning: () => void;
}

const HINT_STALE_MS = 1500;
const LIVE_WIDTH = 400;
const LIVE_JPEG_Q = 0.72;
const CONFIRM_WIDTH = 512;
const CONFIRM_JPEG_Q = 0.82;
const CONFIRM_COOLDOWN_MS = 1200;

function parseScanResult(
  data: Record<string, unknown>,
  method: string,
  elapsed: number,
): ScanResult | null {
  if (!data.card_name || (!data.search_url && !data.matched)) return null;
  return {
    card_name: String(data.card_name ?? ''),
    set_name: String(data.set_name ?? ''),
    set_code: String(data.set_code ?? ''),
    image_uri: (data.image_uri as string | null) ?? null,
    confidence: Number(data.confidence ?? 0),
    method,
    search_url: String(data.search_url ?? ''),
    search_query: String(data.search_query ?? ''),
    latency_ms: Number(data.latency_ms ?? elapsed),
  };
}

function isHighTrustMethod(method: string): boolean {
  return method.includes('+orb') || method.includes('+cnn') || method === 'phash';
}

export function useBrxScanner(options: UseBrxScannerOptions = {}): UseBrxScannerReturn {
  const {
    onMatch,
    onNoMatch,
    onError,
    confidenceThreshold = 0.8,
    hintConfidenceMin = 0.74,
    instantCommitThreshold = 0.86,
    captureIntervalMs = 360,
    apiBaseUrl = '/brx-match',
    countdownSeconds = 3,
    requestTimeoutMs = 5000,
    confirmTimeoutMs = 8000,
    stableHintRequired = 2,
    maxInflight = 2,
  } = options;

  const [state, setState] = useState<ScannerState>('idle');
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [hint, setHint] = useState<ScanResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [debug, setDebug] = useState<DebugInfo>({
    framesSent: 0,
    confirmsSent: 0,
    lastStatus: null,
    lastLatencyMs: -1,
    lastError: null,
    lastOutcome: null,
    lastMethod: null,
    phase: 'idle',
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inflightRef = useRef(0);
  const matchedRef = useRef(false);
  const confirmingRef = useRef(false);
  const hintStaleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stableNameRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);
  const lastConfirmAtRef = useRef(0);

  const syncBusy = useCallback((n: number) => {
    inflightRef.current = n;
    setIsBusy(n > 0);
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
      if (!matchedRef.current && !confirmingRef.current) setHint(null);
    }, HINT_STALE_MS);
  }, [clearHintStale]);

  const pauseLiveLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopScanning = useCallback(() => {
    pauseLiveLoop();
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    clearHintStale();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    syncBusy(0);
    matchedRef.current = false;
    confirmingRef.current = false;
    stableNameRef.current = null;
    stableCountRef.current = 0;
    setHint(null);
    setCountdown(0);
    setPhase('idle');
    setState('idle');
    setDebug((d) => ({ ...d, phase: 'idle' }));
  }, [clearHintStale, pauseLiveLoop, syncBusy]);

  useEffect(() => () => stopScanning(), [stopScanning]);

  const captureFrame = useCallback((width: number, quality: number): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        resolve(null);
        return;
      }
      const W = width;
      const H = Math.round(W * (video.videoHeight / Math.max(video.videoWidth, 1)));
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, W, H);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    });
  }, []);

  const postScan = useCallback(
    async (
      blob: Blob,
      mode: 'auto' | 'full',
      timeoutMs: number,
    ): Promise<{ ok: boolean; data: Record<string, unknown>; elapsed: number; status: number }> => {
      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');
      const t0 = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const resp = await fetch(`${apiBaseUrl}/scan?mode=${mode}`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const elapsed = Math.round(performance.now() - t0);
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          return {
            ok: false,
            status: resp.status,
            elapsed,
            data: { error: text.slice(0, 120) || `HTTP ${resp.status}` },
          };
        }
        return { ok: true, status: resp.status, elapsed, data: (await resp.json()) as Record<string, unknown> };
      } catch (err) {
        clearTimeout(timeoutId);
        const elapsed = Math.round(performance.now() - t0);
        const isAbort = err instanceof DOMException && err.name === 'AbortError';
        return {
          ok: false,
          status: isAbort ? 408 : 0,
          elapsed,
          data: {
            error: isAbort ? `TIMEOUT ${timeoutMs}ms` : err instanceof Error ? err.message : 'Unknown',
          },
        };
      }
    },
    [apiBaseUrl],
  );

  const commitMatch = useCallback(
    (scanResult: ScanResult) => {
      if (matchedRef.current) return;
      matchedRef.current = true;
      confirmingRef.current = false;
      clearHintStale();
      setHint(null);
      setResult(scanResult);
      setState('matched');
      setPhase('idle');
      pauseLiveLoop();

      setCountdown(countdownSeconds);
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      onMatch?.(scanResult);
    },
    [clearHintStale, countdownSeconds, onMatch, pauseLiveLoop],
  );

  const applyHint = useCallback(
    (scanResult: ScanResult) => {
      if (matchedRef.current || confirmingRef.current) return;
      if (scanResult.confidence < hintConfidenceMin) return;
      setHint((prev) => {
        if (!prev) return scanResult;
        const same =
          prev.card_name.trim().toLowerCase() === scanResult.card_name.trim().toLowerCase();
        if (same || scanResult.confidence >= prev.confidence - 0.03) return scanResult;
        return prev;
      });
      scheduleHintStale();
    },
    [hintConfidenceMin, scheduleHintStale],
  );

  const trackStableHint = useCallback(
    (scanResult: ScanResult): boolean => {
      const key = scanResult.card_name.trim().toLowerCase();
      if (!key || scanResult.confidence < hintConfidenceMin) {
        stableNameRef.current = null;
        stableCountRef.current = 0;
        return false;
      }
      if (stableNameRef.current === key) stableCountRef.current += 1;
      else {
        stableNameRef.current = key;
        stableCountRef.current = 1;
      }
      return stableCountRef.current >= stableHintRequired;
    },
    [hintConfidenceMin, stableHintRequired],
  );

  const startLiveLoopRef = useRef<() => void>(() => {});

  const runConfirmScan = useCallback(async () => {
    if (matchedRef.current || confirmingRef.current) return;
    const now = Date.now();
    if (now - lastConfirmAtRef.current < CONFIRM_COOLDOWN_MS) return;
    lastConfirmAtRef.current = now;

    confirmingRef.current = true;
    pauseLiveLoop();
    setPhase('confirming');
    setState('processing');
    setDebug((d) => ({ ...d, phase: 'confirming', confirmsSent: d.confirmsSent + 1 }));

    syncBusy(inflightRef.current + 1);
    const blob = await captureFrame(CONFIRM_WIDTH, CONFIRM_JPEG_Q);

    if (!blob) {
      confirmingRef.current = false;
      syncBusy(Math.max(0, inflightRef.current - 1));
      stableCountRef.current = 0;
      startLiveLoopRef.current();
      return;
    }

    const { ok, data, elapsed, status } = await postScan(blob, 'full', confirmTimeoutMs);
    const method = String(data.method ?? 'none');
    const scanResult = parseScanResult(data, method, elapsed);
    const matched = Boolean(data.matched);

    setDebug((d) => ({
      ...d,
      lastStatus: ok ? String(status) : 'CONFIRM_ERROR',
      lastLatencyMs: Number(data.latency_ms ?? elapsed),
      lastError: ok ? null : String(data.error ?? ''),
      lastOutcome: matched ? 'matched' : 'not_matched',
      lastMethod: method,
      phase: 'live',
    }));

    syncBusy(Math.max(0, inflightRef.current - 1));
    confirmingRef.current = false;

    if (
      matched &&
      scanResult &&
      scanResult.confidence >= confidenceThreshold &&
      scanResult.search_url &&
      (method.includes('+orb') || scanResult.confidence >= 0.88)
    ) {
      commitMatch(scanResult);
      return;
    }

    stableCountRef.current = 0;
    stableNameRef.current = null;
    if (!matched) onNoMatch?.();
    startLiveLoopRef.current();
  }, [
    captureFrame,
    commitMatch,
    confidenceThreshold,
    confirmTimeoutMs,
    onNoMatch,
    pauseLiveLoop,
    postScan,
    syncBusy,
  ]);

  const sendLiveFrame = useCallback(async () => {
    if (matchedRef.current || confirmingRef.current) return;
    if (inflightRef.current >= maxInflight) return;

    syncBusy(inflightRef.current + 1);
    setDebug((d) => ({ ...d, framesSent: d.framesSent + 1, lastOutcome: 'pending', phase: 'live' }));

    const blob = await captureFrame(LIVE_WIDTH, LIVE_JPEG_Q);
    if (!blob) {
      syncBusy(Math.max(0, inflightRef.current - 1));
      return;
    }

    const { ok, data, elapsed, status } = await postScan(blob, 'auto', requestTimeoutMs);
    const method = String(data.method ?? 'none');

    setDebug((d) => ({
      ...d,
      lastStatus: ok ? String(status) : 'NETWORK_ERROR',
      lastLatencyMs: Number(data.latency_ms ?? elapsed),
      lastError: ok ? null : String(data.error ?? ''),
      lastOutcome: data.matched ? 'matched' : 'not_matched',
      lastMethod: method,
    }));

    syncBusy(Math.max(0, inflightRef.current - 1));

    if (!ok || matchedRef.current) {
      if (!matchedRef.current && !confirmingRef.current) setState('scanning');
      return;
    }

    const scanResult = parseScanResult(data, method, elapsed);
    const matched = Boolean(data.matched);
    const message = String(data.message ?? '');

    if (scanResult && (message === 'provisional' || !matched)) {
      applyHint(scanResult);
    }

    if (
      matched &&
      scanResult &&
      scanResult.search_url &&
      scanResult.confidence >= instantCommitThreshold &&
      isHighTrustMethod(method)
    ) {
      commitMatch(scanResult);
      return;
    }

    if (scanResult && trackStableHint(scanResult)) {
      void runConfirmScan();
      return;
    }

    if (!matched) onNoMatch?.();
    if (!matchedRef.current && !confirmingRef.current) setState('scanning');
  }, [
    applyHint,
    captureFrame,
    commitMatch,
    instantCommitThreshold,
    maxInflight,
    onNoMatch,
    postScan,
    requestTimeoutMs,
    runConfirmScan,
    syncBusy,
    trackStableHint,
  ]);

  const startLiveLoop = useCallback(() => {
    if (matchedRef.current || intervalRef.current) return;
    setPhase('live');
    setState('scanning');
    intervalRef.current = setInterval(() => {
      void sendLiveFrame();
    }, captureIntervalMs);
  }, [captureIntervalMs, sendLiveFrame]);

  startLiveLoopRef.current = startLiveLoop;

  const openCamera = useCallback(async () => {
    setState('requesting_camera');
    setErrorMessage(null);
    setResult(null);
    setHint(null);
    matchedRef.current = false;
    confirmingRef.current = false;
    stableNameRef.current = null;
    stableCountRef.current = 0;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
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
    startLiveLoop();
  }, [onError, startLiveLoop]);

  const restartScanning = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    clearHintStale();
    setCountdown(0);
    setResult(null);
    setHint(null);
    matchedRef.current = false;
    confirmingRef.current = false;
    stableNameRef.current = null;
    stableCountRef.current = 0;
    syncBusy(0);
    pauseLiveLoop();
    startLiveLoop();
  }, [clearHintStale, pauseLiveLoop, startLiveLoop, syncBusy]);

  return {
    state,
    phase,
    result,
    hint,
    isBusy,
    errorMessage,
    countdown,
    debug,
    videoRef,
    canvasRef,
    openCamera,
    stopScanning,
    restartScanning,
  };
}
