'use client';

import { useState } from 'react';
import { ImpostazioniSubBreadcrumb } from '@/components/feature/account/ImpostazioniSubBreadcrumb';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';

const EMAIL_SECTIONS: {
  titleKey: MessageKey;
  items: { labelKey: MessageKey; defaultOn: boolean }[];
}[] = [
  {
    titleKey: 'accountPage.emailSec1Title',
    items: [
      { labelKey: 'accountPage.emailSec1Item1', defaultOn: true },
      { labelKey: 'accountPage.emailSec1Item2', defaultOn: false },
    ],
  },
  {
    titleKey: 'accountPage.emailSec2Title',
    items: [
      { labelKey: 'accountPage.emailSec2Item1', defaultOn: false },
      { labelKey: 'accountPage.emailSec2Item2', defaultOn: true },
    ],
  },
  {
    titleKey: 'accountPage.emailSec3Title',
    items: [
      { labelKey: 'accountPage.emailSec3Item1', defaultOn: false },
      { labelKey: 'accountPage.emailSec3Item2', defaultOn: true },
    ],
  },
  {
    titleKey: 'accountPage.emailSec4Title',
    items: [
      { labelKey: 'accountPage.emailSec4Item1', defaultOn: false },
      { labelKey: 'accountPage.emailSec4Item2', defaultOn: true },
    ],
  },
];

function EmailToggle({
  on,
  onChange,
  ariaOn,
  ariaOff,
}: {
  on: boolean;
  onChange: () => void;
  ariaOn: string;
  ariaOff: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      onClick={onChange}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-gray-300 transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#FF7300]/50"
      style={{ backgroundColor: on ? '#FF7300' : '#D1D5DB' }}
      aria-checked={on}
      aria-label={on ? ariaOn : ariaOff}
    >
      <span
        className={`inline-block h-5 w-5 translate-y-0 rounded-full shadow-sm transition-transform ${
          on
            ? 'translate-x-6 bg-white'
            : 'translate-x-0.5 bg-white'
        }`}
        aria-hidden
      />
    </button>
  );
}

export default function ImpostazioniEmailPage() {
  const { t } = useTranslation();
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    EMAIL_SECTIONS.forEach((sec, si) =>
      sec.items.forEach((item, ii) => {
        state[`${si}-${ii}`] = item.defaultOn;
      })
    );
    return state;
  });

  const setToggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const ariaOn = t('accountPage.emailToggleOn');
  const ariaOff = t('accountPage.emailToggleOff');

  return (
    <div className="font-sans text-gray-900">
      <ImpostazioniSubBreadcrumb current="accountPage.crumbEmail" variant="light" showHelpLink />

      <p className="mb-10 max-w-3xl text-lg leading-relaxed text-gray-700">{t('accountPage.emailIntro')}</p>

      <div className="space-y-8">
        {EMAIL_SECTIONS.map((section, si) => (
          <section key={si} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-gray-900">{t(section.titleKey)}</h2>
            <ul className="space-y-4">
              {section.items.map((item, ii) => {
                const key = `${si}-${ii}`;
                const on = toggles[key] ?? item.defaultOn;
                return (
                  <li key={ii} className="flex items-center justify-between gap-6 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <span className="text-base leading-relaxed text-gray-700">{t(item.labelKey)}</span>
                    <EmailToggle
                      on={on}
                      onChange={() => setToggle(key)}
                      ariaOn={ariaOn}
                      ariaOff={ariaOff}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
