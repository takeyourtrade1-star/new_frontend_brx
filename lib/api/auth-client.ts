/**
 * Auth API Client - Axios Configuration
 * Client HTTP dedicato per il microservizio di autenticazione AWS
 * Supporta JWT RS256, refresh token automatico, e gestione errori
 */

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import type { PreAuthTokenResponse, TokenResponse } from '@/types';
import { config } from '../config';
import { isTournamentsTransitionPath } from '@/lib/config/tournaments';
import { tokenManager } from './refresh-token';

const DEVICE_TRUST_CRITICAL_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/verify-mfa',
]);

/**
 * Endpoint auth raggiungibili da utenti non autenticati: un 401 qui significa
 * credenziali errate, non token scaduto. Il response interceptor NON deve
 * tentare un refresh per queste richieste (match per substring sull'URL).
 */
const REFRESH_SKIP_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/verify-mfa',
  '/api/auth/login/code/request',
  '/api/auth/login/code/verify',
  '/api/auth/password/reset/request',
  '/api/auth/password/reset/verify-code',
  '/api/auth/password/reset/confirm-init',
  '/api/auth/password/reset/confirm-final',
  '/api/auth/password/reset/confirm',
] as const;

/** Endpoint auth che un utente anonimo (non loggato) può chiamare. */
const ANONYMOUS_AUTH_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/verify-mfa',
  '/api/auth/mfa/verify',
  '/api/auth/login/code/request',
  '/api/auth/login/code/verify',
  '/api/auth/password/reset/request',
  '/api/auth/password/reset/verify-code',
  '/api/auth/password/reset/confirm-init',
  '/api/auth/password/reset/confirm-final',
  '/api/auth/password/reset/confirm',
] as const;

/** Risposta tipica per richieste che inviano solo email / messaggio generico (OTP, reset). */
export interface OtpFlowMessageResponse {
  message?: string;
}

/** In browser use same-origin proxy (/api/auth/*) to avoid CORS; on server call Auth API directly. */
function getAuthBaseURL(): string {
  if (typeof window !== 'undefined') return '';
  return config.api.baseURL;
}

class AuthApiClient {
  private instance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    const baseURL = getAuthBaseURL();

    this.instance = axios.create({
      baseURL,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: false, // Disabilita cookies per CORS
    });

