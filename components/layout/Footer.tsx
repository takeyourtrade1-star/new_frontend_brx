'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCdnImageUrl } from '@/lib/config';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLanguage, LANGUAGE_NAMES } from '@/lib/contexts/LanguageContext';

const FOOTER_BAND_BG = '#1D3160';

export function Footer() {
  const { t } = useTranslation();
  const { availableLangs, setSelectedLang } = useLanguage();

  const columns = [
    {
      titleKey: 'footer.col.siteLanguage' as const,
      links: availableLangs.map((lang) => ({
        label: LANGUAGE_NAMES[lang] ?? lang,
        href: '#',
        onClick: (e: MouseEvent) => {
          e.preventDefault();
          setSelectedLang(lang);
        },
      })),
    },
    {
      titleKey: 'footer.col.features' as const,
      links: [
        { label: t('footer.link.buy'), href: '/products' },
        { label: t('footer.link.sell'), href: '/account-business' },
        { label: t('footer.link.swap'), href: '/scambi' },
        { label: t('footer.link.auctions'), href: '/aste' },
        { label: t('footer.link.sync'), href: '/sincronizza' },
      ],
    },
    {
      titleKey: 'footer.col.help' as const,
      links: [
        { label: t('footer.link.terms'), href: '/legal/condizioni' },
        { label: t('footer.link.privacy'), href: '/legal/privacy' },
        { label: t('footer.link.cookies'), href: '/legal/cookie' },
        { label: t('footer.link.faq'), href: '/aiuto' },
        { label: t('footer.link.contact'), href: '/contatti' },
      ],
    },
    {
      titleKey: 'footer.col.guides' as const,
      links: [
        { label: t('footer.link.guideTerms'), href: '/aiuto#condizioni' },
        { label: t('footer.link.guideBuy'), href: '/aiuto#comprare' },
        { label: t('footer.link.guideShipping'), href: '/aiuto#spedizione' },
      ],
    },
    {
      titleKey: 'footer.col.games' as const,
      links: [
        { label: t('footer.link.mtg'), href: '/products?game=magic' },
        { label: t('footer.link.pokemon'), href: '/products?game=pokemon' },
        { label: t('footer.link.yugioh'), href: '/products?game=yugioh' },
      ],
    },
  ];

  return (
    <footer className="w-full bg-white text-gray-900">
      <div
        className="flex items-center justify-center px-4 py-3 md:py-4"
        style={{ backgroundColor: FOOTER_BAND_BG }}
      >
        <Link href="/" className="flex items-center" aria-label="Ebartex Home">
          <Image
            src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
            alt="Ebartex"
            width={320}
            height={128}
            className="h-16 w-auto drop-shadow-sm md:h-20"
            unoptimized
          />
        </Link>
      </div>

      <div className="border-t-4 border-[#FF7300] bg-white px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-7xl 2xl:max-w-[100rem] 3xl:max-w-[120rem] px-4 md:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {columns.map((col) => (
              <div key={col.titleKey}>
                <h3 className="mb-4 border-b-2 border-[#FF7300]/60 pb-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                  {t(col.titleKey)}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label + link.href}>
                      <Link
                        href={link.href}
                        onClick={'onClick' in link ? link.onClick : undefined}
                        className="text-sm text-gray-600 transition-colors hover:text-[#FF7300]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center border-t border-gray-200 bg-white py-5 text-center">
        <span className="text-sm text-gray-700">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </span>
      </div>
    </footer>
  );
}
