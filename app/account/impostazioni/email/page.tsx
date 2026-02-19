'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useState } from 'react';

const EMAIL_SECTIONS: {
  title: string;
  items: { label: string; defaultOn: boolean }[];
}[] = [
  {
    title: 'NOTIFICHE OPERATIVE STANDARD',
    items: [
      {
        label:
          'Conferme di Stato Avanzamento (Venduto, Pagato, Spedito, Arrivato)',
        defaultOn: true,
      },
      {
        label: 'Comunicazioni di Cortesia (Ringraziamenti automatici)',
        defaultOn: false,
      },
    ],
  },
  {
    title: 'GESTIONE ANNULLAMENTI & SCADENZE',
    items: [
      {
        label: 'Cancellazioni Ordine (Annullamenti manuali o da sistema)',
        defaultOn: false,
      },
      {
        label:
          'Criticità Temporali (Timeout per mancato pagamento o spedizione)',
        defaultOn: true,
      },
    ],
  },
  {
    title: 'RISOLUZIONE CONTROVERSIE LOGISTICHE',
    items: [
      {
        label: 'Segnalazioni Mancato Recapito (Merce non arrivata)',
        defaultOn: false,
      },
      {
        label: 'Gestione Investigazioni (Apertura procedure di reclamo)',
        defaultOn: true,
      },
    ],
  },
  {
    title: 'RETTIFICHE & MOVIMENTI FINANZIARI',
    items: [
      {
        label:
          'Ciclo di Vita Rimborsi (Richieste, Accettazioni, Rifiuti, Storni)',
        defaultOn: false,
      },
      {
        label:
          'Gestione Pagamenti Integrativi (Richieste extra per spedizioni o errori)',
        defaultOn: true,
      },
    ],
  },
];

function EmailToggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      onClick={onChange}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-[#0f172a] transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/50"
      aria-checked={on}
      aria-label={on ? 'Attivo' : 'Disattivo'}
    >
      <span
        className={`inline-block h-5 w-5 translate-y-0 rounded-full border-[3px] border-gray-900 shadow-sm transition-transform ${
          on
            ? 'translate-x-6 bg-white border-white'
            : 'translate-x-0.5 bg-[#254195]'
        }`}
        aria-hidden
      />
    </button>
  );
}

export default function ImpostazioniEmailPage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    EMAIL_SECTIONS.forEach((sec, si) =>
      sec.items.forEach((item, ii) => {
        state[`${si}-${ii}`] = item.defaultOn;
      })
    );
    return state;
  });

  const setToggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="font-sans text-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav
          className="flex items-center gap-2 text-lg text-white/90"
          aria-label="Breadcrumb"
        >
          <Link href="/account" className="hover:text-white" aria-label="Account">
            <Home className="h-5 w-5" />
          </Link>
          <span className="text-white/60">/</span>
          <Link href="/account/impostazioni" className="hover:text-white">
            ACCOUNT
          </Link>
          <span className="text-white/60">/</span>
          <Link href="/account/impostazioni" className="hover:text-white">
            IMPOSTAZIONI
          </Link>
          <span className="text-white/60">/</span>
          <span className="text-white">EMAIL</span>
        </nav>
        <p className="ml-auto text-sm font-medium uppercase text-white/90">
          HAI BISOGNO DI AIUTO?
        </p>
      </div>

      <p className="mb-10 max-w-3xl text-lg leading-relaxed text-white/90">
        Di seguito sono elencate le email automatiche inviate dal sistema,
        raggruppate per argomento. Puoi disattivarle singolarmente. Ti
        consigliamo di fare attenzione a non disattivare email importanti:
        l&apos;accesso quotidiano a Cardmarket potrebbe essere collegato alla
        ricezione di alcune email e la disattivazione irresponsabile potrebbe
        comportare la sospensione dell&apos;account.
      </p>

      <div className="space-y-10">
        {EMAIL_SECTIONS.map((section, si) => (
          <section key={si}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold uppercase tracking-wide text-white">
                {section.title}
              </h2>
            </div>
            <ul className="space-y-4">
              {section.items.map((item, ii) => {
                const key = `${si}-${ii}`;
                const on = toggles[key] ?? item.defaultOn;
                return (
                  <li
                    key={ii}
                    className="flex items-center justify-between gap-6"
                  >
                    <span className="text-lg leading-relaxed text-white/90">
                      • {item.label}
                    </span>
                    <EmailToggle
                      on={on}
                      onChange={() => setToggle(key)}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
