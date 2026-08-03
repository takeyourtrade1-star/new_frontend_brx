/**
 * Reindex is intentionally unavailable from the public frontend.
 *
 * Auth `/me` does not expose an authoritative Staff capability, so inferring
 * access from optional role-like fields would create a privilege-escalation
 * boundary. Re-enable this only through the Staff broker with the dedicated
 * `platform.search.reindex` capability and a server-to-server TLS channel.
 */

import { NextResponse } from 'next/server';
import { noStoreHeaders } from '@/app/api/_lib/proxy-response';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    { detail: 'Not found' },
    { status: 404, headers: noStoreHeaders() },
  );
}
