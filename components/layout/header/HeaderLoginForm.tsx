'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { HeaderLoginValues } from '@/lib/validations/auth';
import { translateZodMessage } from '@/lib/i18n/translateZodMessage';
import type { MessageKey } from '@/lib/i18n/messages/en';

type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

const AUTH_INPUT_HEIGHT = 'h-9';
const AUTH_INPUT_WIDTH = 'w-36';
const inputBase =
  'rounded-full px-4 text-sm font-normal font-sans text-[#0F172A] placeholder:text-gray-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 border';

/** Piano 1.6 — form di login inline (desktop) dell'header, estratto da TopBar. */
export function HeaderLoginForm({
  onSubmit,
  register,
  errors,
  submitting,
  t,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  register: UseFormRegister<HeaderLoginValues>;
  errors: FieldErrors<HeaderLoginValues>;
  submitting: boolean;
  t: T;
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
            <form
              onSubmit={onSubmit}
              className="hidden items-center gap-3 md:flex relative"
              noValidate
            >
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t('auth.usernamePlaceholder')}
                  aria-label={t('auth.usernamePlaceholder')}
                  autoComplete="email"
                  className={cn(
                    inputBase,
                    AUTH_INPUT_HEIGHT,
                    AUTH_INPUT_WIDTH,
                    'border',
                    errors.username && 'border-red-500'
                  )}
                  style={{
                    backgroundColor: '#d9d9d9',
                    borderColor: errors.username ? undefined : '#FF7300',
                  }}
                  {...register('username')}
                />
                {errors.username && (
                  <span className="absolute left-0 top-full mt-0.5 whitespace-nowrap text-[10px] text-red-400">
                    {translateZodMessage(errors.username.message, t)}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder')}
                  aria-label={t('auth.passwordPlaceholder')}
                  autoComplete="current-password"
                  className={cn(
                    inputBase,
                    AUTH_INPUT_HEIGHT,
                    AUTH_INPUT_WIDTH,
                    'pl-4 pr-10 border',
                    errors.password && 'border-red-500'
                  )}
                  style={{
                    backgroundColor: '#d9d9d9',
                    borderColor: errors.password ? undefined : '#FF7300',
                  }}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-600 hover:bg-gray-300/50"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="btn-orange-glow flex shrink-0 items-center justify-center rounded-full border px-4 !text-[#2d1810] h-[2.25rem] min-w-[2.25rem] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('auth.loginButtonAria')}
              >
                {submitting ? (
                  <span className="text-xs">...</span>
                ) : (
                  <LogIn
                    className="shrink-0"
                    style={{ width: '1.25rem', height: '1.25rem', color: 'white' }}
                    strokeWidth={2}
                  />
                )}
              </Button>
              <Link
                href="/recupera-credenziali"
                className="whitespace-nowrap text-xs text-gray-400 hover:text-white leading-none"
              >
                {t('auth.recoverCredentials')}
              </Link>
            </form>
  );
}
