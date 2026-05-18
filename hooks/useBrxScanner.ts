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
  method: 'phash' | 'cnn' | 'none';
  search_url: string;
  search_query: string;
  latency_ms: number;
}

export interface UseBrxScannerOptions {
  /** Called when a card is matched and confidence >= threshold. */
  onMatch?: (result: ScanResult) => void;
  /** Called when a frame is analysed but no card is matched. */
  onNoMatch?: () => void;
  /** Called on unrecoverable error. */
  onError?: (message: string) => void;
  /** Confidence threshold above which onMatch is fired (default 0.85). */
  confidenceThreshold?: number;
  /** Interval between frame submissions in ms (default 1000). */
  captureIntervalMs?: number;
  /** Base URL of the brx-match API (default: /brx-match). */
  apiBaseUrl?: string;
  /** Seconds to count down after a match before auto-redirect (default 3). */
  countdownSeconds?: number;
  /** Per-request timeout in ms (default 6000). Hangs return as a timeout error. */
  requestTimeoutMs?: number;
}

export interface DebugInfo {
  /** Number of frames sent so far. */
  framesSent: number;
  /** Last HTTP status, "TIMEOUT", "NETWORK_ERROR", or null. */
  lastStatus: string | null;
  /** Round-trip time of the last request in ms (-1 if no request yet). */
  lastLatencyMs: number;
  /** Last error message, if any. */
  lastError: string | null;
  /** matched / not_matched / pending */
  lastOutcome: 'matched' | 'not_matched' | 'pending' | null;
}

export interface UseBrxScannerReturn {
  state: ScannerState;
  result: ScanResult | null;
  errorMessage: string | null;
  /** Countdown seconds remaining after a match (counts down from countdownSeconds). */
  countdown: number;
  /** Live diagnostics (for in-app debug overlay on mobile). */
  debug: DebugInfo;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  openCamera: () => Promise<void>;
  stopScanning: () => void;
  /** Dismiss current match and resume scanning (for "Not this card" flow). */
  restartScanning: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBrxScanner(options: UseBrxScannerOptions = {}): UseBrxScannerReturn {
  const {
    onMatch,
    onNoMatch,
    onError,
    confidenceThreshold = 0.85,
    captureIntervalMs = 1000,
    apiBaseUrl = '/brx-match',
    countdownSeconds = 3,
    requestTimeoutMs = 6000,
  } = options;

  const [state, setState] = useState<ScannerState>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [debug, setDebug] = useState<DebugInfo>({
    framesSent: 0,
    lastStatus: null,
    lastLatencyMs: -1,
    lastError: null,
    lastOutcome: null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);
  const sessionRef = useRef(0);

  // ------------------------------------------------------------------
  // Cleanup
  // ------------------------------------------------------------------

  const stopScanning = useCallback(() => {
    sessionRef.current += 1;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    processingRef.current = false;
    setCountdown(0);
    setState('idle');
  }, []);

  useEffect(() => () => stopScanning(), [stopScanning]);

  // ------------------------------------------------------------------
  // Frame capture → JPEG Blob (async toBlob: ~2-3x più veloce di toDataURL+atob)
  // ------------------------------------------------------------------

  const captureFrame = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        resolve(null);
        return;
      }

      const W = 640;
      const H = Math.round(W * (video.videoHeight / Math.max(video.videoWidth, 1)));
      canvas.width = W;
      canvas.height = H;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(video, 0, 0, W, H);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.78);
    });
  }, []);

  // ------------------------------------------------------------------
  // Send frame to brx-match API
  // ------------------------------------------------------------------

  const sendFrame = useCallback(async (): Promise<void> => {
    if (processingRef.current) return;
    processingRef.current = true;
    setState('processing');

    const blob = await captureFrame();
    if (!blob) {
      processingRef.current = false;
      setState('scanning');
      return;
    }

    const formData = new FormData();
    formData.append('image', blob, 'frame.jpg');

    const t0 = performance.now();
    setDebug((d) => ({ ...d, framesSent: d.framesSent + 1, lastOutcome: 'pending' }));

    // AbortController per evitare fetch appese all'infinito (es. SG/firewall che droppa)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const resp = await fetch(`${apiBaseUrl}/scan`, {
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
        }));
        setState('scanning');
        return;
      }

      const data = await resp.json();
      setDebug((d) => ({
        ...d,
        lastStatus: String(resp.status),
        lastLatencyMs: elapsed,
        lastError: null,
        lastOutcome: data.matched ? 'matched' : 'not_matched',
      }));

      if (data.matched && data.confidence >= confidenceThreshold && data.search_url) {
        const scanResult: ScanResult = {
          card_name: data.card_name ?? '',
          set_name: data.set_name ?? '',
          set_code: data.set_code ?? '',
          image_uri: data.image_uri ?? null,
          confidence: data.confidence,
          method: data.method,
          search_url: data.search_url,
          search_query: data.search_query ?? '',
          latency_ms: data.latency_ms,
        };
        setResult(scanResult);
        setState('matched');

        // Stop the capture loop — we have a winner
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // Start countdown
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
      } else {
        setState('scanning');
        if (!data.matched) onNoMatch?.();
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
      }));

      console.warn('[useBrxScanner] sendFrame error:', msg);
      setState('scanning');
    } finally {
      processingRef.current = false;
    }
  }, [apiBaseUrl, captureFrame, confidenceThreshold, onMatch, onNoMatch, requestTimeoutMs]);

  // ------------------------------------------------------------------
  // Open camera
  // ------------------------------------------------------------------

  const openCamera = useCallback(async (): Promise<void> => {
    const sessionId = sessionRef.current + 1;
    sessionRef.current = sessionId;
    const isCurrentSession = () => sessionRef.current === sessionId;

    setState('requesting_camera');
    setErrorMessage(null);
    setResult(null);

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
      if (!isCurrentSession()) return;

      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : 'Could not access camera.';
      setErrorMessage(msg);
      setState('error');
      onError?.(msg);
      return;
    }

    if (!isCurrentSession()) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }

    if (!isCurrentSession()) {
      if (streamRef.current === stream) {
        streamRef.current = null;
        stream.getTracks().forEach((t) => t.stop());
      }
      if (videoRef.current?.srcObject === stream) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    setState('scanning');

    // Start periodic frame submission
    intervalRef.current = setInterval(() => {
      sendFrame();
    }, captureIntervalMs);
  }, [captureIntervalMs, onError, sendFrame]);

  /** Dismiss the current match result and resume the scanning loop. */
  const restartScanning = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(0);
    setResult(null);
    setState('scanning');
    processingRef.current = false;

    // Re-start capture interval if stream is alive
    if (streamRef.current && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        sendFrame();
      }, captureIntervalMs);
    }
  }, [captureIntervalMs, sendFrame]);

  return {
    state,
    result,
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
