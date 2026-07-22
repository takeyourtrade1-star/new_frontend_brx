'use client';



import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import Link from 'next/link';

import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import { z } from 'zod';

import { AlertCircle } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';

import { OtpSixBoxes } from '@/components/ui/otp-six-boxes';

import {

  AuthBackLink,

  AuthSplitHeader,

  AuthSubmitButton,

  AUTH_LINK_CLASS,

  AUTH_ERROR_CLASS,

  AUTH_SPLIT_CAPTION_CLASS,

  AUTH_SPLIT_FORM_CLASS,

  AUTH_SPLIT_MUTED_CLASS,

  AUTH_SPLIT_VIEW_FOOTER_CLASS,

} from '@/components/auth/ui';

import { AuthSplitViewShell } from '@/components/layout/AuthSplitViewShell';

import { useAuthStore } from '@/lib/stores/auth-store';

import { useVerifyMFA } from '@/lib/hooks/use-auth';

import { useTranslation } from '@/lib/i18n/useTranslation';

import { readMfaPreAuthToken } from '@/lib/auth/mfa-session';

import { cn } from '@/lib/utils';



type MFAFormValues = { mfa_code: string };



export default function VerifyMFAPage() {

  const { t } = useTranslation();



  const mfaSchema = useMemo(

    () =>

      z.object({

        mfa_code: z

          .string()

          .min(6, t('mfa.codeLengthError'))

          .max(6, t('mfa.codeLengthError'))

          .regex(/^\d+$/, t('mfa.codeDigitsOnly')),

      }),

    [t]

  );



  const router = useRouter();

  const verifyMFAMutation = useVerifyMFA();



  const preAuthToken = useAuthStore((s) => s.preAuthToken);

  const storeError = useAuthStore((s) => s.error);

  const isLoading = useAuthStore((s) => s.isLoading);

  const clearError = useAuthStore((s) => s.clearError);



  const [clientReady, setClientReady] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);

  const [rememberDevice, setRememberDevice] = useState(false);



  const {

    register,

    handleSubmit,

    watch,

    formState: { errors },

    setValue,

  } = useForm<MFAFormValues>({

    resolver: zodResolver(mfaSchema),

    defaultValues: { mfa_code: '' },

  });



  useEffect(() => {

    return () => {

      clearError();

    };

  }, [clearError]);



  useEffect(() => {

    const fromSession = readMfaPreAuthToken();

    if (fromSession) {

      useAuthStore.setState({ preAuthToken: fromSession, mfaRequired: true });

    }

    setClientReady(true);

  }, []);



  useEffect(() => {

    if (storeError) setLocalError(storeError);

  }, [storeError]);



  const effectiveToken = preAuthToken || (clientReady ? readMfaPreAuthToken() : null);



  if (!clientReady) {

    return (

      <AuthSplitViewShell centerForm>

        <div className="flex items-center justify-center py-16">

          <div className="h-9 w-9 animate-spin rounded-full border-2 border-black/10 border-t-global-bg-start" />

        </div>

      </AuthSplitViewShell>

    );

  }



  if (!effectiveToken && process.env.NODE_ENV !== 'development') {

    return (

      <AuthSplitViewShell centerForm>

        <div className="space-y-3.5 text-left">

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">

            <AlertCircle className="h-6 w-6 text-red-500" />

          </div>

          <div className="space-y-1">

            <h1 className="text-[16px] font-semibold text-[#1d1d1f]">{t('mfa.invalidSession')}</h1>

            <p className={AUTH_SPLIT_MUTED_CLASS}>{t('mfa.sessionExpired')}</p>

          </div>

          <Link href="/login" className={`inline-flex items-center gap-1.5 text-[13px] ${AUTH_LINK_CLASS}`}>

            {t('mfa.backToLogin')}

          </Link>

        </div>

      </AuthSplitViewShell>

    );

  }



  async function onSubmit(data: MFAFormValues) {

    setLocalError(null);

    clearError();



    const tokenToSend = effectiveToken || preAuthToken;

    if (!tokenToSend) {

      setLocalError(t('mfa.tokenMissing'));

      return;

    }



    try {

      await verifyMFAMutation.mutateAsync({

        pre_auth_token: tokenToSend,

        mfa_code: data.mfa_code,

        remember_device: rememberDevice,

      });

      router.push('/');

    } catch {

      setLocalError(storeError ?? t('mfa.verifyFailed'));

    }

  }



  const isPending = isLoading || verifyMFAMutation.isPending;



  return (

    <AuthSplitViewShell centerForm>

      <AuthBackLink href="/login" />



      <AuthSplitHeader

        title={t('mfa.title')}

        subtitle={t('mfa.subtitle')}

        className="mb-0 shrink-0"

      />



      <form onSubmit={handleSubmit(onSubmit)} className={AUTH_SPLIT_FORM_CLASS}>

        <input type="hidden" {...register('mfa_code')} />



        <div className="space-y-2.5">

          <p className={AUTH_SPLIT_CAPTION_CLASS}>{t('mfa.codeLabel')}</p>



          <OtpSixBoxes

            value={watch('mfa_code')}

            onChange={(v) => setValue('mfa_code', v, { shouldValidate: true })}

            disabled={isPending}

            error={errors.mfa_code?.message}

            ariaLabelPrefix="MFA digit"

          />



          <div className="flex items-center gap-2.5 pt-1">

            <Checkbox

              id="remember-device"

              checked={rememberDevice}

              onCheckedChange={setRememberDevice}

              disabled={isPending}

              className="mt-0.5 flex items-center justify-center border-black/20 peer-checked:border-global-bg-start peer-checked:bg-global-bg-start [&>svg]:block"

            />

            <label

              htmlFor="remember-device"

              className="cursor-pointer select-none text-[13px] leading-snug text-[#515154]"

            >

              {t('mfa.rememberDevice')}

            </label>

          </div>

        </div>



        {localError && (

          <div className={AUTH_ERROR_CLASS}>

            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />

            <p className="text-[13px] text-red-600">{localError}</p>

          </div>

        )}



        <AuthSubmitButton variant="split" disabled={isPending} loading={isPending} loadingText={t('mfa.verifying')}>

          {t('mfa.verify')}

        </AuthSubmitButton>



        <Link

          href="/login"

          className={`inline-flex items-center gap-1.5 text-[13px] font-medium text-[#86868b] transition-colors hover:text-[#1d1d1f]`}

        >

          {t('mfa.backToLogin')}

        </Link>

      </form>



      <p className={cn(AUTH_SPLIT_VIEW_FOOTER_CLASS, 'mt-5')}>{t('mfa.helpText')}</p>

    </AuthSplitViewShell>

  );

}

