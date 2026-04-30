'use client';

import * as React from 'react';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';

export interface EmailCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const REGEXP_ALPHANUM_LOWER = /^[a-z0-9]*$/;

/**
 * 8 caratteri alfanumerici minuscoli — stile Apple (celle grandi, spaziatura generosa).
 * Auto-submit su onComplete quando l'utente completa gli 8 caratteri.
 */
export function EmailCodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  className,
  id,
}: EmailCodeInputProps) {
  const handleChange = React.useCallback(
    (next: string) => {
      const lowered = next.toLowerCase();
      if (!REGEXP_ALPHANUM_LOWER.test(lowered)) return;
      onChange(lowered);
      if (lowered.length === 8) {
        onComplete?.(lowered);
      }
    },
    [onChange, onComplete]
  );

  return (
    <div className={cn('flex w-full justify-center', className)}>
      <InputOTP
        id={id}
        maxLength={8}
        pattern={REGEXP_ALPHANUM_LOWER.source}
        inputMode="text"
        autoComplete="one-time-code"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        containerClassName="group flex w-full max-w-md items-center justify-center"
      >
        <InputOTPGroup className="w-full justify-center gap-2 sm:gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
