'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PenTool, Sparkles, ArrowRight, Crown } from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';
import { getCardImageUrl } from '@/lib/assets';
import { useTranslation } from '@/lib/i18n/useTranslation';

export type SignedAlteredCard = {
  id: string;
  name: string;
  set_name: string;
  image?: string | null;
  artist?: string;
  alterationType?: 'signed' | 'altered' | 'both';
  price?: string;
};

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

const BADGE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; glow: string }> = {
  signed: {
    icon: <PenTool className="h-2.5 w-2.5" />,
    label: 'Firmata',
    color: 'text-amber-400',
    glow: 'rgba(251,191,36,0.4)',
  },
  altered: {
    icon: <Sparkles className="h-2.5 w-2.5" />,
    label: 'Alterata',
    color: 'text-violet-400',
    glow: 'rgba(167,139,250,0.4)',
  },
  both: {
    icon: <Crown className="h-2.5 w-2.5" />,
    label: 'Entrambe',
    color: 'text-orange-400',
    glow: 'rgba(251,146,60,0.4)',
  },
};

interface SignedAlteredShowcaseProps {
  featuredCards?: SignedAlteredCard[];
}

export function SignedAlteredShowcase({ featuredCards }: SignedAlteredShowcaseProps) {
  const { t } = useTranslation();
  const cards = featuredCards?.length ? featuredCards : FEATURED_CARDS;

  return (
    <section className="w-full text-white">
      {/* Premium container with animated border */}
      <div
        className="bento-entry relative overflow-hidden rounded-2xl border border-white/10 p-4 sm:p-5 md:p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(15,23,42,0.40) 30%, rgba(167,139,250,0.06) 70%, rgba(15,23,42,0.35) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Decorative corner glows */}
        <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-amber-400/8 blur-3xl" />
        <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-violet-400/8 blur-3xl" />

        {/* Header row */}
        <div className="mb-4 sm:mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Amber/Violet dual-glow icon */}
            <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-violet-500/20 border border-white/10">
              <PenTool className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300" />
              <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-violet-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] text-amber-300">
                  Firmate
                </span>
                <span className="text-[10px] sm:text-xs text-white/25">&amp;</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] text-violet-300">
                  Alterate
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] text-white/35 uppercase tracking-wider">
                Collezione esclusiva
              </span>
            </div>
          </div>
          <Link
            href="/collezioni-firmate-alterate"
            className="group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-white/60 transition-all duration-300 hover:border-white/25 hover:bg-white/10 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.06)]"
          >
            Vedi tutte
            <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Cards grid — 2 cols on mobile, 4 on sm+ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4">
          {cards.map((card, index) => {
            const imgUrl = getCardImageUrl(card.image ?? null);
            const badge = BADGE_CONFIG[card.alterationType || 'signed'];
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/products/${card.id}`}
                  className="group relative block overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-500 hover:border-white/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:scale-[1.02]"
                >
                  {/* Card image */}
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
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-800/60 to-zinc-900/60">
                        <Sparkles className="h-6 w-6 text-white/10" />
                      </div>
                    )}

                    {/* Hover overlay shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    {/* Badge */}
                    <div
                      className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-lg bg-black/70 px-1.5 py-1 backdrop-blur-sm border border-white/10"
                      style={{ boxShadow: `0 2px 10px ${badge.glow}` }}
                    >
                      <span className={badge.color}>{badge.icon}</span>
                      <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-white leading-none">
                        {badge.label}
                      </span>
                    </div>

                    {/* Price tag on hover */}
                    {card.price && (
                      <div className="absolute bottom-1.5 right-1.5 rounded-lg bg-emerald-500/90 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 shadow-lg">
                        {card.price}
                      </div>
                    )}
                  </div>

                  {/* Card info */}
                  <div className="px-2 py-2 sm:px-2.5 sm:py-2.5">
                    <h3 className="line-clamp-1 text-[10px] sm:text-[11px] font-bold text-white leading-tight">
                      {card.name}
                    </h3>
                    <p className="mt-0.5 text-[8px] sm:text-[9px] text-white/40">
                      {card.set_name}
                    </p>
                    {card.artist && (
                      <p className="mt-0.5 flex items-center gap-0.5 text-[7px] sm:text-[8px] text-white/30">
                        <PenTool className="h-2 w-2" />
                        {card.artist}
                      </p>
                    )}
                    {card.price && (
                      <p className="mt-1 text-[10px] sm:text-[11px] font-bold text-emerald-400 leading-tight sm:hidden">
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
