import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SyncManagementPanel } from '@/components/feature/sync/SyncManagementPanel';

vi.mock('@/lib/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const defaultProps = {
  isDisconnected: false,
  loadingSetup: false,
  loadingDisconnect: false,
  linkError: null,
  linkMessage: null,
  onLinkToken: vi.fn().mockResolvedValue(true),
  onSuspend: vi.fn().mockResolvedValue(undefined),
  onRemove: vi.fn().mockResolvedValue(undefined),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SyncManagementPanel', () => {
  it('mostra il campo token in alto con bottone Aggiungi quando disconnesso', () => {
    render(<SyncManagementPanel {...defaultProps} isDisconnected />);

    expect(screen.getByLabelText('accountPage.syncTokenLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('accountPage.syncProviderLabel')).toHaveValue('cardtrader');
    expect(screen.getByRole('button', { name: 'Aggiungi' })).toBeInTheDocument();
  });

  it('mostra il campo token in alto con bottoni Aggiorna e Rimuovi quando connesso', () => {
    render(<SyncManagementPanel {...defaultProps} isDisconnected={false} />);

    expect(screen.getByLabelText('accountPage.syncTokenLabel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aggiorna' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rimuovi' })).toBeInTheDocument();
  });

  it('mostra la guida ufficiale senza esporre il token', () => {
    render(<SyncManagementPanel {...defaultProps} isDisconnected />);

    expect(
      screen.getByRole('link', { name: 'accountPage.syncTokenGuideLink' }),
    ).toHaveAttribute(
      'href',
      'https://www.cardtrader.com/en/docs/api/full/reference',
    );
    expect(screen.getByLabelText('accountPage.syncTokenLabel')).toHaveAttribute(
      'type',
      'password',
    );
  });
});
