// src/design-system/components/Input/Input.tsx

import React, { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * Input Component - Enterprise Design System
 * 
 * Comprehensive input implementation with validation states,
 * icons, and accessibility features.
 */

const inputVariants = cva(
  [
    'flex w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors duration-200',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-700',
    'placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
    'read-only:cursor-default read-only:bg-gray-50',
    'dark:bg-gray-900 dark:file:text-gray-300 dark:placeholder:text-gray-400 dark:disabled:bg-gray-800',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-gray-300 focus-visible:border-blue-500',
          'dark:border-gray-600 dark:focus-visible:border-blue-400',
        ],
        error: [
          'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500',
          'dark:border-red-400 dark:focus-visible:border-red-300',
        ],
        success: [
          'border-green-300 focus-visible:border-green-500 focus-visible:ring-green-500',
          'dark:border-green-400 dark:focus-visible:border-green-300',
        ],
        warning: [
          'border-yellow-300 focus-visible:border-yellow-500 focus-visible:ring-yellow-500',
          'dark:border-yellow-400 dark:focus-visible:border-yellow-300',
        ],
      },
      size: {
        sm: 'h-8 text-xs px-2',
        md: 'h-10 text-sm px-3',
        lg: 'h-12 text-base px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface InputProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input variant */
  variant?: 'default' | 'error' | 'success' | 'warning';
  
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Icon before input */
  leftIcon?: React.ReactNode;
  
  /** Icon after input */
  rightIcon?: React.ReactNode;
  
  /** Show loading state */
  loading?: boolean;
  
  /** Error message */
  error?: string;
  
  /** Helper text */
  helperText?: string;
  
  /** Label */
  label?: string;
  
  /** Required field indicator */
  required?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

// Input wrapper for icons
const InputWrapper = forwardRef<HTMLDivElement, {
  children: React.ReactNode;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}>(({ children, className, leftIcon, rightIcon, loading, size = 'md' }, ref) => {
  const hasLeftIcon = leftIcon || loading;
  const hasRightIcon = rightIcon;
  
  if (!hasLeftIcon && !hasRightIcon) {
    return <>{children}</>;
  }
  
  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6',
  }[size];
  
  const leftPadding = {
    sm: hasLeftIcon ? 'pl-8' : '',
    md: hasLeftIcon ? 'pl-10' : '',
    lg: hasLeftIcon ? 'pl-12' : '',
  }[size];
  
  const rightPadding = {
    sm: hasRightIcon ? 'pr-8' : '',
    md: hasRightIcon ? 'pr-10' : '',
    lg: hasRightIcon ? 'pr-12' : '',
  }[size];
  
  return (
    <div ref={ref} className={cn('relative', className)}>
      {hasLeftIcon && (
        <div className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400',
          iconSize
        )}>
          {loading ? (
            <svg 
              className={cn('animate-spin', iconSize)} 
              fill="none" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="m12 2 A10 10 0 0 1 22 12" 
              />
            </svg>
          ) : leftIcon}
        </div>
      )}
      
      {React.cloneElement(children as React.ReactElement<unknown>, {
        className: cn(
          (children as React.ReactElement<unknown>).props.className,
          leftPadding,
          rightPadding
        ),
      })}
      
      {hasRightIcon && (
        <div className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400',
          iconSize
        )}>
          {rightIcon}
        </div>
      )}
    </div>
  );
});

InputWrapper.displayName = 'InputWrapper';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    variant,
    size,
    leftIcon,
    rightIcon,
    loading = false,
    error,
    helperText,
    label,
    required,
    id,
    type = 'text',
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const hasError = Boolean(error);
    const finalVariant = hasError ? 'error' : variant;
    
    const inputElement = (
      <input
        type={type}
        className={cn(inputVariants({ variant: finalVariant, size }), className)}
        ref={ref}
        id={inputId}
        aria-invalid={hasError}
        aria-describedby={
          cn(
            error && `${inputId}-error`,
            helperText && `${inputId}-helper`
          ) || undefined
        }
        {...props}
      />
    );
    
    const wrappedInput = (
      <InputWrapper
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        loading={loading}
        size={size}
      >
        {inputElement}
      </InputWrapper>
    );
    
    // If no label or helper text, return just the input
    if (!label && !error && !helperText) {
      return wrappedInput;
    }
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-gray-700 dark:text-gray-300',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}
        
        {wrappedInput}
        
        {(error || helperText) && (
          <div className="space-y-1">
            {error && (
              <p 
                id={`${inputId}-error`}
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}
            
            {helperText && !error && (
              <p 
                id={`${inputId}-helper`}
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea variant
export interface TextareaProps 
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Textarea variant */
  variant?: 'default' | 'error' | 'success' | 'warning';
  
  /** Textarea size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Error message */
  error?: string;
  
  /** Helper text */
  helperText?: string;
  
  /** Label */
  label?: string;
  
  /** Required field indicator */
  required?: boolean;
  
  /** Auto-resize height */
  autoResize?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

const textareaVariants = cva(
  [
    'flex min-h-[60px] w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors duration-200',
    'placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
    'read-only:cursor-default read-only:bg-gray-50',
    'dark:bg-gray-900 dark:placeholder:text-gray-400 dark:disabled:bg-gray-800',
    'resize-none',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-gray-300 focus-visible:border-blue-500',
          'dark:border-gray-600 dark:focus-visible:border-blue-400',
        ],
        error: [
          'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500',
          'dark:border-red-400 dark:focus-visible:border-red-300',
        ],
        success: [
          'border-green-300 focus-visible:border-green-500 focus-visible:ring-green-500',
          'dark:border-green-400 dark:focus-visible:border-green-300',
        ],
        warning: [
          'border-yellow-300 focus-visible:border-yellow-500 focus-visible:ring-yellow-500',
          'dark:border-yellow-400 dark:focus-visible:border-yellow-300',
        ],
      },
      size: {
        sm: 'min-h-[50px] text-xs px-2 py-1',
        md: 'min-h-[60px] text-sm px-3 py-2',
        lg: 'min-h-[80px] text-base px-4 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className,
    variant,
    size,
    error,
    helperText,
    label,
    required,
    autoResize = false,
    id,
    onChange,
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;
    const hasError = Boolean(error);
    const finalVariant = hasError ? 'error' : variant;
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }
      onChange?.(e);
    };
    
    const textareaElement = (
      <textarea
        className={cn(
          textareaVariants({ variant: finalVariant, size }),
          autoResize && 'resize-none overflow-hidden',
          className
        )}
        ref={ref}
        id={textareaId}
        onChange={handleChange}
        aria-invalid={hasError}
        aria-describedby={
          cn(
            error && `${textareaId}-error`,
            helperText && `${textareaId}-helper`
          ) || undefined
        }
        {...props}
      />
    );
    
    // If no label or helper text, return just the textarea
    if (!label && !error && !helperText) {
      return textareaElement;
    }
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-medium text-gray-700 dark:text-gray-300',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}
        
        {textareaElement}
        
        {(error || helperText) && (
          <div className="space-y-1">
            {error && (
              <p 
                id={`${textareaId}-error`}
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}
            
            {helperText && !error && (
              <p 
                id={`${textareaId}-helper`}
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;