'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AUTH_SECONDARY_BUTTON_CLASS } from './auth-styles';

interface AuthSecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function AuthSecondaryButton({ children, className, ...props }: AuthSecondaryButtonProps) {
  return (
    <button type="button" className={cn(AUTH_SECONDARY_BUTTON_CLASS, className)} {...props}>
      {children}
    </button>
  );
}
