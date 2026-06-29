'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type * as OrtLib from 'onnxruntime-web';

import {
  fetchAndCacheOnnxModel,
  ONNX_LOAD_PROGRESS_IDLE,
  type OnnxLoadProgress,
} from '@/lib/scanner/onnx-loader';
import { createTensorBuffer, isIosDevice } from '@/lib/scanner/preprocess';

import { resolveOnnxDownloadUrls } from '../resolveOnnxUrls';

/** ONNX model load status for the edge pipeline. */
export type ModelStatus = 'loading' | 'ready' | 'failed';

const ONNX_SIZE = 224;

/**
 * `ort.env.wasm` is process-global. Configuring it once guards against a race
 * when multiple instances of this hook mount (e.g. scanner + embed) and write
 * the same globals concurrently.
 */
let ortEnvConfigured = false;

export interface UseOnnxSessionOptions {
  apiBaseUrl: string;
}

export interface UseOnnxSessionReturn {
  /** ONNX edge pipeline status. */
  modelStatus: ModelStatus;
  /** ONNX download / cache progress (bytes + phase). */
  modelProgress: OnnxLoadProgress;
  /** Last ONNX load failure message (null when loading or ready). */
  modelError: string | null;
  /** User chose standard mode or ONNX was skipped — hide the pre-scan gate. */
  turboSkipped: boolean;
  /** Re-fetch ONNX model (e.g. after failed download or backend V3 deploy). */
  retryModelDownload: () => void;
  /** Skip Turbo and use server-side /scan only. */
  continueWithStandardMode: () => void;
  /** Run the edge embedding (worker or in-process session). */
  runOnnxEmbed: (tensor: Float32Array) => Promise<Float32Array>;
  /** True when the worker or in-process session can embed frames. */
  isTurboReady: () => boolean;
  /** Hidden 224×224 canvas for ONNX frame capture — never exposed to page. */
  onnxCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  onnxCtxRef: React.MutableRefObject<CanvasRenderingContext2D | null>;
  tensorBufferRef: React.MutableRefObject<Float32Array | null>;
}

/**
 * Owns the ONNX edge pipeline: model download/cache, worker (or in-process
 * session) init, frame embedding, and retry/standard-mode controls. Extracted
 * from useBrxScanner with identical behavior; the scan loop consumes
 * `runOnnxEmbed` + the capture refs and routes on `isTurboReady`.
 */
