'use client';



import Link from 'next/link';

import { RegistratiPrivatoForm } from '@/components/feature/registrati/RegistratiPrivatoForm';

import {

  AuthSplitHeader,

  AUTH_LINK_CLASS,

  AUTH_SPLIT_VIEW_FOOTER_CLASS,

} from '@/components/auth/ui';

import { AuthSplitViewShell } from '@/components/layout/AuthSplitViewShell';

import { cn } from '@/lib/utils';

import { useTranslation } from '@/lib/i18n/useTranslation';



export function RegistratiPrivatoView() {

  const { t } = useTranslation();



  return (

    <AuthSplitViewShell>

      <AuthSplitHeader

        title={t('registrati.privato.title')}

        className="mb-0 shrink-0"

      />



      <RegistratiPrivatoForm />



      <div className={cn(AUTH_SPLIT_VIEW_FOOTER_CLASS, 'mt-5 flex flex-wrap gap-x-4 gap-y-2')}>

        <Link href="/registrati" className={AUTH_LINK_CLASS}>

          {t('registrati.privato.backToChoice')}

        </Link>

        <Link href="/login" className={AUTH_LINK_CLASS}>

          {t('registrati.privato.hasAccount')}

        </Link>

      </div>

    </AuthSplitViewShell>

  );

}


