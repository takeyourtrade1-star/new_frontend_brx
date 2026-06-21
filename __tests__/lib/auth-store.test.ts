import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MFA_PRE_AUTH_SESSION_KEY } from '@/lib/auth/mfa-session';
import { authApi } from '@/lib/api/auth-client';
import { useAuthStore } from '@/lib/stores/auth-store';

vi.mock('@/lib/api/refresh-token', () => ({
  tokenManager: {
    ensureFreshToken: vi.fn(async () => null),
  },
  stopProactiveRefresh: vi.fn(),
}));

const initialAuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  preAuthToken: null,
  mfaRequired: false,
  flashMessage: null,
  authError: null,
  registrationFieldErrors: null,
  sessionExpired: false,
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  useAuthStore.setState(initialAuthState);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAuthStore.verifyMFA', () => {
  it('accetta token annidati nella risposta del proxy auth', async () => {
    const postSpy = vi.spyOn(authApi, 'post').mockResolvedValue({
      data: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_type: 'bearer',
      },
    });
    vi.spyOn(authApi, 'get').mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'user@example.com',
        },
      },
    });
    const setTokenSpy = vi
      .spyOn(authApi, 'setToken')
      .mockImplementation(() => undefined);

    sessionStorage.setItem(MFA_PRE_AUTH_SESSION_KEY, 'pre-auth-token');
    useAuthStore.setState({
      preAuthToken: 'pre-auth-token',
      mfaRequired: true,
    });

    await useAuthStore.getState().verifyMFA({
      pre_auth_token: 'pre-auth-token',
      mfa_code: '123456',
      remember_device: false,
    });

    expect(postSpy).toHaveBeenCalledWith('/api/auth/verify-mfa', {
      pre_auth_token: 'pre-auth-token',
      mfa_code: '123456',
      remember_device: false,
    });
    expect(setTokenSpy).toHaveBeenCalledWith('access-token', 'refresh-token');
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'access-token',
      isAuthenticated: true,
      mfaRequired: false,
      preAuthToken: null,
      error: null,
    });
    expect(sessionStorage.getItem(MFA_PRE_AUTH_SESSION_KEY)).toBeNull();
  });
});
