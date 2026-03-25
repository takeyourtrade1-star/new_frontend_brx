/**
 * Auth Error Codes - Mapping backend errors to i18n keys
 * 
 * This module provides:
 * 1. Error code constants for all backend error scenarios
 * 2. A mapper from HTTP status + backend detail → i18n key
 * 3. Field error mapping for 422 validation errors
 */

import type { MessageKey } from '@/lib/i18n/messages/en';

// ============================================================================
// ERROR CODE CONSTANTS - Used as i18n keys
// ============================================================================

export const AUTH_ERROR_CODES = {
  // Login errors
  LOGIN_INVALID_CREDENTIALS: 'errors.auth.login.invalidCredentials',
  LOGIN_ACCOUNT_LOCKED: 'errors.auth.login.accountLocked',
  LOGIN_ACCOUNT_LOCKED_RETRY: 'errors.auth.login.accountLockedRetry',
  LOGIN_ACCOUNT_BANNED: 'errors.auth.login.accountBanned',
  LOGIN_MFA_REQUIRED: 'errors.auth.login.mfaRequired',
  LOGIN_MFA_INVALID: 'errors.auth.login.mfaInvalid',
  
  // Registration errors  
  REGISTER_USERNAME_TAKEN: 'errors.auth.register.usernameTaken',
  REGISTER_EMAIL_TAKEN: 'errors.auth.register.emailTaken',
  REGISTER_INVALID_REQUEST: 'errors.auth.register.invalidRequest',
  
  // Validation errors
  VALIDATION_EMAIL_REQUIRED: 'errors.validation.emailRequired',
  VALIDATION_EMAIL_INVALID: 'errors.validation.emailInvalid',
  VALIDATION_PASSWORD_REQUIRED: 'errors.validation.passwordRequired',
  VALIDATION_PASSWORD_MIN_LENGTH: 'errors.validation.passwordMinLength',
  VALIDATION_PASSWORD_UPPERCASE: 'errors.validation.passwordUppercase',
  VALIDATION_PASSWORD_LOWERCASE: 'errors.validation.passwordLowercase',
  VALIDATION_PASSWORD_NUMBER: 'errors.validation.passwordNumber',
  VALIDATION_USERNAME_REQUIRED: 'errors.validation.usernameRequired',
  VALIDATION_USERNAME_FORMAT: 'errors.validation.usernameFormat',
  VALIDATION_USERNAME_LENGTH: 'errors.validation.usernameLength',
  VALIDATION_ACCOUNT_TYPE_INVALID: 'errors.validation.accountTypeInvalid',
  VALIDATION_FIRST_NAME_REQUIRED: 'errors.validation.firstNameRequired',
  VALIDATION_LAST_NAME_REQUIRED: 'errors.validation.lastNameRequired',
  VALIDATION_RAGIONE_SOCIALE_REQUIRED: 'errors.validation.ragioneSocialeRequired',
  VALIDATION_PIVA_REQUIRED: 'errors.validation.pivaRequired',
  VALIDATION_COUNTRY_INVALID: 'errors.validation.countryInvalid',
  VALIDATION_PHONE_PREFIX_INVALID: 'errors.validation.phonePrefixInvalid',
  VALIDATION_PHONE_INVALID: 'errors.validation.phoneInvalid',
  VALIDATION_FIELD_REQUIRED: 'errors.validation.fieldRequired',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'errors.auth.rateLimitExceeded',
  RATE_LIMIT_RETRY_AFTER: 'errors.auth.rateLimitRetryAfter',
  RATE_LIMIT_SERVICE_UNAVAILABLE: 'errors.auth.rateLimitServiceUnavailable',
  
  // Server/Proxy errors
  SERVER_CONFIG_ERROR: 'errors.auth.server.configError',
  SERVER_PROXY_ERROR: 'errors.auth.server.proxyError',
  SERVER_UNAVAILABLE: 'errors.auth.server.unavailable',
  
  // Network errors
  NETWORK_ERROR: 'errors.network.generic',
  NETWORK_TIMEOUT: 'errors.network.timeout',
  NETWORK_OFFLINE: 'errors.network.offline',
  
  // Generic fallback
  UNKNOWN_ERROR: 'errors.generic.unknown',
  GENERIC_ERROR: 'errors.generic.message',
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];

// ============================================================================
// BACKEND ERROR PATTERNS → ERROR CODES
// ============================================================================

interface ErrorPattern {
  status?: number;
  patterns: string[];
  code: AuthErrorCode;
  field?: string; // For field-specific errors
}

