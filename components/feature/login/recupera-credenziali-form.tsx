'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingLabelField } from '@/components/ui/floating-label-field';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { translateZodMessage } from '@/lib/i18n/translateZodMessage';

const inputClass =
  'h-16 w-full rounded-xl border border-gray-300 bg-white pt-7 pb-2 px-3 text-lg text-[#0F172A] focus-visible:outline-none focus-visible:border-[#FF7300] focus-visible:ring-1 focus-visible:ring-[#FF7300] focus-visible:ring-offset-0 transition-colors';

export function RecuperaCredenzialiForm() {
  const { t } = useTranslation();

  const recuperaSchema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, 'validation.emailRequired').email('validation.emailInvalid'),
      }),
    []
  );

  type RecuperaValues = z.infer<typeof recuperaSchema>;

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<RecuperaValues>({
    resolver: zodResolver(recuperaSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(_data: RecuperaValues) {
    // TODO: chiamata API per invio link recupero
  }

  if (isSubmitSuccessful) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FF7300]/10">
          <Mail className="h-8 w-8 text-[#FF7300]" />
        </div>
        <p className="text-gray-800 font-medium">{t('recoverForm.success')}</p>
        <Link
          href="/login"
          className="inline-block text-[#FF7300] font-medium hover:underline"
        >
          {t('recoverForm.backLogin')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      <div>
        <FloatingLabelField
          label={t('loginForm.email')}
          id="email"
          type="email"
          value={watch('email')}
          autoComplete="email"
          inputClassName={inputClass}
          floatingLabelBg="white"
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{translateZodMessage(errors.email.message, t)}</p>
        )}
      </div>
      <p className="text-sm text-gray-700 font-medium leading-relaxed">{t('recoverForm.hint')}</p>
      <div className="pt-3">
        <Button
          type="submit"
          className="h-14 w-full rounded-xl text-xl font-semibold text-white hover:opacity-95 transition-opacity"
          style={{ backgroundColor: '#FF7300' }}
        >
          {t('recoverForm.submit')}
        </Button>
      </div>
      <p className="text-center text-base">
        <Link href="/login" className="text-[#FF7300] hover:underline">
          {t('recoverForm.backLogin')}
        </Link>
      </p>
    </form>
  );
}
