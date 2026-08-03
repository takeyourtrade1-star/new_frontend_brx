'use client';

import { useCallback, useRef, useState } from 'react';

import {
  BALANCED,
  hintStreakRequired,
  shouldCommitTurboMatch,
  shouldRunOrbVerify,
} from '@/lib/scanner/balancedProfile';
import {
  advanceAutoCapture,
  ANALYSIS_HEIGHT,
  ANALYSIS_WIDTH,
  analyseFrame,
  CAPTURE_THRESHOLDS,
  createAutoCaptureState,
  exposureInvariantFrameDifference,
  frameDifference,
  getCardCropRect,
  type AutoCaptureState,
  type FrameSample,
} from '@/lib/scanner/capture-analysis';
import { captureFrame224, imageDataToTensor, vectorSearchJson } from '@/lib/scanner/preprocess';
import {
  parseScannerServerTiming,
  type ScannerServerTimings,
} from '@/lib/scanner/server-timing';
import { createSecureRandomUuid } from '@/lib/security/secure-random-id';

import type { DebugInfo, ScannerState, ScanResult } from './scanner-types';

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

interface RecognitionOutcome {
  result: ScanResult;
  margin: number;
  authoritative: boolean;
  serverTimings: ScannerServerTimings;
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
  return createSecureRandomUuid();
}

function buildSearchUrl(cardName: string, setName: string): string {
  const query = [cardName, setName].filter(Boolean).join(' ');
  return `/search?q=${encodeURIComponent(query)}&game=mtg&category_key=singles`;
}

