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
};

export function ListingMethodCard({ href, imageSrc, imageAlt, title, className }: ListingMethodCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex w-full max-w-[220px] flex-col overflow-hidden rounded border border-gray-200 bg-white shadow-sm transition-all duration-200',
        'hover:border-[#1D3160]/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7300] focus-visible:ring-offset-2',
        className
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f8f9fb]">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 50vw, 220px"
        />
      </div>
      <div className="flex min-h-[56px] items-center justify-center border-t border-gray-100 px-3 py-3">
        <span className="text-center text-sm font-bold text-[#1D3160] sm:text-base">{title}</span>
      </div>
    </Link>
  );
}
