'use client';

import { useEffect, useState } from 'react';
import { motion, type Transition, type Variants } from 'framer-motion';

/* ─── Timing & easing tokens ─── */
export const LANDING_EASE = [0.16, 1, 0.3, 1] as const;
export const LANDING_EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 28,
};

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 26,
};

export const springUnderline: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 32,
};

/* ─── Viewport presets (scroll-triggered, once) ─── */
export const VIEWPORT_DEFAULT = { once: true, margin: '-80px' as const, amount: 0.15 };
export const VIEWPORT_SECTION = { once: true, margin: '-60px' as const, amount: 0.18 };
export const VIEWPORT_CARDS = { once: true, margin: '-40px' as const, amount: 0.12 };

/* ─── Reduced motion ─── */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}

/** Pick full-motion or instant variants based on user preference */
export function motionVariants(full: Variants, reduced: boolean): Variants {
  if (!reduced) return full;
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.15 },
    },
  };
}

/** Shorter durations / no infinite loops when reduced */
export function motionTransition(full: Transition, reduced: boolean): Transition {
  if (!reduced) return full;
  return { duration: 0.15 };
}

/* ─── Entrance variants ─── */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.98 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: LANDING_EASE, delay },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.45, ease: LANDING_EASE, delay },
  }),
};

export const fadeFromLeft: Variants = {
  hidden: { opacity: 0, x: -36, scale: 0.98 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.65, ease: LANDING_EASE, delay },
  }),
};

export const fadeFromRight: Variants = {
  hidden: { opacity: 0, x: 36, scale: 0.98 },
  visible: (delay = 0) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.65, ease: LANDING_EASE, delay },
  }),
};

/** Section-specific: subtle vertical lift + scale for Tornei */
export const fadeUpEmphasis: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: LANDING_EASE_OUT, delay },
  }),
};

/* ─── Stagger orchestration ─── */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.06,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

/** Stagger children while the group slides in from an edge */
export const staggerFromLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.55,
      ease: LANDING_EASE,
      staggerChildren: 0.09,
      delayChildren: 0.08,
    },
  },
};

export const staggerFromRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.55,
      ease: LANDING_EASE,
      staggerChildren: 0.09,
      delayChildren: 0.08,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.52, ease: LANDING_EASE },
  },
};

export const introStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

/* ─── Carousel slide transitions ─── */
export const slideVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 28 : -28,
    y: 8,
    scale: 0.98,
    filter: 'blur(4px)',
  }),
  center: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.42, ease: LANDING_EASE },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -20 : 20,
    y: -6,
    scale: 0.99,
    filter: 'blur(2px)',
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
  }),
};

export const slideReducedVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/* ─── Interactive micro-interactions ─── */
export const cardHover = {
  y: -4,
  scale: 1.015,
  transition: springSoft,
};

export const cardHoverReduced = {
  scale: 1.01,
  transition: { duration: 0.15 },
};

export const iconSpring = {
  scale: 1.12,
  rotate: 4,
  transition: springSnappy,
};

export const ctaHover = {
  scale: 1.03,
  boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
  transition: springSnappy,
};

export const ctaTap = { scale: 0.98 };

export const arrowNudge = {
  x: 5,
  transition: springSnappy,
};

/* ─── Ambient / decorative ─── */
export const glowPulse: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: [0.35, 0.55, 0.4],
    scale: [0.95, 1.02, 0.98],
    transition: {
      duration: 4,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    },
  },
};

export const tabIconPulse = {
  scale: [1, 1.15, 1],
  transition: { duration: 0.45, ease: LANDING_EASE },
};

export const MotionSection = motion.section;
