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
import { Zap, ArrowRight, FileText } from 'lucide-react';

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
  const [mounted, setMounted] = useState(false);

  // Scroll Progress binding to SVG Path drawing
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  const pathLength = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
    restDelta: 0.001
  });

  // Finale: once the river has wrapped the Terms block (last ~8% of the path),
  // the animated blue/orange gradient background fades in.
  const finaleOpacity = useTransform(pathLength, [0.9, 0.985], [0, 1]);

  // Latch: when the wrap completes, the finale background (gradient + road)
  // becomes permanent — it stays even scrolling back up, until page reload.
  const [finaleOn, setFinaleOn] = useState(false);
  useMotionValueEvent(pathLength, 'change', v => {
    if (v >= 0.98) setFinaleOn(true);
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

    // Start at Hero badge
    const start = getRelativeCoords(heroStart);
    let cursor: Pt = { x: start.x + start.width / 2, y: start.y + start.height };
    points.push(cursor);

    let segIdx = 0;
    const travel = (segment: Pt[]) => {
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
      points.push(...segment);
      cursor = segment[segment.length - 1]!;
    };

    // ==========================================
    // CARD 1: Organic Blob (left) — exact CSS border-radius outline
    // borderRadius: 52% 48% 68% 32% / 45% 42% 58% 55%
    // ==========================================
    const c1 = getRelativeCoords(cards[0]!);
    const o = wrapOffset;
    const per1 = roundedRectPerimeter(
      c1.x - o,
      c1.y - o,
      c1.width + o * 2,
      c1.height + o * 2,
      {
        tl: [c1.width * 0.52 + o, c1.height * 0.45 + o],
        tr: [c1.width * 0.48 + o, c1.height * 0.42 + o],
        br: [c1.width * 0.68 + o, c1.height * 0.58 + o],
        bl: [c1.width * 0.32 + o, c1.height * 0.55 + o]
      }
    );
    const e1 = { x: c1.x + c1.width * 0.85, y: c1.y - o };

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
    travel(wrapShape(per1, e1, true, { x: c1.x + c1.width, y: c1.y + c1.height }));

    // ==========================================
    // CARD 2: Rounded Rectangle (right) — rounded-2xl = 16px
    // ==========================================
    const c2 = getRelativeCoords(cards[1]!);
    const r2 = 16 + o;
    const per2 = roundedRectPerimeter(
      c2.x - o,
      c2.y - o,
      c2.width + o * 2,
      c2.height + o * 2,
      { tl: [r2, r2], tr: [r2, r2], br: [r2, r2], bl: [r2, r2] }
    );
    const e2 = { x: c2.x + c2.width * 0.15, y: c2.y - o };

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
    travel(wrapShape(per2, e2, false, { x: c2.x, y: c2.y + c2.height }));

    // ==========================================
    // CARD 3: Pill (left) — rounded-[50px]
    // ==========================================
    const c3 = getRelativeCoords(cards[2]!);
    const r3 = 50 + o;
    const per3 = roundedRectPerimeter(
      c3.x - o,
      c3.y - o,
      c3.width + o * 2,
      c3.height + o * 2,
      { tl: [r3, r3], tr: [r3, r3], br: [r3, r3], bl: [r3, r3] }
    );
    const e3 = { x: c3.x + c3.width * 0.85, y: c3.y - o };

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
    travel(wrapShape(per3, e3, true, { x: c3.x + c3.width, y: c3.y + c3.height }));

    // ==========================================
    // CARD 4: Diamond (right) — exact clip-path outline
    // ==========================================
    const c4 = getRelativeCoords(cards[3]!);
    const per4 = diamondPerimeter(c4.x, c4.y, c4.width, c4.height, o);
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
    travel(
      wrapShape(per4, e4, false, {
        x: c4.x + c4.width * 0.25,
        y: c4.y + c4.height * 0.78
      })
    );

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
                className="relative z-20 w-full max-w-[440px] p-8 md:p-10 text-slate-100 flex flex-col items-start justify-center min-h-[280px] bg-slate-900/50 backdrop-blur-md border border-slate-800/60 shadow-2xl transition-all duration-300 hover:border-slate-700/60"
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
                className="relative z-20 w-full max-w-[440px] p-8 md:p-10 rounded-2xl text-slate-100 flex flex-col items-start justify-center min-h-[280px] bg-slate-900/50 backdrop-blur-md border border-slate-800/60 shadow-2xl transition-all duration-300 hover:border-slate-700/60"
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
                className="relative z-20 w-full max-w-[440px] p-8 md:p-10 rounded-[50px] text-slate-100 flex flex-col items-start justify-center min-h-[280px] bg-slate-900/50 backdrop-blur-md border border-slate-800/60 shadow-2xl transition-all duration-300 hover:border-slate-700/60"
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
                  className="relative z-20 w-[340px] aspect-square flex items-center justify-center p-8 bg-slate-900/50 backdrop-blur-md border border-slate-800/60 shadow-2xl transition-all duration-300 hover:border-slate-700/60 [clip-path:polygon(50%_0%,_100%_50%,_50%_100%,_0%_50%)]"
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
        <div className="relative rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur-md p-8 md:p-12 shadow-2xl">
          <div
            ref={termsTextRef}
            className="relative z-[5] p-6 md:p-8 rounded-2xl border border-slate-800/80 bg-slate-900/20"
          >
            <div className="flex items-center gap-2 mb-6 justify-center">
              <FileText className="h-5 w-5 text-orange-500" />
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Termini e Condizioni
              </h3>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-400 leading-relaxed">
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
