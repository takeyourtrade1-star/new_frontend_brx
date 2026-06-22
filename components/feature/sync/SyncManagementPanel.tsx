'use client';

import { useState } from 'react';
import {
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

export function SyncManagementPanel({
  isDisconnected,
  loadingSetup,
  loadingDisconnect,
  onLinkToken,
  onSuspend,
  onRemove,
}: {
  isDisconnected: boolean;
  loadingSetup: boolean;
  loadingDisconnect: boolean;
  onLinkToken: (token: string) => Promise<void>;
  onSuspend: () => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [token, setToken] = useState('');
  const [showTokenForm, setShowTokenForm] = useState(isDisconnected);
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-3 py-3 sm:px-5 sm:py-4">
        <h2 className="text-sm font-semibold text-gray-900">Gestione integrazione</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Collega, aggiorna o revoca l’accesso a CardTrader
        </p>
      </div>

      <div className="space-y-4 p-3 sm:p-5">
        {/* Token */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
          <button
            type="button"
            onClick={() => setShowTokenForm((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <KeyRound className="h-4 w-4 text-[#FF7300]" aria-hidden />
              {isDisconnected ? 'Collega CardTrader' : 'Aggiorna token API'}
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
                Il token viene cifrato e usato solo per sincronizzare il tuo inventario Magic.
              </p>
              <Input
                type="password"
                placeholder="Incolla il token API CardTrader"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="bg-white"
              />
              <Button
                type="button"
                disabled={loadingSetup || !token.trim()}
                onClick={() => void onLinkToken(token.trim()).then(() => setToken(''))}
                className="w-full bg-[#FF7300] font-semibold text-white hover:bg-[#e66a00] disabled:opacity-50"
              >
                {loadingSetup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salva e collega
              </Button>
            </div>
          )}
        </div>

        {/* Revoke — only when connected */}
        {!isDisconnected && (
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Azioni account
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
              Sospendi sincronizzazione
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
                Rimuovi collegamento
              </Button>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="mb-3 flex gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
                  <p className="text-sm text-red-800">
                    Il token e il webhook verranno rimossi. Le carte restano su CardTrader. Vuoi
                    continuare?
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
                    Annulla
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
                      'Conferma rimozione'
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
