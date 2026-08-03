'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useCurrentUser, useEnableMFA, useVerifyMFASetup, useDisableMFA } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  ArrowLeft,
  Smartphone,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const GOOGLE_AUTH_ANDROID =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2';
const GOOGLE_AUTH_IOS = 'https://apps.apple.com/app/google-authenticator/id388497605';

const STEP_KEYS = [
  'accountPage.sec2faStep1',
  'accountPage.sec2faStep2',
  'accountPage.sec2faStep3',
  'accountPage.sec2faStep4',
  'accountPage.sec2faStep5',
] as const;

const mfaCodeSchema = z.object({
  mfa_code: z
    .string()
    .min(6, 'Il codice deve essere di 6 cifre')
    .max(6, 'Il codice deve essere di 6 cifre')
    .regex(/^\d+$/, 'Il codice deve contenere solo numeri'),
});

type MFACodeFormValues = z.infer<typeof mfaCodeSchema>;

const enableMFASchema = z.object({
  password: z.string().min(1, 'La password è obbligatoria').max(128),
  current_mfa_code: z
    .string()
    .regex(/^[0-9]{6}$/, 'Il codice deve essere di 6 cifre')
    .optional()
    .or(z.literal('')),
});

type EnableMFAFormValues = z.infer<typeof enableMFASchema>;

const disableMFASchema = z.object({
  password: z.string().min(1, 'La password è obbligatoria'),
  current_mfa_code: z
    .string()
    .regex(/^[0-9]{6}$/, 'Il codice deve essere di 6 cifre'),
});

type DisableMFAFormValues = z.infer<typeof disableMFASchema>;

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

