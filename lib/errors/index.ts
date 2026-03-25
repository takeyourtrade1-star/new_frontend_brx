/**
 * Auth Errors - Barrel export for the authentication error handling system
 * 
 * This module provides a complete i18n-enabled error handling system for authentication:
 * - Error code mapping from backend responses
 * - Translated error messages via i18n
 * - React hook for error state management
 * - UI components for elegant error display
 * 
 * Usage:
 * ```tsx
 * import { useAuthError, AuthErrorAlert, AUTH_ERROR_CODES } from '@/lib/errors';
 * 
 * function MyForm() {
 *   const authError = useAuthError();
 *   
 *   const onSubmit = async (data) => {
 *     try {
 *       await apiCall(data);
 *     } catch (err) {
 *       authError.setError(err);
 *     }
 *   };
 *   
 *   return (
 *     <form>
 *       ...
 *       <AuthErrorAlert error={authError} />
 *     </form>
 *   );
 * }
 * ```
 */

// Error codes and parsing
export {
  AUTH_ERROR_CODES,
  parseAuthErrorToCode,
  getAuthErrorCode,
  isAuthError,
  getAuthFieldErrors,
  type AuthErrorCode,
  type ParsedAuthError,
} from './auth-error-codes';

// React hook
export {
  useAuthError,
  getTranslatedAuthError,
  type UseAuthErrorReturn,
} from './useAuthError';
