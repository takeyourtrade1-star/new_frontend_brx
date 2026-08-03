export function principalTransitionRequiresPurge(
  previousPrincipal: string | null,
  nextPrincipal: string | null,
  previousExpired: boolean,
  nextExpired: boolean,
): boolean {
  return (
    (previousPrincipal !== null && previousPrincipal !== nextPrincipal) ||
    (!previousExpired && nextExpired)
  );
}
