/** Route che richiedono una sessione autenticata lato UX. */
export const PROTECTED_ROUTE_PREFIXES = [
  '/account',
  '/admin',
  '/ordini',
  '/cart',
  '/vendi',
  '/aste/nuova',
  '/aste/mie',
  '/aste/partecipazioni',
  '/bidding',
  '/scambi',
] as const;

export function isProtectedRoutePath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
