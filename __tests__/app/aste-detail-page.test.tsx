import { type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import AsteDetailPage from '@/app/aste/[id]/page';

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="header" />,
}));

vi.mock('@/components/feature/aste/AsteDetailView', () => ({
  AsteDetailView: ({ auctionId }: { auctionId: string }) => (
    <div data-testid="auction-detail" data-auction-id={auctionId} />
  ),
}));

describe('AsteDetailPage', () => {
  it('keys the detail view by auction id so route changes remount bid state', async () => {
    const firstPage = await AsteDetailPage({ params: Promise.resolve({ id: '42' }) });
    const secondPage = await AsteDetailPage({ params: Promise.resolve({ id: '43' }) });

    const firstChildren = firstPage.props.children as ReactElement[];
    const secondChildren = secondPage.props.children as ReactElement[];

    expect(firstChildren[1].key).toBe('auction-detail-42');
    expect(secondChildren[1].key).toBe('auction-detail-43');
    expect(firstChildren[1].props.auctionId).toBe('42');
    expect(secondChildren[1].props.auctionId).toBe('43');
  });
});
