// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

import { isAllowedAuctionProxyPath } from '@/app/api/_lib/auction-proxy-policy';
import { ordersApi } from '@/lib/api/orders-client';

describe('payment work-in-progress isolation', () => {
  it('never allows the mock payment path through the orders BFF', () => {
    expect(isAllowedAuctionProxyPath('orders', 'POST', '123/pay')).toBe(false);
    expect(isAllowedAuctionProxyPath('orders', 'GET', '123')).toBe(true);
  });

  it('fails locally without making a network request', async () => {
    const network = vi.fn();
    vi.stubGlobal('fetch', network);
    await expect(ordersApi.payOrder(123)).rejects.toMatchObject({ status: 501 });
    expect(network).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
