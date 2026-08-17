'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Link2, MailCheck } from 'lucide-react';
import { EmailCodeInput } from '@/components/auth/email-code-input';
import {
  AuthBackLink,
  AuthSubmitButton,
  AuthSplitHeader,
  AUTH_ERROR_CLASS,
  AUTH_LINK_CLASS,
  AUTH_SPLIT_CAPTION_CLASS,
  AUTH_SPLIT_FORM_CLASS,
  AUTH_SPLIT_MUTED_CLASS,
} from '@/components/auth/ui';
import { AuthSplitViewShell } from '@/components/layout/AuthSplitViewShell';
import {
  useResendRegistrationVerification,
  useVerifyRegistrationEmailCode,
  useVerifyRegistrationEmailToken,
} from '@/lib/hooks/use-email-verification';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  buildVerificationPath,
  clearPendingRegistration,
  readAndScrubVerificationToken,
  readPendingRegistration,
  savePendingRegistration,
} from '@/lib/auth/registration-verification';
import { sanitizeInternalReturnPath } from '@/lib/security/internal-return-path';

type VerificationPhase = 'pending' | 'verified';
type VerificationErrorKey =
  | 'emailVerification.errors.tooManyAttempts'
  | 'emailVerification.errors.resendTooEarly'
  | 'emailVerification.errors.unavailable'
  | 'emailVerification.errors.invalidOrExpired';

interface VerificationErrorPayload {
  code?: string;
  retry_after_seconds?: number;
}

function readErrorPayload(error: unknown): VerificationErrorPayload {
  if (!error || typeof error !== 'object' || !('response' in error)) {
    return { code: 'AUTH_SERVICE_UNAVAILABLE' };
  }
  const response = (error as { response?: { data?: unknown } }).response;
  if (!response?.data || typeof response.data !== 'object') {
    return { code: 'AUTH_SERVICE_UNAVAILABLE' };
  }
  const data = response.data as Record<string, unknown>;
  return {
    code: typeof data.code === 'string' ? data.code : undefined,
    retry_after_seconds:
      typeof data.retry_after_seconds === 'number'
        ? data.retry_after_seconds
        : undefined,
  };
}

function secondsUntil(timestamp: string | null): number {
  if (!timestamp) return 0;
  const target = Date.parse(timestamp);
  if (!Number.isFinite(target)) return 0;
  return Math.max(0, Math.ceil((target - Date.now()) / 1000));
}

