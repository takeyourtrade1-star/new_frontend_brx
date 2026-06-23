export const faceSVG = `<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Eyes: light stroke behind (thicker) -->
  <circle class="face-halo" cx="35" cy="39" r="11.5" stroke="#faf9f6" stroke-width="3.5"/>
  <circle class="face-halo" cx="65" cy="39" r="11.5" stroke="#faf9f6" stroke-width="3.5"/>
  <!-- Eyes: dark stroke on top -->
  <circle class="face-line" cx="35" cy="39" r="11.5" stroke="#4a5548" stroke-width="2.5"/>
  <circle class="face-line" cx="65" cy="39" r="11.5" stroke="#4a5548" stroke-width="2.5"/>
  <!-- Pupils and highlights -->
  <circle class="pupil" cx="35" cy="40" r="5.6" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="32.3" cy="36.4" r="2.2" fill="#faf9f6" stroke="none"/>
  <circle class="pupil" cx="65" cy="40" r="5.6" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="62.3" cy="36.4" r="2.2" fill="#faf9f6" stroke="none"/>
  <!-- Mouth: light stroke behind -->
  <path class="face-halo" d="M 34 63 Q 50 77 66 63" stroke="#faf9f6" stroke-width="4.2" fill="none"/>
  <!-- Mouth: dark stroke on top -->
  <path class="face-line" d="M 34 63 Q 50 77 66 63" stroke="#4a5548" stroke-width="3.2" fill="none"/>
</svg>`;

export const faceBugReportSVG = `<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Eyes: light stroke behind -->
  <circle class="face-halo" cx="34" cy="40" r="10" stroke="#faf9f6" stroke-width="3.2"/>
  <circle class="face-halo" cx="66" cy="40" r="10" stroke="#faf9f6" stroke-width="3.2"/>
  <!-- Eyes: dark stroke on top -->
  <circle class="face-line" cx="34" cy="40" r="10" stroke="#4a5548" stroke-width="2.2"/>
  <circle class="face-line" cx="66" cy="40" r="10" stroke="#4a5548" stroke-width="2.2"/>
  <!-- Pupils and highlights -->
  <circle class="pupil" cx="34" cy="41" r="4" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="31.6" cy="37.2" r="1.5" fill="#faf9f6" stroke="none"/>
  <circle class="pupil" cx="66" cy="41" r="4" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="63.6" cy="37.2" r="1.5" fill="#faf9f6" stroke="none"/>
  <!-- Monitor frame -->
  <rect x="20" y="29" width="60" height="23" rx="4.5" stroke-width="2.1" fill="none" stroke="#faf9f6"/>
  <line x1="50" y1="33" x2="50" y2="48" stroke-width="1.7" stroke="#faf9f6"/>
  <line x1="20" y1="41" x2="16" y2="39" stroke-width="1.8" stroke="#faf9f6"/>
  <line x1="80" y1="41" x2="84" y2="39" stroke-width="1.8" stroke="#faf9f6"/>
  <path class="bug-glint bug-glint-1" d="M 28 34 L 34 31" stroke="#faf9f6" stroke-width="1.4"/>
  <path class="bug-glint bug-glint-2" d="M 62 35 L 68 32" stroke="#faf9f6" stroke-width="1.4"/>
  <!-- Mouth: light behind, dark on top -->
  <path class="face-halo bug-mouth" d="M 44 65 Q 50 69 56 65" stroke="#faf9f6" stroke-width="3.8" fill="none"/>
  <path class="face-line bug-mouth" d="M 44 65 Q 50 69 56 65" stroke="#4a5548" stroke-width="2.8" fill="none"/>
</svg>`;

