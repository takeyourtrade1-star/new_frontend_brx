'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <section className="border border-[#1D3160]/10 bg-white">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1D3160]/10 px-5 py-5 sm:px-7">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#FF7300]">
            Collegamento
          </p>
          <h2 className="mt-1 font-display text-xl uppercase tracking-[0.06em] text-[#1D3160]">
            {isDisconnected ? 'Collega CardTrader' : 'Account collegato'}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-[#1D3160]/60">
            {isDisconnected
              ? 'Importa il catalogo Magic e tieni allineate le scorte, senza overselling.'
              : 'Token cifrato. Le vendite restano allineate finché il collegamento è attivo.'}
          </p>
        </div>

        {!isDisconnected && (
          <button
            type="button"
            onClick={() => setShowTokenForm((prev) => !prev)}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D3160] underline-offset-4 hover:underline"
          >
            {showTokenForm ? 'Chiudi' : t('accountPage.syncUpdateToken')}
          </button>
        )}
      </header>

      <div className="px-5 py-6 sm:px-7">
        {showTokenForm && (
          <div className="space-y-8">
            <div className="hidden">
              <label htmlFor="sync-provider">{t('accountPage.syncProviderLabel')}</label>
              <input id="sync-provider" value="cardtrader" readOnly />
            </div>

            <ol className="grid gap-0 sm:grid-cols-3">
              <li className="border-b border-[#1D3160]/10 py-4 sm:border-b-0 sm:border-r sm:pr-6">
                <p className="font-display text-2xl tabular-nums text-[#1D3160]/20">01</p>
                <p className="mt-2 text-sm font-semibold text-[#1D3160]">Accedi a CardTrader</p>
                <p className="mt-1 text-sm leading-relaxed text-[#1D3160]/60">
                  Apri <span className="text-[#1D3160]">App &amp; API Tokens</span> nel tuo account.
                </p>
                <a
                  href="https://www.cardtrader.com/apps/full"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs font-semibold uppercase tracking-[0.12em] text-[#FF7300] underline-offset-4 hover:underline"
                >
                  Apri pagina token
                </a>
              </li>
              <li className="border-b border-[#1D3160]/10 py-4 sm:border-b-0 sm:border-r sm:px-6">
                <p className="font-display text-2xl tabular-nums text-[#1D3160]/20">02</p>
                <p className="mt-2 text-sm font-semibold text-[#1D3160]">Crea un token completo</p>
                <p className="mt-1 text-sm leading-relaxed text-[#1D3160]/60">
                  Full Access JWT, lettura e scrittura sul catalogo. Nessuna scadenza richiesta.
                </p>
              </li>
              <li className="py-4 sm:pl-6">
                <p className="font-display text-2xl tabular-nums text-[#1D3160]/20">03</p>
                <p className="mt-2 text-sm font-semibold text-[#1D3160]">Incolla e collega</p>
                <p className="mt-1 text-sm leading-relaxed text-[#1D3160]/60">
                  Il token viene cifrato e usato solo per sincronizzare Magic.
                </p>
                <a
                  href="https://www.cardtrader.com/en/docs/api/full/reference"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs font-semibold uppercase tracking-[0.12em] text-[#FF7300] underline-offset-4 hover:underline"
                >
                  {t('accountPage.syncTokenGuideLink')}
                </a>
              </li>
            </ol>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="cardtrader-api-token"
                  className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-[#1D3160]/55"
                >
                  {t('accountPage.syncTokenLabel')}
                </label>
                <div className="relative">
                  <Input
                    id="cardtrader-api-token"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={t('accountPage.syncTokenPlaceholder')}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="h-12 rounded-none border-[#1D3160]/20 bg-[#F5F4F0] pr-12 font-mono text-sm text-[#1D3160] shadow-none focus-visible:border-[#FF7300] focus-visible:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1D3160]/40 hover:text-[#1D3160]"
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

              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-[#1D3160]/45">{t('accountPage.syncTokenSecurity')}</p>
                <Button
                  type="submit"
                  disabled={loadingSetup || !token.trim()}
                  className="h-11 rounded-none bg-[#FF7300] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#E66A00]"
                >
                  {loadingSetup ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifica…
                    </>
                  ) : (
                    t('accountPage.syncSaveConnect')
                  )}
                </Button>
              </div>

              {linkError && (
                <p role="alert" className="border-l-2 border-red-700 pl-3 text-sm text-red-800">
                  {linkError}
                </p>
              )}

              {linkMessage && (
                <p role="status" className="border-l-2 border-[#1D3160] pl-3 text-sm text-[#1D3160]">
                  {linkMessage}
                </p>
              )}
            </form>
          </div>
        )}

        {!isDisconnected && (
          <div className={showTokenForm ? 'mt-8 border-t border-[#1D3160]/10 pt-5' : ''}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-[#1D3160]/45">
                Token memorizzato. Puoi sospendere o scollegare in qualsiasi momento.
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <button
                  type="button"
                  onClick={onSuspend}
                  disabled={loadingDisconnect}
                  title={t('accountPage.syncSuspendTitle')}
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1D3160]/70 underline-offset-4 hover:text-[#1D3160] hover:underline disabled:opacity-40"
                >
                  {t('accountPage.syncSuspend')}
                </button>
                {!confirmRemove ? (
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(true)}
                    disabled={loadingDisconnect}
                    title={t('accountPage.syncRemoveTitle')}
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-red-700 underline-offset-4 hover:underline disabled:opacity-40"
                  >
                    {t('accountPage.syncRemoveLink')}
                  </button>
                ) : null}
              </div>
            </div>

            {confirmRemove && (
              <div className="mt-5 border-l-2 border-red-700 pl-4">
                <p className="text-sm text-[#1D3160]">{t('accountPage.syncRemoveConfirmText')}</p>
                <div className="mt-3 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(false)}
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1D3160]/60 hover:text-[#1D3160]"
                  >
                    {t('accountPage.syncCancel')}
                  </button>
                  <button
                    type="button"
                    disabled={loadingDisconnect}
                    onClick={() => void onRemove().then(() => setConfirmRemove(false))}
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-red-700 hover:underline"
                  >
                    {loadingDisconnect ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      t('accountPage.syncConfirmRemove')
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
