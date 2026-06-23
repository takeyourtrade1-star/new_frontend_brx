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
  glyphTruck,
} from '@/lib/brx-express/smooth-path';

import type { CardMark, Star } from '@/components/feature/brx-express/landing/BrxExpressLandingFx';

export type LayoutRect = { x: number; y: number; width: number; height: number };

export type LandingPathLayout = {
  containerWidth: number;
  heroStart: LayoutRect;
  cards: [LayoutRect, LayoutRect, LayoutRect, LayoutRect];
  terms: LayoutRect;
};

export type GlyphMark = { d: string; at: number };

export type LandingPathResult = {
  pathD: string;
  glyphMarks: GlyphMark[];
  cardMarks: CardMark[];
};

/**
 * Costruisce il path SVG del fiume scroll-driven e i mark per glyph/card reveal.
 * Estratto verbatim da BrxExpressLanding.updatePath — zero DOM, solo geometria.
 */
export function buildLandingPath(layout: LandingPathLayout): LandingPathResult {
  const { containerWidth: cw, heroStart, cards, terms: termsRect } = layout;
  const showGlyphs = cw >= 768;

  const mirrorX = (c: { x: number; width: number }) => cw - (c.x + c.width / 2);

  const wrapOffset = 10;
  const points: Pt[] = [];
  const marks: { shapes: Pt[][]; endIdx: number }[] = [];
  const cardInfos: { ring: Pt[]; startIdx: number; endIdx: number }[] = [];

  let cursor: Pt = { x: heroStart.x + heroStart.width / 2, y: heroStart.y + heroStart.height };
  points.push(cursor);

  let segIdx = 0;
  const travel = (segment: Pt[]): number => {
    const last = points[points.length - 1]!;
    const prev = points.length > 1 ? points[points.length - 2] : null;
    const startDir = prev ? unit(last.x - prev.x, last.y - prev.y) : { x: 0, y: 1 };
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

  const o = wrapOffset;

  const c1 = cards[0];
  const per1 = roundedRectPerimeter(c1.x, c1.y, c1.width, c1.height, {
    tl: [c1.width * 0.52, c1.height * 0.45],
    tr: [c1.width * 0.48, c1.height * 0.42],
    br: [c1.width * 0.68, c1.height * 0.58],
    bl: [c1.width * 0.32, c1.height * 0.55],
  });
  const e1 = { x: c1.x + c1.width * 0.85, y: c1.y };

  if (showGlyphs) {
    const g = { x: mirrorX(c1), y: c1.y + c1.height * 0.25 };
    const { back, front } = glyphTradingCards(g.x, g.y, 112);
    travel(wrapShape(back, cursor, true, front[0]!, true));
    travel(wrapShape(front, cursor, true, e1, true));
    marks.push({
      shapes: [[...back, back[0]!], [...front, front[0]!]],
      endIdx: points.length - 1,
    });
  }

  const wrapStart1 = travel(
    wrapShape(per1, e1, true, { x: c1.x + c1.width, y: c1.y + c1.height }),
  );
  cardInfos.push({
    ring: wrapShape(per1, e1, true, undefined, true),
    startIdx: wrapStart1,
    endIdx: points.length - 1,
  });

  const c2 = cards[1];
  const per2 = roundedRectPerimeter(c2.x, c2.y, c2.width, c2.height, {
    tl: [16, 16],
    tr: [16, 16],
    br: [16, 16],
    bl: [16, 16],
  });
  const e2 = { x: c2.x + c2.width * 0.15, y: c2.y };

  if (showGlyphs) {
    const g = { x: mirrorX(c2), y: c2.y + c2.height * 0.25 };
    const coin = glyphEuroCoin(g.x, g.y, 112);
    travel(wrapShape(coin.ring, cursor, false, coin.euro[0]!, true));
    travel(coin.euro);
    marks.push({
      shapes: [[...coin.ring, coin.ring[0]!], coin.euro],
      endIdx: points.length - 1,
    });
  }

  const wrapStart2 = travel(wrapShape(per2, e2, false, { x: c2.x, y: c2.y + c2.height }));
  cardInfos.push({
    ring: wrapShape(per2, e2, false, undefined, true),
    startIdx: wrapStart2,
    endIdx: points.length - 1,
  });

  const c3 = cards[2];
  const per3 = roundedRectPerimeter(c3.x, c3.y, c3.width, c3.height, {
    tl: [50, 50],
    tr: [50, 50],
    br: [50, 50],
    bl: [50, 50],
  });
  const e3 = { x: c3.x + c3.width * 0.85, y: c3.y };

  if (showGlyphs) {
    const g = { x: mirrorX(c3), y: c3.y + c3.height * 0.25 };
    const shield = glyphShieldCheck(g.x, g.y, 112);
    travel(wrapShape(shield.outline, cursor, false, shield.check[0]!, true));
    travel(shield.check);
    marks.push({
      shapes: [[...shield.outline, shield.outline[0]!], shield.check],
      endIdx: points.length - 1,
    });
  }

  const wrapStart3 = travel(
    wrapShape(per3, e3, true, { x: c3.x + c3.width, y: c3.y + c3.height }),
  );
  cardInfos.push({
    ring: wrapShape(per3, e3, true, undefined, true),
    startIdx: wrapStart3,
    endIdx: points.length - 1,
  });

  const c4 = cards[3];
  const per4 = diamondPerimeter(c4.x, c4.y, c4.width, c4.height, 0);
  const e4 = { x: c4.x + c4.width * 0.22, y: c4.y + c4.height * 0.22 };

  if (showGlyphs) {
    const g = { x: mirrorX(c4), y: c4.y + c4.height * 0.3 };
    const truck = glyphTruck(g.x, g.y, 118);
    travel(wrapShape(truck.body, cursor, false, truck.rearWheel[0]!, true));
    travel(wrapShape(truck.rearWheel, cursor, false, truck.frontWheel[0]!, true));
    travel(wrapShape(truck.frontWheel, cursor, false, e4, true));
    marks.push({
      shapes: [
        [...truck.body, truck.body[0]!],
        [...truck.rearWheel, truck.rearWheel[0]!],
        [...truck.frontWheel, truck.frontWheel[0]!],
      ],
      endIdx: points.length - 1,
    });
  }

  const wrapStart4 = travel(
    wrapShape(per4, e4, false, {
      x: c4.x + c4.width * 0.25,
      y: c4.y + c4.height * 0.78,
    }),
  );
  cardInfos.push({
    ring: wrapShape(per4, e4, false, undefined, true),
    startIdx: wrapStart4,
    endIdx: points.length - 1,
  });

  const rT = 16 + o;
  const perT = roundedRectPerimeter(
    termsRect.x - o,
    termsRect.y - o,
    termsRect.width + o * 2,
    termsRect.height + o * 2,
    { tl: [rT, rT], tr: [rT, rT], br: [rT, rT], bl: [rT, rT] },
  );
  travel(
    wrapShape(
      perT,
      { x: termsRect.x + termsRect.width * 0.82, y: termsRect.y - o },
      false,
      undefined,
      true,
    ),
  );

  const pathD = smoothPath(points);

  const cum: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(
      cum[i - 1]! + Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y),
    );
  }
  const total = cum[cum.length - 1]! || 1;

  const glyphMarks: GlyphMark[] = marks.map((m) => ({
    d: m.shapes.map((s) => smoothPath(s)).join(' '),
    at: Math.min(1, cum[Math.min(m.endIdx, cum.length - 1)]! / total),
  }));

  const frand = (n: number) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  const cardMarks: CardMark[] = cardInfos.map((ci, c) => {
    const ring = ci.ring;
    const rcum: number[] = [0];
    for (let i = 1; i < ring.length; i++) {
      rcum.push(
        rcum[i - 1]! + Math.hypot(ring[i]!.x - ring[i - 1]!.x, ring[i]!.y - ring[i - 1]!.y),
      );
    }
    const borderLen = rcum[rcum.length - 1]! || 1;

    const startCum = cum[Math.min(ci.startIdx, cum.length - 1)]!;
    const endCum = cum[Math.min(ci.endIdx, cum.length - 1)]!;
    const wrapLen = Math.max(endCum - startCum, 1);
    const from = startCum / total;
    const to = endCum / total;
    const mid = Math.min(wrapLen / borderLen, 0.999);
    const end = Math.min(1, Math.max(to + (borderLen - wrapLen) / total, to + 0.0005));

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
        td: frand(seed + 79) * 3,
      });
    }

    return { d: smoothPath(ring), from, to, mid, end, stars };
  });

  return { pathD, glyphMarks, cardMarks };
}

export function layoutRectFromDom(
  el: HTMLElement,
  containerRect: DOMRect,
): LayoutRect {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left - containerRect.left,
    y: rect.top - containerRect.top,
    width: rect.width,
    height: rect.height,
  };
}
