import { describe, expect, it } from 'vitest';

import { buildLandingPath, type LandingPathLayout } from '@/lib/brx-express/build-landing-path';

function desktopLayout(): LandingPathLayout {
  return {
    containerWidth: 1024,
    heroStart: { x: 462, y: 112, width: 100, height: 24 },
    cards: [
      { x: 48, y: 400, width: 440, height: 280 },
      { x: 536, y: 750, width: 440, height: 280 },
      { x: 48, y: 1100, width: 440, height: 280 },
      { x: 536, y: 1450, width: 340, height: 340 },
    ],
    terms: { x: 112, y: 1900, width: 800, height: 320 },
  };
}

function mobileLayout(): LandingPathLayout {
  return {
    containerWidth: 390,
    heroStart: { x: 145, y: 112, width: 100, height: 24 },
    cards: [
      { x: 24, y: 400, width: 342, height: 280 },
      { x: 24, y: 750, width: 342, height: 280 },
      { x: 24, y: 1100, width: 342, height: 280 },
      { x: 24, y: 1450, width: 342, height: 340 },
    ],
    terms: { x: 24, y: 1900, width: 342, height: 400 },
  };
}

describe('buildLandingPath', () => {
  it('genera pathD non vuoto e 4 cardMarks su desktop', () => {
    const { pathD, cardMarks, glyphMarks } = buildLandingPath(desktopLayout());
    expect(pathD.length).toBeGreaterThan(0);
    expect(pathD.startsWith('M ')).toBe(true);
    expect(cardMarks).toHaveLength(4);
    cardMarks.forEach((m) => {
      expect(m.d.length).toBeGreaterThan(0);
      expect(m.from).toBeLessThanOrEqual(m.to);
      expect(m.to).toBeLessThanOrEqual(m.end);
      expect(m.stars.length).toBeGreaterThanOrEqual(14);
    });
    expect(glyphMarks.length).toBe(4);
  });

  it('omette i glyph su layout mobile (cw < 768)', () => {
    const { glyphMarks, cardMarks, pathD } = buildLandingPath(mobileLayout());
    expect(pathD.length).toBeGreaterThan(0);
    expect(cardMarks).toHaveLength(4);
    expect(glyphMarks).toHaveLength(0);
  });

  it('è deterministico per lo stesso layout', () => {
    const a = buildLandingPath(desktopLayout());
    const b = buildLandingPath(desktopLayout());
    expect(a.pathD).toBe(b.pathD);
    expect(a.glyphMarks).toEqual(b.glyphMarks);
    expect(a.cardMarks.map((m) => m.d)).toEqual(b.cardMarks.map((m) => m.d));
  });
});
