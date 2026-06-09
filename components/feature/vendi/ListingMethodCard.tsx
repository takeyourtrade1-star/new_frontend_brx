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
  background?: string;
  glowColor?: string;
  imagePosition?: string;
  fullCard?: boolean;
};

const SIZE_STYLES = {
  default: {
    card: 'max-w-[220px]',
    image: 'aspect-[4/3]',
    label: 'min-h-[56px] px-3 py-3 text-sm sm:text-base',
    sizes: '(max-width: 640px) 50vw, 220px',
  },
  large: {
    card: 'w-full max-w-[240px] sm:max-w-[280px] lg:max-w-[320px]',
    image: 'aspect-[3/4] min-h-[260px] sm:min-h-[320px]',
    label: 'min-h-[72px] px-4 py-5 text-lg sm:text-xl',
    sizes: '(max-width: 640px) 90vw, 320px',
  },
} as const;

export function ListingMethodCard({
  href,
  imageSrc,
  imageAlt,
  title,
  className,
  size = 'default',
  background,
  glowColor,
  imagePosition = 'center',
  fullCard,
}: ListingMethodCardProps) {
  const styles = SIZE_STYLES[size];

  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all duration-300',
        'hover:border-white/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7300] focus-visible:ring-offset-2',
        styles.card,
        className
      )}
      style={background ? { background } : undefined}
    >
      <div className={cn('relative w-full overflow-hidden flex items-center justify-center', styles.image, fullCard ? 'p-0' : 'p-4')}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className={cn("transition-transform duration-300 group-hover:scale-[1.03]", fullCard ? "object-cover" : "object-contain")}
          sizes={styles.sizes}
          objectPosition={imagePosition}
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40 transition-all duration-300 group-hover:bg-black/10 group-hover:backdrop-blur-[2px]" />
        <span 
          className="absolute z-10 text-center font-bold text-white transition-all duration-300 group-hover:scale-110 font-display text-2xl sm:text-3xl"
          style={glowColor ? { textShadow: '0 2px 12px rgba(0,0,0,0.45)', ['--glow-color' as string]: glowColor } : { textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}
        >
          <span className="block transition-all duration-300 group-hover:[text-shadow:0_0_20px_rgba(var(--glow-color),0.9),0_0_40px_rgba(var(--glow-color),0.6),0_2px_12px_rgba(0,0,0,0.45)]">
            {title}
          </span>
        </span>
      </div>
    </Link>
  );
}
