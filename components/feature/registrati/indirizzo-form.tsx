'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FloatingLabelField } from '@/components/ui/floating-label-field';

const indirizzoSchema = z.object({
  via: z.string().min(1, 'Inserisci via e numero civico'),
  citta: z.string().min(1, 'Inserisci la città'),
  cap: z.string().min(1, 'Inserisci il codice postale'),
  paese: z.string().min(1, 'Inserisci il paese'),
});

type IndirizzoValues = z.infer<typeof indirizzoSchema>;

export function IndirizzoForm() {
  const router = useRouter();
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<IndirizzoValues>({
    resolver: zodResolver(indirizzoSchema),
    defaultValues: { via: '', citta: '', cap: '', paese: '' },
  });

  function onSubmit(_data: IndirizzoValues) {
    // TODO: salva indirizzo e step successivo
    router.push('/registrati/account');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      <div>
        <FloatingLabelField
          label="Via e numero civico*"
          id="via"
          value={watch('via')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-16 pt-7 text-lg"
          {...register('via')}
        />
        {errors.via && (
          <p className="mt-1 text-sm text-red-500">{errors.via.message}</p>
        )}
      </div>
      <div>
        <FloatingLabelField
          label="Città*"
          id="citta"
          value={watch('citta')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-16 pt-7 text-lg"
          {...register('citta')}
        />
        {errors.citta && (
          <p className="mt-1 text-sm text-red-500">{errors.citta.message}</p>
        )}
      </div>
      <div>
        <FloatingLabelField
          label="Codice postale*"
          id="cap"
          value={watch('cap')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-16 pt-7 text-lg"
          {...register('cap')}
        />
        {errors.cap && (
          <p className="mt-1 text-sm text-red-500">{errors.cap.message}</p>
        )}
      </div>
      <div>
        <FloatingLabelField
          label="Paese*"
          id="paese"
          value={watch('paese')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-16 pt-7 text-lg"
          {...register('paese')}
        />
        {errors.paese && (
          <p className="mt-1 text-sm text-red-500">{errors.paese.message}</p>
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
