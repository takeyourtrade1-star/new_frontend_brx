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
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanToken = token.trim();
    if (!cleanToken || loadingSetup) return;
    const linked = await onLinkToken(cleanToken);
    if (linked) {
      setToken('');
    }
  };

  return (
    <section className="border border-[#1D3160]/10 bg-white shadow-2xs">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1D3160]/10 px-5 py-5 sm:px-7">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#FF7300]">
            Token API CardTrader
          </p>
          <h2 className="mt-1 font-display text-xl uppercase tracking-[0.06em] text-[#1D3160]">
            {isDisconnected ? 'Collega CardTrader' : 'Account CardTrader Collegato'}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-[#1D3160]/60">
            {isDisconnected
              ? 'Inserisci il tuo token JWT Full Access per collegare e sincronizzare automaticamente il catalogo Magic.'
              : 'Token cifrato AES-256 attivo. Puoi aggiornare o rimuovere il token in qualsiasi momento.'}
          </p>
        </div>
      </header>

      <div className="px-5 py-6 sm:px-7">
        <div className="hidden">
          <label htmlFor="sync-provider">{t('accountPage.syncProviderLabel')}</label>
          <input id="sync-provider" value="cardtrader" readOnly />
        </div>

        {/* IN ALTO: Campo Inserimento Token con Bottoni Accanto */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label
            htmlFor="cardtrader-api-token"
            className="block text-[10px] font-medium uppercase tracking-[0.18em] text-[#1D3160]/60"
          >
            {t('accountPage.syncTokenLabel')}
          </label>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Input Token con toggle visualizzazione */}
            <div className="relative min-w-0 flex-1">
              <Input
                id="cardtrader-api-token"
                type={showPassword ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                placeholder={
                  isDisconnected
                    ? t('accountPage.syncTokenPlaceholder')
                    : 'Incolla un nuovo token JWT per aggiornare…'
                }
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

            {/* Bottoni Azione Accanto */}
            <div className="flex shrink-0 items-center gap-2">
              {isDisconnected ? (
                /* Disconnesso: Bottone AGGIUNGI */
                <Button
                  type="submit"
                  disabled={loadingSetup || !token.trim()}
                  className="h-12 rounded-none bg-[#FF7300] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#E66A00] disabled:opacity-50"
                >
                  {loadingSetup ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifica…
                    </>
                  ) : (
                    'Aggiungi'
                  )}
                </Button>
              ) : (
                /* Connesso: Bottoni AGGIORNA e RIMUOVI */
                <>
                  <Button
                    type="submit"
                    disabled={loadingSetup || !token.trim()}
                    className="h-12 rounded-none bg-[#1D3160] px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#29457f] disabled:opacity-40"
                  >
                    {loadingSetup ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvataggio…
                      </>
                    ) : (
                      'Aggiorna'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={loadingDisconnect}
                    onClick={() => setConfirmRemove(true)}
                    className="h-12 rounded-none border-red-200 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-red-700 hover:bg-red-50 hover:text-red-800 disabled:opacity-40"
                  >
                    Rimuovi
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    disabled={loadingDisconnect}
                    onClick={onSuspend}
                    title={t('accountPage.syncSuspendTitle')}
                    className="h-12 rounded-none px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#1D3160]/70 hover:bg-[#1D3160]/5 hover:text-[#1D3160] disabled:opacity-40"
                  >
                    {t('accountPage.syncSuspend')}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <p className="text-xs text-[#1D3160]/45">{t('accountPage.syncTokenSecurity')}</p>
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

          {confirmRemove && (
            <div className="mt-3 border-l-2 border-red-700 bg-red-50/50 p-4">
              <p className="text-sm font-medium text-[#1D3160]">{t('accountPage.syncRemoveConfirmText')}</p>
              <div className="mt-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setConfirmRemove(false)}
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1D3160]/60 hover:text-[#1D3160]"
                >
                  {t('accountPage.syncCancel')}
                </button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={loadingDisconnect}
                  onClick={() => void onRemove().then(() => setConfirmRemove(false))}
                  className="h-9 rounded-none text-xs font-semibold uppercase tracking-[0.12em]"
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
        </form>

        {/* Guida 3 Passaggi Sotto */}
        <div className="mt-8 border-t border-[#1D3160]/10 pt-6">
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
        </div>
      </div>
    </section>
  );
}
