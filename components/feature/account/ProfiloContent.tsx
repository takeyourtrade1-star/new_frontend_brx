'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';

/** Formatta una data ISO in gg.mm.aaaa; ritorna '—' se assente o non valida. */
function formatRegDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function ProfiloRow({
  labelKey,
  value,
  editable = true,
  onEdit,
}: {
  labelKey: MessageKey;
  value: string;
  editable?: boolean;
  onEdit?: () => void;
}) {
  const { t } = useTranslation();
  const label = t(labelKey);
  const isPlaceholder = value === '---';

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm font-normal uppercase text-gray-900">{label}</span>
      <div className="flex items-center gap-2">
        {isPlaceholder ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-sm font-normal text-gray-400 hover:text-[#FF7300] hover:underline"
            title={t('user.configureNamePrompt')}
          >
            {value}
          </button>
        ) : (
          <span className="text-sm font-normal text-gray-900">{value}</span>
        )}
        {editable && (
          <button
            type="button"
            onClick={onEdit}
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
  const userName = user?.name;
  const displayName = (userName || user?.email || t('user.fallbackName')).toUpperCase();
  const email = user?.email ?? '—';
  const regDate = formatRegDate(user?.created_at);

  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const openEditName = () => {
    setNameDraft(userName ?? '');
    setNameModalOpen(true);
  };

  const handleSaveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed) {
      useAuthStore.getState().updateUserName(trimmed);
    }
    setNameModalOpen(false);
  };

  // Chiudi il modal con Esc.
  useEffect(() => {
    if (!nameModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNameModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nameModalOpen]);

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
        <ProfiloRow labelKey="accountPage.profileName" value={userName ?? '---'} onEdit={openEditName} />
        <Separator />
        <ProfiloRow labelKey="accountPage.profileType" value={t('accountPage.profilePrivate')} />
        <Separator />
        <ProfiloRow labelKey="accountPage.profileRegDate" value={regDate} editable={false} />
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

      {nameModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('user.configureName')}
          onClick={() => setNameModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t('user.configureName')}
            </h2>
            <input
              type="text"
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
              }}
              placeholder={t('user.configureNamePrompt')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#FF7300] focus:outline-none focus:ring-1 focus:ring-[#FF7300]"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setNameModalOpen(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveName}
                disabled={!nameDraft.trim()}
                className="rounded-md bg-[#FF7300] px-4 py-2 text-sm font-medium text-white hover:bg-[#e56800] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
