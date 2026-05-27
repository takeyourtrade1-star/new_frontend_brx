/**
 * Ordini spedizione post-asta (mock) — collegati a `shippingOrderId` nel dettaglio asta.
 * Dati verticali Magic: The Gathering per il mockup ad alta fedeltà.
 */

export type CardCondition = 'NM' | 'LP' | 'EX' | 'MP';

export type ShippingOrderStatus =
  | 'processing'
  | 'ready_to_ship'
  | 'in_transit'
  | 'delivered';

export type ShippingOrderMock = {
  id: string;
  auctionId: string;
  cardName: string;
  expansion: string;
  /** Nome completo per display: "Black Lotus — Alpha" */
  title: string;
  condition: CardCondition;
  conditionLabel: string;
  image: string;
  buyerUsername: string;
  buyerCountry: string;
  finalPriceEur: number;
  /** Data chiusura asta (ISO 8601) */
  auctionClosedAt: string;
  status: ShippingOrderStatus;
  courier: string | null;
  trackingCode: string | null;
};

export const SHIPPING_STATUS_ORDER: ShippingOrderStatus[] = [
  'processing',
  'ready_to_ship',
  'in_transit',
  'delivered',
];

export const MOCK_SHIPPING_ORDERS: ShippingOrderMock[] = [
  {
    id: 'ship-c1',
    auctionId: 'c1',
    cardName: 'Ugin, the Spirit Dragon',
    expansion: 'Fate Reforged',
    title: 'Ugin, the Spirit Dragon — Fate Reforged',
    condition: 'LP',
    conditionLabel: 'LP — Light Played',
    image: 'https://cards.scryfall.io/normal/front/5/8/58c1e824-c8a9-4312-8e4c-a29a26d189a4.jpg',
    buyerUsername: 'CardBuyer_IT',
    buyerCountry: 'IT',
    finalPriceEur: 180,
    auctionClosedAt: '2026-05-24T18:42:00+02:00',
    status: 'processing',
    courier: null,
    trackingCode: null,
  },
  {
    id: 'ship-001',
    auctionId: 'a1',
    cardName: 'Black Lotus',
    expansion: 'Alpha',
    title: 'Black Lotus — Alpha',
    condition: 'EX',
    conditionLabel: 'EX — Excellent',
    image: 'https://cards.scryfall.io/normal/front/b/0/b0faa7f2-b547-42c4-a810-839da50dadfe.jpg',
    buyerUsername: 'VintageVault_DE',
    buyerCountry: 'DE',
    finalPriceEur: 12400,
    auctionClosedAt: '2026-05-22T21:15:00+02:00',
    status: 'ready_to_ship',
    courier: 'DHL Express',
    trackingCode: null,
  },
  {
    id: 'ship-002',
    auctionId: 'a4',
    cardName: 'Mox Diamond',
    expansion: 'Stronghold',
    title: 'Mox Diamond — Stronghold',
    condition: 'NM',
    conditionLabel: 'NM — Near Mint',
    image: 'https://cards.scryfall.io/normal/front/2/8/28028830-83ed-45e2-b495-3b9ad9d3e988.jpg',
    buyerUsername: 'PowerNine_FR',
    buyerCountry: 'FR',
    finalPriceEur: 2850,
    auctionClosedAt: '2026-05-20T14:30:00+02:00',
    status: 'in_transit',
    courier: 'DHL',
    trackingCode: 'JD014600012345678901',
  },
  {
    id: 'ship-003',
    auctionId: 'a6',
    cardName: 'Ragavan, Nimble Pilferer',
    expansion: 'Modern Horizons 2',
    title: 'Ragavan, Nimble Pilferer — Modern Horizons 2',
    condition: 'NM',
    conditionLabel: 'NM — Near Mint',
    image: 'https://cards.scryfall.io/normal/front/a/9/a9738cda-adb1-47fb-9f4c-ecd930228c4d.jpg',
    buyerUsername: 'MonoRed_Milan',
    buyerCountry: 'IT',
    finalPriceEur: 62,
    auctionClosedAt: '2026-05-19T09:08:00+02:00',
    status: 'in_transit',
    courier: 'Poste Italiane',
    trackingCode: '1Z999AA10123456784',
  },
  {
    id: 'ship-004',
    auctionId: 'a7',
    cardName: 'Force of Will',
    expansion: 'Alliances',
    title: 'Force of Will — Alliances',
    condition: 'LP',
    conditionLabel: 'LP — Light Played',
    image: 'https://cards.scryfall.io/normal/front/9/a/9a879b60-4381-447d-8a5a-8e0b6a1d49ca.jpg',
    buyerUsername: 'LegacyPilot',
    buyerCountry: 'ES',
    finalPriceEur: 420,
    auctionClosedAt: '2026-05-15T16:55:00+02:00',
    status: 'delivered',
    courier: 'BRT',
    trackingCode: 'BRT2026051600123456',
  },
  {
    id: 'ship-005',
    auctionId: 'a8',
    cardName: 'Tundra',
    expansion: 'Revised',
    title: 'Tundra — Revised',
    condition: 'EX',
    conditionLabel: 'EX — Excellent',
    image: 'https://cards.scryfall.io/normal/front/9/c/9c9d5f72-e199-4d5b-ae7e-cc5b9bdfae99.jpg',
    buyerUsername: 'DualLand_Collector',
    buyerCountry: 'CH',
    finalPriceEur: 3100,
    auctionClosedAt: '2026-05-25T11:20:00+02:00',
    status: 'processing',
    courier: null,
    trackingCode: null,
  },
  {
    id: 'ship-006',
    auctionId: 'a9',
    cardName: 'Volcanic Island',
    expansion: 'Unlimited',
    title: 'Volcanic Island — Unlimited',
    condition: 'NM',
    conditionLabel: 'NM — Near Mint',
    image: 'https://cards.scryfall.io/normal/front/9/d/9dc7ab05-a5f5-4a02-87e7-3c47be35b5cb.jpg',
    buyerUsername: 'OldSchool_MTG',
    buyerCountry: 'US',
    finalPriceEur: 4800,
    auctionClosedAt: '2026-05-21T23:45:00+02:00',
    status: 'ready_to_ship',
    courier: 'FedEx International',
    trackingCode: null,
  },
  {
    id: 'ship-007',
    auctionId: 'a10',
    cardName: 'Jace, the Mind Sculptor',
    expansion: 'Worldwake',
    title: 'Jace, the Mind Sculptor — Worldwake',
    condition: 'LP',
    conditionLabel: 'LP — Light Played',
    image: 'https://cards.scryfall.io/normal/front/0/e/0e606072-a3aa-4300-ba90-ec92a721fa76.jpg',
    buyerUsername: 'ControlMage_88',
    buyerCountry: 'IT',
    finalPriceEur: 195,
    auctionClosedAt: '2026-05-10T20:12:00+02:00',
    status: 'delivered',
    courier: 'Poste Italiane',
    trackingCode: 'CP987654321IT',
  },
];
