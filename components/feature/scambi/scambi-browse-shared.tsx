'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FlagIcon } from '@/components/ui/FlagIcon';
import type { ScambioUI, ScambioGame } from './scambi-types';

// Re-export AuctionViewToggle since it's generic
export { AuctionViewToggle } from '@/components/feature/aste/auctions-browse-shared';

function conditionBadgeClasses(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes('mint') || c.includes('nm') || c.includes('near mint')) {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
  if (c.includes('lightly played') || c.includes('lp')) {
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }
  if (c.includes('slightly played') || c.includes('sp')) {
    return 'bg-orange-100 text-orange-700 border-orange-200';
  }
  if (c.includes('played') || c.includes('moderately')) {
    return 'bg-red-100 text-red-700 border-red-200';
  }
  if (c.includes('gradato') || c.includes('psa')) {
    return 'bg-purple-100 text-purple-700 border-purple-200';
  }
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function gameLabel(g: ScambioGame): string {
  const labels: Record<ScambioGame, string> = {
    mtg: 'MTG',
    lorcana: 'Lorcana',
    pokemon: 'Pokémon',
    op: 'One Piece',
    ygo: 'Yu-Gi-Oh!',
    other: 'Altro',
  };
  return labels[g] ?? g;
}

export function ScambiGridCard({ scambio }: { scambio: ScambioUI }) {
  return (
    <Link
      href={`/scambi/${scambio.id}`}
      scroll
      prefetch
      className="group flex flex-col overflow-hidden rounded-xl border border-white/40 bg-white/70 shadow-md backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 hover:border-primary/40 hover:bg-white/85 hover:shadow-lg"
    >
      {/* Image container */}
      <div className="relative aspect-[63/88] overflow-hidden bg-gray-100">
        <Image
          src={scambio.image}
          alt=""
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          sizes="(max-width:640px) 50vw, 20vw"
          unoptimized
        />
        {/* Dark gradient overlay for badge readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

        {/* Game badge - glass, positioned top right */}
        <div className="absolute right-2 top-2 rounded-full border border-white/30 bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-lg backdrop-blur-md">
          {gameLabel(scambio.game)}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-2">
        {/* Title */}
        <p className="line-clamp-2 min-h-[2rem] text-[13px] font-semibold leading-tight text-gray-900">
          {scambio.title}
        </p>

        {/* Seller info */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <FlagIcon country={scambio.sellerCountry} size="sm" />
          <span className="truncate text-[11px] font-medium text-gray-600">{scambio.seller}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-600">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="font-medium">{scambio.sellerRating}%</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">({scambio.sellerReviewCount})</span>
        </div>

        {/* Condition badge */}
        <div className="mt-2">
          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${conditionBadgeClasses(scambio.condition)}`}>
            {scambio.condition}
          </span>
        </div>

        {/* Wants in return */}
        <div className="mt-2">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">Cerca</p>
          <p className="line-clamp-2 text-[11px] font-medium text-gray-700">{scambio.wantsInReturn}</p>
        </div>
      </div>
    </Link>
  );
}

export function ScambiListTable({ scambi }: { scambi: ScambioUI[] }) {
  const router = useRouter();

  return (
    <>
      {/* Mobile list */}
      <ul className="divide-y divide-gray-100 bg-white md:hidden">
        {scambi.map((s) => (
          <li key={s.id} className="p-3">
            <div className="flex items-start gap-3">
              <Link
                href={`/scambi/${s.id}`}
                scroll
                prefetch
                className="relative h-20 w-14 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100"
              >
                <Image src={s.image} alt="" fill className="object-cover" sizes="56px" unoptimized />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/scambi/${s.id}`}
                  scroll
                  prefetch
                  className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-[#FF7300]"
                >
                  {s.title}
                </Link>
                <p className="mt-0.5 text-[10px] font-semibold uppercase text-gray-400">
                  {gameLabel(s.game)}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-700">
                  <FlagIcon country={s.sellerCountry} size="sm" />
                  <span className="truncate">{s.seller}</span>
                  <span className="text-amber-600">★ {s.sellerRating}%</span>
                </div>
                <div className="mt-2">
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${conditionBadgeClasses(s.condition)}`}>
                    {s.condition}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <Link
                href={`/scambi/${s.id}`}
                scroll
                prefetch
                className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-xs font-bold uppercase text-header-bg hover:underline"
              >
                Vedi dettaglio
              </Link>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold uppercase text-gray-600">
              <th className="p-3">Nome</th>
              <th className="p-3">Venditore</th>
              <th className="p-3">Condizione</th>
              <th className="w-32 p-3" />
            </tr>
          </thead>
          <tbody>
            {scambi.map((s) => (
              <tr
                key={s.id}
                className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-orange-50/60"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('a')) return;
                  router.push(`/scambi/${s.id}`);
                }}
              >
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/scambi/${s.id}`}
                    className="flex items-center gap-3 font-medium text-gray-900 hover:text-[#FF7300]"
                  >
                    <span className="relative h-14 w-10 shrink-0 overflow-hidden bg-gray-100">
                      <Image src={s.image} alt="" fill className="object-cover" sizes="40px" unoptimized />
                    </span>
                    <span>
                      <span className="line-clamp-2 block">{s.title}</span>
                      <span className="mt-0.5 block text-[10px] font-semibold uppercase text-gray-400">
                        {gameLabel(s.game)}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="p-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-gray-800">
                      <FlagIcon country={s.sellerCountry} size="sm" />
                      {s.seller}
                    </span>
                    <span className="text-xs text-amber-600">
                      ★ {s.sellerRating}% ({s.sellerReviewCount})
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${conditionBadgeClasses(s.condition)}`}>
                    {s.condition}
                  </span>
                </td>
                <td className="p-3">
                  <Link
                    href={`/scambi/${s.id}`}
                    scroll
                    prefetch
                    className="inline-flex rounded-lg px-3 py-2 text-xs font-bold uppercase text-header-bg hover:underline"
                  >
                    Vedi dettaglio
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ScambiResultsGrid({ scambi }: { scambi: ScambioUI[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {scambi.map((s) => (
        <ScambiGridCard key={s.id} scambio={s} />
      ))}
    </div>
  );
}
