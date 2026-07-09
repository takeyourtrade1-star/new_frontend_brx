// Faccia di Asso come componente React (PLAN/13.6): niente stringhe innerHTML,
// blink automatico via CSS (.asso-eye-blink), pupille che seguono il mouse via
// CSS custom properties --asso-pupil-x/y scritte da AssoRoot (rAF-throttled).

import type { AssoExpression } from './machine';

/** Coppia alone+linea, stesso tratto per tutte le espressioni. */
function Stroke({ d, halo = 4.2, line = 3.2 }: { d: string; halo?: number; line?: number }) {
  return (
    <>
      <path className="face-halo" d={d} stroke="#faf9f6" strokeWidth={halo} fill="none" />
      <path className="face-line" d={d} stroke="#4a5548" strokeWidth={line} fill="none" />
    </>
  );
}

function OpenEye({ cx, blink }: { cx: number; blink: boolean }) {
  return (
    <g className={blink ? 'asso-eye-blink' : undefined}>
      <circle className="face-halo" cx={cx} cy="39" r="11.5" stroke="#faf9f6" strokeWidth="3.5" />
      <circle className="face-line" cx={cx} cy="39" r="11.5" stroke="#4a5548" strokeWidth="2.5" />
      <g className="asso-pupil-follow">
        <circle className="pupil" cx={cx} cy="40" r="5.6" fill="#4a5548" stroke="none" />
        {/* Doppio highlight: pupilla più viva */}
        <circle className="pupil-highlight" cx={cx - 2.7} cy="36.4" r="2.2" fill="#faf9f6" stroke="none" />
        <circle className="pupil-highlight" cx={cx + 2.1} cy="42.6" r="0.9" fill="#faf9f6" stroke="none" opacity="0.8" />
      </g>
    </g>
  );
}

/** Guance rosate: carattere in ogni espressione sveglia. */
function Blush() {
  return (
    <>
      <ellipse cx="20" cy="53" rx="5.5" ry="3.2" fill="#ff9d9d" stroke="none" opacity="0.32" />
      <ellipse cx="80" cy="53" rx="5.5" ry="3.2" fill="#ff9d9d" stroke="none" opacity="0.32" />
    </>
  );
}

function NormalFace() {
  return (
    <>
      {/* Sopracciglia */}
      <Stroke d="M 28 23.5 Q 35 20.5 42 23.5" halo={3.4} line={2.4} />
      <Stroke d="M 58 23.5 Q 65 20.5 72 23.5" halo={3.4} line={2.4} />
      <OpenEye cx={35} blink />
      <OpenEye cx={65} blink />
      <Blush />
      <Stroke d="M 34 63 Q 50 77 66 63" halo={4.2} line={3.2} />
    </>
  );
}

function WinkFace() {
  return (
    <>
      {/* Sopracciglio alzato sull'occhio aperto */}
      <Stroke d="M 59 21.5 Q 67 18.5 75 22" halo={3.4} line={2.4} />
      <Stroke d="M 24 40 Q 34 32 44 40" halo={4.4} line={3.4} />
      <OpenEye cx={67} blink={false} />
      <Blush />
      <Stroke d="M 39 63 Q 54 72 68 62" halo={4.2} line={3.2} />
    </>
  );
}

/** Occhiali-monitor condivisi dalle espressioni bug. */
function BugMonitor() {
  return (
    <g stroke="#faf9f6" fill="none">
      <rect x="20" y="29" width="60" height="23" rx="4.5" strokeWidth="2.1" />
      <line x1="50" y1="33" x2="50" y2="48" strokeWidth="1.7" />
      <line x1="20" y1="41" x2="16" y2="39" strokeWidth="1.8" />
      <line x1="80" y1="41" x2="84" y2="39" strokeWidth="1.8" />
      <path className="bug-glint bug-glint-1" d="M 28 34 L 34 31" strokeWidth="1.4" />
      <path className="bug-glint bug-glint-2" d="M 62 35 L 68 32" strokeWidth="1.4" />
    </g>
  );
}

function BugReportFace() {
  return (
    <>
      {[34, 66].map((cx) => (
        <g key={cx}>
          <circle className="face-halo" cx={cx} cy="40" r="10" stroke="#faf9f6" strokeWidth="3.2" />
          <circle className="face-line" cx={cx} cy="40" r="10" stroke="#4a5548" strokeWidth="2.2" />
          <g className="asso-pupil-follow">
            <circle className="pupil" cx={cx} cy="41" r="4" fill="#4a5548" stroke="none" />
            <circle className="pupil-highlight" cx={cx - 2.4} cy="37.2" r="1.5" fill="#faf9f6" stroke="none" />
          </g>
        </g>
      ))}
      <BugMonitor />
      <g className="bug-mouth">
        <Stroke d="M 44 65 Q 50 69 56 65" halo={3.8} line={2.8} />
      </g>
    </>
  );
}

function BugFocusFace() {
  return (
    <>
      {[34, 66].map((cx) => (
        <g key={cx}>
          <ellipse className="face-halo" cx={cx} cy="40" rx="10" ry="6.2" stroke="#faf9f6" strokeWidth="3.2" />
          <ellipse className="face-line" cx={cx} cy="40" rx="10" ry="6.2" stroke="#4a5548" strokeWidth="2.2" />
          <circle className="pupil" cx={cx} cy="40.2" r="3.4" fill="#4a5548" stroke="none" />
          <circle className="pupil-highlight" cx={cx - 2.1} cy="37.7" r="1.2" fill="#faf9f6" stroke="none" />
        </g>
      ))}
      <BugMonitor />
      <g className="bug-mouth">
        <Stroke d="M 45 65 Q 50 67.5 55 65" halo={3.7} line={2.7} />
      </g>
    </>
  );
}

function SleepingFace() {
  return (
    <>
      <Stroke d="M 24 40 Q 34 48 44 40" halo={3.8} line={2.8} />
      <Stroke d="M 56 40 Q 66 48 76 40" halo={3.8} line={2.8} />
      <ellipse cx="50" cy="68" rx="3" ry="2" fill="#faf9f6" stroke="none" />
      <ellipse cx="22" cy="52" rx="5" ry="3" fill="#ff9999" stroke="none" opacity="0.4" />
      <ellipse cx="78" cy="52" rx="5" ry="3" fill="#ff9999" stroke="none" opacity="0.4" />
    </>
  );
}

const FACE_BY_EXPRESSION: Record<AssoExpression, () => JSX.Element> = {
  normal: NormalFace,
  wink: WinkFace,
  bugReport: BugReportFace,
  bugFocus: BugFocusFace,
  sleeping: SleepingFace,
};

export function AssoFace({ expression }: { expression: AssoExpression }) {
  const Face = FACE_BY_EXPRESSION[expression];
  return (
    // key = espressione: rimonta il gruppo e fa ripartire la transizione faceIn
    <svg key={expression} className="asso-face-in" viewBox="0 0 100 100" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <Face />
    </svg>
  );
}
