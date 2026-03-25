'use client';

import * as React from 'react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';

export interface AuthCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  /** Centra il gruppo OTP nel contenitore */
  className?: string;
  /** id per aria-labelledby / label */
  id?: string;
}

/**
 * 6 cifre, solo numeri — stile Apple (celle grandi, spaziatura generosa).
 * Usa il pattern shadcn InputOTP sotto.
 */
export function AuthCodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  className,
  id,
}: AuthCodeInputProps) {
  return (
    <div className={cn('flex w-full justify-center', className)}>
      <InputOTP
        id={id}
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        disabled={disabled}
        containerClassName="group flex w-full max-w-md items-center justify-center"
      >
        <InputOTPGroup className="w-full justify-center gap-2 sm:gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
