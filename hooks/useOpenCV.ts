'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Minimal OpenCV.js type declaration
// Full OpenCV types are extensive; we define only what we need
interface OpenCVMat {
  delete: () => void;
  data: Uint8Array;
  cols: number;
  rows: number;
}

interface OpenCV {
  VERSION?: string;
  Mat: new () => OpenCVMat;
  matFromArray: (rows: number, cols: number, type: number, data: number[]) => OpenCVMat;
  getPerspectiveTransform: (src: OpenCVMat, dst: OpenCVMat) => OpenCVMat;
  warpPerspective: (
    src: OpenCVMat,
    dst: OpenCVMat,
    M: OpenCVMat,
    dsize: { width: number; height: number }
  ) => void;
  absdiff: (src1: OpenCVMat, src2: OpenCVMat, dst: OpenCVMat) => void;
  cvtColor: (src: OpenCVMat, dst: OpenCVMat, code: number) => void;
  COLOR_RGBA2GRAY: number;
  COLOR_RGB2GRAY: number;
  CV_8UC1: number;
  CV_8UC4: number;
  CV_32FC1: number;
  CV_32FC2: number;
  Size: new (width: number, height: number) => { width: number; height: number };
  onRuntimeInitialized?: () => void;
  onAbort?: (err: any) => void;
  preRun?: Array<() => void>;
  then?: (func: (cv: OpenCV) => void) => unknown;
}

declare global {
  interface Window {
    cv: OpenCV;
    Module: {
      wasmBinaryFile?: string;
      preRun?: (() => void)[];
      onRuntimeInitialized?: () => void;
      onAbort?: (err: any) => void;
    };
  }
}

type OpenCVStatus = 'idle' | 'loading' | 'initializing' | 'ready' | 'error';

interface OpenCVInstance {
  cv: OpenCV | null;
  status: OpenCVStatus;
  error: Error | null;
  progress: number; // 0-100 loading progress
  load: () => Promise<OpenCV | null>; // Manual trigger for lazy loading
}

// Global singleton to avoid multiple loads
let globalOpenCV: OpenCV | null = null;
let loadingPromise: Promise<OpenCV> | null = null;

// Configuration for OpenCV loading
interface OpenCVConfig {
  jsPath: string;
  wasmPath: string | null; // null = embedded WASM in JS file
  lazy: boolean; // true = don't auto-load, wait for manual trigger
}

interface UseOpenCVOptions {
  /** If true, OpenCV won't load until load() is called manually */
  lazy?: boolean;
  /** Path to opencv.js (default: /opencv/opencv.js) */
  jsPath?: string;
  /** Path to WASM file, or null for embedded WASM (default: null) */
  wasmPath?: string | null;
  /** Called during loading progress (0-100) */
  onProgress?: (progress: number) => void;
}

const DEFAULT_CONFIG: OpenCVConfig = {
  jsPath: '/opencv/opencv.js',
  wasmPath: null, // Use embedded WASM (opencv.js 4.9.0+ includes it)
  lazy: false,
};

/**
 * Hook to load OpenCV.js WASM safely with lazy loading support.
 * 
 * Features:
 * - Lazy loading: Set lazy=true to load only when needed
 * - Progress tracking: Real-time loading progress 0-100
 * - External WASM: Can use separate .wasm file for better caching
 * 
 * Place opencv.js in /public/opencv/opencv.js
 * For external WASM, also place opencv_js.wasm in same folder
 */
