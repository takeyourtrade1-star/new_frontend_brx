import { z } from 'zod';

/** Schema per verifica MFA */
export const verifyMFASchema = z.object({
  pre_auth_token: z.string().min(1, 'Token MFA richiesto'),
  mfa_code: z
    .string()
    .length(6, 'Il codice MFA deve essere di 6 cifre')
    .regex(/^\d+$/, 'Il codice MFA deve contenere solo numeri'),
});

export type VerifyMFAValues = z.infer<typeof verifyMFASchema>;
