'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FloatingLabelField } from '@/components/ui/floating-label-field';

/** Formatta solo cifre in gg/mm/aaaa (max 8 cifre). */
function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

const dateRegex = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

const registratiStep1Schema = z.object({
  nome: z.string().min(1, 'Inserisci il nome'),
  cognome: z.string().min(1, 'Inserisci il cognome'),
  dataNascita: z
    .string()
    .min(1, 'Inserisci la data di nascita')
    .regex(dateRegex, 'Inserisci una data valida (gg/mm/aaaa)'),
});

type RegistratiStep1Values = z.infer<typeof registratiStep1Schema>;

export function RegistratiForm() {
  const router = useRouter();
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistratiStep1Values>({
    resolver: zodResolver(registratiStep1Schema),
    defaultValues: { nome: '', cognome: '', dataNascita: '' },
  });

  function onSubmit(_data: RegistratiStep1Values) {
    // TODO: salva dati step 1 e passa a indirizzo
    router.push('/registrati/indirizzo');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      <div>
        <FloatingLabelField
          label="Nome"
          id="nome"
          value={watch('nome')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-16 pt-7 text-lg"
          {...register('nome')}
        />
        {errors.nome && (
          <p className="mt-1 text-sm text-red-500">{errors.nome.message}</p>
        )}
      </div>
      <div>
        <FloatingLabelField
          label="Cognome"
          id="cognome"
          value={watch('cognome')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-16 pt-7 text-lg"
          {...register('cognome')}
        />
        {errors.cognome && (
          <p className="mt-1 text-sm text-red-500">{errors.cognome.message}</p>
        )}
      </div>
      <div>
        <Controller
          name="dataNascita"
          control={control}
          render={({ field }) => (
            <FloatingLabelField
              label="gg/mm/aaaa"
              id="dataNascita"
              name={field.name}
              type="text"
              value={field.value}
              autoComplete="bday"
              maxLength={10}
              inputMode="numeric"
              floatingLabelBg="#e5e7eb"
              inputClassName="h-16 pt-7 text-lg"
              onChange={(e) =>
                field.onChange(formatDateInput(e.target.value))
              }
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        {errors.dataNascita && (
          <p className="mt-1 text-sm text-red-500">
            {errors.dataNascita.message}
          </p>
        )}
      </div>
      <div className="pt-3">
        <Button
          type="submit"
          className="h-14 w-full rounded-xl text-xl font-semibold uppercase tracking-wide text-white hover:opacity-90"
          style={{ backgroundColor: '#FF7300' }}
        >
          Avanti
        </Button>
      </div>
    </form>
  );
}
