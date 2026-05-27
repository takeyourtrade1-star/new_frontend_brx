import type { ListingPhotoSlot } from '@/lib/auction/auction-create-draft';
import type { UploadedPhoto } from '@/lib/api/auction-photo-client';

/** Merge PENDING photos from a pairing session into wizard slots (dedupe by id). */
export function mergeRemoteIntoListingPhotos(
  current: ListingPhotoSlot[],
  remote: UploadedPhoto[],
  maxPhotos: number,
): { next: ListingPhotoSlot[]; added: number; lastAddedId: number | null } {
  const existingIds = new Set(
    current
      .filter((x): x is Extract<ListingPhotoSlot, { kind: 'remote' }> => x.kind === 'remote')
      .map((x) => x.photo.id),
  );
  let next = [...current];
  let added = 0;
  let lastAddedId: number | null = null;
  for (const p of remote) {
    if (existingIds.has(p.id)) continue;
    if (next.length >= maxPhotos) break;
    next.push({ kind: 'remote', photo: p });
    existingIds.add(p.id);
    added += 1;
    lastAddedId = p.id;
  }
  return { next, added, lastAddedId };
}
