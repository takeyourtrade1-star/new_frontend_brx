import { z } from 'zod';

/** Pagina Login: email/username + password (messaggi = chiavi i18n) */
export const loginSchema = z.object({
  identifier: z.string().min(1, 'validation.emailRequired'),
  password: z.string().min(1, 'validation.passwordRequired'),
});

export type LoginValues = z.infer<typeof loginSchema>;

/** Header: username + password (messaggi = chiavi i18n) */
export const headerLoginSchema = z.object({
  username: z.string().min(1, 'validation.usernameRequired'),
  password: z.string().min(1, 'validation.passwordRequired'),
});

export type HeaderLoginValues = z.infer<typeof headerLoginSchema>;

/** Schema richiesta codice login via email */
export const loginCodeRequestSchema = z.object({
  email: z.string().min(1, 'validation.emailRequired').email('validation.emailInvalid'),
});

export type LoginCodeRequestValues = z.infer<typeof loginCodeRequestSchema>;

/** Schema verifica codice login via email (8 caratteri, solo a-z0-9, lowercase) */
export const loginCodeVerifySchema = z.object({
  email: z.string().min(1, 'validation.emailRequired').email('validation.emailInvalid'),
  code: z
    .string()
    .min(1, 'validation.codeRequired')
    .length(8, 'validation.codeFormat')
    .regex(/^[a-z0-9]+$/, 'validation.codeFormat')
    .transform((v) => v.toLowerCase()),
});

export type LoginCodeVerifyValues = z.infer<typeof loginCodeVerifySchema>;