function StatusCard({ isEnabled }: { isEnabled: boolean }) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border p-5 shadow-sm backdrop-blur-sm sm:p-6',
        isEnabled
          ? 'border-[#FF7300]/30 bg-gradient-to-br from-[#FF7300]/10 via-white to-white'
          : 'border-gray-200/80 bg-white'
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm',
            isEnabled ? 'bg-gradient-to-br from-[#FF7300] to-[#FF8800]' : 'bg-gray-200'
          )}
        >
          {isEnabled ? (
            <ShieldCheck className="h-7 w-7 text-white" strokeWidth={2} />
          ) : (
            <ShieldOff className="h-7 w-7 text-gray-500" strokeWidth={2} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
              isEnabled ? 'bg-[#FF7300]/15 text-[#FF7300]' : 'bg-gray-100 text-gray-500'
            )}
          >
            {isEnabled ? t('accountPage.sec2faStatusOn') : t('accountPage.sec2faStatusOff')}
          </p>
          <h2 className="text-lg font-bold text-[#1D3160] sm:text-xl">
            {isEnabled ? t('accountPage.sec2faStatusTitleOn') : t('accountPage.sec2faStatusTitleOff')}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            {isEnabled ? t('accountPage.sec2faStatusDescOn') : t('accountPage.sec2faStatusDescOff')}
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleAuthenticatorCard() {
  const { t } = useTranslation();

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4285F4]/15 to-[#34A853]/10 ring-1 ring-[#4285F4]/20">
          <Smartphone className="h-5 w-5 text-[#4285F4]" aria-hidden />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#1D3160]">
            {t('accountPage.secDownloadAuthTitle')}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">{t('accountPage.secDownloadAuthText')}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <Shield className="h-6 w-6 text-[#FF7300]" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-[#1D3160]">{t('account.securityGoogleAuth')}</p>
            <p className="text-xs text-gray-500">{t('account.securityGoogleAuthDesc')}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={GOOGLE_AUTH_ANDROID}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#1D3160] transition-all hover:border-[#FF7300]/40 hover:shadow-md"
          >
            {t('accountPage.secStoreGoogle')}
            <ExternalLink className="h-3.5 w-3.5 text-gray-400" aria-hidden />
          </a>
          <a
            href={GOOGLE_AUTH_IOS}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#1D3160] transition-all hover:border-[#FF7300]/40 hover:shadow-md"
          >
            {t('accountPage.secStoreApple')}
            <ExternalLink className="h-3.5 w-3.5 text-gray-400" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}

export function SicurezzaContent() {
  const { t } = useTranslation();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();

  const enableMFAMutation = useEnableMFA();
  const verifyMFAMutation = useVerifyMFASetup();
  const disableMFAMutation = useDisableMFA();

  const [setupData, setSetupData] = useState<{ qr_code_url: string; secret: string } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [disableError, setDisableError] = useState<string | null>(null);

  const {
    register: registerEnable,
    handleSubmit: handleSubmitEnable,
    formState: { errors: enableErrors },
    reset: resetEnable,
  } = useForm<EnableMFAFormValues>({
    resolver: zodResolver(enableMFASchema),
    defaultValues: { password: '', current_mfa_code: '' },
  });

  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: verifyErrors },
    setValue: setVerifyValue,
    watch: watchVerifyCode,
    reset: resetVerify,
  } = useForm<MFACodeFormValues>({
    resolver: zodResolver(mfaCodeSchema),
    defaultValues: { mfa_code: '' },
  });

  const {
    register: registerDisable,
    handleSubmit: handleSubmitDisable,
    formState: { errors: disableErrors },
    reset: resetDisable,
  } = useForm<DisableMFAFormValues>({
    resolver: zodResolver(disableMFASchema),
    defaultValues: { password: '', current_mfa_code: '' },
  });

  const isMFAEnabled = user?.mfa_enabled ?? false;
  const verifyMfaCode = watchVerifyCode('mfa_code');
  const verifyDigits = useMemo(() => {
    const raw = (verifyMfaCode ?? '').toString();
    const only = raw.replace(/\D/g, '').slice(0, 6);
    return only.padEnd(6, ' ').split('').slice(0, 6);
  }, [verifyMfaCode]);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const onSubmitEnable = async (formData: EnableMFAFormValues) => {
    setSetupError(null);
    setSetupData(null);
    resetVerify();

    if (isMFAEnabled && !formData.current_mfa_code) {
      setSetupError(t('accountPage.sec2faVerifyError'));
      return;
    }

    try {
      const data = await enableMFAMutation.mutateAsync({
        password: formData.password,
        ...(isMFAEnabled
          ? { current_mfa_code: formData.current_mfa_code }
          : {}),
      });
      resetEnable();
      setSetupData(data);
    } catch (err: unknown) {
      resetEnable();
      const message =
        (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail ||
        (err as Error)?.message ||
        t('accountPage.sec2faEnableError');
      setSetupError(message);
    }
  };

  const onSubmitVerify = async (formData: MFACodeFormValues) => {
    setVerifyError(null);
    try {
      await verifyMFAMutation.mutateAsync({ mfa_code: formData.mfa_code });
      setSetupData(null);
      resetVerify();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail ||
        (err as Error)?.message ||
        t('accountPage.sec2faVerifyError');
      setVerifyError(message);
    }
  };

  const onSubmitDisable = async (formData: DisableMFAFormValues) => {
    setDisableError(null);
    try {
      await disableMFAMutation.mutateAsync({
        password: formData.password,
        current_mfa_code: formData.current_mfa_code,
      });
      resetDisable();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail ||
        (err as Error)?.message ||
        t('accountPage.sec2faDisableError');
      setDisableError(message);
    }
  };

  const copySecret = useCallback(() => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  }, [setupData?.secret]);

  const cancelSetup = () => {
    setSetupData(null);
    setSetupError(null);
    setVerifyError(null);
    resetVerify();
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[#FF7300]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#FF7300]/20 bg-[#FF7300]/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#FF7300]">
          <Sparkles className="h-3 w-3" aria-hidden />
          {t('accountPage.sec2faBadge')}
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-[#1D3160] sm:text-3xl">
          {t('sidebar.security')}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">{t('accountPage.sec2faIntro')}</p>
      </div>

      <StatusCard isEnabled={isMFAEnabled} />

      {!isMFAEnabled || setupData !== null ? (
        <>
          {!setupData && (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#1D3160]">
                  {t('accountPage.sec2faHowTitle')}
                </h2>
                <ol className="space-y-3">
                  {STEP_KEYS.map((key, index) => (
                    <li key={key} className="flex gap-3 text-sm text-gray-700">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1D3160]/8 text-xs font-bold text-[#1D3160]">
                        {index + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{t(key)}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <GoogleAuthenticatorCard />

              {setupError && <ErrorMessage message={setupError} />}

              <form onSubmit={handleSubmitEnable(onSubmitEnable)} className="space-y-4">
                <div>
                  <label
                    htmlFor="enable-mfa-password"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500"
                  >
                    {t('account.securityPassword')}
                  </label>
                  <Input
                    id="enable-mfa-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder={t('account.securityPasswordPlaceholder')}
                    disabled={enableMFAMutation.isPending}
                    {...registerEnable('password')}
                  />
                  {enableErrors.password && (
                    <p className="mt-2 text-xs text-red-500">{enableErrors.password.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={enableMFAMutation.isPending}
                  className="h-12 w-full rounded-full bg-gradient-to-r from-[#FF7300] to-[#FF8800] text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#FF7300]/20 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enableMFAMutation.isPending ? t('accountPage.sec2faLoading') : t('accountPage.secActivateMfa')}
                </Button>
              </form>
            </div>
          )}

          {setupData && (
            <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
              <button
                type="button"
                onClick={cancelSetup}
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#FF7300]"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('account.securityBack')}
              </button>

              <h2 className="mb-6 text-lg font-bold text-[#1D3160]">{t('account.securityConfigure')}</h2>

              <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start">
                <div className="mx-auto rounded-2xl border border-gray-100 bg-gray-50/80 p-4 md:mx-0">
                  <p className="mb-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                    {t('accountPage.secScanQr')}
                  </p>
                  <div className="flex h-44 w-44 items-center justify-center rounded-xl border border-gray-200 bg-white p-2 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element -- data URL QR code */}
                    <img
                      src={setupData.qr_code_url}
                      alt="QR Code MFA"
                      className="h-40 w-40 object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                      {t('account.securityManualEntry')}
                    </p>
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 p-3">
                      <code className="flex-1 break-all font-mono text-sm text-[#1D3160]">{setupData.secret}</code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={copySecret}
                        className="h-9 w-9 shrink-0 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                      >
                        {copiedSecret ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-600" />
                        )}
                      </Button>
                    </div>
                    {copiedSecret && (
                      <p className="mt-1.5 text-xs text-green-600">{t('account.securityCopied')}</p>
                    )}
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                      {t('accountPage.secEnterCode')}
                    </p>

                    {verifyError && <div className="mb-3"><ErrorMessage message={verifyError} /></div>}

                    <form onSubmit={handleSubmitVerify(onSubmitVerify)} className="space-y-4">
                      <input type="hidden" {...registerVerify('mfa_code')} />

                      <div className="flex items-center justify-between gap-2 sm:gap-3">
                        {verifyDigits.map((digit, idx) => {
                          const filled = digit.trim().length > 0;
                          return (
                            <input
                              key={idx}
                              ref={(el) => {
                                otpRefs.current[idx] = el;
                              }}
                              value={filled ? digit : ''}
                              inputMode="numeric"
                              aria-label={`MFA digit ${idx + 1}`}
                              disabled={verifyMFAMutation.isPending}
                              className="h-11 w-11 rounded-xl border border-gray-200 bg-gray-50 text-center text-xl font-semibold text-[#1D3160] transition focus:border-[#FF7300]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7300]/30 sm:h-12 sm:w-12"
                              onChange={(e) => {
                                const nextDigit = e.target.value.replace(/\D/g, '').slice(-1);
                                if (!nextDigit) {
                                  const arr = verifyDigits.map((d, i) => (i === idx ? ' ' : d));
                                  const next = arr.map((d) => d.trim()).join('');
                                  setVerifyValue('mfa_code', next.slice(0, 6));
                                  return;
                                }

                                const arr = verifyDigits.map((d, i) => {
                                  if (i === idx) return nextDigit;
                                  return d.trim() ? d.trim() : ' ';
                                });
                                const next = arr.map((d) => d.trim()).join('');
                                setVerifyValue('mfa_code', next.slice(0, 6), { shouldValidate: true });
                                if (idx < 5) otpRefs.current[idx + 1]?.focus();
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace') {
                                  const current = verifyDigits[idx]?.trim();
                                  if (!current && idx > 0) otpRefs.current[idx - 1]?.focus();
                                }
                              }}
                              onPaste={(e) => {
                                const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                                if (!pasted) return;
                                setVerifyValue('mfa_code', pasted, { shouldValidate: true });
                                const lastIdx = Math.min(5, pasted.length - 1);
                                otpRefs.current[lastIdx]?.focus();
                                e.preventDefault();
                              }}
                            />
                          );
                        })}
                      </div>

                      {verifyErrors.mfa_code && (
                        <p className="text-xs text-red-500">{verifyErrors.mfa_code.message}</p>
                      )}

                      <Button
                        type="submit"
                        disabled={verifyMFAMutation.isPending}
                        className="h-12 w-full rounded-full bg-gradient-to-r from-[#FF7300] to-[#FF8800] text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#FF7300]/20 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {verifyMFAMutation.isPending ? t('accountPage.sec2faVerifying') : t('accountPage.secConfirm')}
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-[#1D3160]">{t('account.securityConfigure')}</h2>
            {setupError && <div className="mt-4"><ErrorMessage message={setupError} /></div>}
            <form onSubmit={handleSubmitEnable(onSubmitEnable)} className="mt-6 space-y-4">
              <div>
                <label htmlFor="replace-mfa-password" className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  {t('account.securityPassword')}
                </label>
                <Input
                  id="replace-mfa-password"
                  type="password"
                  autoComplete="current-password"
                  disabled={enableMFAMutation.isPending}
                  {...registerEnable('password')}
                />
                {enableErrors.password && <p className="mt-2 text-xs text-red-500">{enableErrors.password.message}</p>}
              </div>
              <div>
                <label htmlFor="replace-mfa-code" className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  {t('accountPage.secEnterCode')}
                </label>
                <Input
                  id="replace-mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  disabled={enableMFAMutation.isPending}
                  {...registerEnable('current_mfa_code')}
                />
                {enableErrors.current_mfa_code && <p className="mt-2 text-xs text-red-500">{enableErrors.current_mfa_code.message}</p>}
              </div>
              <Button type="submit" disabled={enableMFAMutation.isPending} className="h-12 w-full rounded-full bg-[#1D3160] text-sm font-bold uppercase tracking-wide text-white">
                {enableMFAMutation.isPending ? t('accountPage.sec2faLoading') : t('account.securityConfigure')}
              </Button>
            </form>
          </section>

          <section className="overflow-hidden rounded-2xl border border-red-100/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-[#1D3160]">{t('account.securityDisableTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{t('account.securityDisableDesc')}</p>

          {disableError && (
            <div className="mt-4">
              <ErrorMessage message={disableError} />
            </div>
          )}

          <form onSubmit={handleSubmitDisable(onSubmitDisable)} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="disable-mfa-password"
                className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500"
              >
                {t('account.securityPassword')}
              </label>
              <Input
                id="disable-mfa-password"
                type="password"
                autoComplete="current-password"
                placeholder={t('account.securityPasswordPlaceholder')}
                className="h-12 rounded-xl border-gray-200 bg-gray-50/80 focus-visible:ring-[#FF7300]/30"
                disabled={disableMFAMutation.isPending}
                {...registerDisable('password')}
              />
              {disableErrors.password && (
                <p className="mt-2 text-xs text-red-500">{disableErrors.password.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="disable-mfa-code"
                className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500"
              >
                {t('accountPage.secEnterCode')}
              </label>
              <Input
                id="disable-mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                disabled={disableMFAMutation.isPending}
                {...registerDisable('current_mfa_code')}
              />
              {disableErrors.current_mfa_code && (
                <p className="mt-2 text-xs text-red-500">{disableErrors.current_mfa_code.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={disableMFAMutation.isPending}
              className="h-12 w-full rounded-full border border-red-200 bg-white text-sm font-bold uppercase tracking-wide text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {disableMFAMutation.isPending ? t('accountPage.sec2faDisabling') : t('accountPage.secDisableMfa')}
            </Button>
          </form>
          </section>
        </div>
      )}
    </div>
  );
}
