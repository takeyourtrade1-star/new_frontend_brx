'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EmailCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  length?: number;
  digitsOnly?: boolean;
  ariaLabel?: string;
}

const REGEXP_ALPHANUM_LOWER = /^[a-z0-9]$/;
const REGEXP_DIGIT = /^\d$/;

/**
 * 8 caratteri alfanumerici minuscoli — input nativi per massima affidabilità
 * e dimensioni perfettamente controllate.
 */
export function EmailCodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  className,
  id,
  length = 8,
  digitsOnly = false,
  ariaLabel = 'Code character',
}: EmailCodeInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const chars = React.useMemo(() => {
    const normalized = value.toLowerCase();
    const raw = (digitsOnly ? normalized.replace(/\D/g, '') : normalized.replace(/[^a-z0-9]/g, ''))
      .slice(0, length);
    return raw.split('');
  }, [digitsOnly, length, value]);

  const focusIdx = React.useCallback((idx: number) => {
    inputRefs.current[idx]?.focus();
    inputRefs.current[idx]?.select();
  }, []);

  const updateValue = React.useCallback((nextChars: string[]) => {
    const joined = nextChars.join('').slice(0, length);
    onChange(joined);
    if (joined.length === length) {
      onComplete?.(joined);
    }
  }, [length, onChange, onComplete]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
      if (disabled) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (chars[idx]) {
          const next = [...chars];
          next[idx] = '';
          updateValue(next);
          focusIdx(idx);
        } else if (idx > 0) {
          const next = [...chars];
          next[idx - 1] = '';
          updateValue(next);
          focusIdx(idx - 1);
        }
        return;
      }

      if (e.key === 'ArrowLeft' && idx > 0) {
        e.preventDefault();
        focusIdx(idx - 1);
        return;
      }

      if (e.key === 'ArrowRight' && idx < length - 1) {
        e.preventDefault();
        focusIdx(idx + 1);
        return;
      }
    },
    [chars, disabled, focusIdx, length, updateValue]
  );

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
      if (disabled) return;
      const raw = e.target.value;
      const lastChar = raw.slice(-1);

      if (!lastChar) {
        // empty input (user deleted)
        const next = [...chars];
        next[idx] = '';
        updateValue(next);
        return;
      }

      if (!(digitsOnly ? REGEXP_DIGIT : REGEXP_ALPHANUM_LOWER).test(lastChar)) return;

      const lowered = lastChar.toLowerCase();
      const next = [...chars];
      next[idx] = lowered;
      updateValue(next);

      if (idx < length - 1) {
        focusIdx(idx + 1);
      }
    },
    [chars, digitsOnly, disabled, focusIdx, length, updateValue]
  );

  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      e.preventDefault();
      const raw = e.clipboardData.getData('text').toLowerCase();
      const pasted = (digitsOnly ? raw.replace(/\D/g, '') : raw.replace(/[^a-z0-9]/g, ''))
        .slice(0, length);

      const next = pasted.split('').slice(0, length);
      updateValue(next);

      // Focus sul campo successivo all'ultimo carattere incollato
      const focusIndex = Math.min(length - 1, next.length);
      setTimeout(() => focusIdx(focusIndex), 0);
    },
    [digitsOnly, disabled, focusIdx, length, updateValue]
  );

  const slotClass = cn(
    'h-10 w-10',
    'rounded-2xl border border-black/10 bg-black/5',
    'text-center text-base font-semibold text-[#1d1d1f]',
    'shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]',
    'focus:outline-none focus:bg-white/90 focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20',
    'transition-all duration-150',
    'disabled:opacity-40 disabled:cursor-not-allowed'
  );

  return (
    <div
      id={id}
      className={cn('w-full px-4', className)}
    >
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode={digitsOnly ? 'numeric' : 'text'}
            pattern={digitsOnly ? '[0-9]*' : undefined}
            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled}
            value={chars[i] || ''}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            className={slotClass}
            aria-label={`${ariaLabel} ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
