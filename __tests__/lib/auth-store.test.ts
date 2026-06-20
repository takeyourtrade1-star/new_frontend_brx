import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/lib/stores/auth-store';
import type { RegisterData } from '@/types';

const authApiMock = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  setToken: vi.fn(),
}));

vi.mock('@/lib/api/auth-client', () => ({
  authApi: authApiMock,
  default: authApiMock,
}));

vi.mock('@/lib/api/refresh-token', () => ({
  stopProactiveRefresh: vi.fn(),
}));

const user = {
  id: 'user-1',
  email: 'utente@example.com',
  account_status: 'active',
  mfa_enabled: false,
  created_at: '2026-06-20T00:00:00.000Z',
};

const registerPayload: RegisterData = {
  username: 'utente',
  email: 'utente@example.com',
  password: 'Password123!',
  account_type: 'personal',
  country: 'IT',
  phone_prefix: '+39',
  phone: '3331234567',
  first_name: 'Mario',
  last_name: 'Rossi',
  termsAccepted: true,
  privacyAccepted: true,
  cancellationAccepted: true,
  adultConfirmed: true,
};

function resetAuthStore() {
  useAuthStore.setState({
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
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  authApiMock.post.mockReset();
  authApiMock.get.mockReset();
  authApiMock.setToken.mockReset();
  resetAuthStore();
});

describe('auth store registration', () => {
  it('authenticates when register returns tokens nested under data', async () => {
    authApiMock.post.mockResolvedValueOnce({
      data: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_type: 'bearer',
      },
    });
    authApiMock.get.mockResolvedValueOnce(user);

    await useAuthStore.getState().register(registerPayload);

    expect(authApiMock.setToken).toHaveBeenCalledWith('access-token', 'refresh-token');
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'access-token',
      isAuthenticated: true,
      flashMessage: 'Registrazione completata con successo',
    });
  });

  it('keeps the user unauthenticated when registration requires email verification', async () => {
    authApiMock.post.mockResolvedValueOnce({ message: 'verification required' });

    await useAuthStore.getState().register(registerPayload);

    expect(authApiMock.setToken).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      isAuthenticated: false,
      flashMessage: "Registrazione completata. Verifica la tua email per attivare l'account.",
    });
  });
});

describe('auth store MFA verification', () => {
  it('authenticates when verify-mfa returns tokens nested under data', async () => {
    authApiMock.post.mockResolvedValueOnce({
      data: {
        access_token: 'mfa-access-token',
        refresh_token: 'mfa-refresh-token',
        token_type: 'bearer',
      },
    });
    authApiMock.get.mockResolvedValueOnce(user);

    await useAuthStore.getState().verifyMFA({
      pre_auth_token: 'pre-auth-token',
      mfa_code: '123456',
    });

    expect(authApiMock.setToken).toHaveBeenCalledWith('mfa-access-token', 'mfa-refresh-token');
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'mfa-access-token',
      isAuthenticated: true,
      mfaRequired: false,
      preAuthToken: null,
      flashMessage: 'Login avvenuto con successo',
    });
  });
});
