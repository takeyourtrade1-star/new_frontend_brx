import { NextRequest } from 'next/server';
import { proxyTrade } from '../_proxy';

export const dynamic = 'force-dynamic';
type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyTrade(request, path);
}

export async function GET(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}
