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
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Zap, ArrowRight, FileText, Moon } from 'lucide-react';

import {
  type Pt,
  smoothPath,
  roundedRectPerimeter,
  diamondPerimeter,
  wrapShape,
  unit,
  flowTo,
  glyphTradingCards,
  glyphEuroCoin,
  glyphShieldCheck,
  glyphTruck
} from '@/lib/brx-express/smooth-path';

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
// CARD REVEAL â€” the river DRAWS each card's border (same exact shape),
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
      {/* Core border â€” same animated gradient as the river: this IS the river */}
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
      {/* Light streaks flowing along the card border â€” they ignite on fusion,
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
  const { t } = useTranslation();
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
  // becomes permanent â€” it stays even scrolling back up, until page reload.
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
    // Per-card: exact border ring (offset 0 â€” the card's REAL shape) plus the
    // indices in `points` where the river starts/finishes hugging the card,
    // so the border draws in sync with the line.
    const cardInfos: { ring: Pt[]; startIdx: number; endIdx: number }[] = [];

    // Start at Hero badge
    const start = getRelativeCoords(heroStart);
    let cursor: Pt = { x: start.x + start.width / 2, y: start.y + start.height };
    points.push(cursor);

    let segIdx = 0;
    // Returns the index in `points` where the segment itself begins (AFTER the
    // connector lead-in) â€” needed to sync card borders with the river's touch.
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
    // CARD 1: Organic Blob (left) â€” exact CSS border-radius outline
    // borderRadius: 52% 48% 68% 32% / 45% 42% 58% 55%
    // ==========================================
    const c1 = getRelativeCoords(cards[0]!);
    const o = wrapOffset;
    // ONE line: the river hugs the card's EXACT edge (offset 0) â€” the river
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
    // CARD 2: Rounded Rectangle (right) â€” rounded-2xl = 16px
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
      // Glyph: euro coin, beside Card 2 â€” full ring first, then the "â‚¬" inside
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
    // CARD 3: Pill (left) â€” rounded-[50px]
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
      // Glyph: badge shield + check, beside Card 3 â€” full outline loop first,
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
    // CARD 4: Diamond (right) â€” exact clip-path outline
    // ==========================================
    const c4 = getRelativeCoords(cards[3]!);
    const per4 = diamondPerimeter(c4.x, c4.y, c4.width, c4.height, 0);
    const e4 = { x: c4.x + c4.width * 0.22, y: c4.y + c4.height * 0.22 };

    if (showGlyphs) {
      // Glyph: delivery truck, beside Card 4 (facing it) â€” body loop first,
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
    // TERMS: full wrap around the text block â€” the river's final frame
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
    // Deterministic pseudo-random (stable across resizes â€” stars don't jump)
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
          tied to the finale opacity â€” only those who journey back up after
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
          <span className="brx-egg-star" style={{ top: '-14px', left: '6%', fontSize: '9px', animationDelay: '-0.3s' }}>âœ¦</span>
          <span className="brx-egg-star" style={{ top: '-9px', right: '12%', fontSize: '13px', animationDelay: '-1.1s' }}>âœ¦</span>
          <span className="brx-egg-star" style={{ bottom: '-12px', left: '18%', fontSize: '11px', animationDelay: '-1.8s' }}>âœ¦</span>
          <span className="brx-egg-star" style={{ bottom: '-8px', right: '5%', fontSize: '8px', animationDelay: '-0.7s' }}>âœ¦</span>
          <span className="brx-egg-star" style={{ top: '40%', left: '-18px', fontSize: '10px', animationDelay: '-2.4s' }}>âœ¦</span>
          {/* The pill: starfield inside, cosmic gradient border */}
          <div className="brx-moon-pill relative flex items-center gap-2 rounded-full px-4 py-2">
            <Moon className="h-4 w-4 shrink-0 text-amber-200 [filter:drop-shadow(0_0_6px_rgba(251,191,36,0.85))]" />
            <span className="text-[10px] sm:text-xs font-semibold text-indigo-100 whitespace-nowrap">
              {t('brxExpress.moonDisclaimer')}
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
        /* Card birth: blooms out of the line â€” soft blur-in, gentle overshoot,
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

          {/* Layer 4: light streaks travelling ALONG the path direction â€”
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
          light streaks as the river â€” visually fused with the line. */}
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
              visible before the line arrives â€” the line then threads them */}
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
            {t('brxExpress.shippingBadge')}
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-white">
          BRX Express
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {t('brxExpress.heroDescription')}
        </p>

        <div className="mt-6 flex justify-center">
          <button className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-orange-500/20">
            <span className="relative z-10 flex items-center gap-1.5">
              {t('brxExpress.cta')}
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
            {t('brxExpress.howItWorksTitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
            {t('brxExpress.howItWorksSubtitle')}
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
                <h3 className="text-xl font-bold text-white tracking-tight">{t('brxExpress.card1.title')}</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  {t('brxExpress.card1.description')}
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
                <h3 className="text-xl font-bold text-white tracking-tight">{t('brxExpress.card2.title')}</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  {t('brxExpress.card2.description')}
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
                <h3 className="text-xl font-bold text-white tracking-tight">{t('brxExpress.card3.title')}</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  {t('brxExpress.card3.description')}
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
                    <h3 className="text-base font-bold text-white tracking-tight">{t('brxExpress.card4.title')}</h3>
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                      {t('brxExpress.card4.description')}
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
                {t('brxExpress.termsTitle')}
              </h3>
            </div>

            {/* legal content â€” intentionally not i18n */}
            <ul
              className={`space-y-4 text-xs sm:text-sm leading-relaxed transition-colors duration-1000 ${
                finaleOn ? 'text-white' : 'text-slate-400'
              }`}
            >
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">â€¢</span>
                <span>
                  <strong>Accettazione Valutazione:</strong> L'invio delle carte all'hub implica l'accettazione insindacabile del grading e della digitalizzazione operati dal team tecnico di BRX.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">â€¢</span>
                <span>
                  <strong>Tariffa Upload:</strong> Si applica un costo fisso di 0,30â‚¬ per ciascuna carta inserita a catalogo a titolo di costi di inbound, ispezione e digitalizzazione.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">â€¢</span>
                <span>
                  <strong>Commissioni:</strong> Al completamento di ogni transazione di vendita viene applicata una trattenuta del 10% sul prezzo dell'asset, fino ad un massimale di 100â‚¬ per singola carta.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">â€¢</span>
                <span>
                  <strong>Tempistiche Spedizione:</strong> La spedizione 24h Ã¨ garantita nei giorni lavorativi ed Ã¨ soggetta alla stabilitÃ  operativa dei corrieri espressi designati da BRX Express.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-orange-500 mt-1 select-none">â€¢</span>
                <span>
                  <strong>Riconsegna Stock:</strong> Il venditore puÃ² revocare il mandato di vendita e richiedere il rientro fisico delle proprie carte in qualsiasi momento, facendosi carico delle spese di spedizione.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
