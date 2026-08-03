import { describe, expect, it, vi } from 'vitest';

import {
  InvalidUpstreamJsonError,
  readJsonResponseWithLimit,
  readResponseBytesWithLimit,
  UpstreamResponseTooLargeError,
} from '@/app/api/_lib/bounded-json-response';

function chunkedResponse(chunks: Uint8Array[], headers?: HeadersInit): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      pull(controller) {
        const chunk = chunks.shift();
        if (chunk) controller.enqueue(chunk);
        else controller.close();
      },
    }),
    { headers },
  );
}

describe('bounded upstream response reader', () => {
  it('caps actual bytes even without or with dishonest Content-Length', async () => {
    await expect(
      readResponseBytesWithLimit(
        chunkedResponse([new Uint8Array(4), new Uint8Array(5)]),
        8,
      ),
    ).rejects.toBeInstanceOf(UpstreamResponseTooLargeError);
    await expect(
      readResponseBytesWithLimit(
        chunkedResponse([new Uint8Array(9)], { 'content-length': '1' }),
        8,
      ),
    ).rejects.toBeInstanceOf(UpstreamResponseTooLargeError);
  });

  it('rejects compressed responses before decoding credentials-adjacent data', async () => {
    const response = chunkedResponse(
      [new TextEncoder().encode('{"ok":true}')],
      { 'content-encoding': 'gzip' },
    );
    await expect(readJsonResponseWithLimit(response, 1024)).rejects.toBeInstanceOf(
      InvalidUpstreamJsonError,
    );
  });

  it('cancels upstream bodies on forbidden encoding and declared overflow', async () => {
    const headerCases: HeadersInit[] = [
      { 'content-encoding': 'gzip' },
      { 'content-length': '9999' },
    ];
    for (const headers of headerCases) {
      const cancel = vi.fn();
      const response = new Response(
        new ReadableStream<Uint8Array>({ cancel }),
        { headers },
      );
      await expect(readResponseBytesWithLimit(response, 8)).rejects.toThrow();
      expect(cancel).toHaveBeenCalledOnce();
    }
  });
});
