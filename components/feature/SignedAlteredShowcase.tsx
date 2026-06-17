'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PenLine, Paintbrush, Award, Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const IMAGE_BASE = '/firmate-alterate-foil';

type CardTraits = {
  signed: boolean;
  altered: boolean;
  foil: boolean;
};

type ShowcaseCard = {
  id: string;
  name: string;
  image: string;
  traits: CardTraits;
};

const SHOWCASE_FILES = [
  'black-lotus_signed_alterated.png',
  'birds-of-paradise_signed.png',
  'carta-cinese_signed_foil.png',
  'fork_signed.png',
  'guardian-beast_alterated.png',
  'library-of-alexandria_signed.png',
  'library-of-alexandria_signed-1.png',
  'mishras-factory_signed.png',
  'shatter_signed.png',
  'timetwister_signed.png',
  'winds-of-change_foil.png',
] as const;

function filenameToName(filename: string): string {
  const stem = filename
    .replace(/\.png$/i, '')
    .replace(/_signed.*$/, '')
    .replace(/_alterated.*$/, '')
    .replace(/_altered.*$/, '')
    .replace(/_foil.*$/, '')
    .replace(/-\d+$/, '');

  return stem
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function parseTraits(filename: string): CardTraits {
  return {
    signed: filename.includes('signed'),
    altered: filename.includes('alterated') || filename.includes('altered'),
    foil: filename.includes('foil'),
  };
}

const SHOWCASE_CARDS: ShowcaseCard[] = SHOWCASE_FILES.map((file) => ({
  id: file.replace(/\.png$/i, ''),
  name: filenameToName(file),
  image: `${IMAGE_BASE}/${file}`,
  traits: parseTraits(file),
}));

const TRAIT_LEGEND = [
  { key: 'signed' as const, icon: PenLine, label: 'Firmate' },
  { key: 'graded' as const, icon: Award, label: 'Gradate' },
  { key: 'altered' as const, icon: Paintbrush, label: 'Alterate' },
] as const;

function TraitBadge({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center text-[#FF7300]" title={label}>
      <Icon className="h-3 w-3" strokeWidth={1.75} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export type SignedAlteredCard = ShowcaseCard;

interface SignedAlteredShowcaseProps {
  featuredCards?: ShowcaseCard[];
}

export function SignedAlteredShowcase({ featuredCards }: SignedAlteredShowcaseProps) {
  const cards = featuredCards?.length ? featuredCards : SHOWCASE_CARDS;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>(':scope > *');
    const step = firstCard ? firstCard.offsetWidth + 12 : 160;
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, cards.length]);

  return (
    <section className="w-full text-white" aria-label="Collezione firmate, gradate e alterate">
      <div className="bento-entry relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 backdrop-blur-md">
        <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div aria-hidden />
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-6">
            {TRAIT_LEGEND.map(({ key, icon: Icon, label }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/75"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-[#FF7300]" strokeWidth={1.75} aria-hidden />
                {label}
              </span>
            ))}
          </div>
          <Link
            href="/collezioni-firmate-alterate"
            className="group inline-flex shrink-0 items-center justify-self-end gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/50 transition-colors hover:text-white"
          >
            Vedi tutte
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 text-[#FF7300] backdrop-blur-sm transition-colors hover:bg-black/45',
              !canScrollLeft && 'pointer-events-none opacity-30',
            )}
            aria-label="Scorri a sinistra"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>

          <div
            ref={scrollRef}
            className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide"
          >
            {cards.map((card) => (
              <Link
                key={card.id}
                href="/collezioni-firmate-alterate"
                className="group w-[120px] shrink-0 snap-start sm:w-[140px] md:w-[160px]"
              >
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20 transition-colors duration-200 group-hover:border-white/25">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={card.image}
                      alt={card.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 120px, (max-width: 768px) 140px, 160px"
                      unoptimized
                    />
                    <div className="absolute inset-x-0 bottom-0 flex gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 pt-5">
                      {card.traits.signed ? <TraitBadge icon={PenLine} label="Firmata" /> : null}
                      {card.traits.altered ? <TraitBadge icon={Paintbrush} label="Alterata" /> : null}
                      {card.traits.foil ? <TraitBadge icon={Sparkles} label="Foil" /> : null}
                    </div>
                  </div>
                  <p className="truncate px-2 py-1.5 text-[10px] font-medium text-white/80">{card.name}</p>
                </div>
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 text-[#FF7300] backdrop-blur-sm transition-colors hover:bg-black/45',
              !canScrollRight && 'pointer-events-none opacity-30',
            )}
            aria-label="Scorri a destra"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
