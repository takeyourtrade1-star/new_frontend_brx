'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { usePasswordResetStore } from '@/lib/stores/password-reset-store';
import { useCountdown } from '@/lib/hooks/use-countdown';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { translateZodMessage } from '@/lib/i18n/translateZodMessage';
import { OtpSixBoxes } from '@/components/ui/otp-six-boxes';
import {
  passwordResetRequestSchema,
  passwordResetVerifyOtp1Schema,
  passwordResetNewPasswordSchema,
  passwordResetVerifyOtp2Schema,
} from '@/lib/validations/auth';

const appleInputClass =
  'h-[52px] w-full rounded-2xl border border-black/10 bg-black/5 px-4 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all';

const appleButtonClass =
  'w-full rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

export function RecuperaCredenzialiForm() {
  const { t } = useTranslation();
  const router = useRouter();

  const step = usePasswordResetStore((s) => s.step);
  const email = usePasswordResetStore((s) => s.email);
  const isLoading = usePasswordResetStore((s) => s.isLoading);
  const error = usePasswordResetStore((s) => s.error);
  const expiresAt = usePasswordResetStore((s) => s.expiresAt);
  const requestOTP1 = usePasswordResetStore((s) => s.requestOTP1);
  const verifyOTP1 = usePasswordResetStore((s) => s.verifyOTP1);
  const confirmInit = usePasswordResetStore((s) => s.confirmInit);
  const confirmFinal = usePasswordResetStore((s) => s.confirmFinal);
  const resetFlow = usePasswordResetStore((s) => s.resetFlow);
  const clearError = usePasswordResetStore((s) => s.clearError);

  const { formatted: countdownFormatted, isExpired } = useCountdown(expiresAt);

  // Redirect automatico dopo successo
  useEffect(() => {
    if (step === 'completed') {
      const timer = setTimeout(() => {
        resetFlow();
        router.push('/login?accesso=1');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, resetFlow, router]);

  // Pulisci errore locale quando cambia step
  useEffect(() => {
    if (step !== 'error') clearError();
  }, [step, clearError]);

  // ── Step 1: Email ──
  const emailForm = useForm<{ email: string }>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: '' },
  });

  // ── Step 2: OTP1 ──
  const otp1Form = useForm<{ code: string }>({
    resolver: zodResolver(passwordResetVerifyOtp1Schema),
    defaultValues: { code: '' },
  });

  // ── Step 3: New Password ──
  const passwordForm = useForm<{
    new_password: string;
    confirm_password: string;
  }>({
    resolver: zodResolver(passwordResetNewPasswordSchema),
    defaultValues: { new_password: '', confirm_password: '' },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Step 4: OTP2 ──
  const otp2Form = useForm<{ code: string }>({
    resolver: zodResolver(passwordResetVerifyOtp2Schema),
    defaultValues: { code: '' },
  });

  // Handlers
  async function onSubmitEmail(data: { email: string }) {
    await requestOTP1(data.email);
  }

  async function onSubmitOtp1(data: { code: string }) {
    await verifyOTP1(data.code);
  }

  async function onSubmitPassword(data: { new_password: string; confirm_password: string }) {
    await confirmInit(data.new_password);
  }

  async function onSubmitOtp2(data: { code: string }) {
    await confirmFinal(data.code);
  }

  // ── Error display helper ──
  function ErrorBlock({ messageKey }: { messageKey: string }) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-100 p-3.5 flex items-center gap-2.5">
        <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
        <p className="text-[13px] text-red-600">{t(messageKey as any)}</p>
      </div>
    );
  }

  // ── Completed ──
  if (step === 'completed') {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1d1d1f]/5">
          <CheckCircle className="h-8 w-8 text-[#1d1d1f]" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <p className="text-[17px] font-semibold text-[#1d1d1f]">{t('passwordReset.successTitle')}</p>
          <p className="text-[14px] text-[#86868b]">{t('passwordReset.successMessage')}</p>
        </div>
        <button
          onClick={() => {
            resetFlow();
            router.push('/login?accesso=1');
          }}
          className="mt-2 rounded-full bg-[#1d1d1f] px-8 py-3 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {t('passwordReset.backLogin')}
        </button>
      </div>
    );
  }

  // ── Error ──
  if (step === 'error') {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <p className="text-[17px] font-semibold text-[#1d1d1f]">{t('errors.titles.generic')}</p>
          <p className="text-[14px] text-[#86868b]">
            {error ? t(error.message as any) : t('passwordReset.errorGeneric')}
          </p>
        </div>
        <button
          onClick={resetFlow}
          className="mt-2 rounded-full bg-[#1d1d1f] px-8 py-3 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {t('passwordReset.restartFlow')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1 — Email */}
      {step === 'idle' && (
        <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
          <div>
            <input
              type="email"
              autoComplete="email"
              placeholder={t('loginForm.email')}
              className={appleInputClass}
              {...emailForm.register('email')}
            />
            {emailForm.formState.errors.email && (
              <p className="mt-1.5 pl-1 text-[12px] text-red-500">
                {translateZodMessage(emailForm.formState.errors.email.message, t)}
              </p>
            )}
          </div>
          <p className="text-[13px] leading-relaxed text-[#86868b]">{t('passwordReset.step1Subtitle')}</p>
          <div className="pt-2">
            <button type="submit" disabled={isLoading} className={appleButtonClass}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t('common.loading.shufflingCards')}
                </span>
              ) : (
                t('passwordReset.step1Submit')
              )}
            </button>
          </div>
        </form>
      )}

      {/* Step 2 — OTP1 */}
      {step === 'otp1_requested' && (
        <form onSubmit={otp1Form.handleSubmit(onSubmitOtp1)} className="space-y-4">
          <div>
            <input
              type="text"
              autoComplete="off"
              maxLength={8}
              placeholder={t('passwordReset.step2Placeholder')}
              className={appleInputClass}
              {...otp1Form.register('code')}
              onChange={(e) => {
                const v = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
                otp1Form.setValue('code', v, { shouldValidate: true });
              }}
            />
            {otp1Form.formState.errors.code && (
              <p className="mt-1.5 pl-1 text-[12px] text-red-500">
                {translateZodMessage(otp1Form.formState.errors.code.message, t)}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-[13px] text-[#86868b]">
            <span>{t('passwordReset.step2Subtitle')}</span>
            {expiresAt && (
              <span className={isExpired ? 'text-red-500 font-medium' : 'tabular-nums'}>
                {isExpired
                  ? t('passwordReset.countdownExpired')
                  : t('passwordReset.countdownLabel', { time: countdownFormatted })}
              </span>
            )}
          </div>

          {isExpired && (
            <button type="button" onClick={resetFlow} className={appleButtonClass}>
              {t('passwordReset.restartFlow')}
            </button>
          )}

          {!isExpired && (
            <div className="pt-2">
              <button type="submit" disabled={isLoading} className={appleButtonClass}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t('common.loading.shufflingCards')}
                  </span>
                ) : (
                  t('passwordReset.step2Submit')
                )}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Step 3 — New Password */}
      {step === 'otp1_verified' && (
        <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('passwordReset.newPasswordLabel')}
                className={appleInputClass + ' pr-12'}
                {...passwordForm.register('new_password')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f]"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {passwordForm.formState.errors.new_password && (
              <p className="mt-1 pl-1 text-[12px] text-red-500">
                {translateZodMessage(passwordForm.formState.errors.new_password.message, t)}
              </p>
            )}

            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('passwordReset.confirmPasswordLabel')}
                className={appleInputClass + ' pr-12'}
                {...passwordForm.register('confirm_password')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f]"
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {passwordForm.formState.errors.confirm_password && (
              <p className="mt-1 pl-1 text-[12px] text-red-500">
                {translateZodMessage(passwordForm.formState.errors.confirm_password.message, t)}
              </p>
            )}
          </div>

          <p className="text-[13px] leading-relaxed text-[#86868b]">{t('passwordReset.passwordHint')}</p>

          <div className="flex items-center justify-between text-[13px] text-[#86868b]">
            {expiresAt && (
              <span className={isExpired ? 'text-red-500 font-medium' : 'tabular-nums'}>
                {isExpired
                  ? t('passwordReset.countdownExpired')
                  : t('passwordReset.countdownLabel', { time: countdownFormatted })}
              </span>
            )}
          </div>

          {isExpired ? (
            <button type="button" onClick={resetFlow} className={appleButtonClass}>
              {t('passwordReset.restartFlow')}
            </button>
          ) : (
            <div className="pt-2">
              <button type="submit" disabled={isLoading} className={appleButtonClass}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t('common.loading.shufflingCards')}
                  </span>
                ) : (
                  t('passwordReset.step3Submit')
                )}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Step 4 — OTP2 */}
      {step === 'otp2_requested' && (
        <form onSubmit={otp2Form.handleSubmit(onSubmitOtp2)} className="space-y-4">
          <OtpSixBoxes
            value={otp2Form.watch('code')}
            onChange={(v) => otp2Form.setValue('code', v, { shouldValidate: true })}
            disabled={isLoading || isExpired}
            error={otp2Form.formState.errors.code?.message ? translateZodMessage(otp2Form.formState.errors.code.message, t) : undefined}
            ariaLabelPrefix={t('mfa.digitAria').replace('{n}', '').trim()}
          />

          <div className="flex items-center justify-between text-[13px] text-[#86868b]">
            <span>{t('passwordReset.step4Subtitle')}</span>
            {expiresAt && (
              <span className={isExpired ? 'text-red-500 font-medium' : 'tabular-nums'}>
                {isExpired
                  ? t('passwordReset.countdownExpired')
                  : t('passwordReset.countdownLabel', { time: countdownFormatted })}
              </span>
            )}
          </div>

          {isExpired ? (
            <button type="button" onClick={resetFlow} className={appleButtonClass}>
              {t('passwordReset.restartFlow')}
            </button>
          ) : (
            <div className="pt-2">
              <button type="submit" disabled={isLoading} className={appleButtonClass}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t('common.loading.shufflingCards')}
                  </span>
                ) : (
                  t('passwordReset.step4Submit')
                )}
              </button>
            </div>
          )}
        </form>
      )}

    </div>
  );
}
