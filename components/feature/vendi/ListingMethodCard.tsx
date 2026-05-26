'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ListingMethodCardProps = {
  href: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  className?: string;
  size?: 'default' | 'large';
};

const SIZE_STYLES = {
  default: {
    card: 'max-w-[220px]',
    image: 'aspect-[4/3]',
    label: 'min-h-[56px] px-3 py-3 text-sm sm:text-base',
    sizes: '(max-width: 640px) 50vw, 220px',
  },
  large: {
    card: 'w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[380px]',
    image: 'aspect-[5/4] min-h-[220px] sm:min-h-[260px]',
    label: 'min-h-[72px] px-4 py-5 text-lg sm:text-xl',
    sizes: '(max-width: 640px) 90vw, 380px',
  },
} as const;

export function ListingMethodCard({
  href,
  imageSrc,
  imageAlt,
  title,
  className,
  size = 'default',
}: ListingMethodCardProps) {
  const styles = SIZE_STYLES[size];

  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col overflow-hidden rounded border border-gray-200 bg-white shadow-sm transition-all duration-200',
        'hover:border-[#1D3160]/25 hover:shadow-lg hover:-translate-y-0.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7300] focus-visible:ring-offset-2',
        styles.card,
        className
      )}
    >
      <div className={cn('relative w-full overflow-hidden bg-[#f8f9fb]', styles.image)}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes={styles.sizes}
        />
      </div>
      <div
        className={cn(
          'flex items-center justify-center border-t border-gray-100',
          styles.label
        )}
      >
        <span className="text-center font-bold text-[#1D3160]">{title}</span>
      </div>
    </Link>
  );
}
