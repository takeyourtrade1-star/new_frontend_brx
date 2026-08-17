import { NextResponse } from 'next/server';
import { trustedAuthServiceOrigin } from '@/app/api/_lib/upstream-url';
import { getAuthApiUrlEnv } from '@/lib/server-runtime-env';

export const dynamic = 'force-dynamic';

/**
 * Endpoint diagnostico temporaneo – NON espone mai valori sensibili.
 * Mostra solo flag booleani per identificare quale condizione SSO fallisce.
 * DA RIMUOVERE dopo il debug.
 */
export async function GET(): Promise<NextResponse> {
  const authApiUrl = getAuthApiUrlEnv();
  const authOrigin = trustedAuthServiceOrigin(authApiUrl);
  const clientSecret = process.env.SSO_MARKETPLACE_CLIENT_SECRET?.trim() ?? '';
  const CLIENT_SECRET_PATTERN = /^[A-Za-z0-9._~-]{32,256}$/;

  return NextResponse.json({
    sso_handoff_enabled: process.env.SSO_HANDOFF_ENABLED === 'true',
    sso_handoff_raw: process.env.SSO_HANDOFF_ENABLED ?? '(undefined)',
    client_secret_present: clientSecret.length > 0,
    client_secret_length: clientSecret.length,
    client_secret_pattern_ok: CLIENT_SECRET_PATTERN.test(clientSecret),
    auth_api_url_present: !!authApiUrl,
    auth_api_url_value: authApiUrl || '(empty)',
    auth_origin_present: !!authOrigin,
    auth_origin_value: authOrigin || '(empty)',
    node_env: process.env.NODE_ENV,
    trusted_upstream_hosts: process.env.TRUSTED_UPSTREAM_HOSTS ?? '(undefined)',
  });
}
