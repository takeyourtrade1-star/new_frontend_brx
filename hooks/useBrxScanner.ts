'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { type OnnxLoadProgress } from '@/lib/scanner/onnx-loader';
import { BALANCED } from '@/lib/scanner/balancedProfile';
import { useTranslation } from '@/lib/i18n/useTranslation';

import { useOnnxSession, type ModelStatus } from './scanner/useOnnxSession';
import { useScanLoop } from './scanner/useScanLoop';
import type { DebugInfo, ScannerState, ScanResult } from './scanner/scanner-types';

export type { OnnxLoadProgress } from '@/lib/scanner/onnx-loader';
export type { ModelStatus } from './scanner/useOnnxSession';
export type { ScannerState, ScanResult, DebugInfo } from './scanner/scanner-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  requestTimeoutMs?: number;
  /** fast = CNN only (live scan); auto = server may skip ORB when confident. */
  scanMode?: 'auto' | 'fast' | 'full';
  /** Vote window for commit (default 5 for V3, 3 for legacy). */
  voteWindow?: number;
  /** Required votes within window for commit (default 3 for V3, 2 for legacy). */
  voteRequired?: number;
  maxInflight?: number;
  /** Se true, apre subito la camera mentre il modello edge si prepara in background. */
  autoOpenCamera?: boolean;
  /** Mantiene la camera attiva e attende la rimozione della carta dopo ogni risultato. */
  continuous?: boolean;
}

export interface UseBrxScannerReturn {
  state: ScannerState;
  result: ScanResult | null;
  /** Live guess while scanning (before match commit). */
  hint: ScanResult | null;
  isBusy: boolean;
  errorMessage: string | null;
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
  /** Forza una cattura accessibile senza attendere il rilevamento automatico. */
  captureNow: () => void;
}

// ---------------------------------------------------------------------------
// Hook — composes useOnnxSession (model/worker) + useScanLoop (pipelines) and
// owns the camera stream + ScannerState lifecycle.
// ---------------------------------------------------------------------------

export function useBrxScanner(options: UseBrxScannerOptions = {}): UseBrxScannerReturn {
  const {
    onMatch,
    onNoMatch,
    onError,
    confidenceThreshold: rawConf = BALANCED.confDefault,
    hintConfidenceMin: rawHint = BALANCED.hintDefault,
    captureIntervalMs = BALANCED.captureIntervalMs,
    apiBaseUrl = '/api/scanner',
    requestTimeoutMs = BALANCED.requestTimeoutMs,
    scanMode = 'auto',
    voteWindow = BALANCED.voteWindow,
    voteRequired = BALANCED.voteRequired,
    maxInflight = 3,
    autoOpenCamera = false,
    continuous = false,
  } = options;

  // Enforce floors
  const effectiveConf = Math.max(rawConf, BALANCED.confFloor);
  const effectiveHint = Math.max(rawHint, BALANCED.hintConfFloor);

  const { t } = useTranslation();

  // ---------------------------------------------------------------------------
  // State / refs owned by the orchestrator (camera + scanner lifecycle)
  // ---------------------------------------------------------------------------
  const [state, setState] = useState<ScannerState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cameraOpenedRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Incrementato a ogni open/stop: invalida le openCamera in-flight, così uno
  // stream ottenuto DOPO stopScanning/unmount viene fermato subito e la camera
  // non resta accesa (race su getUserMedia in await).
  const cameraSessionRef = useRef(0);

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

  // Scan loop: cattura locale, ONNX/server, dedup, voting e hint gating.
  const {
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
  } = useScanLoop({
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
    setScannerState: setState,
  });

  const stopScanning = useCallback(() => {
    cameraSessionRef.current++;
    stopLoop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setState('idle');
  }, [stopLoop]);

  useEffect(() => () => stopScanning(), [stopScanning]);

  // ---------------------------------------------------------------------------
  // Camera management
  // ---------------------------------------------------------------------------

  const openCamera = useCallback(async (): Promise<void> => {
    const session = ++cameraSessionRef.current;
    setState('requesting_camera');
    setErrorMessage(null);
    beginScan();

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
      if (session !== cameraSessionRef.current) return;
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? t('scanner.deniedBody')
          : t('scanner.cameraGenericError');
      setErrorMessage(msg);
      setState('error');
      onError?.(msg);
      return;
    }

    // Scanner chiuso/smontato mentre getUserMedia era in attesa: il cleanup è
    // già girato, quindi fermiamo qui le track o la camera resterebbe accesa.
    if (session !== cameraSessionRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }

    setState('scanning');
    startScanLoop();
  }, [beginScan, onError, startScanLoop, t]);

  useEffect(() => {
    if (!autoOpenCamera || cameraOpenedRef.current) return;
    cameraOpenedRef.current = true;
    void openCamera();
  }, [autoOpenCamera, openCamera]);

  const restartScanning = useCallback(() => {
    restartScan();
    setState('scanning');
    if (streamRef.current && !isLoopActive()) {
      startScanLoop();
    }
  }, [restartScan, isLoopActive, startScanLoop]);

  return {
    state,
    result,
    hint,
    isBusy,
    errorMessage,
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
    captureNow,
  };
}
