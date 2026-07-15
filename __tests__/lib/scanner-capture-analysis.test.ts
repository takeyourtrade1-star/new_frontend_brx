import { describe, expect, it } from 'vitest';

import {
  analyseFrame,
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

  it('allinea il crop 5:7 alla cornice object-cover mostrata sul telefono', () => {
    const crop = getCardCropRect(1920, 1080, 390, 844);

    expect(crop.width / crop.height).toBeCloseTo(5 / 7, 5);
    expect(crop.x + crop.width / 2).toBeCloseTo(960, 5);
    expect(crop.y + crop.height / 2).toBeCloseTo(540, 5);
    expect(crop.x).toBeGreaterThanOrEqual(0);
    expect(crop.y).toBeGreaterThanOrEqual(0);
  });
});
