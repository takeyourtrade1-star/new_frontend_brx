'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { OtpSixBoxes } from '@/components/ui/otp-six-boxes';
import { AuthShell } from '@/components/layout/AuthShell';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useVerifyMFA } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { readMfaPreAuthToken } from '@/lib/auth/mfa-session';

type MFAFormValues = { mfa_code: string };

const APPLE_MODAL = 'relative w-full max-w-[480px] mx-auto overflow-hidden rounded-[40px] bg-white/85 backdrop-blur-[60px] shadow-[0_32px_64px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)] border border-white/50';

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

  const preAuthToken = useAuthStore((s) => s.preAuthToken);
  const storeError = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearError = useAuthStore((s) => s.clearError);

  const [clientReady, setClientReady] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
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

  useEffect(() => {
    return () => { clearError(); };
  }, [clearError]);

  useEffect(() => {
    const fromSession = readMfaPreAuthToken();
    if (fromSession) {
      useAuthStore.setState({ preAuthToken: fromSession, mfaRequired: true });
    }
    setClientReady(true);
  }, []);

  useEffect(() => {
    if (storeError) setLocalError(storeError);
  }, [storeError]);

  const effectiveToken = preAuthToken || (clientReady ? readMfaPreAuthToken() : null);

  /* ── Loading skeleton ── */
  if (!clientReady) {
    return (
      <AuthShell>
        <div className={APPLE_MODAL}>
          <div className="flex items-center justify-center p-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-[#1d1d1f]" />
          </div>
        </div>
      </AuthShell>
    );
  }

  /* ── Token mancante (produzione) ── */
  if (!effectiveToken && process.env.NODE_ENV !== 'development') {
    return (
      <AuthShell>
        <div className={APPLE_MODAL}>
          <div className="p-8 sm:p-10 flex flex-col items-center gap-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-[22px] font-bold text-[#1d1d1f]">{t('mfa.invalidSession')}</h1>
              <p className="text-[14px] text-[#86868b]">{t('mfa.sessionExpired')}</p>
            </div>
            <Link
              href="/login?accesso=1"
              className="flex items-center gap-1.5 text-[14px] font-medium text-[#0066cc] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('mfa.backToLogin')}
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  async function onSubmit(data: MFAFormValues) {
    setLocalError(null);
    clearError();

    const tokenToSend = effectiveToken || preAuthToken;
    if (!tokenToSend) { setLocalError(t('mfa.tokenMissing')); return; }

    try {
      await verifyMFAMutation.mutateAsync({
        pre_auth_token: tokenToSend,
        mfa_code: data.mfa_code,
        remember_device: rememberDevice,
      });
      router.push('/');
    } catch (err: any) {
      setLocalError(storeError ?? t('mfa.verifyFailed'));
    }
  }

  const isPending = isLoading || verifyMFAMutation.isPending;

  return (
    <AuthShell>
      <div className={APPLE_MODAL}>
        <div className="p-8 sm:p-10 flex flex-col">
          {/* Indietro */}
          <Link
            href="/login?accesso=1"
            className="self-start text-[#86868b] hover:text-[#1d1d1f] mb-6 flex items-center gap-1 text-[13px] font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Indietro
          </Link>

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8 gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/5">
              <Shield className="h-7 w-7 text-[#1d1d1f]" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-[#1d1d1f]">
                {t('mfa.title')}
              </h1>
              <p className="mt-1.5 text-[14px] text-[#86868b]">
                {t('mfa.subtitle')}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" {...register('mfa_code')} />

            <div className="space-y-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#86868b] text-center">
                {t('mfa.codeLabel')}
              </p>

              <OtpSixBoxes
                value={watch('mfa_code')}
                onChange={(v) => setValue('mfa_code', v, { shouldValidate: true })}
                disabled={isPending}
                error={errors.mfa_code?.message}
                ariaLabelPrefix="MFA digit"
              />

              {/* Ricorda dispositivo */}
              <div className="flex items-center gap-2.5 pt-1">
                <Checkbox
                  id="remember-device"
                  checked={rememberDevice}
                  onCheckedChange={setRememberDevice}
                  disabled={isPending}
                  className="mt-0.5 border-black/20 data-[state=checked]:bg-[#1d1d1f] data-[state=checked]:border-[#1d1d1f]"
                />
                <label
                  htmlFor="remember-device"
                  className="text-[13px] text-[#515154] cursor-pointer select-none leading-none"
                >
                  {t('mfa.rememberDevice')}
                </label>
              </div>
            </div>

            {/* Errore */}
            {localError && (
              <div className="rounded-2xl bg-red-50 border border-red-100 p-3.5 flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <p className="text-[13px] text-red-600">{localError}</p>
              </div>
            )}

            {/* Pulsanti */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t('mfa.verifying')}
                  </span>
                ) : (
                  t('mfa.verify')
                )}
              </button>

              <Link
                href="/login?accesso=1"
                className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors group"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                {t('mfa.backToLogin')}
              </Link>
            </div>
          </form>

          <p className="mt-8 text-center text-[12px] text-[#86868b]">
            {t('mfa.helpText')}
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
