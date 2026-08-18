import { z } from 'zod';
import { isValidPhone } from '@/lib/validations/phone';

// I messaggi sono chiavi i18n (`errors.validation.*` / `validation.*`),
// risolte a runtime da `translateZodMessage`. Riusano le stesse chiavi dei
// codici errore backend (vedi lib/errors/auth-error-codes.ts).

/** Validazione username (3-20 caratteri, alfanumerici e underscore) */
const usernameSchema = z
  .string()
  .min(3, 'errors.validation.usernameLength')
  .max(20, 'errors.validation.usernameLength')
  .regex(/^[a-zA-Z0-9_]+$/, 'errors.validation.usernameFormat');

/** Validazione password (min 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero) */
const passwordSchema = z
  .string()
  .min(8, 'errors.validation.passwordMinLength')
  .regex(/[A-Z]/, 'errors.validation.passwordUppercase')
  .regex(/[a-z]/, 'errors.validation.passwordLowercase')
  .regex(/\d/, 'errors.validation.passwordNumber');

/** Schema base per registrazione */
const baseRegisterSchema = z.object({
  username: usernameSchema,
  email: z.string().email('errors.validation.emailInvalid'),
  password: passwordSchema,
  password_confirmation: z.string().min(1, 'validation.confirmPasswordRequired'),
  account_type: z.enum(['personal', 'business'], {
    errorMap: () => ({ message: 'errors.validation.accountTypeInvalid' }),
  }),
  country: z.string().length(2, 'errors.validation.countryInvalid'),
  phone_prefix: z.string().max(5, 'errors.validation.phonePrefixInvalid'),
  phone: z.string().min(1, 'errors.validation.phoneInvalid').max(20, 'errors.validation.phoneInvalid'),
  vat_prefix: z.string().max(2).optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'errors.validation.termsRequired',
  }),
  privacyAccepted: z.boolean().refine((val) => val === true, {
    message: 'errors.validation.privacyRequired',
  }),
  cancellationAccepted: z.boolean().refine((val) => val === true, {
    message: 'errors.validation.cancellationRequired',
  }),
  adultConfirmed: z.boolean().refine((val) => val === true, {
    message: 'errors.validation.adultRequired',
  }),
});

/** Schema per account personale */
const personalRegisterSchema = baseRegisterSchema.extend({
  account_type: z.literal('personal'),
  first_name: z.string().min(1, 'errors.validation.firstNameRequired').max(100),
  last_name: z.string().min(1, 'errors.validation.lastNameRequired').max(100),
});

/** Schema per account business */
const businessRegisterSchema = baseRegisterSchema.extend({
  account_type: z.literal('business'),
  ragione_sociale: z
    .string()
    .min(1, 'errors.validation.ragioneSocialeRequired')
    .max(255),
  piva: z.string().min(1, 'errors.validation.pivaRequired').max(20),
});

/** Schema registrazione con validazione password e telefono */
export const registerSchema = z
  .discriminatedUnion('account_type', [
    personalRegisterSchema,
    businessRegisterSchema,
  ])
  .refine((data) => data.password === data.password_confirmation, {
    message: 'validation.passwordMismatch',
    path: ['password_confirmation'],
  })
  .refine((data) => isValidPhone(data.phone, data.phone_prefix, data.country), {
    message: 'errors.validation.phoneInvalid',
    path: ['phone'],
  });

export type RegisterValues = z.infer<typeof registerSchema>;
