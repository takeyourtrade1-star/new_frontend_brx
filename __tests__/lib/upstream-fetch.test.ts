// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('fetchWithBodyDeadline', () => {
  it('aborts a stalled upstream body after the total deadline', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    let upstreamSignal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        upstreamSignal = init?.signal ?? undefined;
        return new Response(
          new ReadableStream<Uint8Array>({
            pull: () => new Promise<void>(() => undefined),
            cancel,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }),
    );

    const response = await fetchWithBodyDeadline(
      'https://upstream.example/resource',
      {},
      1_000,
    );
    const read = response.body!.getReader().read();
    const rejectedRead = expect(read).rejects.toMatchObject({ name: 'AbortError' });

    await vi.advanceTimersByTimeAsync(1_000);

    await rejectedRead;
    expect(upstreamSignal?.aborted).toBe(true);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('cleans up the deadline after a body completes', async () => {
    vi.useFakeTimers();
    let upstreamSignal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        upstreamSignal = init?.signal ?? undefined;
        return new Response('{"ok":true}');
      }),
    );

    const response = await fetchWithBodyDeadline(
      'https://upstream.example/resource',
      {},
      1_000,
    );
    await expect(response.json()).resolves.toEqual({ ok: true });
    await vi.advanceTimersByTimeAsync(2_000);

    expect(upstreamSignal?.aborted).toBe(false);
  });
});
