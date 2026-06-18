import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const dir = 'components/auth/ui';
mkdirSync(dir, { recursive: true });

const authStyles = `/** Token Tailwind condivisi per tutte le schermate auth. */
export const AUTH_CARD_CLASS =
  'relative w-full max-w-[480px] mx-auto overflow-hidden animate-auth-enter rounded-[40px] bg-white/85 backdrop-blur-[60px] shadow-[0_32px_64px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)] border border-white/50';

export const AUTH_CARD_INNER_CLASS = 'p-8 sm:p-10 flex flex-col';

export const AUTH_TITLE_CLASS =
  'text-center text-[26px] sm:text-[32px] font-bold tracking-tight text-[#1d1d1f]';

export const AUTH_SUBTITLE_CLASS = 'text-center text-[14px] sm:text-[15px] text-[#86868b]';

export const AUTH_INPUT_CLASS =
  'h-14 w-full rounded-2xl border border-black/10 bg-black/5 px-4 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-global-bg-start focus:ring-2 focus:ring-global-bg-start/25 transition-all disabled:opacity-50';

export const AUTH_LABEL_CLASS = 'mb-1.5 block text-[13px] font-medium text-[#515154]';

export const AUTH_LINK_CLASS =
  'font-medium text-global-bg-start hover:underline transition-colors';

export const AUTH_PRIMARY_BUTTON_CLASS =
  'w-full rounded-full bg-gradient-global py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(61,101,198,0.35)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

export const AUTH_SECONDARY_BUTTON_CLASS =
  'w-full rounded-full bg-white border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-4 py-3.5 text-center text-[15px] font-semibold text-[#1d1d1f] transition-all hover:bg-gray-50 active:scale-[0.98]';

export const AUTH_ERROR_CLASS =
  'rounded-2xl bg-red-50 border border-red-100 p-3.5 flex items-center gap-2.5';

export const AUTH_REQUIRED_MARKER_CLASS = 'ml-1 text-primary font-semibold';
`;

writeFileSync(join(dir, 'auth-styles.ts'), authStyles, 'utf8');
console.log('auth-styles.ts written');
