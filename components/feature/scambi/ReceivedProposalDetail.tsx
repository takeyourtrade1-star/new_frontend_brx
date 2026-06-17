'use client';

/**
 * Dettaglio di una proposta di scambio RICEVUTA (lato "venditore").
 * Mostra il "tavolo" (cosa mi chiede / cosa mi offre), l'inventario di chi ha
 * mandato la proposta e le 3 azioni: Accetta · Contro proposta · Rifiuta.
 */

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { formatEuroNoSpace } from '@/lib/utils';
import { getMockCardValueEur, tradeBalance } from '@/lib/scambi/card-mock-value';
import { setTradeProposalContext } from '@/lib/scambi/trade-proposal-context';
import type { ProposalCard, ReceivedProposal } from './mock-received-proposals';

function formatEuro(n: number): string {
  return formatEuroNoSpace(n, 'it-IT');
}

function cardValue(card: ProposalCard): number {
  return getMockCardValueEur(card.id);
}

function sumCards(cards: ProposalCard[]): number {
  return cards.reduce((s, c) => s + cardValue(c), 0);
}

/** Carta sul tavolo (sola lettura). */
function TileCard({ card }: { card: ProposalCard }) {
  return (
    <div className="w-16 shrink-0 sm:w-[4.5rem]">
      <div className="relative aspect-[200/280] w-full overflow-hidden rounded-lg bg-gray-200 ring-1 ring-black/10">
        <Image src={card.image} alt={card.name} fill unoptimized className="object-cover" sizes="72px" />
      </div>
      <p className="mt-0.5 truncate text-[9px] font-semibold leading-tight text-gray-700" title={card.name}>
        {card.name}
      </p>
      <p className="text-[10px] font-bold tabular-nums text-[#1D3160]">{formatEuro(cardValue(card))}</p>
    </div>
  );
}