export const faceBugFocusSVG = `<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Narrowed (squint) eye outlines: light behind -->
  <ellipse class="face-halo" cx="34" cy="40" rx="10" ry="6.2" stroke="#faf9f6" stroke-width="3.2"/>
  <ellipse class="face-halo" cx="66" cy="40" rx="10" ry="6.2" stroke="#faf9f6" stroke-width="3.2"/>
  <!-- Eyes: dark on top -->
  <ellipse class="face-line" cx="34" cy="40" rx="10" ry="6.2" stroke="#4a5548" stroke-width="2.2"/>
  <circle class="pupil" cx="34" cy="40.2" r="3.4" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="31.9" cy="37.7" r="1.2" fill="#faf9f6" stroke="none"/>
  <ellipse class="face-line" cx="66" cy="40" rx="10" ry="6.2" stroke="#4a5548" stroke-width="2.2"/>
  <circle class="pupil" cx="66" cy="40.2" r="3.4" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="63.9" cy="37.7" r="1.2" fill="#faf9f6" stroke="none"/>
  <rect x="20" y="29" width="60" height="23" rx="4.5" stroke-width="2.1" fill="none" stroke="#faf9f6"/>
  <line x1="50" y1="33" x2="50" y2="48" stroke-width="1.7" stroke="#faf9f6"/>
  <line x1="20" y1="41" x2="16" y2="39" stroke-width="1.8" stroke="#faf9f6"/>
  <line x1="80" y1="41" x2="84" y2="39" stroke-width="1.8" stroke="#faf9f6"/>
  <path class="bug-glint bug-glint-1" d="M 28 34 L 34 31" stroke="#faf9f6" stroke-width="1.4"/>
  <path class="bug-glint bug-glint-2" d="M 62 35 L 68 32" stroke="#faf9f6" stroke-width="1.4"/>
  <!-- Mouth: light behind, dark on top -->
  <path class="face-halo bug-mouth" d="M 45 65 Q 50 67.5 55 65" stroke="#faf9f6" stroke-width="3.7" fill="none"/>
  <path class="face-line bug-mouth" d="M 45 65 Q 50 67.5 55 65" stroke="#4a5548" stroke-width="2.7" fill="none"/>
</svg>`;

export const faceWinkSVG = `<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Wink eye: light behind, dark on top -->
  <path class="face-halo" d="M 24 40 Q 34 32 44 40" stroke="#faf9f6" stroke-width="4.4"/>
  <path class="face-line" d="M 24 40 Q 34 32 44 40" stroke="#4a5548" stroke-width="3.4"/>
  <!-- Open eye: light behind -->
  <circle class="face-halo" cx="67" cy="39" r="11.2" stroke="#faf9f6" stroke-width="3.5"/>
  <!-- Open eye: dark on top -->
  <circle class="face-line" cx="67" cy="39" r="11.2" stroke="#4a5548" stroke-width="2.5"/>
  <circle class="pupil" cx="67" cy="40" r="5.6" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="64.4" cy="36.4" r="2.1" fill="#faf9f6" stroke="none"/>
  <!-- Mouth: light behind, dark on top -->
  <path class="face-halo" d="M 39 63 Q 54 72 68 62" stroke="#faf9f6" stroke-width="4.2" fill="none"/>
  <path class="face-line" d="M 39 63 Q 54 72 68 62" stroke="#4a5548" stroke-width="3.2" fill="none"/>
</svg>`;

export const faceCodingSVG = `<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Eyes: light behind -->
  <circle class="face-halo" cx="35" cy="38" r="14" stroke="#faf9f6" stroke-width="3.5"/>
  <circle class="face-halo" cx="65" cy="38" r="14" stroke="#faf9f6" stroke-width="3.5"/>
  <!-- Eyes: dark on top -->
  <circle class="face-line" cx="35" cy="38" r="14" stroke="#4a5548" stroke-width="2.5"/>
  <circle class="face-line" cx="65" cy="38" r="14" stroke="#4a5548" stroke-width="2.5"/>
  <!-- Pupils -->
  <circle class="pupil" cx="35" cy="38.6" r="3.6" fill="#4a5548" stroke="none"/>
  <circle class="pupil" cx="65" cy="38.6" r="3.6" fill="#4a5548" stroke="none"/>
  <!-- Mouth: light behind, dark on top -->
  <path class="face-halo coding-mouth" d="M 36 66 Q 50 63.8 64 66" stroke="#faf9f6" stroke-width="4" fill="none"/>
  <path class="face-line coding-mouth" d="M 36 66 Q 50 63.8 64 66" stroke="#4a5548" stroke-width="3" fill="none"/>
  <!-- Glasses/monitor frame -->
  <rect x="20" y="24" width="60" height="28" rx="3" stroke-width="2.5" fill="none" stroke="#faf9f6"/>
  <line x1="50" y1="24" x2="50" y2="52" stroke-width="2" stroke="#faf9f6"/>
</svg>`;

