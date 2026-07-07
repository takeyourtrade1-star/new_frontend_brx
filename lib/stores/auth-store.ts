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
  LoginResponse,
} from '@/types';
import { authApi } from '@/lib/api/auth-client';
import { parseAuthError } from '@/lib/api/auth-error';
import { fetchMe } from '@/lib/auth/fetch-me';
import { normalizeUser, DEFAULT_PREFERENCES } from '@/lib/auth/normalize-user';
import { stopProactiveRefresh } from '@/lib/api/refresh-token';

/** Promise in-flight per deduplicare chiamate concorrenti a fetchUser */
let fetchUserPromise: Promise<User | null> | null = null;
import { config } from '@/lib/config';
import { isTournamentsTransitionPath } from '@/lib/config/tournaments';
import {
  clearMfaPreAuthToken,
  saveMfaPreAuthToken,
} from '@/lib/auth/mfa-session';

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
  /** Errore di autenticazione one-time (es. "Password errata"); non persistito. */
  authError: string | null;
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
  /** `silent: true` per i logout automatici (es. sessione scaduta): niente toast di successo. */
  logout: (opts?: { silent?: boolean }) => Promise<void>;
  setUser: (user: User) => void;
  updateUserName: (name: string) => void;
  updateUserPreferences: (
    preferences: Partial<UserPreferences>
  ) => void;
  setToken: (accessToken: string, refreshToken?: string) => void;
  clearError: () => void;
  setFlashMessage: (message: string | null) => void;
  setAuthError: (message: string | null) => void;
  initializeAuth: () => Promise<void>;
  fetchUser: () => Promise<User | null>;
  handleSessionExpired: () => void;
  setSessionExpired: (value: boolean) => void;
  requestLoginCode: (email: string) => Promise<void>;
  verifyLoginCode: (
    email: string,
    code: string
  ) => Promise<{ mfaRequired: boolean; preAuthToken?: string }>;
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
      authError: null,
      registrationFieldErrors: null,
      sessionExpired: false,

      // Initialize auth: refresh proattivo se c'è refresh_token, poi valida con /api/auth/me
      initializeAuth: async () => {
        if (typeof window !== 'undefined' && isTournamentsTransitionPath()) {
          return;
        }

        let accessToken: string | null =
          typeof window !== 'undefined'
            ? localStorage.getItem(config.auth.tokenKey)
            : null;
        let refreshToken =
          typeof window !== 'undefined'
            ? localStorage.getItem(config.auth.refreshTokenKey)
            : null;
        // SSO: sessione da tornei.ebartex.com (cookie parent-domain) → sync localStorage
        if (!refreshToken && typeof window !== 'undefined') {
          try {
            const bridgeRes = await fetch('/api/auth/bridge', { credentials: 'same-origin' });
            if (bridgeRes.ok) {
              const bridgeData = await bridgeRes.json().catch(() => ({}));
              const bridgedAccess =
                (bridgeData?.access_token ?? bridgeData?.data?.access_token) as string | undefined;
              const bridgedRefresh =
                (bridgeData?.refresh_token ?? bridgeData?.data?.refresh_token) as string | undefined;
              if (bridgedAccess && bridgedRefresh) {
                authApi.setToken(bridgedAccess, bridgedRefresh);
                localStorage.setItem(config.auth.tokenKey, bridgedAccess);
                localStorage.setItem(config.auth.refreshTokenKey, bridgedRefresh);
                set({ accessToken: bridgedAccess, isAuthenticated: true, sessionExpired: false });
                accessToken = bridgedAccess;
                refreshToken = bridgedRefresh;
              }
            }
          } catch {
            // Nessuna sessione condivisa — utente ospite
          }
        }

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
              // refresh_token presente ma risposta non ok (scaduto/revocato):
              // logout silenzioso + toast d'errore, NON il flash "Disconnessione
              // avvenuta con successo" (l'utente non ha chiesto il logout).
              await get().logout({ silent: true });
              set({
                sessionExpired: true,
                authError: 'La sessione è scaduta. Accedi di nuovo.',
              });
              return;
            }
          } catch {
            // errore di rete: proseguiamo, /me con token vecchio potrebbe far scattare refresh in interceptor
          }
        }

        if (accessToken) {
          try {
            authApi.setToken(accessToken);
            const normalized = await fetchMe();
            if (normalized) {
              set({
                user: normalized,
                accessToken: accessToken,
                isAuthenticated: true,
                sessionExpired: false,
              });
            } else {
              // Fallback a user cacheato in localStorage
              const cached =
                typeof window !== 'undefined'
                  ? localStorage.getItem(config.auth.userKey)
                  : null;
              const cachedUser = cached ? (JSON.parse(cached) as User) : null;
              if (cachedUser) {
                set({
                  user: cachedUser,
                  accessToken: accessToken,
                  isAuthenticated: true,
                  sessionExpired: false,
                });
              } else {
                await get().logout({ silent: true });
              }
            }
          } catch {
            if (!refreshToken) {
              await get().logout({ silent: true });
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
        if (fetchUserPromise) return fetchUserPromise;

        const token =
          get().accessToken ||
          (typeof window !== 'undefined'
            ? localStorage.getItem(config.auth.tokenKey)
            : null);
        if (!token) {
          set({ isLoading: false });
          return null;
        }

        set({ isLoading: true });
        fetchUserPromise = (async (): Promise<User | null> => {
          try {
            authApi.setToken(token);
            const normalized = await fetchMe();
            if (normalized) {
              set({
                user: normalized,
                // Allinea lo stato in-memory all'header Authorization: il token
                // può provenire da localStorage mentre get().accessToken era null
                // (es. fetchUser invocato prima/indipendentemente da initializeAuth).
                accessToken: token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              return normalized;
            } else {
              set({ isLoading: false, user: null });
              return null;
            }
          } catch (err) {
            const parsed = parseAuthError(err);
            console.error(
              '[authStore.fetchUser] Errore:',
              parsed.status,
              parsed.message
            );
            set({ isLoading: false, user: null });
            return null;
          } finally {
            fetchUserPromise = null;
          }
        })();

        return fetchUserPromise;
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

          const raw = await authApi.post<LoginResponse>('/api/auth/login', payload);

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

              // Set authenticated immediately, fetch user in background
              set({
                user: null,
                accessToken: access_token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                flashMessage: 'Login avvenuto con successo',
              });

              // Fetch user from /me endpoint with timeout
              try {
                const mePromise = fetchMe();
                const timeoutPromise = new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('me-timeout')), 8000)
                );
                const normalized = await Promise.race([mePromise, timeoutPromise]);
                set({ user: normalized });
              } catch (meError) {
                console.error('[authStore.login] /me fetch failed:', meError);
              }
              return { mfaRequired: false };
            } else {
              throw new Error('Login fallito: token mancanti');
            }
          } else {
            throw new Error('Risposta login non valida');
          }
        } catch (error) {
          const parsed = parseAuthError(error);
          console.error('[authStore.login] Error:', parsed.status, parsed.message);

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
            let normalized: User | null = null;
            try {
              normalized = await fetchMe();
            } catch (meError) {
              // If /me fails, still set authenticated but without user
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
        } catch (error) {
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

          const response = await authApi.post<UserResponse | TokenResponse>(
            '/api/auth/register',
            payload
          );

          // Se la registrazione restituisce token (auto-login), gestiscili
          if ('access_token' in response && 'refresh_token' in response) {
            const { access_token, refresh_token } = response;
            authApi.setToken(access_token, refresh_token);

            // Fetch user
            let normalized: User | null = null;
            try {
              normalized = await fetchMe();
            } catch (meError) {
              // If /me fails, still set authenticated but without user
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
        } catch (error) {
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
      logout: async (opts) => {
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
        stopProactiveRefresh();
        clearMfaPreAuthToken();

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
          mfaRequired: false,
          preAuthToken: null,
          authError: null,
          flashMessage: opts?.silent ? null : 'Disconnessione avvenuta con successo',
        });
      },

      // Set user (normalize preferences) and mark as authenticated
      setUser: (user: User) => {
        const normalized = normalizeUser(user);
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

      updateUserName: (name) => {
        set((state) => {
          if (!state.user) return state;
          const updatedUser = { ...state.user, name };
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

      // Set auth error message
      setAuthError: (message) => {
        set({ authError: message });
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

      // Request login code (passwordless)
      requestLoginCode: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.requestLoginCode(email);
          set({ isLoading: false, error: null });
        } catch (error) {
          const parsed = parseAuthError(error);
          set({ isLoading: false, error: parsed.message });
          throw error;
        }
      },

      // Verify login code (passwordless)
      verifyLoginCode: async (email: string, code: string) => {
        clearMfaPreAuthToken();
        set({
          isLoading: true,
          error: null,
          mfaRequired: false,
          preAuthToken: null,
          sessionExpired: false,
        });

        try {
          const raw = (await authApi.verifyLoginCode(email, code)) as
            | TokenResponse
            | PreAuthTokenResponse
            | Record<string, unknown>;

          const response = (raw as { data?: unknown }).data ?? raw;

          // Handle MFA response
          if (
            response &&
            typeof response === 'object' &&
            'mfa_required' in response &&
            (response as PreAuthTokenResponse).mfa_required === true &&
            'pre_auth_token' in response &&
            typeof (response as PreAuthTokenResponse).pre_auth_token === 'string'
          ) {
            const pre = (response as PreAuthTokenResponse).pre_auth_token;
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
            return { mfaRequired: true, preAuthToken: pre };
          }

          // Handle direct login response
          if (
            response &&
            typeof response === 'object' &&
            'access_token' in response &&
            'refresh_token' in response
          ) {
            const { access_token, refresh_token } = response as TokenResponse;

            if (access_token && refresh_token) {
              authApi.setToken(access_token, refresh_token);

              let normalized: User | null = null;
              try {
                normalized = await fetchMe();
              } catch {
                // ignore
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
        } catch (error) {
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

    }),
    {
      name: 'ebartex-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        // NB: preAuthToken/mfaRequired NON vengono persistiti qui: il flusso MFA
        // tra reload vive in sessionStorage (lib/auth/mfa-session.ts, superficie
        // ridotta) e la pagina verify-mfa lo ripristina nello store al mount.
      }),
      merge: (persisted, current) => ({
        ...current,
        user: (persisted as { user: User | null }).user ?? null,
        accessToken:
          (persisted as { accessToken: string | null }).accessToken ?? null,
        isAuthenticated:
          (persisted as { isAuthenticated: boolean }).isAuthenticated ?? false,
        flashMessage: null, // Non persistire flashMessage
      }),
    }
  )
);
