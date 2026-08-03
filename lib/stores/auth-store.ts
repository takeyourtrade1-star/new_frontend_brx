'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  UserPreferences,
  LoginCredentials,
  RegisterData,
  VerifyMFAData,
  UserResponse,
  LoginResponse,
  RegistrationPendingResponse,
  RegistrationResult,
} from '@/types';
import { authApi } from '@/lib/api/auth-client';
import { parseAuthError } from '@/lib/api/auth-error';
import { fetchMe } from '@/lib/auth/fetch-me';
import {
  purgeLegacyAuthStorage,
  purgeLegacyMfaStorage,
} from '@/lib/auth/legacy-token-storage';
import { purgePrivateBrowserState } from '@/lib/auth/private-browser-state';
import { normalizeUser, DEFAULT_PREFERENCES } from '@/lib/auth/normalize-user';

/** Promise in-flight per deduplicare chiamate concorrenti a fetchUser */
let fetchUserPromise: Promise<User | null> | null = null;
import { isTournamentsTransitionPath } from '@/lib/config/tournaments';

function clearLegacyMfaPreAuthToken(): void {
  purgeLegacyMfaStorage();
}

function clearLegacyStoredTokens(): void {
  purgeLegacyAuthStorage();
}

interface AuthState {
  // State
  user: User | null;
  /**
   * Compatibilita' temporanea per hook che usano la presenza del vecchio campo
   * come feature gate. Non contiene mai un JWT o una credenziale.
   */
  accessToken: 'cookie-session' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // MFA State
  /** Non-secret marker: the real short-lived MFA token is an HttpOnly cookie. */
  preAuthToken: 'cookie-session' | null;
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
  ) => Promise<{ mfaRequired: boolean }>;
  verifyMFA: (data: VerifyMFAData) => Promise<void>;
  register: (data: RegisterData, idempotencyKey?: string) => Promise<RegistrationResult>;
  /** `silent: true` per i logout automatici (es. sessione scaduta): niente toast di successo. */
  logout: (opts?: { silent?: boolean }) => Promise<void>;
  setUser: (user: User) => void;
  updateUserName: (name: string) => void;
  updateUserPreferences: (
    preferences: Partial<UserPreferences>
  ) => void;
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
  ) => Promise<{ mfaRequired: boolean }>;
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

      // Initialize auth: /me valida il cookie HttpOnly. L'interceptor esegue un
      // singolo refresh cookie-only su 401, senza esporre token al browser.
      initializeAuth: async () => {
        // Elimina eventuali token leggibili lasciati da versioni precedenti.
        clearLegacyStoredTokens();
        if (typeof window !== 'undefined' && isTournamentsTransitionPath()) {
          return;
        }

        try {
          const normalized = await fetchMe();
          if (!normalized) throw new Error('Sessione non valida');
          set({
            user: normalized,
            accessToken: 'cookie-session',
            isAuthenticated: true,
            isLoading: false,
            sessionExpired: false,
          });
        } catch {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            sessionExpired: false,
          });
        }
      },

      // fetchUser: ricarica l'utente da /api/auth/me
      fetchUser: async (): Promise<User | null> => {
        if (fetchUserPromise) return fetchUserPromise;

        if (!get().isAuthenticated) {
          set({ isLoading: false });
          return null;
        }

        set({ isLoading: true });
        fetchUserPromise = (async (): Promise<User | null> => {
          try {
            const normalized = await fetchMe();
            if (normalized) {
              set({
                user: normalized,
                accessToken: 'cookie-session',
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
        clearLegacyMfaPreAuthToken();
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
            (response as { mfa_required?: unknown }).mfa_required === true
          ) {
            set({
              preAuthToken: 'cookie-session',
              mfaRequired: true,
              isLoading: false,
              error: null,
              isAuthenticated: false,
              user: null,
              accessToken: null,
            });
            return {
              mfaRequired: true,
            };
          }

          const authenticated =
            Boolean((raw as { authenticated?: unknown })?.authenticated) ||
            Boolean((response as { authenticated?: unknown })?.authenticated);
          if (!authenticated) {
            throw new Error('Risposta login non valida');
          }

          let normalized: User | null = null;
          try {
            normalized = await fetchMe();
          } catch (meError) {
            console.error('[authStore.login] /me fetch failed:', meError);
          }
          set({
            user: normalized,
            accessToken: 'cookie-session',
            isAuthenticated: true,
            isLoading: false,
            error: null,
            flashMessage: 'Login avvenuto con successo',
          });
          return { mfaRequired: false };
        } catch (error) {
          const parsed = parseAuthError(error);
          console.error('[authStore.login] Error:', parsed.status, parsed.message);

          set({
            isLoading: false,
            error: parsed.message,
            isAuthenticated: false,
            accessToken: null,
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
          const response = (await authApi.post<{ authenticated?: boolean }>(
            '/api/auth/verify-mfa',
            data
          ));
          if (!response.authenticated) throw new Error('Verifica MFA fallita');

          let normalized: User | null = null;
          try {
            normalized = await fetchMe();
          } catch {
            // La sessione cookie resta valida; /me verra' ritentato dalla UI.
          }

          set({
            user: normalized,
            accessToken: 'cookie-session',
            isAuthenticated: true,
            mfaRequired: false,
            preAuthToken: null,
            isLoading: false,
            error: null,
            flashMessage: 'Autenticazione completata con successo',
          });
        } catch (error) {
          const parsed = parseAuthError(error);

          set({
            isLoading: false,
            error: parsed.message,
            isAuthenticated: false,
            accessToken: null,
          });

          throw error;
        }
      },

      // Register (solo registrazione: non toccare login)
      register: async (data: RegisterData, idempotencyKey?: string) => {
        set({ isLoading: true, error: null, registrationFieldErrors: null });

        try {
          // Honeypot: backend richiede website_url sempre ""
          const payload = {
            ...data,
            website_url: data.website_url ?? '',
          };

          const response = await authApi.post<
            UserResponse | RegistrationPendingResponse | { authenticated: true }
          >(
            '/api/auth/register',
            payload,
            idempotencyKey
              ? { headers: { 'Idempotency-Key': idempotencyKey } }
              : undefined
          );

          if ('status' in response && response.status === 'verification_pending') {
            set({
              isLoading: false,
              error: null,
              flashMessage: null,
            });
            return response;
          }

          if ('authenticated' in response && response.authenticated === true) {
            let normalized: User | null = null;
            try {
              normalized = await fetchMe();
            } catch {
              // If /me fails, still set authenticated but without user
            }
            set({
              user: normalized,
              accessToken: 'cookie-session',
              isAuthenticated: true,
              isLoading: false,
              error: null,
              flashMessage: 'Registrazione completata con successo',
            });
            return { status: 'authenticated' };
          }

          // Compatibilita con il percorso legacy quando il feature flag e disattivato.
          set({
            isLoading: false,
            error: null,
            flashMessage:
              'Registrazione completata. Verifica la tua email per attivare l\'account.',
          });
          return { status: 'legacy_created' };
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
        // Purge readable/private browser state before the first network await.
        clearLegacyStoredTokens();
        clearLegacyMfaPreAuthToken();
        purgePrivateBrowserState();
        // Chiama l'endpoint di logout per invalidare la sessione sul server
        if (get().isAuthenticated) {
          try {
            await authApi.post('/api/auth/logout', {});
          } catch (error) {
            // Anche se il logout fallisce, procediamo con la pulizia client-side
          }
        }

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
          set({ user: normalized, accessToken: 'cookie-session', isAuthenticated: true });
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
          return { user: updatedUser };
        });
      },

      updateUserName: (name) => {
        set((state) => {
          if (!state.user) return state;
          const updatedUser = { ...state.user, name };
          return { user: updatedUser };
        });
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
        purgePrivateBrowserState();
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
        clearLegacyMfaPreAuthToken();
        set({
          isLoading: true,
          error: null,
          mfaRequired: false,
          preAuthToken: null,
          sessionExpired: false,
        });

        try {
          const raw = (await authApi.verifyLoginCode(email, code)) as {
            authenticated?: boolean;
            mfa_required?: boolean;
            data?: unknown;
          };

          const response = (raw as { data?: unknown }).data ?? raw;

          // Handle MFA response
          if (
            response &&
            typeof response === 'object' &&
            'mfa_required' in response &&
            (response as { mfa_required?: unknown }).mfa_required === true
          ) {
            set({
              preAuthToken: 'cookie-session',
              mfaRequired: true,
              isLoading: false,
              error: null,
              isAuthenticated: false,
              user: null,
              accessToken: null,
            });
            return { mfaRequired: true };
          }

          const authenticated =
            Boolean((raw as { authenticated?: unknown })?.authenticated) ||
            Boolean((response as { authenticated?: unknown })?.authenticated);
          if (!authenticated) {
            throw new Error('Risposta login non valida');
          }
          let normalized: User | null = null;
          try {
            normalized = await fetchMe();
          } catch {
            // La sessione cookie resta valida; /me verra' ritentato.
          }
          set({
            user: normalized,
            accessToken: 'cookie-session',
            isAuthenticated: true,
            isLoading: false,
            error: null,
            flashMessage: 'Login avvenuto con successo',
          });
          return { mfaRequired: false };
        } catch (error) {
          const parsed = parseAuthError(error);
          set({
            isLoading: false,
            error: parsed.message,
            isAuthenticated: false,
            accessToken: null,
            mfaRequired: false,
            preAuthToken: null,
          });
          throw error;
        }
      },

    }),
    {
      name: 'ebartex-auth',
      // La sessione e i dati personali vengono sempre ricavati da /me. Lo
      // storage serve soltanto a sovrascrivere e ripulire payload legacy.
      partialize: () => ({}),
      merge: (_persisted, current) => ({
        ...current,
        user: null,
        accessToken: null,
        isAuthenticated: false,
        flashMessage: null,
      }),
    }
  )
);
