'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface CardLoaderProps {
  onComplete: () => void;
  duration?: number;
}

const CARD_COUNT = 5;
type ZIndexTuple = [number, number, number, number, number];

// Unique accent color per card so they're distinguishable during shuffle
const CARD_COLORS = [
  { hex: '#FF7300', rgb: '255,115,0' },
  { hex: '#818CF8', rgb: '129,140,248' },
  { hex: '#34D399', rgb: '52,211,153' },
  { hex: '#F43F5E', rgb: '244,63,94' },
  { hex: '#FBBF24', rgb: '251,191,36' },
] as const;

// Card config for each of the 5 positions
const CARD_CONFIG = [
  { shuffleClass: 'card-shuffle-1', fanClass: 'card-fan-1', exitClass: 'card-exit-1', fanZ: 10 },
  { shuffleClass: 'card-shuffle-2', fanClass: 'card-fan-2', exitClass: 'card-exit-2', fanZ: 20 },
  { shuffleClass: 'card-shuffle-3', fanClass: 'card-fan-3', exitClass: 'card-exit-3', fanZ: 30 },
  { shuffleClass: 'card-shuffle-4', fanClass: 'card-fan-4', exitClass: 'card-exit-4', fanZ: 40 },
  { shuffleClass: 'card-shuffle-5', fanClass: 'card-fan-5', exitClass: 'card-exit-5', fanZ: 50 },
] as const;

// Z-index rotation patterns for shuffle depth cycling
const Z_ORDER_PATTERNS: ZIndexTuple[] = [
  [50, 10, 30, 20, 40],
  [20, 40, 10, 50, 30],
  [30, 20, 50, 40, 10],
  [10, 50, 40, 30, 20],
  [40, 30, 20, 10, 50],
  [50, 20, 10, 40, 30],
  [10, 40, 30, 50, 20],
  [30, 10, 50, 20, 40],
];

/**
 * Synthesized riffle shuffle sound — rapid card-flick bursts with a rumble bed
 */
