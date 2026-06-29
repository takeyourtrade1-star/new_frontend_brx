import { z } from 'zod';

/** Schema richiesta reset password Step 1: email */
export const passwordResetRequestSchema = z.object({
  email: z.string().min(1, 'validation.emailRequired').email('validation.emailInvalid'),
});

export type PasswordResetRequestValues = z.infer<typeof passwordResetRequestSchema>;

/** Schema verifica OTP1 Step 2 (8 caratteri alfanumerico lowercase) */
export const passwordResetVerifyOtp1Schema = z.object({
  code: z
    .string()
    .min(1, 'validation.codeRequired')
    .length(8, 'validation.otp1Format')
    .regex(/^[a-z0-9]+$/, 'validation.otp1Format')
    .transform((v) => v.toLowerCase()),
});

export type PasswordResetVerifyOtp1Values = z.infer<typeof passwordResetVerifyOtp1Schema>;

/** Schema nuova password Step 3 (min 12, 1 maiuscola, 1 minuscola, 1 numero) */
export const passwordResetNewPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(12, 'validation.passwordMinLength12')
      .regex(/[A-Z]/, 'validation.passwordUppercase')
      .regex(/[a-z]/, 'validation.passwordLowercase')
      .regex(/\d/, 'validation.passwordNumber'),
    confirm_password: z.string().min(1, 'validation.confirmPasswordRequired'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'validation.passwordMismatch',
    path: ['confirm_password'],
  });

export type PasswordResetNewPasswordValues = z.infer<typeof passwordResetNewPasswordSchema>;

/** Schema verifica OTP2 Step 4 (6 cifre numeriche) */
export const passwordResetVerifyOtp2Schema = z.object({
  code: z
    .string()
    .min(1, 'validation.codeRequired')
    .length(6, 'validation.otp2Format')
    .regex(/^\d+$/, 'validation.otp2Format'),
});

export type PasswordResetVerifyOtp2Values = z.infer<typeof passwordResetVerifyOtp2Schema>;