export function VerificationView() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFlowId = searchParams.get('flow_id') ?? '';
  const rawReturnTo = searchParams.get('returnTo');

  const returnTo = useMemo(() => {
    return sanitizeInternalReturnPath(rawReturnTo) ?? undefined;
  }, [rawReturnTo]);

  const [activeFlowId, setActiveFlowId] = useState(queryFlowId);
  const [token, setToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<VerificationPhase>('pending');
  const [destination, setDestination] = useState<string | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [errorKey, setErrorKey] = useState<VerificationErrorKey | null>(null);
  const verifyCodeInFlightRef = useRef(false);

  const verifyCode = useVerifyRegistrationEmailCode();
  const verifyToken = useVerifyRegistrationEmailToken();
  const resend = useResendRegistrationVerification();

  useEffect(() => {
    setActiveFlowId(queryFlowId);
    if (!queryFlowId) return;
    const pending = readPendingRegistration(queryFlowId);
    if (pending) {
      setDestination(pending.destination);
      setResendAvailableAt(pending.resend_available_at);
    }
  }, [queryFlowId]);

  useEffect(() => {
    setToken(readAndScrubVerificationToken());
  }, []);

  useEffect(() => {
    setCountdown(secondsUntil(resendAvailableAt));
    if (!resendAvailableAt) return;
    const timer = window.setInterval(() => {
      setCountdown(secondsUntil(resendAvailableAt));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);

  const setVerificationError = useCallback(
    (error: unknown) => {
      const payload = readErrorPayload(error);
      if (payload.retry_after_seconds) {
        setResendAvailableAt(
          new Date(Date.now() + payload.retry_after_seconds * 1000).toISOString()
        );
      }
      switch (payload.code) {
        case 'VERIFICATION_TOO_MANY_ATTEMPTS':
          setErrorKey('emailVerification.errors.tooManyAttempts');
          break;
        case 'VERIFICATION_RESEND_TOO_EARLY':
          setErrorKey('emailVerification.errors.resendTooEarly');
          break;
        case 'AUTH_SERVICE_UNAVAILABLE':
          setErrorKey('emailVerification.errors.unavailable');
          break;
        default:
          setErrorKey('emailVerification.errors.invalidOrExpired');
      }
    },
    []
  );

  const completeVerification = useCallback(() => {
    clearPendingRegistration(activeFlowId);
    setPhase('verified');
    setErrorKey(null);
    setToken(null);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [activeFlowId]);

  const submitCode = useCallback(
    async (value: string) => {
      if (
        !activeFlowId ||
        value.length !== 6 ||
        verifyCode.isPending ||
        verifyCodeInFlightRef.current
      ) return;
      verifyCodeInFlightRef.current = true;
      setErrorKey(null);
      try {
        await verifyCode.mutateAsync({ flowId: activeFlowId, code: value });
        completeVerification();
      } catch (error) {
        setVerificationError(error);
      } finally {
        verifyCodeInFlightRef.current = false;
      }
    },
    [activeFlowId, completeVerification, setVerificationError, verifyCode]
  );

  const submitToken = useCallback(async () => {
    if (!activeFlowId || !token || verifyToken.isPending) return;
    setErrorKey(null);
    try {
      await verifyToken.mutateAsync({ flowId: activeFlowId, token });
      completeVerification();
    } catch (error) {
      setVerificationError(error);
    }
  }, [activeFlowId, completeVerification, setVerificationError, token, verifyToken]);

  const resendCode = useCallback(async () => {
    if (!activeFlowId || countdown > 0 || resend.isPending) return;
    setErrorKey(null);
    try {
      const response = await resend.mutateAsync(activeFlowId);
      clearPendingRegistration(activeFlowId);
      savePendingRegistration(response);
      setActiveFlowId(response.flow_id);
      setDestination(response.destination);
      setResendAvailableAt(response.resend_available_at);
      setCode('');
      setToken(null);
      router.replace(buildVerificationPath(response.flow_id, returnTo));
    } catch (error) {
      setVerificationError(error);
    }
  }, [activeFlowId, countdown, resend, returnTo, router, setVerificationError]);

  if (!activeFlowId) {
    return (
      <AuthSplitViewShell>
        <AuthSplitHeader title={t('emailVerification.invalidFlowTitle')} />
        <div className={AUTH_ERROR_CLASS}>
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <p className="text-[13px] text-red-600">{t('emailVerification.invalidFlowBody')}</p>
        </div>
        <Link href="/registrati" className={`text-[13px] ${AUTH_LINK_CLASS}`}>
          {t('emailVerification.backToRegister')}
        </Link>
      </AuthSplitViewShell>
    );
  }

  if (phase === 'verified') {
    return (
      <AuthSplitViewShell>
        <AuthSplitHeader title={t('emailVerification.successTitle')} />
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" strokeWidth={1.8} />
          </span>
          <p className="max-w-sm text-[14px] leading-6 text-[#515154]">
            {t('emailVerification.successBody')}
          </p>
        </div>
        <AuthSubmitButton type="button" variant="split" onClick={() => router.push('/login')}>
          {t('emailVerification.goToLogin')}
        </AuthSubmitButton>
      </AuthSplitViewShell>
    );
  }

  const pending = verifyCode.isPending || verifyToken.isPending;

  return (
    <AuthSplitViewShell>
      <AuthBackLink href="/login" label={t('auth.back')} />
      <AuthSplitHeader
        title={t('emailVerification.title')}
        subtitle={
          destination
            ? t('emailVerification.sentTo', { destination })
            : t('emailVerification.subtitle')
        }
        className="mb-0 shrink-0"
      />

      <div className={AUTH_SPLIT_FORM_CLASS}>
        <div className="flex justify-center py-1">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0066cc]/10 text-[#0066cc]">
            {token ? <Link2 className="h-5 w-5" /> : <MailCheck className="h-5 w-5" />}
          </span>
        </div>

        {token ? (
          <>
            <p className="text-center text-[14px] leading-6 text-[#515154]">
              {t('emailVerification.linkReady')}
            </p>
            <AuthSubmitButton
              type="button"
              variant="split"
              onClick={submitToken}
              disabled={pending}
              loading={verifyToken.isPending}
              loadingText={t('emailVerification.verifying')}
            >
              {t('emailVerification.confirmLink')}
            </AuthSubmitButton>
            <button
              type="button"
              className={`text-[13px] ${AUTH_LINK_CLASS}`}
              onClick={() => {
                setToken(null);
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
              }}
            >
              {t('emailVerification.useCodeInstead')}
            </button>
          </>
        ) : (
          <>
            <div className="space-y-2.5">
              <p className={AUTH_SPLIT_CAPTION_CLASS}>{t('emailVerification.codeLabel')}</p>
              <p className={AUTH_SPLIT_MUTED_CLASS}>{t('emailVerification.codeHint')}</p>
              <EmailCodeInput
                value={code}
                onChange={setCode}
                onComplete={submitCode}
                length={6}
                digitsOnly
                ariaLabel={t('emailVerification.codeCharacter')}
                disabled={pending}
              />
            </div>

            <AuthSubmitButton
              type="button"
              variant="split"
              onClick={() => submitCode(code)}
              disabled={pending || code.length !== 6}
              loading={verifyCode.isPending}
              loadingText={t('emailVerification.verifying')}
            >
              {t('emailVerification.verify')}
            </AuthSubmitButton>
          </>
        )}

        {errorKey && (
          <div className={AUTH_ERROR_CLASS}>
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-[13px] text-red-600">{t(errorKey)}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[13px]">
          <span className="text-[#515154]">{t('emailVerification.resendHint')}</span>
          <button
            type="button"
            onClick={resendCode}
            disabled={resend.isPending || countdown > 0}
            className={`${AUTH_LINK_CLASS} disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:no-underline`}
          >
            {countdown > 0
              ? t('emailVerification.resendCountdown', { seconds: countdown })
              : t('emailVerification.resend')}
          </button>
        </div>
      </div>
    </AuthSplitViewShell>
  );
}
