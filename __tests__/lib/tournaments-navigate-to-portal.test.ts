/**
 * @vitest-environment jsdom
 * @vitest-environment-options {"url":"https://app.ebartex.com/tornei"}
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { navigateToTournamentsPortal } from '@/lib/tournaments/navigate-to-portal';

const originalLocation = window.location;
const replaceMock = vi.fn();

function mockEbartexLocation() {
  delete (window as { location?: Location }).location;
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...originalLocation,
      hostname: 'app.ebartex.com',
      replace: replaceMock,
    },
  });
}

describe('navigateToTournamentsPortal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    replaceMock.mockClear();
    mockEbartexLocation();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('waits for SSO cookie refresh before redirecting to the tournaments portal', async () => {
    let resolveRefresh!: (value: Response) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveRefresh = resolve;
        })
    );
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.setItem('ebartex_refresh_token', 'refresh-token');

    const navigation = navigateToTournamentsPortal('/');
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh_token: 'refresh-token' }),
      credentials: 'same-origin',
    });
    expect(replaceMock).not.toHaveBeenCalled();

    resolveRefresh(new Response('{}', { status: 200 }));
    await navigation;

    expect(replaceMock).toHaveBeenCalledWith('https://tornei.ebartex.com/');
  });

  it('redirects after a short timeout when SSO refresh hangs', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    window.localStorage.setItem('ebartex_refresh_token', 'refresh-token');

    const navigation = navigateToTournamentsPortal('/');
    await Promise.resolve();
    expect(replaceMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2500);
    await navigation;

    expect(replaceMock).toHaveBeenCalledWith('https://tornei.ebartex.com/');
  });
});
