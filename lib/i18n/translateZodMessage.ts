import type { MessageKey } from './messages/en';

/** Se il messaggio Zod è una chiave i18n (es. `validation.emailRequired`), traduce. */
export function translateZodMessage(
  message: string | undefined,
  t: (k: MessageKey, vars?: Record<string, string | number>) => string
): string {
  if (!message) return '';
  if (
    message.startsWith('validation.') ||
    message.startsWith('recoverForm.') ||
    message.startsWith('loginForm.') ||
    message.startsWith('accountPage.') ||
    message.startsWith('registerForm.')
  ) {
    return t(message as MessageKey);
  }
  return message;
}
