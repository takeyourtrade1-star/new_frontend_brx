'use client';

import React, { useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OtpSixBoxesProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoComplete?: string;
  ariaLabelPrefix?: string;
}

export function OtpSixBoxes({
  value,
  onChange,
  disabled = false,
  error,
  autoComplete = 'one-time-code',
  ariaLabelPrefix = 'OTP digit',
}: OtpSixBoxesProps) {
  const digits = useMemo(() => {
    const raw = (value ?? '').replace(/\D/g, '').slice(0, 6);
    return raw.padEnd(6, ' ').split('').slice(0, 6);
  }, [value]);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {digits.map((digit, idx) => {
          const filled = digit.trim().length > 0;
          return (
            <input
              key={idx}
              ref={(el) => { otpRefs.current[idx] = el; }}
              value={filled ? digit : ''}
              inputMode="numeric"
              autoComplete={autoComplete}
              aria-label={`${ariaLabelPrefix} ${idx + 1}`}
              disabled={disabled}
              className={cn(
                'h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border text-center text-2xl font-semibold text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all disabled:opacity-50',
                error
                  ? 'border-red-400 bg-red-50/50'
                  : 'border-black/10 bg-black/5'
              )}
              onChange={(e) => {
                const nextDigit = e.target.value.replace(/\D/g, '').slice(-1);
                if (!nextDigit) {
                  const arr = digits.map((d, i) => (i === idx ? ' ' : d));
                  onChange(arr.map((d) => d.trim()).join('').replace(/\s/g, ''));
                  return;
                }
                const arr = digits.map((d, i) => {
                  if (i === idx) return nextDigit;
                  return d.trim() ? d.trim() : ' ';
                });
                const nextValue = arr
                  .map((d) => d.trim())
                  .join('')
                  .replace(/\s/g, '')
                  .slice(0, 6);
                onChange(nextValue);
                if (idx < 5) otpRefs.current[idx + 1]?.focus();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace') {
                  const current = digits[idx]?.trim();
                  if (!current && idx > 0) {
                    otpRefs.current[idx - 1]?.focus();
                  }
                }
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData
                  .getData('text')
                  .replace(/\D/g, '')
                  .slice(0, 6);
                if (!pasted.length) return;
                onChange(pasted);
                otpRefs.current[Math.min(5, pasted.length - 1)]?.focus();
                e.preventDefault();
              }}
            />
          );
        })}
      </div>
      {error && (
        <p className="text-[12px] text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
