import type { NextRequest } from 'next/server';

export interface LimitedBodyResult {
  body?: string;
  tooLarge: boolean;
}

export interface LimitedBinaryBodyResult {
  body?: Uint8Array<ArrayBuffer>;
  tooLarge: boolean;
}

export class RequestBodyTimeoutError extends Error {
  constructor() {
    super('Request body read deadline exceeded');
    this.name = 'RequestBodyTimeoutError';
  }
}

const DEFAULT_BODY_READ_TIMEOUT_MS = 10_000;
const DEFAULT_BODY_CHUNK_LIMIT = 1_024;

/** Read an arbitrary request body with an actual streamed byte cap. */
export async function readBinaryBodyWithLimit(
  request: NextRequest,
  maxBytes: number,
  timeoutMs: number = DEFAULT_BODY_READ_TIMEOUT_MS,
  maxChunks: number = DEFAULT_BODY_CHUNK_LIMIT,
): Promise<LimitedBinaryBodyResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new Error('Invalid request body limit');
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) {
    throw new Error('Invalid request body timeout');
  }
  if (!Number.isSafeInteger(maxChunks) || maxChunks < 1 || maxChunks > 100_000) {
    throw new Error('Invalid request body chunk limit');
  }
  const declared = request.headers.get('content-length');
  if (declared !== null) {
    if (!/^\d+$/.test(declared)) throw new Error('Invalid Content-Length');
    if (Number(declared) > maxBytes) return { tooLarge: true };
  }
  if (!request.body) return { body: undefined, tooLarge: false };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let chunkCount = 0;
  let cancelRequested = false;
  let rejectDeadline: ((reason: RequestBodyTimeoutError) => void) | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    rejectDeadline = reject;
  });
  const timeout = setTimeout(
    () => rejectDeadline?.(new RequestBodyTimeoutError()),
    timeoutMs,
  );
  const cancelReader = (reason: string) => {
    if (cancelRequested) return;
    cancelRequested = true;
    void reader.cancel(reason).catch(() => undefined);
  };
  const abortRequest = () => {
    cancelReader('client aborted request body');
    rejectDeadline?.(new RequestBodyTimeoutError());
  };
  request.signal.addEventListener('abort', abortRequest, { once: true });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      chunkCount += 1;
      if (chunkCount > maxChunks) {
        cancelReader('request body chunk limit exceeded');
        return { tooLarge: true };
      }
      total += value.byteLength;
      if (total > maxBytes) {
        cancelReader('request body limit exceeded');
        return { tooLarge: true };
      }
      chunks.push(value);
    }
  } catch (error) {
    cancelReader('request body read failed');
    throw error;
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener('abort', abortRequest);
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body, tooLarge: false };
}

/** Legge un body testuale senza affidarsi a Content-Length. */
export async function readTextBodyWithLimit(
  request: NextRequest,
  maxBytes: number,
  timeoutMs: number = DEFAULT_BODY_READ_TIMEOUT_MS,
): Promise<LimitedBodyResult> {
  const result = await readBinaryBodyWithLimit(request, maxBytes, timeoutMs);
  if (result.tooLarge) return { tooLarge: true };
  const merged = result.body;
  return {
    body: merged && merged.byteLength > 0 ? new TextDecoder().decode(merged) : undefined,
    tooLarge: false,
  };
}
