import { describe, expect, it, vi } from 'vitest';
import { linkCardTraderAndStartImport } from '@/lib/sync/cardtrader-link-flow';

function dependencies() {
  return {
    linkCardtrader: vi.fn().mockResolvedValue({
      status: 'success',
      user_id: 'user-1',
      sync_status: 'idle',
      webhook_secret_configured: true,
      execution_mode: 'partial',
      mode_version: 2,
      writes_enabled: false,
    }),
    getWebhookUrl: vi.fn().mockResolvedValue({
      user_id: 'user-1',
      webhook_url: 'https://sync.example/webhook/user-1',
      instructions: { step_1: '', step_2: '', step_3: '', step_4: '' },
      webhook_secret_configured: true,
    }),
    getMarketplaceSyncStatus: vi.fn().mockResolvedValue({
      user_id: 'user-1',
      sync_mode: 'partial' as const,
      is_active: true,
      mode_version: 2,
      writes_enabled: false,
      last_sync_event_at: null,
      total_listings: 0,
      synced_listings: 0,
      pending_events: 0,
    }),
    startSync: vi.fn().mockResolvedValue({
      status: 'accepted',
      task_id: 'task-1',
      user_id: 'user-1',
      message: 'started',
    }),
  };
}

describe('linkCardTraderAndStartImport', () => {
  it('salva il token tramite BFF e avvia subito l’import in modalità fail-closed', async () => {
    const deps = dependencies();

    const result = await linkCardTraderAndStartImport(
      'user-1',
      'session-token',
      'cardtrader-token',
      deps,
    );

    expect(deps.linkCardtrader).toHaveBeenCalledWith(
      { user_id: 'user-1', cardtrader_token: 'cardtrader-token' },
      'session-token',
    );
    expect(deps.startSync).toHaveBeenCalledWith('user-1', 'session-token');
    expect(result.link.execution_mode).toBe('partial');
    expect(result.link.writes_enabled).toBe(false);
    expect(result.syncStart?.task_id).toBe('task-1');
    expect(result.followUpFailures).toEqual([]);
  });

  it('non trasforma un errore dei follow-up in un falso errore del token', async () => {
    const deps = dependencies();
    deps.getWebhookUrl.mockRejectedValue(new Error('temporary webhook failure'));
    deps.getMarketplaceSyncStatus.mockRejectedValue(new Error('temporary marketplace failure'));
    deps.startSync.mockRejectedValue(new Error('temporary sync failure'));

    const result = await linkCardTraderAndStartImport(
      'user-1',
      'session-token',
      'cardtrader-token',
      deps,
    );

    expect(result.link.status).toBe('success');
    expect(result.webhook).toBeNull();
    expect(result.marketplaceStatus).toBeNull();
    expect(result.syncStart).toBeNull();
    expect(result.followUpFailures).toEqual([
      'webhook',
      'marketplace',
      'initial_sync',
    ]);
  });

  it('non avvia alcun follow-up quando il token viene rifiutato', async () => {
    const deps = dependencies();
    deps.linkCardtrader.mockRejectedValue(Object.assign(new Error('rejected'), { status: 502 }));

    await expect(
      linkCardTraderAndStartImport(
        'user-1',
        'session-token',
        'invalid-token',
        deps,
      ),
    ).rejects.toMatchObject({ status: 502 });

    expect(deps.startSync).not.toHaveBeenCalled();
    expect(deps.getWebhookUrl).not.toHaveBeenCalled();
  });
});
