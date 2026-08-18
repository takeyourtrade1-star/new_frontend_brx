'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { AuthSubmitButton, AuthRequiredLegend, AUTH_SPLIT_LABEL_CLASS, AUTH_REQUIRED_MARKER_CLASS, AUTH_SPLIT_FLOATING_INPUT_CLASS, AUTH_SPLIT_ERROR_CLASS, AUTH_SPLIT_FORM_CLASS } from '@/components/auth/ui';
import { FloatingLabelField } from '@/components/ui/floating-label-field';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  registerDemoSchema,
  toRegisterPayloadDemo,
  PHONE_PREFIXES,
  COUNTRIES,
} from '@/lib/registrati/schema';
import type { RegisterDemoValues } from '@/lib/registrati/schema';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { CountrySelect, type CountryOption } from '@/lib/auction/country-flag';
import { useUserCountry } from '@/lib/hooks/use-user-country';
import { RegistrationLegalCheckboxes } from '@/components/legal/RegistrationLegalCheckboxes';
import {
  buildVerificationPath,
  savePendingRegistration,
} from '@/lib/auth/registration-verification';
import { sanitizeInternalReturnPath } from '@/lib/security/internal-return-path';


const defaultValues: RegisterDemoValues = {
  website_url: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  phone_prefix: '+39',
  country: 'IT',
  termsAccepted: false,
  specificClausesAccepted: false,
  privacyAccepted: false,
  cancellationAccepted: false,
  adultConfirmed: false,
};

export function RegistratiDemoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const detectedCountry = useUserCountry();
  const registerUser = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const registrationFieldErrors = useAuthStore((s) => s.registrationFieldErrors);
  const clearError = useAuthStore((s) => s.clearError);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const flashMessage = useAuthStore((s) => s.flashMessage);
  const idempotencyKeyRef = useRef<string | null>(null);

  const prefilledEmail = searchParams.get('email') ?? '';
  const rawReturnTo = searchParams.get('returnTo');

  /**
   * Sanitize returnTo: accettiamo solo path interni che iniziano per "/" e non
   * sono assoluti (es. "//attacker.com/...", "https://...") per evitare open
   * redirect. Fallback alla home se invalido.
   */
  const safeReturnTo = useCallback((): string => {
    return sanitizeInternalReturnPath(rawReturnTo) ?? '/';
  }, [rawReturnTo]);

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
      email: prefilledEmail,
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
      router.push(safeReturnTo());
    }
  }, [isAuthenticated, flashMessage, router, safeReturnTo]);

  const fieldInputClass = AUTH_SPLIT_FLOATING_INPUT_CLASS;

  const onSubmit = async (values: RegisterDemoValues) => {
    clearError();
    try {
      const payload = toRegisterPayloadDemo({ ...values, website_url: '' });
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID();
      }
      const result = await registerUser(payload, idempotencyKeyRef.current);
      if (result.status === 'verification_pending') {
        savePendingRegistration(result);
        router.push(buildVerificationPath(result.flow_id, safeReturnTo()));
        return;
      }
      router.push(safeReturnTo());
    } catch {
      idempotencyKeyRef.current = null;
      // Errori già impostati nello store e via setError dall'effetto
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={AUTH_SPLIT_FORM_CLASS}>
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

      <AuthRequiredLegend />

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

      <div className="flex gap-2 items-start">
        <div className="w-[6.85rem] min-w-[6.85rem] shrink-0">
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
        <div className="flex-1 min-w-0">
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

      {error && (
        <p className={AUTH_SPLIT_ERROR_CLASS}>{error}</p>
      )}

      <div className="pt-1">
        <AuthSubmitButton
          variant="split"
          disabled={isLoading}
          loading={isLoading}
          loadingText={t('registerForm.registrationLoading')}
        >
          {t('auth.register')}
        </AuthSubmitButton>
      </div>
    </form>
  );
}
