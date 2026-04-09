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
import { refreshAccessToken } from './refresh-token';

const DEVICE_TRUST_CRITICAL_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/verify-mfa',
]);

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
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    const baseURL = getAuthBaseURL();

    // Log per debug (solo in sviluppo)
    if (typeof window !== 'undefined' && config.debug.isDevelopment) {
      console.log('[AuthApiClient] Base URL:', baseURL || '(same-origin /api/auth proxy)');
    }

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

  private shouldTryDirectCredentialedCall(normalizedUrl: string): boolean {
    void normalizedUrl;
    return false;
  }

  private async tryDirectCredentialedPost<T = any>(
    normalizedUrl: string,
    data?: any
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

        if (this.token && requestConfig.headers) {
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
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/api/auth/login') &&
          !originalRequest.url?.includes('/api/auth/register') &&
          !originalRequest.url?.includes('/api/auth/refresh') &&
          !originalRequest.url?.includes('/api/auth/verify-mfa') &&
          !originalRequest.url?.includes('/api/auth/login/code/request') &&
          !originalRequest.url?.includes('/api/auth/login/code/verify') &&
          !originalRequest.url?.includes(
            '/api/auth/password/reset/request'
          ) &&
          !originalRequest.url?.includes('/api/auth/password/reset/confirm')
        ) {
          originalRequest._retry = true; // Marca per evitare loop infiniti

          // Se stiamo già refrescando, metti in coda la richiesta (usa lo stesso lock condiviso con sync-client)
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                if (this.token && originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${this.token}`;
                }
                return this.instance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          this.isRefreshing = true;

          try {
            // Refresh centralizzato: una sola chiamata a /api/auth/refresh per tutta l'app
            const result = await refreshAccessToken();

            if (result) {
              this.token = result.accessToken;
              this.setStoredToken(result.accessToken);
              this.setStoredRefreshToken(result.refreshToken);
              try {
                const { useAuthStore } = await import(
                  /* webpackChunkName: "auth-store" */ '@/lib/stores/auth-store'
                );
                useAuthStore.getState().setToken(result.accessToken, result.refreshToken);
              } catch {
                // ignore se store non disponibile (SSR o primo load)
              }
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;
              }
              this.processQueue(null);
              return this.instance(originalRequest);
            }

            this.processQueue(error);
            this.forceLogout();
            return Promise.reject(error);
          } catch (refreshError) {
            this.processQueue(refreshError);
            this.forceLogout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Per tutti gli altri errori, rigetta la promise
        return Promise.reject(error);
      }
    );
  }

  /**
   * Processa le richieste in coda dopo il refresh
   */
  private processQueue(error: any) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });
    this.failedQueue = [];
  }

  /**
   * Forza il logout eliminando i token e reindirizzando al login
   */
  private forceLogout() {
    this.clearToken();

    // Reindirizza al login; non disturbare il flusso MFA (/login/verify-mfa)
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p !== '/login' && !p.startsWith('/login/verify-mfa')) {
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
  async post<T = any>(url: string, data?: any): Promise<T> {
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
  async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.instance.get<T>(url, { params });
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.instance.patch<T>(url, data);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.instance.put<T>(url, data);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string): Promise<T> {
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
}

// Esporta un'istanza singleton
export const authApi = new AuthApiClient();
export default authApi;
