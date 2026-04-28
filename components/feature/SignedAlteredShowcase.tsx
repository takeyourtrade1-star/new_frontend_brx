'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PenTool, Sparkles, ArrowRight } from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';
import { getCardImageUrl } from '@/lib/assets';
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

const BADGE_LABELS: Record<string, string> = {
  signed: 'Firmata',
  altered: 'Alterata',
  both: 'Entrambe',
};

interface SignedAlteredShowcaseProps {
  featuredCards?: SignedAlteredCard[];
}

export function SignedAlteredShowcase({ featuredCards }: SignedAlteredShowcaseProps) {
  const { t } = useTranslation();
  const cards = featuredCards?.length ? featuredCards : FEATURED_CARDS;

  return (
    <section className="w-full text-white">
      {/* Compact bento-style container */}
      <div
        className="bento-entry rounded-2xl border border-white/15 p-3 sm:p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.04) 0%, rgba(15,23,42,0.25) 40%, rgba(167,139,250,0.04) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Header row */}
        <div className="mb-2 sm:mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
              Firmate
            </span>
            <span className="text-[9px] sm:text-[10px] text-white/30">&amp;</span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300">
              Alterate
            </span>
          </div>
          <Link
            href="/collezioni-firmate-alterate"
            className="group flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-white/50 transition-colors hover:text-white"
          >
            Vedi tutte
            <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Compact cards grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {cards.map((card, index) => {
            const imgUrl = getCardImageUrl(card.image ?? null);
            const glowColor = GLOW_COLORS[card.alterationType || 'signed'];

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06, duration: 0.35 }}
              >
                <Link
                  href={`/products/${card.id}`}
                  className="group block overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-white/25 hover:shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
                >
                  {/* Glow */}
                  <div
                    className="absolute -inset-0.5 rounded-xl opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-50"
                    style={{ background: `radial-gradient(circle, rgba(${glowColor},0.35) 0%, transparent 70%)` }}
                  />

                  {/* Thumbnail */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={card.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-800/60 to-zinc-900/60">
                        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white/15" />
                      </div>
                    )}

                    {/* Tiny badge */}
                    <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
                      {card.alterationType === 'signed' && <PenTool className="h-2 w-2 text-amber-400" />}
                      {card.alterationType === 'altered' && <Sparkles className="h-2 w-2 text-violet-400" />}
                      {card.alterationType === 'both' && (
                        <>
                          <PenTool className="h-2 w-2 text-orange-400" />
                          <Sparkles className="h-2 w-2 text-orange-400" />
                        </>
                      )}
                      <span className="text-[8px] font-bold uppercase tracking-wider text-white">
                        {BADGE_LABELS[card.alterationType || 'signed']}
                      </span>
                    </div>
                  </div>

                  {/* Info - ultra compact */}
                  <div className="p-1.5 sm:p-2">
                    <h3 className="line-clamp-1 text-[9px] sm:text-[10px] font-bold text-white leading-tight">
                      {card.name}
                    </h3>
                    <p className="mt-0.5 text-[8px] sm:text-[9px] text-white/40">
                      {card.set_name}
                    </p>
                    {card.price && (
                      <p className="mt-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-400">
                        {card.price}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
