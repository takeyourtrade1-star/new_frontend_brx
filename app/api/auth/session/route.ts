import { NextResponse } from 'next/server';

const ACCESS_TOKEN_COOKIE_NAME = 'ebartex_access_token';
const REFRESH_TOKEN_COOKIE_NAME = 'ebartex_refresh_token';
const ZUSTAND_AUTH_COOKIE_NAME = 'ebartex-auth';

function expireCookie(response: NextResponse, name: string, httpOnly: boolean) {
  response.cookies.set({
    name,
    value: '',
    path: '/',
    maxAge: 0,
    httpOnly,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function DELETE() {
  const response = NextResponse.json(
    { status: 'ok' },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );

  expireCookie(response, ACCESS_TOKEN_COOKIE_NAME, true);
  expireCookie(response, REFRESH_TOKEN_COOKIE_NAME, true);
  expireCookie(response, ZUSTAND_AUTH_COOKIE_NAME, false);

  return response;
}
