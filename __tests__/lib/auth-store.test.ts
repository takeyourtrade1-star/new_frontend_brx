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

  describe('registration email verification', () => {
    it('returns verification_pending and forwards the idempotency key', async () => {
      const pending = {
        status: 'verification_pending' as const,
        flow_id: '0198f65d-88e7-7f38-9c71-6b28ea26eb9d',
        destination: 't***@example.com',
        expires_at: '2026-07-13T15:20:00Z',
        resend_available_at: '2026-07-13T15:01:00Z',
        delivery_status: 'queued' as const,
      };
      vi.mocked(authApi.post).mockResolvedValue(pending);

      const result = await useAuthStore.getState().register(
        {
          username: 'test_user',
          email: 'test@example.com',
          password: 'Password1',
          account_type: 'personal',
          country: 'IT',
          phone_prefix: '+39',
          phone: '3331234567',
          first_name: 'Test',
          last_name: 'User',
          termsAccepted: true,
          specificClausesAccepted: true,
          privacyAccepted: true,
          cancellationAccepted: true,
          adultConfirmed: true,
          website_url: '',
        },
        'registration-idempotency-key'
      );

      expect(result).toEqual(pending);
      expect(authApi.post).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({ email: 'test@example.com', website_url: '' }),
        { headers: { 'Idempotency-Key': 'registration-idempotency-key' } }
      );
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().flashMessage).toBeNull();
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

    it('logout({ silent: true }) pulisce lo store senza flash di successo', async () => {
      useAuthStore.setState({
        user: mockUser,
        accessToken: 'access_123',
        isAuthenticated: true,
      });
      localStorage.setItem('ebartex_access_token', 'access_123');
      localStorage.setItem('ebartex_refresh_token', 'refresh_123');

      await useAuthStore.getState().logout({ silent: true });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      // Logout automatico (es. sessione scaduta): nessun toast "Disconnessione…"
      expect(state.flashMessage).toBeNull();
    });
  });

  describe('preAuthToken persistence', () => {
    it('il preAuthToken MFA NON viene persistito in localStorage (vive in sessionStorage)', async () => {
      useAuthStore.setState({
        preAuthToken: 'pre_auth_not_persisted',
        mfaRequired: true,
      });

      // Forza la persistenza a scrivere nello storage
      await useAuthStore.persist.rehydrate();

      const raw = localStorage.getItem('ebartex-auth');
      expect(raw).toBeTruthy();
      const persisted = JSON.parse(raw!);
      // Superficie ridotta: il flusso MFA tra reload passa da sessionStorage
      // (lib/auth/mfa-session.ts), non dallo store persistito.
      expect(persisted.state.preAuthToken).toBeUndefined();
      expect(persisted.state.mfaRequired).toBeUndefined();
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

    it('logout azzera authError/error e imposta flashMessage atomicamente con isAuthenticated', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        accessToken: 'access_123',
        authError: 'Errore precedente',
        error: 'Altro errore',
      });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.authError).toBeNull();
      expect(state.error).toBeNull();
      // flashMessage di logout impostato nello stesso set() di isAuthenticated=false
      expect(state.flashMessage).toBe('Disconnessione avvenuta con successo');
    });
  });

  describe('login passwordless (codice via email)', () => {
    it('requestLoginCode chiama l\'API e azzera loading/error', async () => {
      vi.mocked(authApi.requestLoginCode).mockResolvedValue({ message: 'Codice inviato' });

      await useAuthStore.getState().requestLoginCode('test@example.com');

      expect(authApi.requestLoginCode).toHaveBeenCalledWith('test@example.com');
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('requestLoginCode in errore imposta error e rilancia', async () => {
      vi.mocked(authApi.requestLoginCode).mockRejectedValue(new Error('Email non valida'));

      await expect(
        useAuthStore.getState().requestLoginCode('bad')
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('verifyLoginCode con token diretti → autenticato, flash, utente caricato', async () => {
      vi.mocked(authApi.verifyLoginCode).mockResolvedValue({
        access_token: 'access_code',
        refresh_token: 'refresh_code',
        token_type: 'bearer',
      });
      vi.mocked(fetchMe).mockResolvedValue(mockUser);

      const result = await useAuthStore.getState().verifyLoginCode('test@example.com', '123456');

      expect(result).toEqual({ mfaRequired: false });
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe('access_code');
      expect(state.user).toEqual(mockUser);
      expect(state.flashMessage).toBe('Login avvenuto con successo');
    });

    it('verifyLoginCode con MFA richiesta → preAuthToken e mfaRequired, non autenticato', async () => {
      vi.mocked(authApi.verifyLoginCode).mockResolvedValue({
        mfa_required: true,
        pre_auth_token: 'pre_code_123',
      });

      const result = await useAuthStore.getState().verifyLoginCode('test@example.com', '123456');

      expect(result).toEqual({ mfaRequired: true, preAuthToken: 'pre_code_123' });
      const state = useAuthStore.getState();
      expect(state.mfaRequired).toBe(true);
      expect(state.preAuthToken).toBe('pre_code_123');
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
    });
  });
});
