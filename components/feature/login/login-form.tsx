'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingLabelField } from '@/components/ui/floating-label-field';
import { useLogin } from '@/lib/hooks/use-auth';
import { loginSchema, type LoginValues } from '@/lib/validations/auth';

/** Input: bordo grigio, focus arancione Ebartex */
const loginInputClass =
  'h-16 w-full rounded-xl border border-gray-300 bg-white pt-7 pb-2 px-3 text-lg text-[#0F172A] focus-visible:outline-none focus-visible:border-[#FF7300] focus-visible:ring-1 focus-visible:ring-[#FF7300] focus-visible:ring-offset-0 transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export function LoginForm() {
  const router = useRouter();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      const result = await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });

      // Se MFA è richiesto, reindirizza alla pagina di verifica MFA
      if (result.mfaRequired) {
        router.push('/login/verify-mfa');
      } else {
        // Login completato con successo
        router.push('/');
      }
    } catch (err: any) {
      // L'errore viene gestito dallo store, ma possiamo mostrarlo anche qui
      setError(
        err?.response?.data?.detail?.[0]?.msg ||
          err?.response?.data?.message ||
          err?.message ||
          'Errore durante il login'
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      <div>
        <FloatingLabelField
          label="Email"
          id="email"
          value={watch('email')}
          type="email"
          autoComplete="email"
          inputClassName={loginInputClass}
          floatingLabelBg="white"
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      <div>
        <div className="relative">
          <FloatingLabelField
            label="Password"
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
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100"
            aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <div className="pt-3">
        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="h-14 w-full rounded-xl text-xl font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#FF7300' }}
        >
          {loginMutation.isPending ? 'Accesso in corso...' : 'Login'}
        </Button>
      </div>
      <p className="text-center text-base">
        <Link
          href="/recupera-credenziali"
          className="text-[#FF7300] hover:underline"
        >
          Recupera credenziali
        </Link>
      </p>
    </form>
  );
}
