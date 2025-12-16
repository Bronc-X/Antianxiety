'use client';

import * as React from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface FormInputProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  control: Control<T>;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  description?: string;
  autoComplete?: string;
}

export function FormInput<T extends FieldValues>({
  name,
  label,
  type = 'text',
  placeholder,
  control,
  disabled = false,
  className,
  inputClassName,
  description,
  autoComplete,
}: FormInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className={cn('space-y-2', className)}>
          {label && (
            <label
              htmlFor={name}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
            </label>
          )}
          <Input
            {...field}
            id={name}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            className={cn(
              error && 'border-red-500 focus-visible:ring-red-500',
              inputClassName
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
          />
          {description && !error && (
            <p id={`${name}-description`} className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
          {error && (
            <p id={`${name}-error`} className="text-sm text-red-500" role="alert">
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}

FormInput.displayName = 'FormInput';
