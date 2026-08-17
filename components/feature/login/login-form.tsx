'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { AuthErrorAlert } from '@/components/ui/AuthErrorAlert';
import {
  AuthField,
  AuthSubmitButton,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_LINK_CLASS,
  AUTH_REQUIRED_MARKER_CLASS,
  AUTH_SPLIT_INPUT_CLASS,
  AUTH_SPLIT_LABEL_CLASS,
  AUTH_SPLIT_ERROR_CLASS,
} from '@/components/auth/ui';
import { useLogin } from '@/lib/hooks/use-auth';
import { useAuthError } from '@/lib/errors/useAuthError';
import { loginSchema, type LoginValues } from '@/lib/validations/auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { translateZodMessage } from '@/lib/i18n/translateZodMessage';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  /** Landing demo: campi affiancati, Accedi, poi blocco registrazione. */
  variant?: 'default' | 'landing';
}

export function LoginForm({ variant = 'default' }: LoginFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const loginMutation = useLogin();
  const authError = useAuthError();
  const [showPassword, setShowPassword] = useState(false);
  const submitInFlightRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  async function onSubmit(data: LoginValues) {
    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    authError.clearError();
    try {
      const input = data.identifier.trim();
      const isEmail = input.includes('@');

      const credentials = isEmail
        ? { email: input, password: data.password }
        : { username: input, password: data.password };

      const result = await loginMutation.mutateAsync(credentials);

      if (result.mfaRequired) {
        router.replace('/login/verify-mfa');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      authError.setError(err);
    } finally {
      submitInFlightRef.current = false;
    }
  }

  const isLanding = variant === 'landing';
  const fieldInputClass = isLanding ? AUTH_SPLIT_INPUT_CLASS : AUTH_INPUT_CLASS;
  const fieldLabelClass = isLanding ? AUTH_SPLIT_LABEL_CLASS : AUTH_LABEL_CLASS;

  if (isLanding) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <h2 className="text-[18px] font-semibold text-[#1d1d1f] sm:text-[20px]">
          {t('pages.login.demoLanding.ctaLogin')}
        </h2>

        <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] lg:items-end">
          <AuthField
            label={t('auth.usernameOrEmail')}
            type="text"
            autoComplete="username"
            required
            variant="split"
            className={fieldInputClass}
            error={
              errors.identifier ? translateZodMessage(errors.identifier.message, t) : undefined
            }
            {...register('identifier')}
          />

          <div className="flex items-end gap-3.5 lg:contents">
            <div className="min-w-0 flex-1">
              <label htmlFor="password" className={fieldLabelClass}>
                {t('auth.password')}
                <span className={AUTH_REQUIRED_MARKER_CLASS} aria-hidden>
                  *
                </span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  aria-required
                  className={cn(fieldInputClass, 'pr-11')}
                  {...register('password')}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#86868b] transition-colors hover:text-[#1d1d1f]"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className={AUTH_SPLIT_ERROR_CLASS}>
                  {translateZodMessage(errors.password.message, t)}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending || authError.isRateLimitError}
              aria-label={t('auth.loginButtonAria')}
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-global text-white shadow-[0_3px_10px_rgba(61,101,198,0.28)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100'
              )}
            >
              {loginMutation.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <LogIn className="h-5 w-5" strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/login/code" className={`text-[14px] ${AUTH_LINK_CLASS}`}>
            {t('loginForm.loginWithCode')}
          </Link>
          <Link href="/recupera-credenziali" className={`text-[14px] ${AUTH_LINK_CLASS}`}>
            {t('auth.recoverCredentials')}
          </Link>
        </div>

        <AuthErrorAlert error={authError} />

        <div className="border-t border-gray-200/60 pt-4 text-center">
          <p className="text-[14px] text-[#515154]">
            {t('pages.login.noAccountPrompt')}{' '}
            <Link
              href="/registrati"
              className="font-semibold text-[#ff7a00] transition-opacity hover:opacity-80"
            >
              {t('auth.registerUpper')}
            </Link>
          </p>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AuthField
        label={t('auth.usernameOrEmail')}
        type="text"
        autoComplete="username"
        required
        error={errors.identifier ? translateZodMessage(errors.identifier.message, t) : undefined}
        {...register('identifier')}
      />

      <div>
        <label htmlFor="password" className={AUTH_LABEL_CLASS}>
          {t('auth.password')}
          <span className={AUTH_REQUIRED_MARKER_CLASS} aria-hidden>
            *
          </span>
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            aria-required
            className={cn(AUTH_INPUT_CLASS, 'pr-11')}
            {...register('password')}
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 pl-1 text-[12px] text-red-500">
            {translateZodMessage(errors.password.message, t)}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Link href="/recupera-credenziali" className={`text-[13px] ${AUTH_LINK_CLASS}`}>
          {t('auth.recoverCredentials')}
        </Link>
      </div>

      <AuthErrorAlert error={authError} />

      <div className="pt-2">
        <AuthSubmitButton
          disabled={loginMutation.isPending || authError.isRateLimitError}
          loading={loginMutation.isPending}
          loadingText={t('loginForm.submitting')}
        >
          {t('auth.login')}
        </AuthSubmitButton>
      </div>

      <p className="pt-1 text-center text-[13px] text-[#515154]">
        <Link href="/login/code" className={AUTH_LINK_CLASS}>
          {t('loginForm.loginWithCode')}
        </Link>
      </p>
    </form>
  );
}
