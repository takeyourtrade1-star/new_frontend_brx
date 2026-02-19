import { z } from 'zod';

/** Pagina Login: email + password */
export const loginSchema = z.object({
  email: z.string().min(1, 'Inserisci l’email').email('Email non valida'),
  password: z.string().min(1, 'Inserisci la password'),
});

export type LoginValues = z.infer<typeof loginSchema>;

/** Header: username + password (accesso diretto) */
export const headerLoginSchema = z.object({
  username: z.string().min(1, 'Inserisci lo username'),
  password: z.string().min(1, 'Inserisci la password'),
});

export type HeaderLoginValues = z.infer<typeof headerLoginSchema>;

/** Validazione username (3-20 caratteri, alfanumerici e underscore) */
const usernameSchema = z
  .string()
  .min(3, 'Lo username deve essere di almeno 3 caratteri')
  .max(20, 'Lo username deve essere di massimo 20 caratteri')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Lo username può contenere solo lettere, numeri e underscore'
  );

/** Validazione password (min 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero) */
const passwordSchema = z
  .string()
  .min(8, 'La password deve essere di almeno 8 caratteri')
  .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
  .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
  .regex(/\d/, 'La password deve contenere almeno un numero');

/** Schema base per registrazione */
const baseRegisterSchema = z.object({
  username: usernameSchema,
  email: z.string().email('Email non valida'),
  password: passwordSchema,
  password_confirmation: z.string().min(1, 'Conferma la password'),
  account_type: z.enum(['personal', 'business'], {
    errorMap: () => ({ message: 'Seleziona il tipo di account' }),
  }),
  country: z.string().length(2, 'Codice paese non valido'),
  phone_prefix: z.string().max(5, 'Prefisso telefonico non valido'),
  phone: z.string().max(20, 'Numero di telefono non valido'),
  vat_prefix: z.string().max(2).optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'Devi accettare i termini e condizioni',
  }),
  privacyAccepted: z.boolean().refine((val) => val === true, {
    message: 'Devi accettare la privacy policy',
  }),
  cancellationAccepted: z.boolean().refine((val) => val === true, {
    message: 'Devi accettare la politica di cancellazione',
  }),
  adultConfirmed: z.boolean().refine((val) => val === true, {
    message: 'Devi confermare di essere maggiorenne',
  }),
});

/** Schema per account personale */
const personalRegisterSchema = baseRegisterSchema.extend({
  account_type: z.literal('personal'),
  first_name: z.string().min(1, 'Inserisci il nome').max(100),
  last_name: z.string().min(1, 'Inserisci il cognome').max(100),
});

/** Schema per account business */
const businessRegisterSchema = baseRegisterSchema.extend({
  account_type: z.literal('business'),
  ragione_sociale: z.string().min(1, 'Inserisci la ragione sociale').max(255),
  piva: z.string().min(1, 'Inserisci la partita IVA').max(20),
});

/** Schema registrazione con validazione password */
export const registerSchema = z
  .discriminatedUnion('account_type', [
    personalRegisterSchema,
    businessRegisterSchema,
  ])
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Le password non corrispondono',
    path: ['password_confirmation'],
  });

export type RegisterValues = z.infer<typeof registerSchema>;

/** Schema per verifica MFA */
export const verifyMFASchema = z.object({
  pre_auth_token: z.string().min(1, 'Token MFA richiesto'),
  mfa_code: z
    .string()
    .length(6, 'Il codice MFA deve essere di 6 cifre')
    .regex(/^\d+$/, 'Il codice MFA deve contenere solo numeri'),
});

export type VerifyMFAValues = z.infer<typeof verifyMFASchema>;