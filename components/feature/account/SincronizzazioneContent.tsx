'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  RefreshCw,
  Tag,
  ImageIcon,
  AlertCircle,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const WEBHOOK_URL_PLACEHOLDER = 'https://api.ebartex.it/webhooks/cardtrader/...';
const TERMS_LINK = '#';

function Breadcrumb() {
  return (
    <nav
      className="mb-6 flex items-center gap-2 text-sm text-white/90"
      aria-label="Breadcrumb"
    >
      <Link href="/account" className="hover:text-white" aria-label="Account">
        <Home className="h-4 w-4" />
      </Link>
      <span className="text-white/60">/</span>
      <span>ACCOUNT</span>
      <span className="text-white/60">/</span>
      <span className="text-white">SINCRONIZZAZIONE</span>
    </nav>
  );
}

function TermsLink() {
  return (
    <Link
      href={TERMS_LINK}
      className="inline-block text-sm font-medium text-[#FF7300] underline hover:opacity-90"
    >
      Leggi i Termini e Condizioni di Sincronizzazione
    </Link>
  );
}

function WarningBar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-4 py-3"
      style={{ backgroundColor: 'rgba(255, 115, 0, 0.2)' }}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
        <AlertCircle className="h-4 w-4 text-[#FF7300]" aria-hidden />
      </span>
      <p className="text-sm font-medium text-white">{children}</p>
    </div>
  );
}

