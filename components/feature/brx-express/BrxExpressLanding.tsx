'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useScroll, useSpring, useTransform, motion, type MotionValue } from 'framer-motion';
import { Zap, ArrowRight, FileText } from 'lucide-react';

type Pt = { x: number; y: number };

// Math Helper: Convert Catmull-Rom spline to Bezier curves for SVG path
function catmullRom2Bezier(points: Pt[], tension = 0.75): string {
  if (points.length < 2) return '';
  let d = `M ${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`;

  // Duplicate endpoints to compute control points for the first/last segments
  const pts = [points[0]!, ...points, points[points.length - 1]!];

  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2]!;

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;

    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

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

// River connector: a single wide, graceful C/S curve (sparse control points —
// the Catmull-Rom spline turns them into one smooth sweep, no scribbles).
function flowTo(start: Pt, end: Pt, points: Pt[]) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  // Deterministic but varied bend direction per segment
  const sign = Math.sin(start.x * 0.013 + start.y * 0.011) >= 0 ? 1 : -1;

  if (dist < 170) {
    // Short hop: one gentle C bend
    const amp = dist * 0.14 * sign;
    points.push({
      x: start.x + dx * 0.5 + nx * amp,
      y: start.y + dy * 0.5 + ny * amp
    });
  } else {
    // Long stretch: one elegant S sweep
    const amp = Math.min(72, dist * 0.16);
    points.push({
      x: start.x + dx * 0.3 + nx * amp * sign,
      y: start.y + dy * 0.3 + ny * amp * sign
    });
    points.push({
      x: start.x + dx * 0.72 - nx * amp * sign * 0.85,
      y: start.y + dy * 0.72 - ny * amp * sign * 0.85
    });
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
    back: mk(-s * 0.17, -s * 0.04, -0.3),
    front: mk(s * 0.15, s * 0.06, -0.05)
  };
}

// Card 2 "Vendiamo per te": a five-point star (sponsored visibility) drawn
// pentagram-style — one continuous stroke, crisp points, ends where it
// starts. Returns the visible shape (`shape`) and the same points plus the
// exit tail (`stroke`) that the river follows to leave the glyph.
function glyphStar(cx: number, cy: number, s: number): { shape: Pt[]; stroke: Pt[] } {
  const R = s * 0.55;
  const vertex = (k: number): Pt => {
    const a = ((-90 + 72 * k) * Math.PI) / 180;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  };
  // Pentagram order: every second vertex, back to the top
  const raw = [0, 2, 4, 1, 3, 0].map(vertex);
  const shape = densify(raw, 6);
  return { shape, stroke: [...shape, { x: cx + s * 0.32, y: cy - s * 0.78 }] };
}

// Card 3 "Zero doppie vendite": smooth badge shield — sparse anchors let
// the spline round it gracefully; only the check is densified so its
// corner stays crisp.
function glyphShieldCheck(cx: number, cy: number, s: number): { shape: Pt[]; stroke: Pt[] } {
  const outline: Pt[] = [
    { x: cx - s * 0.44, y: cy - s * 0.38 }, // top-left corner
    { x: cx, y: cy - s * 0.44 }, // gentle top arc
    { x: cx + s * 0.44, y: cy - s * 0.38 }, // top-right corner
    { x: cx + s * 0.45, y: cy - s * 0.05 }, // right side
    { x: cx + s * 0.32, y: cy + s * 0.24 }, // curving in
    { x: cx + s * 0.12, y: cy + s * 0.42 },
    { x: cx, y: cy + s * 0.5 }, // rounded bottom tip
    { x: cx - s * 0.12, y: cy + s * 0.42 },
    { x: cx - s * 0.32, y: cy + s * 0.24 },
    { x: cx - s * 0.45, y: cy - s * 0.05 }, // left side
    { x: cx - s * 0.44, y: cy - s * 0.38 } // close at top-left
  ];
  const check = densify(
    [
      { x: cx - s * 0.19, y: cy - s * 0.02 },
      { x: cx - s * 0.05, y: cy + s * 0.16 }, // crisp valley
      { x: cx + s * 0.25, y: cy - s * 0.2 }
    ],
    6
  );
  const shape = [...outline, ...check];
  return { shape, stroke: [...shape, { x: cx + s * 0.55, y: cy - s * 0.55 }] };
}

