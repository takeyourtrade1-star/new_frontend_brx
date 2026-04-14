/**
 * Card Scanner Web Worker
 * Handles OpenCV processing off the main thread to prevent UI blocking
 * 
 * This worker is an alternative to in-thread processing for better performance.
 * Note: OpenCV.js WASM currently doesn't work well in Web Workers due to
 * DOM dependencies. This is a placeholder for future implementations.
 * 
 * For now, the main thread handles processing with requestAnimationFrame
 * which provides adequate performance for 60 FPS operation.
 */

// Worker message types
const MSG_TYPES = {
  PROCESS_FRAME: 'PROCESS_FRAME',
  APPLY_PERSPECTIVE: 'APPLY_PERSPECTIVE',
  RESET: 'RESET',
  RESULT: 'RESULT',
  ERROR: 'ERROR',
};

/**
 * Placeholder for future Web Worker implementation
 * Currently OpenCV.js has limitations in Web Workers:
 * - Requires DOM access for canvas/image operations
 * - WASM memory management differs in worker context
 * 
 * For production use with heavy processing loads,
 * consider using:
 * 1. OffscreenCanvas API (limited browser support)
 * 2. WebGL-based image processing
 * 3. TensorFlow.js for ML-based card detection
 */

self.onmessage = function(e) {
  const { type, payload, id } = e.data;

  try {
    switch (type) {
      case MSG_TYPES.PROCESS_FRAME:
        // Future: Frame differencing in worker
        self.postMessage({
          type: MSG_TYPES.RESULT,
          id,
          payload: { shouldCapture: false }
        });
        break;

      case MSG_TYPES.APPLY_PERSPECTIVE:
        // Future: Perspective transform in worker
        self.postMessage({
          type: MSG_TYPES.RESULT,
          id,
          payload: { imageData: null }
        });
        break;

      case MSG_TYPES.RESET:
        self.postMessage({
          type: MSG_TYPES.RESULT,
          id,
          payload: { reset: true }
        });
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: MSG_TYPES.ERROR,
      id,
      error: error.message
    });
  }
};

// Keep worker alive
self.addEventListener('error', (e) => {
  console.error('[CardScanner Worker] Error:', e);
});
