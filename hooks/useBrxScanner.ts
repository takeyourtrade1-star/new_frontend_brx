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
  /** Interval between frame submissions in ms (default 800). */
  captureIntervalMs?: number;
  /** Base URL of the brx-match API (default: /brx-match). */
  apiBaseUrl?: string;
}

export interface UseBrxScannerReturn {
  state: ScannerState;
  result: ScanResult | null;
  errorMessage: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  openCamera: () => Promise<void>;
  stopScanning: () => void;
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
    captureIntervalMs = 800,
    apiBaseUrl = '/brx-match',
  } = options;

  const [state, setState] = useState<ScannerState>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);

  // ------------------------------------------------------------------
  // Cleanup
  // ------------------------------------------------------------------

  const stopScanning = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    processingRef.current = false;
    setState('idle');
  }, []);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  // ------------------------------------------------------------------
  // Frame capture → JPEG bytes
  // ------------------------------------------------------------------

  const captureFrame = useCallback((): Blob | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    const W = 640;
    const H = Math.round(W * (video.videoHeight / Math.max(video.videoWidth, 1)));
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, W, H);

    // Synchronous toBlob is not available — we use toDataURL and convert
    const dataURL = canvas.toDataURL('image/jpeg', 0.82);
    const byteString = atob(dataURL.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
  }, []);

  // ------------------------------------------------------------------
  // Send frame to brx-match API
  // ------------------------------------------------------------------

  const sendFrame = useCallback(async (): Promise<void> => {
    if (processingRef.current) return;
    processingRef.current = true;
    setState('processing');

    const blob = captureFrame();
    if (!blob) {
      processingRef.current = false;
      setState('scanning');
      return;
    }

    const formData = new FormData();
    formData.append('image', blob, 'frame.jpg');

    try {
      const resp = await fetch(`${apiBaseUrl}/scan`, {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        throw new Error(`Server error: ${resp.status}`);
      }

      const data = await resp.json();

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

        onMatch?.(scanResult);
      } else {
        setState('scanning');
        if (!data.matched) onNoMatch?.();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      // Non-fatal: log and keep scanning
      console.warn('[useBrxScanner] sendFrame error:', msg);
      setState('scanning');
    } finally {
      processingRef.current = false;
    }
  }, [apiBaseUrl, captureFrame, confidenceThreshold, onMatch, onNoMatch]);

  // ------------------------------------------------------------------
  // Open camera
  // ------------------------------------------------------------------

  const openCamera = useCallback(async (): Promise<void> => {
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

    // Start periodic frame submission
    intervalRef.current = setInterval(() => {
      sendFrame();
    }, captureIntervalMs);
  }, [captureIntervalMs, onError, sendFrame]);

  return {
    state,
    result,
    errorMessage,
    videoRef,
    canvasRef,
    openCamera,
    stopScanning,
  };
}
