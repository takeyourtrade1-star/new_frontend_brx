'use client';

// Overlay dell'auto-scontro di Asso: la mascotte si sdoppia, il clone
// (specchiato e tinto di rosso) la carica tre volte con scintille d'impatto,
// poi i due si fondono di nuovo nella card. Timeline solo CSS (keyframes in
// AssoStyles.tsx), montato da AssoRoot per FIGHT_TOTAL_MS.

import type { FaceColorOption } from './faceColors';
import { AssoFace } from './AssoFace';
import { ASSO_LAYOUT } from '@/lib/asso-layout';
import { Z_INDEX } from './constants';

interface AssoFightOverlayProps {
  faceColor: FaceColorOption;
  isStickyBarVisible: boolean;
}

/** Larghezza arena: i lottatori combattono alla sinistra della card. */
const ARENA_WIDTH = 320;
const FIGHTER_W = 72;
const FIGHTER_H = 96;
/** Base dei lottatori = posizione della card dentro l'arena (punto di sdoppiamento). */
const FIGHTER_BASE_LEFT = ARENA_WIDTH - ASSO_LAYOUT.mascotWidth;
/** Punto d'impatto: i due lottatori si toccano qui (allineato ai keyframes). */
const CLASH_X = 168;
/** Delay delle scintille = istanti d'impatto (27%, 45%, 63% di FIGHT_TOTAL_MS). */
const SPARK_DELAYS_MS = [864, 1440, 2016] as const;
const SPARK_STYLES = [
  { size: 26, color: '#FFD966', top: 30 },
  { size: 20, color: '#FFB84D', top: 50 },
  { size: 32, color: '#FFF3C4', top: 38 },
] as const;

export function AssoFightOverlay({ faceColor, isStickyBarVisible }: AssoFightOverlayProps) {
  return (
    <div
      className="fight-arena fixed pointer-events-none"
      aria-hidden="true"
      style={{
        zIndex: Z_INDEX.tooltip,
        bottom: isStickyBarVisible ? ASSO_LAYOUT.mascotBottomSticky : ASSO_LAYOUT.mascotBottom,
        right: ASSO_LAYOUT.mascotRight,
        width: ARENA_WIDTH,
        height: ASSO_LAYOUT.mascotHeight,
      }}
    >
      {/* Clone "cattivo": si stacca dalla card e carica da sinistra */}
      <div
        className="fight-fighter fight-fighter-left absolute"
        style={{
          left: FIGHTER_BASE_LEFT,
          top: 16,
          width: FIGHTER_W,
          height: FIGHTER_H,
          zIndex: 2,
          borderRadius: 14,
          boxShadow: '0 0 18px rgba(220,38,38,0.4), 0 4px 14px rgba(0,0,0,0.25)',
        }}
      >
        <div className="face-fixed-neon face-fixed-neon-enemy h-full w-full p-1.5">
          <div className="fight-face-enemy h-full w-full">
            <AssoFace expression="normal" />
          </div>
        </div>
      </div>

      {/* Asso: resta sul posto e contrattacca a ogni assalto */}
      <div
        className="fight-fighter fight-fighter-right absolute"
        style={{
          left: FIGHTER_BASE_LEFT,
          top: 16,
          width: FIGHTER_W,
          height: FIGHTER_H,
          zIndex: 1,
          borderRadius: 14,
          boxShadow: `0 6px 24px ${faceColor.glowSoft}, 0 0 10px ${faceColor.glowMid}, 0 2px 8px rgba(0,0,0,0.15)`,
        }}
      >
        <div className="face-fixed-neon h-full w-full p-1.5">
          <AssoFace expression="normal" />
        </div>
      </div>

      {/* Scintille d'impatto */}
      {SPARK_STYLES.map((spark, i) => (
        <svg
          key={i}
          className="fight-spark absolute"
          viewBox="0 0 24 24"
          style={{
            left: CLASH_X,
            top: spark.top,
            width: spark.size,
            height: spark.size,
            color: spark.color,
            animationDelay: `${SPARK_DELAYS_MS[i]}ms`,
          }}
        >
          <path
            d="M12 2 L13.7 10.3 L22 12 L13.7 13.7 L12 22 L10.3 13.7 L2 12 L10.3 10.3 Z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}
