'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Sparkles, ArrowRight } from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';
import { getCardImageUrl } from '@/lib/assets';
import { ScrollMarquee } from './ScrollMarquee';
import { useTranslation } from '@/lib/i18n/useTranslation';

/** Featured signed/altered card item */
export type SignedAlteredCard = {
  id: string;
  name: string;
  set_name: string;
  image?: string | null;
  artist?: string;
  alterationType?: 'signed' | 'altered' | 'both';
  price?: string;
};

/** Mock data for signed/altered cards showcase */
const FEATURED_CARDS: SignedAlteredCard[] = [
  {
    id: 'signed-1',
    name: 'Black Lotus',
    set_name: 'Alpha',
    image: getCdnImageUrl('card-1.png'),
    artist: 'Christopher Rush',
    alterationType: 'signed',
    price: '€15,000',
  },
  {
    id: 'altered-1',
    name: 'Lightning Bolt',
    set_name: 'Revised',
    image: getCdnImageUrl('card-2.png'),
    artist: 'Klug Alter',
    alterationType: 'altered',
    price: '€450',
  },
  {
    id: 'signed-2',
    name: 'Mox Pearl',
    set_name: 'Alpha',
    image: getCdnImageUrl('card-3.png'),
    artist: 'Dan Fraizer',
    alterationType: 'both',
    price: '€8,500',
  },
  {
    id: 'altered-2',
    name: 'Jace, the Mind Sculptor',
    set_name: 'Worldwake',
    image: null,
    artist: 'Extreme Alter',
    alterationType: 'altered',
    price: '€320',
  },
];

const GLOW_COLORS: Record<string, string> = {
  signed: '251, 191, 36',
  altered: '167, 139, 250',
  both: '255, 115, 0',
};

function FeaturedCard({ card, index }: { card: SignedAlteredCard; index: number }) {
  const { t } = useTranslation();
  const imgUrl = getCardImageUrl(card.image ?? null);
  const glowColor = GLOW_COLORS[card.alterationType || 'signed'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group relative"
    >
      <Link
        href={`/products/${card.id}`}
        className="block relative overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm transition-all duration-500 hover:border-white/40 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      >
        {/* Glow effect */}
        <div
          className="absolute -inset-1 rounded-xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-60"
          style={{ background: `radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, transparent 70%)` }}
        />

        {/* Card Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={card.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
              <Sparkles className="h-12 w-12 text-white/20" />
            </div>
          )}

          {/* Badge */}
          <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm">
            {card.alterationType === 'signed' && <PenTool className="h-3 w-3 text-amber-400" />}
            {card.alterationType === 'altered' && <Sparkles className="h-3 w-3 text-violet-400" />}
            {card.alterationType === 'both' && (
              <>
                <PenTool className="h-3 w-3 text-orange-400" />
                <Sparkles className="h-3 w-3 text-orange-400" />
              </>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">
              {card.alterationType === 'signed' && 'Firmata'}
              {card.alterationType === 'altered' && 'Alterata'}
              {card.alterationType === 'both' && 'Firmata + Alterata'}
            </span>
          </div>
        </div>

        {/* Card Info */}
        <div className="p-3">
          <h3 className="line-clamp-1 text-sm font-bold text-white">{card.name}</h3>
          <p className="text-[11px] text-white/60">{card.set_name}</p>
          {card.artist && (
            <p className="mt-1 text-[10px] text-white/40">by {card.artist}</p>
          )}
          {card.price && (
            <p className="mt-2 text-sm font-bold text-emerald-400">{card.price}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

interface SignedAlteredShowcaseProps {
  featuredCards?: SignedAlteredCard[];
}

export function SignedAlteredShowcase({ featuredCards }: SignedAlteredShowcaseProps) {
  const { t } = useTranslation();
  const cards = featuredCards?.length ? featuredCards : FEATURED_CARDS;

  return (
    <section className="w-full bg-transparent text-white">
      {/* Marquee Header */}
      <ScrollMarquee label="COLLEZIONI FIRMAT E ALTERATE" direction="left" />

      {/* Content */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-violet-950/10 to-transparent" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
                <span className="text-amber-400">Firmate</span>
                <span className="mx-2 text-white/40">&</span>
                <span className="text-violet-400">Alterate</span>
              </h2>
              <p className="mt-1 text-sm text-white/60">
                Le carte pi rare e preziose del marketplace
              </p>
            </div>

            <Link
              href="/collezioni-firmate-alterate"
              className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:border-white/40 hover:bg-white/20"
            >
              Vedi tutte
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {cards.map((card, index) => (
              <FeaturedCard key={card.id} card={card} index={index} />
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 flex justify-center">
            <Link
              href="/collezioni-firmate-alterate"
              className="group relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-r from-amber-500/20 via-white/10 to-violet-500/20 px-8 py-4 transition-all duration-500 hover:border-white/40 hover:shadow-[0_8px_32px_rgba(255,115,0,0.2)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-violet-500">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-display text-base font-bold uppercase tracking-wide text-white">
                    Esplora la Collezione
                  </p>
                  <p className="text-xs text-white/60">Scopri tutte le carte uniche</p>
                </div>
                <ArrowRight className="h-5 w-5 text-white/60 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
