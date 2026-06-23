'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getCdnImageUrl } from '@/lib/config';
import { GAME_OPTIONS } from '@/lib/contexts/GameContext';
import type { GameSlug } from '@/lib/contexts/GameContext';
import type { MessageKey } from '@/lib/i18n/messages/en';
import {
  ORANGE_GLASS_MENU_CLASS,
  ORANGE_GLASS_DIVIDER_CLASS,
  ORANGE_GLASS_COMPACT_MENU_CLASS,
  ORANGE_GLASS_SOFT_DIVIDER_CLASS,
} from './header-menu-styles';

type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

const GAME_HOME_PATH: Record<GameSlug, string> = {
  mtg: '/home/magic',
  pokemon: '/home/pokemon',
  op: '/home/one-piece',
};

/** Piano 1.6 — pannelli dropdown dell'header estratti verbatim da TopBar. */
export function AccountMenuPanel({ onClose, t }: { onClose: () => void; t: T }) {
  return (
                  <div
                    className={ORANGE_GLASS_MENU_CLASS}
                    role="menu"
                    aria-label={t('account.menuAria')}
                  >
                    <nav className="flex flex-col" aria-label={t('account.menuAria')}>
                      <Link
                        href="/account"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={onClose}
                      >
                        {t('account.account')}
                      </Link>
                      <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                      <Link
                        href="/account/messaggi"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={onClose}
                      >
                        {t('account.messages')}
                      </Link>
                      <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                      <Link
                        href="/account/credito"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={onClose}
                      >
                        {t('account.credit')}
                      </Link>
                      <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                      <Link
                        href="/account/sincronizzazione"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={onClose}
                      >
                        {t('account.sync')}
                      </Link>
                      <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                      <Link
                        href="/scambi"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={onClose}
                      >
                        I MIEI SCAMBI
                      </Link>
                    </nav>
                  </div>
  );
}

export function AcquistiMenuPanel({ onClose, t }: { onClose: () => void; t: T }) {
  return (
                  <div
                    className={ORANGE_GLASS_MENU_CLASS}
                    role="menu"
                  >
                    <Link
                      href="/ordini/acquisti"
                      className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                      onClick={onClose}
                    >
                      {t('purchases.myPurchases')}
                    </Link>
                    <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                    <Link
                      href="/account/lista-desideri"
                      className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                      onClick={onClose}
                    >
                      {t('purchases.wishlist')}
                    </Link>
                  </div>
  );
}

export function VendiMenuPanel({ onClose, t }: { onClose: () => void; t: T }) {
  return (
                  <div
                    className={ORANGE_GLASS_MENU_CLASS}
                    role="menu"
                  >
                    <nav className="flex flex-col">
                      <Link
                        href="/vendi"
                        className="relative flex w-full items-center rounded-full bg-white/60 shadow-lg py-2 text-base font-semibold uppercase tracking-wide text-[#FF7300] hover:bg-white/70 hover:shadow-xl transition-all mx-0 my-2 backdrop-blur-md border border-white/30"
                        onClick={onClose}
                      >
                        <span className="absolute left-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF7300] text-white opacity-90 animate-pulse shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </span>
                        <span className="w-full text-center">Vendi</span>
                      </Link>

                      <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                      <Link
                        href="/ordini/vendite"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={onClose}
                      >
                        Le mie vendite
                      </Link>

                      <div className={ORANGE_GLASS_DIVIDER_CLASS} aria-hidden />
                      <Link
                        href="/account/oggetti"
                        className="block py-2 text-sm font-medium uppercase tracking-wide text-white hover:underline"
                        onClick={onClose}
                      >
                        {t('account.items')}
                      </Link>
                    </nav>
                  </div>
  );
}

export function GamesMenuPanel({
  onClose,
  onSelect,
  t,
}: {
  onClose: () => void;
  onSelect: (game: GameSlug) => void;
  t: T;
}) {
  return (
              <div
                className={ORANGE_GLASS_COMPACT_MENU_CLASS}
                role="menu"
                aria-label={t('topBar.gamesMenuAria')}
              >
                {GAME_OPTIONS.filter(opt => opt.value === 'mtg').map((opt, i) => {
                  const logoSrc =
                    opt.value === 'mtg'
                      ? getCdnImageUrl('loghi-giochi/magic.png')
                      : opt.value === 'pokemon'
                      ? getCdnImageUrl('loghi-giochi/pokèmon.png')
                      : getCdnImageUrl('loghi-giochi/One_Piece_Card_Game_Logo%201.png');
                  return (
                  <div key={opt.value}>
                    {i > 0 && <div className={ORANGE_GLASS_SOFT_DIVIDER_CLASS} aria-hidden />}
                    <Link
                      href={GAME_HOME_PATH[opt.value]}
                      onClick={() => { onSelect(opt.value); onClose(); }}
                      className="flex w-full items-center justify-center rounded-lg px-4 py-3 text-white/95 transition-colors duration-200 hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                      role="menuitem"
                      aria-label={opt.label}
                    >
                      <Image
                        src={logoSrc}
                        alt={opt.label}
                        width={160}
                        height={48}
                        className="mx-auto h-10 w-auto max-w-[9rem] object-contain sm:h-12 sm:max-w-[10rem]"
                        sizes="160px"
                        unoptimized
                      />
                    </Link>
                  </div>
                )})}
              </div>
  );
}
