import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { useOnnxSession } from '@/hooks/scanner/useOnnxSession';
import { fetchAndCacheOnnxModel } from '@/lib/scanner/onnx-loader';
import { resolveOnnxDownloadUrls } from '@/hooks/resolveOnnxUrls';
import * as ort from 'onnxruntime-web';

// jsdom non implementa Worker → l'hook salta il ramo worker e usa
// InferenceSession in-process, che qui mockiamo.
vi.mock('@/hooks/resolveOnnxUrls', () => ({
  resolveOnnxDownloadUrls: vi.fn(),
}));

vi.mock('@/lib/scanner/onnx-loader', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/scanner/onnx-loader')>();
  return { ...actual, fetchAndCacheOnnxModel: vi.fn() };
});

vi.mock('onnxruntime-web', () => ({
  env: { wasm: {} },
  InferenceSession: { create: vi.fn() },
  Tensor: class {
    constructor(
      public type: string,
      public data: Float32Array,
      public dims: number[],
    ) {}
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(resolveOnnxDownloadUrls).mockResolvedValue(['http://x/model.onnx']);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useOnnxSession', () => {
  it('passa a modelStatus "failed" quando il download del modello fallisce', async () => {
    vi.mocked(fetchAndCacheOnnxModel).mockRejectedValue(new Error('download boom'));

    const { result } = renderHook(() => useOnnxSession({ apiBaseUrl: '/brx-match' }));

    expect(result.current.modelStatus).toBe('loading');

    await waitFor(() => expect(result.current.modelStatus).toBe('failed'));
    expect(result.current.modelError).toBe('download boom');
    expect(result.current.isTurboReady()).toBe(false);
  });

  it('passa a "ready" e isTurboReady() true sul percorso InferenceSession', async () => {
    vi.mocked(fetchAndCacheOnnxModel).mockResolvedValue(new ArrayBuffer(8));
    vi.mocked(ort.InferenceSession.create).mockResolvedValue({
      run: vi.fn().mockResolvedValue({ out: { data: new Float32Array(384) } }),
      inputNames: ['in'],
      outputNames: ['out'],
    } as unknown as ort.InferenceSession);

    const { result } = renderHook(() => useOnnxSession({ apiBaseUrl: '/brx-match' }));

    await waitFor(() => expect(result.current.modelStatus).toBe('ready'));
    expect(result.current.modelError).toBeNull();
    expect(result.current.isTurboReady()).toBe(true);
  });

  it('continueWithStandardMode imposta turboSkipped e ferma il turbo', async () => {
    vi.mocked(fetchAndCacheOnnxModel).mockResolvedValue(new ArrayBuffer(8));
    vi.mocked(ort.InferenceSession.create).mockResolvedValue({
      run: vi.fn().mockResolvedValue({ out: { data: new Float32Array(384) } }),
      inputNames: ['in'],
      outputNames: ['out'],
    } as unknown as ort.InferenceSession);

    const { result } = renderHook(() => useOnnxSession({ apiBaseUrl: '/brx-match' }));
    await waitFor(() => expect(result.current.modelStatus).toBe('ready'));

    result.current.continueWithStandardMode();

    await waitFor(() => expect(result.current.turboSkipped).toBe(true));
    expect(result.current.modelStatus).toBe('failed');
    expect(result.current.isTurboReady()).toBe(false);
  });

  it("rigetta l'embed pendente se il worker ONNX fallisce", async () => {
    vi.mocked(fetchAndCacheOnnxModel).mockResolvedValue(new ArrayBuffer(8));

    let currentWorker: MockWorker | null = null;
    class MockWorker {
      onmessage:
        | ((ev: MessageEvent<{ type: string; vector?: Float32Array; message?: string }>) => void)
        | null = null;
      onerror: ((ev: Event) => void) | null = null;
      terminate = vi.fn();

      constructor() {
        currentWorker = this;
      }

      postMessage(message: { type: string }) {
        if (message.type === 'init') {
          queueMicrotask(() => {
            this.onmessage?.({ data: { type: 'ready' } } as MessageEvent<{ type: string }>);
          });
        }
      }
    }

    vi.stubGlobal('Worker', MockWorker);

    const { result } = renderHook(() => useOnnxSession({ apiBaseUrl: '/brx-match' }));
    await waitFor(() => expect(result.current.modelStatus).toBe('ready'));

    const embedPromise = result.current.runOnnxEmbed(new Float32Array(3 * 224 * 224));
    currentWorker?.onerror?.(new Event('error'));

    await expect(embedPromise).rejects.toThrow('worker embed failed');
    expect(result.current.isTurboReady()).toBe(false);
    expect(currentWorker?.terminate).toHaveBeenCalled();
  });
});
