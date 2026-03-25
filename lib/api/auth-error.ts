/**
 * Auth Error Parser - Normalizza errori dal microservizio auth
 * Gestisce formati: { detail: string }, 422 errors[], 409 conflicts, 429 rate-limit
 */

export interface ParsedAuthError {
  status?: number;
  message: string;
  fieldErrors?: Record<string, string>;
  retryAfterSeconds?: number;
}

// Mappa traduzioni errori backend → italiano user-friendly
const ERROR_TRANSLATIONS: Record<string, string> = {
  // Login errors
  'invalid credentials': 'Email/username o password non corretti.',
  'invalid credentials.': 'Email/username o password non corretti.',
  
  // Account status
  'account is locked. please try again later.': 'Account bloccato. Riprova più tardi.',
  'account is locked': 'Account bloccato. Riprova più tardi.',
  'account is locked.': 'Account bloccato. Riprova più tardi.',
  'account is banned': 'Account disabilitato.',
  'account is banned.': 'Account disabilitato.',
  
  // MFA errors
  'invalid mfa code': 'Codice MFA non valido.',
  'invalid mfa code.': 'Codice MFA non valido.',
  'mfa not enabled for this account': 'MFA non abilitata per questo account.',
  'mfa not enabled for this account.': 'MFA non abilitata per questo account.',
  'mfa verification failed': 'Verifica MFA fallita.',
  'mfa verification failed.': 'Verifica MFA fallita.',
  'mfa verification required': 'Devi completare la verifica MFA.',
  'mfa verification required.': 'Devi completare la verifica MFA.',
  
  // Token/Session errors
  'invalid refresh token': 'Sessione scaduta. Effettua di nuovo l\'accesso.',
  'invalid refresh token.': 'Sessione scaduta. Effettua di nuovo l\'accesso.',
  'token has been invalidated': 'Sessione scaduta. Effettua di nuovo l\'accesso.',
  'token has been invalidated.': 'Sessione scaduta. Effettua di nuovo l\'accesso.',
  'session has expired': 'Sessione scaduta. Effettua di nuovo l\'accesso.',
  'session has expired.': 'Sessione scaduta. Effettua di nuovo l\'accesso.',
  
  // Rate limiting
  'rate limit exceeded. please try again later.': 'Troppi tentativi. Riprova più tardi.',
  'rate limit exceeded': 'Troppi tentativi. Riprova più tardi.',
  'rate limit exceeded.': 'Troppi tentativi. Riprova più tardi.',
  'too many requests': 'Troppi tentativi. Riprova più tardi.',
  'too many requests.': 'Troppi tentativi. Riprova più tardi.',
  
  // Proxy errors
  'next_public_auth_api_url is not configured': 'Configurazione servizio auth mancante (server).',
  'next_public_auth_api_url is not configured.': 'Configurazione servizio auth mancante (server).',
};

/**
 * Traduce un messaggio di errore usando la mappa keyword → italiano
 */
function translateErrorMessage(message: string): string {
  const normalized = message.toLowerCase().trim();
  return ERROR_TRANSLATIONS[normalized] || message;
}

/**
 * Estrae il nome del campo da una locazione FastAPI (array di stringhe)
 * Es: ['body', 'username'] → 'username'
 */
function extractFieldFromLoc(loc?: string[]): string | null {
  if (!Array.isArray(loc) || loc.length === 0) return null;
  // L'ultimo elemento è il nome del campo
  const field = loc[loc.length - 1];
  return typeof field === 'string' ? field : null;
}

/**
 * Riconosce il campo in errore da un messaggio 409 (username/email già usati)
 */
function detectConflictField(detail: string): { field: string; message: string } | null {
  const lower = detail.toLowerCase();
  
  if (lower.includes('username')) {
    return { field: 'username', message: detail };
  }
  if (lower.includes('email')) {
    return { field: 'email', message: detail };
  }
  
  return null;
}

/**
 * Parsa un errore Axios/HTTP dal microservizio auth
 */
