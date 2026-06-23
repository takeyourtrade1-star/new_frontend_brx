import Image from 'next/image';
import { cn } from '@/lib/utils';

export function ReprintCardPreview({
  imageSrc,
  alt,
  className,
}: {
  imageSrc: string | null;
  alt: string;
  className?: string;
}) {
  if (!imageSrc) {
    return (
      <div
        className={cn(
          'flex h-20 w-full items-center justify-center rounded-lg bg-zinc-100 text-[11px] font-semibold text-zinc-400',
          className
        )}
      >
        Immagine N/A
      </div>
    );
  }
  return (
    <div className={cn('relative h-20 w-full overflow-hidden rounded-lg bg-zinc-900/[0.04]', className)}>
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className="object-cover object-top"
        sizes="240px"
        unoptimized
      />
    </div>
  );
}
