'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ValidPreviewCardImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  onValidated?: (valid: boolean) => void;
}

/**
 * Renders a card image only after a successful load.
 * On error, renders nothing (parent should not show a broken-image placeholder).
 */
export function ValidPreviewCardImage({
  src,
  alt,
  className,
  imageClassName,
  sizes = '120px',
  priority = false,
  onValidated,
}: ValidPreviewCardImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div className={cn('relative overflow-hidden', !loaded && 'bg-transparent', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        sizes={sizes}
        className={cn(
          'object-cover transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          imageClassName
        )}
        onLoad={() => {
          setLoaded(true);
          onValidated?.(true);
        }}
        onError={() => {
          setFailed(true);
          onValidated?.(false);
        }}
      />
    </div>
  );
}
