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
  const [showTokenForm, setShowTokenForm] = useState(isDisconnected);
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Lo stato arriva in modo asincrono: al primo accesso il pannello deve
  // aprirsi appena il backend conferma che non esiste ancora un collegamento.
  useEffect(() => {
    if (isDisconnected) setShowTokenForm(true);
  }, [isDisconnected]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-3 py-3 sm:px-5 sm:py-4">
        <h2 className="text-sm font-semibold text-gray-900">
          {t('accountPage.syncConnectionTitle')}
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          {t('accountPage.syncConnectionText')}
        </p>
      </div>

      <div className="space-y-4 p-3 sm:p-5">
        <div>
          <label htmlFor="sync-provider" className="mb-1.5 block text-xs font-medium text-gray-700">
            {t('accountPage.syncProviderLabel')}
          </label>
          <select
            id="sync-provider"
            value="cardtrader"
            onChange={() => undefined}
            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none focus:border-[#FF7300] focus:ring-2 focus:ring-[#FF7300]/20"
          >
            <option value="cardtrader">CardTrader</option>
            <option value="cardmarket" disabled>
              Cardmarket — {t('accountPage.syncProviderSoon')}
            </option>
          </select>
          <p className="mt-1.5 text-xs text-gray-500">
            {t('accountPage.syncProviderHelp')}
          </p>
        </div>

        {/* Token */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
          <button
            type="button"
            onClick={() => setShowTokenForm((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <KeyRound className="h-4 w-4 text-[#FF7300]" aria-hidden />
              {isDisconnected
                ? t('accountPage.syncConnectCardTrader')
                : t('accountPage.syncUpdateToken')}
            </span>
            {showTokenForm ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {showTokenForm && (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-gray-600">
                {t('accountPage.syncTokenSecurity')}
              </p>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-950">
                <p className="font-semibold">{t('accountPage.syncTokenGuideTitle')}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-orange-900">
                  <li>{t('accountPage.syncTokenGuideStep1')}</li>
                  <li>{t('accountPage.syncTokenGuideStep2')}</li>
                  <li>{t('accountPage.syncTokenGuideStep3')}</li>
                </ol>
                <a
                  href="https://www.cardtrader.com/en/docs/api/full/reference"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-[#D95F00] hover:underline"
                >
                  {t('accountPage.syncTokenGuideLink')}
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </div>
              <label htmlFor="cardtrader-api-token" className="sr-only">
                {t('accountPage.syncTokenLabel')}
              </label>
              <Input
                id="cardtrader-api-token"
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder={t('accountPage.syncTokenPlaceholder')}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="bg-white"
              />
              <Button
                type="button"
                disabled={loadingSetup || !token.trim()}
                onClick={() =>
                  void onLinkToken(token.trim()).then((linked) => {
                    if (linked) setToken('');
                  })
                }
                className="w-full bg-[#FF7300] font-semibold text-white hover:bg-[#e66a00] disabled:opacity-50"
              >
                {loadingSetup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('accountPage.syncSaveConnectAndImport')}
              </Button>
              {linkError && (
                <p
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {linkError}
                </p>
              )}
              {linkMessage && (
                <p
                  role="status"
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
                >
                  {linkMessage}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Revoke — only when connected */}
        {!isDisconnected && (
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {t('accountPage.syncAccountActions')}
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={loadingDisconnect}
              onClick={() => void onSuspend()}
                className="w-full justify-start border-amber-300 bg-white text-amber-800 hover:bg-amber-50"
            >
              {loadingDisconnect ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PauseCircle className="mr-2 h-4 w-4" />
              )}
              {t('accountPage.syncSuspend')}
            </Button>

            {!confirmRemove ? (
              <Button
                type="button"
                variant="outline"
                disabled={loadingDisconnect}
                onClick={() => setConfirmRemove(true)}
                className="w-full justify-start border-red-200 bg-white text-red-700 hover:bg-red-50"
              >
                <Unlink className="mr-2 h-4 w-4" />
                {t('accountPage.syncRemoveLink')}
              </Button>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="mb-3 flex gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
                  <p className="text-sm text-red-800">
                    {t('accountPage.syncRemoveConfirmText')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmRemove(false)}
                    className="flex-1 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    {t('accountPage.syncCancel')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={loadingDisconnect}
                    onClick={() => void onRemove().then(() => setConfirmRemove(false))}
                    className={cn('flex-1 bg-red-600 text-white hover:bg-red-700')}
                  >
                    {loadingDisconnect ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
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
