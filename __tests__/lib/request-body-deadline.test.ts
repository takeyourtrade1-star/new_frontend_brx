// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import {
  readBinaryBodyWithLimit,
  RequestBodyTimeoutError,
} from '@/app/api/_lib/request-body';

describe('bounded inbound request streams', () => {
  afterEach(() => vi.useRealTimers());

  it('cancels a body that stops producing chunks at the total deadline', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      pull() {
        // Deliberately leave the read pending.
      },
      cancel,
    });
    const request = {
      body,
      headers: new Headers(),
      signal: new AbortController().signal,
    } as NextRequest;

    const pending = readBinaryBodyWithLimit(request, 1024, 100);
    const rejected = expect(pending).rejects.toBeInstanceOf(RequestBodyTimeoutError);
    await vi.advanceTimersByTimeAsync(101);

    await rejected;
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('uses one total deadline even when earlier chunks arrive', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    let pulls = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        if (pulls === 1) controller.enqueue(new Uint8Array([1]));
      },
      cancel,
    });
    const request = {
      body,
      headers: new Headers(),
      signal: new AbortController().signal,
    } as NextRequest;

    const pending = readBinaryBodyWithLimit(request, 1024, 100);
    const rejected = expect(pending).rejects.toBeInstanceOf(RequestBodyTimeoutError);
    await vi.advanceTimersByTimeAsync(101);

    await rejected;
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('rejects excessive fragmentation before byte capacity is exhausted', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let index = 0; index < 9; index += 1) {
          controller.enqueue(new Uint8Array([index]));
        }
        controller.close();
      },
    });
    const request = {
      body,
      headers: new Headers(),
      signal: new AbortController().signal,
    } as NextRequest;

    await expect(readBinaryBodyWithLimit(request, 1024, 1_000, 8)).resolves.toEqual({
      tooLarge: true,
    });
  });
});
