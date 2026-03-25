'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { FloatingLabelField } from '@/components/ui/floating-label-field';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { translateZodMessage } from '@/lib/i18n/translateZodMessage';
import type { MessageKey } from '@/lib/i18n/messages/en';

const FLAG_BASE = 'https://flagcdn.com';

const accountSchema = z
  .object({
    username: z.string().min(1, 'registerForm.usernameRequired'),
    password: z.string().min(8, 'registerForm.passwordMin'),
    confermaPassword: z.string().min(1, 'registerForm.confirmRequired'),
    lingua: z.enum(['it', 'ja', 'en', 'es', 'de', 'fr']),
  })
  .refine((data) => data.password === data.confermaPassword, {
    message: 'registerForm.passwordMismatch',
    path: ['confermaPassword'],
  });

type AccountValues = z.infer<typeof accountSchema>;

const LINGUE: { id: AccountValues['lingua']; labelKey: MessageKey; countryCode: string }[] = [
  { id: 'it', labelKey: 'registerForm.langIt', countryCode: 'it' },
  { id: 'ja', labelKey: 'registerForm.langJa', countryCode: 'jp' },
  { id: 'en', labelKey: 'registerForm.langEn', countryCode: 'gb' },
  { id: 'es', labelKey: 'registerForm.langEs', countryCode: 'es' },
  { id: 'de', labelKey: 'registerForm.langDe', countryCode: 'de' },
  { id: 'fr', labelKey: 'registerForm.langFr', countryCode: 'fr' },
];

export function AccountForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const setUser = useAuthStore((s) => s.setUser);
  const setFlashMessage = useAuthStore((s) => s.setFlashMessage);
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      username: '',
      password: '',
      confermaPassword: '',
      lingua: 'it',
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfermaPassword, setShowConfermaPassword] = useState(false);

  const pwdToggle = showPassword ? t('registerForm.hidePassword') : t('registerForm.showPassword');
  const pwd2Toggle = showConfermaPassword ? t('registerForm.hidePassword') : t('registerForm.showPassword');

  function onSubmit(data: AccountValues) {
    setUser({
      id: `reg-${Date.now()}`,
      email: `${data.username}@ebartex.local`,
      name: data.username,
      image: null,
    });
    setFlashMessage(t('registerForm.flashSuccess'));
    router.push('/');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <div className="relative">
          <FloatingLabelField
            label={t('registerForm.usernameLabel')}
            id="username"
            type="text"
            value={watch('username')}
            floatingLabelBg="#e5e7eb"
            inputClassName="h-14 pt-7 text-base"
            {...register('username')}
          />
        </div>
        {errors.username && (
          <p className="mt-1 text-sm text-red-500">
            {translateZodMessage(errors.username.message, t)}
          </p>
        )}
      </div>

      <div>
        <div className="relative">
          <FloatingLabelField
            label={t('registerForm.passwordLabel')}
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={watch('password')}
            floatingLabelBg="#e5e7eb"
            inputClassName="h-14 pt-7 text-base pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800"
            title={pwdToggle}
            aria-label={pwdToggle}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">
            {translateZodMessage(errors.password.message, t)}
          </p>
        )}
      </div>

      <div>
        <div className="relative">
          <FloatingLabelField
            label={t('registerForm.confirmPasswordLabel')}
            id="confermaPassword"
            type={showConfermaPassword ? 'text' : 'password'}
            value={watch('confermaPassword')}
            floatingLabelBg="#e5e7eb"
            inputClassName="h-14 pt-7 text-base pr-10"
            {...register('confermaPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfermaPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800"
            title={pwd2Toggle}
            aria-label={pwd2Toggle}
          >
            {showConfermaPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.confermaPassword && (
          <p className="mt-1 text-sm text-red-500">
            {translateZodMessage(errors.confermaPassword.message, t)}
          </p>
        )}
      </div>

      <div>
        <p className="mb-3 text-sm text-white">{t('registerForm.preferredLanguage')}</p>
        <Controller
          name="lingua"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {LINGUE.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => field.onChange(lang.id)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl px-4 py-3 text-xs font-semibold uppercase transition-colors shadow-sm',
                    field.value === lang.id
                      ? 'border-4 border-[#FF7300] bg-white text-gray-900'
                      : 'border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <span className="relative mb-1.5 block h-6 w-9 overflow-hidden rounded-sm shadow-sm">
                    <Image
                      src={`${FLAG_BASE}/w80/${lang.countryCode}.png`}
                      alt=""
                      width={36}
                      height={24}
                      className="object-cover"
                    />
                  </span>
                  <span>{t(lang.labelKey)}</span>
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <p className="text-sm text-gray-200">{t('registerForm.termsLine')}</p>

      <div className="pt-2">
        <Button
          type="submit"
          className="h-14 w-full rounded-xl text-xl font-semibold uppercase tracking-wide text-white hover:opacity-90"
          style={{ backgroundColor: '#FF7300' }}
        >
          {t('registerForm.createAccount')}
        </Button>
      </div>
    </form>
  );
}
