import { describe, expect, it } from 'vitest';

import {
  smoothPath,
  roundedRectPerimeter,
  diamondPerimeter,
  nearestIdx,
  wrapShape,
  rotPts,
  unit,
  densify,
  glyphTruck,
  type Pt
} from '@/lib/brx-express/smooth-path';

describe('smoothPath', () => {
  it('returns empty string for fewer than 2 distinct points', () => {
    expect(smoothPath([])).toBe('');
    expect(smoothPath([{ x: 0, y: 0 }])).toBe('');
    // near-duplicates collapse to a single point -> empty
    expect(smoothPath([{ x: 0, y: 0 }, { x: 0.1, y: 0.1 }])).toBe('');
  });

  it('starts with a move command at the first point', () => {
    const d = smoothPath([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 50 }
    ]);
    expect(d.startsWith('M 0.0 0.0')).toBe(true);
    expect(d).toContain(' C ');
  });

  it('drops near-duplicate consecutive points (chord <= 0.6)', () => {
    const withDup = smoothPath([
      { x: 0, y: 0 },
      { x: 0.3, y: 0.3 }, // dropped (chord ~0.42)
      { x: 50, y: 0 },
      { x: 100, y: 50 }
    ]);
    const clean = smoothPath([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 50 }
    ]);
    expect(withDup).toBe(clean);
  });
});

describe('roundedRectPerimeter', () => {
  const rad = {
    tl: [4, 4] as [number, number],
    tr: [4, 4] as [number, number],
    br: [4, 4] as [number, number],
    bl: [4, 4] as [number, number]
  };

  it('produces a non-empty closed-ish ring of points', () => {
    const ring = roundedRectPerimeter(0, 0, 100, 60, rad);
    expect(ring.length).toBeGreaterThan(8);
    // every point lies within the rect bounds (corners are inset arcs)
    for (const p of ring) {
      expect(p.x).toBeGreaterThanOrEqual(-0.01);
      expect(p.x).toBeLessThanOrEqual(100.01);
      expect(p.y).toBeGreaterThanOrEqual(-0.01);
      expect(p.y).toBeLessThanOrEqual(60.01);
    }
  });

  it('first sampled point sits on the top edge', () => {
    const ring = roundedRectPerimeter(0, 0, 100, 60, rad);
    expect(ring[0]!.y).toBeCloseTo(0, 5);
  });
});

describe('diamondPerimeter', () => {
  it('emits perEdge points per edge (4 edges)', () => {
    const pts = diamondPerimeter(0, 0, 100, 100, 0, 10);
    expect(pts.length).toBe(40);
  });

  it('offset pushes the top vertex above the box', () => {
    const pts = diamondPerimeter(0, 0, 100, 100, 12);
    expect(pts[0]!).toEqual({ x: 50, y: -12 });
  });
});

describe('nearestIdx', () => {
  it('returns the index of the closest point', () => {
    const ring: Pt[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 }
    ];
    expect(nearestIdx(ring, { x: 9, y: 1 })).toBe(1);
    expect(nearestIdx(ring, { x: 21, y: 0 })).toBe(2);
  });
});

describe('wrapShape', () => {
  it('walks at least 3 points when no exit given', () => {
    const ring: Pt[] = Array.from({ length: 8 }, (_, i) => ({ x: i, y: 0 }));
    const out = wrapShape(ring, { x: 0, y: 0 }, false);
    expect(out.length).toBeGreaterThanOrEqual(4); // extra=3 -> k from 0..3
  });

  it('full mode traces the whole ring', () => {
    const ring: Pt[] = Array.from({ length: 8 }, (_, i) => ({ x: i, y: 0 }));
    const out = wrapShape(ring, { x: 0, y: 0 }, false, undefined, true);
    expect(out.length).toBeGreaterThan(ring.length);
  });
});

describe('rotPts', () => {
  it('is identity for angle 0', () => {
    const pts: Pt[] = [{ x: 5, y: 7 }];
    const r = rotPts(pts, 0, 0, 0);
    expect(r[0]!.x).toBeCloseTo(5, 6);
    expect(r[0]!.y).toBeCloseTo(7, 6);
  });

  it('rotates 90deg about the origin', () => {
    const r = rotPts([{ x: 1, y: 0 }], 0, 0, Math.PI / 2);
    expect(r[0]!.x).toBeCloseTo(0, 6);
    expect(r[0]!.y).toBeCloseTo(1, 6);
  });
});

describe('unit', () => {
  it('normalizes a vector to length 1', () => {
    const u = unit(3, 4);
    expect(u).not.toBeNull();
    expect(Math.hypot(u!.x, u!.y)).toBeCloseTo(1, 6);
  });

  it('returns null for a near-zero vector', () => {
    expect(unit(0, 0)).toBeNull();
    expect(unit(1e-4, 1e-4)).toBeNull();
  });
});

describe('densify', () => {
  it('keeps the first point and adds intermediate samples', () => {
    const out = densify([{ x: 0, y: 0 }, { x: 70, y: 0 }], 7);
    expect(out[0]!).toEqual({ x: 0, y: 0 });
    expect(out.length).toBeGreaterThan(2);
    expect(out[out.length - 1]!).toEqual({ x: 70, y: 0 });
  });
});

describe('glyphTruck', () => {
  it('returns a body ring plus two non-empty wheels', () => {
    const { body, rearWheel, frontWheel } = glyphTruck(100, 100, 100);
    expect(body.length).toBeGreaterThan(10);
    expect(rearWheel.length).toBe(14);
    expect(frontWheel.length).toBe(14);
  });
});
