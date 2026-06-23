import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { AUTH_SUBTITLE_CLASS, AUTH_TITLE_CLASS } from './auth-styles';

import { AUTH_SPLIT_SUBTITLE_CLASS, AUTH_SPLIT_TITLE_CLASS } from './auth-split-styles';



interface AuthPageHeaderProps {

  title: string;

  subtitle?: string;

  icon?: ReactNode;

  className?: string;

  align?: 'center' | 'left';

}



export function AuthPageHeader({

  title,

  subtitle,

  icon,

  className,

  align = 'center',

}: AuthPageHeaderProps) {

  const isLeft = align === 'left';



  return (

    <div

      className={cn(

        'mb-8 flex flex-col gap-4',

        isLeft ? 'items-start text-left' : 'items-center text-center',

        className

      )}

    >

      {icon && (

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-global-bg-start/10">

          {icon}

        </div>

      )}

      <div>

        <h1 className={isLeft ? AUTH_SPLIT_TITLE_CLASS : AUTH_TITLE_CLASS}>{title}</h1>

        {subtitle && (

          <p className={cn(isLeft ? AUTH_SPLIT_SUBTITLE_CLASS : AUTH_SUBTITLE_CLASS, 'mt-1.5')}>

            {subtitle}

          </p>

        )}

      </div>

    </div>

  );

}

