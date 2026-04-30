'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import { EmailCodeInput } from '@/components/auth/email-code-input';
import {
  loginCodeRequestSchema,
  loginCodeVerifySchema,
  type LoginCodeRequestValues,
  type LoginCodeVerifyValues,
} from '@/lib/validations/auth';
import { useRequestLoginCode, useVerifyLoginCode } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { translateZodMessage } from '@/lib/i18n/translateZodMessage';
import { parseAuthError } from '@/lib/api/auth-error';

const appleInputClass =
  'h-[52px] w-full rounded-2xl border border-black/10 bg-black/5 px-4 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all disabled:opacity-50';

const APPLE_MODAL =
  'relative w-full max-w-[480px] mx-auto overflow-hidden rounded-[40px] bg-white/85 backdrop-blur-[60px] shadow-[0_32px_64px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)] border border-white/50';

export function LoginCodeForm() {
  const { t } = useTranslation();
  const router = useRouter();

  const requestMutation = useRequestLoginCode();
  const verifyMutation = useVerifyLoginCode();

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [countdown, setCountdown] = useState(300); // 5 minuti
  const [localError, setLocalError] = useState<string | null>(null);

  const requestForm = useForm<LoginCodeRequestValues>({
    resolver: zodResolver(loginCodeRequestSchema),
    defaultValues: { email: '' },
  });

  const verifyForm = useForm<LoginCodeVerifyValues>({
    resolver: zodResolver(loginCodeVerifySchema),
    defaultValues: { email: '', code: '' },
  });

  const emailValue = requestForm.watch('email');
  const codeValue = verifyForm.watch('code');

  // Countdown 5 minuti
  useEffect(() => {
    if (step !== 'verify') return;
    setCountdown(300);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const formattedCountdown = useMemo(() => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [countdown]);

  const handleRequest = useCallback(
    async (data: LoginCodeRequestValues) => {
      setLocalError(null);
      try {
        await requestMutation.mutateAsync(data.email.trim().toLowerCase());
        verifyForm.setValue('email', data.email.trim().toLowerCase());
        setStep('verify');
      } catch (err: any) {
        const parsed = parseAuthError(err);
        setLocalError(parsed.message);
      }
    },
    [requestMutation, verifyForm]
  );

  const handleVerify = useCallback(
    async (code: string) => {
      setLocalError(null);
      const email = verifyForm.getValues('email');
      if (!email) return;

      try {
        const result = await verifyMutation.mutateAsync({ email, code });
        if (result.mfaRequired) {
          router.replace('/login/verify-mfa');
        } else {
          router.push('/');
        }
      } catch (err: any) {
        const parsed = parseAuthError(err);
        setLocalError(parsed.message);
        // Lascia l'input libero per riprovare
      }
    },
    [verifyMutation, verifyForm, router]
  );

  const handleResend = useCallback(async () => {
    const email = verifyForm.getValues('email');
    if (!email) return;
    setLocalError(null);
    try {
      await requestMutation.mutateAsync(email);
      setCountdown(300);
    } catch (err: any) {
      const parsed = parseAuthError(err);
      setLocalError(parsed.message);
    }
  }, [requestMutation, verifyForm]);

  const isRequestPending = requestMutation.isPending;
  const isVerifyPending = verifyMutation.isPending;

  return (
    <div className={APPLE_MODAL}>
      <div className="p-8 sm:p-10 flex flex-col">
        {/* Indietro */}
        <Link
          href="/login?accesso=1"
          className="self-start text-[#86868b] hover:text-[#1d1d1f] mb-6 flex items-center gap-1 text-[13px] font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t('loginCode.backToLogin')}
        </Link>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8 gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/5">
            <Mail className="h-7 w-7 text-[#1d1d1f]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-[#1d1d1f]">
              {t('loginCode.title')}
            </h1>
            <p className="mt-1.5 text-[14px] text-[#86868b]">
              {step === 'request'
                ? t('loginCode.emailLabel')
                : t('loginCode.checkEmail')}
            </p>
          </div>
        </div>

        {/* Errori */}
        {localError && (
          <div className="mb-5 rounded-2xl bg-red-50 border border-red-100 p-3.5 flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-[13px] text-red-600">{localError}</p>
          </div>
        )}

        {/* Step A — Richiesta email */}
        {step === 'request' && (
          <form
            onSubmit={requestForm.handleSubmit(handleRequest)}
            className="space-y-5"
          >
            <div>
              <input
                type="email"
                autoComplete="email"
                placeholder={t('loginCode.emailPlaceholder')}
                className={appleInputClass}
                disabled={isRequestPending}
                {...requestForm.register('email')}
              />
              {requestForm.formState.errors.email && (
                <p className="mt-1.5 pl-1 text-[12px] text-red-500">
                  {translateZodMessage(
                    requestForm.formState.errors.email.message,
                    t
                  )}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isRequestPending}
              className="w-full rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isRequestPending
                ? t('loginCode.sending')
                : t('loginCode.sendCode')}
            </button>

            <div className="pt-1 text-center text-[13px] text-[#515154]">
              <Link
                href="/login?accesso=1"
                className="font-medium text-[#0066cc] hover:underline"
              >
                {t('loginCode.backToLogin')}
              </Link>
            </div>
          </form>
        )}

        {/* Step B — Verifica codice */}
        {step === 'verify' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#86868b] text-center">
                {t('loginCode.codeLabel')}
              </p>

              <EmailCodeInput
                value={codeValue}
                onChange={(v) => verifyForm.setValue('code', v, {
                  shouldValidate: true,
                })}
                onComplete={handleVerify}
                disabled={isVerifyPending}
              />

              {verifyForm.formState.errors.code && (
                <p className="text-[12px] text-red-500 text-center">
                  {translateZodMessage(
                    verifyForm.formState.errors.code.message,
                    t
                  )}
                </p>
              )}

              {/* Countdown */}
              <p className="text-center text-[13px] text-[#86868b]">
                {countdown > 0
                  ? `⏳ ${formattedCountdown}`
                  : t('loginCode.resendCode')}
              </p>
            </div>

            {/* Reinvia codice */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-[13px] text-[#515154]">
                {t('loginCode.resendHint')}
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={isRequestPending || countdown > 0}
                className="text-[13px] font-medium text-[#0066cc] hover:underline disabled:opacity-50 disabled:hover:no-underline"
              >
                {t('loginCode.resendCode')}
              </button>
            </div>

            {/* CTA Accedi (fallback se l'utente preferisce click) */}
            <button
              type="button"
              onClick={() => {
                const code = verifyForm.getValues('code');
                if (code.length === 8) handleVerify(code);
              }}
              disabled={isVerifyPending || codeValue.length !== 8}
              className="w-full rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isVerifyPending
                ? t('loginCode.loggingIn')
                : t('loginCode.login')}
            </button>

            <div className="text-center text-[13px] text-[#515154]">
              <Link
                href="/login?accesso=1"
                className="font-medium text-[#0066cc] hover:underline"
              >
                {t('loginCode.backToLogin')}
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200/50 text-center">
          <p className="text-[14px] text-[#515154]">
            {t('loginCode.noAccount')}{' '}
            <Link
              href="/registrati"
              className="font-semibold text-[#0066cc] hover:underline"
            >
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
