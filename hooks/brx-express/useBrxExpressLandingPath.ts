'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

import type { CardMark } from '@/components/feature/brx-express/landing/BrxExpressLandingFx';
import {
  buildLandingPath,
  layoutRectFromDom,
  type GlyphMark,
} from '@/lib/brx-express/build-landing-path';

export interface UseBrxExpressLandingPathReturn {
  containerRef: RefObject<HTMLDivElement>;
  heroStartRef: RefObject<HTMLSpanElement>;
  cardRefs: [
    RefObject<HTMLDivElement>,
    RefObject<HTMLDivElement>,
    RefObject<HTMLDivElement>,
    RefObject<HTMLDivElement>,
  ];
  termsTextRef: RefObject<HTMLDivElement>;
  pathD: string;
  glyphMarks: GlyphMark[];
  cardMarks: CardMark[];
  mounted: boolean;
}

/**
 * Misura il layout DOM e calcola path SVG + mark per l'animazione scroll-driven.
 * Estratto da BrxExpressLanding — ResizeObserver + buildLandingPath puro.
 */
export function useBrxExpressLandingPath(): UseBrxExpressLandingPathReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroStartRef = useRef<HTMLSpanElement>(null);
  const cardRef0 = useRef<HTMLDivElement>(null);
  const cardRef1 = useRef<HTMLDivElement>(null);
  const cardRef2 = useRef<HTMLDivElement>(null);
  const cardRef3 = useRef<HTMLDivElement>(null);
  const cardRefsRef = useRef([
    cardRef0,
    cardRef1,
    cardRef2,
    cardRef3,
  ] as UseBrxExpressLandingPathReturn['cardRefs']);
  const cardRefs = cardRefsRef.current;
  const termsTextRef = useRef<HTMLDivElement>(null);

  const [pathD, setPathD] = useState('');
  const [glyphMarks, setGlyphMarks] = useState<GlyphMark[]>([]);
  const [cardMarks, setCardMarks] = useState<CardMark[]>([]);
  const [mounted, setMounted] = useState(false);

  const updatePath = () => {
    const container = containerRef.current;
    const heroStart = heroStartRef.current;
    const cards = cardRefs.map((r) => r.current);
    const termsText = termsTextRef.current;

    if (!container || !heroStart || cards.some((c) => !c) || !termsText) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const result = buildLandingPath({
      containerWidth: containerRect.width,
      heroStart: layoutRectFromDom(heroStart, containerRect),
      cards: cards.map((c) => layoutRectFromDom(c!, containerRect)) as [
        ReturnType<typeof layoutRectFromDom>,
        ReturnType<typeof layoutRectFromDom>,
        ReturnType<typeof layoutRectFromDom>,
        ReturnType<typeof layoutRectFromDom>,
      ],
      terms: layoutRectFromDom(termsText, containerRect),
    });

    setPathD(result.pathD);
    setGlyphMarks(result.glyphMarks);
    setCardMarks(result.cardMarks);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs stabili, come nell'originale
  }, []);

  return {
    containerRef,
    heroStartRef,
    cardRefs,
    termsTextRef,
    pathD,
    glyphMarks,
    cardMarks,
    mounted,
  };
}
