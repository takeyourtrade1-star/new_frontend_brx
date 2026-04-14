'use client';

import { useCallback, useRef, useState } from 'react';

export type CaptureStatus = 'idle' | 'detecting' | 'stabilizing' | 'captured';

interface UseAutoCaptureOptions {
  /** Threshold for pixel difference (0-255) */
  diffThreshold?: number;
  /** Minimum percentage of changed pixels to trigger detection (0-1) */
  changePercentageThreshold?: number;
  /** Number of stable frames required before capture */
  stabilityFramesRequired?: number;
  /** ROI dimensions {x, y, width, height} - normalized 0-1 or pixels */
  roi?: { x: number; y: number; width: number; height: number } | null;
}

interface UseAutoCaptureReturn {
  status: CaptureStatus;
  stabilityProgress: number; // 0-1
  lastDiffValue: number;
  processFrame: (videoEl: HTMLVideoElement, canvasEl: HTMLCanvasElement) => boolean;
  resetCapture: () => void;
  isStable: boolean;
}

/**
 * Hook implementing frame differencing with hysteresis for auto-capture.
 * Uses requestAnimationFrame for smooth 60 FPS processing.
 * 
 * Algorithm:
 * 1. Capture current frame from video
 * 2. Convert to grayscale
 * 3. Compare with previous frame using absolute difference
 * 4. Count pixels above threshold
 * 5. If change detected -> start stability counter
 * 6. If stable for N frames -> trigger capture
 */
export function useAutoCapture(options: UseAutoCaptureOptions = {}): UseAutoCaptureReturn {
  const {
    diffThreshold = 25,
    changePercentageThreshold = 0.05, // 5% of pixels must change
    stabilityFramesRequired = 4,
    roi = null,
  } = options;

  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [stabilityProgress, setStabilityProgress] = useState(0);
  const [lastDiffValue, setLastDiffValue] = useState(0);
  const [isStable, setIsStable] = useState(false);

  // Refs for processing (avoid re-renders during frame processing)
  const prevFrameRef = useRef<Uint8Array | null>(null);
  const stabilityCounterRef = useRef(0);
  const motionDetectedRef = useRef(false);
  const frameCountRef = useRef(0);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const resetCapture = useCallback(() => {
    prevFrameRef.current = null;
    stabilityCounterRef.current = 0;
    motionDetectedRef.current = false;
    frameCountRef.current = 0;
    setStatus('idle');
    setStabilityProgress(0);
    setIsStable(false);
    setLastDiffValue(0);
  }, []);

  /**
   * Convert frame to grayscale array
   */
  const toGrayscale = useCallback((imageData: ImageData): Uint8Array => {
    const data = imageData.data;
    const gray = new Uint8Array(imageData.width * imageData.height);
    
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      // Luminance formula: 0.299*R + 0.587*G + 0.114*B
      gray[j] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) | 0;
    }
    
    return gray;
  }, []);

  /**
   * Calculate absolute difference between two grayscale frames
   * Returns percentage of changed pixels
   */
  const calculateDiff = useCallback((
    prev: Uint8Array,
    curr: Uint8Array,
    width: number,
    height: number
  ): { diffPercentage: number; avgDiff: number } => {
    let diffPixels = 0;
    let totalDiff = 0;
    const totalPixels = width * height;

    // Apply ROI if specified
    let startX = 0, endX = width;
    let startY = 0, endY = height;

    if (roi) {
      startX = Math.floor((roi.x < 1 ? roi.x * width : roi.x));
      endX = Math.floor((roi.x + roi.width) < 1 
        ? (roi.x + roi.width) * width 
        : roi.x + roi.width);
      startY = Math.floor((roi.y < 1 ? roi.y * height : roi.y));
      endY = Math.floor((roi.y + roi.height) < 1 
        ? (roi.y + roi.height) * height 
        : roi.y + roi.height);
    }

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const idx = y * width + x;
        const diff = Math.abs(prev[idx] - curr[idx]);
        
        if (diff > diffThreshold) {
          diffPixels++;
        }
        totalDiff += diff;
      }
    }

    const roiPixels = (endX - startX) * (endY - startY);
    
    return {
      diffPercentage: diffPixels / roiPixels,
      avgDiff: totalDiff / roiPixels,
    };
  }, [diffThreshold, roi]);

  /**
   * Process a single frame. Returns true when capture should trigger.
   */
  const processFrame = useCallback((
    videoEl: HTMLVideoElement,
    canvasEl: HTMLCanvasElement
  ): boolean => {
    // Skip if video not ready
    if (!videoEl.videoWidth || videoEl.paused || videoEl.ended) {
      return false;
    }

    // Use smaller resolution for processing to maintain 60 FPS
    // Target ~480p for analysis
    const processWidth = 480;
    const processHeight = Math.floor(processWidth * (videoEl.videoHeight / videoEl.videoWidth));

    // Initialize canvas context once
    if (!ctxRef.current || canvasEl.width !== processWidth) {
      canvasEl.width = processWidth;
      canvasEl.height = processHeight;
      ctxRef.current = canvasEl.getContext('2d', { willReadFrequently: true });
    }

    const ctx = ctxRef.current;
    if (!ctx) return false;

    // Draw current video frame to processing canvas
    ctx.drawImage(videoEl, 0, 0, processWidth, processHeight);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, processWidth, processHeight);
    const grayFrame = toGrayscale(imageData);

    let shouldCapture = false;

    if (prevFrameRef.current === null) {
      // First frame - just store it
      prevFrameRef.current = grayFrame;
      setStatus('detecting');
    } else {
      // Compare with previous frame
      const prevGray = prevFrameRef.current;
      
      // Check if dimensions match (in case of resize)
      if (prevGray.length === grayFrame.length) {
        const { diffPercentage, avgDiff } = calculateDiff(
          prevGray, 
          grayFrame, 
          processWidth, 
          processHeight
        );

        setLastDiffValue(Math.round(avgDiff));

        // Detect movement first, then require N stable frames (low diff) before capture.
        if (diffPercentage > changePercentageThreshold) {
          motionDetectedRef.current = true;
          stabilityCounterRef.current = 0;
          setStabilityProgress(0);
          setIsStable(false);
          setStatus('detecting');
        } else if (motionDetectedRef.current) {
          setStatus('stabilizing');
          stabilityCounterRef.current = Math.min(
            stabilityCounterRef.current + 1,
            stabilityFramesRequired
          );

          setStabilityProgress(stabilityCounterRef.current / stabilityFramesRequired);

          if (stabilityCounterRef.current >= stabilityFramesRequired) {
            setIsStable(true);
            setStatus('captured');
            shouldCapture = true;
            motionDetectedRef.current = false;
            stabilityCounterRef.current = 0;
          }
        } else {
          setStatus('detecting');
        }
      }

      // Update previous frame
      prevFrameRef.current = grayFrame;
    }

    frameCountRef.current++;
    return shouldCapture;
  }, [changePercentageThreshold, stabilityFramesRequired, toGrayscale, calculateDiff]);

  return {
    status,
    stabilityProgress,
    lastDiffValue,
    processFrame,
    resetCapture,
    isStable,
  };
}