export function useOpenCV(options: UseOpenCVOptions = {}): OpenCVInstance {
  const configRef = useRef<OpenCVConfig>({
    ...DEFAULT_CONFIG,
    lazy: options.lazy ?? DEFAULT_CONFIG.lazy,
    jsPath: options.jsPath ?? DEFAULT_CONFIG.jsPath,
    wasmPath: options.wasmPath ?? DEFAULT_CONFIG.wasmPath,
  });

  const [status, setStatus] = useState<OpenCVStatus>(globalOpenCV ? 'ready' : 'idle');
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const cvRef = useRef<OpenCV | null>(globalOpenCV);
  const onProgressRef = useRef(options.onProgress);

  // Keep progress callback ref updated
  useEffect(() => {
    onProgressRef.current = options.onProgress;
  }, [options.onProgress]);

  const updateProgress = useCallback((value: number) => {
    setProgress(value);
    onProgressRef.current?.(value);
  }, []);

  const isOpenCVReady = useCallback((candidate: unknown): candidate is OpenCV => {
    if (!candidate || typeof candidate !== 'object') return false;
    const cvCandidate = candidate as Partial<OpenCV>;
    return (
      typeof cvCandidate.Mat === 'function' &&
      typeof cvCandidate.getPerspectiveTransform === 'function' &&
      typeof cvCandidate.warpPerspective === 'function'
    );
  }, []);

  const loadOpenCV = useCallback(async (): Promise<OpenCV | null> => {
    if (globalOpenCV) {
      cvRef.current = globalOpenCV;
      setStatus('ready');
      updateProgress(100);
      return globalOpenCV;
    }
    if (loadingPromise) {
      const cv = await loadingPromise;
      cvRef.current = cv;
      setStatus('ready');
      updateProgress(100);
      return cv;
    }

    const config = configRef.current;
    
    loadingPromise = new Promise((resolve, reject) => {
      const failLoad = (err: Error) => {
        setError(err);
        setStatus('error');
        loadingPromise = null;
        reject(err);
      };

      // Check if cv is already loaded globally
      if (typeof window !== 'undefined' && isOpenCVReady((window as any).cv)) {
        globalOpenCV = (window as any).cv as OpenCV;
        cvRef.current = globalOpenCV;
        if (globalOpenCV) {
          setStatus('ready');
          updateProgress(100);
          resolve(globalOpenCV);
        }
        return;
      }

      setStatus('loading');
      updateProgress(10); // Started loading

      // Create script element to load OpenCV.js
      const script = document.createElement('script');
      script.src = config.jsPath;
      script.async = true;
      
      // Track script loading progress
      script.onload = () => {
        updateProgress(30); // Script loaded, WASM initializing
        setStatus('initializing');

        // Some OpenCV builds expose a thenable cv object.
        const cvMaybe = (window as any).cv;
        if (cvMaybe && typeof cvMaybe.then === 'function') {
          let thenResolvedSync = false;
          const handleThenResolved = (resolvedCv: OpenCV) => {
            thenResolvedSync = true;
            if (progressInterval) clearInterval(progressInterval);
            if (timeoutId) clearTimeout(timeoutId);

            const readyCv = isOpenCVReady(resolvedCv)
              ? resolvedCv
              : ((window as any).cv as OpenCV);

            if (!isOpenCVReady(readyCv)) {
              failLoad(new Error('OpenCV then callback fired but cv is not ready yet'));
              return;
            }

            globalOpenCV = readyCv;
            cvRef.current = readyCv;
            setStatus('ready');
            updateProgress(100);
            resolve(readyCv);
          };

          const handleThenRejected = (err: unknown) => {
            if (progressInterval) clearInterval(progressInterval);
            if (timeoutId) clearTimeout(timeoutId);
            failLoad(err instanceof Error ? err : new Error(String(err)));
          };

          try {
            const thenResult = cvMaybe.then(handleThenResolved);
            if (!thenResolvedSync) {
              simulateProgress();
              startTimeout();
            }
            if (thenResult && typeof thenResult.catch === 'function') {
              thenResult.catch(handleThenRejected);
            }
          } catch (err) {
            handleThenRejected(err);
          }
          return;
        }

        if (isOpenCVReady(cvMaybe)) {
          if (progressInterval) clearInterval(progressInterval);
          if (timeoutId) clearTimeout(timeoutId);
          globalOpenCV = cvMaybe;
          cvRef.current = cvMaybe;
          setStatus('ready');
          updateProgress(100);
          resolve(cvMaybe);
          return;
        }

        // Fallback progress watchdog while waiting for runtime callback.
        simulateProgress();
        startTimeout();
      };

      // Progress simulation for WASM compilation (takes most time)
      let progressInterval: NodeJS.Timeout | null = null;
      let currentProgress = 30;
      let timeoutId: NodeJS.Timeout | null = null;

      const simulateProgress = () => {
        progressInterval = setInterval(() => {
          if (currentProgress < 80) {
            currentProgress += Math.random() * 3; // Slower increment (0-3%)
            updateProgress(Math.min(currentProgress, 80));
            console.log(`[OpenCV] Initializing... ${Math.round(currentProgress)}%`);
          }
        }, 500); // Slower updates (500ms)
      };

      // Timeout watchdog - if WASM doesn't initialize in 45s, fail
      const startTimeout = () => {
        timeoutId = setTimeout(() => {
          if (progressInterval) clearInterval(progressInterval);
          failLoad(new Error('OpenCV WASM initialization timeout (45s). Check console for errors or try refreshing.'));
        }, 45000);
      };
      
      // OpenCV.js Module configuration
      const moduleConfig: any = {
        preRun: [() => {
          console.log('[OpenCV] WASM preRun started...');
        }],
        onRuntimeInitialized: () => {
          if (progressInterval) clearInterval(progressInterval);
          if (timeoutId) clearTimeout(timeoutId);
          console.log('[OpenCV] onRuntimeInitialized called');
          
          if (isOpenCVReady((window as any).cv)) {
            globalOpenCV = (window as any).cv as OpenCV;
            cvRef.current = globalOpenCV;
            setStatus('ready');
            updateProgress(100);
            console.log('[OpenCV] Ready - Version:', globalOpenCV?.VERSION);
            if (globalOpenCV) resolve(globalOpenCV);
            else failLoad(new Error('OpenCV loaded but cv object not found'));
          } else {
            failLoad(new Error('OpenCV loaded but cv object not found'));
          }
        },
        onAbort: (err: any) => {
          if (progressInterval) clearInterval(progressInterval);
          if (timeoutId) clearTimeout(timeoutId);
          failLoad(new Error(`OpenCV load aborted: ${err}`));
        },
      };

      // Only set wasmBinaryFile if using external WASM
      // If null/undefined, OpenCV.js will use embedded WASM
      if (config.wasmPath) {
        moduleConfig.locateFile = (path: string) => {
          if (path.endsWith('.wasm')) {
            return config.wasmPath!;
          }
          return path;
        };
      }

      // OpenCV bootstrap uses global `cv` if present (`var Module = typeof cv !== 'undefined' ? cv : {}`)
      const cvBootstrap = {
        ...((window as any).cv || {}),
        ...moduleConfig,
      };
      (window as any).cv = cvBootstrap;
      (window as any).Module = cvBootstrap;

      script.onerror = () => {
        if (progressInterval) clearInterval(progressInterval);
        if (timeoutId) clearTimeout(timeoutId);
        failLoad(new Error(`Failed to load OpenCV.js from ${config.jsPath}. Check if file exists in public/opencv/`));
      };

      document.body.appendChild(script);
    });

    return loadingPromise;
  }, [updateProgress]);

  // Auto-load if not lazy mode
  useEffect(() => {
    if (configRef.current.lazy || status !== 'idle' || typeof window === 'undefined') {
      return;
    }

    loadOpenCV()
      .then((cv) => {
        if (cv) {
          cvRef.current = cv;
          setStatus('ready');
        }
      })
      .catch((err) => {
        console.error('[OpenCV] Load error:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
        loadingPromise = null;
      });

    return () => {
      // Note: OpenCV WASM cannot be truly unloaded, but we can cleanup refs
    };
  }, [loadOpenCV, status]);

  return {
    cv: cvRef.current,
    status,
    error,
    progress,
    load: loadOpenCV,
  };
}

/**
 * Utility to safely delete OpenCV matrices.
 * Use this to prevent memory leaks.
 */
export function safeDeleteMat(mat: any): void {
  if (mat && typeof mat.delete === 'function') {
    mat.delete();
  }
}

/**
 * Utility to safely delete multiple matrices at once.
 */
export function safeDeleteMats(...mats: any[]): void {
  mats.forEach(safeDeleteMat);
}
