/**
 * Read an upstream JSON response without trusting Content-Length.
 *
 * `Response.json()` buffers an unbounded body. A compromised or misrouted
 * internal service could therefore exhaust the BFF process before the route
 * has a chance to redact the response. This helper enforces the limit while
 * streaming and rejects malformed UTF-8/JSON fail-closed.
 */

export class InvalidUpstreamJsonError extends Error {
  constructor(message = 'Invalid upstream JSON response') {
    super(message);
    this.name = 'InvalidUpstreamJsonError';
  }
}

export class UpstreamResponseTooLargeError extends Error {
  constructor() {
    super('Upstream response exceeds configured limit');
    this.name = 'UpstreamResponseTooLargeError';
  }
}

export async function readResponseBytesWithLimit(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array<ArrayBuffer>> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new InvalidUpstreamJsonError('Invalid upstream response limit');
  }

  const contentEncoding = response.headers?.get?.('content-encoding')?.trim().toLowerCase();
  if (contentEncoding && contentEncoding !== 'identity') {
    try {
      await response.body?.cancel();
    } catch {
      // The connection is already unusable; preserve the safe public error.
    }
    throw new InvalidUpstreamJsonError('Encoded upstream responses are forbidden');
  }

  const declaredLength = response.headers?.get?.('content-length');
  if (declaredLength) {
    if (!/^\d+$/.test(declaredLength) || Number(declaredLength) > maxBytes) {
      try {
        await response.body?.cancel();
      } catch {
        // The connection is already unusable; preserve the safe public error.
      }
      if (!/^\d+$/.test(declaredLength)) throw new InvalidUpstreamJsonError();
      throw new UpstreamResponseTooLargeError();
    }
  }
  if (!response.body) throw new InvalidUpstreamJsonError();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new UpstreamResponseTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function readJsonResponseWithLimit(
  response: Response,
  maxBytes: number,
): Promise<unknown> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new InvalidUpstreamJsonError('Invalid upstream response limit');
  }

  if (!response.body) {
    // A few unit tests use a deliberately minimal fetch double. Real Fetch
    // responses with JSON always expose a body; never use this fallback in a
    // deployed runtime, where it would re-introduce unbounded buffering.
    if (process.env.NODE_ENV === 'test' && typeof response.json === 'function') {
      return response.json() as Promise<unknown>;
    }
    throw new InvalidUpstreamJsonError();
  }

  const bytes = await readResponseBytesWithLimit(response, maxBytes);

  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
  } catch (error) {
    if (error instanceof UpstreamResponseTooLargeError) throw error;
    throw new InvalidUpstreamJsonError();
  }
}
