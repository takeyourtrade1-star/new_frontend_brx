'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { AtSign, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useClaimUsername } from '@/lib/hooks/use-auth';
import { parseAuthError } from '@/lib/api/auth-error';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

/** Formatta una data ISO in gg.mm.aaaa; ritorna '—' se assente o non valida. */
function formatRegDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function ProfiloRow({ labelKey, value }: { labelKey: MessageKey; value: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm font-normal uppercase text-gray-900">{t(labelKey)}</span>
      <span className="break-all text-right text-sm font-normal text-gray-900">{value}</span>
    </div>
  );
}

function Separator() {
  return <hr className="border-t border-gray-200" />;
}

export function ProfiloContent() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const claimUsername = useClaimUsername();
  const username = user?.username?.trim() ?? '';
  const canClaimUsername = user?.can_claim_username === true;
  const displayName = (username || user?.email || t('user.fallbackName')).toUpperCase();
  const email = user?.email ?? '—';
  const regDate = formatRegDate(user?.created_at);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSucceeded, setClaimSucceeded] = useState(false);

  const submitUsername = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const candidate = usernameDraft.trim();
    setClaimSucceeded(false);

    if (!USERNAME_PATTERN.test(candidate)) {
      setClaimError(t('accountPage.profileUsernameInvalid'));
      return;
    }

    setClaimError(null);
    try {
      await claimUsername.mutateAsync(candidate);
      setUsernameDraft('');
      setClaimSucceeded(true);
    } catch (error) {
      const parsed = parseAuthError(error);
      if (parsed.message === 'USERNAME_TAKEN') {
        setClaimError(t('accountPage.profileUsernameTaken'));
      } else if (parsed.message === 'USERNAME_ALREADY_SET') {
        setClaimError(t('accountPage.profileUsernameAlreadySet'));
      } else {
        setClaimError(t('accountPage.profileUsernameGenericError'));
      }
    }
  };

  return (
    <div className="font-sans text-gray-900">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
          {displayName}
        </h1>
        {username && !canClaimUsername && (
          <Link
            href={`/users/${encodeURIComponent(username)}`}
            className="text-sm font-normal text-gray-900 underline hover:text-[#FF7300]"
          >
            {t('accountPage.profilePublicLink')}
          </Link>
        )}
      </div>

      {canClaimUsername && (
        <section className="mb-8 overflow-hidden rounded-2xl border border-[#FF7300]/30 bg-gradient-to-br from-[#07172d] to-[#0e2948] text-white shadow-[0_18px_50px_rgba(7,23,45,0.18)]">
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-[#FF7300]/15 p-2.5 text-[#FF8B33] ring-1 ring-[#FF7300]/30">
                <AtSign className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {t('accountPage.profileUsernameLegacyTitle')}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                  {t('accountPage.profileUsernameLegacyDescription')}
                </p>
              </div>
            </div>

            <form onSubmit={submitUsername} className="mt-5">
              <label htmlFor="legacy-username" className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
                {t('accountPage.profileUsernameLabel')}
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  id="legacy-username"
                  type="text"
                  autoComplete="username"
                  minLength={3}
                  maxLength={20}
                  pattern="[A-Za-z0-9_]{3,20}"
                  value={usernameDraft}
                  onChange={(event) => {
                    setUsernameDraft(event.target.value);
                    setClaimError(null);
                  }}
                  placeholder={t('accountPage.profileUsernamePlaceholder')}
                  aria-describedby="legacy-username-hint legacy-username-error"
                  aria-invalid={Boolean(claimError)}
                  className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-[#FF7300] focus:ring-2 focus:ring-[#FF7300]/25"
                />
                <button
                  type="submit"
                  disabled={claimUsername.isPending || !usernameDraft.trim()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#FF7300] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e96800] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {claimUsername.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {claimUsername.isPending
                    ? t('accountPage.profileUsernameSaving')
                    : t('accountPage.profileUsernameSubmit')}
                </button>
              </div>
              <p id="legacy-username-hint" className="mt-2 text-xs leading-5 text-slate-400">
                {t('accountPage.profileUsernameHint')}
              </p>
              {claimError && (
                <p id="legacy-username-error" role="alert" className="mt-2 text-sm text-red-300">
                  {claimError}
                </p>
              )}
            </form>
          </div>
        </section>
      )}

      {claimSucceeded && (
        <div role="status" className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('accountPage.profileUsernameSuccess')}
        </div>
      )}

      <div className="space-y-0">
        <ProfiloRow labelKey="accountPage.profileUsername" value={username || '—'} />
        <Separator />
        <ProfiloRow labelKey="accountPage.profileType" value={t('accountPage.profilePrivate')} />
        <Separator />
        <ProfiloRow labelKey="accountPage.profileRegDate" value={regDate} />
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
    </div>
  );
}
