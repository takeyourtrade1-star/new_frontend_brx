// CSS della mascotte (PLAN/13.3/13.6): keyframes ridotti, solo transform/opacity,
// pausa animazioni in sleep (data-asso-sleeping) e prefers-reduced-motion.

import type { FaceColorOption } from './faceColors';

export function AssoStyles({ faceColor }: { faceColor: FaceColorOption }) {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        /* ── Idle ─────────────────────────────────────────────── */
        @keyframes assoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2.5px); }
        }
        @keyframes assoReappear {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          50% { opacity: 1; transform: scale(1.12) translateY(-6px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        /* Blink automatico (solo espressione normal) */
        @keyframes assoBlink {
          0%, 93.5%, 100% { transform: scaleY(1); }
          95.5%, 97.5% { transform: scaleY(0.08); }
        }
        .asso-eye-blink {
          transform-box: fill-box;
          transform-origin: center;
          animation: assoBlink 5.4s ease-in-out infinite;
        }
        /* Pupille che seguono il mouse (CSS vars scritte via rAF) */
        .asso-pupil-follow {
          transform: translate(var(--asso-pupil-x, 0px), var(--asso-pupil-y, 0px));
          transition: transform 0.14s ease-out;
        }
        /* Morph tra espressioni */
        @keyframes assoFaceIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .asso-face-in { animation: assoFaceIn 220ms ease-out; }

        /* Colore neon della faccia */
        .face-fixed-neon svg {
          filter: drop-shadow(0 0 1px ${faceColor.glowStrong}) drop-shadow(0 0 2px ${faceColor.glowMid});
        }
        .face-fixed-neon .face-halo { opacity: 1; stroke: #1e3a8a !important; stroke-width: 0.9 !important; }
        .face-fixed-neon .face-line { stroke: ${faceColor.line} !important; }
        .face-fixed-neon .pupil { fill: ${faceColor.pupil} !important; stroke: none !important; }
        .face-fixed-neon .pupil-highlight { fill: ${faceColor.highlight} !important; stroke: none !important; }

        /* Glint del monitor nelle espressioni bug */
        @keyframes bugGlintSweep {
          0% { opacity: 0; transform: translateX(-3px); }
          45% { opacity: 0.9; }
          100% { opacity: 0; transform: translateX(4px); }
        }
        .bug-glint { opacity: 0; transform-box: fill-box; transform-origin: center; }
        .face-glint-active .bug-glint { animation: bugGlintSweep 700ms ease-out 120ms 1 both; }
        .bug-glint-2 { animation-delay: 260ms; }
        @keyframes bugMouthSip {
          0%, 100% { transform: translateY(0) scale(1, 1); opacity: 0.92; }
          45% { transform: translateY(-0.4px) scale(0.9, 1.12); opacity: 1; }
        }
        .bug-mouth { transform-box: fill-box; transform-origin: center; animation: bugMouthSip 1.05s ease-in-out infinite; }

        /* ── Glow-up card (13.6) ──────────────────────────────── */
        @property --asso-border-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
        @keyframes assoBorderSpin { to { --asso-border-angle: 360deg; } }
        .asso-border-shimmer { animation: assoBorderSpin 9s linear infinite; }
        @keyframes assoGlowBreathe {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        .asso-glow-breathe { animation: assoGlowBreathe 4s ease-in-out infinite; }
        @keyframes assoGlint {
          0%, 84%, 100% { opacity: 0; transform: scale(0.3) rotate(0deg); }
          88% { opacity: 1; transform: scale(1.05) rotate(35deg); }
          92% { opacity: 0.9; transform: scale(0.9) rotate(60deg); }
          96% { opacity: 0; transform: scale(0.3) rotate(90deg); }
        }
        .asso-glint-star {
          opacity: 0;
          transform-origin: center;
          animation: assoGlint 7s ease-in-out infinite;
          filter: drop-shadow(0 0 3px rgba(255,246,232,0.9));
        }
        @keyframes assoPillSheen {
          0%, 78% { transform: translateX(-26px); opacity: 0; }
          82% { opacity: 1; }
          96%, 100% { transform: translateX(72px); opacity: 0; }
        }
        .asso-pill-sheen { left: 0; animation: assoPillSheen 6s ease-in-out infinite; }

        /* ── Pill badge ASSO ──────────────────────────────────── */
        @keyframes asso-pulse {
          0%, 100% { box-shadow: 0 -1px 4px rgba(0,0,0,0.15), inset 0 -1px 0 rgba(255,255,255,0.25); }
          50% { box-shadow: 0 -1px 6px rgba(0,0,0,0.25), inset 0 -1px 0 rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.2); }
        }
        .asso-pill-hovered > div { transform: scale(1.08); transition: transform 200ms ease-out; }

        /* ── Item equipaggiati ────────────────────────────────── */
        /* Alone chiaro uniforme, stesso "tratto" della faccia */
        .asso-item-art svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 1.5px rgba(250,249,246,0.9)) drop-shadow(0 2px 3px rgba(0,0,0,0.22));
        }
        @keyframes assoItemFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-1.8px); }
        }
        .asso-item-float { animation: assoItemFloat 3.8s ease-in-out infinite; }

        /* ── Flip / retro carta ───────────────────────────────── */
        .mascotte-flip-face { -webkit-backface-visibility: hidden; backface-visibility: hidden; }
        @keyframes flipBtnIn { 0% { opacity: 0; transform: scale(0.6); } 100% { opacity: 1; transform: scale(1); } }
        .mascotte-flip-btn { animation: flipBtnIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes backSparkleRotate {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.12); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .mascotte-back-sparkle { animation: backSparkleRotate 4s ease-in-out infinite; }
        @keyframes holoShimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        .holo-overlay { animation: holoShimmer 3s ease-in-out infinite; }
        @keyframes flipParticleBurst {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--particle-dx), var(--particle-dy)) scale(0); }
        }
        .flip-particle {
          border-radius: 50%;
          animation: flipParticleBurst 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          box-shadow: 0 0 4px currentColor;
        }
        @keyframes unlockFlash {
          0% { opacity: 0; transform: scale(0.7) translateY(10px); }
          15% { opacity: 1; transform: scale(1.08) translateY(-2px); }
          30%, 80% { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.95) translateY(-12px); }
        }
        /* Shiny (5% al flip) */
        @property --shiny-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
        @keyframes shinyBorderSpin { to { --shiny-angle: 360deg; } }
        .shiny-border-anim { animation: shinyBorderSpin 1.5s linear infinite; }

        /* ── Guardaroba ───────────────────────────────────────── */
        @keyframes albumSlideIn {
          0% { opacity: 0; transform: translateY(12px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dressingSparkle {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0) rotate(0deg); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.15) rotate(90deg); }
          65% { opacity: 1; transform: translate(-50%, -50%) scale(0.9) rotate(200deg); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0) rotate(320deg); }
        }
        .dressing-sparkle {
          animation: dressingSparkle 950ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: center;
          opacity: 0;
        }

        /* ── Chat / bubble ────────────────────────────────────── */
        @keyframes chatMessageIn {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-message-in { animation: chatMessageIn 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity: 0; }
        @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
        .typing-indicator { display: flex; align-items: center; gap: 4px; height: 16px; }
        .typing-indicator span {
          width: 6px; height: 6px; background: #a1a1aa; border-radius: 50%;
          animation: typingBounce 1.1s ease-in-out infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 150ms; }
        .typing-indicator span:nth-child(3) { animation-delay: 300ms; }
        @keyframes menuOptionIn {
          from { opacity: 0; transform: translateX(-16px) scale(0.96); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .menu-option-in { animation: menuOptionIn 350ms cubic-bezier(0.22, 1, 0.36, 1) forwards; opacity: 0; }
        @keyframes assoHintPopIn {
          0% { opacity: 0; transform: translateY(8px) scale(0.92); }
          70% { opacity: 1; transform: translateY(-3px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .asso-hint-bubble-enter { animation: assoHintPopIn 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        /* Pensiero che galleggia piano, con micro-rotazione (dopo il pop-in) */
        @keyframes assoThoughtBob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-2.5px) rotate(0.5deg); }
        }
        .asso-thought-bob { animation: assoHintPopIn 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards, assoThoughtBob 4.5s ease-in-out 500ms infinite; }
        /* Solo opacity sul wrapper: il transform resta alle utility (translate-x) */
        @keyframes assoThoughtDotIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .asso-thought-dot { opacity: 0; animation: assoThoughtDotIn 260ms ease-out 180ms forwards; }
        .asso-thought-dot-2 { animation-delay: 300ms; }
        /* Respiro dei puntini (sul figlio: niente conflitti col translate) */
        @keyframes assoThoughtDotPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.82); }
        }
        .asso-thought-dot > span { animation: assoThoughtDotPulse 3.4s ease-in-out 1.2s infinite; }
        .asso-thought-dot-2 > span { animation-delay: 2.2s; }
        @keyframes assoCursorBlink { 0%, 45% { opacity: 1; } 50%, 100% { opacity: 0.15; } }
        .asso-typewriter-cursor { animation: assoCursorBlink 0.95s step-end infinite; }

        /* ── Modali / companion ───────────────────────────────── */
        @keyframes flashFade { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes previewSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes previewFadeOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-10px) scale(0.95); }
        }
        @keyframes bugModalBackdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bugModalPanelIn {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes codingCompanionIn {
          from { opacity: 0; transform: translateY(8px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .coding-companion { animation: codingCompanionIn 280ms ease-out; }
        @keyframes codingLine1 { 0%, 100% { width: 56%; opacity: 0.55; } 50% { width: 74%; opacity: 0.9; } }
        @keyframes codingLine2 { 0%, 100% { width: 72%; opacity: 0.5; } 50% { width: 52%; opacity: 0.9; } }
        @keyframes codingLine3 { 0%, 100% { width: 42%; opacity: 0.45; } 50% { width: 62%; opacity: 0.88; } }
        .coding-line {
          height: 4px; border-radius: 9999px; margin-bottom: 6px;
          background: linear-gradient(90deg, rgba(255, 115, 0, 0.92), rgba(243, 199, 106, 0.9));
        }
        .coding-line-1 { animation: codingLine1 1800ms ease-in-out infinite; }
        .coding-line-2 { animation: codingLine2 1700ms ease-in-out infinite; }
        .coding-line-3 { margin-bottom: 0; animation: codingLine3 1900ms ease-in-out infinite; }
        @keyframes codingCursor { 0%, 45% { opacity: 1; } 46%, 100% { opacity: 0.25; } }
        .coding-cursor { animation: codingCursor 1200ms step-end infinite; }
        @keyframes codingReceivedIn {
          from { opacity: 0; transform: translateY(4px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .coding-received { animation: codingReceivedIn 220ms ease-out; }

        /* ── Sonno ────────────────────────────────────────────── */
        @keyframes sleepBubbleFloat {
          0% { opacity: 0; transform: translateY(0) translateX(0) scale(0.7); }
          20% { opacity: 0.55; }
          50% { opacity: 0.65; }
          80% { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(-30px) translateX(6px) scale(1.02); }
        }
        .sleep-bubbles-container { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
        .sleep-bubble {
          position: relative; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(145deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%);
          border: 1.5px solid rgba(99, 102, 241, 0.25);
          animation: sleepBubbleFloat 5s ease-in-out infinite;
        }
        .sleep-bubble-large { width: 42px; height: 28px; border-radius: 20px 20px 20px 8px; }
        .sleep-bubble-small { width: 22px; height: 16px; border-radius: 12px 12px 12px 4px; margin-left: 18px; animation-delay: 2.5s; opacity: 0.7; }
        .sleep-bubble-text { font-weight: 700; color: #4f46e5; }
        .sleep-bubble-large .sleep-bubble-text { font-size: 11px; letter-spacing: -0.3px; }
        .sleep-bubble-small .sleep-bubble-text { font-size: 9px; }

        /* In sonno: ferma float, pulse, blink e shimmer — CPU ~zero (PLAN/13.3) */
        [data-asso-sleeping="true"],
        [data-asso-sleeping="true"] .asso-eye-blink,
        [data-asso-sleeping="true"] .asso-item-float,
        [data-asso-sleeping="true"] .asso-border-shimmer,
        [data-asso-sleeping="true"] .asso-glow-breathe,
        [data-asso-sleeping="true"] .asso-glint-star,
        [data-asso-sleeping="true"] .asso-pill-sheen,
        [data-asso-sleeping="true"] .asso-pill-anim {
          animation-play-state: paused !important;
        }

        /* ── prefers-reduced-motion: tutto fermo ──────────────── */
        @media (prefers-reduced-motion: reduce) {
          [data-asso-mascot="true"],
          [data-asso-mascot="true"] *,
          .asso-hint-bubble-enter,
          .asso-thought-bob,
          .asso-thought-dot,
          .asso-thought-dot > span,
          .asso-typewriter-cursor,
          .flip-particle,
          .dressing-sparkle,
          .sleep-bubble,
          .coding-line, .coding-cursor,
          .typing-indicator span {
            animation: none !important;
          }
        }
      `,
    }} />
  );
}
