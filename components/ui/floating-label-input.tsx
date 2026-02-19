'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FloatingLabelInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'placeholder' | 'value'
  > {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

/**
 * Input con Floating Label (stile snippet di riferimento).
 * Usa placeholder=" " e :not(:placeholder-shown) per la logica CSS performante.
 * La label ha background uguale all’input per integrarsi con la card.
 */
const FloatingLabelInput = React.forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(
  (
    {
      label,
      type = 'text',
      value,
      onChange,
      className,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const id = idProp ?? generatedId;

    return (
      <div className={cn('relative mb-5', className)}>
        <input
          ref={ref}
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder=" "
          className="peer w-full rounded-xl border border-[#ccc] bg-[#e5e7eb] px-3 py-3 text-base outline-none transition-[border-color] focus:border-2 focus:border-[#FF7300] focus:ring-0"
          style={{ boxSizing: 'border-box' }}
          {...props}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-3 top-3 text-base font-medium text-gray-700 transition-all duration-200 ease-out peer-focus:left-3 peer-focus:-top-1 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:font-medium peer-focus:text-[#374151] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:-top-1 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:text-[#374151]"
        >
          {label}
        </label>
      </div>
    );
  }
);
FloatingLabelInput.displayName = 'FloatingLabelInput';

export { FloatingLabelInput };
