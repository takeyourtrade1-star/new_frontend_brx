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
}

const REGEXP_ALPHANUM_LOWER = /^[a-z0-9]$/;

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
}: EmailCodeInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const chars = React.useMemo(() => {
    const raw = value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
    return raw.split('');
  }, [value]);

  const focusIdx = React.useCallback((idx: number) => {
    inputRefs.current[idx]?.focus();
    inputRefs.current[idx]?.select();
  }, []);

  const updateValue = React.useCallback((nextChars: string[]) => {
    const joined = nextChars.join('').slice(0, 8);
    onChange(joined);
    if (joined.length === 8) {
      onComplete?.(joined);
    }
  }, [onChange, onComplete]);

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

      if (e.key === 'ArrowRight' && idx < 7) {
        e.preventDefault();
        focusIdx(idx + 1);
        return;
      }
    },
    [chars, disabled, focusIdx, updateValue]
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

      if (!REGEXP_ALPHANUM_LOWER.test(lastChar)) return;

      const lowered = lastChar.toLowerCase();
      const next = [...chars];
      next[idx] = lowered;
      updateValue(next);

      if (idx < 7) {
        focusIdx(idx + 1);
      }
    },
    [chars, disabled, focusIdx, updateValue]
  );

  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      e.preventDefault();
      const pasted = e.clipboardData
        .getData('text')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 8);

      const next = pasted.split('').slice(0, 8);
      updateValue(next);

      // Focus sul campo successivo all'ultimo carattere incollato
      const focusIndex = Math.min(7, next.length);
      setTimeout(() => focusIdx(focusIndex), 0);
    },
    [disabled, focusIdx, updateValue]
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
        {Array.from({ length: 8 }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="text"
            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled}
            value={chars[i] || ''}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            className={slotClass}
            aria-label={`Code character ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
