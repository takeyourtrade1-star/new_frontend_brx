'use client';



import * as React from 'react';

import { cn } from '@/lib/utils';

import { AUTH_INPUT_CLASS, AUTH_LABEL_CLASS, AUTH_REQUIRED_MARKER_CLASS } from './auth-styles';

import {

  AUTH_SPLIT_ERROR_CLASS,

  AUTH_SPLIT_INPUT_CLASS,

  AUTH_SPLIT_LABEL_CLASS,

} from './auth-split-styles';



export interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {

  label?: string;

  error?: string;

  containerClassName?: string;

  variant?: 'default' | 'split';

}



export const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(

  ({ label, error, required, className, containerClassName, id, variant = 'default', ...props }, ref) => {

    const fieldId = id ?? props.name;

    const isSplit = variant === 'split';

    const labelClass = isSplit ? AUTH_SPLIT_LABEL_CLASS : AUTH_LABEL_CLASS;

    const errorClass = isSplit ? AUTH_SPLIT_ERROR_CLASS : 'mt-1.5 pl-1 text-[12px] text-red-500';

    const defaultInputClass = isSplit ? AUTH_SPLIT_INPUT_CLASS : AUTH_INPUT_CLASS;



    return (

      <div className={containerClassName}>

        {label && (

          <label htmlFor={fieldId} className={labelClass}>

            {label}

            {required && (

              <span className={AUTH_REQUIRED_MARKER_CLASS} aria-hidden>

                *

              </span>

            )}

          </label>

        )}

        <input

          ref={ref}

          id={fieldId}

          required={required}

          aria-required={required || undefined}

          className={cn(defaultInputClass, className)}

          {...props}

        />

        {error && <p className={errorClass}>{error}</p>}

      </div>

    );

  }

);

AuthField.displayName = 'AuthField';