// Patterns mapped by status code and backend detail message
const ERROR_PATTERNS: ErrorPattern[] = [
  // Login: 401 Invalid credentials
  {
    status: 401,
    patterns: ['invalid credentials', 'invalid credentials.'],
    code: AUTH_ERROR_CODES.LOGIN_INVALID_CREDENTIALS,
  },
  // Login: 401 Account banned (specific message)
  {
    status: 401,
    patterns: ['account is banned', 'account is banned.', 'banned', 'disabled'],
    code: AUTH_ERROR_CODES.LOGIN_ACCOUNT_BANNED,
  },
  // Login: 423 Account locked with retry
  {
    status: 423,
    patterns: ['account is locked. please try again later.', 'locked_until', 'retry'],
    code: AUTH_ERROR_CODES.LOGIN_ACCOUNT_LOCKED_RETRY,
  },
  // Login: 423 Account locked generic
  {
    status: 423,
    patterns: ['account is locked', 'account is locked.'],
    code: AUTH_ERROR_CODES.LOGIN_ACCOUNT_LOCKED,
  },
  // Registration: 409 Username taken
  {
    status: 409,
    patterns: ['username already registered', 'username already exists', 'username taken'],
    code: AUTH_ERROR_CODES.REGISTER_USERNAME_TAKEN,
    field: 'username',
  },
  // Registration: 409 Email taken
  {
    status: 409,
    patterns: ['email already registered', 'email already exists', 'email taken'],
    code: AUTH_ERROR_CODES.REGISTER_EMAIL_TAKEN,
    field: 'email',
  },
  // Registration: 400 Invalid request (honeypot)
  {
    status: 400,
    patterns: ['invalid request', 'honeypot', 'website_url'],
    code: AUTH_ERROR_CODES.REGISTER_INVALID_REQUEST,
  },
  // Rate limit: 429
  {
    status: 429,
    patterns: ['rate limit exceeded', 'too many requests', 'retry_after'],
    code: AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED,
  },
  // Rate limit service unavailable: 503
  {
    status: 503,
    patterns: ['rate limiting service unavailable'],
    code: AUTH_ERROR_CODES.RATE_LIMIT_SERVICE_UNAVAILABLE,
  },
  // Server config error: 503
  {
    status: 503,
    patterns: ['next_public_auth_api_url is not configured', 'not configured'],
    code: AUTH_ERROR_CODES.SERVER_CONFIG_ERROR,
  },
  // Proxy error: 502
  {
    status: 502,
    patterns: ['proxy request failed', 'bad gateway'],
    code: AUTH_ERROR_CODES.SERVER_PROXY_ERROR,
  },
];

// Validation error patterns (422) - maps backend msg → error code
const VALIDATION_ERROR_PATTERNS: ErrorPattern[] = [
  // Username validation
  {
    patterns: ['provide either email or username, not both'],
    code: AUTH_ERROR_CODES.VALIDATION_EMAIL_REQUIRED,
    field: 'email',
  },
  {
    patterns: ['provide either email or username'],
    code: AUTH_ERROR_CODES.VALIDATION_EMAIL_REQUIRED,
    field: 'email',
  },
  {
    patterns: ['username must be 3-20 characters', 'alphanumeric and underscore'],
    code: AUTH_ERROR_CODES.VALIDATION_USERNAME_FORMAT,
    field: 'username',
  },
  // Password validation
  {
    patterns: ['password must be at least 8 characters'],
    code: AUTH_ERROR_CODES.VALIDATION_PASSWORD_MIN_LENGTH,
    field: 'password',
  },
  {
    patterns: ['password must contain at least one uppercase'],
    code: AUTH_ERROR_CODES.VALIDATION_PASSWORD_UPPERCASE,
    field: 'password',
  },
  {
    patterns: ['password must contain at least one lowercase'],
    code: AUTH_ERROR_CODES.VALIDATION_PASSWORD_LOWERCASE,
    field: 'password',
  },
  {
    patterns: ['password must contain at least one number'],
    code: AUTH_ERROR_CODES.VALIDATION_PASSWORD_NUMBER,
    field: 'password',
  },
  // Account type
  {
    patterns: ["account_type must be 'personal' or 'business'"],
    code: AUTH_ERROR_CODES.VALIDATION_ACCOUNT_TYPE_INVALID,
    field: 'account_type',
  },
  // Personal account fields
  {
    patterns: ['first_name is required for personal accounts'],
    code: AUTH_ERROR_CODES.VALIDATION_FIRST_NAME_REQUIRED,
    field: 'first_name',
  },
  {
    patterns: ['last_name is required for personal accounts'],
    code: AUTH_ERROR_CODES.VALIDATION_LAST_NAME_REQUIRED,
    field: 'last_name',
  },
  // Business account fields
  {
    patterns: ['ragione_sociale is required for business accounts'],
    code: AUTH_ERROR_CODES.VALIDATION_RAGIONE_SOCIALE_REQUIRED,
    field: 'ragione_sociale',
  },
  {
    patterns: ['piva is required for business accounts'],
    code: AUTH_ERROR_CODES.VALIDATION_PIVA_REQUIRED,
    field: 'piva',
  },
  // Contact fields
  {
    patterns: ['country', 'ensure this value has at least 2 characters', 'ensure this value has at most 2 characters'],
    code: AUTH_ERROR_CODES.VALIDATION_COUNTRY_INVALID,
    field: 'country',
  },
  {
    patterns: ['phone_prefix'],
    code: AUTH_ERROR_CODES.VALIDATION_PHONE_PREFIX_INVALID,
    field: 'phone_prefix',
  },
  {
    patterns: ['phone'],
    code: AUTH_ERROR_CODES.VALIDATION_PHONE_INVALID,
    field: 'phone',
  },
];

