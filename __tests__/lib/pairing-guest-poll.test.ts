import { afterEach, describe, expect, it, vi } from 'vitest';
import { pollPairingSessionAsGuest } from '@/lib/auction-pairing-guest-upload';

describe('pollPairingSessionAsGuest', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns closed on HTTP 410', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 410,
        json: async () => ({ detail: 'closed', code: 'PAIRING_SESSION_CLOSED' }),
      }),
    );
    const result = await pollPairingSessionAsGuest('sid', 'token');
    expect(result.status).toBe('closed');
  });

  it('throws on 401 without treating as closed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      }),
    );
    await expect(pollPairingSessionAsGuest('sid', 'token')).rejects.toMatchObject({ status: 401 });
  });

  it('returns active status with enriched fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            status: 'active',
            photos_count: 2,
            max_photos: 4,
            expires_at: '2026-12-31T00:00:00Z',
          },
        }),
      }),
    );
    const result = await pollPairingSessionAsGuest('sid', 'token');
    expect(result.status).toBe('active');
    expect(result.photos_count).toBe(2);
    expect(result.max_photos).toBe(4);
  });
});
