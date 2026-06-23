import type { CardDocument } from '@/lib/product-detail';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';
import type { AuctionCreateDraft } from '@/lib/auction/auction-create-draft';

export type WizardStepId =
  | 'item_pick'
  | 'inventory_pick'
  | 'details'
  | 'price'
  | 'shipping'
  | 'photos'
  | 'review';

export const STANDALONE_STEP_ORDER: WizardStepId[] = [
  'item_pick',
  'details',
  'price',
  'shipping',
  'photos',
  'review',
];

export type WizardVariant = 'standalone' | 'embedded';

export type StepOrderOpts = {
  variant: WizardVariant;
  hasEmbeddedInventory: boolean;
};

export function getStepOrder(
  _isCard: boolean | null,
  opts: StepOrderOpts
): WizardStepId[] {
  if (opts.variant === 'embedded') {
    const tail: WizardStepId[] = ['details', 'review'];
    if (opts.hasEmbeddedInventory) return ['inventory_pick', ...tail];
    return tail;
  }
  return STANDALONE_STEP_ORDER;
}

export function getPreviousStepId(
  stepId: WizardStepId,
  _draft: AuctionCreateDraft,
  opts: StepOrderOpts
): WizardStepId | 'cancel' {
  if (opts.variant === 'embedded') {
    if (stepId === 'inventory_pick') return 'cancel';
    if (stepId === 'details' && opts.hasEmbeddedInventory) return 'inventory_pick';
    if (stepId === 'details' && !opts.hasEmbeddedInventory) return 'cancel';
    if (stepId === 'review') return 'details';
    return 'cancel';
  }
  if (stepId === 'item_pick') return 'cancel';
  if (stepId === 'details') return 'item_pick';
  if (stepId === 'price') return 'details';
  if (stepId === 'shipping') return 'price';
  if (stepId === 'photos') return 'shipping';
  if (stepId === 'review') return 'photos';
  return 'item_pick';
}

export type AuctionCreateWizardProps = {
  variant?: WizardVariant;
  embeddedCard?: CardDocument;
  embeddedInventoryItems?: InventoryItemWithCatalog[];
  onEmbeddedCancel?: () => void;
  className?: string;
};

export type EmbeddedInventoryPick = 'unset' | 'skip' | number;

export type CreatedAuctionInfo = {
  id: number | null;
  startIso: string;
  endIso: string;
};
