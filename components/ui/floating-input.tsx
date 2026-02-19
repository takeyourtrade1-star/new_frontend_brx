'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FloatingInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'placeholder'
  > {
  label: string;
}

/**
 * Input con floating label e fieldset/legend: il bordo ha un "taglio"
 * trasparente dove si posiziona la label quando è in alto (focus o con valore).
 * Usa placeholder=" " per il trucco :placeholder-shown.
 */
const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, className, id: idProp, ...props }, ref) => {
    const generatedId = React.useId();
    const id = idProp ?? generatedId;

    return (
      <div className={cn('floating-group', className)}>
        <input
          ref={ref}
          id={id}
          className="floating-input"
          {...props}
          placeholder=" "
        />
        <label htmlFor={id} className="floating-label">
          {label}
        </label>
        <fieldset className="floating-fieldset" aria-hidden>
          <legend className="floating-legend">
            <span>{label}</span>
          </legend>
        </fieldset>
      </div>
    );
  }
);
FloatingInput.displayName = 'FloatingInput';

export { FloatingInput };
