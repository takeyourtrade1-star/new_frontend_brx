// Pure geometry/path helpers for the BRX Express landing animation.
// Extracted from BrxExpressLanding.tsx: no React, no DOM — just math, so it can
// be unit-tested in isolation and kept out of the component's render surface.

export type Pt = { x: number; y: number };

// Math Helper: CENTRIPETAL Catmull-Rom -> cubic Bezier (Yuksel-Schaefer-Keyser).
// Centripetal parameterization (alpha = 0.5) is the only one mathematically
// guaranteed to produce no cusps, loops or self-intersections within segments —
// it's what removes the random kinks the old uniform spline created.
export function smoothPath(raw: Pt[], alpha = 0.5): string {
  // Drop near-duplicate consecutive points: zero-length chords destabilize
  // the parameterization and show up as kinks.
  const points: Pt[] = [];
  for (const p of raw) {
    const q = points[points.length - 1];
    if (!q || Math.hypot(p.x - q.x, p.y - q.y) > 0.6) points.push(p);
  }
  if (points.length < 2) return '';

  let d = `M ${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`;

  // Duplicate endpoints to compute control points for the first/last segments
  const pts = [points[0]!, ...points, points[points.length - 1]!];

  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2]!;

    const d1 = Math.max(Math.hypot(p1.x - p0.x, p1.y - p0.y), 1e-4) ** alpha;
    const d2 = Math.max(Math.hypot(p2.x - p1.x, p2.y - p1.y), 1e-4) ** alpha;
    const d3 = Math.max(Math.hypot(p3.x - p2.x, p3.y - p2.y), 1e-4) ** alpha;
    const d1sq = d1 * d1;
    const d2sq = d2 * d2;
    const d3sq = d3 * d3;

    const n1 = 3 * d1 * (d1 + d2);
    const n2 = 3 * d3 * (d3 + d2);
    const cp1x = (d1sq * p2.x - d2sq * p0.x + (2 * d1sq + 3 * d1 * d2 + d2sq) * p1.x) / n1;
    const cp1y = (d1sq * p2.y - d2sq * p0.y + (2 * d1sq + 3 * d1 * d2 + d2sq) * p1.y) / n1;
    const cp2x = (d3sq * p1.x - d2sq * p3.x + (2 * d3sq + 3 * d3 * d2 + d2sq) * p2.x) / n2;
    const cp2y = (d3sq * p1.y - d2sq * p3.y + (2 * d3sq + 3 * d3 * d2 + d2sq) * p2.y) / n2;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

export type CornerRadii = {
  tl: [number, number];
  tr: [number, number];
  br: [number, number];
  bl: [number, number];
};

// Dense CW perimeter of a rounded rect with per-corner elliptical radii.
// Sampling the REAL outline lets the line hug each shape perfectly.
export function roundedRectPerimeter(
  x: number,
  y: number,
  w: number,
  h: number,
  rad: CornerRadii,
  edgeStep = 20,
  arcStep = Math.PI / 9
): Pt[] {
  const pts: Pt[] = [];

  const line = (x1: number, y1: number, x2: number, y2: number) => {
    const d = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(1, Math.round(d / edgeStep));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
    }
  };

  const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number) => {
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / arcStep));
    for (let i = 0; i < n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
    }
  };

  const { tl, tr, br, bl } = rad;
  line(x + tl[0], y, x + w - tr[0], y); // top
  arc(x + w - tr[0], y + tr[1], tr[0], tr[1], -Math.PI / 2, 0); // tr corner
  line(x + w, y + tr[1], x + w, y + h - br[1]); // right
  arc(x + w - br[0], y + h - br[1], br[0], br[1], 0, Math.PI / 2); // br corner
  line(x + w - br[0], y + h, x + bl[0], y + h); // bottom
  arc(x + bl[0], y + h - bl[1], bl[0], bl[1], Math.PI / 2, Math.PI); // bl corner
  line(x, y + h - bl[1], x, y + tl[1]); // left
  arc(x + tl[0], y + tl[1], tl[0], tl[1], Math.PI, Math.PI * 1.5); // tl corner
  return pts;
}

