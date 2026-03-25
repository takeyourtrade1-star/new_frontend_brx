'use client';

import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function SimpleSecureTuoSection() {
  const { t } = useTranslation();

  const bullets = useMemo(
    () =>
      [
        t('simpleSecure.b1'),
        t('simpleSecure.b2'),
        t('simpleSecure.b3'),
        t('simpleSecure.b4'),
      ] as const,
    [t]
  );

  return (
    <section className="flex flex-col rounded-2xl bg-white p-6 text-gray-900 md:p-8">
      <h2 className="mb-6 text-xl font-bold uppercase tracking-wide text-gray-900 md:text-2xl">
        {t('simpleSecure.title')}
      </h2>
      <ul className="space-y-4">
        {bullets.map((text, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5"
              style={{ backgroundColor: '#FF7300' }}
              aria-hidden
            >
              <Plus className="h-3.5 w-3.5 text-white" strokeWidth={3} />
            </span>
            <span className="text-sm leading-relaxed text-gray-800 md:text-base">{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
