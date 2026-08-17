import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from '@/components/feature/login/login-form';
import { LoginCodeForm } from '@/components/feature/login/login-code-form';
import { LoginGateModal } from '@/components/feature/auth/LoginGateModal';
import VerifyMFAPage from '@/app/login/verify-mfa/page';
import { VerificationView } from '@/app/registrati/verifica/verification-view';

const {
  authErrorClearMock,
  authErrorSetMock,
  loginMock,
  requestLoginCodeMock,
  routerPushMock,
  routerReplaceMock,
  verifyEmailCodeMock,
  verifyLoginCodeMock,
  verifyMFAMock,
} = vi.hoisted(() => ({
  authErrorClearMock: vi.fn(),
  authErrorSetMock: vi.fn(),
  loginMock: vi.fn(),
  requestLoginCodeMock: vi.fn(),
  routerPushMock: vi.fn(),
  routerReplaceMock: vi.fn(),
  verifyEmailCodeMock: vi.fn(),
  verifyLoginCodeMock: vi.fn(),
  verifyMFAMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPushMock,
    replace: routerReplaceMock,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'flow_id' ? 'verification-flow-id' : null),
  }),
}));

vi.mock('@/lib/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/hooks/use-auth', () => ({
  useLogin: () => ({ mutateAsync: loginMock, isPending: false }),
  useRequestLoginCode: () => ({ mutateAsync: requestLoginCodeMock, isPending: false }),
  useVerifyLoginCode: () => ({ mutateAsync: verifyLoginCodeMock, isPending: false }),
  useVerifyMFA: () => ({ mutateAsync: verifyMFAMock, isPending: false }),
}));

vi.mock('@/lib/errors/useAuthError', () => ({
  useAuthError: () => ({
    clearError: authErrorClearMock,
    isRateLimitError: false,
    setError: authErrorSetMock,
  }),
}));

vi.mock('@/components/ui/AuthErrorAlert', () => ({
  AuthErrorAlert: () => null,
}));

vi.mock('@/components/layout/AuthSplitViewShell', () => ({
  AuthSplitViewShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: (
    selector: (state: {
      clearError: () => void;
      error: null;
      isLoading: boolean;
    }) => unknown,
  ) => selector({ clearError: authErrorClearMock, error: null, isLoading: false }),
}));

vi.mock('@/lib/hooks/use-email-verification', () => ({
  useVerifyRegistrationEmailCode: () => ({
    mutateAsync: verifyEmailCodeMock,
    isPending: false,
  }),
  useVerifyRegistrationEmailToken: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useResendRegistrationVerification: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/lib/auth/registration-verification', () => ({
  buildVerificationPath: () => '/registrati/verifica?flow_id=next-flow',
  clearPendingRegistration: vi.fn(),
  readAndScrubVerificationToken: () => null,
  readPendingRegistration: () => null,
  savePendingRegistration: vi.fn(),
}));

function pendingPromise<T>(): Promise<T> {
  return new Promise<T>(() => undefined);
}

describe('auth submission mutexes', () => {
  beforeEach(() => {
    loginMock.mockReturnValue(pendingPromise());
    requestLoginCodeMock.mockResolvedValue(undefined);
    verifyMFAMock.mockReturnValue(pendingPromise());
    verifyEmailCodeMock.mockReturnValue(pendingPromise());
    verifyLoginCodeMock.mockReturnValue(pendingPromise());
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('starts only one password login for two synchronous submits', async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/auth\.usernameOrEmail/), {
      target: { value: 'user@example.test' },
    });
    fireEvent.change(screen.getByLabelText(/auth\.password/), {
      target: { value: 'correct horse battery staple' },
    });
    const submit = screen.getByRole('button', { name: 'auth.login' });
    const form = submit.closest('form');
    expect(form).not.toBeNull();

    fireEvent.submit(form!);
    fireEvent.submit(form!);

    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1));
  });

  it('consumes the MFA pre-auth handoff only once for two synchronous submits', async () => {
    render(<VerifyMFAPage />);

    fireEvent.paste(screen.getByLabelText('MFA digit 1'), {
      clipboardData: { getData: () => '123456' },
    });
    const submit = screen.getByRole('button', { name: 'mfa.verify' });
    const form = submit.closest('form');
    expect(form).not.toBeNull();

    fireEvent.submit(form!);
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(verifyMFAMock).toHaveBeenCalledTimes(1);
      expect(verifyMFAMock).toHaveBeenCalledWith({
        mfa_code: '123456',
        remember_device: false,
      });
    });
  });

  it('consumes a passwordless login code once across onComplete and button click', async () => {
    render(<LoginCodeForm />);

    fireEvent.change(screen.getByLabelText('loginForm.email'), {
      target: { value: 'USER@EXAMPLE.TEST' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'loginCode.sendCode' }));

    const firstCodeInput = await screen.findByLabelText('Code character 1');
    fireEvent.paste(firstCodeInput, {
      clipboardData: { getData: () => 'abcd1234' },
    });
    await waitFor(() => expect(verifyLoginCodeMock).toHaveBeenCalledTimes(1));

    const submit = screen.getByRole('button', { name: 'loginCode.login' });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    expect(verifyLoginCodeMock).toHaveBeenCalledTimes(1);
    expect(verifyLoginCodeMock).toHaveBeenCalledWith({
      email: 'user@example.test',
      code: 'abcd1234',
    });
  });

  it('consumes a modal login code once across onComplete and button click', async () => {
    render(<LoginGateModal open onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('loginGate.emailLabel'), {
      target: { value: 'USER@EXAMPLE.TEST' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'loginGate.login' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'loginGate.loginWithCode' }),
    );

    const firstCodeInput = await screen.findByLabelText('Code character 1');
    fireEvent.paste(firstCodeInput, {
      clipboardData: { getData: () => 'abcd1234' },
    });
    await waitFor(() => expect(verifyLoginCodeMock).toHaveBeenCalledTimes(1));

    const submit = screen.getByRole('button', { name: 'loginGate.login' });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    expect(verifyLoginCodeMock).toHaveBeenCalledTimes(1);
    expect(verifyLoginCodeMock).toHaveBeenCalledWith({
      email: 'user@example.test',
      code: 'abcd1234',
    });
  });

  it('verifies an email code once across onComplete and button click', async () => {
    render(<VerificationView />);

    fireEvent.paste(screen.getByLabelText('emailVerification.codeCharacter 1'), {
      clipboardData: { getData: () => '123456' },
    });
    await waitFor(() => expect(verifyEmailCodeMock).toHaveBeenCalledTimes(1));

    const submit = screen.getByRole('button', { name: 'emailVerification.verify' });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    expect(verifyEmailCodeMock).toHaveBeenCalledTimes(1);
    expect(verifyEmailCodeMock).toHaveBeenCalledWith({
      flowId: 'verification-flow-id',
      code: '123456',
    });
  });
});
