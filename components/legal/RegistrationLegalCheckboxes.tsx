'use client';

import Link from 'next/link';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { AUTH_LINK_CLASS } from '@/components/auth/ui/auth-styles';

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

function LegalTextWithLink({
  textKey,
  linkKey,
  href,
  textClassName,
}: {
  textKey: MessageKey;
  linkKey: MessageKey;
  href: string;
  textClassName: string;
}) {
  const { t } = useTranslation();
  const text = t(textKey);
  const linkText = t(linkKey);
  const parts = text.split('{link}');

  return (
    <span className={textClassName}>
      {parts[0]}
      <Link href={href} className={AUTH_LINK_CLASS} target="_blank">
        {linkText}
      </Link>
      {parts[1] ?? ''}
    </span>
  );
}

export function RegistrationLegalCheckboxes<T extends LegalCheckboxFields>({
  register,
  errors,
  textClassName = 'text-[13px] leading-snug text-[#515154]',
}: RegistrationLegalCheckboxesProps<T>) {
  const { t } = useTranslation();

  const errorMessage = String(
    (errors.termsAccepted?.message ||
      errors.specificClausesAccepted?.message ||
      errors.privacyAccepted?.message ||
      errors.cancellationAccepted?.message ||
      errors.adultConfirmed?.message) ??
      ''
  );

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Checkbox {...register('termsAccepted' as never)} className="mt-0.5" />
        <LegalTextWithLink
          textKey="registerForm.termsAccepted"
          linkKey="registerForm.termsLink"
          href="/legal/condizioni"
          textClassName={textClassName}
        />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox {...register('specificClausesAccepted' as never)} className="mt-0.5" />
        <LegalTextWithLink
          textKey="registerForm.specificClausesAccepted"
          linkKey="registerForm.termsLink"
          href="/legal/condizioni"
          textClassName={textClassName}
        />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox {...register('privacyAccepted' as never)} className="mt-0.5" />
        <LegalTextWithLink
          textKey="registerForm.privacyAccepted"
          linkKey="registerForm.privacyLink"
          href="/legal/privacy"
          textClassName={textClassName}
        />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox {...register('cancellationAccepted' as never)} className="mt-0.5" />
        <span className={textClassName}>{t('registerForm.cancellationAcceptedText')}</span>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox {...register('adultConfirmed' as never)} className="mt-0.5" />
        <span className={textClassName}>{t('registerForm.adultConfirmedText')}</span>
      </div>

      {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
    </div>
  );
}
