export type VenditaStato = 'in-attesa-pagamento' | 'da-spedire' | 'spedito' | 'completato';

export type MockVendita = {
  id: string;
  orderId: string;
  itemName: string;
  category: string;
  price: number;
  date: string;
  buyerUsername: string;
  buyerInitials: string;
  stato: VenditaStato;
  /** ISO date for sorting */
  sortDate: string;
  trackingCode?: string;
  paymentDue?: string;
  shippedAt?: string;
  deliveredAt?: string;
};

export const VENDITA_TAB_META: {
  id: VenditaStato | 'tutte';
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: 'tutte',
    label: 'Tutte',
    shortLabel: 'Tutte',
    description: 'Panoramica di tutte le vendite attive',
  },
  {
    id: 'in-attesa-pagamento',
    label: 'In attesa di pagamento',
    shortLabel: 'In attesa',
    description: 'Aste concluse in attesa del pagamento dell\'acquirente',
  },
  {
    id: 'da-spedire',
    label: 'Da spedire',
    shortLabel: 'Da spedire',
    description: 'Pagamenti ricevuti — prepara e invia il pacco',
  },
  {
    id: 'spedito',
    label: 'Spedito',
    shortLabel: 'Spedito',
    description: 'Ordini in transito verso l\'acquirente',
  },
  {
    id: 'completato',
    label: 'Completato',
    shortLabel: 'Completato',
    description: 'Vendite consegnate e chiuse con successo',
  },
];