function ComeFunzionaSection() {
  const points = [
    {
      icon: RefreshCw,
      text: 'Stock e prezzi compatibili vengono sincronizzati in automatico.',
    },
    {
      icon: Tag,
      text: "Le carte non presenti su CardTrader rimangono un'esclusiva di Ebartex.",
    },
    {
      icon: ImageIcon,
      text: 'Le immagini restano sul tuo account: decidi tu se aggiornarle.',
    },
  ];
  return (
    <section className="mt-10">
      <h2 className="mb-6 text-lg font-bold uppercase tracking-wide text-white">
        Come funziona la sincronizzazione?
      </h2>
      <ul className="space-y-4">
        {points.map(({ icon: Icon, text }, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/20">
              <Icon className="h-3.5 w-3.5 text-white" aria-hidden />
            </span>
            <span className="text-sm text-white/90">{text}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-white/80">
        Pieno controllo sui tuoi accessi. Puoi revocare token e webhook in
        qualsiasi momento, direttamente da questa pagina.
      </p>
    </section>
  );
}

export function SincronizzazioneContent() {
  const [isSyncActive, setIsSyncActive] = useState(false);
  const [jwtToken, setJwtToken] = useState('');
  const [webhookUrl] = useState(WEBHOOK_URL_PLACEHOLDER);

  const handleConfermaToken = () => {
    if (jwtToken.trim()) setIsSyncActive(true);
  };

  const handleAvviaSincronizzazione = () => {
    setIsSyncActive(true);
  };

  const handleRimuoviSincronizzazione = () => {
    setIsSyncActive(false);
    setJwtToken('');
  };

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
    } catch {
      // fallback ignored
    }
  };

  return (
    <div className="text-white">
      <Breadcrumb />

      {!isSyncActive ? (
        <>
          {/* Stato: da attivare */}
          <h1 className="mb-2 mt-8 text-2xl font-bold uppercase tracking-wide text-white">
            Sincronizzazione
          </h1>
          <TermsLink />

          <section className="mt-8">
            <h2 className="mb-2 text-lg font-bold uppercase tracking-wide text-white">
              Configura la sincronizzazione in pochi passi
            </h2>
            <p className="mb-6 max-w-2xl text-sm text-white/90">
              Collega il tuo account CardTrader per importare automaticamente
              stock e ristampe supportate. Poche informazioni, nessuna
              configurazione complessa.
            </p>

            <div className="grid gap-6 md:grid-cols-3">
              {/* JWT Token */}
              <div className="rounded-xl bg-white/10 p-5">
                <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-white">
                  JWT Token CardTrader
                </label>
                <Input
                  placeholder="Incolla il token generato da CardTrader"
                  value={jwtToken}
                  onChange={(e) => setJwtToken(e.target.value)}
                  className="mb-3 border-white/20 bg-white/10 text-white placeholder:text-white/50"
                />
                <Button
                  type="button"
                  onClick={handleConfermaToken}
                  className="w-full rounded-lg font-semibold uppercase text-white"
                  style={{ backgroundColor: '#FF7300' }}
                >
                  Conferma
                </Button>
                <p className="mt-3 text-xs text-white/60">
                  Recuperalo da CardTrader &gt; Developer &gt; API Tokens.
                </p>
              </div>

              {/* Webhook Ebartex */}
              <div className="rounded-xl bg-white/10 p-5">
                <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-white">
                  Webhook Ebartex
                </label>
                <div
                  className={cn(
                    'mb-3 min-h-10 w-full rounded-md border px-3 py-2 text-sm',
                    'border-white/20 bg-white/10 text-white/90'
                  )}
                >
                  {webhookUrl}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyWebhook}
                  className="w-full rounded-lg border-white/30 font-semibold uppercase text-white hover:bg-white/10"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copia
                </Button>
                <p className="mt-3 text-xs text-white/60">
                  Incollalo su CardTrader &gt; Developer &gt; Webhooks per gli
                  aggiornamenti automatici.
                </p>
              </div>

              {/* Avvia sincronizzazione */}
              <div className="rounded-xl bg-white/10 p-5">
                <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-white">
                  Avvia
                </label>
                <Button
                  type="button"
                  onClick={handleAvviaSincronizzazione}
                  className="mb-3 w-full rounded-lg py-6 font-semibold uppercase text-white"
                  style={{ backgroundColor: '#FF7300' }}
                >
                  Avvia sincronizzazione
                </Button>
                <p className="text-xs text-white/70">
                  Cliccando AVVIA SINCRONIZZAZIONE hai letto ed accettato i nostri
                  Termini e Condizioni di Sincronizzazione.
                </p>
              </div>
            </div>
          </section>

          <div className="mt-6">
            <WarningBar>
              Non revocare il token dal portale CardTrader mentre la
              sincronizzazione è attiva: bloccherebbe l&apos;aggiornamento
              automatico.
            </WarningBar>
          </div>
        </>
      ) : (
        <>
          {/* Stato: attiva */}
          <h1
            className="mb-2 mt-8 text-2xl font-bold uppercase tracking-wide"
            style={{ color: '#93C5FD' }}
          >
            Il tuo account è sincronizzato
          </h1>
          <TermsLink />

          <div className="mt-8 flex flex-wrap items-stretch gap-4">
            {/* Box 1: Stato ONLINE */}
            <div
              className="min-w-[200px] flex-1 rounded-xl p-5"
              style={{ backgroundColor: 'rgba(147, 197, 253, 0.2)' }}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                Stato
              </p>
              <p className="text-lg font-bold text-white">ONLINE</p>
              <p className="mt-2 text-sm text-white/80">
                Ultimo evento ricevuto: 2 ore fa
              </p>
            </div>

            <span className="flex items-center text-white/50" aria-hidden>
              <ChevronRight className="h-6 w-6" />
            </span>

            {/* Box 2: Webhook collegato */}
            <div
              className="min-w-[200px] flex-1 rounded-xl p-5"
              style={{
                background:
                  'linear-gradient(135deg, rgba(147, 197, 253, 0.25), rgba(196, 181, 253, 0.25))',
              }}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                Webhook collegato
              </p>
              <p className="break-all text-sm text-white/90">
                {webhookUrl}
              </p>
            </div>

            <span className="flex items-center text-white/50" aria-hidden>
              <ChevronRight className="h-6 w-6" />
            </span>

            {/* Box 3: Token CardTrader */}
            <div
              className="min-w-[200px] flex-1 rounded-xl p-5"
              style={{ backgroundColor: 'rgba(147, 197, 253, 0.2)' }}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                Token CardTrader
              </p>
              <p className="font-semibold text-white">Non disponibile</p>
              <p className="mt-1 text-sm text-white/80">
                Rigenerabile solo da CardTrader
              </p>
              <p className="mt-2 text-xs text-white/60">
                Recuperalo da CardTrader &gt; Developer &gt; API Tokens.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleRimuoviSincronizzazione}
              className="shrink-0 self-center rounded-lg border-2 border-red-500 bg-black/80 px-6 py-3 font-semibold uppercase text-white hover:bg-black/90 hover:border-red-600"
            >
              Rimuovi sincronizzazione
            </Button>
          </div>

          <div className="mt-6">
            <WarningBar>
              Se devi rigenerare il token, disattiva prima la sincronizzazione
              da qui per eliminare token e webhook in modo sicuro.
            </WarningBar>
          </div>
        </>
      )}

      <ComeFunzionaSection />
    </div>
  );
}