    this.setupInterceptors();
  }

  private isAnonymousAuthRequest(url?: string): boolean {
    if (!url) return false;
    return ANONYMOUS_AUTH_PATHS.some((path) => url.includes(path));
  }

  private shouldTryDirectCredentialedCall(normalizedUrl: string): boolean {
    void normalizedUrl;
    return false;
  }

  private async tryDirectCredentialedPost<T = unknown>(
    normalizedUrl: string,
    data?: unknown
  ): Promise<T | undefined> {
    if (!this.shouldTryDirectCredentialedCall(normalizedUrl)) {
      return undefined;
    }

    try {
      const response = await axios.post<T>(
        `${config.api.baseURL}${normalizedUrl}`,
        data,
        {
          timeout: config.api.timeout,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error;
      }
      return undefined;
    }
  }

  private setupInterceptors() {
    // Request Interceptor - Aggiunge l'access_token a OGNI richiesta in uscita
    this.instance.interceptors.request.use(
      (requestConfig: InternalAxiosRequestConfig) => {
        // Carica il token da localStorage se non è in memoria
        if (!this.token) {
          this.token = this.getStoredToken();
        }

        if (
          this.token &&
          requestConfig.headers &&
          !this.isAnonymousAuthRequest(requestConfig.url)
        ) {
          requestConfig.headers.Authorization = `Bearer ${this.token}`;
        }
        return requestConfig;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor - Gestisce il refresh automatico su 401
    this.instance.interceptors.response.use(
      (response) => response, // Se la risposta è 2xx, non fare nulla

      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Se l'errore è 401 E non è una richiesta di "retry"
        // E NON è una richiesta di login/register/refresh (che non dovrebbero avere token)
        const requestUrl = originalRequest.url;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !REFRESH_SKIP_PATHS.some((path) => requestUrl?.includes(path))
        ) {
          originalRequest._retry = true;

          // Centralised refresh — tokenManager deduplicates concurrent callers
          // and resolves all of them once a single /api/auth/refresh completes.
          const newToken = await tokenManager.ensureFreshToken();
          if (newToken) {
            this.token = newToken;
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.instance(originalRequest);
          }

          this.forceLogout();
          return Promise.reject(error);
        }

        // Per tutti gli altri errori, rigetta la promise
        return Promise.reject(error);
      }
    );
  }

  /**
   * Forza il logout eliminando i token e reindirizzando al login
   */
  private forceLogout() {
    this.clearToken();

    // Reindirizza al login; non disturbare MFA né il video → portale tornei
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (
        p !== '/login' &&
        !p.startsWith('/login/verify-mfa') &&
        !isTournamentsTransitionPath(p)
      ) {
        window.location.href = '/login';
      }
    }
  }

  /**
   * Imposta i token (access + refresh) per le richieste successive
   */
  setToken(accessToken: string, refreshToken?: string) {
    this.token = accessToken;
    this.setStoredToken(accessToken);
    if (refreshToken) {
      this.setStoredRefreshToken(refreshToken);
    }
  }

  /**
   * Ottiene l'access token corrente
   */
  getToken(): string | null {
    if (!this.token) {
      this.token = this.getStoredToken();
    }
    return this.token;
  }

  /**
   * Rimuove i token (logout)
   */
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(config.auth.tokenKey);
      localStorage.removeItem(config.auth.refreshTokenKey);
      localStorage.removeItem(config.auth.userKey);
    }
  }

  // Helper methods per localStorage (safe per SSR)
  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(config.auth.tokenKey);
  }

  private setStoredToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(config.auth.tokenKey, token);
  }

  private getStoredRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(config.auth.refreshTokenKey);
  }

  private setStoredRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(config.auth.refreshTokenKey, token);
  }

  /**
   * POST request
   */
  async post<T = unknown>(url: string, data?: unknown): Promise<T> {
    // Normalizza l'URL per evitare slash doppi
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

    const directCredentialedResponse =
      await this.tryDirectCredentialedPost<T>(normalizedUrl, data);
    if (directCredentialedResponse !== undefined) {
      return directCredentialedResponse;
    }

    const response = await this.instance.post<T>(normalizedUrl, data);
    return response.data;
  }

  /**
   * GET request
   */
  async get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.instance.get<T>(url, { params });
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(url: string, data?: unknown): Promise<T> {
    const response = await this.instance.patch<T>(url, data);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = unknown>(url: string, data?: unknown): Promise<T> {
    const response = await this.instance.put<T>(url, data);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(url: string): Promise<T> {
    const response = await this.instance.delete<T>(url);
    return response.data;
  }

  /**
   * Passwordless: richiede invio email con codice OTP a 6 cifre.
   * POST /api/auth/login/code/request — body: { email }
   */
  async requestLoginCode(email: string): Promise<OtpFlowMessageResponse> {
    return this.post<OtpFlowMessageResponse>('/api/auth/login/code/request', {
      email,
    });
  }

  /**
   * Passwordless: verifica codice e restituisce token di sessione.
   * POST /api/auth/login/code/verify — body: { email, code }
   */
  async verifyLoginCode(
    email: string,
    code: string
  ): Promise<TokenResponse | PreAuthTokenResponse> {
    return this.post<TokenResponse | PreAuthTokenResponse>(
      '/api/auth/login/code/verify',
      {
      email,
      code,
      }
    );
  }

  /**
   * Reset password: richiede invio email con codice OTP.
   * POST /api/auth/password/reset/request — body: { email }
   */
  async requestPasswordResetCode(
    email: string
  ): Promise<OtpFlowMessageResponse> {
    return this.post<OtpFlowMessageResponse>(
      '/api/auth/password/reset/request',
      { email }
    );
  }

  /**
   * Reset password: imposta nuova password con codice ricevuto via email.
   * POST /api/auth/password/reset/confirm — body: { email, code, new_password }
   */
  async resetPasswordWithCode(
    email: string,
    code: string,
    newPassword: string
  ): Promise<OtpFlowMessageResponse> {
    return this.post<OtpFlowMessageResponse>(
      '/api/auth/password/reset/confirm',
      {
        email,
        code,
        new_password: newPassword,
      }
    );
  }

  /**
   * Reset password Step 1: richiede invio OTP1.
   * POST /api/auth/password/reset/request — body: { email }
   */
  async requestPasswordReset(email: string): Promise<OtpFlowMessageResponse> {
    return this.post<OtpFlowMessageResponse>('/api/auth/password/reset/request', { email });
  }

  /**
   * Reset password Step 2: verifica OTP1 e riceve reset_token.
   * POST /api/auth/password/reset/verify-code — body: { email, code }
   */
  async verifyPasswordResetCode(
    email: string,
    code: string
  ): Promise<{ token: string; token_type: 'password_reset'; expires_in_seconds: number }> {
    return this.post<{ token: string; token_type: 'password_reset'; expires_in_seconds: number }>(
      '/api/auth/password/reset/verify-code',
      { email, code }
    );
  }

  /**
   * Reset password Step 3: invia nuova password e riceve confirm_token.
   * POST /api/auth/password/reset/confirm-init — body: { reset_token, new_password }
   */
  async confirmPasswordResetInit(
    resetToken: string,
    newPassword: string
  ): Promise<{ token: string; token_type: 'password_reset_confirm'; expires_in_seconds: number }> {
    return this.post<{ token: string; token_type: 'password_reset_confirm'; expires_in_seconds: number }>(
      '/api/auth/password/reset/confirm-init',
      { reset_token: resetToken, new_password: newPassword }
    );
  }

  /**
   * Reset password Step 4: verifica OTP2 e completa il reset.
   * POST /api/auth/password/reset/confirm-final — body: { confirm_token, code }
   */
  async confirmPasswordResetFinal(
    confirmToken: string,
    code: string
  ): Promise<OtpFlowMessageResponse> {
    return this.post<OtpFlowMessageResponse>('/api/auth/password/reset/confirm-final', {
      confirm_token: confirmToken,
      code,
    });
  }
}

// Esporta un'istanza singleton
export const authApi = new AuthApiClient();
export default authApi;
