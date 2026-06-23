import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';

import { useSellSinglePhotos } from '@/hooks/vendi/useSellSinglePhotos';
import type { ListingPhotoSlot } from '@/lib/auction/auction-create-draft';
import type { SellSingleDraft } from '@/lib/marketplace/sell-single-draft';

vi.mock('@/lib/api/listing-photo-client', () => ({
  uploadPhoto: vi.fn(() => new Promise(() => {})), // resta in "uploading"
  deletePhoto: vi.fn().mockResolvedValue(undefined),
}));

function harness(initial: ListingPhotoSlot[]) {
  return renderHook(() => {
    const [draft, setDraft] = useState<SellSingleDraft>(
      { listingPhotos: initial } as unknown as SellSingleDraft
    );
    const photos = useSellSinglePhotos({
      listingPhotos: draft.listingPhotos,
      setDraft,
      setError: () => {},
    });
    return { draft, photos };
  });
}

const imgFile = (name: string) =>
  new File([new Uint8Array([1])], name, { type: 'image/png' });

beforeEach(() => vi.clearAllMocks());

describe('useSellSinglePhotos', () => {
  it('collectPhotoIds raccoglie gli id delle foto remote', () => {
    const remote = { kind: 'remote', photo: { id: 7, cdn_url: 'x' } } as unknown as ListingPhotoSlot;
    const { result } = harness([remote]);
    expect(result.current.photos.collectPhotoIds()).toEqual([7]);
  });

  it('appendListingPhotos aggiunge solo immagini e aggiorna il draft', () => {
    const { result } = harness([]);
    act(() => {
      const dt = [imgFile('a.png'), new File(['x'], 'b.txt', { type: 'text/plain' })] as unknown as FileList;
      result.current.photos.appendListingPhotos(dt);
    });
    expect(result.current.draft.listingPhotos).toHaveLength(1);
    expect(result.current.draft.listingPhotos[0].kind).toBe('local');
  });
});
