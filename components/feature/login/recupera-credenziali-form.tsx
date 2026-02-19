'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FloatingLabelField } from '@/components/ui/floating-label-field';

const recuperaSchema = z.object({
  email: z.string().min(1, 'Inserisci l\'email').email('Inserisci un\'email valida'),
});

type RecuperaValues = z.infer<typeof recuperaSchema>;

const inputClass =
  'h-16 w-full rounded-xl border border-gray-300 bg-white pt-7 pb-2 px-3 text-lg text-[#0F172A] focus-visible:outline-none focus-visible:border-[#FF7300] focus-visible:ring-1 focus-visible:ring-[#FF7300] focus-visible:ring-offset-0 transition-colors';

export function RecuperaCredenzialiForm() {
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
        <p className="text-gray-700">
          Se l&apos;email è associata a un account, riceverai a breve un link
          per reimpostare la password.
        </p>
        <Link
          href="/login"
          className="inline-block text-[#FF7300] font-medium hover:underline"
        >
          Torna al login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      <div>
        <FloatingLabelField
          label="Email"
          id="email"
          type="email"
          value={watch('email')}
          autoComplete="email"
          inputClassName={inputClass}
          floatingLabelBg="white"
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      <p className="text-sm text-gray-600">
        Inserisci l&apos;email con cui ti sei registrato. Ti invieremo un link
        per reimpostare la password.
      </p>
      <div className="pt-3">
        <Button
          type="submit"
          className="h-14 w-full rounded-xl text-xl font-semibold text-white hover:opacity-95 transition-opacity"
          style={{ backgroundColor: '#FF7300' }}
        >
          Invia link di recupero
        </Button>
      </div>
      <p className="text-center text-base">
        <Link
          href="/login"
          className="text-[#FF7300] hover:underline"
        >
          Torna al login
        </Link>
      </p>
    </form>
  );
}
