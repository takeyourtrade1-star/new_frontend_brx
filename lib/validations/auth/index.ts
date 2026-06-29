/**
 * Barrel degli schemi di validazione auth.
 * Suddiviso per flusso: login, registrazione, MFA, reset password.
 * Gli import esistenti `@/lib/validations/auth` continuano a funzionare.
 */
export * from './login';
export * from './registration';
export * from './mfa';
export * from './password-reset';
