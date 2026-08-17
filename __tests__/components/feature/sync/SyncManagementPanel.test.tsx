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
  it('apre il form token quando lo stato asincrono conferma che non è configurato', () => {
    const { rerender } = render(<SyncManagementPanel {...defaultProps} />);
    expect(screen.queryByLabelText('accountPage.syncTokenLabel')).not.toBeInTheDocument();

    rerender(<SyncManagementPanel {...defaultProps} isDisconnected />);

    expect(screen.getByLabelText('accountPage.syncTokenLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('accountPage.syncProviderLabel')).toHaveValue('cardtrader');
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
