import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchAndCacheOnnxModel } from '@/lib/scanner/onnx-loader';

const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ONNX loader integrity boundary', () => {
  it('accepts an exact same-origin model only after size and SHA-256 verification', async () => {
    const bytes = new Uint8Array(100_000).fill(7);
    const fetchMock = vi.fn().mockResolvedValue(new Response(bytes, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(bytes.byteLength),
      },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchAndCacheOnnxModel('/api/scanner/static/dinov2_small.onnx', {
      bytes: bytes.byteLength,
      sha256: digest(bytes),
    });

    expect(result.byteLength).toBe(bytes.byteLength);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/scanner/static/dinov2_small.onnx'),
      expect.objectContaining({
        headers: { 'X-Scanner-Request': '1' },
        mode: 'same-origin',
      }),
    );
  });

  it('rejects a dishonest declared size and a digest mismatch', async () => {
    const bytes = new Uint8Array(100_000).fill(3);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(bytes, {
      headers: { 'Content-Length': '100001' },
    })));
    await expect(fetchAndCacheOnnxModel('/api/scanner/static/dinov2_small.onnx', {
      bytes: bytes.byteLength,
      sha256: digest(bytes),
    })).rejects.toThrow(/Dimensione modello/);

    vi.mocked(fetch).mockResolvedValue(new Response(bytes));
    await expect(fetchAndCacheOnnxModel('/api/scanner/static/dinov2_small.onnx', {
      bytes: bytes.byteLength,
      sha256: 'f'.repeat(64),
    })).rejects.toThrow(/SHA-256/);
  });

  it('rejects cross-origin downloads and oversized manifests before fetching', async () => {
    vi.stubGlobal('fetch', vi.fn());
    await expect(fetchAndCacheOnnxModel('https://evil.test/model.onnx', {
      bytes: 100_000,
      sha256: 'a'.repeat(64),
    })).rejects.toThrow(/Download modello/);
    await expect(fetchAndCacheOnnxModel('/api/scanner/static/dinov2_small.onnx', {
      bytes: 129 * 1024 * 1024,
      sha256: 'a'.repeat(64),
    })).rejects.toThrow(/Manifest integrità/);
    expect(fetch).not.toHaveBeenCalled();
  });
});
