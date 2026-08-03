import { NextResponse } from 'next/server';

// Raw upstream diagnostics must never be exposed over HTTP, including in dev.
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
