'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ButtonOrangeProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  glowVariant?: 'solid' | 'outline';
}

const ButtonOrange = React.forwardRef<HTMLButtonElement, ButtonOrangeProps>(
  ({ className, glowVariant = 'solid', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : Button;
    const glowClass =
      glowVariant === 'solid' ? 'btn-orange-glow' : 'btn-orange-outline-glow';

    return (
      <Comp
        className={cn(glowClass, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
ButtonOrange.displayName = 'ButtonOrange';

export { ButtonOrange };
