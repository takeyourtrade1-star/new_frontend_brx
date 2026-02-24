/**
 * Schema di validazione registrazione – allineati a API_REGISTRAZIONE_FRONTEND.md
 * Tre tipi: demo (solo obbligatori), privato (+ nome/cognome), business (+ ragione_sociale, piva, vat_prefix).
 */

import { z } from 'zod';

const usernameSchema = z
  .string()
  .min(3, 'Minimo 3 caratteri')
  .max(20, 'Massimo 20 caratteri')
  .regex(/^[a-zA-Z0-9_]+$/, 'Solo lettere, numeri e underscore');

const passwordSchema = z
  .string()
  .min(8, 'Minimo 8 caratteri')
  .regex(/[A-Z]/, 'Almeno una lettera maiuscola')
  .regex(/[a-z]/, 'Almeno una lettera minuscola')
  .regex(/\d/, 'Almeno un numero');

/** Base object (senza refine) così possiamo usare .extend() */
const baseRegisterObject = z.object({
  website_url: z.literal('').optional(),
  username: usernameSchema,
  email: z.string().email('Email non valida'),
  password: passwordSchema,
  phone: z.string().max(20, 'Massimo 20 caratteri'),
  phone_prefix: z.string().max(5).default('+39'),
  country: z.string().length(2, 'Codice paese 2 caratteri (es. IT)'),
  termsAccepted: z.boolean(),
  privacyAccepted: z.boolean(),
  cancellationAccepted: z.boolean(),
  adultConfirmed: z.boolean(),
});

/** Refine per le 4 checkbox (da applicare agli schemi finali) */
const checkboxRefines = (s: z.ZodTypeAny) =>
  s
    .refine((d: { termsAccepted: boolean }) => d.termsAccepted === true, { message: 'Devi accettare i termini e condizioni', path: ['termsAccepted'] })
    .refine((d: { privacyAccepted: boolean }) => d.privacyAccepted === true, { message: 'Devi accettare la privacy policy', path: ['privacyAccepted'] })
    .refine((d: { cancellationAccepted: boolean }) => d.cancellationAccepted === true, { message: 'Devi accettare la policy di cancellazione', path: ['cancellationAccepted'] })
    .refine((d: { adultConfirmed: boolean }) => d.adultConfirmed === true, { message: 'Devi dichiarare di essere maggiorenne', path: ['adultConfirmed'] });

/** Demo: solo campi obbligatori; account_type = "personal" */
export const registerDemoSchema = checkboxRefines(baseRegisterObject);
export type RegisterDemoValues = z.infer<typeof registerDemoSchema>;

/** Privato: base + first_name, last_name; account_type = "personal" */
export const registerPrivatoSchema = checkboxRefines(
  baseRegisterObject.extend({
    first_name: z.string().min(1, 'Inserisci il nome').max(100),
    last_name: z.string().min(1, 'Inserisci il cognome').max(100),
  })
);
export type RegisterPrivatoValues = z.infer<typeof registerPrivatoSchema>;

/** Business: base + ragione_sociale, piva, vat_prefix opzionale; account_type = "business" */
export const registerBusinessSchema = checkboxRefines(
  baseRegisterObject.extend({
    ragione_sociale: z.string().min(1, 'Inserisci la ragione sociale').max(255),
    piva: z.string().min(1, 'Inserisci la Partita IVA').max(20),
    vat_prefix: z.string().max(2).optional().nullable(),
  })
);
export type RegisterBusinessValues = z.infer<typeof registerBusinessSchema>;

/** Costruisce il payload per POST /api/auth/register da valori form demo */
export function toRegisterPayloadDemo(values: RegisterDemoValues): import('@/types').RegisterData {
  return {
    website_url: '',
    username: values.username,
    email: values.email,
    password: values.password,
    phone: values.phone,
    phone_prefix: values.phone_prefix || '+39',
    account_type: 'personal',
    country: values.country,
    termsAccepted: true,
    privacyAccepted: true,
    cancellationAccepted: true,
    adultConfirmed: true,
  };
}

/** Payload per registrazione privato */
export function toRegisterPayloadPrivato(values: RegisterPrivatoValues): import('@/types').RegisterData {
  return {
    ...toRegisterPayloadDemo({
      username: values.username,
      email: values.email,
      password: values.password,
      phone: values.phone,
      phone_prefix: values.phone_prefix,
      country: values.country,
      termsAccepted: values.termsAccepted,
      privacyAccepted: values.privacyAccepted,
      cancellationAccepted: values.cancellationAccepted,
      adultConfirmed: values.adultConfirmed,
    }),
    first_name: values.first_name,
    last_name: values.last_name,
  };
}

/** Payload per registrazione business */
export function toRegisterPayloadBusiness(values: RegisterBusinessValues): import('@/types').RegisterData {
  return {
    website_url: '',
    username: values.username,
    email: values.email,
    password: values.password,
    phone: values.phone,
    phone_prefix: values.phone_prefix || '+39',
    account_type: 'business',
    country: values.country,
    ragione_sociale: values.ragione_sociale,
    piva: values.piva,
    vat_prefix: values.vat_prefix ?? undefined,
    termsAccepted: true,
    privacyAccepted: true,
    cancellationAccepted: true,
    adultConfirmed: true,
  };
}

export const PHONE_PREFIXES = ['+39', '+1', '+33', '+34', '+49', '+41', '+43', '+44'] as const;
export const COUNTRIES = [
  { code: 'IT', label: 'Italia' },
  { code: 'DE', label: 'Germania' },
  { code: 'FR', label: 'Francia' },
  { code: 'ES', label: 'Spagna' },
  { code: 'AT', label: 'Austria' },
  { code: 'CH', label: 'Svizzera' },
  { code: 'GB', label: 'Regno Unito' },
  { code: 'US', label: 'Stati Uniti' },
] as const;
