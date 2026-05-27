import { describe, expect, it } from 'vitest';
import { mergeRemoteIntoListingPhotos } from '@/lib/pairing/merge-remote-photos';

describe('mergeRemoteIntoListingPhotos', () => {
  it('adds new remote photos without duplicates', () => {
    const { next, added, lastAddedId } = mergeRemoteIntoListingPhotos(
      [],
      [
        { id: 1, cdn_url: 'a', width: 1, height: 1, bytes: 1, mime: 'image/webp' },
        { id: 2, cdn_url: 'b', width: 1, height: 1, bytes: 1, mime: 'image/webp' },
      ],
      4,
    );
    expect(added).toBe(2);
    expect(next).toHaveLength(2);
    expect(lastAddedId).toBe(2);
  });

  it('respects max photos cap', () => {
    const current = [
      { kind: 'remote' as const, photo: { id: 1, cdn_url: 'a', width: 1, height: 1, bytes: 1, mime: 'image/webp' } },
    ];
    const { added, next } = mergeRemoteIntoListingPhotos(
      current,
      [{ id: 2, cdn_url: 'b', width: 1, height: 1, bytes: 1, mime: 'image/webp' }],
      1,
    );
    expect(added).toBe(0);
    expect(next).toHaveLength(1);
  });
});
