import { z } from 'zod';

/** Schema browser MFA; il BFF aggiunge il pre-auth token dal cookie HttpOnly. */
export const verifyMFASchema = z.object({
  mfa_code: z
    .string()
    .length(6, 'errors.validation.mfaCodeLength')
    .regex(/^\d+$/, 'errors.validation.mfaCodeDigits'),
});

export type VerifyMFAValues = z.infer<typeof verifyMFASchema>;
