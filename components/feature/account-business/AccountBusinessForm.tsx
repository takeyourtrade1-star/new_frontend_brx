'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const businessSchema = z.object({
  ragioneSociale: z.string().min(1, 'Inserisci la ragione sociale'),
  partitaIva: z
    .string()
    .min(1, 'Inserisci la Partita IVA')
    .regex(/^\d{11}$/, 'La Partita IVA deve essere di 11 cifre'),
  email: z.string().min(1, 'Inserisci l\'email').email('Email non valida'),
  telefono: z.string().min(1, 'Inserisci il numero di telefono'),
  indirizzo: z.string().optional(),
});

type BusinessValues = z.infer<typeof businessSchema>;

export function AccountBusinessForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<BusinessValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      ragioneSociale: '',
      partitaIva: '',
      email: '',
      telefono: '',
      indirizzo: '',
    },
  });

  function onSubmit(_data: BusinessValues) {
    // TODO: invio richiesta account business all'API
  }

  if (isSubmitSuccessful) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-700">
          Richiesta inviata. Ti contatteremo al più presto per completare
          l&apos;attivazione del tuo account business.
        </p>
        <Link
          href="/"
          className="inline-block text-sm font-medium text-[#FF8C4B] hover:underline"
        >
          Torna alla home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Ragione sociale / Nome azienda *
        </label>
        <Input
          {...register('ragioneSociale')}
          placeholder="Es. Mario Rossi S.r.l."
          className="h-11 rounded-lg border-gray-300"
        />
        {errors.ragioneSociale && (
          <p className="mt-1 text-sm text-red-500">
            {errors.ragioneSociale.message}
          </p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Partita IVA (11 cifre) *
        </label>
        <Input
          {...register('partitaIva')}
          placeholder="12345678901"
          maxLength={11}
          inputMode="numeric"
          className="h-11 rounded-lg border-gray-300"
        />
        {errors.partitaIva && (
          <p className="mt-1 text-sm text-red-500">
            {errors.partitaIva.message}
          </p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Email aziendale *
        </label>
        <Input
          {...register('email')}
          type="email"
          placeholder="contatti@azienda.it"
          className="h-11 rounded-lg border-gray-300"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Telefono *
        </label>
        <Input
          {...register('telefono')}
          type="tel"
          placeholder="+39 333 1234567"
          className="h-11 rounded-lg border-gray-300"
        />
        {errors.telefono && (
          <p className="mt-1 text-sm text-red-500">
            {errors.telefono.message}
          </p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Indirizzo sede (facoltativo)
        </label>
        <Input
          {...register('indirizzo')}
          placeholder="Via, numero, CAP, città"
          className="h-11 rounded-lg border-gray-300"
        />
      </div>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        <Button
          type="submit"
          className="h-12 rounded-lg px-6 font-semibold text-white"
          style={{ backgroundColor: '#FF7300' }}
        >
          Invia richiesta account business
        </Button>
        <Link
          href="/"
          className="text-center text-sm font-medium text-[#FF8C4B] hover:underline"
        >
          Torna alla home
        </Link>
      </div>
    </form>
  );
}
