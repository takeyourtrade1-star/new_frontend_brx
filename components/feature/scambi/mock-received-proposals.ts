/**
 * Proposte di scambio ricevute (mock) — quelle che vedo come "venditore"
 * dentro "I miei scambi" → RICHIESTE IN ATTESA.
 *
 * `requestedCards` = ciò che l'altro utente chiede a ME.
 * `offeredCards`   = ciò che l'altro utente offre a me.
 */

import { MOCK_INVENTORY_A, MOCK_INVENTORY_B } from './mock-trade-inventories';

export interface ProposalCard {
  id: string;
  name: string;
  image: string;
  condition: string;
}

export interface ReceivedProposal {
  id: string;
  fromUser: { name: string; isPro: boolean; country: string };
  createdAtLabel: string;
  message?: string;
  /** Cosa mi offre l'altro utente. */
  offeredCards: ProposalCard[];
  offeredCredits: number;
  /** Cosa mi chiede l'altro utente. */
  requestedCards: ProposalCard[];
  requestedCredits: number;
  /** Inventario completo di chi ha mandato la proposta. */
  senderInventory: ProposalCard[];
}

export const MOCK_RECEIVED_PROPOSALS: ReceivedProposal[] = [
  {
    id: 'rp-1',
    fromUser: { name: 'Marco_TCG', isPro: false, country: 'IT' },
    createdAtLabel: '2 ore fa',
    message: 'Ciao! Mi interessa molto la tua Black Lotus, queste due ti vanno?',
    offeredCards: [MOCK_INVENTORY_B[1], MOCK_INVENTORY_B[6]],
    offeredCredits: 0,
    requestedCards: [MOCK_INVENTORY_A[1]],
    requestedCredits: 0,
    senderInventory: MOCK_INVENTORY_B,
  },
  {
    id: 'rp-2',
    fromUser: { name: 'CardKingDE', isPro: true, country: 'DE' },
    createdAtLabel: 'ieri',
    message: 'Posso aggiungere dei crediti se serve per pareggiare.',
    offeredCards: [MOCK_INVENTORY_B[7], MOCK_INVENTORY_B[9]],
    offeredCredits: 20,
    requestedCards: [MOCK_INVENTORY_A[2], MOCK_INVENTORY_A[7]],
    requestedCredits: 0,
    senderInventory: MOCK_INVENTORY_B,
  },
];
