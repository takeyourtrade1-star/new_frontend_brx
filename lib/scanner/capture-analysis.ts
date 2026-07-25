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

export type AutoCapturePhase = 'seeking' | 'stabilizing' | 'awaiting_removal';

export interface AutoCaptureState {
  phase: AutoCapturePhase;
  stableFrames: number;
  removalFrames: number;
  /** Memorizza il passaggio della mano/lo spazio vuoto anche tra copie uguali. */
  removalObserved: boolean;
  lastCaptureAtMs: number | null;
}

export interface AutoCaptureInput {
  nowMs: number;
  usable: boolean;
  hasPreviousFrame: boolean;
  motion: number;
  changedFromCapture: number | null;
  manualCapture: boolean;
  canCapture: boolean;
  captureIntervalMs: number;
}

export type AutoCaptureAction = 'none' | 'capture' | 'rearmed';

export const CAPTURE_THRESHOLDS = {
  stableMotion: 0.022,
  removalStableMotion: 0.028,
  removalDifference: 0.06,
  stableFrames: 2,
  removalFrames: 2,
  tickMs: 90,
  minimumCaptureGapMs: 450,
} as const;

export function createAutoCaptureState(): AutoCaptureState {
  return {
    phase: 'seeking',
    stableFrames: 0,
    removalFrames: 0,
    removalObserved: false,
    lastCaptureAtMs: null,
  };
}

/**
 * Macchina a stati pura dell'auto-capture. La presenza è dedotta dalla qualità
 * del crop: non richiede un movimento iniziale, quindi funziona anche quando la
 * carta è già dentro la cornice all'avvio della camera.
 */
export function advanceAutoCapture(
  state: AutoCaptureState,
  input: AutoCaptureInput,
): { state: AutoCaptureState; action: AutoCaptureAction } {
  if (state.phase === 'awaiting_removal') {
    const pastMinimumGap =
      state.lastCaptureAtMs !== null &&
      input.nowMs - state.lastCaptureAtMs >= CAPTURE_THRESHOLDS.minimumCaptureGapMs;
    const sceneChanged =
      input.changedFromCapture !== null &&
      input.changedFromCapture >= CAPTURE_THRESHOLDS.removalDifference;
    const removalObserved =
      state.removalObserved || (pastMinimumGap && sceneChanged);
    // Un frame non utilizzabile può essere semplicemente la mano in transito:
    // registra il cambio scena, ma conta come conferma solo quando si è fermato.
    const sceneSettled =
      input.hasPreviousFrame && input.motion <= CAPTURE_THRESHOLDS.removalStableMotion;
    const removalFrames =
      pastMinimumGap && removalObserved && sceneSettled
        ? state.removalFrames + 1
        : 0;

    if (removalFrames >= CAPTURE_THRESHOLDS.removalFrames) {
      return {
        state: createAutoCaptureState(),
        action: 'rearmed',
      };
    }
    return {
      state: { ...state, removalFrames, removalObserved },
      action: 'none',
    };
  }

  const intervalElapsed =
    state.lastCaptureAtMs === null ||
    input.nowMs - state.lastCaptureAtMs >= Math.max(0, input.captureIntervalMs);

  if (input.manualCapture && input.canCapture && intervalElapsed) {
    return {
      state: {
        ...state,
        phase: 'stabilizing',
        stableFrames: 0,
        lastCaptureAtMs: input.nowMs,
      },
      action: 'capture',
    };
  }

  if (!input.usable) {
    return {
      state: { ...state, phase: 'seeking', stableFrames: 0 },
      action: 'none',
    };
  }

  // Un frame mosso ma ancora leggibile diventa il primo candidato della nuova
  // sequenza; il frame seguente deve confermarne la stabilità.
  const stableFrames =
    input.hasPreviousFrame && input.motion <= CAPTURE_THRESHOLDS.stableMotion
      ? state.stableFrames + 1
      : 1;
  const nextState: AutoCaptureState = {
    ...state,
    phase: 'stabilizing',
    stableFrames,
  };

  if (
    stableFrames >= CAPTURE_THRESHOLDS.stableFrames &&
    input.canCapture &&
    intervalElapsed
  ) {
    return {
      state: {
        ...nextState,
        stableFrames: 0,
        lastCaptureAtMs: input.nowMs,
      },
      action: 'capture',
    };
  }

  return { state: nextState, action: 'none' };
}

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

/**
 * Differenza strutturale che ignora uno spostamento uniforme dell'esposizione.
 * Evita di interpretare l'auto-esposizione della camera come rimozione carta.
 */
export function exposureInvariantFrameDifference(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length || a.length === 0) return 1;
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < a.length; i++) {
    sumA += a[i];
    sumB += b[i];
  }
  const meanDelta = (sumA - sumB) / a.length;
  let difference = 0;
  for (let i = 0; i < a.length; i++) {
    difference += Math.abs(a[i] - b[i] - meanDelta);
  }
  return Math.min(1, difference / (a.length * 255));
}
