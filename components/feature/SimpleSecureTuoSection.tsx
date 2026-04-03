'use client';

import { MousePointerClick, PackageOpen, ShieldCheck, KeyRound } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function SimpleSecureTuoSection({
  hideTitleOnDesktop = false,
  noCard = false,
}: {
  hideTitleOnDesktop?: boolean;
  noCard?: boolean;
}) {
  const { t } = useTranslation();

  const bullets = useMemo(
    () =>
      [
        { text: t('simpleSecure.b1'), Icon: MousePointerClick },
        { text: t('simpleSecure.b2'), Icon: PackageOpen },
        { text: t('simpleSecure.b3'), Icon: ShieldCheck },
        { text: t('simpleSecure.b4'), Icon: KeyRound },
      ] as const,
    [t]
  );

  return (
    <section className={noCard
      ? "flex flex-col bg-slate-100/60 bg-[url('/brx-sfondo-logo-tile.svg')] bg-[length:120px_120px] 3xl:bg-[length:88px_88px] bg-repeat p-2 text-gray-900 md:p-3"
      : "flex flex-col rounded-2xl bg-white/90 bg-[url('/brx-sfondo-logo-tile.svg')] bg-[length:120px_120px] 3xl:bg-[length:88px_88px] bg-repeat p-6 text-gray-900 md:p-8"
    }>
      <h2 className={`mb-6 text-xl font-black uppercase tracking-wide text-gray-900 md:text-2xl ${hideTitleOnDesktop ? 'lg:hidden' : ''}`}>
        {t('simpleSecure.title')}
      </h2>
      <div className="relative">
        <div
          className={`pointer-events-none absolute inset-0 rounded-xl ${noCard ? 'bg-white/50' : 'bg-white/35'}`}
          aria-hidden
        />
        <ul className="relative space-y-4 rounded-xl p-3">
          {bullets.map(({ text, Icon }, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5"
                style={{ backgroundColor: '#FF7300' }}
                aria-hidden
              >
                <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-sm leading-relaxed text-gray-800 md:text-base font-normal">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
