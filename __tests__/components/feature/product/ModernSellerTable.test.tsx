import type { ComponentProps, ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ModernSellerTable } from '@/components/feature/product/ModernSellerTable';
import type { ListingItem } from '@/lib/api/sync-client';
import type { MarketplaceRow } from '@/lib/product-detail/marketplace-rows';

vi.mock('@/lib/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'it' }),
}));
vi.mock('@/lib/i18n/useIntlLocale', () => ({
  useIntlLocale: () => 'it-IT',
}));
vi.mock('@/components/feature/product/MarketplaceReportModal', () => ({
  MarketplaceReportModal: () => null,
}));
vi.mock('@/components/ui/CardImageCameraPeek', () => ({
  CardImageCameraPeek: ({ imageUrl }: { imageUrl: string | null }) => (
    <span data-testid="seller-image-url">{imageUrl}</span>
  ),
}));

const listing: ListingItem = {
  item_id: 1,
  listing_source: 'sync',
  seller_id: 'seller-1',
  seller_display_name: 'Venditore rapido',
  country: 'IT',
  quantity: 1,
  price_cents: 250,
  condition: 'Near Mint',
  mtg_language: 'en',
};

const rows: MarketplaceRow[] = [
  { kind: 'listing', id: 'listing-1', listing },
];

type LegacySellerTableProps = ComponentProps<typeof ModernSellerTable> & {
  auctionsLoading?: boolean;
};

const LegacySellerTable = ModernSellerTable as ComponentType<LegacySellerTableProps>;

describe('ModernSellerTable', () => {
  it('mostra subito i venditori anche se le aste stanno ancora caricando', () => {
    render(
      <LegacySellerTable
        rows={rows}
        loading={false}
        auctionsLoading
      />
    );

    expect(screen.getAllByText('Venditore rapido').length).toBeGreaterThan(0);
    expect(screen.queryByText('productDetail.marketplace.loading')).not.toBeInTheDocument();
  });

  it('mostra il fallback subito e lo sostituisce con la cover senza bloccare la riga', () => {
    const marketplaceItem: ListingItem = {
      ...listing,
      listing_source: 'marketplace',
      marketplace_listing_id: 'listing-photo-1',
    };
    const marketplaceRows: MarketplaceRow[] = [
      { kind: 'listing', id: 'listing-photo-1', listing: marketplaceItem },
    ];
    const fallbackUrl = 'https://cdn.ebartex.com/catalog-card.jpg';
    const coverUrl = 'https://cdn.ebartex.com/seller-cover.jpg';

    const { rerender } = render(
      <ModernSellerTable
        rows={marketplaceRows}
        cardImageSrc={fallbackUrl}
        listingCoverPhotos={{}}
      />
    );

    expect(screen.getAllByText('Venditore rapido').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('seller-image-url').every((node) => node.textContent === fallbackUrl)).toBe(true);

    rerender(
      <ModernSellerTable
        rows={marketplaceRows}
        cardImageSrc={fallbackUrl}
        listingCoverPhotos={{
          'listing-photo-1': { id: 7, cdn_url: coverUrl, position: 0 },
        }}
      />
    );

    expect(screen.getAllByTestId('seller-image-url').every((node) => node.textContent === coverUrl)).toBe(true);
    expect(screen.queryByText('productDetail.marketplace.loading')).not.toBeInTheDocument();
  });
});
