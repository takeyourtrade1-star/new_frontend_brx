import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useAuctionList: vi.fn(),
  useDeleteAuction: vi.fn(),
  authState: {
    isAuthenticated: true,
    user: { id: 'user-123', name: 'Ada', email: 'ada@example.com' },
  },
}));

vi.mock('@/lib/hooks/use-auctions', () => ({
  useAuctionList: mocks.useAuctionList,
  useDeleteAuction: mocks.useDeleteAuction,
}));

vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: (selector: (state: typeof mocks.authState) => unknown) =>
    selector(mocks.authState),
}));

vi.mock('@/lib/i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values?.count != null ? `${key}:${values.count}` : key,
  }),
}));

vi.mock('@/components/feature/aste/auctions-browse-shared', () => ({
  AuctionListTable: () => <div data-testid="auction-list-table" />,
  AuctionResultsGrid: () => <div data-testid="auction-results-grid" />,
  AuctionViewToggle: () => <div data-testid="auction-view-toggle" />,
  AuctionHmsText: () => <span />,
  MoneyWithSmallCents: () => <span />,
}));

vi.mock('@/components/feature/aste/AsteNav', () => ({
  AsteNav: () => <nav data-testid="aste-nav" />,
}));

vi.mock('@/components/feature/aste/AsteMineViewBar', () => ({
  AsteMineViewBar: () => <div data-testid="aste-mine-view-bar" />,
}));

vi.mock('@/components/ui/AppBreadcrumb', () => ({
  AppBreadcrumb: () => <div data-testid="breadcrumb" />,
}));

vi.mock('@/lib/hooks/use-enriched-auctions', () => ({
  useEnrichedAuctions: <T,>(rows: T[]) => rows,
}));

const emptyAuctionList = {
  success: true,
  data: [],
  total: 0,
  limit: 100,
  offset: 0,
};

describe('user auction pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuctionList.mockReturnValue({
      data: emptyAuctionList,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mocks.useDeleteAuction.mockReturnValue({
      mutateAsync: vi.fn(),
    });
  });

  it('fetches history published auctions with the creator filter', async () => {
    const { AsteHistoryPage } = await import('@/components/feature/aste/AsteHistoryPage');

    render(<AsteHistoryPage />);

    expect(mocks.useAuctionList).toHaveBeenCalledWith(
      { created_by_user_id: 'user-123', limit: 100 },
      { enabled: true },
    );
    expect(mocks.useAuctionList).toHaveBeenCalledWith(
      { limit: 100 },
      { enabled: true },
    );
  });

  it('fetches my listings with the creator filter', async () => {
    const { AsteMyListingsPage } = await import('@/components/feature/aste/AsteMyListingsPage');

    render(<AsteMyListingsPage />);

    expect(mocks.useAuctionList).toHaveBeenCalledWith(
      { created_by_user_id: 'user-123', limit: 100 },
      { enabled: true },
    );
  });
});
