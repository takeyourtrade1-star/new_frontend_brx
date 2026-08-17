'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
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
import {
  AuthSplitHeader,
  AuthField,
  AuthSubmitButton,
  AUTH_LINK_CLASS,
  AUTH_ERROR_CLASS,
  AUTH_SPLIT_CAPTION_CLASS,
  AUTH_SPLIT_ERROR_CLASS,
  AUTH_SPLIT_MUTED_CLASS,
  AUTH_SPLIT_BODY_CLASS,
  AUTH_SPLIT_FORM_CLASS,
} from '@/components/auth/ui';

export function LoginCodeForm() {
  const { t } = useTranslation();
  const router = useRouter();

  const requestMutation = useRequestLoginCode();
  const verifyMutation = useVerifyLoginCode();

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [countdown, setCountdown] = useState(300);
  const [localError, setLocalError] = useState<string | null>(null);
  const verifyInFlightRef = useRef(false);

  const requestForm = useForm<LoginCodeRequestValues>({
    resolver: zodResolver(loginCodeRequestSchema),
    defaultValues: { email: '' },
  });

  const verifyForm = useForm<LoginCodeVerifyValues>({
    resolver: zodResolver(loginCodeVerifySchema),
    defaultValues: { email: '', code: '' },
  });

  const codeValue = verifyForm.watch('code');

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
      } catch (err: unknown) {
        const parsed = parseAuthError(err);
        setLocalError(parsed.message);
      }
    },
    [requestMutation, verifyForm]
  );

  const handleVerify = useCallback(
    async (code: string) => {
      const email = verifyForm.getValues('email');
      if (!email || verifyInFlightRef.current) return;
      verifyInFlightRef.current = true;
      setLocalError(null);

      try {
        const result = await verifyMutation.mutateAsync({ email, code });
        if (result.mfaRequired) {
          router.replace('/login/verify-mfa');
        } else {
          router.push('/');
        }
      } catch (err: unknown) {
        const parsed = parseAuthError(err);
        setLocalError(parsed.message);
      } finally {
        verifyInFlightRef.current = false;
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
    } catch (err: unknown) {
      const parsed = parseAuthError(err);
      setLocalError(parsed.message);
    }
  }, [requestMutation, verifyForm]);

  const isRequestPending = requestMutation.isPending;
  const isVerifyPending = verifyMutation.isPending;

  return (
    <>
      <AuthSplitHeader
        title={t('loginCode.title')}
        subtitle={step === 'request' ? t('loginCode.emailLabel') : t('loginCode.checkEmail')}
        className="mb-0 shrink-0"
      />

      {localError && (
        <div className={`${AUTH_ERROR_CLASS}`}>
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <p className="text-[13px] text-red-600">{localError}</p>
        </div>
      )}

      {step === 'request' && (
        <form onSubmit={requestForm.handleSubmit(handleRequest)} className={AUTH_SPLIT_FORM_CLASS}>
          <AuthField
            type="email"
            autoComplete="email"
            placeholder={t('loginCode.emailPlaceholder')}
            aria-label={t('loginForm.email')}
            required
            variant="split"
            disabled={isRequestPending}
            error={
              requestForm.formState.errors.email
                ? translateZodMessage(requestForm.formState.errors.email.message, t)
                : undefined
            }
            {...requestForm.register('email')}
          />

          <AuthSubmitButton
            variant="split"
            disabled={isRequestPending}
            loading={isRequestPending}
            loadingText={t('loginCode.sending')}
          >
            {t('loginCode.sendCode')}
          </AuthSubmitButton>
        </form>
      )}

      {step === 'verify' && (
        <div className={AUTH_SPLIT_FORM_CLASS}>
          <div className="space-y-2.5">
            <p className={AUTH_SPLIT_CAPTION_CLASS}>{t('loginCode.codeLabel')}</p>
            <p className={AUTH_SPLIT_MUTED_CLASS}>{t('loginCode.codeHint')}</p>

            <EmailCodeInput
              value={codeValue}
              onChange={(v) => verifyForm.setValue('code', v, { shouldValidate: true })}
              onComplete={handleVerify}
              disabled={isVerifyPending}
            />

            {verifyForm.formState.errors.code && (
              <p className={AUTH_SPLIT_ERROR_CLASS}>
                {translateZodMessage(verifyForm.formState.errors.code.message, t)}
              </p>
            )}

            <p className={AUTH_SPLIT_MUTED_CLASS}>
              {countdown > 0 ? `⏳ ${formattedCountdown}` : t('loginCode.resendCode')}
            </p>
          </div>

          <div className="flex items-center justify-start gap-1.5">
            <span className={AUTH_SPLIT_BODY_CLASS}>{t('loginCode.resendHint')}</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isRequestPending || countdown > 0}
              className={`text-[13px] ${AUTH_LINK_CLASS} disabled:opacity-50 disabled:hover:no-underline`}
            >
              {t('loginCode.resendCode')}
            </button>
          </div>

          <AuthSubmitButton
            type="button"
            variant="split"
            onClick={() => {
              const code = verifyForm.getValues('code');
              if (code.length === 8) handleVerify(code);
            }}
            disabled={isVerifyPending || codeValue.length !== 8}
            loading={isVerifyPending}
            loadingText={t('loginCode.loggingIn')}
          >
            {t('loginCode.login')}
          </AuthSubmitButton>
        </div>
      )}

    </>
  );
}
