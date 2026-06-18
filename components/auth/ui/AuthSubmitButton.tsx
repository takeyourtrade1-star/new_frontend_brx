'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AUTH_PRIMARY_BUTTON_CLASS } from './auth-styles';
import { AUTH_SPLIT_BUTTON_CLASS } from './auth-split-styles';

interface AuthSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  variant?: 'default' | 'split';
}

export function AuthSubmitButton({
  children,
  loading,
  loadingText,
  className,
  disabled,
  type = 'submit',
  variant = 'default',
  ...props
}: AuthSubmitButtonProps) {
  const buttonClass = variant === 'split' ? AUTH_SPLIT_BUTTON_CLASS : AUTH_PRIMARY_BUTTON_CLASS;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(buttonClass, className)}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          {loadingText ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
