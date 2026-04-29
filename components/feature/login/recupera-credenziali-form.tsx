'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { z } from 'zod';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { translateZodMessage } from '@/lib/i18n/translateZodMessage';

const appleInputClass =
  'h-[52px] w-full rounded-2xl border border-black/10 bg-black/5 px-4 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all';

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
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1d1d1f]/5">
          <CheckCircle className="h-8 w-8 text-[#1d1d1f]" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <p className="text-[17px] font-semibold text-[#1d1d1f]">{t('recoverForm.success')}</p>
          <p className="text-[14px] text-[#86868b]">Controlla la tua casella email.</p>
        </div>
        <Link
          href="/login?accesso=1"
          className="mt-2 rounded-full bg-[#1d1d1f] px-8 py-3 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {t('recoverForm.backLogin')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input
          type="email"
          autoComplete="email"
          placeholder={t('loginForm.email')}
          className={appleInputClass}
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1.5 pl-1 text-[12px] text-red-500">{translateZodMessage(errors.email.message, t)}</p>
        )}
      </div>

      <p className="text-[13px] leading-relaxed text-[#86868b]">{t('recoverForm.hint')}</p>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {t('recoverForm.submit')}
        </button>
      </div>
    </form>
  );
}