// Card 4 "Fulfillment 24h": a one-stroke delivery truck (facing the card)
function glyphTruck(cx: number, cy: number, s: number): Pt[] {
  const hw = s * 0.62;
  const hh = s * 0.3;
  const x0 = cx - hw;
  const x1 = cx + hw;
  const y0 = cy - hh;
  const by = cy + hh;
  const xc = cx + s * 0.16; // cargo/cab split
  const yc = cy - s * 0.06; // cab roof
  const r = s * 0.105;
  const wr = cx - s * 0.32; // rear wheel
  const wf = cx + s * 0.36; // front wheel

  const bump = (wx: number): Pt[] => [
    { x: wx + r, y: by },
    { x: wx + r * 0.55, y: by - r * 0.95 },
    { x: wx, y: by - r * 1.25 },
    { x: wx - r * 0.55, y: by - r * 0.95 },
    { x: wx - r, y: by }
  ];

  // CW closed ring (drop the duplicated closing point after densify)
  return densify([
    { x: x0, y: y0 }, // cargo top-left
    { x: xc, y: y0 }, // cargo top-right
    { x: xc, y: yc }, // down to cab roof
    { x: xc + s * 0.24, y: yc }, // cab roof
    { x: x1 - s * 0.03, y: cy + s * 0.02 }, // windshield slant
    { x: x1, y: cy + s * 0.1 }, // hood
    { x: x1, y: by }, // front bottom
    ...bump(wf), // front wheel
    ...bump(wr), // rear wheel
    { x: x0, y: by }, // back bottom
    { x: x0, y: y0 } // left side up (ring closes at top-left)
  ]).slice(0, -1);
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
        strokeWidth={11}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
        style={{ opacity: glowOpacity }}
      />
      <motion.path
        d={d}
        fill="none"
        stroke="#22D3EE"
        strokeWidth={5}
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

    const travel = (segment: Pt[]) => {
      flowTo(cursor, segment[0]!, points);
      points.push(...segment);
      cursor = segment[segment.length - 1]!;
    };

    const travelGlyph = (stroke: Pt[], shapes: Pt[][]) => {
      travel(stroke);
      marks.push({ shapes, endIdx: points.length - 1 });
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
      const { back, front } = glyphTradingCards(g.x, g.y, 105);
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
      // Glyph: five-point star, beside Card 2
      const g = { x: mirrorX(c2), y: c2.y + c2.height * 0.25 };
      const star = glyphStar(g.x, g.y, 105);
      travelGlyph(star.stroke, [star.shape]);
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
      // Glyph: shield + check, beside Card 3
      const g = { x: mirrorX(c3), y: c3.y + c3.height * 0.25 };
      const shield = glyphShieldCheck(g.x, g.y, 100);
      travelGlyph(shield.stroke, [shield.shape]);
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
      // Glyph: delivery truck, beside Card 4 (facing it)
      const g = { x: mirrorX(c4), y: c4.y + c4.height * 0.3 };
      const ring = glyphTruck(g.x, g.y, 110);
      travelGlyph(wrapShape(ring, cursor, false, e4, true), [[...ring, ring[0]!]]);
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

    setPathD(catmullRom2Bezier(points));

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
        d: m.shapes.map(s => catmullRom2Bezier(s)).join(' '),
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
              <stop offset="0%" stopColor="#FF3B00" />
              <stop offset="25%" stopColor="#FF7300" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="75%" stopColor="#FF7300" />
              <stop offset="100%" stopColor="#FF3B00" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from="0,0"
                to="0,200"
                dur="2.5s"
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
          </defs>

          {/* Layer 1: Ambient thick glow trail */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth={32}
            opacity={0.05}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength }}
          />

          {/* Layer 2: Medium glowing bloom */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth={14}
            opacity={0.18}
            filter="url(#glow)"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength }}
          />

          {/* Layer 3: Core thick sharp line */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength }}
          />

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
