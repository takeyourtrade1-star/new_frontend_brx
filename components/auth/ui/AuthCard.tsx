'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AUTH_CARD_CLASS, AUTH_CARD_INNER_CLASS } from './auth-styles';

interface AuthCardProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}

export function AuthCard({ children, className, innerClassName }: AuthCardProps) {
  return (
    <div className={cn(AUTH_CARD_CLASS, className)}>
      <div className={cn(AUTH_CARD_INNER_CLASS, innerClassName)}>{children}</div>
    </div>
  );
}
