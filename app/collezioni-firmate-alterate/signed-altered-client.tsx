'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  PenTool,
  Sparkles,
  ArrowLeft,
  Filter,
  Grid3X3,
  List,
  Search,
  X,
  ChevronDown,
} from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';
import { getCardImageUrl } from '@/lib/assets';
import { Header } from '@/components/layout/Header';
import { Suspense } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';

/** Card item for signed/altered collection */
type CollectionCard = {
  id: string;
  name: string;
  set_name: string;
  image?: string | null;
  artist?: string;
  alterationType: 'signed' | 'altered' | 'both';
  price?: string;
  gameSlug: string;
  rarity?: string;
  seller?: string;
  condition?: string;
};

/** Mock data for the collection */
const COLLECTION_CARDS: CollectionCard[] = [
  {
    id: 'signed-1',
    name: 'Black Lotus',
    set_name: 'Alpha',
    image: getCdnImageUrl('card-1.png'),
    artist: 'Christopher Rush',
    alterationType: 'signed',
    price: '€15,000',
    gameSlug: 'mtg',
    rarity: 'Rare',
    seller: 'VintageCollector',
    condition: 'NM',
  },
  {
    id: 'altered-1',
    name: 'Lightning Bolt',
    set_name: 'Revised',
    image: getCdnImageUrl('card-2.png'),
    artist: 'Klug Alter',
    alterationType: 'altered',
    price: '€450',
    gameSlug: 'mtg',
    rarity: 'Common',
    seller: 'AlterMaster',
    condition: 'LP',
  },
  {
    id: 'signed-2',
    name: 'Mox Pearl',
    set_name: 'Alpha',
    image: getCdnImageUrl('card-3.png'),
    artist: 'Dan Fraizer',
    alterationType: 'both',
    price: '€8,500',
    gameSlug: 'mtg',
    rarity: 'Rare',
    seller: 'PowerNineShop',
    condition: 'NM',
  },
  {
    id: 'altered-2',
    name: 'Jace, the Mind Sculptor',
    set_name: 'Worldwake',
    image: null,
    artist: 'Extreme Alter',
    alterationType: 'altered',
    price: '€320',
    gameSlug: 'mtg',
    rarity: 'Mythic',
    seller: 'ArtisticCards',
    condition: 'NM',
  },
  {
    id: 'signed-3',
    name: 'Mox Sapphire',
    set_name: 'Alpha',
    image: getCdnImageUrl('card-1.png'),
    artist: 'Dan Fraizer',
    alterationType: 'signed',
    price: '€12,000',
    gameSlug: 'mtg',
    rarity: 'Rare',
    seller: 'VintageCollector',
    condition: 'NM',
  },
  {
    id: 'altered-3',
    name: 'Force of Will',
    set_name: 'Alliances',
    image: null,
    artist: 'Borderless Art',
    alterationType: 'altered',
    price: '€280',
    gameSlug: 'mtg',
    rarity: 'Uncommon',
    seller: 'AlterMaster',
    condition: 'NM',
  },
  {
    id: 'signed-4',
    name: 'Ancestral Recall',
    set_name: 'Alpha',
    image: getCdnImageUrl('card-2.png'),
    artist: 'Mark Poole',
    alterationType: 'signed',
    price: '€9,500',
    gameSlug: 'mtg',
    rarity: 'Rare',
    seller: 'PowerNineShop',
    condition: 'NM',
  },
  {
    id: 'altered-4',
    name: 'Sol Ring',
    set_name: 'Revised',
    image: null,
    artist: 'Full Art Alter',
    alterationType: 'altered',
    price: '€180',
    gameSlug: 'mtg',
    rarity: 'Uncommon',
    seller: 'ArtisticCards',
    condition: 'NM',
  },
  {
    id: 'both-1',
    name: 'Time Walk',
    set_name: 'Alpha',
    image: getCdnImageUrl('card-3.png'),
    artist: 'Amy Weber',
    alterationType: 'both',
    price: '€11,000',
    gameSlug: 'mtg',
    rarity: 'Rare',
    seller: 'PremiumCards',
    condition: 'NM',
  },
  {
    id: 'altered-5',
    name: 'Counterspell',
    set_name: 'Beta',
    image: null,
    artist: 'Classic Alter',
    alterationType: 'altered',
    price: '€120',
    gameSlug: 'mtg',
    rarity: 'Common',
    seller: 'AlterMaster',
    condition: 'NM',
  },
  {
    id: 'signed-5',
    name: 'Underground Sea',
    set_name: 'Revised',
    image: getCdnImageUrl('card-1.png'),
    artist: 'Rob Alexander',
    alterationType: 'signed',
    price: '€650',
    gameSlug: 'mtg',
    rarity: 'Rare',
    seller: 'DualLandsShop',
    condition: 'NM',
  },
  {
    id: 'altered-6',
    name: 'Brainstorm',
    set_name: 'Ice Age',
    image: null,
    artist: 'Textless Alter',
    alterationType: 'altered',
    price: '€95',
    gameSlug: 'mtg',
    rarity: 'Common',
    seller: 'ArtisticCards',
    condition: 'NM',
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
  both: 'Firmata + Alterata',
};

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'signed' | 'altered' | 'both';

function CollectionCardGrid({ card, index }: { card: CollectionCard; index: number }) {
  const imgUrl = getCardImageUrl(card.image ?? null);
  const glowColor = GLOW_COLORS[card.alterationType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative"
    >
      <Link
        href={`/products/${card.id}`}
        className="block relative overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all duration-500 hover:border-zinc-400 hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
      >
        {/* Glow effect */}
        <div
          className="absolute -inset-1 rounded-xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40"
          style={{ background: `radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, transparent 70%)` }}
        />

        {/* Card Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={card.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-200 to-zinc-300">
              <Sparkles className="h-12 w-12 text-zinc-400" />
            </div>
          )}

          {/* Badge */}
          <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 backdrop-blur-sm">
            {card.alterationType === 'signed' && <PenTool className="h-3 w-3 text-amber-400" />}
            {card.alterationType === 'altered' && <Sparkles className="h-3 w-3 text-violet-400" />}
            {card.alterationType === 'both' && (
              <>
                <PenTool className="h-3 w-3 text-orange-400" />
                <Sparkles className="h-3 w-3 text-orange-400" />
              </>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">
              {BADGE_LABELS[card.alterationType]}
            </span>
          </div>

          {/* Rarity badge */}
          {card.rarity && (
            <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-700">
              {card.rarity}
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className="p-3">
          <h3 className="line-clamp-1 text-sm font-bold text-zinc-900">{card.name}</h3>
          <p className="text-[11px] text-zinc-500">{card.set_name}</p>
          {card.artist && (
            <p className="mt-1 text-[10px] text-zinc-400">by {card.artist}</p>
          )}
          <div className="mt-2 flex items-center justify-between">
            {card.price && (
              <p className="text-sm font-bold text-emerald-600">{card.price}</p>
            )}
            {card.condition && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-600">
                {card.condition}
              </span>
            )}
          </div>
          {card.seller && (
            <p className="mt-1 text-[10px] text-zinc-400">Venditore: {card.seller}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function CollectionCardList({ card, index }: { card: CollectionCard; index: number }) {
  const imgUrl = getCardImageUrl(card.image ?? null);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link
        href={`/products/${card.id}`}
        className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-3 transition-all duration-300 hover:border-zinc-400 hover:shadow-md"
      >
        {/* Thumbnail */}
        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={card.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Sparkles className="h-6 w-6 text-zinc-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-zinc-900">{card.name}</h3>
            <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold">
              {card.alterationType === 'signed' && <PenTool className="h-3 w-3 text-amber-500" />}
              {card.alterationType === 'altered' && <Sparkles className="h-3 w-3 text-violet-500" />}
              {card.alterationType === 'both' && (
                <>
                  <PenTool className="h-3 w-3 text-orange-500" />
                  <Sparkles className="h-3 w-3 text-orange-500" />
                </>
              )}
              {BADGE_LABELS[card.alterationType]}
            </span>
          </div>
          <p className="text-sm text-zinc-500">{card.set_name}</p>
          {card.artist && (
            <p className="text-xs text-zinc-400">by {card.artist}</p>
          )}
        </div>

        {/* Price & Condition */}
        <div className="text-right shrink-0">
          {card.price && (
            <p className="font-bold text-emerald-600">{card.price}</p>
          )}
          {card.condition && (
            <span className="text-xs text-zinc-500">{card.condition}</span>
          )}
          {card.seller && (
            <p className="text-[10px] text-zinc-400">{card.seller}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export function SignedAlteredCollectionPage() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const breadcrumbItems: AppBreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Collezioni Firmate e Alterate', href: '/collezioni-firmate-alterate' },
  ];

  const filteredCards = COLLECTION_CARDS.filter((card) => {
    // Filter by type
    if (filter !== 'all' && card.alterationType !== filter) {
      return false;
    }
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        card.name.toLowerCase().includes(query) ||
        card.set_name.toLowerCase().includes(query) ||
        (card.artist && card.artist.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const filterButtons: { type: FilterType; label: string; icon: React.ReactNode }[] = [
    { type: 'all', label: 'Tutte', icon: <Sparkles className="h-4 w-4" /> },
    { type: 'signed', label: 'Firmate', icon: <PenTool className="h-4 w-4" /> },
    { type: 'altered', label: 'Alterate', icon: <Sparkles className="h-4 w-4" /> },
    { type: 'both', label: 'Firmate + Alterate', icon: <><PenTool className="h-4 w-4" /><Sparkles className="h-4 w-4" /></> },
  ];

  return (
    <main className="min-h-screen bg-zinc-50">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header reserveSpace={false} />
      </Suspense>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 pt-24 pb-12">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(251, 191, 36, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, rgba(167, 139, 250, 0.3) 0%, transparent 50%)`
          }} />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <AppBreadcrumb items={breadcrumbItems} variant="default" />
          </div>

          {/* Back link */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alla Home
          </Link>

          {/* Title */}
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-violet-500 shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
                Collezioni{' '}
                <span className="text-amber-400">Firmate</span>
                <span className="text-white/40"> & </span>
                <span className="text-violet-400">Alterate</span>
              </h1>
              <p className="mt-1 text-zinc-400">
                Le carte pi rare e preziose del marketplace
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-300">
            Scopri le carte firmate direttamente dagli artisti originali e le alterazioni artistiche uniche.
            Ogni pezzo  una vera opera d arte, perfetta per i collezionisti pi esigenti.
          </p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter buttons - Desktop */}
            <div className="hidden items-center gap-2 sm:flex">
              {filterButtons.map((btn) => (
                <button
                  key={btn.type}
                  onClick={() => setFilter(btn.type)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    filter === btn.type
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Filter dropdown - Mobile */}
            <div className="relative sm:hidden">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {filterButtons.find((b) => b.type === filter)?.label}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-zinc-200 bg-white shadow-lg">
                  {filterButtons.map((btn) => (
                    <button
                      key={btn.type}
                      onClick={() => {
                        setFilter(btn.type);
                        setIsFilterOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-zinc-50 ${
                        filter === btn.type ? 'bg-zinc-100 font-medium' : ''
                      }`}
                    >
                      {btn.icon}
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search & View toggle */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cerca carte..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-9 text-sm outline-none transition-all focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* View mode toggle */}
              <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded p-1.5 transition-colors ${
                    viewMode === 'grid' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'
                  }`}
                  aria-label="Vista griglia"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded p-1.5 transition-colors ${
                    viewMode === 'list' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'
                  }`}
                  aria-label="Vista lista"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Results count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {filteredCards.length} {filteredCards.length === 1 ? 'carta trovata' : 'carte trovate'}
          </p>
        </div>

        {/* Cards display */}
        {filteredCards.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {filteredCards.map((card, index) => (
                <CollectionCardGrid key={card.id} card={card} index={index} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredCards.map((card, index) => (
                <CollectionCardList key={card.id} card={card} index={index} />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
              <Search className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="font-display text-lg font-bold text-zinc-900">Nessuna carta trovata</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Prova a modificare i filtri o la ricerca
            </p>
            <button
              onClick={() => {
                setFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Resetta filtri
            </button>
          </div>
        )}
      </section>

      {/* Info Section */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <PenTool className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-display text-lg font-bold text-zinc-900">Carte Firmate</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Carte autografate dagli artisti originali. Ogni firma  garantita e verificata
                per autenticit. Perfette per collezionisti che cercano pezzi unici con storia.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                <Sparkles className="h-6 w-6 text-violet-600" />
              </div>
              <h3 className="font-display text-lg font-bold text-zinc-900">Carte Alterate</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Opere d arte su carta. Gli alteratori professionisti trasformano le carte in pezzi
                unici con tecniche avanzate di pittura e modifica dei bordi.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <div className="flex items-center gap-1">
                  <PenTool className="h-5 w-5 text-orange-600" />
                  <Sparkles className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <h3 className="font-display text-lg font-bold text-zinc-900">Edizioni Speciali</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Le carte pi rare: firmate E alterate. Il meglio del meglio per i collezionisti
                pi esigenti che cercano il pezzo forte della loro collezione.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
