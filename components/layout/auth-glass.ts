import type { CSSProperties } from 'react';

/** Shared glass card class for all auth pages (includes fade-in entrance) */
export const AUTH_GLASS_CLASS =
  'animate-auth-enter overflow-hidden rounded-3xl border-2 border-white';

/** Translucent light glass — for pages with form inputs (login, recover, demo registration) */
export const AUTH_GLASS_LIGHT: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.35)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
};

/** Translucent dark glass — for pages with white text content (register choice) */
export const AUTH_GLASS_DARK: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
};
