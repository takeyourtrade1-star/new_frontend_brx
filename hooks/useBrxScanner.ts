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
  /** Hint shown on screen before full match commit (default 0.68). */
  hintConfidenceMin?: number;
  captureIntervalMs?: number;
  apiBaseUrl?: string;
  countdownSeconds?: number;
  requestTimeoutMs?: number;
  /** fast = CNN only (live scan); auto = server may skip ORB when confident. */
  scanMode?: 'auto' | 'fast' | 'full';
  voteWindow?: number;
  voteRequired?: number;
  maxInflight?: number;
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
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  openCamera: () => Promise<void>;
  stopScanning: () => void;
  restartScanning: () => void;
}

const HINT_STALE_MS = 1200;

export function useBrxScanner(options: UseBrxScannerOptions = {}): UseBrxScannerReturn {
  const {
    onMatch,
    onNoMatch,
    onError,
    confidenceThreshold = 0.78,
    hintConfidenceMin = 0.68,
    captureIntervalMs = 320,
    apiBaseUrl = '/brx-match',
    countdownSeconds = 3,
    requestTimeoutMs = 4500,
    scanMode = 'fast',
    voteWindow = 3,
    voteRequired = 2,
    maxInflight = 3,
  } = options;

  const [state, setState] = useState<ScannerState>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [hint, setHint] = useState<ScanResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [debug, setDebug] = useState<DebugInfo>({
    framesSent: 0,
    lastStatus: null,
    lastLatencyMs: -1,
    lastError: null,
    lastOutcome: null,
    lastMethod: null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inflightRef = useRef(0);
  const recentNamesRef = useRef<string[]>([]);
  const matchedRef = useRef(false);
  const hintStaleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (!matchedRef.current) setHint(null);
    }, HINT_STALE_MS);
  }, [clearHintStale]);

  const stopScanning = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    clearHintStale();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    syncBusy(0);
    matchedRef.current = false;
    recentNamesRef.current = [];
    setHint(null);
    setCountdown(0);
    setState('idle');
  }, [clearHintStale, syncBusy]);

  useEffect(() => () => stopScanning(), [stopScanning]);

  const captureFrame = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        resolve(null);
        return;
      }

      const W = 384;
      const H = Math.round(W * (video.videoHeight / Math.max(video.videoWidth, 1)));
      canvas.width = W;
      canvas.height = H;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

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

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

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
    [clearHintStale, countdownSeconds, onMatch],
  );

  const applyHint = useCallback(
    (scanResult: ScanResult) => {
      if (matchedRef.current) return;
      if (scanResult.confidence < hintConfidenceMin) return;
      setHint(scanResult);
      scheduleHintStale();
    },
    [hintConfidenceMin, scheduleHintStale],
  );

  const recordVote = useCallback(
    (name: string, scanResult: ScanResult) => {
      const key = name.trim().toLowerCase();
      if (!key) return;
      const buf = recentNamesRef.current;
      buf.push(key);
      while (buf.length > voteWindow) buf.shift();
      const hits = buf.filter((n) => n === key).length;
      if (hits >= voteRequired && scanResult.confidence >= confidenceThreshold * 0.85) {
        commitMatch(scanResult);
      }
    },
    [commitMatch, confidenceThreshold, voteRequired, voteWindow],
  );

  const sendFrame = useCallback(async (): Promise<void> => {
    if (matchedRef.current) return;
    if (inflightRef.current >= maxInflight) return;

    syncBusy(inflightRef.current + 1);

    const blob = await captureFrame();
    if (!blob) {
      syncBusy(Math.max(0, inflightRef.current - 1));
      return;
    }

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

      if (scanResult) {
        applyHint(scanResult);
      }

      if (data.matched && scanResult && scanResult.confidence >= confidenceThreshold && scanResult.search_url) {
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
        : err instanceof Error
          ? err.message
          : 'Unknown error';

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
      if (!matchedRef.current) {
        setState('scanning');
      }
    }
  }, [
    apiBaseUrl,
    applyHint,
    captureFrame,
    commitMatch,
    confidenceThreshold,
    maxInflight,
    onNoMatch,
    recordVote,
    requestTimeoutMs,
    scanMode,
    syncBusy,
  ]);

  const openCamera = useCallback(async (): Promise<void> => {
    setState('requesting_camera');
    setErrorMessage(null);
    setResult(null);
    setHint(null);
    matchedRef.current = false;
    recentNamesRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
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

    intervalRef.current = setInterval(() => {
      void sendFrame();
    }, captureIntervalMs);
  }, [captureIntervalMs, onError, sendFrame]);

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
    recentNamesRef.current = [];
    syncBusy(0);
    setState('scanning');

    if (streamRef.current && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        void sendFrame();
      }, captureIntervalMs);
    }
  }, [captureIntervalMs, clearHintStale, sendFrame, syncBusy]);

  return {
    state,
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