function playShuffleSound() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const now = ctx.currentTime;

    // Timings synced to animation: shuffle 0–2.6s, fan-out at 2.6s
    const SHUFFLE_END = 2.6;

    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);

    // --- Layer 1: Low rumble bed (full shuffle duration) ---
    const rumbleOsc = ctx.createOscillator();
    rumbleOsc.type = 'triangle';
    rumbleOsc.frequency.setValueAtTime(80, now);
    rumbleOsc.frequency.linearRampToValueAtTime(55, now + SHUFFLE_END);
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0, now);
    rumbleGain.gain.linearRampToValueAtTime(0.18, now + 0.15);
    rumbleGain.gain.setValueAtTime(0.18, now + SHUFFLE_END - 0.4);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + SHUFFLE_END);
    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(master);
    rumbleOsc.start(now);
    rumbleOsc.stop(now + SHUFFLE_END + 0.1);

    // --- Layer 2: Rapid noise bursts spanning full shuffle ---
    const burstCount = 20;
    for (let i = 0; i < burstCount; i++) {
      const t = now + 0.1 + (i / burstCount) * (SHUFFLE_END - 0.2);
      const burstLen = 0.02 + Math.random() * 0.03;

      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * burstLen), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let s = 0; s < data.length; s++) {
        data[s] = (Math.random() * 2 - 1) * Math.exp(-s / (data.length * 0.25));
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2800 + Math.random() * 2000;
      bp.Q.value = 0.6 + Math.random() * 0.4;

      const g = ctx.createGain();
      const vol = 0.25 + Math.random() * 0.3;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + burstLen);

      src.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start(t);
      src.stop(t + burstLen + 0.01);
    }

    // --- Layer 3: Three "thwap" hits spaced across shuffle ---
    [0.05, 1.1, 2.0].forEach((offset) => {
      const tt = now + offset;
      const thwap = ctx.createOscillator();
      thwap.type = 'sawtooth';
      thwap.frequency.setValueAtTime(250, tt);
      thwap.frequency.exponentialRampToValueAtTime(90, tt + 0.04);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 600;
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(0, tt);
      tg.gain.linearRampToValueAtTime(0.45, tt + 0.002);
      tg.gain.exponentialRampToValueAtTime(0.001, tt + 0.05);
      thwap.connect(lp);
      lp.connect(tg);
      tg.connect(master);
      thwap.start(tt);
      thwap.stop(tt + 0.06);
    });

    // --- Layer 4: Fan-out whoosh — punchy, decisive spread at 2.6s ---
    const whooshT = now + SHUFFLE_END;
    const whooshBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.2), ctx.sampleRate);
    const whooshData = whooshBuf.getChannelData(0);
    for (let s = 0; s < whooshData.length; s++) {
      whooshData[s] = (Math.random() * 2 - 1) * Math.sin((s / whooshData.length) * Math.PI);
    }
    const whooshSrc = ctx.createBufferSource();
    whooshSrc.buffer = whooshBuf;
    const whooshBP = ctx.createBiquadFilter();
    whooshBP.type = 'bandpass';
    whooshBP.frequency.setValueAtTime(1200, whooshT);
    whooshBP.frequency.exponentialRampToValueAtTime(400, whooshT + 0.2);
    whooshBP.Q.value = 0.5;
    const whooshGain = ctx.createGain();
    whooshGain.gain.setValueAtTime(0, whooshT);
    whooshGain.gain.linearRampToValueAtTime(0.55, whooshT + 0.01);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, whooshT + 0.2);
    whooshSrc.connect(whooshBP);
    whooshBP.connect(whooshGain);
    whooshGain.connect(master);
    whooshSrc.start(whooshT);
    whooshSrc.stop(whooshT + 0.25);

    // --- Layer 5: Hard snap at fan moment (decisive impact) ---
    const snapT = now + SHUFFLE_END;
    const snapOsc = ctx.createOscillator();
    snapOsc.type = 'square';
    snapOsc.frequency.setValueAtTime(400, snapT);
    snapOsc.frequency.exponentialRampToValueAtTime(70, snapT + 0.025);
    const snapLP = ctx.createBiquadFilter();
    snapLP.type = 'lowpass';
    snapLP.frequency.value = 900;
    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0, snapT);
    snapGain.gain.linearRampToValueAtTime(0.5, snapT + 0.001);
    snapGain.gain.exponentialRampToValueAtTime(0.001, snapT + 0.035);
    snapOsc.connect(snapLP);
    snapLP.connect(snapGain);
    snapGain.connect(master);
    snapOsc.start(snapT);
    snapOsc.stop(snapT + 0.05);

    // --- Layer 6: Exit flutter — descending card-fly-away at 3.2s ---
    const EXIT_T = now + 3.2;
    // Descending noise sweep (cards scattering)
    const flutterLen = 0.4;
    const flutterBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * flutterLen), ctx.sampleRate);
    const flutterData = flutterBuf.getChannelData(0);
    for (let s = 0; s < flutterData.length; s++) {
      const env = Math.exp(-s / (flutterData.length * 0.15));
      flutterData[s] = (Math.random() * 2 - 1) * env;
    }
    const flutterSrc = ctx.createBufferSource();
    flutterSrc.buffer = flutterBuf;
    const flutterBP = ctx.createBiquadFilter();
    flutterBP.type = 'bandpass';
    flutterBP.frequency.setValueAtTime(1800, EXIT_T);
    flutterBP.frequency.exponentialRampToValueAtTime(300, EXIT_T + flutterLen);
    flutterBP.Q.value = 0.8;
    const flutterGain = ctx.createGain();
    flutterGain.gain.setValueAtTime(0, EXIT_T);
    flutterGain.gain.linearRampToValueAtTime(0.3, EXIT_T + 0.02);
    flutterGain.gain.exponentialRampToValueAtTime(0.001, EXIT_T + flutterLen);
    flutterSrc.connect(flutterBP);
    flutterBP.connect(flutterGain);
    flutterGain.connect(master);
    flutterSrc.start(EXIT_T);
    flutterSrc.stop(EXIT_T + flutterLen + 0.05);

    // Rapid 5-tap stagger (one per card flying out)
    for (let c = 0; c < 5; c++) {
      const tapT = EXIT_T + c * 0.045;
      const tapBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.015), ctx.sampleRate);
      const tapData = tapBuf.getChannelData(0);
      for (let s = 0; s < tapData.length; s++) {
        tapData[s] = (Math.random() * 2 - 1) * Math.exp(-s / (tapData.length * 0.2));
      }
      const tapSrc = ctx.createBufferSource();
      tapSrc.buffer = tapBuf;
      const tapBP = ctx.createBiquadFilter();
      tapBP.type = 'bandpass';
      tapBP.frequency.value = 3000 - c * 400;
      tapBP.Q.value = 1;
      const tapG = ctx.createGain();
      tapG.gain.setValueAtTime(0.25 - c * 0.03, tapT);
      tapG.gain.exponentialRampToValueAtTime(0.001, tapT + 0.015);
      tapSrc.connect(tapBP);
      tapBP.connect(tapG);
      tapG.connect(master);
      tapSrc.start(tapT);
      tapSrc.stop(tapT + 0.02);
    }
  } catch {
    // Audio not supported
  }
}

