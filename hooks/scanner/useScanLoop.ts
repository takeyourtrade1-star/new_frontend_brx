'use client';

import { useCallback, useRef, useState } from 'react';

import { BALANCED, shouldRunOrbVerify } from '@/lib/scanner/balancedProfile';
import {
  ANALYSIS_HEIGHT,
  ANALYSIS_WIDTH,
  analyseFrame,
  CAPTURE_THRESHOLDS,
  frameDifference,
  getCardCropRect,
  type FrameSample,
} from '@/lib/scanner/capture-analysis';
import { captureFrame224, imageDataToTensor, vectorSearchJson } from '@/lib/scanner/preprocess';

import type { DebugInfo, ScannerState, ScanResult } from './scanner-types';

type CapturePhase = 'seeking' | 'stabilizing' | 'processing' | 'awaiting_removal';

interface VectorCandidate {
  meta_idx: number;
  card_name: string;
  set_name: string;
  set_code: string;
  image_uri: string | null;
  confidence: number;
  search_url?: string;
  search_query?: string;
  scryfall_id?: string;
  collector_number?: string;
  blueprint_id?: number;
}

function toRecognitionCandidate(candidate: VectorCandidate) {
  return {
    card_name: candidate.card_name,
    set_name: candidate.set_name,
    set_code: candidate.set_code,
    image_uri: candidate.image_uri ?? null,
    confidence: candidate.confidence,
    scryfall_id: candidate.scryfall_id,
    blueprint_id: candidate.blueprint_id,
    collector_number: candidate.collector_number,
  };
}

