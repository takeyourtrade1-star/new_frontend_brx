'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getCdnImageUrl } from '@/lib/config';
import { COMING_SOON_GAMES } from '@/lib/landing/coming-soon-games';
import type { MessageKey } from '@/lib/i18n/dictionaries';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

interface LoginDemoShowcaseProps {
  className?: string;
}

type Pillar = {
  key: string;
  labelKey: MessageKey;
  titleKey: MessageKey;
  descKey: MessageKey;
  accent: string;
};

const PILLARS: Pillar[] = [
  {
    key: 'aste',
    labelKey: 'pages.login.sponsor.f1Label',
    titleKey: 'pages.login.sponsor.f1Title',
    descKey: 'pages.login.sponsor.f1Desc',
    accent: '#FB923C',
  },
  {
    key: 'scambi',
    labelKey: 'pages.login.sponsor.f2Label',
    titleKey: 'pages.login.sponsor.f2Title',
    descKey: 'pages.login.sponsor.f2Desc',
    accent: '#34D399',
  },
  {
    key: 'tornei',
    labelKey: 'pages.login.sponsor.f3Label',
    titleKey: 'pages.login.sponsor.f3Title',
    descKey: 'pages.login.sponsor.f3Desc',
    accent: '#A78BFA',
  },
  {
    key: 'brx',
    labelKey: 'pages.login.sponsor.f4Label',
    titleKey: 'pages.login.sponsor.f4Title',
    descKey: 'pages.login.sponsor.f4Desc',
    accent: '#38BDF8',
  },
];

/** Colonna sinistra auth: sponsor editoriale dei vantaggi del sito (no scroll). */
export function LoginDemoShowcase({ className }: LoginDemoShowcaseProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex h-full w-full min-w-0 flex-col', className)}>
      <Link
        href="/"
        aria-label={t('pages.auth.homeAria')}
        className="inline-flex shrink-0 pt-1 transition-opacity hover:opacity-90"
      >
        <Image
          src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
          alt="Ebartex"
          width={700}
          height={263}
          className="h-11 w-auto object-contain drop-shadow-lg sm:h-12 lg:h-14"
          sizes="280px"
          priority
          unoptimized
        />
      </Link>

      <div className="flex flex-1 flex-col justify-center gap-6 py-6 lg:gap-7">
        <div className="max-w-md">
          <h1 className="font-display text-[1.65rem] font-extrabold leading-[1.08] tracking-tight text-white drop-shadow sm:text-3xl lg:text-[2.1rem]">
            {t('pages.login.sponsor.headline')}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65 sm:text-[15px]">
            {t('pages.login.sponsor.subhead')}
          </p>
        </div>

        <ul className="flex flex-col">
          {PILLARS.map(({ key, labelKey, titleKey, descKey, accent }, i) => (
            <li
              key={key}
              className={cn('flex gap-4 py-3', i > 0 && 'border-t border-white/10')}
            >
              <span
                className="mt-1 h-9 w-[3px] shrink-0 rounded-full"
                style={{ backgroundColor: accent, boxShadow: `0 0 12px ${accent}99` }}
                aria-hidden
              />
              <div className="min-w-0">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: accent }}
                >
                  {t(labelKey)}
                </span>
                <p className="text-[15px] font-bold leading-tight text-white">
                  {t(titleKey)}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-white/55">
                  {t(descKey)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2.5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/40 bg-gradient-to-r from-emerald-500/25 to-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-50 shadow-[0_0_20px_rgba(52,211,153,0.18)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
            </span>
            {t('pages.login.sponsor.footLive')}
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
              {t('pages.login.sponsor.footSoon')}
            </span>
            {COMING_SOON_GAMES.map((game) => (
              <span
                key={game.label}
                className="rounded-full border border-white/15 bg-white/[0.07] px-2 py-0.5 text-[10px] font-medium text-white/75 backdrop-blur-sm"
              >
                {game.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
