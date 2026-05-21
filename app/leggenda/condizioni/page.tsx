import type { Metadata } from 'next';
import { ConditionBadge } from '@/components/ui/ConditionBadge';
import type { ConditionCode } from '@/components/ui/ConditionBadge';

export const metadata: Metadata = {
  title: 'Guida alle Condizioni | Ebartex',
  description: 'Standard di grading per carte da gioco: NM, SP, MP, PL, PO',
};

interface ConditionDetail {
  code: ConditionCode;
  label: string;
  description: string;
  borders: string;
  surface: string;
  corners: string;
  playability: string;
  marketValue: string;
}

const CONDITIONS: ConditionDetail[] = [
  {
    code: 'NM',
    label: 'Near Mint',
    description:
      'Carta praticamente nuova. Nessun segno di usura visibile. Bordi netti, superficie lucida intatta, angoli perfetti. Accettata in tutte le transazioni senza riserve.',
    borders: 'Perfetti, netti',
    surface: 'Lucida, intatta',
    corners: 'Perfetti',
    playability: 'Ottima',
    marketValue: '100%',
  },
  {
    code: 'SP',
    label: 'Slightly Played',
    description:
      'Usura minima. Possibili micro-graffi superficiali o leggera opacità. Bordi quasi perfetti con rarissimi segni. Ottima per il gioco, accettata in quasi tutte le transazioni.',
    borders: 'Quasi perfetti',
    surface: 'Micro-graffi lievi',
    corners: 'Quasi perfetti',
    playability: 'Ottima',
    marketValue: '85–95%',
  },
  {
    code: 'MP',
    label: 'Moderately Played',
    description:
      'Usura moderata e visibile. Graffi, opacità diffusa, bordi con qualche segno. Ancora perfettamente giocabile ma con segni chiari di utilizzo.',
    borders: 'Qualche segno',
    surface: 'Opacità, graffi',
    corners: 'Lievi imperfezioni',
    playability: 'Buona',
    marketValue: '65–80%',
  },
  {
    code: 'PL',
    label: 'Played',
    description:
      'Usura significativa. Graffi profondi, bordi consumati, possibili pieghe lievi. Funzionale ma visibilmente usurata.',
    borders: 'Consumati',
    surface: 'Graffi profondi',
    corners: 'Arrotondati',
    playability: 'Sufficiente',
    marketValue: '40–60%',
  },
  {
    code: 'PO',
    label: 'Poor',
    description:
      'Condizione scadente. Danni severi: pieghe marcate, strappi, scritture, umidità. Accettata solo per uso personale o completismo di collezione.',
    borders: 'Danneggiati',
    surface: 'Pieghe, strappi',
    corners: 'Gravemente danneggiati',
    playability: 'Limitata',
    marketValue: '10–30%',
  },
];

const GRADING_TIPS = [
  {
    title: 'Luce diretta',
    body: 'Esamina la carta sotto una fonte di luce diretta e inclinala leggermente: i micro-graffi diventano visibili anche su carte NM.',
  },
  {
    title: 'Bordi e angoli',
    body: "Ispeziona i quattro angoli e i bordi su sfondo scuro. L'usura parte sempre dagli spigoli e si propaga verso il centro.",
  },
  {
    title: 'Superficie posteriore',
    body: 'Il retro è spesso più indicativo dello stato reale: graffi e opacità rivelano l\'uso anche quando il fronte appare integro.',
  },
  {
    title: 'Pieghe nascoste',
    body: 'Tieni la carta orizzontalmente e guardala di lato: anche piccole pieghe centrali diventano evidenti in controluce.',
  },
  {
    title: 'Consistenza',
    body: 'Valuta la flessibilità della carta: una NM è rigida e uniforme. Carta morbida o con zone più cedevoli indica umidità o usura.',
  },
];

export default function CondizioniPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100/80">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-20 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 to-transparent" />
        <div className="relative mx-auto max-w-2xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Ebartex · Standard di grading
          </p>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
            Guida alle Condizioni
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-gray-500">
            Cinque livelli di qualità chiari e universali, allineati agli standard internazionali
            di CardTrader e TCGPlayer. Usali per valutare, comprare e scambiare con trasparenza.
          </p>
        </div>
      </section>

      {/* Condition Cards Grid */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {CONDITIONS.map((c) => (
            <div
              key={c.code}
              id={c.code}
              className="scroll-mt-20 rounded-2xl border border-white/20 bg-white/60 p-5 shadow-sm backdrop-blur-md transition-shadow duration-200 hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-3">
                <ConditionBadge condition={c.code} size="lg" />
                <div>
                  <p className="text-xs font-bold text-gray-900">{c.label}</p>
                  <p className="text-[10px] text-gray-400">{c.code}</p>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed text-gray-600">{c.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparative Table */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">
          Tabella comparativa
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-white/20 bg-white/60 shadow-sm backdrop-blur-md">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                  Condizione
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                  Bordi
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                  Superficie
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                  Angoli
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                  Usabilità
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                  Valore relativo
                </th>
              </tr>
            </thead>
            <tbody>
              {CONDITIONS.map((c, i) => (
                <tr
                  key={c.code}
                  className={`border-b border-gray-50 last:border-0 ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ConditionBadge condition={c.code} size="sm" />
                      <span className="font-medium text-gray-700">{c.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.borders}</td>
                  <td className="px-4 py-3 text-gray-500">{c.surface}</td>
                  <td className="px-4 py-3 text-gray-500">{c.corners}</td>
                  <td className="px-4 py-3 text-gray-500">{c.playability}</td>
                  <td className="px-4 py-3 font-semibold text-gray-700">{c.marketValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grading Tips */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
          Come valutare una carta
        </h2>
        <p className="mb-8 text-sm text-gray-400">
          Cinque controlli pratici per assegnare una condizione precisa e onesta.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GRADING_TIPS.map((tip) => (
            <div
              key={tip.title}
              className="rounded-2xl border border-white/20 bg-white/60 p-5 shadow-sm backdrop-blur-md"
            >
              <p className="mb-1.5 text-sm font-bold text-gray-900">{tip.title}</p>
              <p className="text-sm leading-relaxed text-gray-500">{tip.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <footer className="border-t border-gray-100 bg-white/40 px-6 py-8 text-center backdrop-blur-sm">
        <p className="text-xs text-gray-400">
          Standard allineato a{' '}
          <span className="font-semibold text-gray-500">CardTrader</span>
          {' '}·{' '}
          <span className="font-semibold text-gray-500">TCGPlayer</span>
          {' '}— Ebartex adotta questi gradi per garantire coerenza e trasparenza in ogni transazione.
        </p>
      </footer>
    </main>
  );
}
