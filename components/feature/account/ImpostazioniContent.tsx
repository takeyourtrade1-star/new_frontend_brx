'use client';

import Link from 'next/link';
import { Globe, Mail, Ban, Truck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function ImpostazioniContent() {
  const { t } = useTranslation();

  const settingsCards = [
    {
      href: '/account/impostazioni/lingua',
      icon: Globe,
      title: t('accountPage.settingsLangTitle'),
      desc: t('accountPage.settingsLangDesc'),
    },
    {
      href: '/account/impostazioni/email',
      icon: Mail,
      title: t('accountPage.settingsEmailTitle'),
      desc: t('accountPage.settingsEmailDesc'),
    },
    {
      href: '/account/impostazioni/utenti-bloccati',
      icon: Ban,
      title: t('accountPage.settingsBlockedTitle'),
      desc: t('accountPage.settingsBlockedDesc'),
    },
    {
      href: '/account/impostazioni/paesi-spedizione',
      icon: Truck,
      title: t('accountPage.settingsShipTitle'),
      desc: t('accountPage.settingsShipDesc'),
    },
  ];

  return (
    <div className="font-sans text-gray-900">
      <h1 className="mb-8 text-2xl font-bold uppercase tracking-wide text-gray-900">
        {t('sidebar.settings')}
      </h1>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {settingsCards.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-[#FF7300] hover:shadow-md"
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: '#FF7300' }}
            >
              <Icon className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="mb-1 text-lg font-bold uppercase tracking-wide text-gray-900 transition-colors group-hover:text-[#FF7300]">
                {title}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
