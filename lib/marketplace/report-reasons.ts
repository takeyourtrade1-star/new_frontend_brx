export const MARKETPLACE_REPORT_REASONS = [
  'misleading_listing',
  'counterfeit',
  'pricing_issue',
  'seller_conduct',
  'shipping_fraud',
  'other',
] as const;

export type MarketplaceReportReason = (typeof MARKETPLACE_REPORT_REASONS)[number];

export type MarketplaceReportKind = 'listing' | 'auction';

export interface MarketplaceReportContext {
  sellerUsername: string;
  sellerId?: string;
  kind: MarketplaceReportKind;
  referenceId: string;
  referenceLabel?: string;
}

export interface MarketplaceReportPayload extends MarketplaceReportContext {
  reason: MarketplaceReportReason;
  details?: string;
}

export function isMarketplaceReportReason(value: string): value is MarketplaceReportReason {
  return (MARKETPLACE_REPORT_REASONS as readonly string[]).includes(value);
}
