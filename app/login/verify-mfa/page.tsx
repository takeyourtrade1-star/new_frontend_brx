'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, AlertCircle, ArrowLeft, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthShell, AUTH_GLASS_CLASS, AUTH_GLASS_LIGHT } from '@/components/layout/AuthShell';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useVerifyMFA } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { readMfaPreAuthToken } from '@/lib/auth/mfa-session';

type MFAFormValues = { mfa_code: string };

export default function VerifyMFAPage() {
  const { t } = useTranslation();

  const mfaSchema = useMemo(() => z.object({
    mfa_code: z
      .string()
      .min(6, t('mfa.codeLengthError'))
      .max(6, t('mfa.codeLengthError'))
      .regex(/^\d+$/, t('mfa.codeDigitsOnly')),
  }), [t]);
  const router = useRouter();
  const verifyMFAMutation = useVerifyMFA();

  // Stato dallo store
  const preAuthToken = useAuthStore((s) => s.preAuthToken);
  const storeError = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearError = useAuthStore((s) => s.clearError);

  /** Evita flash SSR / idratazione senza token; ripristina da sessionStorage se serve */
  const [clientReady, setClientReady] = useState(false);

  // Stato locale per errori
  const [localError, setLocalError] = useState<string | null>(null);

  // Stato per "ricorda questo dispositivo"
  const [rememberDevice, setRememberDevice] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<MFAFormValues>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { mfa_code: '' },
  });

  const mfaValue = watch('mfa_code');
  const otpDigits = useMemo(() => {
    const raw = (mfaValue ?? '').replace(/\D/g, '').slice(0, 6);
    return raw.padEnd(6, ' ').split('').slice(0, 6);
  }, [mfaValue]);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Pulisci errori all'unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Idratazione client + backup sessionStorage (Zustand non ha sempre il token al primo paint)
  useEffect(() => {
    const fromSession = readMfaPreAuthToken();
    if (fromSession) {
      useAuthStore.setState({
        preAuthToken: fromSession,
        mfaRequired: true,
      });
    }
    setClientReady(true);
  }, []);

  // Aggiorna localError quando cambia storeError
  useEffect(() => {
    if (storeError) {
      setLocalError(storeError);
    }
  }, [storeError]);

  const effectiveToken =
    preAuthToken || (clientReady ? readMfaPreAuthToken() : null);

  if (!clientReady) {
    return (
      <AuthShell>
        <div className={AUTH_GLASS_CLASS} style={AUTH_GLASS_LIGHT}>
          <div className="flex items-center justify-center p-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-[#FF7300]" />
          </div>
        </div>
      </AuthShell>
    );
  }

  // Se non c'è preAuthToken, mostra stato di errore
  if (!effectiveToken) {
    const isTestMode = process.env.NODE_ENV === 'development';
    if (isTestMode) {
      // sviluppo: consente UI test con token fittizio nel submit
    } else {
      return (
        <AuthShell>
          <div className={AUTH_GLASS_CLASS} style={AUTH_GLASS_LIGHT}>
            <div className="space-y-6 p-8 sm:p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('mfa.invalidSession')}
              </h1>
              <p className="text-gray-600">
                {t('mfa.sessionExpired')}
              </p>
              <Link
                href="/login?accesso=1"
                className="inline-flex items-center gap-2 text-[#FF7300] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('mfa.backToLogin')}
              </Link>
            </div>
          </div>
        </AuthShell>
      );
    }
  }

  async function onSubmit(data: MFAFormValues) {
    setLocalError(null);
    clearError();

    const tokenToSend = effectiveToken || preAuthToken;
    if (!tokenToSend) {
      setLocalError(t('mfa.tokenMissing'));
      return;
    }

    try {
      await verifyMFAMutation.mutateAsync({
        pre_auth_token: tokenToSend,
        mfa_code: data.mfa_code,
        remember_device: rememberDevice,
      });

      // Successo: redirect a home
      router.push('/');
    } catch (err: any) {
      // L'errore è già gestito dallo store che chiama parseAuthError
      // Il messaggio tradotto sarà disponibile in storeError
      setLocalError(storeError ?? t('mfa.verifyFailed'));
    }
  }

  return (
    <AuthShell>
      <h1 className="mb-6 text-center text-3xl font-bold uppercase tracking-wide text-white">
        {t('mfa.title')}
      </h1>
      <div className={AUTH_GLASS_CLASS} style={AUTH_GLASS_LIGHT}>
        <div className="p-8 sm:p-12 space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FF7300]/10">
              <Shield className="h-8 w-8 text-[#FF7300]" />
            </div>
            <p className="mt-4 text-sm sm:text-base text-gray-600">
              {t('mfa.subtitle')}
            </p>
          </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Mantieni la field nel form state (RHF) */}
          <input type="hidden" {...register('mfa_code')} />

          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-500">
              {t('mfa.codeLabel')}
            </div>

            <div className="flex items-center justify-between gap-3">
              {otpDigits.map((digit, idx) => {
                const filled = digit.trim().length > 0;
                return (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpRefs.current[idx] = el;
                    }}
                    value={filled ? digit : ''}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-label={t('mfa.digitAria').replace('{n}', String(idx + 1))}
                    disabled={isLoading || verifyMFAMutation.isPending}
                    className={[
                      'w-12 h-12 sm:w-13 sm:h-13',
                      'rounded-xl bg-white text-center',
                      'text-2xl sm:text-3xl font-semibold text-gray-900',
                      'border border-gray-300',
                      'focus:outline-none focus:ring-2 focus:ring-[#FF7300] focus:ring-offset-0',
                      'transition',
                    ].join(' ')}
                    onChange={(e) => {
                      const nextDigit = e.target.value.replace(/\D/g, '').slice(-1);
                      if (!nextDigit) {
                        const arr = otpDigits.map((d, i) => (i === idx ? ' ' : d));
                        const next = arr.map((d) => d.trim()).join('').replace(/\s/g, '');
                        setValue('mfa_code', next.slice(0, 6));
                        return;
                      }
                      const arr = otpDigits.map((d, i) => {
                        if (i === idx) return nextDigit;
                        return d.trim() ? d.trim() : ' ';
                      });
                      const next = arr.map((d) => d.trim()).join('').replace(/\s/g, '');
                      setValue('mfa_code', next.slice(0, 6), { shouldValidate: true });
                      if (idx < 5) otpRefs.current[idx + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace') {
                        const current = otpDigits[idx]?.trim();
                        if (!current && idx > 0) {
                          otpRefs.current[idx - 1]?.focus();
                        }
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                      if (pasted.length === 0) return;
                      setValue('mfa_code', pasted, { shouldValidate: true });
                      // focus last filled
                      const lastIdx = Math.min(5, pasted.length - 1);
                      otpRefs.current[lastIdx]?.focus();
                      e.preventDefault();
                    }}
                  />
                );
              })}
            </div>

            {/* Validazione */}
            {errors.mfa_code && (
              <p className="text-sm text-red-500 text-center">
                {errors.mfa_code.message}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="remember-device"
                checked={rememberDevice}
                onCheckedChange={setRememberDevice}
                disabled={isLoading || verifyMFAMutation.isPending}
                className="mt-0.5 border-gray-400 data-[state=checked]:bg-[#FF7300] data-[state=checked]:border-[#FF7300]"
              />
              <label
                htmlFor="remember-device"
                className="text-sm text-gray-600 cursor-pointer select-none leading-none"
              >
                {t('mfa.rememberDevice')}
              </label>
            </div>
          </div>

          {/* Errori inline */}
          {localError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm text-red-700">{localError}</p>
              </div>
            </div>
          )}

          {/* Pulsanti */}
          <div className="space-y-4">
            <Button
              type="submit"
              disabled={isLoading || verifyMFAMutation.isPending}
              className="h-14 w-full rounded-xl text-xl font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#FF7300' }}
            >
              {isLoading || verifyMFAMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('mfa.verifying')}
                </span>
              ) : (
                t('mfa.verify')
              )}
            </Button>

            <Link
              href="/login?accesso=1"
              className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#FF7300] group"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              {t('mfa.backToLogin')}
            </Link>
          </div>
        </form>

          {/* Supporto */}
          <p className="text-xs text-gray-500 text-center">
            {t('mfa.helpText')}
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
