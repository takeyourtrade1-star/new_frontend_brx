const DEFAULT_REDIRECT_PATH = '/';

export function safeInternalRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_REDIRECT_PATH
): string {
  const redirectPath = value?.trim();

  if (!redirectPath) return fallback;
  if (!redirectPath.startsWith('/') || redirectPath.startsWith('//')) return fallback;
  if (redirectPath.includes('://') || redirectPath.includes('\\')) return fallback;

  return redirectPath;
}

export function withSafeRedirectParam(
  path: string,
  redirectValue: string | null | undefined,
  paramName = 'redirect'
): string {
  const redirectPath = safeInternalRedirectPath(redirectValue);
  if (redirectPath === DEFAULT_REDIRECT_PATH) return path;

  const [pathAndQuery, hash] = path.split('#', 2);
  const [pathname, queryString] = pathAndQuery.split('?', 2);
  const searchParams = new URLSearchParams(queryString);
  searchParams.set(paramName, redirectPath);

  const hashSuffix = hash ? `#${hash}` : '';
  return `${pathname}?${searchParams.toString()}${hashSuffix}`;
}
