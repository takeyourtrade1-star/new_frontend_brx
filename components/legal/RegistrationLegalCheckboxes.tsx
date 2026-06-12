'use client';

import Link from 'next/link';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslation } from '@/lib/i18n/useTranslation';

type LegalCheckboxFields = {
  termsAccepted: boolean;
  specificClausesAccepted: boolean;
  privacyAccepted: boolean;
  cancellationAccepted: boolean;
  adultConfirmed: boolean;
};

type RegistrationLegalCheckboxesProps<T extends LegalCheckboxFields> = {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  textClassName?: string;
};

export function RegistrationLegalCheckboxes<T extends LegalCheckboxFields>({
  register,
  errors,
  textClassName = 'text-sm text-white/90',
}: RegistrationLegalCheckboxesProps<T>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2">
        <input type="checkbox" {...register('termsAccepted' as never)} className="mt-1" />
        <span className={textClassName}>
          Accetto i{' '}
          <Link href="/legal/condizioni" className="underline hover:opacity-80" target="_blank">
            Termini e Condizioni di Servizio
          </Link>
        </span>
      </label>

      <label className="flex items-start gap-2">
        <input type="checkbox" {...register('specificClausesAccepted' as never)} className="mt-1" />
        <span className={textClassName}>
          Ai sensi degli artt. 1341 e 1342 c.c., approvo specificamente le clausole indicate nei{' '}
          <Link href="/legal/condizioni" className="underline hover:opacity-80" target="_blank">
            Termini e Condizioni di Servizio
          </Link>
        </span>
      </label>

      <label className="flex items-start gap-2">
        <input type="checkbox" {...register('privacyAccepted' as never)} className="mt-1" />
        <span className={textClassName}>
          {t('registerForm.privacyAcceptedText')}{' '}
          <Link href="/legal/privacy" className="underline hover:opacity-80" target="_blank">
            Privacy Policy
          </Link>
        </span>
      </label>

      <label className="flex items-start gap-2">
        <input type="checkbox" {...register('cancellationAccepted' as never)} className="mt-1" />
        <span className={textClassName}>{t('registerForm.cancellationAcceptedText')}</span>
      </label>

      <label className="flex items-start gap-2">
        <input type="checkbox" {...register('adultConfirmed' as never)} className="mt-1" />
        <span className={textClassName}>{t('registerForm.adultConfirmedText')}</span>
      </label>

      {(errors.termsAccepted ||
        errors.specificClausesAccepted ||
        errors.privacyAccepted ||
        errors.cancellationAccepted ||
        errors.adultConfirmed) && (
        <p className="text-sm text-red-500">
          {String(
            (errors.termsAccepted?.message ||
              errors.specificClausesAccepted?.message ||
              errors.privacyAccepted?.message ||
              errors.cancellationAccepted?.message ||
              errors.adultConfirmed?.message) ?? ''
          )}
        </p>
      )}
    </div>
  );
}
