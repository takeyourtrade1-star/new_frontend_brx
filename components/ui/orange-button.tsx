'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface OrangeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'solid' | 'outline';
}

const OrangeButton = React.forwardRef<HTMLButtonElement, OrangeButtonProps>(
  ({ className, variant = 'solid', asChild = false, ...props }, ref) => {
    const baseClass =
      variant === 'solid' ? 'btn-orange-glow' : 'btn-orange-outline-glow';

    return (
      <button
        className={cn(baseClass, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
OrangeButton.displayName = 'OrangeButton';

export { OrangeButton };
