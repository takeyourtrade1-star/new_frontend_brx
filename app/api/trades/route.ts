import { NextRequest } from 'next/server';
import { proxyTrade } from './_proxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return proxyTrade(request, []);
}

export async function POST(request: NextRequest) {
  return proxyTrade(request, []);
}
