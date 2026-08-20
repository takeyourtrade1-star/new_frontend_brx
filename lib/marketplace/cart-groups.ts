import type { CartSellerAccountType, MarketplaceCartLine } from '@/types';

export interface CartSellerGroup {
  id: string;
  kind: 'seller' | 'brx-express';
  sellerId: string | null;
  sellerDisplayName: string;
  sellerAccountType: CartSellerAccountType | null;
  items: MarketplaceCartLine[];
  subtotalCents: number;
  lineCount: number;
  unitCount: number;
}

const BRX_EXPRESS_GROUP_ID = 'fulfillment:brx-express';
const BRX_EXPRESS_DISPLAY_NAME = 'BRX Express';

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
    const isBrxExpress = line.isBrxExpress === true;
    const groupId = isBrxExpress ? BRX_EXPRESS_GROUP_ID : `seller:${line.sellerId}`;
    const existing = map.get(groupId);
    if (existing) {
      existing.items.push(line);
      existing.subtotalCents += lineSubtotalCents(line);
      existing.lineCount += 1;
      existing.unitCount += line.quantity;
      continue;
    }

    map.set(groupId, {
      id: groupId,
      kind: isBrxExpress ? 'brx-express' : 'seller',
      sellerId: isBrxExpress ? null : line.sellerId,
      sellerDisplayName: isBrxExpress ? BRX_EXPRESS_DISPLAY_NAME : resolveDisplayName(line),
      sellerAccountType: isBrxExpress ? null : resolveAccountType(line),
      items: [line],
      subtotalCents: lineSubtotalCents(line),
      lineCount: 1,
      unitCount: line.quantity,
    });
  }

  return [...map.values()];
}

export function getCartSellerCount(groups: CartSellerGroup[]): number {
  return groups.filter((group) => group.kind === 'seller').length;
}
