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
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label className="relative inline-flex cursor-pointer items-center select-none group">
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
            'flex h-5 w-5 min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-[6px] border border-gray-300 bg-white/95 shadow-xs transition-all duration-150',
            'group-hover:border-[#3D65C6]/60 group-hover:bg-white',
            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[#3D65C6]/25 peer-focus-visible:ring-offset-1',
            'peer-checked:border-[#3D65C6] peer-checked:bg-gradient-to-br peer-checked:from-[#3D65C6] peer-checked:to-[#1D3160] peer-checked:shadow-[0_2px_8px_rgba(61,101,198,0.25)]',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-40 peer-disabled:bg-gray-100',
            className
          )}
        >
          <Check
            className={cn(
              'h-3.5 w-3.5 stroke-[3] text-white transition-all duration-150',
              'opacity-0 scale-75 peer-checked:opacity-100 peer-checked:scale-100',
              checked && 'opacity-100 scale-100'
            )}
          />
        </div>
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };

