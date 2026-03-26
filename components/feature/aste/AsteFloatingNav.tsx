'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusCircle, List, Users, Truck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/stores/auth-store';

export function AsteFloatingNav({ visible = true }: { visible?: boolean }) {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pathname = usePathname();

  if (!isAuthenticated) return null;

  // Non mostrare su /aste/nuova (crea asta)
  if (pathname?.startsWith('/aste/nuova')) return null;

  // Nascondi quando visible=false (es: quando nella hero section)
  if (!visible) return null;

  const isMyListings = pathname?.startsWith('/aste/mie');
  const isParticipations = pathname?.startsWith('/aste/partecipazioni');
  const isShipping = pathname?.startsWith('/aste/spedizioni');

  return (
    <>
      {/* Mobile: bottom-center horizontal */}
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1A2B45]/95 px-3 py-2 shadow-2xl backdrop-blur-md transition-all duration-300 border border-white/10 lg:hidden">
        <Link
          href="/aste/nuova"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF7300] text-white shadow-lg transition hover:scale-110 hover:bg-[#e86800]"
          title={t('auctions.createAuction')}
        >
          <PlusCircle className="h-5 w-5" />
        </Link>
        <div className="h-6 w-px bg-white/20" />
        <Link
          href="/aste/mie"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-110 ${
            isMyListings
              ? 'bg-[#FF7300]/80 text-white shadow-lg'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={t('auctions.navMyListings')}
        >
          <List className="h-5 w-5" />
        </Link>
        <Link
          href="/aste/partecipazioni"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-110 ${
            isParticipations
              ? 'bg-[#FF7300]/80 text-white shadow-lg'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={t('auctions.navParticipations')}
        >
          <Users className="h-5 w-5" />
        </Link>
        <Link
          href="/aste/spedizioni"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-110 ${
            isShipping
              ? 'bg-[#FF7300]/80 text-white shadow-lg'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={t('auctions.navShipping')}
        >
          <Truck className="h-5 w-5" />
        </Link>
      </div>

      {/* Desktop: right vertical */}
      <div className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center gap-3 rounded-full bg-[#1A2B45]/95 px-2 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 border border-white/10 lg:flex">
        <Link
          href="/aste/nuova"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF7300] text-white shadow-lg transition hover:scale-110 hover:bg-[#e86800]"
          title={t('auctions.createAuction')}
        >
          <PlusCircle className="h-6 w-6" />
        </Link>
        <div className="h-8 w-px bg-white/20" />
        <Link
          href="/aste/mie"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-110 ${
            isMyListings
              ? 'bg-[#FF7300]/80 text-white shadow-lg'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={t('auctions.navMyListings')}
        >
          <List className="h-5 w-5" />
        </Link>
        <Link
          href="/aste/partecipazioni"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-110 ${
            isParticipations
              ? 'bg-[#FF7300]/80 text-white shadow-lg'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={t('auctions.navParticipations')}
        >
          <Users className="h-5 w-5" />
        </Link>
        <Link
          href="/aste/spedizioni"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-110 ${
            isShipping
              ? 'bg-[#FF7300]/80 text-white shadow-lg'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={t('auctions.navShipping')}
        >
          <Truck className="h-5 w-5" />
        </Link>
      </div>
    </>
  );
}
