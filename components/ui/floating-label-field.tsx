'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FloatingLabelFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string;
  id: string;
  value: string;
  inputClassName?: string;
  /** Colore sfondo della label quando è in alto: copre il bordo dell'input solo in corrispondenza della parola (es. "white" per card bianca). */
  floatingLabelBg?: string;
}

/**
 * Campo input con Floating Label (stile Material Design).
 * La label si sposta in alto e si riduce quando l'input ha focus o valore.
 */
const FloatingLabelField = React.forwardRef<
  HTMLInputElement,
  FloatingLabelFieldProps
>(
  (
    {
      label,
      id,
      value,
      inputClassName,
      className,
      floatingLabelBg,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const isFloating = isFocused || value.length > 0;

    return (
      <div className={cn('relative', className)}>
        <input
          ref={ref}
          id={id}
          value={value}
          className={cn(
            'h-14 w-full rounded-xl border-0 bg-[#e5e7eb] pt-6 pb-2 px-3 text-base text-[#0F172A]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7300]/50 focus-visible:ring-offset-0',
            'transition-colors duration-200',
            'disabled:cursor-not-allowed disabled:opacity-50',
            inputClassName
          )}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            'absolute pointer-events-none transition-all duration-200',
            isFloating
              ? 'left-3 top-2 -translate-y-0 text-xs font-medium text-[#374151] px-1'
              : 'left-3 top-1/2 -translate-y-1/2 text-base font-medium text-gray-700'
          )}
          style={
            isFloating && floatingLabelBg
              ? { background: floatingLabelBg }
              : undefined
          }
        >
          {label}
        </label>
      </div>
    );
  }
);
FloatingLabelField.displayName = 'FloatingLabelField';

export { FloatingLabelField };
