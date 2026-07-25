import { describe, expect, it } from 'vitest';

import {
  advanceAutoCapture,
  analyseFrame,
  CAPTURE_THRESHOLDS,
  createAutoCaptureState,
  exposureInvariantFrameDifference,
  frameDifference,
  getCardCropRect,
} from '@/lib/scanner/capture-analysis';

function imageDataFromLuminance(width: number, height: number, values: number[]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const value = values[i] ?? 0;
    const offset = i * 4;
    data[offset] = value;
    data[offset + 1] = value;
    data[offset + 2] = value;
    data[offset + 3] = 255;
  }
  return { data, width, height, colorSpace: 'srgb' } as ImageData;
}

describe('capture analysis', () => {
  it('rifiuta un frame uniforme privo di dettaglio', () => {
    const frame = imageDataFromLuminance(8, 8, Array(64).fill(120));
    const sample = analyseFrame(frame);

    expect(sample.quality.usable).toBe(false);
    expect(sample.quality.contrast).toBe(0);
    expect(sample.quality.edgeEnergy).toBe(0);
  });

  it('accetta un frame esposto con contrasto e bordi', () => {
    const values = Array.from({ length: 64 }, (_, index) =>
      (Math.floor(index / 8) + index) % 2 === 0 ? 55 : 205,
    );
    const sample = analyseFrame(imageDataFromLuminance(8, 8, values));

    expect(sample.quality.usable).toBe(true);
    expect(sample.quality.brightness).toBeGreaterThan(32);
    expect(sample.quality.glareRatio).toBe(0);
  });

  it('normalizza la differenza tra frame nell’intervallo 0..1', () => {
    const black = new Uint8Array([0, 0, 0, 0]);
    const white = new Uint8Array([255, 255, 255, 255]);

    expect(frameDifference(black, black)).toBe(0);
    expect(frameDifference(black, white)).toBe(1);
  });

  it('cattura una carta già presente dopo due frame buoni senza richiedere movimento', () => {
    const first = advanceAutoCapture(createAutoCaptureState(), {
      nowMs: 0,
      usable: true,
      hasPreviousFrame: false,
      motion: 0,
      changedFromCapture: null,
      manualCapture: false,
      canCapture: true,
      captureIntervalMs: 220,
    });
    const second = advanceAutoCapture(first.state, {
      nowMs: CAPTURE_THRESHOLDS.tickMs,
      usable: true,
      hasPreviousFrame: true,
      motion: 0,
      changedFromCapture: null,
      manualCapture: false,
      canCapture: true,
      captureIntervalMs: 220,
    });

    expect(first.state.phase).toBe('stabilizing');
    expect(first.action).toBe('none');
    expect(second.action).toBe('capture');
  });

  it('riavvia la stabilizzazione quando il frame si muove', () => {
    const first = advanceAutoCapture(createAutoCaptureState(), {
      nowMs: 0,
      usable: true,
      hasPreviousFrame: false,
      motion: 0,
      changedFromCapture: null,
      manualCapture: false,
      canCapture: true,
      captureIntervalMs: 220,
    });
    const moving = advanceAutoCapture(first.state, {
      nowMs: 90,
      usable: true,
      hasPreviousFrame: true,
      motion: CAPTURE_THRESHOLDS.stableMotion + 0.01,
      changedFromCapture: null,
      manualCapture: false,
      canCapture: true,
      captureIntervalMs: 220,
    });
    const settled = advanceAutoCapture(moving.state, {
      nowMs: 180,
      usable: true,
      hasPreviousFrame: true,
      motion: 0,
      changedFromCapture: null,
      manualCapture: false,
      canCapture: true,
      captureIntervalMs: 220,
    });

    expect(moving.state.stableFrames).toBe(1);
    expect(moving.action).toBe('none');
    expect(settled.action).toBe('capture');
  });

  it('rispetta captureIntervalMs tra due richieste della stessa carta', () => {
    const state = {
      phase: 'stabilizing' as const,
      stableFrames: CAPTURE_THRESHOLDS.stableFrames,
      removalFrames: 0,
      removalObserved: false,
      lastCaptureAtMs: 1_000,
    };
    const tooSoon = advanceAutoCapture(state, {
      nowMs: 1_150,
      usable: true,
      hasPreviousFrame: true,
      motion: 0,
      changedFromCapture: null,
      manualCapture: false,
      canCapture: true,
      captureIntervalMs: 220,
    });
    const ready = advanceAutoCapture(tooSoon.state, {
      nowMs: 1_220,
      usable: true,
      hasPreviousFrame: true,
      motion: 0,
      changedFromCapture: null,
      manualCapture: false,
      canCapture: true,
      captureIntervalMs: 220,
    });

    expect(tooSoon.action).toBe('none');
    expect(ready.action).toBe('capture');
  });

  it('riarma solo dopo due frame cambiati e stabili oltre il gap minimo', () => {
    const awaiting = {
      phase: 'awaiting_removal' as const,
      stableFrames: 0,
      removalFrames: 0,
      removalObserved: false,
      lastCaptureAtMs: 1_000,
    };
    const tooEarly = advanceAutoCapture(awaiting, {
      nowMs: 1_200,
      usable: true,
      hasPreviousFrame: true,
      motion: 0,
      changedFromCapture: 0.2,
      manualCapture: false,
      canCapture: true,
      captureIntervalMs: 220,
    });
    const firstChanged = advanceAutoCapture(tooEarly.state, {
      nowMs: 1_500,
      usable: true,
      hasPreviousFrame: true,
      motion: 0,
      changedFromCapture: 0.2,
      manualCapture: false,
      canCapture: true,
      captureIntervalMs: 220,
    });
    const changedButMoving = advanceAutoCapture(firstChanged.state, {
      nowMs: 1_590,
      usable: true,
      hasPreviousFrame: true,
      motion: CAPTURE_THRESHOLDS.removalStableMotion + 0.01,
      changedFromCapture: 0.2,
      manualCapture: false,
      canCapture: true,
      captureIntervalMs: 220,
    });
    const settledOnce = advanceAutoCapture(changedButMoving.state, {
      nowMs: 1_680,
      usable: true,
      hasPreviousFrame: true,
      motion: 0,
      changedFromCapture: 0.2,
      manualCapture: false,
      canCapture: true,
      captureIntervalMs: 220,
    });
    const settledTwice = advanceAutoCapture(settledOnce.state, {
      nowMs: 1_770,
      usable: true,
      hasPreviousFrame: true,
      motion: 0,
      changedFromCapture: 0.2,
      manualCapture: false,
      canCapture: true,
      captureIntervalMs: 220,
    });

    expect(tooEarly.state.removalFrames).toBe(0);
    expect(firstChanged.state.removalFrames).toBe(1);
    expect(changedButMoving.state.removalFrames).toBe(0);
    expect(settledOnce.action).toBe('none');
    expect(settledTwice.action).toBe('rearmed');
  });

  it('riarma anche quando una copia identica sostituisce la precedente', () => {
    const awaiting = {
      phase: 'awaiting_removal' as const,
      stableFrames: 0,
      removalFrames: 0,
      removalObserved: false,
      lastCaptureAtMs: 1_000,
    };
    const handPassing = advanceAutoCapture(awaiting, {
      nowMs: 1_500,
      usable: false,
      hasPreviousFrame: true,
      motion: 0.2,
      changedFromCapture: 0.25,
      manualCapture: false,
      canCapture: true,
      captureIntervalMs: 220,
    });
    const identicalCopySettledOnce = advanceAutoCapture(handPassing.state, {
      nowMs: 1_590,
      usable: true,
      hasPreviousFrame: true,
      motion: 0,
      changedFromCapture: 0.005,
      manualCapture: false,
      canCapture: true,
      captureIntervalMs: 220,
    });
    const identicalCopySettledTwice = advanceAutoCapture(
      identicalCopySettledOnce.state,
      {
        nowMs: 1_680,
        usable: true,
        hasPreviousFrame: true,
        motion: 0,
        changedFromCapture: 0.005,
        manualCapture: false,
        canCapture: true,
        captureIntervalMs: 220,
      },
    );

    expect(handPassing.state.removalObserved).toBe(true);
    expect(identicalCopySettledOnce.action).toBe('none');
    expect(identicalCopySettledTwice.action).toBe('rearmed');
  });

  it('non scambia una variazione uniforme di esposizione per una nuova scena', () => {
    const original = new Uint8Array([20, 50, 80, 110, 140, 170]);
    const brighter = new Uint8Array([50, 80, 110, 140, 170, 200]);

    expect(frameDifference(original, brighter)).toBeGreaterThan(0);
    expect(exposureInvariantFrameDifference(original, brighter)).toBeCloseTo(0, 8);
  });

  it('allinea il crop 5:7 alla cornice object-cover mostrata sul telefono', () => {
    const crop = getCardCropRect(1920, 1080, 390, 844);

    expect(crop.width / crop.height).toBeCloseTo(5 / 7, 5);
    expect(crop.x + crop.width / 2).toBeCloseTo(960, 5);
    expect(crop.y + crop.height / 2).toBeCloseTo(540, 5);
    expect(crop.x).toBeGreaterThanOrEqual(0);
    expect(crop.y).toBeGreaterThanOrEqual(0);
  });
});
