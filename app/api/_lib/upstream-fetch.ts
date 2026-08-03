import 'server-only';

/**
 * Fetch an upstream response with one deadline covering both headers and body.
 *
 * `fetch()` resolves as soon as headers arrive. Clearing a timeout at that
 * point leaves every subsequent body reader vulnerable to a slow upstream.
 * This wrapper keeps the abort controller alive until the returned body is
 * closed, errored or cancelled, then performs cleanup exactly once.
 */
export async function fetchWithBodyDeadline(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) {
    throw new TypeError('Invalid upstream timeout');
  }

  const controller = new AbortController();
  const externalSignal = init.signal;
  let cleanupComplete = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const abortFromExternal = () => {
    if (!controller.signal.aborted) controller.abort(externalSignal?.reason);
  };
  const cleanup = () => {
    if (cleanupComplete) return;
    cleanupComplete = true;
    if (timeout !== undefined) clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abortFromExternal);
  };

  if (externalSignal) {
    externalSignal.addEventListener('abort', abortFromExternal, { once: true });
    if (externalSignal.aborted) abortFromExternal();
  }
  timeout = setTimeout(() => {
    if (!controller.signal.aborted) controller.abort();
  }, timeoutMs);

  let upstream: Response;
  try {
    upstream = await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    cleanup();
    throw error;
  }

  if (!upstream.body) {
    cleanup();
    return upstream;
  }

  const reader = upstream.body.getReader();
  let finished = false;
  let cancelPromise: Promise<void> | null = null;
  let downstreamController: ReadableStreamDefaultController<Uint8Array> | null = null;

  const releaseReader = () => {
    try {
      reader.releaseLock();
    } catch {
      // A pending read keeps the lock until cancellation settles.
    }
  };
  const cancelReader = (reason?: unknown): Promise<void> => {
    if (!cancelPromise) {
      cancelPromise = reader
        .cancel(reason)
        .catch(() => undefined)
        .then(releaseReader);
    }
    return cancelPromise;
  };
  const finalize = () => {
    controller.signal.removeEventListener('abort', abortBody);
    cleanup();
  };
  const fail = (reason?: unknown) => {
    if (finished) return;
    finished = true;
    const publicError =
      reason instanceof Error ? reason : new DOMException('Upstream aborted', 'AbortError');
    try {
      downstreamController?.error(publicError);
    } finally {
      void cancelReader(publicError);
      finalize();
    }
  };
  function abortBody() {
    fail(controller.signal.reason);
  }

  const body = new ReadableStream<Uint8Array>({
    start(streamController) {
      downstreamController = streamController;
      controller.signal.addEventListener('abort', abortBody, { once: true });
      if (controller.signal.aborted) abortBody();
    },
    async pull(streamController) {
      if (finished) return;
      try {
        const { done, value } = await reader.read();
        if (finished || controller.signal.aborted) return;
        if (done) {
          finished = true;
          streamController.close();
          releaseReader();
          finalize();
          return;
        }
        streamController.enqueue(value);
      } catch (error) {
        fail(error);
      }
    },
    async cancel(reason) {
      if (!finished) {
        finished = true;
        if (!controller.signal.aborted) controller.abort();
        finalize();
      }
      await cancelReader(reason);
    },
  });

  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}
