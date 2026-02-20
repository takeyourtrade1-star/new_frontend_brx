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
import { config } from '@/lib/config';

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

  const u = user as UserResponse & { name?: string | null; image?: string | null };
  return {
    id: user.id,
    email: user.email,
    name: u.name ?? null,
    image: u.image ?? null,
    account_status: (user as UserResponse).account_status,
    mfa_enabled: (user as UserResponse).mfa_enabled,
    created_at: (user as UserResponse).created_at,
    preferences,
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
  fetchUser: () => Promise<void>;
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
              set({ accessToken: newAccess, isAuthenticated: true });
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
            const user =
              response.user ||
              response.data?.user ||
              (userStr ? JSON.parse(userStr) : null);

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
              set({ user: null, accessToken: null, isAuthenticated: false });
            }
          }
        } else {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
        }
      },

      // fetchUser: ricarica l'utente da /api/auth/me
      fetchUser: async () => {
        const token =
          get().accessToken ||
          (typeof window !== 'undefined'
            ? localStorage.getItem(config.auth.tokenKey)
            : null);
        if (!token) {
          set({ isLoading: false });
          return;
        }
        if (get().isLoading) {
          return;
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
            } else {
              set({ isLoading: false, user: null });
            }
          } else {
            set({ isLoading: false, user: null });
          }
        } catch (err: any) {
          const status = err?.response?.status;
          console.error('[authStore.fetchUser] Errore:', status, err?.message);
          set({ isLoading: false, user: null });
        }
      },

      // Login
      login: async (credentials: LoginCredentials) => {
        set({
          isLoading: true,
          error: null,
          mfaRequired: false,
          preAuthToken: null,
        });

        try {
          // Add honeypot field (required by backend)
          const payload = {
            ...credentials,
            website_url: credentials.website_url || '', // Honeypot field - must be empty string
          };

          const response = (await authApi.post(
            '/api/auth/login',
            payload
          )) as PreAuthTokenResponse | TokenResponse;

          // Handle MFA response (Scenario 2)
          if (
            'mfa_required' in response &&
            response.mfa_required === true &&
            'pre_auth_token' in response
          ) {
            set({
              preAuthToken: response.pre_auth_token,
              mfaRequired: true,
              isLoading: false,
              error: null,
            });
            return {
              mfaRequired: true,
              preAuthToken: response.pre_auth_token,
            };
          }

          // Handle direct login response (Scenario 1)
          if ('access_token' in response && 'refresh_token' in response) {
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
          // Supporta sia formato FastAPI che altri formati
          let errorMessage = 'Errore durante il login';

          if (error.response?.data) {
            const errorData = error.response.data;

            // FastAPI format: { detail: [{ loc: [...], msg: "...", type: "..." }] }
            if (
              errorData.detail &&
              Array.isArray(errorData.detail) &&
              errorData.detail.length > 0
            ) {
              const firstDetail = errorData.detail[0];
              errorMessage =
                firstDetail.msg || firstDetail.message || errorMessage;
            }
            // Altri formati: { message: "..." }
            else if (errorData.message) {
              errorMessage = errorData.message;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }

          set({
            isLoading: false,
            error: errorMessage,
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
          // Supporta sia formato FastAPI che altri formati
          let errorMessage = 'Errore durante la verifica MFA';

          if (error.response?.data) {
            const errorData = error.response.data;

            // FastAPI format: { detail: [{ loc: [...], msg: "...", type: "..." }] }
            if (
              errorData.detail &&
              Array.isArray(errorData.detail) &&
              errorData.detail.length > 0
            ) {
              const firstDetail = errorData.detail[0];
              errorMessage =
                firstDetail.msg || firstDetail.message || errorMessage;
            }
            // Altri formati: { message: "..." }
            else if (errorData.message) {
              errorMessage = errorData.message;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }

          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });

          throw error;
        }
      },

      // Register
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });

        try {
          // Add honeypot field (required by backend)
          const payload = {
            ...data,
            website_url: data.website_url || '', // Honeypot field - must be empty string
          };

          // La chiamata API. Se fallisce (es. 400, 500), Axios lancerà un errore e andremo nel catch.
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
          // Estrai messaggio errore più dettagliato
          // Supporta sia formato FastAPI che altri formati
          let errorMessage = 'Errore durante la registrazione';

          if (error.response?.data) {
            const errorData = error.response.data;

            // FastAPI format: { detail: [{ loc: [...], msg: "...", type: "..." }] }
            if (
              errorData.detail &&
              Array.isArray(errorData.detail) &&
              errorData.detail.length > 0
            ) {
              // Prendi il primo errore dalla lista detail
              const firstDetail = errorData.detail[0];
              errorMessage =
                firstDetail.msg || firstDetail.message || errorMessage;

              // Se ci sono più errori, possiamo concatenarli (opzionale)
              if (errorData.detail.length > 1) {
                const allMessages = errorData.detail
                  .map((d: any) => d.msg || d.message)
                  .filter((m: any) => m)
                  .join(', ');
                if (allMessages) {
                  errorMessage = allMessages;
                }
              }
            }
            // Altri formati: { message: "..." }
            else if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.errors) {
              // Se ci sono errori di validazione, mostra il primo
              const firstError = Object.values(errorData.errors)[0];
              if (Array.isArray(firstError) && firstError.length > 0) {
                errorMessage = firstError[0] as string;
              }
            }
          } else if (error.message) {
            errorMessage = error.message;
          }

          set({
            isLoading: false,
            error: errorMessage,
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

      // Set user (normalize preferences)
      setUser: (user: User) => {
        const normalized = normalizeUser(user as UserResponse);
        if (normalized) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              config.auth.userKey,
              JSON.stringify(normalized)
            );
          }
          set({ user: normalized });
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

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set flash message
      setFlashMessage: (message) => {
        set({ flashMessage: message });
      },
    }),
    {
      name: 'ebartex-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
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
