'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  registerBusinessSchema,
  toRegisterPayloadBusiness,
  PHONE_PREFIXES,
  COUNTRIES,
} from '@/lib/registrati/schema';
import type { RegisterBusinessValues } from '@/lib/registrati/schema';
import { cn } from '@/lib/utils';

const defaultValues: RegisterBusinessValues = {
  website_url: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  phone_prefix: '+39',
  country: 'IT',
  ragione_sociale: '',
  piva: '',
  vat_prefix: 'IT',
  termsAccepted: false,
  privacyAccepted: false,
  cancellationAccepted: false,
  adultConfirmed: false,
};

export function AccountBusinessForm() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const registrationFieldErrors = useAuthStore((s) => s.registrationFieldErrors);
  const clearError = useAuthStore((s) => s.clearError);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const flashMessage = useAuthStore((s) => s.flashMessage);

  const {
    register,
    control,
    watch,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterBusinessValues>({
    resolver: zodResolver(registerBusinessSchema),
    defaultValues,
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!registrationFieldErrors) return;
    Object.entries(registrationFieldErrors).forEach(([field, message]) => {
      setError(field as keyof RegisterBusinessValues, { type: 'server', message });
    });
  }, [registrationFieldErrors, setError]);

  const onSubmit = async (values: RegisterBusinessValues) => {
    clearError();
    try {
      const payload = toRegisterPayloadBusiness({
        ...values,
        website_url: '',
        vat_prefix: values.vat_prefix || null,
      });
      await registerUser(payload);
      router.push('/');
    } catch {
      // errori in store
    }
  };

  if (isAuthenticated && flashMessage) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-700">
          Account business creato. Verifica la tua email per attivare l&apos;account.
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
      <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="website_url_business">Lascia vuoto</label>
        <input
          id="website_url_business"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('website_url')}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Ragione sociale / Nome azienda *
        </label>
        <Input
          {...register('ragione_sociale')}
          placeholder="Es. Mario Rossi S.r.l."
          className="h-11 rounded-lg border-gray-300"
        />
        {errors.ragione_sociale && (
          <p className="mt-1 text-sm text-red-500">{errors.ragione_sociale.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Prefisso IVA (es. IT)
          </label>
          <Controller
            name="vat_prefix"
            control={control}
            render={({ field }) => (
              <select
                id="vat_prefix"
                className="h-11 w-full rounded-lg border border-gray-300 px-3"
                {...field}
                value={field.value ?? 'IT'}
              >
                <option value="IT">IT</option>
                <option value="DE">DE</option>
                <option value="FR">FR</option>
                <option value="ES">ES</option>
                <option value="AT">AT</option>
                <option value="">—</option>
              </select>
            )}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Partita IVA *
          </label>
          <Input
            {...register('piva')}
            placeholder="12345678901"
            maxLength={20}
            inputMode="numeric"
            className="h-11 rounded-lg border-gray-300"
          />
          {errors.piva && (
            <p className="mt-1 text-sm text-red-500">{errors.piva.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Username *</label>
        <Input
          {...register('username')}
          placeholder="nomeazienda"
          className="h-11 rounded-lg border-gray-300"
          autoComplete="username"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Email aziendale *</label>
        <Input
          {...register('email')}
          type="email"
          placeholder="contatti@azienda.it"
          className="h-11 rounded-lg border-gray-300"
          autoComplete="email"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="relative">
        <label className="mb-1 block text-sm font-medium text-gray-700">Password *</label>
        <Input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          placeholder="Min 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero"
          className="h-11 rounded-lg border-gray-300 pr-10"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-2 top-9 rounded p-1 text-gray-500 hover:bg-gray-100"
          aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        <div className="w-24 shrink-0">
          <label className="mb-1 block text-sm font-medium text-gray-700">Prefisso</label>
          <Controller
            name="phone_prefix"
            control={control}
            render={({ field }) => (
              <select
                id="phone_prefix_business"
                className="h-11 w-full rounded-lg border border-gray-300 px-2"
                {...field}
              >
                {PHONE_PREFIXES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            )}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">Telefono *</label>
          <Input
            {...register('phone')}
            type="tel"
            placeholder="0212345678"
            className="h-11 rounded-lg border-gray-300"
            autoComplete="tel-national"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Paese *</label>
        <Controller
          name="country"
          control={control}
          render={({ field }) => (
            <select
              id="country_business"
              className={cn(
                'h-11 w-full rounded-lg border border-gray-300 px-3',
                !field.value && 'text-gray-500'
              )}
              {...field}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          )}
        />
        {errors.country && (
          <p className="mt-1 text-sm text-red-500">{errors.country.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-2">
          <input type="checkbox" {...register('termsAccepted')} className="mt-1" />
          <span className="text-sm text-gray-700">Accetto i termini e condizioni</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" {...register('privacyAccepted')} className="mt-1" />
          <span className="text-sm text-gray-700">Accetto la privacy policy</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" {...register('cancellationAccepted')} className="mt-1" />
          <span className="text-sm text-gray-700">Accetto la policy di cancellazione</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" {...register('adultConfirmed')} className="mt-1" />
          <span className="text-sm text-gray-700">Dichiaro di essere maggiorenne</span>
        </label>
        {(errors.termsAccepted || errors.privacyAccepted || errors.cancellationAccepted || errors.adultConfirmed) && (
          <p className="text-sm text-red-500">
            {errors.termsAccepted?.message || errors.privacyAccepted?.message || errors.cancellationAccepted?.message || errors.adultConfirmed?.message}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        <Button
          type="submit"
          disabled={isLoading}
          className="h-12 rounded-lg px-6 font-semibold text-white"
          style={{ backgroundColor: '#FF7300' }}
        >
          {isLoading ? 'Registrazione...' : 'Crea account business'}
        </Button>
        <Link
          href="/registrati"
          className="text-center text-sm font-medium text-[#FF8C4B] hover:underline"
        >
          Account personale
        </Link>
      </div>
    </form>
  );
}
