import 'server-only';

import type { NextRequest } from 'next/server';

const TRUSTED_COUNTRY_HEADERS = new Set([
  'cloudfront-viewer-country',
  'cf-ipcountry',
  'x-vercel-ip-country',
]);

export function countryFromTrustedEdge(request: NextRequest): string | null {
  const configuredHeader = process.env.TRUSTED_COUNTRY_HEADER?.trim().toLowerCase();
  if (!configuredHeader || !TRUSTED_COUNTRY_HEADERS.has(configuredHeader)) return null;
  const country = request.headers.get(configuredHeader)?.trim().toUpperCase();
  if (!country || !/^[A-Z]{2}$/.test(country) || country === 'XX') return null;
  return country;
}
