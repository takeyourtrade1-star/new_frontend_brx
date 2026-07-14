export const TRADE_CARRIERS = [
  { id: 'poste', label: 'Poste Italiane / SDA' },
  { id: 'brt', label: 'BRT' },
  { id: 'gls', label: 'GLS' },
  { id: 'dhl', label: 'DHL' },
  { id: 'ups', label: 'UPS' },
  { id: 'fedex', label: 'FedEx / TNT' },
  { id: 'inpost', label: 'InPost' },
  { id: 'other', label: 'Other' },
] as const;

export type TradeCarrierId = (typeof TRADE_CARRIERS)[number]['id'];

export function tradeCarrierLabel(
  carrier: string | null | undefined,
  otherLabel = 'Other',
): string {
  if (carrier === 'other') return otherLabel;
  return TRADE_CARRIERS.find((item) => item.id === carrier)?.label ?? carrier ?? '';
}

export function tradeTrackingUrl(
  carrier: string | null | undefined,
  trackingCode: string | null | undefined,
): string | null {
  const code = trackingCode?.trim();
  if (!carrier || !code) return null;
  const encoded = encodeURIComponent(code);
  switch (carrier) {
    case 'poste':
      return `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${encoded}`;
    case 'brt':
      return `https://vas.brt.it/vas/sped_numspe_par.htm?lang=it&Nspediz=${encoded}`;
    case 'gls':
      return `https://www.gls-italy.com/it/servizi-per-destinatari/dettaglio-spedizione/?match=${encoded}`;
    case 'dhl':
      return `https://www.dhl.com/it-it/home/tracciabilita.html?tracking-id=${encoded}`;
    case 'ups':
      return `https://www.ups.com/track?loc=it_IT&tracknum=${encoded}`;
    case 'fedex':
      return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
    case 'inpost':
      return `https://inpost.it/trova-il-pacco?parcelNumber=${encoded}`;
    default:
      return null;
  }
}
