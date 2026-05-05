'use client';

import { useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCdnImageUrl } from '@/lib/config';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLanguage, LANGUAGE_NAMES } from '@/lib/contexts/LanguageContext';

const FOOTER_BAND_BG = '#1D3160';
const DEV_CODE = process.env.NEXT_PUBLIC_DEV_ACCESS_CODE || '';

export function Footer() {
  const { t } = useTranslation();
  const router = useRouter();
  const { availableLangs, setSelectedLang } = useLanguage();

  const [modalOpen, setModalOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);

  const openModal = () => {
    setCodeInput('');
    setCodeError(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCodeInput('');
    setCodeError(false);
  };

  const submitCode = () => {
    if (codeInput.trim() === DEV_CODE) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('scambi_dev_access', 'true');
      }
      setModalOpen(false);
      router.push('/scambi');
    } else {
      setCodeError(true);
    }
  };

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
        { label: t('footer.link.buy'), href: '/search' },
        { label: t('footer.link.sell'), href: '/vendi' },
        { label: 'BRX Express', href: '/brx-express' },
        { label: t('footer.link.auctions'), href: '/aste' },
        { label: t('footer.link.sync'), href: '/account/sincronizzazione' },
      ],
    },
    {
      titleKey: 'footer.col.help' as const,
      links: [
        { label: t('footer.link.terms'), href: '/legal/condizioni' },
        { label: t('footer.link.privacy'), href: '/legal/privacy' },
        { label: t('footer.link.cookies'), href: '/legal/cookie' },
        { label: t('footer.link.faq'), href: '/aiuto' },
        { label: t('footer.link.contact'), href: '/aiuto' },
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
        { label: t('footer.link.pokemon'), href: '#', disabled: true },
        { label: t('footer.link.yugioh'), href: '#', disabled: true },
      ],
    },
  ];

  return (
    <footer className="relative z-10 w-full bg-white text-gray-900">
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
                      {'disabled' in link && link.disabled ? (
                        <span className="text-sm text-gray-400 cursor-default">
                          {link.label}
                        </span>
                      ) : (
                        <Link
                          href={link.href}
                          onClick={'onClick' in link ? link.onClick : undefined}
                          className="text-sm text-gray-600 transition-colors hover:text-[#FF7300]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                  {col.titleKey === 'footer.col.features' && (
                    <li>
                      <button
                        type="button"
                        onClick={openModal}
                        className="text-sm text-gray-600 transition-colors hover:text-[#FF7300]"
                      >
                        Funzioni sperimentali
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center border-t border-gray-200 bg-white px-4 py-6 text-center md:px-6">
        <p className="mb-3 max-w-5xl text-xs leading-relaxed text-gray-500">
          Tutti i marchi, i nomi dei giochi e le immagini delle carte sono di proprietà dei rispettivi titolari. Ebartex è un servizio indipendente e non è affiliato, sponsorizzato o approvato da Wizards of the Coast, Nintendo o altri produttori.
        </p>
        <span className="text-sm font-medium text-gray-700">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </span>
      </div>

      {/* Modal codice accesso Funzioni sperimentali */}
      {modalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
            aria-label="Chiudi"
          />
          <div className="relative z-[301] w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-1 text-lg font-bold text-[#1D3160]">Accesso riservato</h3>
            <p className="mb-4 text-sm text-gray-500">Inserisci il codice per accedere alle funzioni sperimentali.</p>
            <input
              type="password"
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value); setCodeError(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') submitCode(); }}
              placeholder="Codice di accesso"
              className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/20"
              autoFocus
            />
            {codeError && (
              <p className="mb-3 text-xs text-red-600">Codice errato. Riprova.</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={submitCode}
                className="flex-1 rounded-lg bg-[#FF7300] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e66800]"
              >
                Accedi
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
