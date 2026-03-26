'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { ImpostazioniSubBreadcrumb } from '@/components/feature/account/ImpostazioniSubBreadcrumb';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function UtentiBloccatiContent() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  const handleAdd = () => {
    if (username.trim() && !blockedUsers.includes(username.trim())) {
      setBlockedUsers([...blockedUsers, username.trim()]);
      setUsername('');
    }
  };

  const handleRemove = (user: string) => {
    setBlockedUsers(blockedUsers.filter((u) => u !== user));
  };

  return (
    <div className="font-sans text-gray-900">
      <ImpostazioniSubBreadcrumb current="accountPage.crumbBlocked" variant="light" showHelpLink />

      <section className="mb-10 mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-gray-900">
        <p className="uppercase">{t('accountPage.blockedIntro')}</p>
        <ul className="list-inside list-disc space-y-2 uppercase">
          <li>{t('accountPage.blockedLi1')}</li>
          <li>{t('accountPage.blockedLi2')}</li>
          <li>{t('accountPage.blockedLi3')}</li>
          <li>{t('accountPage.blockedLi4')}</li>
        </ul>
        <p className="uppercase">{t('accountPage.blockedSummary')}</p>
        <p className="uppercase">{t('accountPage.blockedWarning')}</p>
      </section>

      <section className="flex max-w-4xl flex-wrap items-center gap-4">
        <h2 className="shrink-0 text-xl font-bold uppercase tracking-wide text-gray-900">
          {t('accountPage.blockedManageTitle')}
        </h2>
        <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-none bg-gray-200 py-1.5 pr-1.5">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('accountPage.blockedUsernamePh')}
            className="min-w-0 flex-1 border-0 bg-transparent px-5 py-3 text-base font-medium text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!username.trim()}
            className="shrink-0 rounded-lg px-5 py-2.5 text-base font-semibold uppercase text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: '#FF7300' }}
          >
            {t('accountPage.blockedAddBtn')}
          </button>
        </div>
      </section>

      {blockedUsers.length > 0 && (
        <section className="mt-8 max-w-4xl">
          <ul className="space-y-3">
            {blockedUsers.map((user) => (
              <li
                key={user}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <span className="text-base font-medium text-gray-900">{user}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(user)}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                  {t('accountPage.blockedRemoveBtn')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
