import { render, act, cleanup } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useBrxScanner } from '@/hooks/useBrxScanner';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function ScannerHarness() {
  const scanner = useBrxScanner({ captureIntervalMs: 700 });

  useEffect(() => {
    void scanner.openCamera();
    return scanner.stopScanning;
  }, [scanner.openCamera, scanner.stopScanning]);

  return (
    <>
      <video ref={scanner.videoRef} />
      <canvas ref={scanner.canvasRef} />
    </>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useBrxScanner', () => {
  it('stops a camera stream that resolves after the scanner unmounts', async () => {
    const pendingStream = deferred<MediaStream>();
    const stopTrack = vi.fn();
    const getUserMedia = vi.fn(() => pendingStream.promise);
    const stream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;

    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia,
      },
    });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval').mockReturnValue(1 as never);

    const { unmount } = render(<ScannerHarness />);

    expect(getUserMedia).toHaveBeenCalledTimes(1);
    unmount();

    await act(async () => {
      pendingStream.resolve(stream);
      await pendingStream.promise;
      await Promise.resolve();
    });

    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });
});
