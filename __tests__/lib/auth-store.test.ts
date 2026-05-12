import { beforeEach, describe, expect, it, vi } from 'vitest';

const authApiMock = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  requestLoginCode: vi.fn(),
  verifyLoginCode: vi.fn(),
}));

vi.mock('@/lib/api/auth-client', () => ({
  authApi: authApiMock,
}));

describe('useAuthStore.verifyMFA', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_AUTH_API_URL = 'http://auth.test';
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('accepts token responses nested under data', async () => {
    authApiMock.post.mockResolvedValueOnce({
      data: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_type: 'bearer',
      },
    });
    authApiMock.get.mockResolvedValueOnce({
      data: {
        id: 'user-1',
        email: 'user@example.com',
        account_status: 'active',
        mfa_enabled: true,
        created_at: '2026-05-12T00:00:00.000Z',
      },
    });

    const { useAuthStore } = await import('@/lib/stores/auth-store');

    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      preAuthToken: 'pre-auth-token',
      mfaRequired: true,
      flashMessage: null,
      registrationFieldErrors: null,
      sessionExpired: false,
    });
    sessionStorage.setItem('ebartex_pre_auth_token', 'pre-auth-token');

    await useAuthStore.getState().verifyMFA({
      pre_auth_token: 'pre-auth-token',
      mfa_code: '123456',
    });

    expect(authApiMock.setToken).toHaveBeenCalledWith('access-token', 'refresh-token');
    expect(authApiMock.get).toHaveBeenCalledWith('/api/auth/me');
    expect(sessionStorage.getItem('ebartex_pre_auth_token')).toBeNull();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('access-token');
    expect(state.mfaRequired).toBe(false);
    expect(state.user?.id).toBe('user-1');
  });
});
