'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingLabelField } from '@/components/ui/floating-label-field';
import { AuthErrorAlert } from '@/components/ui/AuthErrorAlert';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAuthError } from '@/lib/errors/useAuthError';
import { AUTH_ERROR_CODES, getAuthFieldErrors } from '@/lib/errors/auth-error-codes';
import {
  registerPrivatoSchema,
  toRegisterPayloadPrivato,
  PHONE_PREFIXES,
  COUNTRIES,
} from '@/lib/registrati/schema';
import type { RegisterPrivatoValues } from '@/lib/registrati/schema';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { CountrySelect, type CountryOption } from '@/components/ui/CountrySelect';
import { useUserCountry } from '@/lib/hooks/use-user-country';
import { useMemo } from 'react';

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
  const { t } = useTranslation();
  const detectedCountry = useUserCountry();
  const authError = useAuthError();
  const registerUser = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearStoreError = useAuthStore((s) => s.clearError);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const flashMessage = useAuthStore((s) => s.flashMessage);

  const {
    register,
    control,
    watch,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<RegisterPrivatoValues>({
    resolver: zodResolver(registerPrivatoSchema),
    defaultValues: {
      ...defaultValues,
      country: detectedCountry || defaultValues.country,
    },
  });

  // Country options with flags
  const countryOptions: CountryOption[] = useMemo(
    () => COUNTRIES.map((c) => ({ code: c.code, label: c.label, flagCode: c.code })),
    []
  );

  // Aggiorna paese e prefisso quando rilevato
  useEffect(() => {
    if (detectedCountry) {
      setValue('country', detectedCountry, { shouldValidate: true });
      const prefixMap: Record<string, string> = {
        'IT': '+39', 'DE': '+49', 'FR': '+33', 'ES': '+34',
        'AT': '+43', 'CH': '+41', 'GB': '+44', 'US': '+1'
      };
      const newPrefix = prefixMap[detectedCountry];
      if (newPrefix && PHONE_PREFIXES.includes(newPrefix as typeof PHONE_PREFIXES[number])) {
        setValue('phone_prefix', newPrefix as typeof PHONE_PREFIXES[number], { shouldValidate: true });
      }
    }
  }, [detectedCountry, setValue]);

  const [showPassword, setShowPassword] = useState(false);

  function phonePrefixToCountryCode(prefix: string): string {
    switch (prefix) {
      case '+39':
        return 'IT';
      case '+1':
        return 'US';
      case '+33':
        return 'FR';
      case '+34':
        return 'ES';
      case '+49':
        return 'DE';
      case '+41':
        return 'CH';
      case '+43':
        return 'AT';
      case '+44':
        return 'GB';
      default:
        return '';
    }
  }

  const phonePrefix = watch('phone_prefix');
  const country = watch('country');

  const countryManuallyEditedRef = useRef(false);

  // Quando cambia il prefisso telefono, riattiviamo la comodità di auto-mapping.
  useEffect(() => {
    countryManuallyEditedRef.current = false;
  }, [phonePrefix]);

  // Auto-compila Paese quando cambia il prefisso telefono (finché l'utente non lo modifica manualmente).
  useEffect(() => {
    const mapped = phonePrefixToCountryCode(phonePrefix);
    if (!mapped) return;
    if (countryManuallyEditedRef.current) return;
    if (mapped === country) return;
    setValue('country', mapped, { shouldValidate: true });
  }, [phonePrefix, country, setValue]);

  useEffect(() => {
    if (!isAuthenticated) return;
    clearStoreError();
    authError.clearError();
  }, [isAuthenticated, clearStoreError, authError]);

  useEffect(() => {
    if (isAuthenticated && flashMessage) {
      router.push('/');
    }
  }, [isAuthenticated, flashMessage, router]);

  const onSubmit = async (values: RegisterPrivatoValues) => {
    authError.clearError();
    clearStoreError();
    try {
      const payload = toRegisterPayloadPrivato({ ...values, website_url: '' });
      await registerUser(payload);
      router.push('/');
    } catch (err: any) {
      // Usa il nuovo sistema di gestione errori con i18n
      authError.setError(err);
      
      // Mappa errori ai campi del form
      const fieldErrors = getAuthFieldErrors(err);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, code]) => {
          setError(
            field as Extract<keyof RegisterPrivatoValues, string>,
            { type: 'server', message: t(code) }
          );
        });
      }
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
          label={t('registerForm.firstNameLabel')}
          id="first_name"
          type="text"
          value={watch('first_name')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-14 pt-7 text-base"
          autoComplete="given-name"
          {...register('first_name')}
        />
        {errors.first_name && (
          <p className="mt-1 text-sm text-red-500">{String(errors.first_name.message ?? '')}</p>
        )}
      </div>

      <div>
        <FloatingLabelField
          label={t('registerForm.lastNameLabel')}
          id="last_name"
          type="text"
          value={watch('last_name')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-14 pt-7 text-base"
          autoComplete="family-name"
          {...register('last_name')}
        />
        {errors.last_name && (
          <p className="mt-1 text-sm text-red-500">{String(errors.last_name.message ?? '')}</p>
        )}
      </div>

      <div>
        <FloatingLabelField
          label={t('registerForm.usernameLabel')}
          id="username"
          type="text"
          value={watch('username')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-14 pt-7 text-base"
          autoComplete="username"
          {...register('username')}
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-500">{String(errors.username.message ?? '')}</p>
        )}
      </div>

      <div>
        <FloatingLabelField
          label={t('registerForm.emailLabel')}
          id="email"
          type="email"
          value={watch('email')}
          floatingLabelBg="#e5e7eb"
          inputClassName="h-14 pt-7 text-base"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{String(errors.email.message ?? '')}</p>
        )}
      </div>

      <div className="relative">
        <FloatingLabelField
          label={t('registerForm.passwordLabel')}
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
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100/70 transition-colors"
          aria-label={showPassword ? t('registerForm.hidePassword') : t('registerForm.showPassword')}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{String(errors.password.message ?? '')}</p>
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
            label={t('registerForm.phoneLabel')}
            id="phone"
            type="tel"
            value={watch('phone')}
            floatingLabelBg="#e5e7eb"
            inputClassName="h-14 pt-7 text-base"
            autoComplete="tel-national"
            {...register('phone')}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{String(errors.phone.message ?? '')}</p>
          )}
        </div>
      </div>

      <div>
        <Controller
          name="country"
          control={control}
          render={({ field }) => (
            <CountrySelect
              options={countryOptions}
              value={field.value}
              onChange={(val) => {
                countryManuallyEditedRef.current = true;
                field.onChange(val);
              }}
              placeholder={t('registerForm.countryLabel')}
              size="md"
            />
          )}
        />
        {errors.country && (
          <p className="mt-1 text-sm text-red-500">{String(errors.country.message ?? '')}</p>
        )}
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-2">
          <input type="checkbox" {...register('termsAccepted')} className="mt-1" />
          <span className="text-sm text-white/90">{t('registerForm.termsAcceptedText')}</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" {...register('privacyAccepted')} className="mt-1" />
          <span className="text-sm text-white/90">{t('registerForm.privacyAcceptedText')}</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" {...register('cancellationAccepted')} className="mt-1" />
          <span className="text-sm text-white/90">{t('registerForm.cancellationAcceptedText')}</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" {...register('adultConfirmed')} className="mt-1" />
          <span className="text-sm text-white/90">{t('registerForm.adultConfirmedText')}</span>
        </label>
        {(errors.termsAccepted || errors.privacyAccepted || errors.cancellationAccepted || errors.adultConfirmed) && (
          <p className="text-sm text-red-500">
            {String(
              (errors.termsAccepted?.message ||
                errors.privacyAccepted?.message ||
                errors.cancellationAccepted?.message ||
                errors.adultConfirmed?.message) ?? ''
            )}
          </p>
        )}
      </div>

      {/* Error Alert - Elegant UI with i18n support */}
      <AuthErrorAlert 
        error={authError} 
        className="mt-4"
      />

      <div className="pt-3">
        <Button
          type="submit"
          disabled={isLoading || authError.isRateLimitError}
          className="h-14 w-full rounded-xl text-xl font-semibold uppercase tracking-wide text-white hover:opacity-90"
          style={{ backgroundColor: '#FF7300' }}
        >
          {isLoading ? t('registerForm.registrationLoading') : t('registerForm.createPrivateAccount')}
        </Button>
      </div>
    </form>
  );
}
