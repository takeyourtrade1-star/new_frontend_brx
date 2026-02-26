'use client';

import { Plus } from 'lucide-react';

const bullets = [
  'Sincronizza il tuo inventario in un click. Importazione automatica di stock e ristampe, senza configurazioni complesse.',
  'Stock e prezzi dal tuo account. Aggiornamento automatico e configurazione immediata per il tuo inventario.',
  'Le tue foto restano esattamente come sono. Sincronizziamo esclusivamente stock e listini, così i tuoi contenuti multimediali rimangono personalizzati e protetti.',
  'Pieno controllo sui tuoi accessi. Puoi revocare token e webhook in qualsiasi momento, direttamente da questa pagina.',
] as const;

export function SimpleSecureTuoSection() {
  return (
    <section className="flex flex-col rounded-2xl p-6 md:p-8 text-white">
      <h2 className="text-xl font-bold uppercase tracking-wide md:text-2xl mb-6">
        SEMPLICE. SICURO. TUO.
      </h2>
      <ul className="space-y-4">
        {bullets.map((text, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5"
              style={{ backgroundColor: '#FF7300' }}
              aria-hidden
            >
              <Plus className="h-3.5 w-3.5 text-white" strokeWidth={3} />
            </span>
            <span className="text-sm leading-relaxed text-white/95 md:text-base">
              {text}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