export function CardLoader({ onComplete, duration = 3900 }: CardLoaderProps) {
  const [phase, setPhase] = useState<'shuffle' | 'fan' | 'complete'>('shuffle');
  const [isVisible, setIsVisible] = useState(true);
  const [shuffleZIndex, setShuffleZIndex] = useState<ZIndexTuple>([10, 20, 30, 40, 50]);
  const soundPlayedRef = useRef(false);

  // Play shuffle sound on mount
  useEffect(() => {
    if (!soundPlayedRef.current) {
      soundPlayedRef.current = true;
      playShuffleSound();
    }
  }, []);

  useEffect(() => {
    const shuffleTimer = setTimeout(() => setPhase('fan'), 2600);
    const fanTimer = setTimeout(() => setPhase('complete'), 3200);
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete(), 80);
    }, duration);

    return () => {
      clearTimeout(shuffleTimer);
      clearTimeout(fanTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  // Cycle z-index during shuffle
  useEffect(() => {
    if (phase !== 'shuffle') return;
    let idx = 0;
    const interval = setInterval(() => {
      setShuffleZIndex(Z_ORDER_PATTERNS[idx % Z_ORDER_PATTERNS.length]);
      idx++;
    }, 340);
    return () => clearInterval(interval);
  }, [phase]);

  const renderCard = useCallback((cardIndex: number) => {
    const cfg = CARD_CONFIG[cardIndex];
    const color = CARD_COLORS[cardIndex];
    const phaseClass =
      phase === 'shuffle' ? `${cfg.shuffleClass} card-shuffle-shine`
      : phase === 'fan' ? cfg.fanClass
      : cfg.exitClass;

    return (
      <div
        key={cardIndex}
        className={`absolute left-1/2 top-1/2 h-[11rem] w-[7rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl ${phaseClass} ${phase === 'shuffle' ? `card-glow-${cardIndex}` : ''}`}
        style={{
          transformOrigin: 'center bottom',
          borderWidth: 1,
          borderColor: `rgba(${color.rgb}, 0.6)`,
          background: 'linear-gradient(150deg, #1c1c22 0%, #0e0e12 35%, #16161b 70%, #1c1c22 100%)',
          boxShadow: phase === 'shuffle'
            ? `0 ${8 + shuffleZIndex[cardIndex]}px ${30 + shuffleZIndex[cardIndex] * 2}px rgba(${color.rgb}, ${0.2 + shuffleZIndex[cardIndex] * 0.006}), 0 2px 6px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(${color.rgb}, 0.08)`
            : `0 14px 44px rgba(${color.rgb}, 0.3), 0 4px 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(${color.rgb}, 0.08)`,
          zIndex: phase === 'shuffle' ? shuffleZIndex[cardIndex] : cfg.fanZ,
          transition: 'z-index 150ms ease-out, box-shadow 150ms ease-out',
        }}
      >
        {/* Inner border glow */}
        <div className="absolute inset-[1px] rounded-2xl border border-white/[0.05]" />

        {/* Card face */}
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-1.5">
          {/* Top line */}
          <div
            className="absolute left-3.5 right-3.5 top-3.5 h-px"
            style={{ background: `linear-gradient(to right, transparent, rgba(${color.rgb}, 0.3), transparent)` }}
          />

          {/* Diamond accent */}
          <div
            className="mb-0.5 h-2 w-2 rotate-45"
            style={{ border: `1px solid rgba(${color.rgb}, 0.5)`, boxShadow: `0 0 8px rgba(${color.rgb}, 0.3)` }}
          />

          {/* Inner glow ring behind text */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 48,
              height: 48,
              background: `radial-gradient(circle, rgba(${color.rgb}, 0.15) 0%, transparent 70%)`,
              animation: phase === 'shuffle' ? `cardGlowRing 1.6s ease-in-out infinite ${cardIndex * 0.2}s` : 'none',
            }}
          />
          <span
            className="relative font-comodo text-[1.75rem] font-extrabold tracking-tight"
            style={{ color: color.hex, filter: `drop-shadow(0 2px 10px rgba(${color.rgb}, 0.45))` }}
          >
            BRX
          </span>
          <span className="text-[0.5rem] font-medium uppercase tracking-[0.3em] text-zinc-500/80">
            Ebartex
          </span>

          {/* Bottom line */}
          <div
            className="absolute bottom-3.5 left-3.5 right-3.5 h-px"
            style={{ background: `linear-gradient(to right, transparent, rgba(${color.rgb}, 0.3), transparent)` }}
          />
        </div>

        {/* Corner brackets */}
        {[[' left-2 top-2', 'left-0 top-0'], ['right-2 top-2', 'right-0 top-0'], ['bottom-2 left-2', 'bottom-0 left-0'], ['bottom-2 right-2', 'bottom-0 right-0']].map(([pos, inner], ci) => (
          <div key={ci} className={`absolute ${pos} h-2.5 w-2.5`}>
            <div className={`absolute ${inner} h-[1.5px] w-2 rounded-full`} style={{ backgroundColor: `rgba(${color.rgb}, 0.5)` }} />
            <div className={`absolute ${inner} h-2 w-[1.5px] rounded-full`} style={{ backgroundColor: `rgba(${color.rgb}, 0.5)` }} />
          </div>
        ))}
      </div>
    );
  }, [phase, shuffleZIndex]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/75 backdrop-blur-lg"
      style={{ animation: 'cardLoaderFadeIn 300ms ease-out forwards' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255, 115, 0, 0.14) 0%, rgba(255, 115, 0, 0.05) 35%, transparent 65%)',
          filter: 'blur(50px)',
          opacity: phase === 'shuffle' ? 1 : 0,
          transition: 'opacity 500ms ease-out',
        }}
      />

      {/* Sparkle particles */}
      {phase === 'shuffle' && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * 360 + (i % 2 === 0 ? 15 : 0);
            const radius = 90 + (i % 4) * 25;
            const delay = i * 130;
            const size = 1.5 + (i % 3) * 0.8;
            return (
              <div
                key={i}
                className="absolute rounded-full bg-primary"
                style={{
                  width: size,
                  height: size,
                  left: Math.cos((angle * Math.PI) / 180) * radius,
                  top: Math.sin((angle * Math.PI) / 180) * radius,
                  animation: `sparklePulse 1200ms ease-in-out infinite ${delay}ms`,
                  boxShadow: '0 0 5px rgba(255, 115, 0, 0.7), 0 0 10px rgba(255, 115, 0, 0.3)',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Title — outside perspective container so it stays perfectly centered */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[60] whitespace-nowrap"
        style={{
          transform: `translate(-50%, calc(-50% - 10rem)) ${phase === 'shuffle' ? 'scale(1)' : 'scale(0.95) translateY(-12px)'}`,
          opacity: phase === 'shuffle' ? 1 : 0,
          transition: 'opacity 350ms ease-out, transform 350ms ease-out',
        }}
      >
        <span className="font-comodo text-[1.4rem] font-extrabold tracking-tight text-zinc-100 drop-shadow-[0_2px_20px_rgba(255,115,0,0.6)]">
          Vendite, Tornei ed Aste solo su <span className="text-primary">Ebartex</span>
        </span>
      </div>

      <div className="relative h-80 w-80" style={{ perspective: '900px' }}>
        {/* 5 cards */}
        {Array.from({ length: CARD_COUNT }, (_, i) => renderCard(i))}
      </div>
    </div>
  );
}

/* Injected via globals.css or style tag — per-card glow pulse keyframes */
if (typeof document !== 'undefined' && !document.getElementById('card-glow-styles')) {
  const style = document.createElement('style');
  style.id = 'card-glow-styles';
  style.textContent = `
    @keyframes cardGlowRing {
      0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
      50% { transform: translate(-50%, -50%) scale(1.6); opacity: 1; }
    }
    ${CARD_COLORS.map((c, i) => `
    @keyframes cardGlowPulse${i} {
      0%, 100% { box-shadow: 0 0 18px rgba(${c.rgb}, 0.25), 0 2px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(${c.rgb}, 0.08); }
      50% { box-shadow: 0 0 32px rgba(${c.rgb}, 0.55), 0 0 64px rgba(${c.rgb}, 0.2), 0 2px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(${c.rgb}, 0.12); }
    }
    .card-glow-${i} {
      animation: cardGlowPulse${i} 1.4s ease-in-out infinite ${i * 0.15}s;
    }
    `).join('')}
  `;
  document.head.appendChild(style);
}
