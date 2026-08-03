import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '@/lib/api/auth-client';
import { usePasswordResetStore } from '@/lib/stores/password-reset-store';

vi.mock('@/lib/api/auth-client', () => ({
  authApi: {
    requestPasswordReset: vi.fn(),
    verifyPasswordResetCode: vi.fn(),
    confirmPasswordResetInit: vi.fn(),
    confirmPasswordResetFinal: vi.fn(),
    clearPasswordResetSession: vi.fn(),
  },
}));

describe('password reset store cookie-only hand-off', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePasswordResetStore.setState({
      step: 'idle',
      email: '',
      otp2Failures: 0,
      expiresAt: null,
      isLoading: false,
      error: null,
    });
  });

  it('never receives or retains reusable reset credentials', async () => {
    vi.mocked(authApi.requestPasswordReset).mockResolvedValue({ message: 'queued' });
    vi.mocked(authApi.clearPasswordResetSession).mockResolvedValue(undefined);
    vi.mocked(authApi.verifyPasswordResetCode).mockResolvedValue({
      handoff_ready: true,
      expires_in_seconds: 300,
      token: 'must-be-ignored-even-if-a-mock-adds-it',
    } as never);
    vi.mocked(authApi.confirmPasswordResetInit).mockResolvedValue({
      handoff_ready: true,
      expires_in_seconds: 300,
      token: 'must-also-be-ignored',
    } as never);
    vi.mocked(authApi.confirmPasswordResetFinal).mockResolvedValue({ message: 'done' });

    await usePasswordResetStore.getState().requestOTP1('user@example.com');
    await usePasswordResetStore.getState().verifyOTP1('abcd1234');
    await usePasswordResetStore.getState().confirmInit('A-new-password-123');
    await usePasswordResetStore.getState().confirmFinal('123456');

    expect(authApi.clearPasswordResetSession).toHaveBeenCalledTimes(1);
    expect(authApi.confirmPasswordResetInit).toHaveBeenCalledWith('A-new-password-123');
    expect(authApi.confirmPasswordResetFinal).toHaveBeenCalledWith('123456');
    const state = usePasswordResetStore.getState() as unknown as Record<string, unknown>;
    expect(state).not.toHaveProperty('resetToken');
    expect(state).not.toHaveProperty('confirmToken');
    expect(JSON.stringify(state)).not.toContain('must-be-ignored');
    expect(JSON.stringify(state)).not.toContain('must-also-be-ignored');
    expect(state.step).toBe('completed');
  });

  it('allows two OTP2 retries, then terminates and clears the hand-off', async () => {
    const invalidOtp = { response: { status: 401 } };
    vi.mocked(authApi.confirmPasswordResetFinal).mockRejectedValue(invalidOtp);
    vi.mocked(authApi.clearPasswordResetSession).mockResolvedValue(undefined);
    usePasswordResetStore.setState({
      step: 'otp2_requested',
      email: 'user@example.com',
      expiresAt: Date.now() + 300_000,
    });

    await usePasswordResetStore.getState().confirmFinal('111111');
    expect(usePasswordResetStore.getState()).toMatchObject({
      step: 'otp2_requested',
      otp2Failures: 1,
      isLoading: false,
    });
    await usePasswordResetStore.getState().confirmFinal('222222');
    expect(usePasswordResetStore.getState()).toMatchObject({
      step: 'otp2_requested',
      otp2Failures: 2,
      isLoading: false,
    });
    await usePasswordResetStore.getState().confirmFinal('333333');
    await Promise.resolve();
    expect(usePasswordResetStore.getState()).toMatchObject({
      step: 'error',
      otp2Failures: 3,
      isLoading: false,
    });
    expect(authApi.clearPasswordResetSession).toHaveBeenCalledTimes(1);
  });

  it('clears the HttpOnly hand-off when the flow is reset', async () => {
    vi.mocked(authApi.clearPasswordResetSession).mockResolvedValue(undefined);
    usePasswordResetStore.setState({
      step: 'otp2_requested',
      email: 'user@example.com',
      otp2Failures: 1,
    });

    await usePasswordResetStore.getState().resetFlow();

    expect(authApi.clearPasswordResetSession).toHaveBeenCalledTimes(1);
    expect(usePasswordResetStore.getState()).toMatchObject({
      step: 'idle',
      email: '',
      otp2Failures: 0,
      expiresAt: null,
    });
  });
});