export const faceSleepSVG = `<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Closed eyes: light behind, dark on top -->
  <path class="face-halo" d="M 24 40 Q 34 48 44 40" stroke="#faf9f6" stroke-width="3.8" fill="none"/>
  <path class="face-halo" d="M 56 40 Q 66 48 76 40" stroke="#faf9f6" stroke-width="3.8" fill="none"/>
  <path class="face-line" d="M 24 40 Q 34 48 44 40" stroke="#4a5548" stroke-width="2.8" fill="none"/>
  <path class="face-line" d="M 56 40 Q 66 48 76 40" stroke="#4a5548" stroke-width="2.8" fill="none"/>
  <!-- Small sleepy mouth -->
  <ellipse cx="50" cy="68" rx="3" ry="2" fill="#faf9f6" stroke="none"/>
  <!-- Gentle blush marks -->
  <ellipse cx="22" cy="52" rx="5" ry="3" fill="#ff9999" stroke="none" opacity="0.4"/>
  <ellipse cx="78" cy="52" rx="5" ry="3" fill="#ff9999" stroke="none" opacity="0.4"/>
</svg>`;

export const faceShockedSVG = `<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <!-- Eyes: huge shocked circles -->
  <circle class="face-halo" cx="35" cy="38" r="13" stroke="#faf9f6" stroke-width="3.5"/>
  <circle class="face-halo" cx="65" cy="38" r="13" stroke="#faf9f6" stroke-width="3.5"/>
  <circle class="face-line" cx="35" cy="38" r="13" stroke="#4a5548" stroke-width="2.5"/>
  <circle class="face-line" cx="65" cy="38" r="13" stroke="#4a5548" stroke-width="2.5"/>
  <!-- Pupils: tiny for shock -->
  <circle class="pupil" cx="35" cy="38" r="3.5" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="32.5" cy="35.5" r="1.8" fill="#faf9f6" stroke="none"/>
  <circle class="pupil" cx="65" cy="38" r="3.5" fill="#4a5548" stroke="none"/>
  <circle class="pupil-highlight" cx="62.5" cy="35.5" r="1.8" fill="#faf9f6" stroke="none"/>
  <!-- Mouth: O shape -->
  <ellipse class="face-halo" cx="50" cy="68" rx="10" ry="9" stroke="#faf9f6" stroke-width="4" fill="none"/>
  <ellipse class="face-line" cx="50" cy="68" rx="10" ry="9" stroke="#4a5548" stroke-width="3" fill="none"/>
  <!-- Inner mouth depth -->
  <ellipse cx="50" cy="68" rx="6" ry="5.5" fill="#4a5548" stroke="none" opacity="0.12"/>
</svg>`;
export type MascotteExpressionId =
  | 'normal'
  | 'bugReport'
  | 'bugFocus'
  | 'wink'
  | 'coding'
  | 'sleeping'
  | 'shocked';

export const FACE_SVG_BY_EXPRESSION: Record<MascotteExpressionId, string> = {
  normal: faceSVG,
  bugReport: faceBugReportSVG,
  bugFocus: faceBugFocusSVG,
  wink: faceWinkSVG,
  coding: faceCodingSVG,
  sleeping: faceSleepSVG,
  shocked: faceShockedSVG,
};