function recognitionKey(result: ScanResult): string {
  if (result.scryfall_id) return `scryfall:${result.scryfall_id}`;
  if (result.blueprint_id !== undefined) return `blueprint:${result.blueprint_id}`;
  return [
    result.card_name.trim().toLowerCase(),
    result.set_code.trim().toLowerCase(),
    result.collector_number?.trim().toLowerCase() ?? '',
  ].join(':');
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
  voteWindow,
  voteRequired,
  maxInflight,
  captureIntervalMs,
  effectiveConf,
  effectiveHint,
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
    lastBackendLatencyMs: -1,
    lastBffLatencyMs: -1,
    lastEncodeLatencyMs: -1,
    lastError: null,
    lastOutcome: null,
    lastMethod: null,
  });

  const activeRef = useRef(false);
  const captureStateRef = useRef<AutoCaptureState>(createAutoCaptureState());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const capturedFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintStaleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllersRef = useRef<Set<AbortController>>(new Set());
  const inflightRef = useRef(0);
  const cardEpochRef = useRef(0);
  const latestCaptureIdRef = useRef<string | null>(null);
  const previousSampleRef = useRef<FrameSample | null>(null);
  const capturedPixelsRef = useRef<Uint8Array | null>(null);
  const manualCaptureRef = useRef(false);
  const recentNamesRef = useRef<string[]>([]);
  const hintStreakRef = useRef<{ name: string; count: number }>({ name: '', count: 0 });
  const lastHintKeyRef = useRef('');
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

  const schedule = useCallback((
    callback: () => void,
    delayMs: number = CAPTURE_THRESHOLDS.tickMs,
  ) => {
    clearTimer();
    timerRef.current = setTimeout(callback, delayMs);
  }, [clearTimer]);

  const clearHintStale = useCallback(() => {
    if (hintStaleRef.current) clearTimeout(hintStaleRef.current);
    hintStaleRef.current = null;
  }, []);

  const clearRecognitionState = useCallback(() => {
    clearHintStale();
    recentNamesRef.current = [];
    hintStreakRef.current = { name: '', count: 0 };
    lastHintKeyRef.current = '';
    setHint(null);
  }, [clearHintStale]);

  const applyHint = useCallback((scanResult: ScanResult) => {
    const key = scanResult.card_name.trim().toLocaleLowerCase();
    if (!key || scanResult.confidence < effectiveHint) return;
    if (hintStreakRef.current.name === key) {
      hintStreakRef.current.count++;
    } else {
      hintStreakRef.current = { name: key, count: 1 };
    }
    if (hintStreakRef.current.count < hintStreakRequired(scanResult.confidence)) return;

    const hintKey = `${key}:${Math.round(scanResult.confidence * 100)}`;
    if (hintKey !== lastHintKeyRef.current) {
      lastHintKeyRef.current = hintKey;
      setHint(scanResult);
    }
    clearHintStale();
    hintStaleRef.current = setTimeout(() => setHint(null), BALANCED.hintStaleMs);
  }, [clearHintStale, effectiveHint]);

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
      // 384 px mantiene testo/set leggibili per il matcher ma riduce il
      // payload di circa il 20–25% rispetto al vecchio crop da 448 px.
      const width = 384;
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
  ): Promise<RecognitionOutcome | null> => {
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
    const serverTimings = parseScannerServerTiming(
      response.headers.get('server-timing'),
    );
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
      margin,
      authoritative: false,
      serverTimings,
      result: {
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
      },
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
  ): Promise<RecognitionOutcome | null> => {
    if (!blob) return null;
    const formData = new FormData();
    formData.append('image', blob, 'card.jpg');
    const response = await fetchWithTimeout(
      `${apiBaseUrl}/scan?mode=${encodeURIComponent(scanMode)}`,
      { method: 'POST', body: formData, headers: { 'X-Request-ID': captureId } },
    );
    const serverTimings = parseScannerServerTiming(
      response.headers.get('server-timing'),
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
    const confidence = typeof data.confidence === 'number' ? data.confidence : 0;
    const runnerUp = alternatives.find((candidate) =>
      candidate.card_name !== data.card_name ||
      candidate.set_code !== data.set_code ||
      candidate.collector_number !== data.collector_number
    );
    return {
      margin: runnerUp ? confidence - runnerUp.confidence : 1,
      authoritative: data.matched === true,
      serverTimings,
      result: {
        capture_id: captureId,
        card_name: data.card_name,
        set_name: setName,
        set_code: typeof data.set_code === 'string' ? data.set_code : '',
        image_uri: typeof data.image_uri === 'string' ? data.image_uri : null,
        confidence,
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
      },
    };
  }, [apiBaseUrl, fetchWithTimeout, scanMode]);

  const commitCapture = useCallback((sample: FrameSample, capturedAtMs: number) => {
    capturedPixelsRef.current = sample.grayscale.slice();
    captureStateRef.current = {
      phase: 'awaiting_removal',
      stableFrames: 0,
      removalFrames: 0,
      removalObserved: false,
      // Parte dal commit, non dall'inizio della richiesta: evita che una
      // risposta lenta riarmi istantaneamente su un frame transitorio.
      lastCaptureAtMs: Math.max(capturedAtMs, Date.now()),
    };
    manualCaptureRef.current = false;
  }, []);

  const recognize = useCallback(async (sample: FrameSample) => {
    const turboReady = isTurboReady();
    // In continuo ogni carta viene bloccata subito in awaiting_removal: le
    // richieste concorrenti appartengono quindi a carte fisiche diverse. Nella
    // modale singola manteniamo invece una sola lettura per volta.
    const inflightLimit = continuous ? Math.max(1, maxInflight) : 1;
    if (
      !activeRef.current ||
      captureStateRef.current.phase === 'awaiting_removal' ||
      inflightRef.current >= inflightLimit
    ) return;
    const captureId = createCaptureId();
    const capturedAtMs = Date.now();
    const cardEpoch = cardEpochRef.current;
    latestCaptureIdRef.current = captureId;
    if (continuous) {
      // La cattura e la recognition sono due lane indipendenti: l'utente può
      // già rimuovere la carta mentre JPEG/upload/matcher proseguono.
      commitCapture(sample, capturedAtMs);
      setScannerState('awaiting_removal');
    }
    inflightRef.current++;
    setIsBusy(true);
    if (!continuous) setScannerState('processing');
    const startedAt = performance.now();
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
      const encodeStartedAt = performance.now();
      let encodeLatencyMs = -1;
      const captureBlobPromise = captureCardBlob().then((blob) => {
        encodeLatencyMs = Math.round(performance.now() - encodeStartedAt);
        return blob;
      });
      const recognition = turboReady
        ? await recognizeWithVector(captureId, captureBlobPromise)
        : await recognizeWithServer(captureId, await captureBlobPromise);
      if (
        !activeRef.current ||
        cardEpochRef.current !== cardEpoch
      ) return;
      const elapsed = Math.round(performance.now() - startedAt);
      if (recognition) {
        const scanResult = recognition.result;
        const captureBlob = await captureBlobPromise;
        if (captureBlob) scanResult.capture_blob = captureBlob;
        scanResult.captured_at_ms = capturedAtMs;
        const isLatestCapture = latestCaptureIdRef.current === captureId;
        if (!continuous || isLatestCapture) applyHint(scanResult);
        const confidenceAccepted = scanResult.confidence >= effectiveConf;
        if (continuous) {
          setDebug((current) => ({
            ...current,
            lastStatus: '200',
            lastLatencyMs: elapsed,
            lastBackendLatencyMs: Math.round(scanResult.latency_ms),
            lastBffLatencyMs: Math.round(
              recognition.serverTimings.bff_total ?? -1,
            ),
            lastEncodeLatencyMs: encodeLatencyMs,
            lastError: null,
            lastOutcome: confidenceAccepted ? 'matched' : 'not_matched',
            lastMethod: scanResult.method,
          }));
          // Nel batch conserviamo anche un candidato incerto: la review locale
          // esiste apposta per correggerlo senza rallentare la camera.
          onMatchRef.current?.(scanResult);
          if (
            isLatestCapture &&
            (captureStateRef.current as AutoCaptureState).phase === 'awaiting_removal'
          ) {
            setResult(scanResult);
            setScannerState('matched');
            if (capturedFlashRef.current) clearTimeout(capturedFlashRef.current);
            capturedFlashRef.current = setTimeout(() => {
              if (
                activeRef.current &&
                captureStateRef.current.phase === 'awaiting_removal'
              ) {
                setScannerState('awaiting_removal');
              }
            }, 350);
          }
          return;
        }

        const key = recognitionKey(scanResult);
        const voteBuffer = recentNamesRef.current;
        voteBuffer.push(key);
        const safeVoteWindow = Math.max(1, Math.round(voteWindow));
        while (voteBuffer.length > safeVoteWindow) voteBuffer.shift();
        const voteHits = voteBuffer.filter((candidateKey) => candidateKey === key).length;
        const shouldCommit =
          (recognition.authoritative && scanResult.confidence >= effectiveConf) ||
          shouldCommitTurboMatch({
            finalConfidence: scanResult.confidence,
            margin: recognition.margin,
            voteHits,
            effectiveConf,
            voteRequired: Math.min(
              safeVoteWindow,
              Math.max(1, Math.round(voteRequired)),
            ),
          });
        setDebug((current) => ({
          ...current,
          lastStatus: '200',
          lastLatencyMs: elapsed,
          lastBackendLatencyMs: Math.round(scanResult.latency_ms),
          lastBffLatencyMs: Math.round(
            recognition.serverTimings.bff_total ?? -1,
          ),
          lastEncodeLatencyMs: encodeLatencyMs,
          lastError: null,
          lastOutcome: shouldCommit ? 'matched' : 'not_matched',
          lastMethod: scanResult.method,
        }));

        if (shouldCommit) {
          cardEpochRef.current++;
          clearRecognitionState();
          commitCapture(sample, capturedAtMs);
          setResult(scanResult);
          setScannerState('matched');
          onMatchRef.current?.(scanResult);
          if (!continuous) {
            activeRef.current = false;
            clearTimer();
          } else {
            if (capturedFlashRef.current) clearTimeout(capturedFlashRef.current);
            capturedFlashRef.current = setTimeout(() => {
              if (
                activeRef.current &&
                captureStateRef.current.phase === 'awaiting_removal'
              ) {
                setScannerState('awaiting_removal');
              }
            }, 350);
          }
        } else if (inflightRef.current <= 1) {
          setScannerState('stabilizing');
        }
      } else {
        setDebug((current) => ({
          ...current,
          lastStatus: '200',
          lastLatencyMs: elapsed,
          lastBackendLatencyMs: -1,
          lastBffLatencyMs: -1,
          lastEncodeLatencyMs: encodeLatencyMs,
          lastError: null,
          lastOutcome: 'not_matched',
          lastMethod: isTurboReady() ? 'edge+faiss' : 'server',
        }));
        onNoMatchRef.current?.();
        if (!continuous && inflightRef.current <= 1) setScannerState('stabilizing');
      }
    } catch (error) {
      if (!activeRef.current || cardEpochRef.current !== cardEpoch) return;
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      setDebug((current) => ({
        ...current,
        lastStatus: aborted ? 'TIMEOUT' : 'ERROR',
        lastLatencyMs: Math.round(performance.now() - startedAt),
        lastBackendLatencyMs: -1,
        lastBffLatencyMs: -1,
        lastEncodeLatencyMs: -1,
        lastError: aborted ? `TIMEOUT dopo ${requestTimeoutMs}ms` : String(error),
        lastOutcome: 'not_matched',
        lastMethod: null,
      }));
      onNoMatchRef.current?.();
    } finally {
      inflightRef.current = Math.max(0, inflightRef.current - 1);
      if (activeRef.current) {
        setIsBusy(inflightRef.current > 0);
        if (
          !continuous &&
          inflightRef.current === 0 &&
          cardEpochRef.current === cardEpoch
        ) {
          setScannerState('stabilizing');
        }
      }
    }
  }, [
    applyHint,
    clearRecognitionState,
    clearTimer,
    captureCardBlob,
    commitCapture,
    continuous,
    effectiveConf,
    isTurboReady,
    maxInflight,
    recognizeWithServer,
    recognizeWithVector,
    requestTimeoutMs,
    setScannerState,
    voteRequired,
    voteWindow,
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
    const captured = capturedPixelsRef.current;
    const changedFromCapture = captured
      ? sample.quality.usable
        ? exposureInvariantFrameDifference(sample.grayscale, captured)
        : Math.max(
            frameDifference(sample.grayscale, captured),
            exposureInvariantFrameDifference(sample.grayscale, captured),
          )
      : null;
    const decision = advanceAutoCapture(captureStateRef.current, {
      nowMs: Date.now(),
      usable: sample.quality.usable,
      hasPreviousFrame: previous !== null,
      motion,
      changedFromCapture,
      manualCapture: manualCaptureRef.current,
      canCapture: continuous
        ? inflightRef.current < Math.max(1, maxInflight)
        : inflightRef.current === 0,
      captureIntervalMs,
    });
    captureStateRef.current = decision.state;
    previousSampleRef.current = sample;

    if (decision.action === 'capture') {
      manualCaptureRef.current = false;
      void recognize(sample);
    } else if (decision.action === 'rearmed') {
      capturedPixelsRef.current = null;
      clearRecognitionState();
      setResult(null);
      setScannerState('scanning');
    } else if (
      decision.state.phase === 'stabilizing' &&
      inflightRef.current === 0
    ) {
      setScannerState('stabilizing');
    } else if (decision.state.phase === 'seeking') {
      setScannerState('scanning');
    }

    schedule(() => tickRef.current());
  };

  const resetCaptureState = useCallback(() => {
    cardEpochRef.current++;
    captureStateRef.current = createAutoCaptureState();
    previousSampleRef.current = null;
    capturedPixelsRef.current = null;
    manualCaptureRef.current = false;
    clearRecognitionState();
    setResult(null);
    setIsBusy(false);
  }, [clearRecognitionState]);

  const beginScan = useCallback(() => {
    resetCaptureState();
    setDebug({
      framesSent: 0,
      lastStatus: null,
      lastLatencyMs: -1,
      lastBackendLatencyMs: -1,
      lastBffLatencyMs: -1,
      lastEncodeLatencyMs: -1,
      lastError: null,
      lastOutcome: null,
      lastMethod: null,
    });
  }, [resetCaptureState]);

  const startScanLoop = useCallback(() => {
    clearTimer();
    activeRef.current = true;
    schedule(() => tickRef.current(), 0);
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
    if (activeRef.current) schedule(() => tickRef.current(), 0);
  }, [resetCaptureState, schedule]);

  const captureNow = useCallback(() => {
    if (!activeRef.current || captureStateRef.current.phase === 'awaiting_removal') return;
    manualCaptureRef.current = true;
    captureStateRef.current = {
      ...captureStateRef.current,
      phase: 'stabilizing',
    };
    setScannerState('stabilizing');
  }, [setScannerState]);

  const isLoopActive = useCallback(() => activeRef.current, []);

  return {
    result,
    hint,
    isBusy,
    debug,
    beginScan,
    startScanLoop,
    stopLoop,
    restartScan,
    captureNow,
    isLoopActive,
  };
}
