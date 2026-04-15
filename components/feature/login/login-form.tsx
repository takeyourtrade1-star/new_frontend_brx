'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingLabelField } from '@/components/ui/floating-label-field';
import { AuthErrorAlert } from '@/components/ui/AuthErrorAlert';
import { useLogin } from '@/lib/hooks/use-auth';
import { useAuthError } from '@/lib/errors/useAuthError';
import { loginSchema, type LoginValues } from '@/lib/validations/auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { translateZodMessage } from '@/lib/i18n/translateZodMessage';

/** Input: bordo grigio, focus arancione Ebartex */
const loginInputClass =
  'h-16 w-full rounded-xl border border-gray-300 bg-white pt-7 pb-2 px-3 text-lg text-[#0F172A] focus-visible:outline-none focus-visible:border-[#FF7300] focus-visible:ring-1 focus-visible:ring-[#FF7300] focus-visible:ring-offset-0 transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const loginMutation = useLogin();
  const authError = useAuthError();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginValues) {
    authError.clearError();
    try {
      const result = await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });

      // Se MFA è richiesto, vai subito al form codice Authenticator (replace: non tornare al login con «Indietro»)
      if (result.mfaRequired) {
        router.replace('/login/verify-mfa');
      } else {
        // Login completato con successo
        router.push('/');
      }
    } catch (err: any) {
      // Usa il nuovo sistema di gestione errori con i18n
      authError.setError(err);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      <div>
        <FloatingLabelField
          label={t('loginForm.email')}
          id="email"
          value={watch('email')}
          type="email"
          autoComplete="email"
          inputClassName={loginInputClass}
          floatingLabelBg="white"
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{translateZodMessage(errors.email.message, t)}</p>
        )}
      </div>
      <div>
        <div className="relative">
          <FloatingLabelField
            label={t('auth.password')}
            id="password"
            value={watch('password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            inputClassName={loginInputClass}
            floatingLabelBg="white"
            {...register('password')}
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100"
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{translateZodMessage(errors.password.message, t)}</p>
        )}
      </div>
      
      {/* Error Alert - Elegant UI with i18n support */}
      <AuthErrorAlert error={authError} />
      
      <div className="pt-3">
        <Button
          type="submit"
          disabled={loginMutation.isPending || authError.isRateLimitError}
          className="h-14 w-full rounded-xl text-xl font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#FF7300' }}
        >
          {loginMutation.isPending ? t('loginForm.submitting') : t('auth.login')}
        </Button>
      </div>
      <p className="text-center text-sm">
        <Link
          href="/recupera-credenziali"
          className="text-[#FF7300] hover:underline"
        >
          {t('auth.recoverCredentials')}
        </Link>
      </p>
    </form>
  );
}
