'use client';

import { create } from 'zustand';
import { authApi } from '@/lib/api/auth-client';

type ResetStep =
  | 'idle'
  | 'otp1_requested'
  | 'otp1_verified'
  | 'otp2_requested'
  | 'completed'
  | 'error';

interface PasswordResetError {
  message: string;
  status?: number;
}

interface PasswordResetState {
  step: ResetStep;
  email: string;
  otp2Failures: number;
  expiresAt: number | null;
  isLoading: boolean;
  error: PasswordResetError | null;

  requestOTP1: (email: string) => Promise<void>;
  verifyOTP1: (code: string) => Promise<void>;
  confirmInit: (newPassword: string) => Promise<void>;
  confirmFinal: (code: string) => Promise<void>;
  resetFlow: () => Promise<void>;
  clearError: () => void;
}

function getErrorStatus(err: unknown): number | undefined {
  const axiosError = err as { response?: { status?: number } } | undefined;
  return axiosError?.response?.status;
}

function getErrorMessage(status: number | undefined, defaultMsg: string): string {
  switch (status) {
    case 401:
      return 'passwordReset.error401';
    case 422:
      return 'passwordReset.error422';
    case 429:
      return 'passwordReset.error429';
    case 423:
      return 'passwordReset.error423';
    default:
      return defaultMsg;
  }
}

function handoffExpiresAt(response: unknown): number {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    throw new Error('Invalid password reset hand-off');
  }
  const handoff = response as Record<string, unknown>;
  if (
    handoff.handoff_ready !== true ||
    typeof handoff.expires_in_seconds !== 'number' ||
    !Number.isFinite(handoff.expires_in_seconds) ||
    handoff.expires_in_seconds <= 0 ||
    handoff.expires_in_seconds > 10 * 60
  ) {
    throw new Error('Invalid password reset hand-off');
  }
  return Date.now() + Math.floor(handoff.expires_in_seconds) * 1000;
}

export const usePasswordResetStore = create<PasswordResetState>((set, get) => ({
  step: 'idle',
  email: '',
  otp2Failures: 0,
  expiresAt: null,
  isLoading: false,
  error: null,

  requestOTP1: async (email) => {
    set({ isLoading: true, error: null, step: 'idle', email, otp2Failures: 0 });
    try {
      // Revoca sempre eventuali hand-off di un tentativo precedente prima di
      // iniziare un nuovo flusso. L'endpoint /request ripete la cancellazione.
      try {
        await authApi.clearPasswordResetSession();
      } catch {
        // Continua: la risposta del BFF /request cancella nuovamente i cookie.
      }
      const res = await authApi.requestPasswordReset(email);
      // Response generica anti-enumeration
      void res;
      set({
        step: 'otp1_requested',
        isLoading: false,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 min fallback se manca expires_in_seconds
        error: null,
      });
    } catch (err) {
      const status = getErrorStatus(err);
      set({
        step: 'error',
        isLoading: false,
        error: {
          message: getErrorMessage(status, 'passwordReset.errorGeneric'),
          status,
        },
      });
    }
  },

  verifyOTP1: async (code) => {
    if (get().isLoading) return; // guard re-entrancy: doppio tap non spara 2 richieste OTP
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.verifyPasswordResetCode(get().email, code);
      set({
        step: 'otp1_verified',
        isLoading: false,
        expiresAt: handoffExpiresAt(res),
        error: null,
      });
    } catch (err) {
      const status = getErrorStatus(err);
      set({
        step: 'error',
        isLoading: false,
        error: {
          message: getErrorMessage(status, 'passwordReset.errorGeneric'),
          status,
        },
      });
    }
  },

  confirmInit: async (newPassword) => {
    if (get().isLoading) return; // guard re-entrancy
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.confirmPasswordResetInit(newPassword);
      set({
        step: 'otp2_requested',
        otp2Failures: 0,
        isLoading: false,
        expiresAt: handoffExpiresAt(res),
        error: null,
      });
    } catch (err) {
      const status = getErrorStatus(err);
      set({
        step: 'error',
        isLoading: false,
        error: {
          message: getErrorMessage(status, 'passwordReset.errorGeneric'),
          status,
        },
      });
    }
  },

  confirmFinal: async (code) => {
    if (get().isLoading) return; // guard re-entrancy
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.confirmPasswordResetFinal(code);
      void res;
      set({
        step: 'completed',
        otp2Failures: 0,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const status = getErrorStatus(err);
      const otp2Failures = get().otp2Failures + (status === 401 ? 1 : 0);
      const retryable =
        (status === 401 && otp2Failures < 3) ||
        status === 429 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        status === undefined;
      set({
        step: retryable ? 'otp2_requested' : 'error',
        otp2Failures,
        isLoading: false,
        error: {
          message: getErrorMessage(status, 'passwordReset.errorGeneric'),
          status,
        },
      });
      if (!retryable) {
        void authApi.clearPasswordResetSession().catch(() => undefined);
      }
    }
  },

  resetFlow: async () => {
    set({
      step: 'idle',
      email: '',
      otp2Failures: 0,
      expiresAt: null,
      isLoading: false,
      error: null,
    });
    try {
      await authApi.clearPasswordResetSession();
    } catch {
      // A subsequent /request also clears both HttpOnly hand-off cookies.
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
