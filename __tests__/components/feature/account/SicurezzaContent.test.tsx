import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SicurezzaContent } from '@/components/feature/account/SicurezzaContent';

const {
  disableMFAMock,
  enableMFAMock,
  useCurrentUserMock,
  verifyMFAMock,
} = vi.hoisted(() => ({
  disableMFAMock: vi.fn(),
  enableMFAMock: vi.fn(),
  useCurrentUserMock: vi.fn(),
  verifyMFAMock: vi.fn(),
}));

vi.mock('@/lib/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/hooks/use-auth', () => ({
  useCurrentUser: useCurrentUserMock,
  useEnableMFA: () => ({ mutateAsync: enableMFAMock, isPending: false }),
  useVerifyMFASetup: () => ({ mutateAsync: verifyMFAMock, isPending: false }),
  useDisableMFA: () => ({ mutateAsync: disableMFAMock, isPending: false }),
}));

describe('SicurezzaContent MFA lifecycle', () => {
  beforeEach(() => {
    useCurrentUserMock.mockReturnValue({
      data: { mfa_enabled: false },
      isLoading: false,
    });
    enableMFAMock.mockResolvedValue({
      qr_code_url: 'data:image/png;base64,qr',
      secret: 'setup-secret',
    });
    disableMFAMock.mockResolvedValue(undefined);
    verifyMFAMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('starts enrollment with the password only', async () => {
    render(<SicurezzaContent />);

    fireEvent.change(screen.getByLabelText('account.securityPassword'), {
      target: { value: 'correct horse battery staple' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'accountPage.secActivateMfa' }),
    );

    await waitFor(() => {
      expect(enableMFAMock).toHaveBeenCalledWith({
        password: 'correct horse battery staple',
      });
    });
  });

  it('offers only password and current TOTP disable when MFA is active', async () => {
    useCurrentUserMock.mockReturnValue({
      data: { mfa_enabled: true },
      isLoading: false,
    });

    render(<SicurezzaContent />);

    expect(document.getElementById('replace-mfa-password')).not.toBeInTheDocument();
    expect(document.getElementById('replace-mfa-code')).not.toBeInTheDocument();
    expect(document.getElementById('enable-mfa-password')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('account.securityPassword'), {
      target: { value: 'correct horse battery staple' },
    });
    fireEvent.change(screen.getByLabelText('accountPage.secEnterCode'), {
      target: { value: '123456' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'accountPage.secDisableMfa' }),
    );

    await waitFor(() => {
      expect(disableMFAMock).toHaveBeenCalledWith({
        password: 'correct horse battery staple',
        current_mfa_code: '123456',
      });
    });
    expect(enableMFAMock).not.toHaveBeenCalled();
  });
});
