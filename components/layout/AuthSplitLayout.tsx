'use client';



import type { ReactNode } from 'react';

import { LoginDemoShowcase } from '@/components/feature/login/LoginDemoShowcase';

import { AUTH_SPLIT_PANEL_CLASS } from '@/components/auth/ui/auth-split-styles';

import { AuthShell } from '@/components/layout/AuthShell';

import { cn } from '@/lib/utils';



const SHOWCASE_COLUMN_CLASS = cn(

  'order-2 flex w-full flex-1 flex-col justify-start',

  'px-6 pb-6 pt-0 sm:px-10 sm:pb-8',

  'lg:order-1 lg:w-1/2 lg:min-h-0 lg:min-w-0 lg:isolate lg:overflow-hidden lg:px-10 lg:pb-8 lg:pt-0 xl:px-14'

);



const FORM_COLUMN_BASE_CLASS = cn(

  'order-1 flex w-full flex-1 flex-col bg-white/90',

  'px-6 py-6 sm:px-8 sm:py-8',

  'lg:order-2 lg:w-1/2 lg:min-h-0 lg:overflow-y-auto lg:bg-transparent',

  'lg:px-8 lg:py-10 xl:px-10 xl:py-12'

);



interface AuthSplitLayoutProps {

  children: ReactNode;

  /** 'center' = form corti (login, MFA, codice); 'start' = form lunghi (registrazione, recupero) */

  formPlacement?: 'start' | 'center';

  className?: string;

  panelClassName?: string;

}



/**

 * Layout auth 50/50: showcase a sinistra, form a destra.

 */

export function AuthSplitLayout({

  children,

  formPlacement = 'center',

  className,

  panelClassName,

}: AuthSplitLayoutProps) {

  const isCentered = formPlacement === 'center';



  return (

    <AuthShell splitHero compact>

      <aside className={SHOWCASE_COLUMN_CLASS}>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <LoginDemoShowcase className="mx-auto w-full max-w-xl lg:max-w-none" />
        </div>
      </aside>



      <section

        className={cn(

          FORM_COLUMN_BASE_CLASS,

          isCentered ? 'justify-start lg:min-h-screen lg:justify-center' : 'justify-start',

          className

        )}

      >

        <div className={cn(AUTH_SPLIT_PANEL_CLASS, panelClassName)}>{children}</div>

      </section>

    </AuthShell>

  );

}