function MoneyChip({ amount }: { amount: number }) {
  return (
    <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-[#FF7300]/50 bg-orange-50/60 py-2 sm:w-[4.5rem]">
      <span className="text-sm font-bold tabular-nums text-[#1D3160]">+{formatEuro(amount)}</span>
      <span className="text-[8px] font-semibold uppercase text-gray-500">crediti</span>
    </div>
  );
}

export function ReceivedProposalDetail({
  proposal,
  onBack,
}: {
  proposal: ReceivedProposal;
  onBack: () => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<'open' | 'accepted' | 'rejecting' | 'rejected'>('open');
  const [blockFuture, setBlockFuture] = useState(false);

  const requestedValue = sumCards(proposal.requestedCards) + proposal.requestedCredits;
  const offeredValue = sumCards(proposal.offeredCards) + proposal.offeredCredits;
  const balance = tradeBalance({ offeredValue, requestedValue, isPro: proposal.fromUser.isPro });

  const handleCounter = () => {
    const anchor = proposal.offeredCards[0] ?? proposal.requestedCards[0];
    setTradeProposalContext({
      mode: 'counter',
      seller: {
        name: proposal.fromUser.name,
        isPro: proposal.fromUser.isPro,
        country: proposal.fromUser.country,
      },
      card: {
        id: anchor.id,
        name: anchor.name,
        image: anchor.image,
        condition: anchor.condition,
        priceEur: cardValue(anchor),
        game: null,
      },
    });
    router.push('/scambi/proponi');
  };

  /* ---- Esiti ---- */

  if (status === 'accepted') {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-7 w-7 text-emerald-600" strokeWidth={3} />
        </div>
        <h2 className="text-lg font-bold text-[#1D3160]">Scambio accettato!</h2>
        <p className="max-w-sm text-sm text-gray-500">
          Hai accettato la proposta di <span className="font-bold">{proposal.fromUser.name}</span>. Ti contatteremo per
          finalizzare la spedizione.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-1 inline-flex h-10 items-center justify-center rounded-full bg-[#FF7300] px-5 text-sm font-semibold text-white transition hover:bg-[#e66800]"
        >
          Torna ai miei scambi
        </button>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <h2 className="text-lg font-bold text-[#1D3160]">Proposta rifiutata</h2>
        <p className="max-w-sm text-sm text-gray-500">
          Hai rifiutato la proposta di <span className="font-bold">{proposal.fromUser.name}</span>.
          {blockFuture && ' Non riceverai altre sue proposte per le prossime 24 ore.'}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-1 inline-flex h-10 items-center justify-center rounded-full bg-[#FF7300] px-5 text-sm font-semibold text-white transition hover:bg-[#e66800]"
        >
          Torna ai miei scambi
        </button>
      </div>
    );
  }

  /* ---- Vista principale ---- */

  return (
    <div>
      {/* Intestazione */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-[#1D3160]"
        >
          <ArrowLeft className="h-4 w-4" /> Tutte le richieste
        </button>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>da</span>
          <FlagIcon country={proposal.fromUser.country} size="xs" />
          <span className="font-bold text-[#1D3160]">{proposal.fromUser.name}</span>
          <span className="text-gray-300">·</span>
          <span className="font-medium">{proposal.fromUser.isPro ? 'Professionale' : 'Privato'}</span>
          <span className="text-gray-300">·</span>
          <span>{proposal.createdAtLabel}</span>
        </div>
      </div>

      {/* Azioni in cima */}
      {status === 'open' && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatus('accepted')}
            className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            Accetta
          </button>
          <button
            type="button"
            onClick={handleCounter}
            className="rounded-full bg-[#FF7300] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-[#e86800] active:scale-[0.98]"
          >
            Contro proposta
          </button>
          <button
            type="button"
            onClick={() => setStatus('rejecting')}
            className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-600 ring-1 ring-inset ring-gray-300 transition hover:text-red-600 hover:ring-red-300 active:scale-[0.98]"
          >
            Rifiuta scambio
          </button>
        </div>
      )}

      {status === 'rejecting' && (
        <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5">
          <p className="text-xs font-bold text-red-700">Vuoi davvero rifiutare questa proposta?</p>
          <label className="mt-1.5 flex items-center gap-2 text-[12px] text-gray-700">
            <input
              type="checkbox"
              checked={blockFuture}
              onChange={(e) => setBlockFuture(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-[#FF7300] accent-[#FF7300]"
            />
            Rifiuta altre proposte di scambio da {proposal.fromUser.name} per 24h
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatus('open')}
              className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-bold text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={() => setStatus('rejected')}
              className="rounded-full bg-red-600 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-red-700 active:scale-[0.98]"
            >
              Conferma rifiuto
            </button>
          </div>
        </div>
      )}

      {proposal.message && (
        <p className="mb-3 rounded-lg border-l-2 border-[#FF7300] bg-orange-50/60 px-3 py-2 text-[13px] italic text-gray-600">
          “{proposal.message}”
        </p>
      )}

      {/* TAVOLO */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Ti chiede */}
        <div className="px-3.5 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Ti chiede</span>
            <span className="text-sm font-black tabular-nums text-[#1D3160]">{formatEuro(requestedValue)}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {proposal.requestedCards.map((c) => (
              <TileCard key={c.id} card={c} />
            ))}
            {proposal.requestedCredits > 0 && <MoneyChip amount={proposal.requestedCredits} />}
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Ti offre */}
        <div className="px-3.5 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Ti offre</span>
            <span className="text-sm font-black tabular-nums text-[#1D3160]">{formatEuro(offeredValue)}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {proposal.offeredCards.map((c) => (
              <TileCard key={c.id} card={c} />
            ))}
            {proposal.offeredCredits > 0 && <MoneyChip amount={proposal.offeredCredits} />}
          </div>
        </div>
      </div>

      {/* Esito equità (informativo) */}
      <p className="mt-2 text-center text-xs text-gray-500">
        {balance.balanced
          ? 'Scambio equo ✓'
          : `Scarto del ${Math.round(balance.diffPct * 100)}% (max ${Math.round(balance.threshold * 100)}%)`}
      </p>

      {/* Inventario del mittente */}
      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
        <h3 className="mb-2 border-b border-gray-100 pb-1.5 text-[13px] font-bold uppercase tracking-tight text-[#1D3160]">
          Inventario di {proposal.fromUser.name}
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {proposal.senderInventory.map((c) => (
            <TileCard key={c.id} card={c} />
          ))}
        </div>
      </section>

    </div>
  );
}
