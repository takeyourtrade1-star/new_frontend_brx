'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { useOpenCV, safeDeleteMat } from '@/hooks/useOpenCV';
import { useAutoCapture } from '@/hooks/useAutoCapture';
import { Settings2, ScanLine, Camera, RotateCcw, Check, Loader2, Download, Play, Trash2, Images, Plus, X, ChevronRight, Aperture } from 'lucide-react';

// Target dimensions for card scanning (630x880 is standard card ratio)
const TARGET_WIDTH = 630;
const TARGET_HEIGHT = 880;
const STORAGE_KEY = 'card-scanner-calibration';

interface CalibrationPoint {
  id: number;
  x: number;
  y: number;
}

type ScannerMode = 'calibration' | 'scanning' | 'review';

interface CapturedCard {
  id: string;
  imageData: string;
  timestamp: number;
}

interface CardScannerProps {
  onCapture?: (imageData: string) => void;
  onBatchComplete?: (images: CapturedCard[]) => void;
  onError?: (error: Error) => void;
  batchMode?: boolean; // Enable batch scanning mode
  maxBatchSize?: number; // Max images in batch (default: 50)
}

/**
 * Card Scanner Component for TCG card scanning
 * 
 * Features:
 * - Calibration mode with 4 draggable points
 * - Auto-capture using frame differencing
 * - Perspective correction using OpenCV
 * - 60 FPS processing with requestAnimationFrame
 */
