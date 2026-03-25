/**
 * useAuthError - Hook for handling authentication errors with i18n
 * 
 * Provides:
 * - Error parsing from backend responses
 * - i18n translated error messages
 * - Field-specific error mapping for forms
 * - Retry countdown for rate limiting
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  parseAuthErrorToCode,
  getAuthFieldErrors,
  AUTH_ERROR_CODES,
  type AuthErrorCode,
  type ParsedAuthError,
} from '@/lib/errors/auth-error-codes';

export interface UseAuthErrorReturn {
  // Parsed error state
  error: ParsedAuthError | null;
  
  // Form field errors (for form validation)
  fieldErrors: Record<string, string>;
  
  // Translated error message
  errorMessage: string;
  
  // Whether there's an error
  hasError: boolean;
  
  // Whether it's a network error
  isNetworkError: boolean;
  
  // Whether it's a rate limit error
  isRateLimitError: boolean;
  
  // Retry countdown for rate limiting
  retryAfter: number;
  
  // Actions
  setError: (error: any) => void;
  clearError: () => void;
  getFieldError: (field: string) => string | undefined;
}

export function useAuthError(): UseAuthErrorReturn {
  const { t } = useTranslation();
  const [parsedError, setParsedError] = useState<ParsedAuthError | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  // Handle countdown timer for rate limiting
  useEffect(() => {
    if (parsedError?.retryAfterSeconds && parsedError.retryAfterSeconds > 0) {
      setRetryCountdown(parsedError.retryAfterSeconds);
      
      const timer = setInterval(() => {
        setRetryCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [parsedError?.retryAfterSeconds]);

  /**
   * Get translated message for an error code
   */
  const getTranslatedMessage = useCallback((code: AuthErrorCode, retryAfter?: number): string => {
    // Special handling for rate limit with retry after
    if (code === AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED && retryAfter && retryAfter > 0) {
      return t('errors.auth.rateLimitRetryAfter', { seconds: retryAfter });
    }
    
    return t(code);
  }, [t]);

  /**
   * Set error from any error object
   */
  const setError = useCallback((error: any) => {
    const parsed = parseAuthErrorToCode(error);
    setParsedError(parsed);
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setParsedError(null);
    setRetryCountdown(0);
  }, []);

  /**
   * Get translated error for a specific field
   */
  const getFieldError = useCallback((field: string): string | undefined => {
    if (!parsedError?.fieldErrors?.[field]) return undefined;
    return t(parsedError.fieldErrors[field]);
  }, [parsedError?.fieldErrors, t]);

  // Compute translated field errors map
  const fieldErrors = useMemo(() => {
    if (!parsedError?.fieldErrors) return {};
    
    const result: Record<string, string> = {};
    for (const [field, code] of Object.entries(parsedError.fieldErrors)) {
      result[field] = t(code);
    }
    return result;
  }, [parsedError?.fieldErrors, t]);

  // Main translated error message
  const errorMessage = useMemo(() => {
    if (!parsedError) return '';
    return getTranslatedMessage(parsedError.code, parsedError.retryAfterSeconds);
  }, [parsedError, getTranslatedMessage]);

  return {
    error: parsedError,
    fieldErrors,
    errorMessage,
    hasError: !!parsedError,
    isNetworkError: parsedError?.isNetworkError || false,
    isRateLimitError: parsedError?.code === AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    retryAfter: retryCountdown,
    setError,
    clearError,
    getFieldError,
  };
}

/**
 * Standalone function to get translated error message
 * Useful for non-component error handling
 */
export function getTranslatedAuthError(
  t: (key: string, vars?: Record<string, string | number>) => string,
  error: any
): string {
  const parsed = parseAuthErrorToCode(error);
  
  if (parsed.code === AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED && parsed.retryAfterSeconds) {
    return t('errors.auth.rateLimitRetryAfter', { seconds: parsed.retryAfterSeconds });
  }
  
  return t(parsed.code);
}
