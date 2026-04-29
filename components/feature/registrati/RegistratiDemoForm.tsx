'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingLabelField } from '@/components/ui/floating-label-field';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  registerDemoSchema,
  toRegisterPayloadDemo,
  PHONE_PREFIXES,
  COUNTRIES,
} from '@/lib/registrati/schema';
import type { RegisterDemoValues } from '@/lib/registrati/schema';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { FlagIcon, CountrySelect, type CountryOption } from '@/lib/auction/country-flag';
import { useUserCountry } from '@/lib/hooks/use-user-country';

const defaultValues: RegisterDemoValues = {
  website_url: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  phone_prefix: '+39',
  country: 'IT',
  termsAccepted: false,
  privacyAccepted: false,
  cancellationAccepted: false,
  adultConfirmed: false,
};

export function RegistratiDemoForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const detectedCountry = useUserCountry();
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
    setValue,
    formState: { errors },
  } = useForm<RegisterDemoValues>({
    resolver: zodResolver(registerDemoSchema),
    defaultValues: {
      ...defaultValues,
      country: detectedCountry || defaultValues.country,
    },
  });

  // Aggiorna il paese quando viene rilevato
  useEffect(() => {
    if (detectedCountry) {
      setValue('country', detectedCountry, { shouldValidate: true });
      // Aggiorna anche il prefisso telefonico corrispondente
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

  // Country options with flags for dropdowns
  const prefixOptions: CountryOption[] = useMemo(
    () =>
      PHONE_PREFIXES.map((p) => {
        const iso = phonePrefixToCountryCode(p);
        return {
          code: p,
          label: p,
          flagCode: iso || 'IT',
        };
      }),
    []
  );

  const countryOptions: CountryOption[] = useMemo(
    () =>
      COUNTRIES.map((c) => ({
        code: c.code,
        label: c.label,
        flagCode: c.code,
      })),
    []
  );

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

  // Applica errori per campo dalla risposta API (422)
  useEffect(() => {
    if (!registrationFieldErrors) return;
    Object.entries(registrationFieldErrors).forEach(([field, message]) => {
      setError(
        field as Extract<keyof RegisterDemoValues, string>,
        { type: 'server', message }
      );
    });
  }, [registrationFieldErrors, setError]);

  useEffect(() => {
    if (isAuthenticated && flashMessage) {
      router.push('/');
    }
  }, [isAuthenticated, flashMessage, router]);

  const onSubmit = async (values: RegisterDemoValues) => {
    clearError();
    try {
      const payload = toRegisterPayloadDemo({ ...values, website_url: '' });
      await registerUser(payload);
      router.push('/');
    } catch {
      // Errori già impostati nello store e via setError dall'effetto
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Honeypot: nascosto, valore vuoto (anti-bot) */}
      <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="website_url_reg_demo">Lascia vuoto</label>
        <input
          id="website_url_reg_demo"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('website_url')}
        />
      </div>

      <div>
        <FloatingLabelField
          label={t('registerForm.usernameLabel')}
          id="username"
          type="text"
          value={watch('username')}
          floatingLabelBg="rgba(255,255,255,0.75)"
          inputClassName="h-14 pt-7 text-base bg-black/5 border border-black/10 focus-visible:bg-white focus-visible:border-[#0066cc] focus-visible:ring-4 focus-visible:ring-[#0066cc]/20 transition-all"
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
          floatingLabelBg="rgba(255,255,255,0.75)"
          inputClassName="h-14 pt-7 text-base bg-black/5 border border-black/10 focus-visible:bg-white focus-visible:border-[#0066cc] focus-visible:ring-4 focus-visible:ring-[#0066cc]/20 transition-all"
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
          floatingLabelBg="rgba(255,255,255,0.75)"
          inputClassName="h-14 pt-7 text-base pr-10 bg-black/5 border border-black/10 focus-visible:bg-white focus-visible:border-[#0066cc] focus-visible:ring-4 focus-visible:ring-[#0066cc]/20 transition-all"
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
        <div className="w-28 shrink-0">
          <Controller
            name="phone_prefix"
            control={control}
            render={({ field }) => (
              <CountrySelect
                options={prefixOptions}
                value={field.value}
                onChange={field.onChange}
                size="md"
              />
            )}
          />
        </div>
        <div className="flex-1">
          <FloatingLabelField
            label={t('registerForm.phoneLabel')}
            id="phone"
            type="tel"
            value={watch('phone')}
            floatingLabelBg="rgba(255,255,255,0.75)"
            inputClassName="h-14 pt-7 text-base bg-black/5 border border-black/10 focus-visible:bg-white focus-visible:border-[#0066cc] focus-visible:ring-4 focus-visible:ring-[#0066cc]/20 transition-all"
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
        <label className="grid grid-cols-[20px_1fr] items-start gap-x-3">
          <input type="checkbox" {...register('termsAccepted')} className="mt-1.5" />
          <span className="pt-0.5 text-sm text-gray-700">{t('registerForm.termsAcceptedText')}</span>
        </label>
        <label className="grid grid-cols-[20px_1fr] items-start gap-x-3">
          <input type="checkbox" {...register('privacyAccepted')} className="mt-1.5" />
          <span className="pt-0.5 text-sm text-gray-700">{t('registerForm.privacyAcceptedText')}</span>
        </label>
        <label className="grid grid-cols-[20px_1fr] items-start gap-x-3">
          <input type="checkbox" {...register('cancellationAccepted')} className="mt-1.5" />
          <span className="pt-0.5 text-sm text-gray-700">{t('registerForm.cancellationAcceptedText')}</span>
        </label>
        <label className="grid grid-cols-[20px_1fr] items-start gap-x-3">
          <input type="checkbox" {...register('adultConfirmed')} className="mt-1.5" />
          <span className="pt-0.5 text-sm text-gray-700">{t('registerForm.adultConfirmedText')}</span>
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

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="pt-4 flex justify-center">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-[52px] rounded-full bg-[#1d1d1f] hover:bg-black text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? t('registerForm.registrationLoading') : t('auth.register')}
        </Button>
      </div>
    </form>
  );
}