// CW perimeter of the diamond card (clip-path polygon), offset outwards
export function diamondPerimeter(
  x: number,
  y: number,
  w: number,
  h: number,
  off: number,
  perEdge = 10
): Pt[] {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const corners: Pt[] = [
    { x: cx, y: y - off }, // top
    { x: x + w + off, y: cy }, // right
    { x: cx, y: y + h + off }, // bottom
    { x: x - off, y: cy } // left
  ];
  const pts: Pt[] = [];
  for (let e = 0; e < 4; e++) {
    const a = corners[e]!;
    const b = corners[(e + 1) % 4]!;
    for (let i = 0; i < perEdge; i++) {
      const t = i / perEdge;
      pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return pts;
}

export function nearestIdx(ring: Pt[], target: Pt): number {
  let bi = 0;
  let bd = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const d = (ring[i]!.x - target.x) ** 2 + (ring[i]!.y - target.y) ** 2;
    if (d < bd) {
      bd = d;
      bi = i;
    }
  }
  return bi;
}

// Walk a closed perimeter from the point nearest `entry` towards the point
// nearest `exit` (in the given direction). With `full` the loop is traced
// entirely before exiting (used for glyphs, so the whole shape is drawn).
export function wrapShape(
  perimeter: Pt[],
  entry: Pt,
  ccw: boolean,
  exit?: Pt,
  full = false
): Pt[] {
  const ring = ccw ? [...perimeter].reverse() : perimeter;
  const n = ring.length;
  const i0 = nearestIdx(ring, entry);
  let extra = exit ? (nearestIdx(ring, exit) - i0 + n) % n : 3;
  if (full) extra += n;
  else extra = Math.max(extra, 3);
  const out: Pt[] = [];
  for (let k = 0; k <= extra; k++) {
    out.push(ring[(i0 + k) % n]!);
  }
  return out;
}

export function rotPts(pts: Pt[], cx: number, cy: number, ang: number): Pt[] {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return pts.map(p => ({
    x: cx + (p.x - cx) * c - (p.y - cy) * s,
    y: cy + (p.x - cx) * s + (p.y - cy) * c
  }));
}

export function unit(ax: number, ay: number): Pt | null {
  const d = Math.hypot(ax, ay);
  return d < 1e-3 ? null : { x: ax / d, y: ay / d };
}

// River connector. Two ideas make it flow like water instead of scribbling:
// 1. Tangent-aligned lead-in/lead-out points — the line LEAVES a shape in the
//    direction it was already travelling and ARRIVES at the next one already
//    aligned with its outline, so every junction is smooth (no corners).
// 2. One gentle meander at mid-length whose side ALTERNATES deterministically
//    per segment (left, right, left...) — calm, river-like S curves instead of
//    the old pseudo-random bends.
export function flowTo(
  start: Pt,
  startDir: Pt | null,
  end: Pt,
  endDir: Pt | null,
  bend: 1 | -1,
  points: Pt[]
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.hypot(dx, dy) || 1;
  const lead = Math.min(56, dist * 0.28);

  if (startDir) {
    points.push({ x: start.x + startDir.x * lead, y: start.y + startDir.y * lead });
  }

  if (dist >= 160) {
    const nx = -dy / dist;
    const ny = dx / dist;
    const amp = Math.min(70, dist * 0.14) * bend;
    points.push({
      x: start.x + dx * 0.5 + nx * amp,
      y: start.y + dy * 0.5 + ny * amp
    });
  }

  if (endDir) {
    points.push({ x: end.x - endDir.x * lead, y: end.y - endDir.y * lead });
  }
}

// Linear densification: keeps the global spline glued to the polyline so
// glyph corners stay crisp instead of being smoothed away.
export function densify(pts: Pt[], step = 7): Pt[] {
  const out: Pt[] = [pts[0]!];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.round(d / step));
    for (let k = 1; k <= n; k++) {
      out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
    }
  }
  return out;
}

// ==========================================
// SEMANTIC GLYPHS — drawn by the same continuous line right before
// the card they announce.
// ==========================================

// Card 1 "Inviaci le tue carte": two fanned trading cards — instantly
// readable as "carte". Drawn as two rings joined by a short hop.
export function glyphTradingCards(cx: number, cy: number, s: number): { back: Pt[]; front: Pt[] } {
  const w = s * 0.58;
  const h = s * 0.82;
  const r = s * 0.07;
  const mk = (ox: number, oy: number, ang: number): Pt[] => {
    const ring = roundedRectPerimeter(
      cx + ox - w / 2,
      cy + oy - h / 2,
      w,
      h,
      { tl: [r, r], tr: [r, r], br: [r, r], bl: [r, r] },
      8,
      Math.PI / 8
    );
    return rotPts(ring, cx + ox, cy + oy, ang);
  };
  return {
    back: mk(-s * 0.18, -s * 0.04, -0.34),
    front: mk(s * 0.16, s * 0.06, 0.1)
  };
}

