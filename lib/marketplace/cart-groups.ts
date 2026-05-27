import type { CartSellerAccountType, MarketplaceCartLine } from '@/types';

export interface CartSellerGroup {
  sellerId: string;
  sellerDisplayName: string;
  sellerAccountType: CartSellerAccountType | null;
  items: MarketplaceCartLine[];
  subtotalCents: number;
  lineCount: number;
  unitCount: number;
}

function lineSubtotalCents(line: MarketplaceCartLine): number {
  return line.priceCents * line.quantity;
}

export function groupCartItemsBySeller(
  items: MarketplaceCartLine[],
  resolveDisplayName: (line: MarketplaceCartLine) => string,
  resolveAccountType: (line: MarketplaceCartLine) => CartSellerAccountType | null,
): CartSellerGroup[] {
  const map = new Map<string, CartSellerGroup>();

  for (const line of items) {
    const existing = map.get(line.sellerId);
    if (existing) {
      existing.items.push(line);
      existing.subtotalCents += lineSubtotalCents(line);
      existing.lineCount += 1;
      existing.unitCount += line.quantity;
      continue;
    }

    map.set(line.sellerId, {
      sellerId: line.sellerId,
      sellerDisplayName: resolveDisplayName(line),
      sellerAccountType: resolveAccountType(line),
      items: [line],
      subtotalCents: lineSubtotalCents(line),
      lineCount: 1,
      unitCount: line.quantity,
    });
  }

  return [...map.values()];
}

export function getCartSellerCount(groups: CartSellerGroup[]): number {
  return groups.length;
}
