'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingLabelField } from '@/components/ui/floating-label-field';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  registerPrivatoSchema,
  toRegisterPayloadPrivato,
  PHONE_PREFIXES,
  COUNTRIES,
} from '@/lib/registrati/schema';
import type { RegisterPrivatoValues } from '@/lib/registrati/schema';
import { cn } from '@/lib/utils';

const defaultValues: RegisterPrivatoValues = {
  website_url: '',
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone: '',
  phone_prefix: '+39',
  country: 'IT',
  termsAccepted: false,
  privacyAccepted: false,
  cancellationAccepted: false,
  adultConfirmed: false,
};

export function RegistratiPrivatoForm() {
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
  } = useForm<RegisterPrivatoValues>({
    resolver: zodResolver(registerPrivatoSchema),
    defaultValues,
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!registrationFieldErrors) return;
    Object.entries(registrationFieldErrors).forEach(([field, message]) => {
      setError(field as keyof RegisterPrivatoValues, { type: 'server', message });
    });
  }, [registrationFieldErrors, setError]);

  useEffect(() => {
    if (isAuthenticated && flashMessage) {
      router.push('/');
    }
  }, [isAuthenticated, flashMessage, router]);

  const onSubmit = async (values: RegisterPrivatoValues) => {
    clearError();
    try {
      const payload = toRegisterPayloadPrivato({ ...values, website_url: '' });
      await registerUser(payload);
      router.push('/');
    } catch {
      // errori già in store
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="website_url_reg_privato">Lascia vuoto</label>
        <input
          id="website_url_reg_privato"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('website_url')}
        />
      </div>

      <div>
        <FloatingLabelField
          label="Nome *"
          id="first_name"
          type="text"
          value={watch('first_name')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-14 pt-7 text-base"
          autoComplete="given-name"
          {...register('first_name')}
        />
        {errors.first_name && (
          <p className="mt-1 text-sm text-red-500">{errors.first_name.message}</p>
        )}
      </div>

      <div>
        <FloatingLabelField
          label="Cognome *"
          id="last_name"
          type="text"
          value={watch('last_name')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-14 pt-7 text-base"
          autoComplete="family-name"
          {...register('last_name')}
        />
        {errors.last_name && (
          <p className="mt-1 text-sm text-red-500">{errors.last_name.message}</p>
        )}
      </div>

      <div>
        <FloatingLabelField
          label="Username *"
          id="username"
          type="text"
          value={watch('username')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-14 pt-7 text-base"
          autoComplete="username"
          {...register('username')}
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
        )}
      </div>

      <div>
        <FloatingLabelField
          label="Email *"
          id="email"
          type="email"
          value={watch('email')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-14 pt-7 text-base"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="relative">
        <FloatingLabelField
          label="Password *"
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={watch('password')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-14 pt-7 text-base pr-10"
          autoComplete="new-password"
          {...register('password')}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-9 rounded p-1 text-gray-600 hover:bg-gray-200"
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
          <Controller
            name="phone_prefix"
            control={control}
            render={({ field }) => (
              <select
                id="phone_prefix_privato"
                className="h-14 w-full rounded-lg border border-gray-300 bg-[#e5e7eb] px-2 text-base"
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
          <FloatingLabelField
            label="Telefono *"
            id="phone"
            type="tel"
            value={watch('phone')}
            floatingLabelBg="#e5e7eb"
            inputClassName="h-14 pt-7 text-base"
            autoComplete="tel-national"
            {...register('phone')}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div>
        <Controller
          name="country"
          control={control}
          render={({ field }) => (
            <select
              id="country_privato"
              className={cn(
                'h-14 w-full rounded-lg border border-gray-300 bg-[#e5e7eb] px-3 text-base',
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
        <label htmlFor="country_privato" className="mt-1 block text-xs text-white/70">
          Paese *
        </label>
        {errors.country && (
          <p className="mt-1 text-sm text-red-500">{errors.country.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-2">
          <input type="checkbox" {...register('termsAccepted')} className="mt-1" />
          <span className="text-sm text-white/90">Accetto i termini e condizioni</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" {...register('privacyAccepted')} className="mt-1" />
          <span className="text-sm text-white/90">Accetto la privacy policy</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" {...register('cancellationAccepted')} className="mt-1" />
          <span className="text-sm text-white/90">Accetto la policy di cancellazione</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" {...register('adultConfirmed')} className="mt-1" />
          <span className="text-sm text-white/90">Dichiaro di essere maggiorenne</span>
        </label>
        {(errors.termsAccepted || errors.privacyAccepted || errors.cancellationAccepted || errors.adultConfirmed) && (
          <p className="text-sm text-red-500">
            {errors.termsAccepted?.message || errors.privacyAccepted?.message || errors.cancellationAccepted?.message || errors.adultConfirmed?.message}
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="pt-3">
        <Button
          type="submit"
          disabled={isLoading}
          className="h-14 w-full rounded-xl text-xl font-semibold uppercase tracking-wide text-white hover:opacity-90"
          style={{ backgroundColor: '#FF7300' }}
        >
          {isLoading ? 'Registrazione...' : 'Crea account privato'}
        </Button>
      </div>
    </form>
  );
}
