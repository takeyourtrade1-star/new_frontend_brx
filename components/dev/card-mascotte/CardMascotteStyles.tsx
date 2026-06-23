export interface CardMascotteFaceColorStyle {
  glowStrong: string;
  glowMid: string;
  line: string;
  pupil: string;
  highlight: string;
}

export interface CardMascotteStylesProps {
  selectedFaceColor: CardMascotteFaceColorStyle;
}

export function CardMascotteStyles({ selectedFaceColor }: CardMascotteStylesProps) {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        @keyframes mascotteFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(1deg); }
          75% { transform: translateY(-2px) rotate(-1deg); }
        }
        @keyframes mascotteReappear {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          50% { opacity: 1; transform: scale(1.15) translateY(-8px); }
          70% { transform: scale(0.95) translateY(2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes flashFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes previewSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes previewFadeOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-10px) scale(0.95); }
        }
        @keyframes bugModalBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bugModalPanelIn {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes codingCompanionIn {
          from { opacity: 0; transform: translateY(8px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes codingLine1 {
          0%, 100% { width: 56%; opacity: 0.55; }
          50% { width: 74%; opacity: 0.9; }
        }
        @keyframes codingLine2 {
          0%, 100% { width: 72%; opacity: 0.5; }
          50% { width: 52%; opacity: 0.9; }
        }
        @keyframes codingLine3 {
          0%, 100% { width: 42%; opacity: 0.45; }
          50% { width: 62%; opacity: 0.88; }
        }
        @keyframes codingCursor {
          0%, 45% { opacity: 1; }
          46%, 100% { opacity: 0.25; }
        }
        @keyframes codingReceivedIn {
          from { opacity: 0; transform: translateY(4px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bugGlintSweep {
          0% { opacity: 0; transform: translateX(-3px); }
          45% { opacity: 0.9; }
          100% { opacity: 0; transform: translateX(4px); }
        }
        @keyframes codingMouthPulse {
          0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.92; }
          50% { transform: translateY(-0.6px) scaleX(0.96); opacity: 1; }
        }
        @keyframes bugMouthSip {
          0%, 100% { transform: translateY(0) scale(1, 1); opacity: 0.92; }
          45% { transform: translateY(-0.4px) scale(0.9, 1.12); opacity: 1; }
        }
        .coding-companion {
          animation: codingCompanionIn 280ms ease-out;
        }
        .coding-line {
          height: 4px;
          border-radius: 9999px;
          margin-bottom: 6px;
          background: linear-gradient(90deg, rgba(255, 115, 0, 0.92), rgba(243, 199, 106, 0.9));
        }
        .coding-line-1 {
          animation: codingLine1 1800ms ease-in-out infinite;
        }
        .coding-line-2 {
          animation: codingLine2 1700ms ease-in-out infinite;
        }
        .coding-line-3 {
          margin-bottom: 0;
          animation: codingLine3 1900ms ease-in-out infinite;
        }
        .coding-cursor {
          animation: codingCursor 1200ms step-end infinite;
        }
        .coding-received {
          animation: codingReceivedIn 220ms ease-out;
        }
        .bug-glint {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
        }
        .face-fixed-neon svg {
          filter: drop-shadow(0 0 1px ${selectedFaceColor.glowStrong}) drop-shadow(0 0 2px ${selectedFaceColor.glowMid});
        }
        .face-fixed-neon .face-halo {
          opacity: 1;
          stroke: #1e3a8a !important;
          stroke-width: 0.9 !important;
        }
        .face-fixed-neon .face-line {
          stroke: ${selectedFaceColor.line} !important;
        }
        .face-fixed-neon .pupil {
          fill: ${selectedFaceColor.pupil} !important;
          stroke: none !important;
        }
        .face-fixed-neon .pupil-highlight {
          fill: ${selectedFaceColor.highlight} !important;
          stroke: none !important;
        }
        .face-glint-active .bug-glint {
          animation: bugGlintSweep 700ms ease-out 120ms 1 both;
        }
        .bug-glint-2 {
          animation-delay: 260ms;
        }
        .coding-mouth {
          transform-box: fill-box;
          transform-origin: center;
          animation: codingMouthPulse 1.1s ease-in-out infinite;
        }
        .bug-mouth {
          transform-box: fill-box;
          transform-origin: center;
          animation: bugMouthSip 1.05s ease-in-out infinite;
        }
        @keyframes chatMessageIn {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        .chat-message-in {
          animation: chatMessageIn 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 16px;
        }
        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: #a1a1aa;
          border-radius: 50%;
          animation: typingBounce 1.1s ease-in-out infinite;
        }
        .typing-indicator span:nth-child(1) { animation-delay: 0ms; }
        .typing-indicator span:nth-child(2) { animation-delay: 150ms; }
        .typing-indicator span:nth-child(3) { animation-delay: 300ms; }
        @keyframes menuOptionIn {
          from { opacity: 0; transform: translateX(-16px) scale(0.96); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .menu-option-in {
          animation: menuOptionIn 350ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }
        @keyframes hintPopIn {
          0% { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.92); }
          70% { opacity: 1; transform: translateX(-50%) translateY(-3px) scale(1.02); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes assoHintPopIn {
          0% { opacity: 0; transform: translateY(8px) scale(0.92); }
          70% { opacity: 1; transform: translateY(-3px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .hint-bubble {
          animation: hintPopIn 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .asso-hint-bubble-enter {
          animation: assoHintPopIn 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes assoCursorBlink {
          0%, 45% { opacity: 1; }
          50%, 100% { opacity: 0.15; }
        }
        .asso-typewriter-cursor {
          animation: assoCursorBlink 0.95s step-end infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .asso-typewriter-cursor,
          .asso-hint-bubble-enter,
          .typing-cursor,
          .typing-indicator span {
            animation: none !important;
          }
        }
        @keyframes backSparkleRotate {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.15); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .mascotte-back-sparkle {
          animation: backSparkleRotate 4s ease-in-out infinite;
          filter: drop-shadow(0 0 6px rgba(255,255,255,0.5));
        }
        .mascotte-flip-face {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        @keyframes flipParticleBurst {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--particle-dx), var(--particle-dy)) scale(0);
          }
        }
        .flip-particle {
          border-radius: 50%;
          animation: flipParticleBurst 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          filter: blur(0.5px);
          box-shadow: 0 0 4px currentColor;
        }
        @keyframes dressingSparkle {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0) rotate(0deg); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.15) rotate(90deg); }
          65% { opacity: 1; transform: translate(-50%, -50%) scale(0.9) rotate(200deg); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0) rotate(320deg); }
        }
        .dressing-sparkle {
          animation: dressingSparkle 950ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          filter: drop-shadow(0 0 5px currentColor) drop-shadow(0 0 10px currentColor);
          transform-origin: center;
          opacity: 0;
          will-change: transform, opacity;
        }
        @keyframes achievementIn {
          0% { opacity: 0; transform: translateY(12px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes achievementOut {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-8px) scale(0.95); }
        }
        @keyframes comboPopIn {
          0% { opacity: 0; transform: scale(0.5) rotate(-10deg); }
          60% { opacity: 1; transform: scale(1.15) rotate(3deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes flipBtnIn {
          0% { opacity: 0; transform: scale(0.6); }
          100% { opacity: 1; transform: scale(1); }
        }
        .mascotte-flip-btn {
          animation: flipBtnIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes unlockFlash {
          0% { opacity: 0; transform: scale(0.7) translateY(10px); filter: brightness(2); }
          15% { opacity: 1; transform: scale(1.08) translateY(-2px); filter: brightness(1.5); }
          30% { opacity: 1; transform: scale(1) translateY(0); filter: brightness(1); }
          80% { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.95) translateY(-12px); }
        }
        .unlock-badge {
          box-shadow: 0 0 20px rgba(251,191,36,0.5), 0 0 40px rgba(251,191,36,0.2);
        }
        @keyframes albumSlideIn {
          0% { opacity: 0; transform: translateY(12px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .holo-overlay {
          animation: holoShimmer 3s ease-in-out infinite;
        }
        @keyframes holoShimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes mascotteBackflip {
          0% { transform: rotateY(0deg) scale(1); filter: drop-shadow(0 12px 32px rgba(255,115,0,0.35)); }
          20% { transform: rotateY(0deg) translateY(-30px) scale(1.1); filter: drop-shadow(0 20px 40px rgba(255,215,0,0.6)); }
          50% { transform: rotateY(180deg) translateY(-40px) scale(1.15); filter: drop-shadow(0 24px 48px rgba(255,215,0,0.8)); }
          80% { transform: rotateY(360deg) translateY(-15px) scale(1.05); filter: drop-shadow(0 16px 36px rgba(255,215,0,0.5)); }
          100% { transform: rotateY(360deg) translateY(0) scale(1); filter: drop-shadow(0 12px 32px rgba(255,115,0,0.35)); }
        }
        .mascotte-backflip {
          animation: mascotteBackflip 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
        }
        @keyframes goldenConfettiFall {
          0% { opacity: 0; transform: translateY(0) rotate(0deg) scale(0.5); }
          10% { opacity: 1; transform: translateY(-20px) rotate(40deg) scale(1); }
          100% { opacity: 0; transform: translateY(-220px) rotate(720deg) scale(0.3); }
        }
        .golden-confetti {
          animation: goldenConfettiFall 2s ease-out forwards;
        }
        @property --shiny-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes shinyBorderSpin {
          to { --shiny-angle: 360deg; }
        }
        .shiny-border-anim {
          animation: shinyBorderSpin 1.5s linear infinite, shinyPulse 0.8s ease-in-out infinite alternate;
        }
        @keyframes shinyPulse {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        .mascotte-shiny {
          filter: drop-shadow(0 12px 32px rgba(168,85,247,0.4)) drop-shadow(0 0 20px rgba(236,72,153,0.3)) drop-shadow(0 4px 12px rgba(59,130,246,0.3)) !important;
        }
        @keyframes bandSheenSweep {
          0% { transform: translateX(-120%); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        .mascotte-band-sheen {
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.45) 46%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.45) 54%, transparent 70%);
          opacity: 0;
          transform: translateX(-120%);
        }
        [data-asso-mascot="true"]:hover .mascotte-band-sheen {
          animation: bandSheenSweep 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        /* Sleep Bubbles animation */
        @keyframes sleepBubbleFloat {
          0% {
            opacity: 0;
            transform: translateY(0) translateX(0) scale(0.7);
          }
          20% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.65;
          }
          80% {
            opacity: 0.4;
          }
          100% {
            opacity: 0;
            transform: translateY(-30px) translateX(6px) scale(1.02);
          }
        }
        @keyframes sleepBubbleWobble {
          0%, 100% {
            transform: rotate(-2deg);
          }
          50% {
            transform: rotate(2deg);
          }
        }
        .sleep-bubbles-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }
        .sleep-bubble {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%);
          border: 1.5px solid rgba(99, 102, 241, 0.25);
          box-shadow: 
            0 2px 6px rgba(99, 102, 241, 0.15),
            inset 0 1px 2px rgba(255, 255, 255, 0.5);
          animation: sleepBubbleFloat 5s ease-in-out infinite;
        }
        .sleep-bubble-large {
          width: 42px;
          height: 28px;
          border-radius: 20px 20px 20px 8px;
          animation-delay: 0ms;
        }
        .sleep-bubble-large::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 6px;
          width: 8px;
          height: 6px;
          background: linear-gradient(145deg, #e0e7ff 0%, #c7d2fe 100%);
          border-radius: 50%;
        }
        .sleep-bubble-small {
          width: 22px;
          height: 16px;
          border-radius: 12px 12px 12px 4px;
          margin-left: 18px;
          animation-delay: 2.5s;
          opacity: 0.7;
        }
        .sleep-bubble-small::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 4px;
          width: 5px;
          height: 4px;
          background: linear-gradient(145deg, #e0e7ff 0%, #c7d2fe 100%);
          border-radius: 50%;
        }
        .sleep-bubble-text {
          font-weight: 700;
          color: #4f46e5;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
        }
        .sleep-bubble-large .sleep-bubble-text {
          font-size: 11px;
          letter-spacing: -0.3px;
        }
        .sleep-bubble-small .sleep-bubble-text {
          font-size: 9px;
        }
        /* ASSO pill badge animations */
        @keyframes asso-pulse {
          0%, 100% { box-shadow: 0 -1px 4px rgba(0,0,0,0.15), inset 0 -1px 0 rgba(255,255,255,0.25); }
          50% { box-shadow: 0 -1px 6px rgba(0,0,0,0.25), inset 0 -1px 0 rgba(255,255,255,0.35), 0 0 8px rgba(255,255,255,0.2); }
        }
        @keyframes asso-pulse-intense-orange {
          0%, 100% { box-shadow: 0 -1px 6px rgba(255,100,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.4), 0 0 12px rgba(255,154,64,0.5); }
          50% { box-shadow: 0 -1px 10px rgba(255,100,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.5), 0 0 18px rgba(255,154,64,0.7), 0 0 24px rgba(255,115,0,0.3); }
        }
        @keyframes asso-pulse-intense-red {
          0%, 100% { box-shadow: 0 -1px 6px rgba(220,38,38,0.4), inset 0 -1px 0 rgba(255,255,255,0.4), 0 0 12px rgba(239,68,68,0.5); }
          50% { box-shadow: 0 -1px 10px rgba(220,38,38,0.6), inset 0 -1px 0 rgba(255,255,255,0.5), 0 0 18px rgba(239,68,68,0.7), 0 0 24px rgba(220,38,38,0.3); }
        }
        @keyframes asso-pulse-intense-purple {
          0%, 100% { box-shadow: 0 -1px 6px rgba(124,58,237,0.4), inset 0 -1px 0 rgba(255,255,255,0.4), 0 0 12px rgba(167,139,250,0.5); }
          50% { box-shadow: 0 -1px 10px rgba(124,58,237,0.6), inset 0 -1px 0 rgba(255,255,255,0.5), 0 0 18px rgba(167,139,250,0.7), 0 0 24px rgba(124,58,237,0.3); }
        }
        @keyframes asso-pulse-intense-gray {
          0%, 100% { box-shadow: 0 -1px 6px rgba(75,85,99,0.3), inset 0 -1px 0 rgba(255,255,255,0.3), 0 0 12px rgba(156,163,175,0.4); }
          50% { box-shadow: 0 -1px 10px rgba(75,85,99,0.5), inset 0 -1px 0 rgba(255,255,255,0.4), 0 0 18px rgba(156,163,175,0.6), 0 0 24px rgba(75,85,99,0.25); }
        }
        @keyframes asso-text-glow {
          0%, 100% { text-shadow: 0 0 2px rgba(255, 255, 255, 0.4), 0 0 4px rgba(255, 255, 255, 0.2); }
          50% { text-shadow: 0 0 6px rgba(255, 255, 255, 0.9), 0 0 12px rgba(255, 255, 255, 0.7); }
        }
        .animate-asso-text {
          animation: asso-text-glow 2.5s ease-in-out infinite;
        }
        @keyframes asso-pulse-intense-pink {
          0%, 100% { box-shadow: 0 -1px 6px rgba(236,72,153,0.4), inset 0 -1px 0 rgba(255,255,255,0.4), 0 0 12px rgba(244,114,182,0.5); }
          50% { box-shadow: 0 -1px 10px rgba(236,72,153,0.6), inset 0 -1px 0 rgba(255,255,255,0.5), 0 0 18px rgba(244,114,182,0.7), 0 0 24px rgba(236,72,153,0.3); }
        }
        @keyframes asso-shimmer-fast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .asso-pill-hovered > div {
          transform: scale(1.08);
          transition: transform 200ms ease-out;
        }
        .asso-pill-hovered > div > div:first-child {
          animation: asso-shimmer-fast 1s ease-in-out infinite !important;
        }
        /* State-specific hover pulse animations */
        .asso-pill-hovered .asso-pill-normal { animation: asso-pulse-intense-orange 0.8s ease-in-out infinite !important; }
        .asso-pill-hovered .asso-pill-bugReport,
        .asso-pill-hovered .asso-pill-bugFocus { animation: asso-pulse-intense-red 0.8s ease-in-out infinite !important; }
        .asso-pill-hovered .asso-pill-coding { animation: asso-pulse-intense-purple 0.8s ease-in-out infinite !important; }
        .asso-pill-hovered .asso-pill-sleeping { animation: asso-pulse-intense-gray 0.8s ease-in-out infinite !important; }
        .asso-pill-hovered .asso-pill-wink { animation: asso-pulse-intense-pink 0.8s ease-in-out infinite !important; }
        /* Promotional hint premium animations */
        @keyframes promoPulse {
          0%, 100% { opacity: 0.5; transform: scale(0.98); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        @keyframes promoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes promoShine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes promoSparkle {
          0%, 100% { opacity: 0.6; transform: scale(0.9) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.1) rotate(15deg); }
        }
        @keyframes promoGlow {
          0%, 100% { box-shadow: 0 8px 32px rgba(255,115,0,0.4), 0 4px 16px rgba(0,0,0,0.2); }
          50% { box-shadow: 0 12px 40px rgba(255,115,0,0.6), 0 6px 20px rgba(0,0,0,0.25), 0 0 30px rgba(255,154,64,0.3); }
        }
        /* Sleep mode dreamy animations */
        @keyframes sleepGlow {
          0%, 100% { opacity: 0.4; transform: scale(0.98); }
          50% { opacity: 0.7; transform: scale(1.03); }
        }
        @keyframes sleepFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(0.5deg); }
          75% { transform: translateY(-2px) rotate(-0.5deg); }
        }
        @keyframes sleepShine {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes sleepTwinkle {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        /* Equipped wardrobe realism layers */
        .equipped-item-layer {
          position: relative;
          transition: filter 220ms ease, transform 220ms ease, opacity 220ms ease;
        }
        .equipped-item-layer::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: 10px;
          background:
            radial-gradient(circle at 22% 16%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0) 52%),
            linear-gradient(165deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 35%, rgba(0,0,0,0.07) 100%);
          mix-blend-mode: screen;
          opacity: 0.62;
        }
        .equipped-item-layer::after {
          content: '';
          position: absolute;
          inset: -1px;
          pointer-events: none;
          border-radius: 11px;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.24),
            inset 0 -1px 0 rgba(0,0,0,0.2);
          opacity: 0.6;
        }
        @keyframes equippedItemFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-1.8px); }
        }
        @keyframes equippedItemBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
        .equipped-item-float {
          animation: equippedItemFloat 3.8s ease-in-out infinite;
        }
        .equipped-item-breathe {
          animation: equippedItemBreathe 4.6s ease-in-out infinite;
        }
        .equipped-item-metallic::before {
          opacity: 0.78;
          background:
            linear-gradient(130deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.04) 42%, rgba(0,0,0,0.12) 100%),
            radial-gradient(circle at 28% 18%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0) 70%);
        }
        .equipped-item-glass::before {
          opacity: 0.74;
          background:
            linear-gradient(150deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.01) 55%, rgba(0,0,0,0.14) 100%);
        }
        .equipped-item-tech::after {
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 0 -1px 0 rgba(0,0,0,0.24),
            0 0 0 1px rgba(34,211,238,0.15);
        }
        /* Peek animation for hidden mascot on mobile */
        @keyframes peekPulse {
          0%, 100% { opacity: 0.6; width: 8px; }
          50% { opacity: 1; width: 12px; }
        }
        /* â”€â”€ ASSO Liquid Gradient Orb â”€â”€ */
        @keyframes assoOrbMorph1 {
          0%   { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: translate(-8px, -6px) scale(1); opacity: 0.6; }
          25%  { border-radius: 65% 35% 30% 70% / 60% 70% 30% 40%; transform: translate(12px, -2px) scale(1.15); opacity: 0.75; }
          50%  { border-radius: 40% 60% 70% 30% / 40% 40% 60% 60%; transform: translate(4px, 12px) scale(0.9); opacity: 0.55; }
          75%  { border-radius: 70% 30% 40% 60% / 30% 60% 40% 70%; transform: translate(-10px, 8px) scale(1.1); opacity: 0.7; }
          100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: translate(-8px, -6px) scale(1); opacity: 0.6; }
        }
        @keyframes assoOrbMorph2 {
          0%   { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: translate(10px, 8px) scale(1); opacity: 0.45; }
          25%  { border-radius: 30% 70% 70% 30% / 30% 60% 40% 70%; transform: translate(-12px, 4px) scale(1.1); opacity: 0.6; }
          50%  { border-radius: 70% 30% 40% 60% / 60% 40% 60% 40%; transform: translate(-4px, -12px) scale(0.85); opacity: 0.4; }
          75%  { border-radius: 40% 60% 60% 40% / 30% 70% 30% 70%; transform: translate(12px, -6px) scale(1.05); opacity: 0.55; }
          100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: translate(10px, 8px) scale(1); opacity: 0.45; }
        }
      `,
    }} />
  );
}
