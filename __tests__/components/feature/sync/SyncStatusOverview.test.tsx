import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SyncStatusOverview } from '@/components/feature/sync/SyncStatusOverview';

vi.mock('@/lib/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/i18n/useIntlLocale', () => ({
  useIntlLocale: () => 'it-IT',
}));

afterEach(() => {
  cleanup();
});

describe('SyncStatusOverview', () => {
  it('mostra lo stato spento quando non è collegato', () => {
    render(
      <SyncStatusOverview
        loading={false}
        brxStatus={null}
        isDisconnected
        webhookConfigured={false}
        marketplaceStatus={null}
        marketplaceLoading={false}
        lastSyncAt={null}
        lastError={null}
      />,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('accountPage.syncTitle');
    expect(screen.getByText('Non collegato')).toBeInTheDocument();
    expect(screen.getByText('In attesa')).toBeInTheDocument();
    expect(screen.getAllByText('Spento').length).toBeGreaterThan(0);
  });

  it('mostra avanzamento durante l’import', () => {
    render(
      <SyncStatusOverview
        loading={false}
        brxStatus="initial_sync"
        isDisconnected={false}
        webhookConfigured
        marketplaceStatus={null}
        marketplaceLoading={false}
        lastSyncAt={null}
        lastError={null}
        progressPercent={42}
        progressProcessed={420}
        progressTotal={1000}
      />,
    );

    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getAllByText('Import in corso').length).toBeGreaterThan(0);
    expect(screen.getByText('Riceve il catalogo')).toBeInTheDocument();
  });
});
