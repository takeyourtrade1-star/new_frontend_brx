import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authApi } from '@/lib/api/auth-client';
import { fetchMe } from '@/lib/auth/fetch-me';
import type { User } from '@/types';

vi.mock('@/lib/api/auth-client', () => ({
  authApi: {
    post: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn(),
    requestLoginCode: vi.fn(),
    verifyLoginCode: vi.fn(),
  },
}));

vi.mock('@/lib/auth/fetch-me', () => ({
  fetchMe: vi.fn(),
}));

vi.mock('@/lib/api/refresh-token', () => ({
  stopProactiveRefresh: vi.fn(),
}));

vi.mock('@/lib/auth/mfa-session', () => ({
  clearMfaPreAuthToken: vi.fn(),
  saveMfaPreAuthToken: vi.fn(),
}));

vi.mock('@/lib/config/tournaments', () => ({
  isTournamentsTransitionPath: vi.fn().mockReturnValue(false),
}));

const mockUser: User = {
  id: 'user_123',
  name: 'Test User',
  email: 'test@example.com',
  preferences: {
    language: 'it',
    currency: 'EUR',
    country: 'IT',
    is_onboarding_completed: true,
  },
} as unknown as User;

describe('auth-store', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    await useAuthStore.persist.clearStorage();
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
  });

  describe('login', () => {
    it('login diretto con email → autenticato, flash message e utente caricato', async () => {
      const post = vi.mocked(authApi.post);
      post.mockResolvedValue({
        access_token: 'access_123',
        refresh_token: 'refresh_123',
      });
      vi.mocked(fetchMe).mockResolvedValue(mockUser);

      const result = await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password',
        website_url: '',
      });

      expect(result).toEqual({ mfaRequired: false });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().accessToken).toBe('access_123');
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().flashMessage).toBe('Login avvenuto con successo');
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('login con MFA abilitato → redirect logico a verify-mfa', async () => {
      const post = vi.mocked(authApi.post);
      post.mockResolvedValue({
        mfa_required: true,
        pre_auth_token: 'pre_auth_123',
      });

      const result = await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password',
        website_url: '',
      });

      expect(result).toEqual({ mfaRequired: true, preAuthToken: 'pre_auth_123' });
      expect(useAuthStore.getState().mfaRequired).toBe(true);
      expect(useAuthStore.getState().preAuthToken).toBe('pre_auth_123');
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('login fallito → errore, non autenticato, nessun token', async () => {
      const post = vi.mocked(authApi.post);
      post.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        useAuthStore.getState().login({
          email: 'test@example.com',
          password: 'wrong',
          website_url: '',
        })
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.error).toBeTruthy();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('verifyMFA', () => {
    it('verifica MFA valida → autenticato e stato MFA pulito', async () => {
      const post = vi.mocked(authApi.post);
      post.mockResolvedValue({
        access_token: 'access_mfa',
        refresh_token: 'refresh_mfa',
      });
      vi.mocked(fetchMe).mockResolvedValue(mockUser);

      await useAuthStore.getState().verifyMFA({
        mfa_code: '123456',
        pre_auth_token: 'pre_auth_123',
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.mfaRequired).toBe(false);
      expect(state.preAuthToken).toBeNull();
      expect(state.accessToken).toBe('access_mfa');
      expect(state.user).toEqual(mockUser);
      expect(state.flashMessage).toBe('Autenticazione completata con successo');
    });

    it('verifica MFA scaduta → errore e non autenticato', async () => {
      const post = vi.mocked(authApi.post);
      post.mockRejectedValue(new Error('Invalid code'));

      await expect(
        useAuthStore.getState().verifyMFA({
          mfa_code: '000000',
          pre_auth_token: 'pre_auth_123',
        })
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeTruthy();
      expect(state.mfaRequired).toBe(false);
    });
  });

  describe('logout', () => {
    it('logout pulisce store e imposta flash message', async () => {
      useAuthStore.setState({
        user: mockUser,
        accessToken: 'access_123',
        isAuthenticated: true,
      });
      localStorage.setItem('ebartex_access_token', 'access_123');
      localStorage.setItem('ebartex_refresh_token', 'refresh_123');

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.flashMessage).toBe('Disconnessione avvenuta con successo');
    });
  });

  describe('preAuthToken persistence', () => {
    it('il preAuthToken MFA viene persistito nello storage', async () => {
      useAuthStore.setState({
        preAuthToken: 'pre_auth_persisted',
        mfaRequired: true,
      });

      // Forza la persistenza a scrivere nello storage
      await useAuthStore.persist.rehydrate();

      const raw = localStorage.getItem('ebartex-auth');
      expect(raw).toBeTruthy();
      const persisted = JSON.parse(raw!);
      expect(persisted.state.preAuthToken).toBe('pre_auth_persisted');
      expect(persisted.state.mfaRequired).toBe(true);
    });


  });

  describe('flashMessage + isAuthenticated race', () => {
    it('setFlashMessage pulisce solo il messaggio senza toccare autenticazione', () => {
      useAuthStore.setState({
        isAuthenticated: true,
        accessToken: 'access_123',
        flashMessage: 'Login avvenuto con successo',
      });

      useAuthStore.getState().setFlashMessage(null);

      const state = useAuthStore.getState();
      expect(state.flashMessage).toBeNull();
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe('access_123');
    });
  });
});