export const MOCK_VENDITE: MockVendita[] = [
  {
    id: 'v-001',
    orderId: 'EBX-2026-084721',
    itemName: 'Rolex Submariner Date 126610LN — scatola e documenti',
    category: 'Orologi di lusso',
    price: 12450,
    date: '24 mag 2026, 18:42',
    buyerUsername: 'marco_collezionista',
    buyerInitials: 'MC',
    stato: 'in-attesa-pagamento',
    sortDate: '2026-05-24T18:42:00',
    paymentDue: '27 mag 2026, 23:59',
  },
  {
    id: 'v-002',
    orderId: 'EBX-2026-084698',
    itemName: 'Nintendo 64 + 12 giochi originali (PAL)',
    category: 'Videogiochi retrò',
    price: 289,
    date: '23 mag 2026, 11:15',
    buyerUsername: 'retro_gamer_87',
    buyerInitials: 'RG',
    stato: 'in-attesa-pagamento',
    sortDate: '2026-05-23T11:15:00',
    paymentDue: '26 mag 2026, 23:59',
  },
  {
    id: 'v-003',
    orderId: 'EBX-2026-084512',
    itemName: 'LEGO Creator Expert Taj Mahal 10256 — sigillato',
    category: 'Collezionismo LEGO',
    price: 415,
    date: '22 mag 2026, 09:03',
    buyerUsername: 'brick_master_it',
    buyerInitials: 'BM',
    stato: 'in-attesa-pagamento',
    sortDate: '2026-05-22T09:03:00',
    paymentDue: '25 mag 2026, 23:59',
  },
  {
    id: 'v-004',
    orderId: 'EBX-2026-084201',
    itemName: 'iPhone 15 Pro 256GB Titanio Naturale — come nuovo',
    category: 'Elettronica',
    price: 879,
    date: '21 mag 2026, 16:28',
    buyerUsername: 'luca_tech',
    buyerInitials: 'LT',
    stato: 'da-spedire',
    sortDate: '2026-05-21T16:28:00',
  },
  {
    id: 'v-005',
    orderId: 'EBX-2026-083944',
    itemName: 'Carte Pokémon 1ª edizione — lotto 47 holo',
    category: 'Trading card',
    price: 1920,
    date: '20 mag 2026, 20:51',
    buyerUsername: 'pokevault_it',
    buyerInitials: 'PV',
    stato: 'da-spedire',
    sortDate: '2026-05-20T20:51:00',
  },
  {
    id: 'v-006',
    orderId: 'EBX-2026-083701',
    itemName: 'Vinile Pink Floyd — The Dark Side of the Moon (UK press)',
    category: 'Musica',
    price: 68,
    date: '19 mag 2026, 14:07',
    buyerUsername: 'vinyl_soul',
    buyerInitials: 'VS',
    stato: 'da-spedire',
    sortDate: '2026-05-19T14:07:00',
  },
  {
    id: 'v-007',
    orderId: 'EBX-2026-083455',
    itemName: 'MacBook Pro 14" M3 Pro 18GB/512GB — garanzia Apple',
    category: 'Informatica',
    price: 2149,
    date: '18 mag 2026, 10:22',
    buyerUsername: 'dev_alessia',
    buyerInitials: 'DA',
    stato: 'spedito',
    sortDate: '2026-05-18T10:22:00',
    trackingCode: 'IT892345678901',
    shippedAt: '19 mag 2026, 08:15',
  },
  {
    id: 'v-008',
    orderId: 'EBX-2026-083102',
    itemName: 'Fotocamera Leica M6 TTL + obiettivo Summicron 35mm',
    category: 'Fotografia',
    price: 3890,
    date: '16 mag 2026, 17:44',
    buyerUsername: 'frame_hunter',
    buyerInitials: 'FH',
    stato: 'spedito',
    sortDate: '2026-05-16T17:44:00',
    trackingCode: 'IT776543210987',
    shippedAt: '17 mag 2026, 11:30',
  },
  {
    id: 'v-009',
    orderId: 'EBX-2026-082890',
    itemName: 'Sneaker Nike Air Jordan 1 Retro High OG "Chicago"',
    category: 'Sneaker & moda',
    price: 340,
    date: '15 mag 2026, 12:18',
    buyerUsername: 'sneakerhead_milano',
    buyerInitials: 'SM',
    stato: 'spedito',
    sortDate: '2026-05-15T12:18:00',
    trackingCode: 'IT654321098765',
    shippedAt: '16 mag 2026, 09:45',
  },
  {
    id: 'v-010',
    orderId: 'EBX-2026-082401',
    itemName: 'PlayStation 5 Digital Edition — 2 anni, perfetta',
    category: 'Console',
    price: 349,
    date: '10 mag 2026, 19:55',
    buyerUsername: 'gaming_nico',
    buyerInitials: 'GN',
    stato: 'completato',
    sortDate: '2026-05-10T19:55:00',
    deliveredAt: '14 mag 2026, 14:20',
  },
  {
    id: 'v-011',
    orderId: 'EBX-2026-081955',
    itemName: 'Moneta d\'oro 20 lire Vittorio Emanuele III — 1927',
    category: 'Numismatica',
    price: 520,
    date: '8 mag 2026, 08:40',
    buyerUsername: 'numis_roma',
    buyerInitials: 'NR',
    stato: 'completato',
    sortDate: '2026-05-08T08:40:00',
    deliveredAt: '12 mag 2026, 10:05',
  },
  {
    id: 'v-012',
    orderId: 'EBX-2026-081402',
    itemName: 'Borsa Louis Vuitton Neverfull MM — autenticata',
    category: 'Moda luxury',
    price: 1180,
    date: '5 mag 2026, 15:33',
    buyerUsername: 'fashion_elisa',
    buyerInitials: 'FE',
    stato: 'completato',
    sortDate: '2026-05-05T15:33:00',
    deliveredAt: '9 mag 2026, 16:48',
  },
];

export function countByStato(stato: VenditaStato): number {
  return MOCK_VENDITE.filter((v) => v.stato === stato).length;
}

export function filterVendite(stato: VenditaStato | 'tutte'): MockVendita[] {
  const list =
    stato === 'tutte'
      ? [...MOCK_VENDITE]
      : MOCK_VENDITE.filter((v) => v.stato === stato);
  return list.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}
