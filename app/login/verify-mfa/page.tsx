'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useVerifyMFA } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { readMfaPreAuthToken } from '@/lib/auth/mfa-session';

// Schema validazione MFA code (6 cifre)
const mfaSchema = z.object({
  mfa_code: z
    .string()
    .min(6, 'Il codice deve essere di 6 cifre')
    .max(6, 'Il codice deve essere di 6 cifre')
    .regex(/^\d+$/, 'Il codice deve contenere solo numeri'),
});

type MFAFormValues = z.infer<typeof mfaSchema>;

export default function VerifyMFAPage() {
  const { t } = useTranslation();
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
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[#FF7300]" />
      </div>
    );
  }

  // Se non c'è preAuthToken, mostra stato di errore
  if (!effectiveToken) {
    const isTestMode = process.env.NODE_ENV === 'development';
    if (isTestMode) {
      // sviluppo: consente UI test con token fittizio nel submit
    } else {
      return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sessione MFA non valida
            </h1>
            <p className="text-gray-600">
              La sessione di verifica è scaduta o non è stata avviata correttamente.
            </p>
            <Link
              href="/login?accesso=1"
              className="inline-flex items-center gap-2 text-[#FF7300] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna al login
            </Link>
          </div>
        </div>
      );
    }
  }

  async function onSubmit(data: MFAFormValues) {
    setLocalError(null);
    clearError();

    try {
      await verifyMFAMutation.mutateAsync({
        pre_auth_token: effectiveToken || preAuthToken || 'test-token',
        mfa_code: data.mfa_code,
      });

      // Successo: redirect a home
      router.push('/');
    } catch (err: any) {
      // L'errore è già gestito dallo store che chiama parseAuthError
      // Il messaggio tradotto sarà disponibile in storeError
      setLocalError(storeError ?? 'Verifica MFA fallita');
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 bg-white rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-black/5 px-6 sm:px-8 py-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FF7300]/10">
            <Shield className="h-8 w-8 text-[#FF7300]" />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
            Verifica in due passaggi
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#86868B]">
            Inserisci il codice di 6 cifre generato dalla tua app di autenticazione
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Mantieni la field nel form state (RHF) */}
          <input type="hidden" {...register('mfa_code')} />

          <div className="space-y-3">
            <div className="text-sm font-medium text-[#86868B]">
              Codice MFA
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
                    aria-label={`MFA digit ${idx + 1}`}
                    disabled={isLoading || verifyMFAMutation.isPending}
                    className={[
                      'w-12 h-12 sm:w-13 sm:h-13',
                      'rounded-[12px] bg-[#F2F2F7] text-center',
                      'text-2xl sm:text-3xl font-semibold text-[#1D1D1F]',
                      'border border-transparent',
                      'focus:outline-none focus:ring-2 focus:ring-[#FF7300] focus:ring-offset-2 focus:ring-offset-white',
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
          </div>

          {/* Errori inline */}
          {localError && (
            <div className="rounded-[14px] bg-red-50 border border-red-100 p-4">
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
              className="h-12 w-full rounded-[16px] bg-[#FF7300] text-base font-semibold text-white shadow-[0_8px_24px_rgba(255,115,0,0.25)] hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || verifyMFAMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verifica in corso...
                </span>
              ) : (
                'Verifica'
              )}
            </Button>

            <Link
              href="/login?accesso=1"
              className="block text-center text-sm font-medium text-[#007AFF] hover:underline"
            >
              &lt;- Torna al login
            </Link>
          </div>
        </form>

        {/* Supporto */}
        <p className="text-xs text-[#86868B] text-center">
          Non ricevi il codice? Assicurati che l&apos;ora del tuo dispositivo sia sincronizzata correttamente con l&apos;app di autenticazione.
        </p>
      </div>
    </div>
  );
}
