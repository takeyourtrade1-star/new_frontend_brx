import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UserProfileCollectionPanel } from '@/components/feature/users/UserProfileCollectionPanel';

const mocks = vi.hoisted(() => ({
  usePublicUserCollection: vi.fn(),
  fetchCardsByBlueprintIds: vi.fn(),
}));

vi.mock('@/lib/hooks/use-public-user-collection', () => ({
  usePublicUserCollection: mocks.usePublicUserCollection,
}));

vi.mock('@/lib/meilisearch-cards-by-ids', () => ({
  fetchCardsByBlueprintIds: mocks.fetchCardsByBlueprintIds,
}));

describe('UserProfileCollectionPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mocks.usePublicUserCollection.mockReset();
    mocks.fetchCardsByBlueprintIds.mockReset();
  });

  it('does not repeatedly update catalog state while the collection is loading', async () => {
    mocks.usePublicUserCollection.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<UserProfileCollectionPanel username="alice" />);

    expect(screen.getByText('Caricamento collezione…')).toBeInTheDocument();
    await waitFor(() => {
      expect(mocks.fetchCardsByBlueprintIds).not.toHaveBeenCalled();
      expect(
        consoleError.mock.calls.some((call) =>
          call.some((arg) => String(arg).includes('Maximum update depth exceeded')),
        ),
      ).toBe(false);
    });
  });
});
