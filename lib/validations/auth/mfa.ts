import { z } from 'zod';

/** Schema per verifica MFA (messaggi = chiavi i18n, vedi translateZodMessage) */
export const verifyMFASchema = z.object({
  pre_auth_token: z.string().min(1, 'errors.validation.mfaTokenRequired'),
  mfa_code: z
    .string()
    .length(6, 'errors.validation.mfaCodeLength')
    .regex(/^\d+$/, 'errors.validation.mfaCodeDigits'),
});

export type VerifyMFAValues = z.infer<typeof verifyMFASchema>;
