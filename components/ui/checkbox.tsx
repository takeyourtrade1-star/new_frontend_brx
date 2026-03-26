'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            'h-5 w-5 shrink-0 rounded-md border-2 border-[#D1D1D6] bg-white',
            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[#FF7300] peer-focus-visible:ring-offset-2',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            'peer-checked:border-[#FF7300] peer-checked:bg-[#FF7300]',
            'transition-colors',
            className
          )}
        >
          <Check
            className={cn(
              'h-3.5 w-3.5 stroke-[3] text-white',
              checked ? 'opacity-100' : 'opacity-0'
            )}
          />
        </div>
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
