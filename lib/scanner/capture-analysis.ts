export const ANALYSIS_WIDTH = 40;
export const ANALYSIS_HEIGHT = 56;

export interface CaptureQuality {
  brightness: number;
  contrast: number;
  edgeEnergy: number;
  glareRatio: number;
  darkRatio: number;
  usable: boolean;
}

export interface FrameSample {
  grayscale: Uint8Array;
  quality: CaptureQuality;
}

export interface CardCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CAPTURE_THRESHOLDS = {
  enterMotion: 0.045,
  stableMotion: 0.018,
  removalDifference: 0.075,
  stableFrames: 3,
  removalFrames: 2,
  tickMs: 120,
  minimumCaptureGapMs: 650,
} as const;

/**
 * Converte la cornice CSS centrale nelle coordinate del video sorgente quando
 * il tag video usa object-cover. Capture, quality gate ed embedding condividono
 * così esattamente la stessa regione 5:7 mostrata all'utente.
 */
export function getCardCropRect(
  videoWidth: number,
  videoHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): CardCropRect {
  if (videoWidth <= 0 || videoHeight <= 0) return { x: 0, y: 0, width: 0, height: 0 };

  if (viewportWidth > 0 && viewportHeight > 0) {
    const scale = Math.max(viewportWidth / videoWidth, viewportHeight / videoHeight);
    const cardWidthCss = Math.min(viewportWidth * 0.78, 290);
    const cardHeightCss = cardWidthCss * 7 / 5;
    const width = Math.min(videoWidth, cardWidthCss / scale);
    const height = Math.min(videoHeight, cardHeightCss / scale);
    return {
      x: (videoWidth - width) / 2,
      y: (videoHeight - height) / 2,
      width,
      height,
    };
  }

  const targetAspect = 5 / 7;
  let height = videoHeight * 0.86;
  let width = height * targetAspect;
  if (width > videoWidth * 0.86) {
    width = videoWidth * 0.86;
    height = width / targetAspect;
  }
  return {
    x: (videoWidth - width) / 2,
    y: (videoHeight - height) / 2,
    width,
    height,
  };
}

export function analyseFrame(imageData: ImageData): FrameSample {
  const { data, width, height } = imageData;
  const grayscale = new Uint8Array(width * height);
  let sum = 0;
  let sumSquares = 0;
  let glare = 0;
  let dark = 0;
  let edgeTotal = 0;
  let edgeCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = y * width + x;
      const offset = pixelIndex * 4;
      const luminance = Math.round(
        data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722,
      );
      grayscale[pixelIndex] = luminance;
      sum += luminance;
      sumSquares += luminance * luminance;
      if (luminance >= 245) glare++;
      if (luminance <= 18) dark++;
      if (x > 0) {
        edgeTotal += Math.abs(luminance - grayscale[pixelIndex - 1]);
        edgeCount++;
      }
      if (y > 0) {
        edgeTotal += Math.abs(luminance - grayscale[pixelIndex - width]);
        edgeCount++;
      }
    }
  }

  const count = grayscale.length;
  const brightness = sum / count;
  const variance = Math.max(0, sumSquares / count - brightness * brightness);
  const contrast = Math.sqrt(variance);
  const edgeEnergy = edgeCount > 0 ? edgeTotal / edgeCount : 0;
  const glareRatio = glare / count;
  const darkRatio = dark / count;
  const usable =
    brightness >= 32 &&
    brightness <= 225 &&
    contrast >= 18 &&
    edgeEnergy >= 7 &&
    glareRatio <= 0.28 &&
    darkRatio <= 0.35;

  return {
    grayscale,
    quality: { brightness, contrast, edgeEnergy, glareRatio, darkRatio, usable },
  };
}

export function frameDifference(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length || a.length === 0) return 1;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference += Math.abs(a[i] - b[i]);
  return difference / (a.length * 255);
}
