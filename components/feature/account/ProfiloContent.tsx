'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';

function ProfiloRow({
  labelKey,
  value,
  editable = true,
}: {
  labelKey: MessageKey;
  value: string;
  editable?: boolean;
}) {
  const { t } = useTranslation();
  const label = t(labelKey);
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm font-normal uppercase text-gray-900">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-normal text-gray-900">{value}</span>
        {editable && (
          <button
            type="button"
            className="rounded p-1 text-[#FF7300] hover:bg-gray-100"
            aria-label={t('accountPage.profileEditAria', { field: label })}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function Separator() {
  return <hr className="border-t border-gray-200" />;
}

export function ProfiloContent() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const displayName = (user?.name || user?.email || t('user.fallbackName')).toUpperCase();
  const email = user?.email ?? '—';

  return (
    <div className="text-gray-900 font-sans">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
          {displayName}
        </h1>
        <Link
          href="#"
          className="text-sm font-normal text-gray-900 underline hover:opacity-90"
        >
          {t('accountPage.profilePublicLink')}
        </Link>
      </div>

      <div className="space-y-0">
        <ProfiloRow labelKey="accountPage.profileName" value={user?.name || '—'} />
        <Separator />
        <ProfiloRow labelKey="accountPage.profileType" value={t('accountPage.profilePrivate')} />
        <Separator />
        <ProfiloRow labelKey="accountPage.profileRegDate" value="28.01.2026" />
        <Separator />
        <ProfiloRow labelKey="accountPage.profileBirth" value="—" />
        <Separator />
        <ProfiloRow labelKey="accountPage.profileEmail" value={email} />
        <Separator />
        <ProfiloRow labelKey="accountPage.profilePassword" value="••••••••••••" />
        <Separator />
        <ProfiloRow labelKey="accountPage.profilePhone" value="—" />
        <Separator />
        <ProfiloRow labelKey="accountPage.profileDci" value="—" />
        <Separator />
        <ProfiloRow labelKey="accountPage.profileKonami" value="—" />
        <Separator />
        <ProfiloRow labelKey="accountPage.profilePlayPokemon" value="—" />
      </div>

      <div className="mt-10 pt-6">
        <Link
          href="#"
          className="text-sm font-medium uppercase text-red-500 hover:text-red-400 hover:underline"
        >
          {t('accountPage.profileCloseAccount')}
        </Link>
      </div>
    </div>
  );
}
