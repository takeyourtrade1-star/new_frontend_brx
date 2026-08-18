'use client';

import { useEffect, useState } from 'react';
import {
  ExternalLink,
  KeyRound,
  PauseCircle,
  Unlink,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function SyncManagementPanel({
  isDisconnected,
  loadingSetup,
  loadingDisconnect,
  linkError,
  linkMessage,
  onLinkToken,
  onSuspend,
  onRemove,
}: {
  isDisconnected: boolean;
  loadingSetup: boolean;
  loadingDisconnect: boolean;
  linkError: string | null;
  linkMessage: string | null;
  onLinkToken: (token: string) => Promise<boolean>;
  onSuspend: () => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(isDisconnected);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (isDisconnected) setShowTokenForm(true);
  }, [isDisconnected]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanToken = token.trim();
    if (!cleanToken || loadingSetup) return;
    const linked = await onLinkToken(cleanToken);
    if (linked) {
      setToken('');
      if (!isDisconnected) setShowTokenForm(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/70 via-white to-orange-50/30 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-semibold shadow-sm transition-colors',
              isDisconnected
                ? 'bg-orange-100 text-[#FF7300]'
                : 'bg-emerald-100 text-emerald-700'
            )}
          >
            {isDisconnected ? (
              <KeyRound className="h-5 w-5" aria-hidden />
            ) : (
              <ShieldCheck className="h-5 w-5" aria-hidden />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">
                {isDisconnected
                  ? t('accountPage.syncConnectCardTrader')
                  : t('accountPage.syncConnectionTitle')}
              </h2>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                  isDisconnected
                    ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                    : 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
                )}
              >
                {isDisconnected ? 'Non collegato' : 'Attivo'}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              {isDisconnected
                ? t('accountPage.syncConnectionText')
                : 'Account CardTrader collegato con crittografia end-to-end'}
            </p>
          </div>
        </div>

        {!isDisconnected && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowTokenForm((prev) => !prev)}
            className="text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <KeyRound className="mr-1.5 h-3.5 w-3.5 text-[#FF7300]" />
            {showTokenForm ? 'Nascondi token' : t('accountPage.syncUpdateToken')}
            {showTokenForm ? (
              <ChevronUp className="ml-1 h-3.5 w-3.5 text-gray-400" />
            ) : (
              <ChevronDown className="ml-1 h-3.5 w-3.5 text-gray-400" />
            )}
          </Button>
        )}
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        {/* Onboarding Steps & Token Input (when disconnected or user wants to update) */}
        {showTokenForm && (
          <div className="space-y-5">
            {/* Hidden / accessible provider input */}
            <div className="hidden">
              <label htmlFor="sync-provider">{t('accountPage.syncProviderLabel')}</label>
              <input id="sync-provider" value="cardtrader" readOnly />
            </div>

            {/* 3-Step Guided Instructions */}
            <div className="rounded-xl border border-orange-200/70 bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-white p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FF7300]" aria-hidden />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-orange-950">
                    {t('accountPage.syncTokenGuideTitle')}
                  </h3>
                </div>
                <a
                  href="https://www.cardtrader.com/en/docs/api/full/reference"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#D95F00] transition hover:text-[#FF7300] hover:underline"
                >
                  {t('accountPage.syncTokenGuideLink')}
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Step 1 */}
                <div className="rounded-lg border border-orange-200/50 bg-white/80 p-3 shadow-2xs">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7300] text-[10px] font-bold text-white">
                      1
                    </span>
                    <span className="text-xs font-semibold text-gray-900">Accedi a CardTrader</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-gray-600">
                    {t('accountPage.syncTokenGuideStep1')}
                  </p>
                </div>

                {/* Step 2 */}
                <div className="rounded-lg border border-orange-200/50 bg-white/80 p-3 shadow-2xs">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7300] text-[10px] font-bold text-white">
                      2
                    </span>
                    <span className="text-xs font-semibold text-gray-900">Genera Token JWT</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-gray-600">
                    {t('accountPage.syncTokenGuideStep2')}
                  </p>
                </div>

                {/* Step 3 */}
                <div className="rounded-lg border border-orange-200/50 bg-white/80 p-3 shadow-2xs">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7300] text-[10px] font-bold text-white">
                      3
                    </span>
                    <span className="text-xs font-semibold text-gray-900">Incolla e Collega</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-gray-600">
                    {t('accountPage.syncTokenGuideStep3')}
                  </p>
                </div>
              </div>
            </div>

            {/* Token Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <label htmlFor="cardtrader-api-token" className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                {t('accountPage.syncTokenLabel')}
              </label>

              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-3 flex items-center text-gray-400">
                  <Lock className="h-4 w-4" aria-hidden />
                </div>
                <Input
                  id="cardtrader-api-token"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={t('accountPage.syncTokenPlaceholder')}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="h-11 bg-white pl-9 pr-10 font-mono text-xs text-gray-900 shadow-2xs focus-visible:ring-[#FF7300]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2.5 rounded p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? 'Nascondi token' : 'Mostra token'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                  <span>{t('accountPage.syncTokenSecurity')}</span>
                </div>

                <Button
                  type="submit"
                  disabled={loadingSetup || !token.trim()}
                  className="h-10 bg-[#FF7300] px-5 text-xs font-bold tracking-wider text-white shadow-sm transition hover:bg-[#e66a00] disabled:opacity-50"
                >
                  {loadingSetup ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifica in corso...
                    </>
                  ) : (
                    <>
                      {t('accountPage.syncSaveConnectAndImport')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {linkError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-xs font-medium text-red-800 shadow-2xs"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
                  <span>{linkError}</span>
                </div>
              )}

              {linkMessage && (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs font-medium text-emerald-900 shadow-2xs"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  <span>{linkMessage}</span>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Account Management & Danger Zone (only when connected) */}
        {!isDisconnected && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {t('accountPage.syncAccountActions')}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                disabled={loadingDisconnect}
                onClick={() => void onSuspend()}
                className="justify-center border-amber-200 bg-amber-50/50 text-xs font-semibold text-amber-900 transition hover:bg-amber-100/70"
              >
                {loadingDisconnect ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PauseCircle className="mr-2 h-3.5 w-3.5 text-amber-600" />
                )}
                {t('accountPage.syncSuspend')}
              </Button>

              {!confirmRemove ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={loadingDisconnect}
                  onClick={() => setConfirmRemove(true)}
                  className="justify-center border-red-200 bg-red-50/50 text-xs font-semibold text-red-700 transition hover:bg-red-100/70"
                >
                  <Unlink className="mr-2 h-3.5 w-3.5 text-red-600" />
                  {t('accountPage.syncRemoveLink')}
                </Button>
              ) : null}
            </div>

            {confirmRemove && (
              <div className="rounded-xl border border-red-200 bg-red-50/90 p-4 shadow-sm">
                <div className="mb-3 flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
                  <div>
                    <p className="text-xs font-semibold text-red-900">
                      {t('accountPage.syncRemoveConfirmText')}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmRemove(false)}
                    className="h-8 border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t('accountPage.syncCancel')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={loadingDisconnect}
                    onClick={() => void onRemove().then(() => setConfirmRemove(false))}
                    className="h-8 bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                  >
                    {loadingDisconnect ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      t('accountPage.syncConfirmRemove')
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