export function useOnnxSession({ apiBaseUrl }: UseOnnxSessionOptions): UseOnnxSessionReturn {
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading');
  const [modelProgress, setModelProgress] = useState<OnnxLoadProgress>(ONNX_LOAD_PROGRESS_IDLE);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelLoadAttempt, setModelLoadAttempt] = useState(0);
  const [turboSkipped, setTurboSkipped] = useState(false);

  const onnxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const onnxCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const tensorBufferRef = useRef<Float32Array | null>(null);
  const embedWorkerRef = useRef<Worker | null>(null);
  const workerReadyRef = useRef(false);
  const embedPendingRef = useRef<{
    resolve: (v: Float32Array) => void;
    reject: (e: Error) => void;
  } | null>(null);

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
      onnxCtxRef.current = c.getContext('2d', {
        alpha: false,
        desynchronized: true,
        willReadFrequently: true,
      });
      tensorBufferRef.current = createTensorBuffer();
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

        if (!ortEnvConfigured) {
          ort.env.wasm.numThreads = 1;
          ort.env.wasm.simd = true;
          ort.env.wasm.wasmPaths = '/ort-wasm/';
          ortEnvConfigured = true;
        }

        const wasmBase =
          typeof window !== 'undefined' ? `${window.location.origin}/ort-wasm/` : '/ort-wasm/';
        const useWebGl = !isIosDevice();
        let workerOk = false;

        if (typeof Worker !== 'undefined') {
          try {
            const worker = new Worker(
              new URL('../scannerEmbed.worker.ts', import.meta.url),
              { type: 'module' },
            );
            workerOk = await new Promise<boolean>((resolve) => {
              const t = setTimeout(() => resolve(false), 45_000);
              worker.onmessage = (ev: MessageEvent<{ type: string; vector?: Float32Array; message?: string }>) => {
                if (ev.data.type === 'ready') {
                  clearTimeout(t);
                  workerReadyRef.current = true;
                  embedWorkerRef.current = worker;
                  resolve(true);
                } else if (ev.data.type === 'vector' && ev.data.vector && embedPendingRef.current) {
                  embedPendingRef.current.resolve(ev.data.vector);
                  embedPendingRef.current = null;
                } else if (ev.data.type === 'error') {
                  if (embedPendingRef.current) {
                    embedPendingRef.current.reject(new Error(ev.data.message ?? 'worker embed failed'));
                    embedPendingRef.current = null;
                  }
                }
              };
              worker.onerror = () => {
                clearTimeout(t);
                resolve(false);
              };
              const modelCopy = modelData.slice(0);
              worker.postMessage(
                { type: 'init', model: modelCopy, wasmBase, useWebGl },
                [modelCopy],
              );
            });
            if (!workerOk) {
              worker.terminate();
              embedWorkerRef.current = null;
              workerReadyRef.current = false;
            }
          } catch {
            workerOk = false;
          }
        }

        if (!workerOk) {
          let session: OrtLib.InferenceSession;
          try {
            session = await ort.InferenceSession.create(modelData, {
              executionProviders: useWebGl ? ['webgl', 'wasm'] : ['wasm'],
              graphOptimizationLevel: 'all',
            });
          } catch {
            session = await ort.InferenceSession.create(modelData, {
              executionProviders: ['wasm'],
              graphOptimizationLevel: 'all',
            });
          }
          if (cancelled) return;
          const warmup = new ort.Tensor(
            'float32',
            new Float32Array(3 * ONNX_SIZE * ONNX_SIZE),
            [1, 3, ONNX_SIZE, ONNX_SIZE],
          );
          await session.run({ [session.inputNames[0]]: warmup });
          if (cancelled) return;
          ortRef.current = ort as unknown as typeof OrtLib;
          sessionRef.current = session;
        } else {
          ortRef.current = { Tensor: ort.Tensor } as unknown as typeof OrtLib;
          sessionRef.current = {} as OrtLib.InferenceSession;
        }

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
    return () => {
      cancelled = true;
      embedWorkerRef.current?.terminate();
      embedWorkerRef.current = null;
      workerReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl, modelLoadAttempt, turboSkipped]);

  const retryModelDownload = useCallback(() => {
    embedWorkerRef.current?.terminate();
    embedWorkerRef.current = null;
    workerReadyRef.current = false;
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
    embedWorkerRef.current?.terminate();
    embedWorkerRef.current = null;
    workerReadyRef.current = false;
    sessionRef.current = null;
    ortRef.current = null;
  }, []);

  const runOnnxEmbed = useCallback(
    async (tensor: Float32Array): Promise<Float32Array> => {
      if (workerReadyRef.current && embedWorkerRef.current) {
        const worker = embedWorkerRef.current;
        const payload = tensor.slice();
        return new Promise((resolve, reject) => {
          embedPendingRef.current = { resolve, reject };
          worker.postMessage({ type: 'embed', tensor: payload }, [payload.buffer]);
        });
      }
      const ort = ortRef.current;
      const session = sessionRef.current;
      if (!ort?.Tensor || !session?.run) {
        throw new Error('ONNX session not ready');
      }
      const t = new ort.Tensor('float32', tensor, [1, 3, ONNX_SIZE, ONNX_SIZE]);
      const outputs = await session.run({ [session.inputNames[0]]: t });
      const raw = outputs[session.outputNames[0]].data as Float32Array;
      const out = new Float32Array(raw.buffer, raw.byteOffset, 384);
      let sumSq = 0;
      for (let i = 0; i < out.length; i++) sumSq += out[i] * out[i];
      const norm = Math.sqrt(sumSq);
      if (norm > 1e-8) for (let i = 0; i < out.length; i++) out[i] /= norm;
      return out;
    },
    [],
  );

  const isTurboReady = useCallback(
    () =>
      workerReadyRef.current ||
      Boolean(sessionRef.current && typeof sessionRef.current.run === 'function'),
    [],
  );

  return {
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
  };
}
