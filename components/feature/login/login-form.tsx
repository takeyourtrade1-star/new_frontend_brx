'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { AuthErrorAlert } from '@/components/ui/AuthErrorAlert';
import { useLogin } from '@/lib/hooks/use-auth';
import { useAuthError } from '@/lib/errors/useAuthError';
import { loginSchema, type LoginValues } from '@/lib/validations/auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { translateZodMessage } from '@/lib/i18n/translateZodMessage';

const appleInputClass =
  'h-[52px] w-full rounded-2xl border border-black/10 bg-black/5 px-4 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all disabled:opacity-50';

export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const loginMutation = useLogin();
  const authError = useAuthError();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  async function onSubmit(data: LoginValues) {
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
    } catch (err: any) {
      authError.setError(err);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input
          type="text"
          autoComplete="username"
          placeholder={t('auth.usernameOrEmail')}
          className={appleInputClass}
          {...register('identifier')}
        />
        {errors.identifier && (
          <p className="mt-1.5 pl-1 text-[12px] text-red-500">{translateZodMessage(errors.identifier.message, t)}</p>
        )}
      </div>

      <div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder={t('auth.password')}
            className={`${appleInputClass} pr-11`}
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
          <p className="mt-1.5 pl-1 text-[12px] text-red-500">{translateZodMessage(errors.password.message, t)}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Link
          href="/recupera-credenziali"
          className="text-[13px] font-medium text-[#0066cc] hover:underline"
        >
          {t('auth.recoverCredentials')}
        </Link>
      </div>

      <AuthErrorAlert error={authError} />

      <div className="pt-2">
        <button
          type="submit"
          disabled={loginMutation.isPending || authError.isRateLimitError}
          className="w-full rounded-full bg-[#1d1d1f] py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loginMutation.isPending ? t('loginForm.submitting') : t('auth.login')}
        </button>
      </div>

      <p className="pt-1 text-center text-[13px] text-[#515154]">
        <Link
          href="/login?accesso=1&otp=1"
          className="font-medium text-[#0066cc] hover:underline"
        >
          Accedi con codice monouso
        </Link>
      </p>
    </form>
  );
}
