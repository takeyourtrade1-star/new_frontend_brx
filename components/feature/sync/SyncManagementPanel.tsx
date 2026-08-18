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
  Zap,
  RefreshCw,
  Shield,
  Layers,
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
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all">
      {/* Brand Header Banner */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-[#1D3160]/5 via-orange-50/20 to-white px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs transition-transform',
                isDisconnected
                  ? 'bg-gradient-to-br from-[#FF7300] to-[#E66A00] text-white ring-4 ring-orange-100'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white ring-4 ring-emerald-100'
              )}
            >
              {isDisconnected ? (
                <Zap className="h-6 w-6" aria-hidden />
              ) : (
                <ShieldCheck className="h-6 w-6" aria-hidden />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold tracking-tight text-[#1D3160] sm:text-xl">
                  {isDisconnected
                    ? 'Collega il tuo Account CardTrader'
                    : 'Integrazione CardTrader Attiva'}
                </h2>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider',
                    isDisconnected
                      ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                      : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      isDisconnected ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                    )}
                  />
                  {isDisconnected ? 'Non collegato' : 'Sincronizzazione 24/7'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {isDisconnected
                  ? 'Importa le tue carte Magic e sincronizza le vendite in tempo reale con zero rischio overselling.'
                  : 'Il tuo inventario è collegato e protetto con crittografia end-to-end su AWS.'}
              </p>
            </div>
          </div>

          {!isDisconnected && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTokenForm((prev) => !prev)}
                className="h-9 border-gray-200 bg-white text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50"
              >
                <KeyRound className="mr-1.5 h-3.5 w-3.5 text-[#FF7300]" />
                {showTokenForm ? 'Chiudi' : 'Aggiorna Token API'}
                {showTokenForm ? (
                  <ChevronUp className="ml-1.5 h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <ChevronDown className="ml-1.5 h-3.5 w-3.5 text-gray-400" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-7">
        {/* Onboarding Steps & Token Input */}
        {showTokenForm && (
          <div className="space-y-6">
            {/* Hidden / accessible provider input */}
            <div className="hidden">
              <label htmlFor="sync-provider">{t('accountPage.syncProviderLabel')}</label>
              <input id="sync-provider" value="cardtrader" readOnly />
            </div>

            {/* 3-Step Guided Cards */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FF7300]" aria-hidden />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D3160]">
                    Guida Rapida al Collegamento (3 Passaggi)
                  </h3>
                </div>
                <a
                  href="https://www.cardtrader.com/en/docs/api/full/reference"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF7300] transition hover:text-[#D95F00] hover:underline"
                >
                  {t('accountPage.syncTokenGuideLink')}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Step 1 */}
                <div className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 transition-all hover:border-orange-200 hover:bg-white hover:shadow-xs">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1D3160] text-xs font-black text-white shadow-xs">
                        1
                      </span>
                      <span className="text-xs font-bold text-[#1D3160]">Accedi a CardTrader</span>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-600">
                      Vai nella sezione <strong>App & API Tokens</strong> del tuo account CardTrader.
                    </p>
                  </div>
                  <a
                    href="https://www.cardtrader.com/apps/full"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#FF7300] hover:underline"
                  >
                    Apri pagina Token <ArrowRight className="h-3 w-3" />
                  </a>
                </div>

                {/* Step 2 */}
                <div className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 transition-all hover:border-orange-200 hover:bg-white hover:shadow-xs">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1D3160] text-xs font-black text-white shadow-xs">
                        2
                      </span>
                      <span className="text-xs font-bold text-[#1D3160]">Crea Token Completo</span>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-600">
                      Genera un <strong>Full Access JWT Token</strong> con permessi di lettura/scrittura per il tuo catalogo.
                    </p>
                  </div>
                  <span className="mt-3 text-[11px] font-medium text-gray-400">
                    Nessuna scadenza richiesta
                  </span>
                </div>

                {/* Step 3 */}
                <div className="group relative flex flex-col justify-between rounded-2xl border border-orange-200/90 bg-orange-50/30 p-4 transition-all hover:bg-white hover:shadow-xs">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF7300] text-xs font-black text-white shadow-xs">
                        3
                      </span>
                      <span className="text-xs font-bold text-[#1D3160]">Incolla e Sincronizza</span>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-600">
                      Incolla la chiave nel campo sottostante e clicca <strong>Salva e Collega</strong>.
                    </p>
                  </div>
                  <span className="mt-3 text-[11px] font-bold text-[#FF7300]">
                    Crittografato AES-256
                  </span>
                </div>
              </div>
            </div>

            {/* Token Form */}
            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200/80 bg-gray-50/40 p-4 sm:p-5">
              <div>
                <label
                  htmlFor="cardtrader-api-token"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700"
                >
                  {t('accountPage.syncTokenLabel')}
                </label>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 flex items-center text-gray-400">
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
                    className="h-12 rounded-xl bg-white pl-10 pr-12 font-mono text-xs text-gray-900 shadow-2xs transition focus-visible:border-[#FF7300] focus-visible:ring-2 focus-visible:ring-[#FF7300]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
                    aria-label={showPassword ? 'Nascondi token' : 'Mostra token'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="h-4 w-4 text-emerald-600" aria-hidden />
                  <span>Cifratura in memoria con chiave Fernet primaria AWS SSM</span>
                </div>

                <Button
                  type="submit"
                  disabled={loadingSetup || !token.trim()}
                  className="h-11 rounded-xl bg-gradient-to-r from-[#FF7300] to-[#E66A00] px-6 text-xs font-extrabold tracking-wider text-white shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loadingSetup ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifica e Collegamento...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Salva e Collega CardTrader
                    </>
                  )}
                </Button>
              </div>

              {/* Feedback messages */}
              {linkError && (
                <div
                  role="alert"
                  className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-xs text-red-800 shadow-2xs"
                >
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <strong className="font-bold">Impossibile completare il collegamento: </strong>
                    <span>{linkError}</span>
                  </div>
                </div>
              )}

              {linkMessage && (
                <div
                  role="status"
                  className="mt-3 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-800 shadow-2xs"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                  <span>{linkMessage}</span>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Connected Controls: Suspend / Remove */}
        {!isDisconnected && (
          <div className="space-y-4 border-t border-gray-100 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Token memorizzato e protetto con crittografia end-to-end</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onSuspend}
                  disabled={loadingDisconnect}
                  className="h-9 rounded-xl border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  title={t('accountPage.syncSuspendTitle')}
                >
                  <PauseCircle className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                  {t('accountPage.syncSuspend')}
                </Button>

                {!confirmRemove ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmRemove(true)}
                    disabled={loadingDisconnect}
                    className="h-9 rounded-xl border-red-200 bg-red-50/50 text-xs font-semibold text-red-700 hover:bg-red-100/70"
                    title={t('accountPage.syncRemoveTitle')}
                  >
                    <Unlink className="mr-1.5 h-3.5 w-3.5" />
                    {t('accountPage.syncRemoveLink')}
                  </Button>
                ) : null}
              </div>
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
                    className="h-8 rounded-lg border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t('accountPage.syncCancel')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={loadingDisconnect}
                    onClick={() => void onRemove().then(() => setConfirmRemove(false))}
                    className="h-8 rounded-lg bg-red-600 text-xs font-bold text-white hover:bg-red-700"
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
