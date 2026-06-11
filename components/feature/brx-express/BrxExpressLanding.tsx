'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
  motion,
  type MotionValue
} from 'framer-motion';
import { Zap, ArrowRight, FileText, Moon } from 'lucide-react';

type Pt = { x: number; y: number };

// Math Helper: CENTRIPETAL Catmull-Rom -> cubic Bezier (Yuksel-Schaefer-Keyser).
// Centripetal parameterization (alpha = 0.5) is the only one mathematically
// guaranteed to produce no cusps, loops or self-intersections within segments —
// it's what removes the random kinks the old uniform spline created.
function smoothPath(raw: Pt[], alpha = 0.5): string {
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

type CornerRadii = {
  tl: [number, number];
  tr: [number, number];
  br: [number, number];
  bl: [number, number];
};

// Dense CW perimeter of a rounded rect with per-corner elliptical radii.
// Sampling the REAL outline lets the line hug each shape perfectly.
function roundedRectPerimeter(
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
function diamondPerimeter(
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

function nearestIdx(ring: Pt[], target: Pt): number {
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
function wrapShape(
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

function rotPts(pts: Pt[], cx: number, cy: number, ang: number): Pt[] {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return pts.map(p => ({
    x: cx + (p.x - cx) * c - (p.y - cy) * s,
    y: cy + (p.x - cx) * s + (p.y - cy) * c
  }));
}

function unit(ax: number, ay: number): Pt | null {
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
function flowTo(
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
function densify(pts: Pt[], step = 7): Pt[] {
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
function glyphTradingCards(cx: number, cy: number, s: number): { back: Pt[]; front: Pt[] } {
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
function glyphEuroCoin(cx: number, cy: number, s: number): { ring: Pt[]; euro: Pt[] } {
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
function glyphShieldCheck(cx: number, cy: number, s: number): { outline: Pt[]; check: Pt[] } {
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
function glyphTruck(
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

// Separate overlay path per glyph: once the river has finished drawing it,
// the icon "lights up" in a different colour.
function GlyphHighlight({
  d,
  at,
  progress
}: {
  d: string;
  at: number;
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, [Math.max(0, at - 0.006), at], [0, 1]);
  const glowOpacity = useTransform(opacity, v => v * 0.3);
  return (
    <>
      <motion.path
        d={d}
        fill="none"
        stroke="#22D3EE"
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
        style={{ opacity: glowOpacity }}
      />
      <motion.path
        d={d}
        fill="none"
        stroke="#22D3EE"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity }}
      />
    </>
  );
}

// ==========================================
// CARD REVEAL — the river DRAWS each card's border (same exact shape),
// then the card materializes and fuses with the line.
// ==========================================

// A star of the card's constellation: dim and twinkling until the line
// reaches its arc position (`at`), then it ignites.
type Star = {
  x: number;
  y: number;
  r: number;
  at: number;
  dot: boolean;
  tw: number; // twinkle duration (s)
  td: number; // twinkle delay (s)
};

// Border timing is arc-length true: while the river hugs the card
// (progress in [from, to]) the border draws at EXACTLY the river's speed up
// to `mid` = wrapLen/borderLen; the leftover arc closes right after the
// river exits, still at the same speed, finishing at `end`.
type CardMark = {
  d: string;
  from: number;
  to: number;
  mid: number;
  end: number;
  stars: Star[];
};

// Classic four-point sparkle
function starPath(cx: number, cy: number, r: number): string {
  const k = r * 0.22;
  return (
    `M ${cx} ${cy - r} Q ${cx + k} ${cy - k} ${cx + r} ${cy}` +
    ` Q ${cx + k} ${cy + k} ${cx} ${cy + r}` +
    ` Q ${cx - k} ${cy + k} ${cx - r} ${cy}` +
    ` Q ${cx - k} ${cy - k} ${cx} ${cy - r} Z`
  );
}

// Ignited overlay: lights up the instant the line threads through the star
function StarFx({ star, progress }: { star: Star; progress: MotionValue<number> }) {
  const lit = useTransform(progress, [star.at - 0.004, star.at], [0, 1]);
  return (
    <motion.g style={{ opacity: lit }}>
      {star.dot ? (
        <circle cx={star.x} cy={star.y} r={star.r} fill="#FDE68A" />
      ) : (
        <path d={starPath(star.x, star.y, star.r)} fill="#FDE68A" />
      )}
    </motion.g>
  );
}

// White stroke inside the reveal mask: streaks only exist where the
// border has already been drawn.
function CardMaskPath({
  d,
  from,
  to,
  mid,
  end,
  progress
}: {
  d: string;
  from: number;
  to: number;
  mid: number;
  end: number;
  progress: MotionValue<number>;
}) {
  const draw = useTransform(progress, [from, to, end], [0, mid, 1]);
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="#fff"
      strokeWidth={9}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pathLength: draw }}
    />
  );
}

// The visible card border: drawn in sync with the river hugging the card,
// stroked with the SAME flowing gradient as the river (that's the fusion),
// plus a one-shot bright flash the moment the loop closes.
function CardBorderFx({
  d,
  from,
  to,
  mid,
  end,
  progress
}: {
  d: string;
  from: number;
  to: number;
  mid: number;
  end: number;
  progress: MotionValue<number>;
}) {
  const draw = useTransform(progress, [from, to, end], [0, mid, 1]);
  const [fused, setFused] = useState(false);
  useMotionValueEvent(progress, 'change', v => setFused(v >= end - 0.002));
  return (
    <>
      {/* Glow halo: gentle while drawing, blooms up when the card is born */}
      <motion.path
        d={d}
        fill="none"
        stroke="url(#card-line-gradient)"
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#card-glow)"
        initial={{ opacity: 0.14 }}
        animate={{ opacity: fused ? 0.4 : 0.14 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{ pathLength: draw }}
      />
      {/* Core border — same animated gradient as the river: this IS the river */}
      <motion.path
        d={d}
        fill="none"
        stroke="url(#card-line-gradient)"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pathLength: draw }}
      />
      {/* Fusion bloom: a warm, soft pulse the moment the loop closes */}
      {fused && (
        <motion.path
          d={d}
          fill="none"
          stroke="#FFEDD5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#card-glow)"
          initial={{ opacity: 0.75, strokeWidth: 20 }}
          animate={{ opacity: 0, strokeWidth: 3 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
      {/* Light streaks flowing along the card border — they ignite on fusion,
          so the border visibly keeps "carrying" the river's current */}
      <motion.g
        mask="url(#card-reveal)"
        initial={{ opacity: 0 }}
        animate={{ opacity: fused ? 0.85 : 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        <path
          d={d}
          fill="none"
          stroke="#FFEDD5"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="5 60"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-65"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>
      </motion.g>
    </>
  );
}

export default function BrxExpressLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroStartRef = useRef<HTMLSpanElement>(null);
  const cardRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null)
  ];
  const termsTextRef = useRef<HTMLDivElement>(null);

  const [pathD, setPathD] = useState('');
  const [glyphMarks, setGlyphMarks] = useState<{ d: string; at: number }[]>([]);
  const [cardMarks, setCardMarks] = useState<CardMark[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false, false]);
  const [mounted, setMounted] = useState(false);

  // Scroll Progress binding to SVG Path drawing
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Softer spring = buttery, unhurried line travel
  const pathLength = useSpring(scrollYProgress, {
    stiffness: 64,
    damping: 30,
    restDelta: 0.0001
  });

  // Finale: once the river has wrapped the Terms block (last ~8% of the path),
  // the animated blue/orange gradient background fades in.
  const finaleOpacity = useTransform(pathLength, [0.9, 0.985], [0, 1]);

  // Latch: when the wrap completes, the finale background (gradient + road)
  // becomes permanent — it stays even scrolling back up, until page reload.
  const [finaleOn, setFinaleOn] = useState(false);
  useMotionValueEvent(pathLength, 'change', v => {
    if (v >= 0.98) setFinaleOn(true);
    // Card materialization: a card appears the instant its border loop closes,
    // and dissolves back if the river retracts (small hysteresis avoids flicker).
    setRevealed(prev => {
      if (cardMarks.length === 0) return prev;
      let changed = false;
      const next = prev.map((r, i) => {
        const m = cardMarks[i];
        if (!m) return r;
        const nr = v >= m.end - 0.002 ? true : v < m.end - 0.014 ? false : r;
        if (nr !== r) changed = true;
        return nr;
      });
      return changed ? next : prev;
    });
  });

  const updatePath = () => {
    const container = containerRef.current;
    const heroStart = heroStartRef.current;
    const cards = cardRefs.map(r => r.current);
    const termsText = termsTextRef.current;

    if (!container || !heroStart || cards.some(c => !c) || !termsText) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const cw = containerRect.width;
    const showGlyphs = cw >= 768; // skip glyphs on stacked mobile layout

    const getRelativeCoords = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height
      };
    };

    // Center of the empty grid column beside a card (mirrored position)
    const mirrorX = (c: { x: number; width: number }) => cw - (c.x + c.width / 2);

    const wrapOffset = 10; // precise border stroke margin
    const points: Pt[] = [];
    // Visible subpaths + index in `points` where each glyph finishes drawing
    const marks: { shapes: Pt[][]; endIdx: number }[] = [];
    // Per-card: exact border ring (offset 0 — the card's REAL shape) plus the
    // indices in `points` where the river starts/finishes hugging the card,
    // so the border draws in sync with the line.
    const cardInfos: { ring: Pt[]; startIdx: number; endIdx: number }[] = [];

    // Start at Hero badge
    const start = getRelativeCoords(heroStart);
    let cursor: Pt = { x: start.x + start.width / 2, y: start.y + start.height };
    points.push(cursor);

    let segIdx = 0;
    // Returns the index in `points` where the segment itself begins (AFTER the
    // connector lead-in) — needed to sync card borders with the river's touch.
    const travel = (segment: Pt[]): number => {
      const last = points[points.length - 1]!;
      const prev = points.length > 1 ? points[points.length - 2] : null;
      // Leave along the direction we were already travelling (straight down
      // out of the hero badge on the very first segment)...
      const startDir = prev ? unit(last.x - prev.x, last.y - prev.y) : { x: 0, y: 1 };
      // ...and arrive aligned with the next outline's own tangent.
      const endDir =
        segment.length > 1
          ? unit(segment[1]!.x - segment[0]!.x, segment[1]!.y - segment[0]!.y)
          : null;
      segIdx += 1;
      flowTo(last, startDir, segment[0]!, endDir, segIdx % 2 === 0 ? 1 : -1, points);
      const segStart = points.length;
      points.push(...segment);
      cursor = segment[segment.length - 1]!;
      return segStart;
    };

    // ==========================================
    // CARD 1: Organic Blob (left) — exact CSS border-radius outline
    // borderRadius: 52% 48% 68% 32% / 45% 42% 58% 55%
    // ==========================================
    const c1 = getRelativeCoords(cards[0]!);
    const o = wrapOffset;
    // ONE line: the river hugs the card's EXACT edge (offset 0) — the river
    // itself draws the card border, no parallel second line.
    const per1 = roundedRectPerimeter(c1.x, c1.y, c1.width, c1.height, {
      tl: [c1.width * 0.52, c1.height * 0.45],
      tr: [c1.width * 0.48, c1.height * 0.42],
      br: [c1.width * 0.68, c1.height * 0.58],
      bl: [c1.width * 0.32, c1.height * 0.55]
    });
    const e1 = { x: c1.x + c1.width * 0.85, y: c1.y };

    if (showGlyphs) {
      // Glyph: two fanned trading cards, in the free column beside Card 1
      const g = { x: mirrorX(c1), y: c1.y + c1.height * 0.25 };
      const { back, front } = glyphTradingCards(g.x, g.y, 112);
      // Back card first, short hop, then the front card, then on to Card 1
      travel(wrapShape(back, cursor, true, front[0]!, true));
      travel(wrapShape(front, cursor, true, e1, true));
      marks.push({
        shapes: [
          [...back, back[0]!],
          [...front, front[0]!]
        ],
        endIdx: points.length - 1
      });
    }

    // Enter top-right, hug the blob CCW (top -> left -> bottom), exit bottom-right
    const wrapStart1 = travel(
      wrapShape(per1, e1, true, { x: c1.x + c1.width, y: c1.y + c1.height })
    );
    cardInfos.push({
      ring: wrapShape(per1, e1, true, undefined, true),
      startIdx: wrapStart1,
      endIdx: points.length - 1
    });

    // ==========================================
    // CARD 2: Rounded Rectangle (right) — rounded-2xl = 16px
    // ==========================================
    const c2 = getRelativeCoords(cards[1]!);
    const per2 = roundedRectPerimeter(c2.x, c2.y, c2.width, c2.height, {
      tl: [16, 16],
      tr: [16, 16],
      br: [16, 16],
      bl: [16, 16]
    });
    const e2 = { x: c2.x + c2.width * 0.15, y: c2.y };

    if (showGlyphs) {
      // Glyph: euro coin, beside Card 2 — full ring first, then the "€" inside
      const g = { x: mirrorX(c2), y: c2.y + c2.height * 0.25 };
      const coin = glyphEuroCoin(g.x, g.y, 112);
      travel(wrapShape(coin.ring, cursor, false, coin.euro[0]!, true));
      travel(coin.euro);
      marks.push({
        shapes: [[...coin.ring, coin.ring[0]!], coin.euro],
        endIdx: points.length - 1
      });
    }

    // Enter top-left, hug CW (top -> right -> bottom), exit bottom-left
    const wrapStart2 = travel(wrapShape(per2, e2, false, { x: c2.x, y: c2.y + c2.height }));
    cardInfos.push({
      ring: wrapShape(per2, e2, false, undefined, true),
      startIdx: wrapStart2,
      endIdx: points.length - 1
    });

    // ==========================================
    // CARD 3: Pill (left) — rounded-[50px]
    // ==========================================
    const c3 = getRelativeCoords(cards[2]!);
    const per3 = roundedRectPerimeter(c3.x, c3.y, c3.width, c3.height, {
      tl: [50, 50],
      tr: [50, 50],
      br: [50, 50],
      bl: [50, 50]
    });
    const e3 = { x: c3.x + c3.width * 0.85, y: c3.y };

    if (showGlyphs) {
      // Glyph: badge shield + check, beside Card 3 — full outline loop first,
      // then a short hop inside for the check (same clean pattern as the coin)
      const g = { x: mirrorX(c3), y: c3.y + c3.height * 0.25 };
      const shield = glyphShieldCheck(g.x, g.y, 112);
      travel(wrapShape(shield.outline, cursor, false, shield.check[0]!, true));
      travel(shield.check);
      marks.push({
        shapes: [[...shield.outline, shield.outline[0]!], shield.check],
        endIdx: points.length - 1
      });
    }

    // Enter top-right, hug CCW, exit bottom-right
    const wrapStart3 = travel(
      wrapShape(per3, e3, true, { x: c3.x + c3.width, y: c3.y + c3.height })
    );
    cardInfos.push({
      ring: wrapShape(per3, e3, true, undefined, true),
      startIdx: wrapStart3,
      endIdx: points.length - 1
    });

    // ==========================================
    // CARD 4: Diamond (right) — exact clip-path outline
    // ==========================================
    const c4 = getRelativeCoords(cards[3]!);
    const per4 = diamondPerimeter(c4.x, c4.y, c4.width, c4.height, 0);
    const e4 = { x: c4.x + c4.width * 0.22, y: c4.y + c4.height * 0.22 };

    if (showGlyphs) {
      // Glyph: delivery truck, beside Card 4 (facing it) — body loop first,
      // then each wheel as its own circle: arch apex -> wheel top is a tiny,
      // near-invisible hop
      const g = { x: mirrorX(c4), y: c4.y + c4.height * 0.3 };
      const truck = glyphTruck(g.x, g.y, 118);
      travel(wrapShape(truck.body, cursor, false, truck.rearWheel[0]!, true));
      travel(wrapShape(truck.rearWheel, cursor, false, truck.frontWheel[0]!, true));
      travel(wrapShape(truck.frontWheel, cursor, false, e4, true));
      marks.push({
        shapes: [
          [...truck.body, truck.body[0]!],
          [...truck.rearWheel, truck.rearWheel[0]!],
          [...truck.frontWheel, truck.frontWheel[0]!]
        ],
        endIdx: points.length - 1
      });
    }

    // Enter top-left edge, hug CW (top -> right -> bottom), exit bottom-left edge
    const wrapStart4 = travel(
      wrapShape(per4, e4, false, {
        x: c4.x + c4.width * 0.25,
        y: c4.y + c4.height * 0.78
      })
    );
    cardInfos.push({
      ring: wrapShape(per4, e4, false, undefined, true),
      startIdx: wrapStart4,
      endIdx: points.length - 1
    });

    // ==========================================
    // TERMS: full wrap around the text block — the river's final frame
    // ==========================================
    const terms = getRelativeCoords(termsText);
    const rT = 16 + o;
    const perT = roundedRectPerimeter(
      terms.x - o,
      terms.y - o,
      terms.width + o * 2,
      terms.height + o * 2,
      { tl: [rT, rT], tr: [rT, rT], br: [rT, rT], bl: [rT, rT] }
    );
    // Enter top-right (coming from the diamond above), full CW loop
    travel(
      wrapShape(perT, { x: terms.x + terms.width * 0.82, y: terms.y - o }, false, undefined, true)
    );

    setPathD(smoothPath(points));

    // Cumulative polyline length -> fraction of total path where each glyph
    // finishes, used to trigger the colour change of its overlay.
    const cum: number[] = [0];
    for (let i = 1; i < points.length; i++) {
      cum.push(
        cum[i - 1]! +
          Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y)
      );
    }
    const total = cum[cum.length - 1]! || 1;
    setGlyphMarks(
      marks.map(m => ({
        d: m.shapes.map(s => smoothPath(s)).join(' '),
        at: Math.min(1, cum[Math.min(m.endIdx, cum.length - 1)]! / total)
      }))
    );
    // Deterministic pseudo-random (stable across resizes — stars don't jump)
    const frand = (n: number) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    setCardMarks(
      cardInfos.map((ci, c) => {
        const ring = ci.ring;
        // Arc length along the border ring
        const rcum: number[] = [0];
        for (let i = 1; i < ring.length; i++) {
          rcum.push(
            rcum[i - 1]! + Math.hypot(ring[i]!.x - ring[i - 1]!.x, ring[i]!.y - ring[i - 1]!.y)
          );
        }
        const borderLen = rcum[rcum.length - 1]! || 1;

        const startCum = cum[Math.min(ci.startIdx, cum.length - 1)]!;
        const endCum = cum[Math.min(ci.endIdx, cum.length - 1)]!;
        const wrapLen = Math.max(endCum - startCum, 1);
        const from = startCum / total;
        const to = endCum / total;
        // River and border share the same speed: the wrapped stretch covers
        // `mid` of the loop; the leftover closes right after exit, same pace.
        const mid = Math.min(wrapLen / borderLen, 0.999);
        const end = Math.min(1, Math.max(to + (borderLen - wrapLen) / total, to + 0.0005));

        // Milky-way: a belt of stars scattered along the border arc; each
        // ignites at the exact progress at which the line threads through it.
        const count = Math.max(14, Math.min(30, Math.round(borderLen / 64)));
        const stars: Star[] = [];
        for (let i = 0; i < count; i++) {
          const seed = c * 1000 + i * 7;
          const s = ((i + 0.2 + frand(seed) * 0.6) / count) * borderLen;
          let j = 1;
          while (j < rcum.length - 1 && rcum[j]! < s) j++;
          const segLen = Math.max(rcum[j]! - rcum[j - 1]!, 1e-4);
          const t = (s - rcum[j - 1]!) / segLen;
          const a = ring[j - 1]!;
          const b = ring[j]!;
          const px = a.x + (b.x - a.x) * t;
          const py = a.y + (b.y - a.y) * t;
          const nx = -(b.y - a.y) / segLen;
          const ny = (b.x - a.x) / segLen;
          const off = (frand(seed + 17) * 2 - 1) * 9;
          const dot = frand(seed + 33) < 0.55;
          stars.push({
            x: px + nx * off,
            y: py + ny * off,
            r: dot ? 1.1 + frand(seed + 47) * 1.2 : 2.4 + frand(seed + 47) * 2.6,
            at: Math.min(end, (startCum + s) / total),
            dot,
            tw: 1.8 + frand(seed + 61) * 2.4,
            td: frand(seed + 79) * 3
          });
        }

        return { d: smoothPath(ring), from, to, mid, end, stars };
      })
    );
  };

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      updatePath();
    }, 150);

    const observer = new ResizeObserver(() => {
      updatePath();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', updatePath);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', updatePath);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#0F172A] text-slate-100 overflow-hidden font-sans pb-24"
    >
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

      {/* Finale background: blue/orange brand gradient (header + CTA colours),
          slowly drifting, revealed when the line finishes wrapping the Terms.
          Once revealed it latches on (finaleOn) until the page is reloaded. */}
      <motion.div
        aria-hidden
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ opacity: finaleOn ? 1 : finaleOpacity }}
      >
        <div className="brx-finale-gradient absolute -inset-[50%] w-[200%] h-[200%]" />
      </motion.div>

      {/* Easter egg: anchored at the TOP OF THE HERO (scrolls with the page),
          tied to the finale opacity — only those who journey back up after
          the background has changed will ever find it. */}
      <motion.div
        aria-hidden
        className="absolute top-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        style={{ opacity: finaleOn ? 1 : finaleOpacity }}
      >
        <div className="brx-moon-egg relative">
          {/* Nebula aura breathing behind the pill */}
          <div className="brx-moon-aura absolute -inset-7 rounded-full" />
          {/* A shooting star streaks past every few seconds */}
          <span className="brx-shooting-star" />
          {/* Tiny satellite orbiting the whole message */}
          <div className="brx-moon-orbit absolute inset-0">
            <span className="brx-moon-sat" />
          </div>
          {/* Twinkling sparkles scattered around */}
          <span className="brx-egg-star" style={{ top: '-14px', left: '6%', fontSize: '9px', animationDelay: '-0.3s' }}>✦</span>
          <span className="brx-egg-star" style={{ top: '-9px', right: '12%', fontSize: '13px', animationDelay: '-1.1s' }}>✦</span>
          <span className="brx-egg-star" style={{ bottom: '-12px', left: '18%', fontSize: '11px', animationDelay: '-1.8s' }}>✦</span>
          <span className="brx-egg-star" style={{ bottom: '-8px', right: '5%', fontSize: '8px', animationDelay: '-0.7s' }}>✦</span>
          <span className="brx-egg-star" style={{ top: '40%', left: '-18px', fontSize: '10px', animationDelay: '-2.4s' }}>✦</span>
          {/* The pill: starfield inside, cosmic gradient border */}
          <div className="brx-moon-pill relative flex items-center gap-2 rounded-full px-4 py-2">
            <Moon className="h-4 w-4 shrink-0 text-amber-200 [filter:drop-shadow(0_0_6px_rgba(251,191,36,0.85))]" />
            <span className="text-[10px] sm:text-xs font-semibold text-indigo-100 whitespace-nowrap">
              Attenzione! Non garantiamo spedizione in 24h sulla luna.
            </span>
          </div>
        </div>
      </motion.div>
      <style>{`
        .brx-finale-gradient {
          background: linear-gradient(
            125deg,
            #0F172A 0%,
            #1D3160 22%,
            #2E4A8C 40%,
            #F97316 58%,
            #FBBF24 68%,
            #F97316 76%,
            #1D3160 92%,
            #0F172A 100%
          );
          animation: brx-finale-drift 16s ease-in-out infinite alternate;
          will-change: transform;
        }
        @keyframes brx-finale-drift {
          from { transform: translate3d(-12%, -10%, 0); }
          to { transform: translate3d(12%, 10%, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .brx-finale-gradient { animation: none; }
        }
        /* Card birth: blooms out of the line — soft blur-in, gentle overshoot,
           warm light settling from the top. Vivid, alive, never harsh. */
        .brx-card-birth {
          animation: brx-card-birth 1.15s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes brx-card-birth {
          0% { opacity: 0; transform: scale(0.93); filter: blur(7px) brightness(1.9) saturate(1.5); }
          55% { opacity: 1; transform: scale(1.012); filter: blur(0px) brightness(1.22) saturate(1.18); }
          100% { opacity: 1; transform: scale(1); filter: blur(0px) brightness(1) saturate(1); }
        }
        /* Warm inner flare: flares up at birth, then settles into a permanent
           glow that keeps the card visually fused with the orange line */
        .brx-card-birth::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background:
            radial-gradient(130% 90% at 50% -10%, rgba(251, 146, 60, 0.22), rgba(251, 191, 36, 0.07) 45%, transparent 72%),
            radial-gradient(120% 80% at 50% 115%, rgba(249, 115, 22, 0.14), transparent 60%);
          animation: brx-card-flare 1.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes brx-card-flare {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0.55; }
        }
        @media (prefers-reduced-motion: reduce) {
          .brx-card-birth { animation: none; }
          .brx-card-birth::after { animation: none; opacity: 0.55; }
        }
        /* Constellation stars: faint, breathing twinkle until the line ignites them */
        .brx-star {
          transform-box: fill-box;
          transform-origin: center;
          animation: brx-star-twinkle 2.6s ease-in-out infinite alternate;
        }
        @keyframes brx-star-twinkle {
          from { opacity: 0.14; transform: scale(0.8); }
          to { opacity: 0.5; transform: scale(1.12); }
        }
        @media (prefers-reduced-motion: reduce) {
          .brx-star { animation: none; opacity: 0.3; }
        }
        /* ===== Moon easter egg: deep-space edition ===== */
        /* Zero-gravity float */
        .brx-moon-egg {
          animation: brx-moon-float 5s ease-in-out infinite alternate;
        }
        @keyframes brx-moon-float {
          from { transform: translateY(0); }
          to { transform: translateY(-7px); }
        }
        /* Pill: tiny starfield inside + cosmic gradient border (two-layer trick) */
        .brx-moon-pill {
          border: 1px solid transparent;
          background:
            radial-gradient(1.5px 1.5px at 15% 25%, rgba(255,255,255,0.85), transparent 100%),
            radial-gradient(1px 1px at 35% 70%, rgba(255,255,255,0.55), transparent 100%),
            radial-gradient(1px 1px at 58% 30%, rgba(255,255,255,0.65), transparent 100%),
            radial-gradient(1.5px 1.5px at 78% 65%, rgba(255,255,255,0.5), transparent 100%),
            radial-gradient(1px 1px at 92% 35%, rgba(255,255,255,0.7), transparent 100%),
            linear-gradient(rgba(8, 12, 26, 0.92), rgba(8, 12, 26, 0.92)) padding-box,
            linear-gradient(120deg, #6366F1, #C084FC, #FBBF24, #F472B6, #6366F1) border-box;
          box-shadow: 0 0 26px -6px rgba(129, 140, 248, 0.5);
        }
        /* Breathing nebula glow */
        .brx-moon-aura {
          background: radial-gradient(closest-side, rgba(129, 140, 248, 0.3), rgba(244, 114, 182, 0.12) 55%, transparent 78%);
          filter: blur(6px);
          animation: brx-aura-pulse 3.5s ease-in-out infinite alternate;
        }
        @keyframes brx-aura-pulse {
          from { opacity: 0.55; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1.06); }
        }
        /* Satellite in orbit around the whole pill */
        .brx-moon-orbit {
          animation: brx-orbit 7s linear infinite;
        }
        @keyframes brx-orbit {
          to { transform: rotate(360deg); }
        }
        .brx-moon-sat {
          position: absolute;
          top: 50%;
          left: -10px;
          margin-top: -2.5px;
          width: 5px;
          height: 5px;
          border-radius: 9999px;
          background: #BFDBFE;
          box-shadow: 0 0 8px 1px rgba(147, 197, 253, 0.9);
        }
        /* Golden sparkles, twinkling out of phase */
        .brx-egg-star {
          position: absolute;
          color: #FDE68A;
          line-height: 1;
          text-shadow: 0 0 8px rgba(251, 191, 36, 0.9);
          animation: brx-egg-twinkle 2.2s ease-in-out infinite alternate;
        }
        @keyframes brx-egg-twinkle {
          from { opacity: 0.25; transform: scale(0.7) rotate(0deg); }
          to { opacity: 1; transform: scale(1.15) rotate(45deg); }
        }
        /* Periodic shooting star */
        .brx-shooting-star {
          position: absolute;
          top: -16px;
          left: -36px;
          width: 64px;
          height: 2px;
          border-radius: 9999px;
          background: linear-gradient(90deg, transparent, #fff 60%, transparent);
          opacity: 0;
          animation: brx-shoot 7s ease-in 2s infinite;
        }
        @keyframes brx-shoot {
          0% { opacity: 0; transform: translate3d(0, 0, 0) rotate(18deg); }
          3% { opacity: 0.95; }
          10% { opacity: 0; transform: translate3d(150px, 48px, 0) rotate(18deg); }
          100% { opacity: 0; transform: translate3d(150px, 48px, 0) rotate(18deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .brx-moon-egg, .brx-moon-aura, .brx-moon-orbit, .brx-egg-star, .brx-shooting-star {
            animation: none;
          }
          .brx-moon-sat { display: none; }
        }
      `}</style>

      {/* SVG Canvas for Scroll Line (Rendered at z-10) */}
      {mounted && pathD && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <defs>
            {/* Seamless, infinitely translating gradient pattern for flowing river effect */}
            <linearGradient
              id="line-gradient"
              x1="0"
              y1="0"
              x2="0"
              y2="200"
              gradientUnits="userSpaceOnUse"
              spreadMethod="repeat"
            >
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="25%" stopColor="#FB923C" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="75%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#F97316" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from="0,0"
                to="0,200"
                dur="3s"
                repeatCount="indefinite"
              />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Reveal mask: the flow layer only exists where the river has
                already been drawn by the scroll progress */}
            <mask id="line-reveal" maskUnits="userSpaceOnUse">
              <motion.path
                d={pathD}
                fill="none"
                stroke="#fff"
                strokeWidth={11}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pathLength }}
              />
            </mask>
          </defs>

          {/* Layer 1: Ambient thick glow trail */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth={35}
            opacity={0.06}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength }}
          />

          {/* Layer 2: Medium glowing bloom */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth={15}
            opacity={0.16}
            filter="url(#glow)"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength }}
          />

          {/* Layer 3: Core sharp line */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength }}
          />

          {/* Layer 4: light streaks travelling ALONG the path direction —
              the actual "flowing river" motion (dashoffset technique) */}
          <g mask="url(#line-reveal)">
            <path
              d={pathD}
              fill="none"
              stroke="#FFEDD5"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeDasharray="5 65"
              opacity={0.85}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-70"
                dur="1.6s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Glyph highlights: each icon changes colour once fully drawn */}
          {glyphMarks.map((m, i) => (
            <GlyphHighlight key={i} d={m.d} at={m.at} progress={pathLength} />
          ))}
        </svg>
      )}

      {/* Card borders overlay (z-30, ABOVE the cards): the river draws each
          card's exact outline; when the loop closes the card materializes
          beneath it and the border keeps flowing with the same gradient +
          light streaks as the river — visually fused with the line. */}
      {mounted && cardMarks.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 30 }}
        >
          <defs>
            <linearGradient
              id="card-line-gradient"
              x1="0"
              y1="0"
              x2="0"
              y2="200"
              gradientUnits="userSpaceOnUse"
              spreadMethod="repeat"
            >
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="25%" stopColor="#FB923C" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="75%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#F97316" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from="0,0"
                to="0,200"
                dur="3s"
                repeatCount="indefinite"
              />
            </linearGradient>

            <filter id="card-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="9" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Streaks only exist where the border has been drawn */}
            <mask id="card-reveal" maskUnits="userSpaceOnUse">
              {cardMarks.map((m, i) => (
                <CardMaskPath
                  key={i}
                  d={m.d}
                  from={m.from}
                  to={m.to}
                  mid={m.mid}
                  end={m.end}
                  progress={pathLength}
                />
              ))}
            </mask>
          </defs>

          {/* Constellation base: faint twinkling stars prefiguring each card,
              visible before the line arrives — the line then threads them */}
          {cardMarks.map((m, i) => (
            <g key={`stars-${i}`}>
              {m.stars.map((st, si) =>
                st.dot ? (
                  <circle
                    key={si}
                    className="brx-star"
                    style={{ animationDuration: `${st.tw}s`, animationDelay: `-${st.td}s` }}
                    cx={st.x}
                    cy={st.y}
                    r={st.r}
                    fill="#CBD5E1"
                  />
                ) : (
                  <path
                    key={si}
                    className="brx-star"
                    style={{ animationDuration: `${st.tw}s`, animationDelay: `-${st.td}s` }}
                    d={starPath(st.x, st.y, st.r)}
                    fill="#E2E8F0"
                  />
                )
              )}
            </g>
          ))}

          {cardMarks.map((m, i) => (
            <CardBorderFx
              key={i}
              d={m.d}
              from={m.from}
              to={m.to}
              mid={m.mid}
              end={m.end}
              progress={pathLength}
            />
          ))}

          {/* Ignited stars: each lights up golden as the line passes through */}
          {cardMarks.map((m, i) => (
            <g key={`lit-${i}`} filter="url(#card-glow)">
              {m.stars.map((st, si) => (
                <StarFx key={si} star={st} progress={pathLength} />
              ))}
            </g>
          ))}
        </svg>
      )}

      {/* Hero Section (Clean and Minimal) */}
      <section className="relative z-20 max-w-4xl mx-auto px-6 pt-28 pb-14 text-center">
        <div className="flex justify-center mb-5">
          <span
            ref={heroStartRef}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 px-3 py-0.5 text-[10px] font-bold tracking-wider text-orange-400 uppercase"
          >
            <Zap className="h-3 w-3 text-orange-400" />
            Spedizione 24h
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-white">
          BRX Express
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Il network logistico europeo di Ebartex. Spedisci le tue carte una sola volta:
          le digitalizziamo, le gradiamo e le consegniamo ai compratori in 24 ore.
        </p>

        <div className="mt-6 flex justify-center">
          <button className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-orange-500/20">
            <span className="relative z-10 flex items-center gap-1.5">
              Inizia a spedire
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </button>
        </div>
      </section>

      {/* Come Funziona Section */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
            Come Funziona
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
            Il flusso decentralizzato che elimina lo stress delle spedizioni singole.
          </p>
        </div>

        {/* Cards are explicitly set to z-20 relative so the line at z-10 passes UNDER them */}
        <div className="space-y-24 md:space-y-36">
          {/* Card 1: Organic Blob (Left) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-start">
              <div
                ref={cardRefs[0]}
                className={`relative z-20 w-full max-w-[440px] p-8 md:p-10 text-slate-100 flex flex-col items-start justify-center min-h-[280px] border border-transparent transition-all duration-700 ${
                  revealed[0]
                    ? 'bg-gradient-to-br from-slate-800/80 via-slate-900/75 to-orange-950/40 backdrop-blur-md shadow-[0_25px_70px_-20px_rgba(249,115,22,0.4)] brx-card-birth'
                    : 'bg-transparent shadow-none'
                }`}
                style={{
                  borderRadius: '52% 48% 68% 32% / 45% 42% 58% 55%'
                }}
              >
                <h3 className="text-xl font-bold text-white tracking-tight">Inviaci le tue carte</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Raggruppa le tue carte e spediscile all'hub BRX Express più vicino. Al resto pensiamo noi: grading professionale, foto in HD e stoccaggio protetto in camera blindata.
                </p>
              </div>
            </div>
            <div className="hidden md:block" />
          </div>

          {/* Card 2: Rounded Rectangle (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="hidden md:block" />
            <div className="flex justify-end">
              <div
                ref={cardRefs[1]}
                className={`relative z-20 w-full max-w-[440px] p-8 md:p-10 rounded-2xl text-slate-100 flex flex-col items-start justify-center min-h-[280px] border border-transparent transition-all duration-700 ${
                  revealed[1]
                    ? 'bg-gradient-to-br from-slate-800/80 via-slate-900/75 to-orange-950/40 backdrop-blur-md shadow-[0_25px_70px_-20px_rgba(249,115,22,0.4)] brx-card-birth'
                    : 'bg-transparent shadow-none'
                }`}
              >
                <h3 className="text-xl font-bold text-white tracking-tight">Vendiamo per te</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Le tue carte sono listate sul marketplace a soli 0,30€ a pezzo. Vengono visualizzate sotto un Account Ufficiale Sponsorizzato, garantendo massima visibilità e affidabilità.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Oval / Pill (Left) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-start">
              <div
                ref={cardRefs[2]}
                className={`relative z-20 w-full max-w-[440px] p-8 md:p-10 rounded-[50px] text-slate-100 flex flex-col items-start justify-center min-h-[280px] border border-transparent transition-all duration-700 ${
                  revealed[2]
                    ? 'bg-gradient-to-br from-slate-800/80 via-slate-900/75 to-orange-950/40 backdrop-blur-md shadow-[0_25px_70px_-20px_rgba(249,115,22,0.4)] brx-card-birth'
                    : 'bg-transparent shadow-none'
                }`}
              >
                <h3 className="text-xl font-bold text-white tracking-tight">Zero doppie vendite</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Eliminiamo alla radice l'incubo del doppio ordinamento. Avendo le carte fisicamente stoccate nei nostri hub regionali, la sincronizzazione dell'inventario è istantanea.
                </p>
              </div>
            </div>
            <div className="hidden md:block" />
          </div>

          {/* Card 4: Diamond (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="hidden md:block" />
            <div className="flex justify-end">
              <div className="w-full max-w-[440px] flex justify-center items-center relative z-20">
                <div
                  ref={cardRefs[3]}
                  className={`relative z-20 w-[340px] aspect-square flex items-center justify-center p-8 border border-transparent transition-all duration-700 [clip-path:polygon(50%_0%,_100%_50%,_50%_100%,_0%_50%)] ${
                    revealed[3]
                      ? 'bg-gradient-to-br from-slate-800/80 via-slate-900/75 to-orange-950/40 backdrop-blur-md shadow-[0_25px_70px_-20px_rgba(249,115,22,0.4)] brx-card-birth'
                      : 'bg-transparent shadow-none'
                  }`}
                >
                  <div className="text-center max-w-[210px] flex flex-col items-center">
                    <h3 className="text-base font-bold text-white tracking-tight">Fulfillment 24h</h3>
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                      All'acquisto, la spedizione parte immediatamente dall'hub locale in cui risiede la carta. Consegna all'acquirente in tutta Europa in sole 24 ore.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Termini e Condizioni Section (Explicitly set to z-[5] lower than SVG z-10 so the line passes ON TOP) */}
      <section className="relative z-[5] max-w-4xl mx-auto px-6 mt-32">
        <div
          className={`relative rounded-3xl border backdrop-blur-md p-8 md:p-12 shadow-2xl transition-colors duration-1000 ${
            finaleOn ? 'border-slate-700 bg-slate-950/85' : 'border-slate-800/60 bg-slate-950/40'
          }`}
        >
          <div
            ref={termsTextRef}
            className={`relative z-[5] p-6 md:p-8 rounded-2xl border transition-colors duration-1000 ${
              finaleOn ? 'border-slate-700/80 bg-slate-950/70' : 'border-slate-800/80 bg-slate-900/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-6 justify-center">
              <FileText className="h-5 w-5 text-orange-500" />
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Termini e Condizioni
              </h3>
            </div>

            <ul
              className={`space-y-4 text-xs sm:text-sm leading-relaxed transition-colors duration-1000 ${
                finaleOn ? 'text-white' : 'text-slate-400'
              }`}
            >
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Accettazione Valutazione:</strong> L'invio delle carte all'hub implica l'accettazione insindacabile del grading e della digitalizzazione operati dal team tecnico di BRX.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Tariffa Upload:</strong> Si applica un costo fisso di 0,30€ per ciascuna carta inserita a catalogo a titolo di costi di inbound, ispezione e digitalizzazione.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Commissioni:</strong> Al completamento di ogni transazione di vendita viene applicata una trattenuta del 10% sul prezzo dell'asset, fino ad un massimale di 100€ per singola carta.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Tempistiche Spedizione:</strong> La spedizione 24h è garantita nei giorni lavorativi ed è soggetta alla stabilità operativa dei corrieri espressi designati da BRX Express.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">•</span>
                <span>
                  <strong>Riconsegna Stock:</strong> Il venditore può revocare il mandato di vendita e richiedere il rientro fisico delle proprie carte in qualsiasi momento, facendosi carico delle spese di spedizione.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