// ============================================================================
// INTERFACE FOR PARSED ERRORS
// ============================================================================

export interface ParsedAuthError {
  status?: number;
  code: AuthErrorCode;
  message: string; // Raw backend message (for debugging)
  fieldErrors?: Record<string, AuthErrorCode>;
  retryAfterSeconds?: number;
  isNetworkError?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function normalizeMessage(msg: string): string {
  return msg.toLowerCase().trim();
}

function matchesPattern(message: string, patterns: string[]): boolean {
  const normalized = normalizeMessage(message);
  return patterns.some(pattern => normalized.includes(pattern.toLowerCase()));
}

function findErrorPattern(status: number, detail: string): ErrorPattern | null {
  return ERROR_PATTERNS.find(
    p => (p.status === undefined || p.status === status) && matchesPattern(detail, p.patterns)
  ) || null;
}

function findValidationPattern(msg: string): ErrorPattern | null {
  return VALIDATION_ERROR_PATTERNS.find(p => matchesPattern(msg, p.patterns)) || null;
}

/**
 * Extract field name from FastAPI loc array
 * Example: ['body', 'username'] → 'username'
 */
function extractFieldFromLoc(loc?: string[]): string | null {
  if (!Array.isArray(loc) || loc.length === 0) return null;
  const field = loc[loc.length - 1];
  return typeof field === 'string' ? field : null;
}

// ============================================================================
// MAIN PARSER FUNCTION
// ============================================================================

export function parseAuthErrorToCode(error: any): ParsedAuthError {
  const status = error?.response?.status;
  const data = error?.response?.data;
  
  // Network errors (no response)
  if (!error?.response) {
    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
    const isTimeout = error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');
    
    return {
      code: isOffline ? AUTH_ERROR_CODES.NETWORK_OFFLINE : 
            isTimeout ? AUTH_ERROR_CODES.NETWORK_TIMEOUT : 
            AUTH_ERROR_CODES.NETWORK_ERROR,
      message: error?.message || 'Network error',
      isNetworkError: true,
    };
  }

  // 422 Validation Errors
  if (status === 422 && Array.isArray(data?.errors)) {
    const fieldErrors: Record<string, AuthErrorCode> = {};
    
    for (const err of data.errors) {
      const field = extractFieldFromLoc(err?.loc);
      const msg = err?.msg || '';
      
      if (field && msg) {
        const pattern = findValidationPattern(msg);
        fieldErrors[field] = (pattern?.code || 'errors.validation.fieldRequired') as AuthErrorCode;
      }
    }
    
    // Also try to map the detail message if present
    let mainCode: AuthErrorCode = AUTH_ERROR_CODES.VALIDATION_FIELD_REQUIRED;
    if (data?.detail) {
      const detailPattern = findValidationPattern(data.detail);
      if (detailPattern) mainCode = detailPattern.code;
    }
    
    return {
      status,
      code: mainCode,
      message: data?.detail || 'Validation error',
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    };
  }

  // 409 Conflict (username/email taken)
  if (status === 409 && typeof data?.detail === 'string') {
    const pattern = findErrorPattern(status, data.detail);
    const fieldErrors = pattern?.field ? { [pattern.field]: pattern.code } : undefined;
    
    return {
      status,
      code: pattern?.code || AUTH_ERROR_CODES.UNKNOWN_ERROR,
      message: data.detail,
      fieldErrors,
    };
  }

  // 429 Rate Limit
  if (status === 429) {
    const retryAfter = data?.retry_after || data?.retryAfter;
    
    return {
      status,
      code: AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: data?.detail || 'Rate limit exceeded',
      retryAfterSeconds: typeof retryAfter === 'number' ? retryAfter : undefined,
    };
  }

  // All other status codes with detail
  if (typeof data?.detail === 'string') {
    const pattern = findErrorPattern(status, data.detail);
    
    return {
      status,
      code: pattern?.code || AUTH_ERROR_CODES.UNKNOWN_ERROR,
      message: data.detail,
    };
  }

  // Fallback to generic error
  return {
    status,
    code: AUTH_ERROR_CODES.UNKNOWN_ERROR,
    message: error?.message || 'An unexpected error occurred',
  };
}

/**
 * Get just the error code (for simple use cases)
 */
export function getAuthErrorCode(error: any): AuthErrorCode {
  return parseAuthErrorToCode(error).code;
}

/**
 * Check if error is a specific type
 */
export function isAuthError(error: any, code: AuthErrorCode): boolean {
  return getAuthErrorCode(error) === code;
}

/**
 * Get field errors map for form validation
 */
export function getAuthFieldErrors(error: any): Record<string, AuthErrorCode> | undefined {
  return parseAuthErrorToCode(error).fieldErrors;
}
