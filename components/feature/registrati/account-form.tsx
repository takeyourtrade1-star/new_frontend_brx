'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { FloatingLabelField } from '@/components/ui/floating-label-field';
import { cn } from '@/lib/utils';

/** Bandiere da CDN (stile CardTrader) - flagcdn.com */
const FLAG_BASE = 'https://flagcdn.com';

const accountSchema = z
  .object({
    username: z.string().min(1, 'Inserisci lo username'),
    password: z.string().min(8, 'La password deve avere almeno 8 caratteri'),
    confermaPassword: z.string().min(1, 'Conferma la password'),
    lingua: z.enum(['it', 'ja', 'en', 'es', 'de', 'fr']),
  })
  .refine((data) => data.password === data.confermaPassword, {
    message: 'Le password non coincidono',
    path: ['confermaPassword'],
  });

type AccountValues = z.infer<typeof accountSchema>;

const LINGUE = [
  { id: 'it' as const, label: 'ITALIANO', countryCode: 'it' },
  { id: 'ja' as const, label: 'GIAPPONESE', countryCode: 'jp' },
  { id: 'en' as const, label: 'INGLESE', countryCode: 'gb' },
  { id: 'es' as const, label: 'SPAGNOLO', countryCode: 'es' },
  { id: 'de' as const, label: 'TEDESCO', countryCode: 'de' },
  { id: 'fr' as const, label: 'FRANCESE', countryCode: 'fr' },
] as const;

export function AccountForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setFlashMessage = useAuthStore((s) => s.setFlashMessage);
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      username: '',
      password: '',
      confermaPassword: '',
      lingua: 'it',
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfermaPassword, setShowConfermaPassword] = useState(false);

  function onSubmit(data: AccountValues) {
    // TODO: invio dati registrazione all'API
    setUser({
      id: `reg-${Date.now()}`,
      email: `${data.username}@ebartex.local`,
      name: data.username,
      image: null,
    });
    setFlashMessage('Account creato con successo');
    router.push('/');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <div className="relative">
          <FloatingLabelField
            label="Username*"
            id="username"
            type="text"
            value={watch('username')}
            floatingLabelBg="#e5e7eb"
            inputClassName="h-14 pt-7 text-base"
            {...register('username')}
          />
        </div>
        {errors.username && (
          <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
        )}
      </div>

      <div>
        <div className="relative">
          <FloatingLabelField
            label="Password*"
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={watch('password')}
            floatingLabelBg="#e5e7eb"
            inputClassName="h-14 pt-7 text-base pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800"
            title={showPassword ? 'Nascondi password' : 'Mostra password'}
            aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div>
        <div className="relative">
          <FloatingLabelField
            label="Conferma password*"
            id="confermaPassword"
            type={showConfermaPassword ? 'text' : 'password'}
            value={watch('confermaPassword')}
            floatingLabelBg="#e5e7eb"
            inputClassName="h-14 pt-7 text-base pr-10"
            {...register('confermaPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfermaPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800"
            title={showConfermaPassword ? 'Nascondi password' : 'Mostra password'}
            aria-label={showConfermaPassword ? 'Nascondi password' : 'Mostra password'}
          >
            {showConfermaPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.confermaPassword && (
          <p className="mt-1 text-sm text-red-500">
            {errors.confermaPassword.message}
          </p>
        )}
      </div>

      <div>
        <p className="mb-3 text-sm text-white">
          Lingua preferita (potrai cambiarla in seguito)
        </p>
        <Controller
          name="lingua"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {LINGUE.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => field.onChange(lang.id)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl px-4 py-3 text-xs font-semibold uppercase transition-colors shadow-sm',
                    field.value === lang.id
                      ? 'border-4 border-[#FF7300] bg-white text-gray-900'
                      : 'border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <span className="relative mb-1.5 block h-6 w-9 overflow-hidden rounded-sm shadow-sm">
                    <Image
                      src={`${FLAG_BASE}/w80/${lang.countryCode}.png`}
                      alt=""
                      width={36}
                      height={24}
                      className="object-cover"
                    />
                  </span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <p className="text-sm text-gray-200">
        Cliccando <strong className="text-white">CREA ACCOUNT</strong> accetti
        Termini di servizio, Regolamento privacy, Termini di Revoca e Prevenzione
        delle frodi.
      </p>

      <div className="pt-2">
        <Button
          type="submit"
          className="h-14 w-full rounded-xl text-xl font-semibold uppercase tracking-wide text-white hover:opacity-90"
          style={{ backgroundColor: '#FF7300' }}
        >
          Crea account
        </Button>
      </div>
    </form>
  );
}