// Card 2 "Vendiamo per te": a euro coin — outer ring plus a "€" drawn in one
// continuous stroke (C-arc, then the two signature bars joined on the left).
// Instantly reads as "incasso/vendita".
export function glyphEuroCoin(cx: number, cy: number, s: number): { ring: Pt[]; euro: Pt[] } {
  // Outer coin ring
  const R = s * 0.52;
  const ring: Pt[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    ring.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  }

  // "€": C-arc from top-right tip, sweeping through the left, to bottom-right tip
  const euro: Pt[] = [];
  const acx = cx + s * 0.04;
  const r = s * 0.26;
  const a0 = (-65 * Math.PI) / 180;
  const a1 = (-295 * Math.PI) / 180;
  for (let i = 0; i <= 16; i++) {
    const a = a0 + (a1 - a0) * (i / 16);
    euro.push({ x: acx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  // The two horizontal bars, drawn bottom-first and joined on the left
  const barR = cx + s * 0.1;
  const barL = cx - s * 0.4;
  const byOff = s * 0.09;
  euro.push(
    ...densify(
      [
        { x: barR, y: cy + byOff },
        { x: barL, y: cy + byOff },
        { x: barL, y: cy - byOff },
        { x: barR, y: cy - byOff }
      ],
      6
    )
  );
  return { ring, euro };
}

// Card 3 "Zero doppie vendite": classic heater-style badge shield, perfectly
// symmetric. Closed ring (for a full wrap like the coin) sampled from real
// curves: gently bowed top, near-vertical upper sides, graceful sweep into a
// crisp bottom tip. The check is a separate stroke, drawn right-to-left so
// the river exits already pointing at Card 3.
export function glyphShieldCheck(cx: number, cy: number, s: number): { outline: Pt[]; check: Pt[] } {
  const P = (x: number, y: number): Pt => ({ x: cx + x * s, y: cy + y * s });

  const outline: Pt[] = [P(-0.46, -0.4)]; // left shoulder
  const quad = (c: Pt, p1: Pt, n: number) => {
    const p0 = outline[outline.length - 1]!;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const u = 1 - t;
      outline.push({
        x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
        y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y
      });
    }
  };
  const cubic = (c1: Pt, c2: Pt, p1: Pt, n: number) => {
    const p0 = outline[outline.length - 1]!;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const u = 1 - t;
      outline.push({
        x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x,
        y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y
      });
    }
  };
  quad(P(0, -0.5), P(0.46, -0.4), 10); // top edge, gently bowed up
  cubic(P(0.47, -0.08), P(0.36, 0.28), P(0, 0.56), 14); // right side into the tip
  cubic(P(-0.36, 0.28), P(-0.47, -0.08), P(-0.46, -0.4), 14); // left side back up
  outline.pop(); // drop duplicated closing point: wrapShape expects an open ring

  // Right-to-left: long arm down to the crisp valley, short arm up
  const check = densify([P(0.27, -0.16), P(-0.04, 0.18), P(-0.17, 0.02)], 6);
  return { outline, check };
}

// Card 4 "Fulfillment 24h": delivery truck facing the card — cargo box, cab
// with slanted windshield, wheel arches in the body, and two REAL wheels
// drawn as separate full circles sitting inside the arches (the missing
// wheels were the old version's problem: arches alone read as dents).
export function glyphTruck(
  cx: number,
  cy: number,
  s: number
): { body: Pt[]; rearWheel: Pt[]; frontWheel: Pt[] } {
  const x0 = cx - s * 0.62; // rear
  const x1 = cx + s * 0.62; // front
  const y0 = cy - s * 0.34; // cargo roof
  const by = cy + s * 0.26; // body bottom
  const xc = cx + s * 0.14; // cargo/cab split
  const yc = cy - s * 0.1; // cab roof
  const wr = cx - s * 0.34; // rear wheel center
  const wf = cx + s * 0.34; // front wheel center
  const ra = s * 0.16; // wheel arch radius
  const rw = s * 0.105; // wheel radius
  const k = s * 0.06; // small bottom-corner rounding

  const pts: Pt[] = [];
  const line = (a: Pt, b: Pt) => {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.round(d / 7));
    for (let i = 0; i < n; i++) {
      pts.push({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n });
    }
  };
  const arc = (acx: number, acy: number, r: number, a0: number, a1: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push({ x: acx + r * Math.cos(a), y: acy + r * Math.sin(a) });
    }
  };

  // CW ring from the rear top corner
  line({ x: x0, y: y0 }, { x: xc, y: y0 }); // cargo roof
  line({ x: xc, y: y0 }, { x: xc, y: yc }); // drop to cab roof
  line({ x: xc, y: yc }, { x: xc + s * 0.26, y: yc }); // cab roof
  line({ x: xc + s * 0.26, y: yc }, { x: x1 - s * 0.04, y: cy + s * 0.04 }); // windshield
  line({ x: x1 - s * 0.04, y: cy + s * 0.04 }, { x: x1, y: cy + s * 0.08 }); // hood nose
  line({ x: x1, y: cy + s * 0.08 }, { x: x1, y: by - k }); // front face
  arc(x1 - k, by - k, k, 0, Math.PI / 2, 4); // front-bottom corner
  line({ x: x1 - k, y: by }, { x: wf + ra, y: by }); // bottom to front arch
  arc(wf, by, ra, 0, -Math.PI, 9); // front wheel arch
  line({ x: wf - ra, y: by }, { x: wr + ra, y: by }); // bottom between arches
  arc(wr, by, ra, 0, -Math.PI, 9); // rear wheel arch
  line({ x: wr - ra, y: by }, { x: x0 + k, y: by }); // bottom to rear corner
  arc(x0 + k, by - k, k, Math.PI / 2, Math.PI, 4); // rear-bottom corner
  line({ x: x0, y: by - k }, { x: x0, y: y0 }); // rear face up (ring closes)

  // Full round wheels, starting from the top (shortest hop from the arch apex)
  const wheel = (wx: number): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (i / 14) * Math.PI * 2;
      out.push({ x: wx + rw * Math.cos(a), y: by + rw * Math.sin(a) });
    }
    return out;
  };

  return { body: pts, rearWheel: wheel(wr), frontWheel: wheel(wf) };
}