export function parseAuthError(error: any): ParsedAuthError {
  const status = error?.response?.status;
  const data = error?.response?.data;
  
  // Default fallback
  let message = 'Errore di comunicazione. Riprova più tardi.';
  let fieldErrors: Record<string, string> | undefined;
  let retryAfterSeconds: number | undefined;

  // Se non c'è response, è un errore di rete
  if (!error?.response) {
    message = error?.message || 'Errore di comunicazione. Riprova più tardi.';
    return { message };
  }

  // 422 Unprocessable Entity - Validation errors
  if (status === 422 && Array.isArray(data?.errors)) {
    fieldErrors = {};
    let firstMessage = '';
    
    for (const err of data.errors) {
      const field = extractFieldFromLoc(err?.loc);
      const msg = err?.msg;
      
      if (field && msg && !fieldErrors[field]) {
        fieldErrors[field] = msg;
        if (!firstMessage) {
          firstMessage = msg;
        }
      }
    }
    
    message = data?.detail || firstMessage || 'Controlla i campi e riprova';
    message = translateErrorMessage(message);
    
    return { status, message, fieldErrors };
  }

  // 409 Conflict - Username/email già registrati
  if (status === 409 && typeof data?.detail === 'string') {
    message = translateErrorMessage(data.detail);
    const conflict = detectConflictField(data.detail);
    
    if (conflict) {
      fieldErrors = { [conflict.field]: conflict.message };
    }
    
    return { status, message, fieldErrors };
  }

  // 429 Too Many Requests - Rate limit
  if (status === 429) {
    const detail = data?.detail || 'Troppi tentativi. Riprova più tardi.';
    message = translateErrorMessage(detail);
    
    // Estrai retry_after se presente
    if (data?.retry_after && typeof data.retry_after === 'number') {
      retryAfterSeconds = data.retry_after;
      message += ` Riprova tra ${retryAfterSeconds} secondi.`;
    }
    
    return { status, message, retryAfterSeconds };
  }

  // 503 Service Unavailable (rate limiting service)
  if (status === 503 && typeof data?.detail === 'string') {
    if (data.detail.toLowerCase().includes('rate limiting service unavailable')) {
      message = 'Servizio temporaneamente non disponibile. Riprova tra qualche secondo.';
    } else {
      message = translateErrorMessage(data.detail);
    }
    return { status, message };
  }

  // 502 Bad Gateway - Proxy error
  if (status === 502) {
    message = data?.detail 
      ? translateErrorMessage(data.detail)
      : 'Errore di comunicazione con il servizio auth. Riprova più tardi.';
    return { status, message };
  }

  // 401 Unauthorized - Sessione scaduta
  if (status === 401 && typeof data?.detail === 'string') {
    message = translateErrorMessage(data.detail);
    // Forza traduzione sessione scaduta per errori comuni 401
    const lowerMsg = data.detail.toLowerCase();
    if (
      lowerMsg.includes('token') ||
      lowerMsg.includes('session') ||
      lowerMsg.includes('unauthorized')
    ) {
      if (!ERROR_TRANSLATIONS[lowerMsg]) {
        message = 'Sessione scaduta. Effettua di nuovo l\'accesso.';
      }
    }
    return { status, message };
  }

  // 400 Bad Request (honeypot/altri)
  if (status === 400 && typeof data?.detail === 'string') {
    message = translateErrorMessage(data.detail);
    return { status, message };
  }

  // Formato generico: { detail: string }
  if (typeof data?.detail === 'string') {
    message = translateErrorMessage(data.detail);
    return { status, message };
  }

  // Formato array: { detail: [{ msg, ... }] } (compatibilità legacy)
  if (Array.isArray(data?.detail) && data.detail.length > 0) {
    const firstErr = data.detail[0];
    if (firstErr?.msg) {
      message = translateErrorMessage(firstErr.msg);
    } else if (firstErr?.message) {
      message = translateErrorMessage(firstErr.message);
    }
    return { status, message };
  }

  // Fallback su error.message
  if (error?.message) {
    message = translateErrorMessage(error.message);
  }

  return { status, message };
}

/**
 * Helper per ottenere solo il messaggio (caso d'uso semplice)
 */
export function getAuthErrorMessage(error: any): string {
  return parseAuthError(error).message;
}
