/**
 * TanStack Query hooks for authentication
 * Wrapper around auth store actions for use in React components
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth-store';
import type {
  LoginCredentials,
  RegisterData,
  VerifyMFAData,
} from '@/types';

/**
 * Hook per inizializzare l'autenticazione all'avvio dell'app
 */
export function useInitializeAuth() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  return useQuery({
    queryKey: ['auth', 'initialize'],
    queryFn: initializeAuth,
    retry: false,
    staleTime: Infinity,
  });
}

/**
 * Hook per ottenere l'utente corrente
 */
export function useCurrentUser() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: fetchUser,
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minuti
  });
}

/**
 * Hook per il login
 */
export function useLogin() {
  const login = useAuthStore((s) => s.login);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: () => {
      // Invalida le query dell'utente dopo il login
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });
}

/**
 * Hook per la verifica MFA
 */
export function useVerifyMFA() {
  const verifyMFA = useAuthStore((s) => s.verifyMFA);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerifyMFAData) => verifyMFA(data),
    onSuccess: () => {
      // Invalida le query dell'utente dopo la verifica MFA
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });
}

/**
 * Hook per la registrazione
 */
export function useRegister() {
  const register = useAuthStore((s) => s.register);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => register(data),
    onSuccess: () => {
      // Invalida le query dell'utente dopo la registrazione
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });
}

/**
 * Hook per il logout
 */
export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      // Pulisci tutte le query cache dopo il logout
      queryClient.clear();
    },
  });
}

/**
 * Hook per accedere direttamente allo store (per valori sincroni)
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const mfaRequired = useAuthStore((s) => s.mfaRequired);
  const preAuthToken = useAuthStore((s) => s.preAuthToken);
  const flashMessage = useAuthStore((s) => s.flashMessage);
  const clearError = useAuthStore((s) => s.clearError);
  const setFlashMessage = useAuthStore((s) => s.setFlashMessage);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    mfaRequired,
    preAuthToken,
    flashMessage,
    clearError,
    setFlashMessage,
  };
}
