'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Eye, EyeOff, Key, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { HeaderLoginValues } from '@/lib/validations/auth';
import { translateZodMessage } from '@/lib/i18n/translateZodMessage';
import type { MessageKey } from '@/lib/i18n/messages/en';

type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

const inputUnderline =
  'h-9 border-0 border-b border-gray-300 bg-transparent pl-8 pr-1 text-sm text-[#0F172A] shadow-none rounded-none ring-0 focus-visible:ring-0 focus-visible:border-[#1D3160] focus-visible:outline-none';

/** Piano 1.6 — form di login del drawer mobile, estratto da HamburgerMenu. */
export function DrawerAuthForm({
  onSubmit,
  register,
  errors,
  submitting,
  loginError,
  onNavigate,
  t,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  register: UseFormRegister<HeaderLoginValues>;
  errors: FieldErrors<HeaderLoginValues>;
  submitting: boolean;
  loginError: string | null;
  onNavigate: () => void;
  t: T;
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
            <div className="border-b border-orange-100 bg-gray-100 px-5 py-5">
              <form onSubmit={onSubmit} className="space-y-5" noValidate>
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#1D3160]">
                      {t('auth.usernameOrEmail')}
                    </span>
                    <Link
                      href="/recupera-credenziali"
                      onClick={onNavigate}
                      className="text-[10px] font-semibold uppercase text-[#1D3160] underline-offset-2 hover:underline"
                    >
                      {t('auth.forgot')}
                    </Link>
                  </div>
                  <div className="relative">
                    <User
                      className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1D3160]"
                      aria-hidden
                    />
                    <Input
                      type="text"
                      autoComplete="email"
                      placeholder=""
                      className={cn(inputUnderline, errors.username && 'border-red-500')}
                      {...register('username')}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {translateZodMessage(errors.username.message, t)}
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#1D3160]">
                      {t('auth.password')}
                    </span>
                    <Link
                      href="/recupera-credenziali"
                      onClick={onNavigate}
                      className="text-[10px] font-semibold uppercase text-[#1D3160] underline-offset-2 hover:underline"
                    >
                      {t('auth.forgot')}
                    </Link>
                  </div>
                  <div className="relative">
                    <Key
                      className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1D3160]"
                      aria-hidden
                    />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className={cn(inputUnderline, 'pr-8', errors.password && 'border-red-500')}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-[#1D3160]"
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {translateZodMessage(errors.password.message, t)}
                    </p>
                  )}
                </div>

                {loginError && (
                  <p className="text-center text-[11px] text-red-600" role="alert">
                    {loginError}
                  </p>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-10 w-full rounded-sm border-2 border-[#1D3160] bg-white text-sm font-bold uppercase tracking-wide text-[#1D3160] shadow-none hover:bg-gray-50 disabled:opacity-50"
                  >
                    {submitting ? t('auth.loggingIn') : t('auth.login')}
                  </Button>
                  <Button
                    type="button"
                    asChild
                    className="h-10 w-full rounded-sm border border-[#878787] bg-white text-sm font-bold uppercase tracking-wide text-[#1D3160] shadow-none hover:bg-gray-50"
                  >
                    <Link
                      href="/login/code"
                      onClick={onNavigate}
                    >
                      Accedi con codice monouso
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    asChild
                    className="btn-orange-glow h-10 w-full rounded-sm border disabled:opacity-50"
                  >
                    <Link href="/login" onClick={onNavigate}>
                      {t('auth.register')}
                    </Link>
                  </Button>
                </div>
              </form>
            </div>
  );
}
