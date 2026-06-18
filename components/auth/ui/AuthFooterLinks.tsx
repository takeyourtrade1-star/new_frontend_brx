'use client';



import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { AUTH_SPLIT_FOOTER_LINK_CLASS, AUTH_SPLIT_VIEW_FOOTER_CLASS } from './auth-split-styles';



interface AuthFooterLinksProps {

  children: ReactNode;

  className?: string;

  align?: 'left' | 'center';

}



export function AuthFooterLinks({ children, className, align = 'left' }: AuthFooterLinksProps) {

  return (

    <div

      className={cn(

        AUTH_SPLIT_VIEW_FOOTER_CLASS,

        'mt-5',

        align === 'left' ? 'text-left' : 'text-center',

        className

      )}

    >

      <p className={AUTH_SPLIT_FOOTER_LINK_CLASS}>{children}</p>

    </div>

  );

}


