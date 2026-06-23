'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { AuthSubmitButton, AuthRequiredLegend, AUTH_SPLIT_LABEL_CLASS, AUTH_REQUIRED_MARKER_CLASS, AUTH_SPLIT_FLOATING_INPUT_CLASS, AUTH_SPLIT_ERROR_CLASS, AUTH_SPLIT_FORM_CLASS } from '@/components/auth/ui';
import { FloatingLabelField } from '@/components/ui/floating-label-field';
import { AuthErrorAlert } from '@/components/ui/AuthErrorAlert';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAuthError } from '@/lib/errors/useAuthError';
import { getAuthFieldErrors } from '@/lib/errors/auth-error-codes';
import {
  registerPrivatoSchema,
  toRegisterPayloadPrivato,
  PHONE_PREFIXES,
  COUNTRIES,
} from '@/lib/registrati/schema';
import type { RegisterPrivatoValues } from '@/lib/registrati/schema';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { RegistrationLegalCheckboxes } from '@/components/legal/RegistrationLegalCheckboxes';
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
  specificClausesAccepted: false,
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

  const fieldInputClass = AUTH_SPLIT_FLOATING_INPUT_CLASS;

  const prefixOptions: CountryOption[] = useMemo(
    () =>
      PHONE_PREFIXES.map((p) => {
        const iso = phonePrefixToCountryCode(p);
        return { code: p, label: p, flagCode: iso || 'IT' };
      }),
    []
  );

  const onSubmit = async (values: RegisterPrivatoValues) => {
    authError.clearError();
    clearStoreError();
    try {
      const payload = toRegisterPayloadPrivato({ ...values, website_url: '' });
      await registerUser(payload);
      router.push('/');
    } catch (err: unknown) {
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
    <form onSubmit={handleSubmit(onSubmit)} className={AUTH_SPLIT_FORM_CLASS}>
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

      <AuthRequiredLegend />

      <div>
        <FloatingLabelField
          label={t('registerForm.firstNameLabel')}
          id="first_name"
          type="text"
          value={watch('first_name')}
          floatingLabelBg="rgba(255,255,255,0.75)"
          inputClassName={fieldInputClass}
          autoComplete="given-name"
          required
          {...register('first_name')}
        />
        {errors.first_name && (
          <p className={AUTH_SPLIT_ERROR_CLASS}>{String(errors.first_name.message ?? '')}</p>
        )}
      </div>

      <div>
        <FloatingLabelField
          label={t('registerForm.lastNameLabel')}
          id="last_name"
          type="text"
          value={watch('last_name')}
          floatingLabelBg="rgba(255,255,255,0.75)"
          inputClassName={fieldInputClass}
          autoComplete="family-name"
          required
          {...register('last_name')}
        />
        {errors.last_name && (
          <p className={AUTH_SPLIT_ERROR_CLASS}>{String(errors.last_name.message ?? '')}</p>
        )}
      </div>

      <div>
        <FloatingLabelField
          label={t('registerForm.usernameLabel')}
          id="username"
          type="text"
          value={watch('username')}
          floatingLabelBg="rgba(255,255,255,0.75)"
          inputClassName={fieldInputClass}
          autoComplete="username"
          required
          {...register('username')}
        />
        {errors.username && (
          <p className={AUTH_SPLIT_ERROR_CLASS}>{String(errors.username.message ?? '')}</p>
        )}
      </div>

      <div>
        <FloatingLabelField
          label={t('registerForm.emailLabel')}
          id="email"
          type="email"
          value={watch('email')}
          floatingLabelBg="rgba(255,255,255,0.75)"
          inputClassName={fieldInputClass}
          autoComplete="email"
          required
          {...register('email')}
        />
        {errors.email && (
          <p className={AUTH_SPLIT_ERROR_CLASS}>{String(errors.email.message ?? '')}</p>
        )}
      </div>

      <div className="relative">
        <FloatingLabelField
          label={t('registerForm.passwordLabel')}
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={watch('password')}
          floatingLabelBg="rgba(255,255,255,0.75)"
          inputClassName={`${fieldInputClass} pr-10`}
          autoComplete="new-password"
          required
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
          <p className={AUTH_SPLIT_ERROR_CLASS}>{String(errors.password.message ?? '')}</p>
        )}
      </div>

      <div className="flex gap-2">
        <div className="w-[6.5rem] min-w-[6.5rem] shrink-0">
          <Controller
            name="phone_prefix"
            control={control}
            render={({ field }) => (
              <CountrySelect
                options={prefixOptions}
                value={field.value}
                onChange={field.onChange}
                size="sm"
                variant="prefix"
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
            inputClassName={fieldInputClass}
            autoComplete="tel-national"
            required
            {...register('phone')}
          />
          {errors.phone && (
            <p className={AUTH_SPLIT_ERROR_CLASS}>{String(errors.phone.message ?? '')}</p>
          )}
        </div>
      </div>

      <div>
        <label className={AUTH_SPLIT_LABEL_CLASS}>
          {t('registerForm.countryLabel')}
          <span className={AUTH_REQUIRED_MARKER_CLASS} aria-hidden>
            *
          </span>
        </label>
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
              placeholder={t('registerForm.countryPlaceholder')}
              size="sm"
            />
          )}
        />
        {errors.country && (
          <p className={AUTH_SPLIT_ERROR_CLASS}>{String(errors.country.message ?? '')}</p>
        )}
      </div>

      <RegistrationLegalCheckboxes
        register={register}
        errors={errors}
        textClassName="pt-0.5 text-[13px] leading-snug text-[#515154]"
      />

      {/* Error Alert - Elegant UI with i18n support */}
      <AuthErrorAlert 
        error={authError} 
        className="mt-4"
      />

      <div className="pt-1">
        <AuthSubmitButton
          variant="split"
          disabled={isLoading || authError.isRateLimitError}
          loading={isLoading}
          loadingText={t('registerForm.registrationLoading')}
        >
          {t('registerForm.createPrivateAccount')}
        </AuthSubmitButton>
      </div>
    </form>
  );
}
