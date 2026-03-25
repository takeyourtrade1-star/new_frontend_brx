'use client';

import * as React from 'react';
import { OTPInput, OTPInputContext } from 'input-otp';
import { Minus } from 'lucide-react';

import { cn } from '@/lib/utils';

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      'flex items-center justify-center gap-2 has-[:disabled]:opacity-50',
      containerClassName
    )}
    className={cn('disabled:cursor-not-allowed', className)}
    {...props}
  />
));
InputOTP.displayName = 'InputOTP';

const InputOTPGroup = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center gap-2 sm:gap-3', className)} {...props} />
));
InputOTPGroup.displayName = 'InputOTPGroup';

/** Slot stile iOS/macOS: celle grandi, rounded-2xl, ombra morbida. */
const InputOTPSlot = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const slot = inputOTPContext.slots[index];

  if (!slot) {
    return null;
  }

  const { char, placeholderChar, hasFakeCaret, isActive } = slot;
  const display = char ?? placeholderChar;

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex h-14 min-h-[3.5rem] w-11 min-w-[2.75rem] shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-background/80 text-2xl font-medium tabular-nums shadow-sm backdrop-blur-sm transition-all duration-200 sm:h-16 sm:min-h-[4rem] sm:w-12 sm:min-w-[3rem] sm:rounded-3xl sm:text-[1.75rem]',
        'hover:border-border/80',
        isActive &&
          'z-10 border-primary/40 shadow-md ring-2 ring-primary/25 ring-offset-2 ring-offset-background',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'leading-none',
          !char && placeholderChar && 'text-muted-foreground/35'
        )}
      >
        {display}
      </span>
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-px animate-caret-blink bg-foreground/80" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = 'InputOTPSlot';

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus className="h-4 w-4 text-muted-foreground/60" />
  </div>
));
InputOTPSeparator.displayName = 'InputOTPSeparator';

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
