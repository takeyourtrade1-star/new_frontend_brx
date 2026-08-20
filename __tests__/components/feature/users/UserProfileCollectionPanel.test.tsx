import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UserProfileCollectionPanel } from '@/components/feature/users/UserProfileCollectionPanel';

const { useSearchAvailabilityMock } = vi.hoisted(() => ({
  useSearchAvailabilityMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

vi.mock('@/lib/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/i18n/useIntlLocale', () => ({
  useIntlLocale: () => 'it-IT',
}));

vi.mock('@/lib/hooks/use-public-user-collection', () => ({
  usePublicUserCollection: () => ({
    data: {
      items: [
        {
          id: 1,
          blueprint_id: 101,
          quantity: 2,
          price_cents: 1250,
          properties: { condition: 'Near Mint' },
          source: 'cardtrader',
        },
        {
          id: 2,
          blueprint_id: 202,
          quantity: 1,
          price_cents: 850,
          properties: { condition: 'Excellent' },
          source: 'cardtrader',
        },
      ],
      total: 49,
      limit: 24,
      offset: 0,
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/lib/hooks/use-meilisearch-cards', () => ({
  useMeilisearchCards: () => ({
    data: {
      101: { id: 'mtg_101', name: 'Black Lotus', set_name: 'Limited Edition Alpha' },
      202: { id: 'mtg_202', name: 'Mox Pearl', set_name: 'Unlimited Edition' },
    },
    isLoading: false,
  }),
}));

vi.mock('@/lib/hooks/use-search', () => ({
  useSearchAvailability: useSearchAvailabilityMock,
}));

useSearchAvailabilityMock.mockReturnValue({
  data: {
    availability: {
      mtg_101: { sellerCount: 1, sellerAvailable: true },
      mtg_202: { sellerCount: 1, sellerAvailable: false },
    },
  },
  isLoading: false,
});

describe('UserProfileCollectionPanel', () => {
  it('distingue vendita e collezione, usa la stampa esatta e la paginazione standard', () => {
    render(
      <UserProfileCollectionPanel
        userId="019c003d-44a9-7047-afff-de22c9476227"
        username="Julian"
      />,
    );

    expect(screen.getByText('Black Lotus').closest('a')).toHaveAttribute('href', '/products/mtg_101');
    expect(screen.getByText('Mox Pearl').closest('a')).toHaveAttribute('href', '/products/mtg_202');
    expect(screen.getByText('userProfile.forSale')).toBeInTheDocument();
    expect(screen.getByText('userProfile.collectionOnly')).toBeInTheDocument();

    expect(useSearchAvailabilityMock).toHaveBeenCalledWith(
      [
        { cardId: 'mtg_101', blueprintId: 101 },
        { cardId: 'mtg_202', blueprintId: 202 },
      ],
      '019c003d-44a9-7047-afff-de22c9476227',
    );

    expect(screen.getByRole('navigation')).toHaveClass('w-full');
    expect(screen.getByRole('button', { name: 'search.nextPage' })).toHaveClass('h-11', 'w-11');
  });
});
