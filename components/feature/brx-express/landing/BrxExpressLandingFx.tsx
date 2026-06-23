'use client';

import { useState } from 'react';
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion';

export type Star = {
  x: number;
  y: number;
  r: number;
  at: number;
  dot: boolean;
  tw: number;
  td: number;
};

export type CardMark = {
  d: string;
  from: number;
  to: number;
  mid: number;
  end: number;
  stars: Star[];
};

export function GlyphHighlight({
  d,
  at,
  progress,
}: {
  d: string;
  at: number;
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, [Math.max(0, at - 0.006), at], [0, 1]);
  const glowOpacity = useTransform(opacity, (v) => v * 0.3);
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

export function starPath(cx: number, cy: number, r: number): string {
  const k = r * 0.22;
  return (
    `M ${cx} ${cy - r} Q ${cx + k} ${cy - k} ${cx + r} ${cy}` +
    ` Q ${cx + k} ${cy + k} ${cx} ${cy + r}` +
    ` Q ${cx - k} ${cy + k} ${cx - r} ${cy}` +
    ` Q ${cx - k} ${cy - k} ${cx} ${cy - r} Z`
  );
}

export function StarFx({ star, progress }: { star: Star; progress: MotionValue<number> }) {
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

export function CardMaskPath({
  d,
  from,
  to,
  mid,
  end,
  progress,
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

export function CardBorderFx({
  d,
  from,
  to,
  mid,
  end,
  progress,
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
  useMotionValueEvent(progress, 'change', (v) => setFused(v >= end - 0.002));
  return (
    <>
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
      <motion.path
        d={d}
        fill="none"
        stroke="url(#card-line-gradient)"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pathLength: draw }}
      />
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
