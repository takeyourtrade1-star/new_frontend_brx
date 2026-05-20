/** DINOv2 224×224 preprocess — tuned for live scanner (reused buffers). */

export const ONNX_SIZE = 224;
const PIXELS = ONNX_SIZE * ONNX_SIZE;

const IMAGENET_MEAN = [0.485, 0.456, 0.406] as const;
const IMAGENET_STD = [0.229, 0.224, 0.225] as const;
const INV255 = 1 / 255;

export function createTensorBuffer(): Float32Array {
  return new Float32Array(3 * PIXELS);
}

export function imageDataToTensor(imageData: ImageData, into: Float32Array): void {
  const { data } = imageData;
  for (let i = 0; i < PIXELS; i++) {
    const o = i * 4;
    into[i] = (data[o] * INV255 - IMAGENET_MEAN[0]) / IMAGENET_STD[0];
    into[PIXELS + i] = (data[o + 1] * INV255 - IMAGENET_MEAN[1]) / IMAGENET_STD[1];
    into[2 * PIXELS + i] = (data[o + 2] * INV255 - IMAGENET_MEAN[2]) / IMAGENET_STD[2];
  }
}

/** Fast frame fingerprint — skip duplicate consecutive frames. */
export function frameFingerprint(imageData: ImageData): number {
  const d = imageData.data;
  let h = 2166136261;
  for (let i = 0; i < d.length; i += 256) {
    h ^= d[i];
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function captureFrame224(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): ImageData | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh || video.readyState < 2) return null;

  const side = Math.min(vw, vh);
  const sx = (vw - side) / 2;
  const sy = (vh - side) / 2;
  ctx.drawImage(video, sx, sy, side, side, 0, 0, ONNX_SIZE, ONNX_SIZE);
  return ctx.getImageData(0, 0, ONNX_SIZE, ONNX_SIZE);
}

export function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function vectorSearchJson(vec: Float32Array, topK: number): string {
  const u8 = new Uint8Array(vec.buffer, vec.byteOffset, vec.byteLength);
  return JSON.stringify({
    vector_b64: bytesToBase64(u8),
    top_k: topK,
    mode: 'fast',
  });
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
