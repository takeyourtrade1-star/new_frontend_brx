'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { getListingPhotos } from '@/lib/api/listing-photo-client';
import { getCdnImageUrl } from '@/lib/config';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isMarketplaceListingUuid(id: string | number): boolean {
  return typeof id === 'string' && UUID_RE.test(id);
}

function resolveImageSrc(imageUrl: string): string {
  if (!imageUrl) return '';
  return imageUrl.startsWith('http') ? imageUrl : getCdnImageUrl(imageUrl);
}

type ListingCartPhotoProps = {
  listingId: string | number;
  fallbackImageUrl: string;
  alt: string;
};

/** Optional listing photo for marketplace cart lines (falls back to catalog image). */
export function ListingCartPhoto({ listingId, fallbackImageUrl, alt }: ListingCartPhotoProps) {
  const [listingPhotoUrl, setListingPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isMarketplaceListingUuid(listingId)) return;
    let cancelled = false;
    void getListingPhotos(String(listingId))
      .then((photos) => {
        if (cancelled) return;
        const first = photos.sort((a, b) => a.position - b.position)[0];
        if (first?.cdn_url) setListingPhotoUrl(first.cdn_url);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const src = listingPhotoUrl || resolveImageSrc(fallbackImageUrl);

  return (
    <div className="relative h-[4.5rem] w-[3.25rem] shrink-0 overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/5">
      {src ? (
        <Image src={src} alt={alt} fill className="object-contain" sizes="48px" unoptimized />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ShoppingBag className="h-5 w-5 text-gray-400" />
        </div>
      )}
    </div>
  );
}
