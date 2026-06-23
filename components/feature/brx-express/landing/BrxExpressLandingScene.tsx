'use client';

import { motion, type MotionValue } from 'framer-motion';
import { Moon } from 'lucide-react';

import type { GlyphMark } from '@/lib/brx-express/build-landing-path';
import {
  CardBorderFx,
  CardMaskPath,
  GlyphHighlight,
  StarFx,
  starPath,
  type CardMark,
} from '@/components/feature/brx-express/landing/BrxExpressLandingFx';

import styles from './brx-express-landing.module.css';

function BrxExpressMoonEasterEgg({
  finaleOpacity,
  finaleOn,
  moonDisclaimer,
}: {
  finaleOpacity: MotionValue<number>;
  finaleOn: boolean;
  moonDisclaimer: string;
}) {
  return (
    <motion.div
      aria-hidden
      className="absolute top-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
      style={{ opacity: finaleOn ? 1 : finaleOpacity }}
    >
      <div className={`${styles.moonEgg} relative`}>
        <div className={`${styles.moonAura} absolute -inset-7 rounded-full`} />
        <span className={styles.shootingStar} />
        <div className={`${styles.moonOrbit} absolute inset-0`}>
          <span className={styles.moonSat} />
        </div>
        <span className={styles.eggStar} style={{ top: '-14px', left: '6%', fontSize: '9px', animationDelay: '-0.3s' }}>✦</span>
        <span className={styles.eggStar} style={{ top: '-9px', right: '12%', fontSize: '13px', animationDelay: '-1.1s' }}>✦</span>
        <span className={styles.eggStar} style={{ bottom: '-12px', left: '18%', fontSize: '11px', animationDelay: '-1.8s' }}>✦</span>
        <span className={styles.eggStar} style={{ bottom: '-8px', right: '5%', fontSize: '8px', animationDelay: '-0.7s' }}>✦</span>
        <span className={styles.eggStar} style={{ top: '40%', left: '-18px', fontSize: '10px', animationDelay: '-2.4s' }}>✦</span>
        <div className={`${styles.moonPill} relative flex items-center gap-2 rounded-full px-4 py-2`}>
          <Moon className="h-4 w-4 shrink-0 text-amber-200 [filter:drop-shadow(0_0_6px_rgba(251,191,36,0.85))]" />
          <span className="text-[10px] sm:text-xs font-semibold text-indigo-100 whitespace-nowrap">
            {moonDisclaimer}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export interface BrxExpressLandingSceneProps {
  mounted: boolean;
  pathD: string;
  pathLength: MotionValue<number>;
  glyphMarks: GlyphMark[];
  cardMarks: CardMark[];
  finaleOpacity: MotionValue<number>;
  finaleOn: boolean;
  moonDisclaimer: string;
}

export function BrxExpressLandingScene({
  mounted,
  pathD,
  pathLength,
  glyphMarks,
  cardMarks,
  finaleOpacity,
  finaleOn,
  moonDisclaimer,
}: BrxExpressLandingSceneProps) {
  return (
    <>
      <motion.div
        aria-hidden
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ opacity: finaleOn ? 1 : finaleOpacity }}
      >
        <div className={`${styles.finaleGradient} absolute -inset-[50%] w-[200%] h-[200%]`} />
      </motion.div>

      <BrxExpressMoonEasterEgg
        finaleOpacity={finaleOpacity}
        finaleOn={finaleOn}
        moonDisclaimer={moonDisclaimer}
      />

      {mounted && pathD && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <defs>
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

          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength }}
          />

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

          {glyphMarks.map((m, i) => (
            <GlyphHighlight key={i} d={m.d} at={m.at} progress={pathLength} />
          ))}
        </svg>
      )}

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

          {cardMarks.map((m, i) => (
            <g key={`stars-${i}`}>
              {m.stars.map((st, si) =>
                st.dot ? (
                  <circle
                    key={si}
                    className={styles.star}
                    style={{ animationDuration: `${st.tw}s`, animationDelay: `-${st.td}s` }}
                    cx={st.x}
                    cy={st.y}
                    r={st.r}
                    fill="#CBD5E1"
                  />
                ) : (
                  <path
                    key={si}
                    className={styles.star}
                    style={{ animationDuration: `${st.tw}s`, animationDelay: `-${st.td}s` }}
                    d={starPath(st.x, st.y, st.r)}
                    fill="#E2E8F0"
                  />
                ),
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

          {cardMarks.map((m, i) => (
            <g key={`lit-${i}`} filter="url(#card-glow)">
              {m.stars.map((st, si) => (
                <StarFx key={si} star={st} progress={pathLength} />
              ))}
            </g>
          ))}
        </svg>
      )}
    </>
  );
}
