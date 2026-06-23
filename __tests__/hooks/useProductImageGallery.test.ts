import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type React from 'react';

import { useProductImageGallery } from '@/hooks/product/useProductImageGallery';

const args = { effectiveImageSrc: '/img/card.png', title: 'Sol Ring' };

const touch = (x: number) =>
  ({ targetTouches: [{ clientX: x }] }) as unknown as React.TouchEvent;

beforeEach(() => vi.restoreAllMocks());

describe('useProductImageGallery', () => {
  it('espone cardImages dall\'immagine effettiva e apre/chiude il lightbox', () => {
    const { result } = renderHook(() => useProductImageGallery(args));
    expect(result.current.cardImages).toEqual(['/img/card.png']);
    expect(result.current.isLightboxOpen).toBe(false);

    act(() => result.current.handleLightboxOpen());
    expect(result.current.isLightboxOpen).toBe(true);
    act(() => result.current.handleLightboxClose());
    expect(result.current.isLightboxOpen).toBe(false);
  });

  it('uno swipe oltre la soglia non lancia errori (singola immagine resta a 0)', () => {
    const { result } = renderHook(() => useProductImageGallery(args));
    act(() => result.current.handleTouchStart(touch(200)));
    act(() => result.current.handleTouchMove(touch(20)));
    act(() => result.current.handleTouchEnd());
    // una sola immagine ⇒ l'indice torna sempre a 0
    expect(result.current.currentImageIndex).toBe(0);
  });

  it('handleShare usa la clipboard quando navigator.share non esiste', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    vi.stubGlobal('alert', vi.fn());

    const { result } = renderHook(() => useProductImageGallery(args));
    await act(async () => {
      await result.current.handleShare();
    });

    expect(writeText).toHaveBeenCalled();
  });
});
