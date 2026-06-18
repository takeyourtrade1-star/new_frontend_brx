'use client';

import type { ReactNode } from 'react';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import {
  AUTH_SPLIT_VIEW_BODY_CLASS,
  AUTH_SPLIT_VIEW_PANEL_CLASS,
  AUTH_SPLIT_VIEW_SHELL_CLASS,
} from '@/components/auth/ui/auth-split-styles';
import { cn } from '@/lib/utils';

interface AuthSplitViewShellProps {
  children: ReactNode;
  /** Form corti centrati verticalmente nel body (login code, MFA). */
  centerForm?: boolean;
  className?: string;
  bodyClassName?: string;
}

export function AuthSplitViewShell({
  children,
  centerForm = false,
  className,
  bodyClassName,
}: AuthSplitViewShellProps) {
  return (
    <AuthSplitLayout
      formPlacement="start"
      className={cn(AUTH_SPLIT_VIEW_SHELL_CLASS, className)}
      panelClassName={AUTH_SPLIT_VIEW_PANEL_CLASS}
    >
      <div
        className={cn(
          AUTH_SPLIT_VIEW_BODY_CLASS,
          centerForm && 'justify-center',
          bodyClassName
        )}
      >
        {children}
      </div>
    </AuthSplitLayout>
  );
}
