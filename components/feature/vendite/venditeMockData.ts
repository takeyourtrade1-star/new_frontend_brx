export type VenditaStato = 'in-attesa-pagamento' | 'da-spedire' | 'spedito' | 'completato';

export type VenditaMock = {
  id: string;
  orderId: string;
  itemName: string;
  setName: string;
  condition: string;
  language: string;
  price: number;
  soldAt: string;
  buyerUsername: string;
  stato: VenditaStato;
  trackingCode?: string;
  channel: 'marketplace' | 'asta';
};

export type VenditaTabId = VenditaStato | 'tutte';

export const VENDITA_TAB_META: {
  id: VenditaTabId;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: 'tutte',
    label: 'Tutte',
    shortLabel: 'Tutte',
    description: 'Panoramica di tutte le vendite dimostrative nel mockup.',
  },
  {
    id: 'in-attesa-pagamento',
    label: 'In attesa di pagamento',
    shortLabel: 'In attesa',
    description: 'L’acquirente deve ancora completare il pagamento entro la scadenza indicata.',
  },
  {
    id: 'da-spedire',
    label: 'Da spedire',
    shortLabel: 'Da spedire',
    description: 'Pagamento ricevuto: prepara il pacco e genera l’etichetta di spedizione.',
  },
  {
    id: 'spedito',
    label: 'Spedito',
    shortLabel: 'Spedito',
    description: 'Il pacco è in transito verso l’acquirente.',
  },
  {
    id: 'completato',
    label: 'Completato',
    shortLabel: 'Completato',
    description: 'Vendita chiusa con successo; l’incasso è disponibile nel riepilogo.',
  },
];

export const MOCK_VENDITE: VenditaMock[] = [
  {
    id: 'vnd-001',
    orderId: 'EBX-2026-04821',
    itemName: 'Charizard ex — Obsidian Flames',
    setName: 'Obsidian Flames · 223/197',
    condition: 'Near Mint',
    language: 'IT',
    price: 189,
    soldAt: '2026-05-27T09:14:00.000Z',
    buyerUsername: 'luca_collezionista',
    stato: 'in-attesa-pagamento',
    channel: 'marketplace',
  },
  {
    id: 'vnd-002',
    orderId: 'EBX-2026-04815',
    itemName: 'Black Lotus — Unlimited',
    setName: 'Unlimited Edition',
    condition: 'Played',
    language: 'EN',
    price: 12400,
    soldAt: '2026-05-26T18:42:00.000Z',
    buyerUsername: 'mtg_vault_roma',
    stato: 'in-attesa-pagamento',
    channel: 'asta',
  },
  {
    id: 'vnd-003',
    orderId: 'EBX-2026-04798',
    itemName: 'Pikachu Illustrator — Promo',
    setName: 'Promo giapponese 1998',
    condition: 'Lightly Played',
    language: 'JP',
    price: 8750,
    soldAt: '2026-05-26T11:05:00.000Z',
    buyerUsername: 'yuki_tcg',
    stato: 'in-attesa-pagamento',
    channel: 'asta',
  },
  {
    id: 'vnd-004',
    orderId: 'EBX-2026-04772',
    itemName: 'Lugia V — Silver Tempest',
    setName: 'Silver Tempest · 186/195',
    condition: 'Near Mint',
    language: 'EN',
    price: 42.5,
    soldAt: '2026-05-25T16:28:00.000Z',
    buyerUsername: 'poke_milano_22',
    stato: 'da-spedire',
    channel: 'marketplace',
  },
  {
    id: 'vnd-005',
    orderId: 'EBX-2026-04761',
    itemName: 'Underground Sea — Revised',
    setName: 'Revised Edition',
    condition: 'Moderately Played',
    language: 'EN',
    price: 520,
    soldAt: '2026-05-25T10:11:00.000Z',
    buyerUsername: 'dual_land_hunter',
    stato: 'da-spedire',
    channel: 'marketplace',
  },
  {
    id: 'vnd-006',
    orderId: 'EBX-2026-04744',
    itemName: 'Mew ex — 151',
    setName: 'Scarlet & Violet 151 · 193/165',
    condition: 'Near Mint',
    language: 'IT',
    price: 78,
    soldAt: '2026-05-24T20:55:00.000Z',
    buyerUsername: 'sara_cards',
    stato: 'da-spedire',
    channel: 'marketplace',
  },
  {
    id: 'vnd-007',
    orderId: 'EBX-2026-04710',
    itemName: 'Force of Will — Alliances',
    setName: 'Alliances',
    condition: 'Near Mint',
    language: 'EN',
    price: 95,
    soldAt: '2026-05-23T14:02:00.000Z',
    buyerUsername: 'legacy_player_87',
    stato: 'spedito',
    trackingCode: 'IT9283746512345678',
    channel: 'marketplace',
  },
  {
    id: 'vnd-008',
    orderId: 'EBX-2026-04688',
    itemName: 'Umbreon VMAX — Evolving Skies',
    setName: 'Evolving Skies · 215/203',
    condition: 'Near Mint',
    language: 'DE',
    price: 310,
    soldAt: '2026-05-22T09:37:00.000Z',
    buyerUsername: 'night_fox_tcg',
    stato: 'spedito',
    trackingCode: 'IT9283746512345601',
    channel: 'asta',
  },
  {
    id: 'vnd-009',
    orderId: 'EBX-2026-04655',
    itemName: 'Snapcaster Mage — Innistrad',
    setName: 'Innistrad',
    condition: 'Near Mint',
    language: 'EN',
    price: 28,
    soldAt: '2026-05-21T17:20:00.000Z',
    buyerUsername: 'modern_mage_it',
    stato: 'spedito',
    trackingCode: 'IT9283746512345590',
    channel: 'marketplace',
  },
  {
    id: 'vnd-010',
    orderId: 'EBX-2026-04612',
    itemName: 'Rayquaza VMAX — Evolving Skies',
    setName: 'Evolving Skies · 217/203',
    condition: 'Near Mint',
    language: 'EN',
    price: 145,
    soldAt: '2026-05-20T12:48:00.000Z',
    buyerUsername: 'dragon_collector',
    stato: 'completato',
    channel: 'marketplace',
  },
  {
    id: 'vnd-011',
    orderId: 'EBX-2026-04590',
    itemName: 'Tarmogoyf — Future Sight',
    setName: 'Future Sight',
    condition: 'Lightly Played',
    language: 'EN',
    price: 38,
    soldAt: '2026-05-19T08:15:00.000Z',
    buyerUsername: 'jund_fan_04',
    stato: 'completato',
    channel: 'asta',
  },
  {
    id: 'vnd-012',
    orderId: 'EBX-2026-04571',
    itemName: 'Gardevoir ex — Stellar Crown',
    setName: 'Stellar Crown · 245/142',
    condition: 'Near Mint',
    language: 'IT',
    price: 22.9,
    soldAt: '2026-05-18T19:33:00.000Z',
    buyerUsername: 'fairy_deck_it',
    stato: 'completato',
    channel: 'marketplace',
  },
];

export function countByStato(stato: VenditaStato): number {
  return MOCK_VENDITE.filter((v) => v.stato === stato).length;
}

export function filterVendite(tab: VenditaTabId): VenditaMock[] {
  if (tab === 'tutte') return MOCK_VENDITE;
  return MOCK_VENDITE.filter((v) => v.stato === tab);
}

export function getStatoMeta(stato: VenditaStato) {
  return VENDITA_TAB_META.find((t) => t.id === stato)!;
}
