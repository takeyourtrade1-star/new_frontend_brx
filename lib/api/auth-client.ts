/**
 * Auth API Client - Axios Configuration
 * Client HTTP dedicato per il microservizio di autenticazione AWS
 * Supporta sessioni cookie HttpOnly, refresh automatico e gestione errori.
 */

import axios, {
  AxiosRequestConfig,
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import type {
  PreAuthTokenResponse,
  RegistrationPendingResponse,
  VerificationSuccessResponse,
} from '@/types';
import { config } from '../config';
import { isTournamentsTransitionPath } from '@/lib/config/tournaments';
import { tokenManager } from './refresh-token';
import { purgePrivateBrowserState } from '@/lib/auth/private-browser-state';

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
  '/api/auth/password/reset/clear-session',
  '/api/auth/verify-email/code',
  '/api/auth/verify-email/token',
  '/api/auth/resend-verification',
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
  constructor() {
    const baseURL = getAuthBaseURL();

    this.instance = axios.create({
      baseURL,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      // Nel browser il base URL e' same-origin (/api/auth/*): consente al BFF
      // di ricevere il cookie HttpOnly trusted-device senza esporlo a JavaScript.
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Response interceptor: rinnova esclusivamente i cookie HttpOnly. Nessun
    // bearer viene mai restituito o conservato dal client.
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
          const refreshed = await tokenManager.ensureFreshSession();
          if (refreshed) {
            if (originalRequest.headers) originalRequest.headers.delete('Authorization');
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
    purgePrivateBrowserState();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(config.auth.tokenKey);
      localStorage.removeItem(config.auth.refreshTokenKey);
      localStorage.removeItem(config.auth.userKey);
    }

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
   * POST request
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    requestConfig?: AxiosRequestConfig
  ): Promise<T> {
    // Normalizza l'URL per evitare slash doppi
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

    const response = await this.instance.post<T>(normalizedUrl, data, requestConfig);
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
   * Passwordless: verifica codice e crea la sessione cookie lato BFF.
   * POST /api/auth/login/code/verify — body: { email, code }
   */
  async verifyLoginCode(
    email: string,
    code: string
  ): Promise<{ authenticated?: boolean } | PreAuthTokenResponse> {
    return this.post<{ authenticated?: boolean } | PreAuthTokenResponse>(
      '/api/auth/login/code/verify',
      {
      email,
      code,
      }
    );
  }

  async verifyRegistrationEmailCode(
    flowId: string,
    code: string
  ): Promise<VerificationSuccessResponse> {
    return this.post<VerificationSuccessResponse>('/api/auth/verify-email/code', {
      flow_id: flowId,
      code,
    });
  }

  async verifyRegistrationEmailToken(
    flowId: string,
    token: string
  ): Promise<VerificationSuccessResponse> {
    return this.post<VerificationSuccessResponse>('/api/auth/verify-email/token', {
      flow_id: flowId,
      token,
    });
  }

  async resendRegistrationVerification(
    flowId: string
  ): Promise<RegistrationPendingResponse> {
    return this.post<RegistrationPendingResponse>('/api/auth/resend-verification', {
      flow_id: flowId,
    });
  }

  /**
   * Reset password Step 1: richiede invio OTP1.
   * POST /api/auth/password/reset/request — body: { email }
   */
  async requestPasswordReset(email: string): Promise<OtpFlowMessageResponse> {
    return this.post<OtpFlowMessageResponse>('/api/auth/password/reset/request', { email });
  }

  /**
   * Reset password Step 2: verifica OTP1. Il BFF trattiene il reset token in
   * un cookie HttpOnly e restituisce a JavaScript soltanto marker + TTL.
   * POST /api/auth/password/reset/verify-code — body: { email, code }
   */
  async verifyPasswordResetCode(
    email: string,
    code: string
  ): Promise<{ handoff_ready: true; expires_in_seconds: number }> {
    return this.post<{ handoff_ready: true; expires_in_seconds: number }>(
      '/api/auth/password/reset/verify-code',
      { email, code }
    );
  }

  /**
   * Reset password Step 3: il BFF inietta il reset token HttpOnly e ruota il
   * confirm token in un secondo cookie HttpOnly.
   * POST /api/auth/password/reset/confirm-init — body browser: { new_password }
   */
  async confirmPasswordResetInit(
    newPassword: string
  ): Promise<{ handoff_ready: true; expires_in_seconds: number }> {
    return this.post<{ handoff_ready: true; expires_in_seconds: number }>(
      '/api/auth/password/reset/confirm-init',
      { new_password: newPassword }
    );
  }

  /**
   * Reset password Step 4: il BFF inietta il confirm token HttpOnly.
   * POST /api/auth/password/reset/confirm-final — body browser: { code }
   */
  async confirmPasswordResetFinal(
    code: string
  ): Promise<OtpFlowMessageResponse> {
    return this.post<OtpFlowMessageResponse>('/api/auth/password/reset/confirm-final', {
      code,
    });
  }

  /** Revoca gli hand-off HttpOnly quando l'utente abbandona o riavvia il flow. */
  async clearPasswordResetSession(): Promise<void> {
    await this.post<{ cleared: true }>('/api/auth/password/reset/clear-session', {});
  }
}

// Esporta un'istanza singleton
export const authApi = new AuthApiClient();
export default authApi;
