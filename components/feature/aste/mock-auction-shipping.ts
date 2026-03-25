/**
 * Ordini spedizione post-asta (mock) — collegati a `shippingOrderId` nel dettaglio asta.
 */

export type ShippingOrderStatus = 'awaiting_shipment' | 'label_printed' | 'shipped';

export type ShippingOrderMock = {
  id: string;
  auctionId: string;
  title: string;
  image: string;
  buyerUsername: string;
  buyerCountry: string;
  finalPriceEur: number;
  status: ShippingOrderStatus;
};

export const MOCK_SHIPPING_ORDERS: ShippingOrderMock[] = [
  {
    id: 'ship-c1',
    auctionId: 'c1',
    title: 'Ugin, the Spirit Dragon — foil',
    image: 'https://picsum.photos/seed/brxastec1/400/560',
    buyerUsername: 'CardBuyer_IT',
    buyerCountry: 'IT',
    finalPriceEur: 180,
    status: 'awaiting_shipment',
  },
];
