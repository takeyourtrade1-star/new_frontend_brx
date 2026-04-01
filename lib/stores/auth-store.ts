'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  UserPreferences,
  LoginCredentials,
  RegisterData,
  VerifyMFAData,
  TokenResponse,
  PreAuthTokenResponse,
  UserResponse,
} from '@/types';
import { authApi } from '@/lib/api/auth-client';
import { parseAuthError } from '@/lib/api/auth-error';
import { config } from '@/lib/config';
import {
  clearMfaPreAuthToken,
  saveMfaPreAuthToken,
} from '@/lib/auth/mfa-session';

/** Default preferences when backend does not return them */
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'it',
  is_onboarding_completed: false,
};

/** Normalize user so preferences always has shape */
function normalizeUser(user: UserResponse | User | null): User | null {
  if (!user) return null;

  const prefs = (user as UserResponse).preferences;
  const preferences: UserPreferences = {
    theme: (prefs?.theme ?? DEFAULT_PREFERENCES.theme) as
      | 'light'
      | 'dark'
      | 'system',
    language: prefs?.language ?? DEFAULT_PREFERENCES.language,
    is_onboarding_completed:
      prefs?.is_onboarding_completed ??
      DEFAULT_PREFERENCES.is_onboarding_completed,
  };

  const u = user as UserResponse & { name?: string | null; image?: string | null; country?: string };
  return {
    id: user.id,
    email: user.email,
    name: u.name ?? null,
    image: u.image ?? null,
    account_status: (user as UserResponse).account_status,
    mfa_enabled: (user as UserResponse).mfa_enabled,
    created_at: (user as UserResponse).created_at,
    preferences,
    country: u.country ?? undefined,
  };
}

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // MFA State
  preAuthToken: string | null;
  mfaRequired: boolean;
  /** Messaggio one-time (es. "Login avvenuto con successo"); non persistito. */
  flashMessage: string | null;
  /** Errori per campo dalla registrazione (422); usato solo dai form di registrazione. */
  registrationFieldErrors: Record<string, string> | null;
  /** True se la sessione è scaduta lato server (usato per mostrare banner senza redirect). */
  sessionExpired: boolean;

  // Actions
  login: (
    credentials: LoginCredentials
  ) => Promise<{ mfaRequired: boolean; preAuthToken?: string }>;
  verifyMFA: (data: VerifyMFAData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  updateUserPreferences: (
    preferences: Partial<UserPreferences>
  ) => void;
  setToken: (accessToken: string, refreshToken?: string) => void;
  clearError: () => void;
  setFlashMessage: (message: string | null) => void;
  initializeAuth: () => Promise<void>;
  fetchUser: () => Promise<User | null>;
  handleSessionExpired: () => void;
  setSessionExpired: (value: boolean) => void;
  /** Mock login for UI development without backend */
  mockLogin: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      preAuthToken: null,
      mfaRequired: false,
      flashMessage: null,
      registrationFieldErrors: null,
      sessionExpired: false,

      // Initialize auth: refresh proattivo se c'è refresh_token, poi valida con /api/auth/me
      initializeAuth: async () => {
        let accessToken: string | null =
          typeof window !== 'undefined'
            ? localStorage.getItem(config.auth.tokenKey)
            : null;
        const refreshToken =
          typeof window !== 'undefined'
            ? localStorage.getItem(config.auth.refreshTokenKey)
            : null;
        const userStr =
          typeof window !== 'undefined'
            ? localStorage.getItem(config.auth.userKey)
            : null;

        // Se c'è refresh_token, rinnoviamo subito l'access token (anche dopo F5 o token scaduto)
        if (refreshToken && typeof window !== 'undefined') {
          try {
            const refreshRes = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken }),
              credentials: 'same-origin',
            });
            const refreshData = await refreshRes.json().catch(() => ({}));
            const newAccess =
              (refreshData?.data?.access_token ?? refreshData?.access_token) as string | undefined;
            const newRefresh =
              (refreshData?.data?.refresh_token ?? refreshData?.refresh_token) as string | undefined;
            if (newAccess && refreshRes.ok) {
              authApi.setToken(newAccess, newRefresh);
              set({ accessToken: newAccess, isAuthenticated: true, sessionExpired: false });
              accessToken = newAccess;
            } else if (refreshToken) {
              // refresh_token presente ma risposta non ok (scaduto/revocato) → logout
              await get().logout();
              return;
            }
          } catch {
            // errore di rete: proseguiamo, /me con token vecchio potrebbe far scattare refresh in interceptor
          }
        }

        if (accessToken) {
          try {
            authApi.setToken(accessToken);
            const response = (await authApi.get('/api/auth/me')) as any;
            // Stesso ordine di fetchUser: il client restituisce già il body UserResponse (flat), non { user: ... }
            let user =
              response?.user ??
              response?.data?.user ??
              response?.data ??
              response;
            if (
              !user ||
              typeof user !== 'object' ||
              (user.id === undefined && user.email === undefined)
            ) {
              user = userStr ? JSON.parse(userStr) : null;
            }

            if (user) {
              const normalized = normalizeUser(user);
              if (normalized) {
                if (typeof window !== 'undefined') {
                  localStorage.setItem(
                    config.auth.userKey,
                    JSON.stringify(normalized)
                  );
                }
                set({
                  user: normalized,
                  accessToken: accessToken,
                  isAuthenticated: true,
                  sessionExpired: false,
                });
              } else {
                await get().logout();
              }
            } else {
              await get().logout();
            }
          } catch {
            if (!refreshToken) {
              await get().logout();
            } else {
              set({ user: null, accessToken: null, isAuthenticated: false, sessionExpired: false });
            }
          }
        } else {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            sessionExpired: false,
          });
        }
      },

      // fetchUser: ricarica l'utente da /api/auth/me
      fetchUser: async (): Promise<User | null> => {
        const token =
          get().accessToken ||
          (typeof window !== 'undefined'
            ? localStorage.getItem(config.auth.tokenKey)
            : null);
        if (!token) {
          set({ isLoading: false });
          return null;
        }
        if (get().isLoading) {
          return get().user;
        }
        set({ isLoading: true });
        try {
          authApi.setToken(token);
          const response = (await authApi.get('/api/auth/me')) as any;
          // Backend FastAPI: GET /api/auth/me restituisce UserResponse direttamente
          const user =
            response?.user ?? response?.data?.user ?? response?.data ?? response;

          if (
            user &&
            typeof user === 'object' &&
            (user.id !== undefined || user.email !== undefined)
          ) {
            const normalized = normalizeUser(user as UserResponse);
            if (normalized) {
              if (typeof window !== 'undefined') {
                localStorage.setItem(
                  config.auth.userKey,
                  JSON.stringify(normalized)
                );
              }
              set({
                user: normalized,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              return normalized;
            } else {
              set({ isLoading: false, user: null });
              return null;
            }
          } else {
            set({ isLoading: false, user: null });
            return null;
          }
        } catch (err: any) {
          const status = err?.response?.status;
          console.error('[authStore.fetchUser] Errore:', status, err?.message);
          set({ isLoading: false, user: null });
          return null;
        }
      },

      // Login
      login: async (credentials: LoginCredentials) => {
        clearMfaPreAuthToken();
        set({
          isLoading: true,
          error: null,
          mfaRequired: false,
          preAuthToken: null,
          sessionExpired: false,
        });

        try {
          // Costruisci payload includendo SOLO email O username, mai entrambi
          // [DEV CHECK] Verifica in DevTools Network che il body abbia:
          // - Solo "email" se presente in credentials
          // - Solo "username" se presente in credentials  
          // - MAI entrambi contemporaneamente
          // - Sempre "website_url": "" (honeypot)
          const payload: Record<string, string> = {
            password: credentials.password,
            website_url: credentials.website_url || '', // Honeypot field - must be empty string
          };
          
          if ('email' in credentials && credentials.email) {
            payload.email = credentials.email;
          } else if ('username' in credentials && credentials.username) {
            payload.username = credentials.username;
          }

          const raw = (await authApi.post(
            '/api/auth/login',
            payload
          )) as PreAuthTokenResponse | TokenResponse | Record<string, unknown>;

          // Proxy / backend possono avere body { data: { ... } }
          const response = (raw as { data?: unknown }).data ?? raw;

          // Handle MFA response (Scenario 2)
          if (
            response &&
            typeof response === 'object' &&
            'mfa_required' in response &&
            (response as PreAuthTokenResponse).mfa_required === true &&
            'pre_auth_token' in response &&
            typeof (response as PreAuthTokenResponse).pre_auth_token === 'string'
          ) {
            const pre = (response as PreAuthTokenResponse).pre_auth_token;
            // Nessun access token valido in questo step: evita Bearer vecchi → 401 → forceLogout su /me
            authApi.clearToken();
            saveMfaPreAuthToken(pre);
            set({
              preAuthToken: pre,
              mfaRequired: true,
              isLoading: false,
              error: null,
              isAuthenticated: false,
              user: null,
              accessToken: null,
            });
            return {
              mfaRequired: true,
              preAuthToken: pre,
            };
          }

          // Handle direct login response (Scenario 1)
          if (
            response &&
            typeof response === 'object' &&
            'access_token' in response &&
            'refresh_token' in response
          ) {
            const { access_token, refresh_token } = response as TokenResponse;

            if (access_token && refresh_token) {
              // Salva entrambi i token
              authApi.setToken(access_token, refresh_token);

              // Fetch user from /me endpoint
              let userToSet: UserResponse | null = null;
              try {
                const meResponse = (await authApi.get('/api/auth/me')) as any;
                userToSet =
                  meResponse.user ||
                  meResponse.data?.user ||
                  meResponse.data ||
                  meResponse;
              } catch (meError) {
                // If /me fails, still set authenticated but without user
              }

              const normalized = userToSet ? normalizeUser(userToSet) : null;
              if (normalized && typeof window !== 'undefined') {
                localStorage.setItem(
                  config.auth.userKey,
                  JSON.stringify(normalized)
                );
              }
              set({
                user: normalized,
                accessToken: access_token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                flashMessage: 'Login avvenuto con successo',
              });
              return { mfaRequired: false };
            } else {
              throw new Error('Login fallito: token mancanti');
            }
          } else {
            throw new Error('Risposta login non valida');
          }
        } catch (error: any) {
          // Usa parseAuthError per gestire tutti i formati di errore
          const parsed = parseAuthError(error);

          clearMfaPreAuthToken();
          set({
            isLoading: false,
            error: parsed.message,
            isAuthenticated: false,
            mfaRequired: false,
            preAuthToken: null,
          });

          throw error;
        }
      },

      // Verify MFA
      verifyMFA: async (data: VerifyMFAData) => {
        set({ isLoading: true, error: null });

        try {
          const response = (await authApi.post(
            '/api/auth/verify-mfa',
            data
          )) as TokenResponse;

          const { access_token, refresh_token } = response;

          if (access_token && refresh_token) {
            // Salva entrambi i token
            authApi.setToken(access_token, refresh_token);

            // Fetch user from /me endpoint
            let userToSet: UserResponse | null = null;
            try {
              const meResponse = (await authApi.get('/api/auth/me')) as any;
              userToSet =
                meResponse.user ||
                meResponse.data?.user ||
                meResponse.data ||
                meResponse;
            } catch (meError) {
              // If /me fails, still set authenticated but without user
            }

            const normalized = userToSet ? normalizeUser(userToSet) : null;
            if (normalized && typeof window !== 'undefined') {
              localStorage.setItem(
                config.auth.userKey,
                JSON.stringify(normalized)
              );
            }
            clearMfaPreAuthToken();
            set({
              user: normalized,
              accessToken: access_token,
              isAuthenticated: true,
              mfaRequired: false,
              preAuthToken: null,
              isLoading: false,
              error: null,
              flashMessage: 'Autenticazione completata con successo',
            });
          } else {
            throw new Error('Verifica MFA fallita: token mancanti');
          }
        } catch (error: any) {
          // Usa parseAuthError per gestire tutti i formati di errore
          const parsed = parseAuthError(error);

          set({
            isLoading: false,
            error: parsed.message,
            isAuthenticated: false,
          });

          throw error;
        }
      },

      // Register (solo registrazione: non toccare login)
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null, registrationFieldErrors: null });

        try {
          // Honeypot: backend richiede website_url sempre ""
          const payload = {
            ...data,
            website_url: data.website_url ?? '',
          };

          const response = (await authApi.post(
            '/api/auth/register',
            payload
          )) as UserResponse | TokenResponse;

          // Se la registrazione restituisce token (auto-login), gestiscili
          if ('access_token' in response && 'refresh_token' in response) {
            const { access_token, refresh_token } = response;
            authApi.setToken(access_token, refresh_token);

            // Fetch user
            let userToSet: UserResponse | null = null;
            try {
              const meResponse = (await authApi.get('/api/auth/me')) as any;
              userToSet =
                meResponse.user ||
                meResponse.data?.user ||
                meResponse.data ||
                meResponse;
            } catch (meError) {
              // If /me fails, still set authenticated but without user
            }

            const normalized = userToSet ? normalizeUser(userToSet) : null;
            if (normalized && typeof window !== 'undefined') {
              localStorage.setItem(
                config.auth.userKey,
                JSON.stringify(normalized)
              );
            }
            set({
              user: normalized,
              accessToken: access_token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              flashMessage: 'Registrazione completata con successo',
            });
          } else {
            // Registrazione avvenuta ma senza auto-login (verifica email richiesta)
            set({
              isLoading: false,
              error: null,
              flashMessage:
                'Registrazione completata. Verifica la tua email per attivare l\'account.',
            });
          }
        } catch (error: any) {
          // Usa parseAuthError per normalizzare l'errore
          const parsed = parseAuthError(error);
          let fieldErrors = parsed.fieldErrors ?? null;

          // Se non ci sono fieldErrors ma abbiamo uno status 409, costruiscili manualmente
          if (!fieldErrors && parsed.status === 409) {
            const lowerMsg = parsed.message.toLowerCase();
            if (lowerMsg.includes('username')) {
              fieldErrors = { username: parsed.message };
            } else if (lowerMsg.includes('email')) {
              fieldErrors = { email: parsed.message };
            }
          }

          set({
            isLoading: false,
            error: parsed.message,
            registrationFieldErrors: fieldErrors,
          });

          throw error;
        }
      },

      // Logout
      logout: async () => {
        const accessToken =
          typeof window !== 'undefined'
            ? localStorage.getItem(config.auth.tokenKey)
            : null;
        const refreshToken =
          typeof window !== 'undefined'
            ? localStorage.getItem(config.auth.refreshTokenKey)
            : null;

        // Chiama l'endpoint di logout per invalidare la sessione sul server
        if (accessToken && refreshToken) {
          try {
            await authApi.post('/api/auth/logout', {
              refresh_token: refreshToken,
            });
          } catch (error) {
            // Anche se il logout fallisce, procediamo con la pulizia client-side
          }
        }

        // Pulisci i token e lo stato (anche se il logout API è fallito)
        authApi.clearToken();
        clearMfaPreAuthToken();

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
          mfaRequired: false,
          preAuthToken: null,
          flashMessage: null,
        });
      },

      // Set user (normalize preferences) and mark as authenticated
      setUser: (user: User) => {
        const normalized = normalizeUser(user as UserResponse);
        if (normalized) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              config.auth.userKey,
              JSON.stringify(normalized)
            );
          }
          set({ user: normalized, isAuthenticated: true });
        }
      },

      // Aggiorna preferenze in memoria
      updateUserPreferences: (prefs) => {
        set((state) => {
          if (!state.user) return state;
          const prev = state.user.preferences || DEFAULT_PREFERENCES;
          const updatedUser = {
            ...state.user,
            preferences: {
              ...prev,
              ...prefs,
              is_onboarding_completed:
                prefs.is_onboarding_completed ??
                prev.is_onboarding_completed ??
                false,
            },
          };
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(
                config.auth.userKey,
                JSON.stringify(updatedUser)
              );
            } catch (_) {}
          }
          return { user: updatedUser };
        });
      },

      // Set token
      setToken: (accessToken: string, refreshToken?: string) => {
        authApi.setToken(accessToken, refreshToken);
        set({ accessToken: accessToken, isAuthenticated: true });
      },

      // Clear error (e errori per campo registrazione)
      clearError: () => {
        set({ error: null, registrationFieldErrors: null });
      },

      // Set flash message
      setFlashMessage: (message) => {
        set({ flashMessage: message });
      },
      // Gestione scadenza sessione (es. 401 globali)
      handleSessionExpired: () => {
        clearMfaPreAuthToken();
        set({
          sessionExpired: true,
          user: null,
          accessToken: null,
          isAuthenticated: false,
          mfaRequired: false,
          preAuthToken: null,
        });
      },
      setSessionExpired: (value: boolean) => {
        set({ sessionExpired: value });
      },

      // Mock login for UI development without backend
      mockLogin: () => {
        if (process.env.NODE_ENV !== 'development') return;

        const mockUser: User = {
          id: 'mock-user-001',
          email: 'dev@ebartex.com',
          name: 'Developer Mock',
          image: null,
          account_status: 'active',
          mfa_enabled: false,
          created_at: new Date().toISOString(),
          country: 'IT',
          preferences: {
            theme: 'system',
            language: 'it',
            is_onboarding_completed: true,
          },
        };

        const mockToken = 'mock-access-token-for-dev-ui';
        const mockRefreshToken = 'mock-refresh-token-for-dev-ui';

        // Salva in localStorage come farebbe un vero login
        if (typeof window !== 'undefined') {
          localStorage.setItem(config.auth.tokenKey, mockToken);
          localStorage.setItem(config.auth.refreshTokenKey, mockRefreshToken);
          localStorage.setItem(config.auth.userKey, JSON.stringify(mockUser));
        }

        // Imposta nello store
        authApi.setToken(mockToken, mockRefreshToken);
        set({
          user: mockUser,
          accessToken: mockToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          mfaRequired: false,
          preAuthToken: null,
          flashMessage: 'Mock login attivo - Backend offline',
        });
      },
    }),
    {
      name: 'ebartex-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        // Persiste il flusso MFA tra reload / navigazione (token breve, come sessione login)
        preAuthToken: state.preAuthToken,
        mfaRequired: state.mfaRequired,
      }),
      merge: (persisted, current) => ({
        ...current,
        user: (persisted as { user: User | null }).user ?? null,
        accessToken:
          (persisted as { accessToken: string | null }).accessToken ?? null,
        isAuthenticated:
          (persisted as { isAuthenticated: boolean }).isAuthenticated ?? false,
        preAuthToken:
          (persisted as { preAuthToken: string | null }).preAuthToken ?? null,
        mfaRequired:
          (persisted as { mfaRequired: boolean }).mfaRequired ?? false,
        flashMessage: null, // Non persistire flashMessage
      }),
    }
  )
);