async function blobToBase64Strip(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function createCaptureId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildSearchUrl(cardName: string, setName: string): string {
  const query = [cardName, setName].filter(Boolean).join(' ');
  return `/search?q=${encodeURIComponent(query)}&game=mtg&category_key=singles`;
}

export interface UseScanLoopParams {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  runOnnxEmbed: (tensor: Float32Array) => Promise<Float32Array>;
  isTurboReady: () => boolean;
  onnxCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  onnxCtxRef: React.MutableRefObject<CanvasRenderingContext2D | null>;
  tensorBufferRef: React.MutableRefObject<Float32Array | null>;
  apiBaseUrl: string;
  scanMode: 'auto' | 'fast' | 'full';
  requestTimeoutMs: number;
  voteWindow: number;
  voteRequired: number;
  maxInflight: number;
  captureIntervalMs: number;
  countdownSeconds: number;
  effectiveConf: number;
  effectiveHint: number;
  continuous: boolean;
  onMatch?: (result: ScanResult) => void;
  onNoMatch?: () => void;
  setScannerState: (state: ScannerState) => void;
}

export interface UseScanLoopReturn {
  result: ScanResult | null;
  hint: ScanResult | null;
  isBusy: boolean;
  countdown: number;
  debug: DebugInfo;
  beginScan: () => void;
  startScanLoop: () => void;
  stopLoop: () => void;
  restartScan: () => void;
  captureNow: () => void;
  isLoopActive: () => boolean;
}

export function useScanLoop({
  videoRef,
  canvasRef,
  runOnnxEmbed,
  isTurboReady,
  onnxCanvasRef,
  onnxCtxRef,
  tensorBufferRef,
  apiBaseUrl,
  scanMode,
  requestTimeoutMs,
  maxInflight,
  effectiveConf,
  continuous,
  onMatch,
  onNoMatch,
  setScannerState,
}: UseScanLoopParams): UseScanLoopReturn {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [hint, setHint] = useState<ScanResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [debug, setDebug] = useState<DebugInfo>({
    framesSent: 0,
    lastStatus: null,
    lastLatencyMs: -1,
    lastError: null,
    lastOutcome: null,
    lastMethod: null,
  });

  const activeRef = useRef(false);
  const phaseRef = useRef<CapturePhase>('seeking');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const capturedFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllersRef = useRef<Set<AbortController>>(new Set());
  const inflightRef = useRef(0);
  const latestCaptureIdRef = useRef<string | null>(null);
  const previousSampleRef = useRef<FrameSample | null>(null);
  const capturedPixelsRef = useRef<Uint8Array | null>(null);
  const stableFramesRef = useRef(0);
  const removalFramesRef = useRef(0);
  const captureAtRef = useRef(0);
  const manualCaptureRef = useRef(false);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const analysisContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const captureCountRef = useRef(0);
  const verifyCountRef = useRef(0);
  const onMatchRef = useRef(onMatch);
  const onNoMatchRef = useRef(onNoMatch);
  onMatchRef.current = onMatch;
  onNoMatchRef.current = onNoMatch;

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const schedule = useCallback((callback: () => void) => {
    clearTimer();
    timerRef.current = setTimeout(callback, CAPTURE_THRESHOLDS.tickMs);
  }, [clearTimer]);

  const captureAnalysisSample = useCallback((): FrameSample | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return null;
    if (!analysisCanvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = ANALYSIS_WIDTH;
      canvas.height = ANALYSIS_HEIGHT;
      analysisCanvasRef.current = canvas;
      analysisContextRef.current = canvas.getContext('2d', {
        alpha: false,
        desynchronized: true,
        willReadFrequently: true,
      });
    }
    const context = analysisContextRef.current;
    if (!context) return null;
    const rect = getCardCropRect(
      video.videoWidth,
      video.videoHeight,
      video.clientWidth,
      video.clientHeight,
    );
    context.drawImage(
      video,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      ANALYSIS_WIDTH,
      ANALYSIS_HEIGHT,
    );
    return analyseFrame(context.getImageData(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT));
  }, [videoRef]);

  const captureCardBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        resolve(null);
        return;
      }
      const rect = getCardCropRect(
        video.videoWidth,
        video.videoHeight,
        video.clientWidth,
        video.clientHeight,
      );
      const width = 448;
      const height = Math.round(width * 7 / 5);
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) {
        resolve(null);
        return;
      }
      context.drawImage(video, rect.x, rect.y, rect.width, rect.height, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.78);
    });
  }, [canvasRef, videoRef]);

  const fetchWithTimeout = useCallback(async (url: string, init: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    abortControllersRef.current.add(controller);
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
    } finally {
      clearTimeout(timeout);
      abortControllersRef.current.delete(controller);
    }
  }, [requestTimeoutMs]);

  const recognizeWithVector = useCallback(async (
    captureId: string,
    captureBlobPromise: Promise<Blob | null>,
  ): Promise<ScanResult | null> => {
    const video = videoRef.current;
    const onnxCanvas = onnxCanvasRef.current;
    const context = onnxCtxRef.current;
    const tensorBuffer = tensorBufferRef.current;
    if (!video || !onnxCanvas || !context || !tensorBuffer) return null;
    const imageData = captureFrame224(video, onnxCanvas, context);
    if (!imageData) return null;
    imageDataToTensor(imageData, tensorBuffer);
    const vector = await runOnnxEmbed(tensorBuffer.slice());
    const response = await fetchWithTimeout(`${apiBaseUrl}/search-vector`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Request-ID': captureId },
      body: vectorSearchJson(vector, BALANCED.searchTopK),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { candidates?: VectorCandidate[]; latency_ms?: number };
    const candidates = data.candidates ?? [];
    if (candidates.length === 0) return null;
    const top1 = candidates[0];
    const top2 = candidates[1];
    const margin = top2 ? top1.confidence - top2.confidence : 1;
    let confidence = top1.confidence;
    let method = 'edge+faiss';

    const canUseVerifyBudget =
      captureCountRef.current >= 7 &&
      (verifyCountRef.current + 1) / captureCountRef.current <= 0.15;
    if (canUseVerifyBudget && shouldRunOrbVerify(margin, top1.confidence)) {
      const crop = await captureBlobPromise;
      if (crop) {
        try {
          verifyCountRef.current++;
          const verifyResponse = await fetchWithTimeout(`${apiBaseUrl}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Request-ID': captureId },
            body: JSON.stringify({
              meta_idx: top1.meta_idx,
              image_b64: await blobToBase64Strip(crop),
            }),
          });
          if (verifyResponse.ok) {
            const verify = (await verifyResponse.json()) as { verified?: boolean; confidence?: number };
            if (verify.verified) {
              confidence = Math.max(confidence, verify.confidence ?? 0);
              method = 'edge+faiss+orb';
            }
          }
        } catch {
          // La verifica è opzionale: il candidato FAISS resta disponibile.
        }
      }
    }

    return {
      capture_id: captureId,
      card_name: top1.card_name,
      set_name: top1.set_name,
      set_code: top1.set_code,
      image_uri: top1.image_uri ?? null,
      confidence,
      method,
      search_url: top1.search_url || buildSearchUrl(top1.card_name, top1.set_name),
      search_query: top1.search_query || `${top1.card_name} ${top1.set_name}`.trim(),
      latency_ms: data.latency_ms ?? 0,
      scryfall_id: top1.scryfall_id,
      blueprint_id: top1.blueprint_id,
      collector_number: top1.collector_number,
      candidates: candidates.slice(0, BALANCED.searchTopK).map(toRecognitionCandidate),
    };
  }, [
    apiBaseUrl,
    fetchWithTimeout,
    onnxCanvasRef,
    onnxCtxRef,
    runOnnxEmbed,
    tensorBufferRef,
    videoRef,
  ]);

  const recognizeWithServer = useCallback(async (
    captureId: string,
    blob: Blob | null,
  ): Promise<ScanResult | null> => {
    if (!blob) return null;
    const formData = new FormData();
    formData.append('image', blob, 'card.jpg');
    const response = await fetchWithTimeout(
      `${apiBaseUrl}/scan?mode=${encodeURIComponent(scanMode)}`,
      { method: 'POST', body: formData, headers: { 'X-Request-ID': captureId } },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as Record<string, unknown>;
    if (typeof data.card_name !== 'string' || !data.card_name) return null;
    const setName = typeof data.set_name === 'string' ? data.set_name : '';
    const alternatives = Array.isArray(data.alternatives)
      ? data.alternatives.filter((value): value is VectorCandidate => {
          if (!value || typeof value !== 'object') return false;
          const candidate = value as Partial<VectorCandidate>;
          return (
            typeof candidate.card_name === 'string' &&
            typeof candidate.set_name === 'string' &&
            typeof candidate.set_code === 'string' &&
            typeof candidate.confidence === 'number'
          );
        })
      : [];
    return {
      capture_id: captureId,
      card_name: data.card_name,
      set_name: setName,
      set_code: typeof data.set_code === 'string' ? data.set_code : '',
      image_uri: typeof data.image_uri === 'string' ? data.image_uri : null,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0,
      method: typeof data.method === 'string' ? data.method : 'server',
      search_url:
        typeof data.search_url === 'string' && data.search_url
          ? data.search_url
          : buildSearchUrl(data.card_name, setName),
      search_query:
        typeof data.search_query === 'string' ? data.search_query : `${data.card_name} ${setName}`.trim(),
      latency_ms: typeof data.latency_ms === 'number' ? data.latency_ms : 0,
      scryfall_id: typeof data.scryfall_id === 'string' ? data.scryfall_id : undefined,
      collector_number:
        typeof data.collector_number === 'string' ? data.collector_number : undefined,
      candidates: alternatives.slice(0, BALANCED.searchTopK).map(toRecognitionCandidate),
    };
  }, [apiBaseUrl, fetchWithTimeout, scanMode]);

  const finishCapture = useCallback((sample: FrameSample) => {
    capturedPixelsRef.current = sample.grayscale.slice();
    captureAtRef.current = Date.now();
    stableFramesRef.current = 0;
    removalFramesRef.current = 0;
    manualCaptureRef.current = false;
    phaseRef.current = 'awaiting_removal';
  }, []);

  const recognize = useCallback(async (sample: FrameSample) => {
    if (!activeRef.current || inflightRef.current >= maxInflight) return;
    const captureId = createCaptureId();
    const capturedAtMs = Date.now();
    latestCaptureIdRef.current = captureId;
    if (continuous) {
      // Blocca subito il fotogramma e lascia il loop libero di rilevare la rimozione:
      // embedding e ricerca proseguono senza fermare la carta successiva.
      finishCapture(sample);
      setScannerState('awaiting_removal');
    } else {
      phaseRef.current = 'processing';
      setScannerState('processing');
    }
    inflightRef.current++;
    setIsBusy(true);
    setHint(null);
    const startedAt = performance.now();
    let holdMatchedResult = false;
    captureCountRef.current++;
    setDebug((current) => ({
      ...current,
      framesSent: current.framesSent + 1,
      lastOutcome: 'pending',
      lastError: null,
    }));

    try {
      // La compressione del crop procede in parallelo al riconoscimento edge.
      // Il Blob resta locale e viene usato anche per il fallback server, senza duplicare il lavoro.
      const captureBlobPromise = captureCardBlob();
      const scanResult = isTurboReady()
        ? await recognizeWithVector(captureId, captureBlobPromise)
        : await recognizeWithServer(captureId, await captureBlobPromise);
      if (!activeRef.current) return;
      const elapsed = Math.round(performance.now() - startedAt);
      if (scanResult) {
        const captureBlob = await captureBlobPromise;
        if (captureBlob) scanResult.capture_blob = captureBlob;
        scanResult.captured_at_ms = capturedAtMs;
        const outcome = scanResult.confidence >= effectiveConf ? 'matched' : 'not_matched';
        const isLatestCapture = latestCaptureIdRef.current === captureId;
        const shouldShowCapture = isLatestCapture && (
          !continuous || phaseRef.current === 'awaiting_removal'
        );
        if (shouldShowCapture) setResult(scanResult);
        setDebug((current) => ({
          ...current,
          lastStatus: '200',
          lastLatencyMs: scanResult.latency_ms || elapsed,
          lastError: null,
          lastOutcome: outcome,
          lastMethod: scanResult.method,
        }));
        onMatchRef.current?.(scanResult);
        if (shouldShowCapture) setScannerState('matched');
        holdMatchedResult = !continuous;
        if (continuous && shouldShowCapture) {
          if (capturedFlashRef.current) clearTimeout(capturedFlashRef.current);
          capturedFlashRef.current = setTimeout(() => {
            if (activeRef.current && phaseRef.current === 'awaiting_removal') {
              setScannerState('awaiting_removal');
            }
          }, 350);
        }
      } else {
        const isLatestCapture = latestCaptureIdRef.current === captureId;
        const shouldShowCapture = isLatestCapture && (
          !continuous || phaseRef.current === 'awaiting_removal'
        );
        setDebug((current) => ({
          ...current,
          lastStatus: '200',
          lastLatencyMs: elapsed,
          lastError: null,
          lastOutcome: 'not_matched',
          lastMethod: isTurboReady() ? 'edge+faiss' : 'server',
        }));
        onNoMatchRef.current?.();
        if (shouldShowCapture) setScannerState('awaiting_removal');
      }
    } catch (error) {
      if (!activeRef.current) return;
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setDebug((current) => ({
        ...current,
        lastStatus: aborted ? 'TIMEOUT' : 'ERROR',
        lastLatencyMs: Math.round(performance.now() - startedAt),
        lastError: aborted ? `TIMEOUT dopo ${requestTimeoutMs}ms` : String(error),
        lastOutcome: 'not_matched',
        lastMethod: null,
      }));
      onNoMatchRef.current?.();
      if (
        latestCaptureIdRef.current === captureId &&
        (!continuous || phaseRef.current === 'awaiting_removal')
      ) {
        setScannerState('awaiting_removal');
      }
    } finally {
      inflightRef.current = Math.max(0, inflightRef.current - 1);
      if (activeRef.current) {
        if (continuous) {
          setIsBusy(inflightRef.current > 0);
        } else if (holdMatchedResult) {
          setIsBusy(false);
          activeRef.current = false;
          clearTimer();
        } else {
          finishCapture(sample);
          setIsBusy(false);
        }
      }
    }
  }, [
    clearTimer,
    captureCardBlob,
    continuous,
    effectiveConf,
    finishCapture,
    isTurboReady,
    maxInflight,
    recognizeWithServer,
    recognizeWithVector,
    requestTimeoutMs,
    setScannerState,
  ]);

  const tickRef = useRef<() => void>(() => {});
  tickRef.current = () => {
    if (!activeRef.current) return;
    const sample = captureAnalysisSample();
    if (!sample) {
      schedule(() => tickRef.current());
      return;
    }

    const previous = previousSampleRef.current;
    const motion = previous ? frameDifference(sample.grayscale, previous.grayscale) : 0;
    previousSampleRef.current = sample;

    if (phaseRef.current === 'seeking') {
      setScannerState('scanning');
      if (manualCaptureRef.current || (previous && motion >= CAPTURE_THRESHOLDS.enterMotion)) {
        phaseRef.current = 'stabilizing';
        stableFramesRef.current = 0;
        setScannerState('stabilizing');
      }
    } else if (phaseRef.current === 'stabilizing') {
      if (manualCaptureRef.current) {
        if (continuous) {
          void recognize(sample);
          schedule(() => tickRef.current());
        } else {
          void recognize(sample).finally(() => schedule(() => tickRef.current()));
        }
        return;
      }
      if (sample.quality.usable && motion <= CAPTURE_THRESHOLDS.stableMotion) {
        stableFramesRef.current++;
      } else {
        stableFramesRef.current = 0;
      }
      if (stableFramesRef.current >= CAPTURE_THRESHOLDS.stableFrames) {
        if (continuous) {
          void recognize(sample);
          schedule(() => tickRef.current());
        } else {
          void recognize(sample).finally(() => schedule(() => tickRef.current()));
        }
        return;
      }
    } else if (phaseRef.current === 'awaiting_removal') {
      const captured = capturedPixelsRef.current;
      const changed = captured ? frameDifference(sample.grayscale, captured) : 1;
      if (
        Date.now() - captureAtRef.current >= CAPTURE_THRESHOLDS.minimumCaptureGapMs &&
        changed >= CAPTURE_THRESHOLDS.removalDifference
      ) {
        removalFramesRef.current++;
      } else {
        removalFramesRef.current = 0;
      }
      if (removalFramesRef.current >= CAPTURE_THRESHOLDS.removalFrames) {
        phaseRef.current = 'seeking';
        capturedPixelsRef.current = null;
        previousSampleRef.current = sample;
        removalFramesRef.current = 0;
        setResult(null);
        setScannerState('scanning');
      }
    }

    schedule(() => tickRef.current());
  };

  const resetCaptureState = useCallback(() => {
    phaseRef.current = 'seeking';
    previousSampleRef.current = null;
    capturedPixelsRef.current = null;
    stableFramesRef.current = 0;
    removalFramesRef.current = 0;
    manualCaptureRef.current = false;
    setResult(null);
    setHint(null);
    setIsBusy(false);
  }, []);

  const beginScan = useCallback(() => {
    resetCaptureState();
    setDebug({
      framesSent: 0,
      lastStatus: null,
      lastLatencyMs: -1,
      lastError: null,
      lastOutcome: null,
      lastMethod: null,
    });
  }, [resetCaptureState]);

  const startScanLoop = useCallback(() => {
    clearTimer();
    activeRef.current = true;
    schedule(() => tickRef.current());
  }, [clearTimer, schedule]);

  const stopLoop = useCallback(() => {
    activeRef.current = false;
    clearTimer();
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current.clear();
    inflightRef.current = 0;
    latestCaptureIdRef.current = null;
    if (capturedFlashRef.current) clearTimeout(capturedFlashRef.current);
    capturedFlashRef.current = null;
    resetCaptureState();
  }, [clearTimer, resetCaptureState]);

  const restartScan = useCallback(() => {
    resetCaptureState();
    if (activeRef.current) schedule(() => tickRef.current());
  }, [resetCaptureState, schedule]);

  const captureNow = useCallback(() => {
    if (!activeRef.current || phaseRef.current === 'processing') return;
    if (phaseRef.current === 'awaiting_removal') return;
    manualCaptureRef.current = true;
    phaseRef.current = 'stabilizing';
    setScannerState('stabilizing');
  }, [setScannerState]);

  const isLoopActive = useCallback(() => activeRef.current, []);

  return {
    result,
    hint,
    isBusy,
    countdown: 0,
    debug,
    beginScan,
    startScanLoop,
    stopLoop,
    restartScan,
    captureNow,
    isLoopActive,
  };
}
