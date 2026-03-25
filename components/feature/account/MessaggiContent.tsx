'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { AccountBreadcrumb } from '@/components/feature/account/AccountBreadcrumb';

export function MessaggiContent() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');

  return (
    <div className="min-h-screen w-full px-4 py-8 font-sans text-gray-900 md:px-8 md:py-10">
      <div className="mb-6 flex w-full flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <AccountBreadcrumb current="sidebar.messages" />
        </div>
        <Link
          href="/aiuto"
          className="text-sm font-medium text-[#FF7300] hover:underline"
        >
          {t('accountPage.messagesNeedHelp')}
        </Link>
      </div>

      <h1 className="mb-8 text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
        {t('sidebar.messages')}
      </h1>

      <div className="mb-8 border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
          {t('accountPage.messagesNew')}
        </p>
        <div className="flex max-w-md items-center gap-2">
          <Input
            type="text"
            placeholder={t('accountPage.messagesUsernamePh')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-9 flex-1 rounded-none border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#FF7300]"
          />
          <button
            type="button"
            className="flex h-9 items-center gap-2 bg-[#FF7300] px-4 text-xs font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
          >
            <Send className="h-3.5 w-3.5" />
            {t('accountPage.messagesContact')}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="mb-2 text-lg font-semibold text-gray-400 uppercase tracking-wide">
          {t('accountPage.messagesEmpty')}
        </p>
        <p className="text-sm text-gray-400">{t('accountPage.messagesEmptyHint')}</p>
      </div>
    </div>
  );
}
