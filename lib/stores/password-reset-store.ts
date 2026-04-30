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
  resetToken: string | null;
  confirmToken: string | null;
  expiresAt: number | null;
  isLoading: boolean;
  error: PasswordResetError | null;

  requestOTP1: (email: string) => Promise<void>;
  verifyOTP1: (code: string) => Promise<void>;
  confirmInit: (newPassword: string) => Promise<void>;
  confirmFinal: (code: string) => Promise<void>;
  resetFlow: () => void;
  clearError: () => void;
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

export const usePasswordResetStore = create<PasswordResetState>((set, get) => ({
  step: 'idle',
  email: '',
  resetToken: null,
  confirmToken: null,
  expiresAt: null,
  isLoading: false,
  error: null,

  requestOTP1: async (email) => {
    set({ isLoading: true, error: null, step: 'idle', email });
    try {
      const res = await authApi.requestPasswordReset(email);
      // Response generica anti-enumeration
      void res;
      set({
        step: 'otp1_requested',
        isLoading: false,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 min fallback se manca expires_in_seconds
        error: null,
      });
    } catch (err: any) {
      const status = err?.response?.status;
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
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.verifyPasswordResetCode(get().email, code);
      set({
        step: 'otp1_verified',
        resetToken: res.token,
        isLoading: false,
        expiresAt: Date.now() + res.expires_in_seconds * 1000,
        error: null,
      });
    } catch (err: any) {
      const status = err?.response?.status;
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
    set({ isLoading: true, error: null });
    const token = get().resetToken;
    if (!token) {
      set({
        step: 'error',
        isLoading: false,
        error: { message: 'passwordReset.error401', status: 401 },
      });
      return;
    }
    try {
      const res = await authApi.confirmPasswordResetInit(token, newPassword);
      set({
        step: 'otp2_requested',
        confirmToken: res.token,
        isLoading: false,
        expiresAt: Date.now() + res.expires_in_seconds * 1000,
        error: null,
      });
    } catch (err: any) {
      const status = err?.response?.status;
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
    set({ isLoading: true, error: null });
    const token = get().confirmToken;
    if (!token) {
      set({
        step: 'error',
        isLoading: false,
        error: { message: 'passwordReset.error401', status: 401 },
      });
      return;
    }
    try {
      const res = await authApi.confirmPasswordResetFinal(token, code);
      void res;
      set({
        step: 'completed',
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      const status = err?.response?.status;
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

  resetFlow: () => {
    set({
      step: 'idle',
      email: '',
      resetToken: null,
      confirmToken: null,
      expiresAt: null,
      isLoading: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