export default function CardScanner({ 
  onCapture, 
  onBatchComplete,
  onError,
  batchMode = true,
  maxBatchSize = 50
}: CardScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  const focusLockRef = useRef<boolean>(false);

  const { cv, status: cvStatus, error: cvError, progress: cvProgress, load: loadOpenCV } = useOpenCV({ lazy: true });
  
  const [mode, setMode] = useState<ScannerMode>('calibration');
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 640, height: 480 });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBatch, setCapturedBatch] = useState<CapturedCard[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpenCVLoading, setIsOpenCVLoading] = useState(false);
  const [showBatchGallery, setShowBatchGallery] = useState(false);

  // Calibration points (normalized 0-1 coordinates)
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>([
    { id: 0, x: 0.25, y: 0.25 }, // Top-left
    { id: 1, x: 0.75, y: 0.25 }, // Top-right
    { id: 2, x: 0.75, y: 0.75 }, // Bottom-right
    { id: 3, x: 0.25, y: 0.75 }, // Bottom-left
  ]);

  const { 
    status: captureStatus, 
    stabilityProgress, 
    processFrame, 
    resetCapture,
    isStable 
  } = useAutoCapture({
    diffThreshold: 30,
    changePercentageThreshold: 0.08,
    stabilityFramesRequired: 5,
  });

  // Load saved calibration on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const points = JSON.parse(saved);
        if (Array.isArray(points) && points.length === 4) {
          setCalibrationPoints(points);
          setMode('scanning');
        }
      } catch {
        // Invalid calibration data
      }
    }
  }, []);

  // Handle OpenCV errors
  useEffect(() => {
    if (cvError && onError) {
      onError(cvError);
    }
  }, [cvError, onError]);

  // Manual trigger to load OpenCV (lazy loading)
  const handleLoadOpenCV = useCallback(async () => {
    if (cvStatus === 'ready' || isOpenCVLoading) return;
    
    setIsOpenCVLoading(true);
    try {
      await loadOpenCV();
    } catch (err) {
      console.error('[CardScanner] Failed to load OpenCV:', err);
    } finally {
      setIsOpenCVLoading(false);
    }
  }, [cvStatus, isOpenCVLoading, loadOpenCV]);

  // Add captured image to batch
  const addToBatch = useCallback((imageData: string) => {
    const newCard: CapturedCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      imageData,
      timestamp: Date.now(),
    };
    
    setCapturedBatch(prev => {
      const updated = [...prev, newCard];
      // Keep only last maxBatchSize items
      return updated.slice(-maxBatchSize);
    });
  }, [maxBatchSize]);

  // Remove image from batch
  const removeFromBatch = useCallback((id: string) => {
    setCapturedBatch(prev => prev.filter(card => card.id !== id));
  }, []);

  // Clear entire batch
  const clearBatch = useCallback(() => {
    setCapturedBatch([]);
    setShowBatchGallery(false);
  }, []);

  // Continue scanning next card
  const continueScanning = useCallback(() => {
    setCapturedImage(null);
    setMode('scanning');
    setShowBatchGallery(false);
    resetCapture();
  }, [resetCapture]);

  // Finish batch and send all images
  const finishBatch = useCallback(() => {
    if (capturedBatch.length > 0) {
      onBatchComplete?.(capturedBatch);
    }
  }, [capturedBatch, onBatchComplete]);

  // Toggle batch gallery
  const toggleBatchGallery = useCallback(() => {
    setShowBatchGallery(prev => !prev);
  }, []);

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('scanner-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setContainerSize({
          width: Math.min(rect.width, 640),
          height: Math.min(rect.height, 480),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  /**
   * Apply perspective transform to crop card using OpenCV
   */
  const applyPerspectiveTransform = useCallback((
    sourceImage: HTMLCanvasElement | HTMLVideoElement,
    points: CalibrationPoint[],
    containerW: number,
    containerH: number
  ): string | null => {
    if (!cv) return null;
    if (
      typeof cv.getPerspectiveTransform !== 'function' ||
      typeof cv.warpPerspective !== 'function'
    ) {
      onError?.(new Error('OpenCV build missing perspective transform functions (imgproc module).'));
      return null;
    }

    let srcMat: any = null;
    let dstMat: any = null;
    let M: any = null;
    let srcPts: any = null;
    let dstPts: any = null;

    try {
      // Create source matrix from canvas or video
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = containerW;
      tempCanvas.height = containerH;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(sourceImage, 0, 0, containerW, containerH);
      
      // Read image data into OpenCV Mat
      const imgData = ctx.getImageData(0, 0, containerW, containerH);
      srcMat = cv.matFromArray(containerH, containerW, cv.CV_8UC4, Array.from(imgData.data));
      
      // Create destination matrix
      dstMat = new cv.Mat();

      // Source points (calibration corners in pixel coordinates)
      const srcCoords = points.map(p => ({
        x: p.x * containerW,
        y: p.y * containerH
      }));
      
      srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
        srcCoords[0].x, srcCoords[0].y, // Top-left
        srcCoords[1].x, srcCoords[1].y, // Top-right
        srcCoords[2].x, srcCoords[2].y, // Bottom-right
        srcCoords[3].x, srcCoords[3].y, // Bottom-left
      ]);

      // Destination points (target rectangle)
      dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,                           // Top-left
        TARGET_WIDTH, 0,                // Top-right
        TARGET_WIDTH, TARGET_HEIGHT,    // Bottom-right
        0, TARGET_HEIGHT,               // Bottom-left
      ]);

      // Calculate perspective transform matrix
      M = cv.getPerspectiveTransform(srcPts, dstPts);

      // Apply warp perspective
      const dsize = new cv.Size(TARGET_WIDTH, TARGET_HEIGHT);
      cv.warpPerspective(srcMat, dstMat, M, dsize);

      // Convert result to canvas and then to base64
      const outputCanvas = outputCanvasRef.current;
      if (!outputCanvas) return null;
      
      outputCanvas.width = TARGET_WIDTH;
      outputCanvas.height = TARGET_HEIGHT;
      const outputCtx = outputCanvas.getContext('2d');
      if (!outputCtx) return null;

      // Create ImageData from Mat
      const resultData = new ImageData(
        new Uint8ClampedArray(dstMat.data),
        TARGET_WIDTH,
        TARGET_HEIGHT
      );
      outputCtx.putImageData(resultData, 0, 0);

      // Return base64 image
      return outputCanvas.toDataURL('image/jpeg', 0.95);
    } catch (err) {
      console.error('[CardScanner] Perspective transform error:', err);
      return null;
    } finally {
      // CRITICAL: Clean up OpenCV matrices to prevent memory leaks
      safeDeleteMat(srcMat);
      safeDeleteMat(dstMat);
      safeDeleteMat(M);
      safeDeleteMat(srcPts);
      safeDeleteMat(dstPts);
    }
  }, [cv, onError]);

  /**
   * Process frame for auto-capture
   */
  const processScanningFrame = useCallback(() => {
    const liveVideo = webcamRef.current?.video as HTMLVideoElement | null;
    if (!liveVideo || !canvasRef.current || processingRef.current) return;

    processingRef.current = true;

    // Auto-capture detection
    const shouldCapture = processFrame(liveVideo, canvasRef.current);

    if (shouldCapture && !isProcessing) {
      setIsProcessing(true);
      
      // Capture and process
      const captured = applyPerspectiveTransform(
        liveVideo,
        calibrationPoints,
        containerSize.width,
        containerSize.height
      );

      if (captured) {
        setCapturedImage(captured);
        onCapture?.(captured);
        
        // In batch mode, add to batch and show review
        if (batchMode) {
          addToBatch(captured);
          setMode('review');
        }
        
        resetCapture();
      }

      setIsProcessing(false);
    }

    processingRef.current = false;
  }, [processFrame, applyPerspectiveTransform, calibrationPoints, containerSize, isProcessing, onCapture, resetCapture]);

  /**
   * Manual capture trigger (for mobile shutter button)
   */
  const manualCapture = useCallback(() => {
    const liveVideo = webcamRef.current?.video as HTMLVideoElement | null;
    if (!liveVideo || isProcessing || mode !== 'scanning') return;

    setIsProcessing(true);
    
    const captured = applyPerspectiveTransform(
      liveVideo,
      calibrationPoints,
      containerSize.width,
      containerSize.height
    );

    if (captured) {
      setCapturedImage(captured);
      onCapture?.(captured);
      
      if (batchMode) {
        addToBatch(captured);
        setMode('review');
      }
    }

    setIsProcessing(false);
  }, [applyPerspectiveTransform, calibrationPoints, containerSize, isProcessing, mode, onCapture, batchMode, addToBatch]);

  /**
   * Start scanning loop with requestAnimationFrame
   */
  useEffect(() => {
    if (mode !== 'scanning' || cvStatus !== 'ready') return;

    const liveVideo = webcamRef.current?.video as HTMLVideoElement | null;

    const loop = () => {
      processScanningFrame();
      rafRef.current = requestAnimationFrame(loop);
    };

    // Lock focus if supported
    const video = liveVideo;
    if (video?.srcObject) {
      const track = (video.srcObject as MediaStream).getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as { focusMode?: string[] } | undefined;
      
      if (capabilities?.focusMode?.includes('continuous')) {
        track.applyConstraints({
          advanced: [{ focusMode: 'continuous' }]
        } as unknown as MediaTrackConstraints).catch(() => {
          // Focus lock not supported, continue anyway
        });
        focusLockRef.current = true;
      }
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      focusLockRef.current = false;
    };
  }, [mode, cvStatus, processScanningFrame]);

  /**
   * Handle calibration point drag
   */
  const handlePointDrag = useCallback((e: React.MouseEvent | React.TouchEvent, pointId: number) => {
    e.preventDefault();
    setIsDragging(pointId);
  }, []);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging === null) return;

    const container = document.getElementById('scanner-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    setCalibrationPoints(prev => 
      prev.map(p => p.id === isDragging ? { ...p, x, y } : p)
    );
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    setIsDragging(null);
  }, []);

  /**
   * Save calibration to localStorage
   */
  const saveCalibration = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calibrationPoints));
    setMode('scanning');
    resetCapture();
  }, [calibrationPoints, resetCapture]);

  /**
   * Reset to calibration mode
   */
  const resetCalibration = useCallback(() => {
    setMode('calibration');
    setCapturedImage(null);
    resetCapture();
  }, [resetCapture]);

  // Handle mouse/touch events for dragging
  useEffect(() => {
    if (isDragging === null) return;

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      const container = document.getElementById('scanner-container');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      
      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

      setCalibrationPoints(prev => 
        prev.map(p => p.id === isDragging ? { ...p, x, y } : p)
      );
    };

    const handleGlobalEnd = () => {
      setIsDragging(null);
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDragging]);

  // Calculate point positions in pixels
  const getPointPosition = (point: CalibrationPoint) => ({
    left: `${point.x * 100}%`,
    top: `${point.y * 100}%`,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Status Bar with Progress */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            cvStatus === 'ready' ? 'bg-green-500' :
            cvStatus === 'loading' || cvStatus === 'initializing' ? 'bg-yellow-500 animate-pulse' :
            cvStatus === 'error' ? 'bg-red-500' :
            'bg-gray-400'
          }`} />
          <div className="flex-1 min-w-0">
            <span className="text-sm text-zinc-400 block truncate">
              {cvStatus === 'ready' ? 'OpenCV Pronto' :
               cvStatus === 'loading' ? 'Scaricamento OpenCV...' :
               cvStatus === 'initializing' ? 'Inizializzazione WASM...' :
               cvStatus === 'error' ? 'Errore OpenCV' :
               'OpenCV non caricato'}
            </span>
            {(cvStatus === 'loading' || cvStatus === 'initializing') && (
              <div className="mt-1.5 h-1 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-200 ease-out"
                  style={{ width: `${cvProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {cvStatus === 'idle' && (
            <button
              onClick={handleLoadOpenCV}
              disabled={isOpenCVLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isOpenCVLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isOpenCVLoading ? `${Math.round(cvProgress)}%` : 'Carica'}
            </button>
          )}
          {mode === 'scanning' && cvStatus === 'ready' && (
            <button
              onClick={resetCalibration}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-zinc-300 hover:text-white bg-zinc-800/80 rounded-lg transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              Ricalibra
            </button>
          )}
        </div>
      </div>

      {/* Scanner Container */}
      <div 
        id="scanner-container"
        className="relative rounded-xl overflow-hidden bg-black border border-zinc-700"
        style={{ aspectRatio: '4/3' }}
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        onMouseUp={handleEnd}
        onTouchEnd={handleEnd}
      >
        {/* Webcam Feed - Hidden UI */}
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 },
          }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: mode === 'review' ? 'none' : 'block' }}
        />

        {/* Lazy Load Prompt - Show when OpenCV not loaded */}
        {cvStatus === 'idle' && (
          <div className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center p-6">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ScanLine className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Scanner Carte TCG
              </h3>
              <p className="text-sm text-zinc-400 mb-6">
                Richiede OpenCV.js (~10 MB) per l&apos;elaborazione delle immagini.
                Carica una sola volta per questa sessione.
              </p>
              <button
                onClick={handleLoadOpenCV}
                disabled={isOpenCVLoading}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isOpenCVLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Caricamento {Math.round(cvProgress)}%</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Avvia Scanner</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {(cvStatus === 'loading' || cvStatus === 'initializing') && (
          <div className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center p-6">
            <div className="text-center max-w-sm">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {cvStatus === 'loading' ? 'Scaricamento...' : 'Inizializzazione...'}
              </h3>
              <div className="w-48 h-2 bg-zinc-700 rounded-full overflow-hidden mx-auto mb-2">
                <div 
                  className="h-full bg-primary transition-all duration-200 ease-out"
                  style={{ width: `${cvProgress}%` }}
                />
              </div>
              <p className="text-sm text-zinc-500">
                {Math.round(cvProgress)}% completato
              </p>
              <p className="text-xs text-zinc-600 mt-4">
                La prima volta può richiedere 5-10 secondi
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {cvStatus === 'error' && (
          <div className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center p-6">
            <div className="text-center max-w-sm">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-xl">!</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Errore di Caricamento
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                Impossibile caricare OpenCV.js. Verifica la connessione e riprova.
              </p>
              <button
                onClick={handleLoadOpenCV}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Riprova</span>
              </button>
            </div>
          </div>
        )}

        {/* Calibration Mode Overlay */}
        {mode === 'calibration' && cvStatus === 'ready' && (
          <div className="absolute inset-0">
            {/* SVG Overlay with connecting lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <polygon
                points={calibrationPoints.map(p => `${p.x * 100},${p.y * 100}`).join(' ')}
                fill="rgba(255, 115, 0, 0.1)"
                stroke="#FF7300"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Draggable Points */}
            {calibrationPoints.map((point, index) => (
              <div
                key={point.id}
                className="absolute w-6 h-6 -ml-3 -mt-3 cursor-move touch-none z-10"
                style={getPointPosition(point)}
                onMouseDown={(e) => handlePointDrag(e, point.id)}
                onTouchStart={(e) => handlePointDrag(e, point.id)}
              >
                <div className={`
                  w-full h-full rounded-full border-2 transition-transform
                  ${isDragging === point.id 
                    ? 'bg-primary border-white scale-125' 
                    : 'bg-white/90 border-primary hover:scale-110'}
                `}>
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-black/50 px-1 rounded">
                    {['TL', 'TR', 'BR', 'BL'][index]}
                  </span>
                </div>
              </div>
            ))}

            {/* Calibration Instructions */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3">
              <p className="text-sm text-white text-center">
                Posiziona i 4 punti sugli angoli della carta nel dock
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={saveCalibration}
              className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Check className="w-4 h-4" />
              Salva
            </button>
          </div>
        )}

        {/* Scanning Mode Overlay */}
        {mode === 'scanning' && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner guides */}
            <svg className="absolute inset-0 w-full h-full">
              {calibrationPoints.map((p, i) => {
                const nextP = calibrationPoints[(i + 1) % 4];
                return (
                  <line
                    key={i}
                    x1={`${p.x * 100}%`}
                    y1={`${p.y * 100}%`}
                    x2={`${nextP.x * 100}%`}
                    y2={`${nextP.y * 100}%`}
                    stroke="rgba(255, 115, 0, 0.5)"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                  />
                );
              })}
            </svg>

            {/* Status indicator */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
                ${captureStatus === 'detecting' ? 'bg-yellow-500/20 text-yellow-400' :
                  captureStatus === 'stabilizing' ? 'bg-blue-500/20 text-blue-400' :
                  captureStatus === 'captured' ? 'bg-green-500/20 text-green-400' :
                  'bg-zinc-800/80 text-zinc-400'}
              `}>
                {captureStatus === 'detecting' && <ScanLine className="w-4 h-4 animate-pulse" />}
                {captureStatus === 'stabilizing' && <Loader2 className="w-4 h-4 animate-spin" />}
                {captureStatus === 'captured' && <Camera className="w-4 h-4" />}
                {captureStatus === 'idle' && <ScanLine className="w-4 h-4" />}
                
                {captureStatus === 'detecting' && 'Inserisci carta...'}
                {captureStatus === 'stabilizing' && `Stabilizzando ${Math.round(stabilityProgress * 100)}%`}
                {captureStatus === 'captured' && 'Catturato!'}
                {captureStatus === 'idle' && 'Pronto'}
              </div>
            </div>

            {/* Stability Progress Bar */}
            {captureStatus === 'stabilizing' && (
              <div className="absolute bottom-4 left-4 right-4 h-1 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-150"
                  style={{ width: `${stabilityProgress * 100}%` }}
                />
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex items-center gap-2 text-white">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Elaborazione...</span>
                </div>
              </div>
            )}

            {/* Manual Capture Button - Mobile Friendly */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-auto">
              <button
                onClick={manualCapture}
                disabled={isProcessing}
                className="w-20 h-20 bg-white/10 backdrop-blur-sm border-4 border-white rounded-full flex items-center justify-center active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
                  <Aperture className="w-7 h-7 text-zinc-900" />
                </div>
              </button>
            </div>

            {/* Batch counter badge */}
            {batchMode && capturedBatch.length > 0 && (
              <button
                onClick={toggleBatchGallery}
                className="absolute bottom-6 right-4 flex items-center gap-2 px-3 py-2 bg-zinc-800/90 backdrop-blur-sm text-white rounded-full pointer-events-auto hover:bg-zinc-700 transition-colors"
              >
                <Images className="w-4 h-4" />
                <span className="text-sm font-medium">{capturedBatch.length}</span>
              </button>
            )}
          </div>
        )}

        {/* Review Mode - Batch or Single Capture */}
        {mode === 'review' && capturedImage && (
          <div className="absolute inset-0 bg-zinc-900/98 flex flex-col p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Carta Catturata!</h3>
                  <p className="text-sm text-zinc-400">
                    {capturedBatch.length} {capturedBatch.length === 1 ? 'carta' : 'carte'} in batch
                  </p>
                </div>
              </div>
              <button
                onClick={toggleBatchGallery}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <Images className="w-4 h-4" />
                <span className="text-sm">Gallery</span>
                {capturedBatch.length > 0 && (
                  <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                    {capturedBatch.length}
                  </span>
                )}
              </button>
            </div>

            {/* Main captured image */}
            <div className="flex-1 flex items-center justify-center min-h-0">
              <img 
                src={capturedImage} 
                alt="Scanned card"
                className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
              />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={continueScanning}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Riprova</span>
              </button>
              <button
                onClick={continueScanning}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Scansiona Altra</span>
              </button>
            </div>

            {/* Finish batch button (only if batch has items) */}
            {capturedBatch.length > 0 && (
              <button
                onClick={finishBatch}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-colors"
              >
                <Check className="w-5 h-5" />
                <span>Completa Batch ({capturedBatch.length} carte)</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Batch Gallery Sidebar */}
        {showBatchGallery && (
          <div className="absolute inset-0 bg-black/80 z-50" onClick={toggleBatchGallery}>
            <div 
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-zinc-900 border-l border-zinc-700 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Gallery Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-white font-semibold">Carte Catturate</h3>
                  <p className="text-sm text-zinc-400">{capturedBatch.length} items</p>
                </div>
                <div className="flex items-center gap-2">
                  {capturedBatch.length > 0 && (
                    <button
                      onClick={clearBatch}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Cancella tutto"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={toggleBatchGallery}
                    className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Gallery Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {capturedBatch.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <Images className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nessuna carta catturata</p>
                    <p className="text-sm mt-1">Inizia a scannerizzare!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {capturedBatch.map((card, index) => (
                      <div key={card.id} className="relative group">
                        <img 
                          src={card.imageData}
                          alt={`Card ${index + 1}`}
                          className="w-full aspect-[630/880] object-cover rounded-lg bg-zinc-800"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg" />
                        <button
                          onClick={() => removeFromBatch(card.id)}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gallery Footer */}
              {capturedBatch.length > 0 && (
                <div className="p-4 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      finishBatch();
                      toggleBatchGallery();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-colors"
                  >
                    <Check className="w-5 h-5" />
                    <span>Completa Batch</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Processing Canvas - Hidden (used for frame analysis) */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Output Canvas - Hidden (used for perspective transform) */}
        <canvas
          ref={outputCanvasRef}
          className="hidden"
        />
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-zinc-400">
        {mode === 'calibration' ? (
          <p>Trascina i punti sugli angoli della carta fisica nel dock</p>
        ) : mode === 'review' ? (
          <p>Verifica la scansione e continua con la prossima carta</p>
        ) : mode === 'scanning' && batchMode ? (
          <p>Modalità batch attiva. Posiziona una carta per scannerizzare automaticamente.</p>
        ) : (
          <p>Posiziona una carta nel dock. Lo scanner la catturerà automaticamente.</p>
        )}
      </div>
    </div>
  );
}
