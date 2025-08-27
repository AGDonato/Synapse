// src/design-system/components/Button/Button.tsx

import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * Button Component - Enterprise Design System
 * 
 * Comprehensive button implementation following accessibility best practices
 * and enterprise design patterns.
 */

// Button variants using CVA (Class Variance Authority)
const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md',
    'text-sm font-medium transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none touch-manipulation',
  ],
  {
    variants: {
      variant: {
        // Primary - Main brand actions
        primary: [
          'bg-blue-600 text-white shadow hover:bg-blue-700 active:bg-blue-800',
          'dark:bg-blue-500 dark:hover:bg-blue-400 dark:active:bg-blue-300',
        ],
        
        // Secondary - Secondary actions
        secondary: [
          'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 active:bg-gray-300',
          'dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-600',
          'border border-gray-200 dark:border-gray-700',
        ],
        
        // Outline - Outlined buttons
        outline: [
          'border border-gray-300 bg-transparent text-gray-700 shadow-sm',
          'hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100',
          'dark:border-gray-600 dark:text-gray-300',
          'dark:hover:bg-gray-800 dark:hover:border-gray-500 dark:active:bg-gray-700',
        ],
        
        // Ghost - Minimal visual weight
        ghost: [
          'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
          'dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700',
        ],
        
        // Link - Text-only appearance
        link: [
          'bg-transparent text-blue-600 underline-offset-4 hover:underline',
          'dark:text-blue-400 p-0 h-auto font-normal',
        ],
        
        // Destructive - Dangerous actions
        destructive: [
          'bg-red-600 text-white shadow hover:bg-red-700 active:bg-red-800',
          'dark:bg-red-500 dark:hover:bg-red-400 dark:active:bg-red-300',
        ],
        
        // Success - Positive actions
        success: [
          'bg-green-600 text-white shadow hover:bg-green-700 active:bg-green-800',
          'dark:bg-green-500 dark:hover:bg-green-400 dark:active:bg-green-300',
        ],
        
        // Warning - Warning actions
        warning: [
          'bg-yellow-500 text-white shadow hover:bg-yellow-600 active:bg-yellow-700',
          'dark:bg-yellow-400 dark:text-gray-900 dark:hover:bg-yellow-300',
        ],
      },
      
      size: {
        xs: 'h-7 px-2 text-xs rounded',
        sm: 'h-8 px-3 text-sm rounded',
        md: 'h-10 px-4 text-sm rounded-md',
        lg: 'h-11 px-6 text-base rounded-lg',
        xl: 'h-12 px-8 text-lg rounded-lg',
        icon: 'h-10 w-10 rounded-md',
      },
      
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'success' | 'warning';
  
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  
  /** Full width button */
  fullWidth?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Icon before text */
  leftIcon?: React.ReactNode;
  
  /** Icon after text */
  rightIcon?: React.ReactNode;
  
  /** Use as child slot (for composition) */
  asChild?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Children content */
  children?: React.ReactNode;
}

// Loading spinner component
const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width="16"
    height="16"
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
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className,
    variant,
    size,
    fullWidth,
    loading = false,
    leftIcon,
    rightIcon,
    asChild = false,
    disabled,
    children,
    type = 'button',
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    // Disable button when loading
    const isDisabled = disabled || loading;
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          className
        )}
        ref={ref}
        disabled={isDisabled}
        type={type}
        aria-busy={loading}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {!loading && leftIcon && (
          <span className="shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        {children && (
          <span className={loading ? 'opacity-70' : undefined}>
            {children}
          </span>
        )}
        
        {!loading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// Button Group Component for related actions
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Button group size - applied to all buttons */
  size?: ButtonProps['size'];
  
  /** Button group variant - applied to all buttons */
  variant?: ButtonProps['variant'];
  
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  
  /** Attached buttons (no gap) */
  attached?: boolean;
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ 
    className, 
    size = 'md',
    variant = 'secondary',
    orientation = 'horizontal',
    attached = false,
    children,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          {
            'flex-row': orientation === 'horizontal',
            'flex-col': orientation === 'vertical',
            'space-x-0 [&>*:not(:last-child)]:border-r-0 [&>*:first-child]:rounded-r-none [&>*:last-child]:rounded-l-none [&>*:not(:first-child):not(:last-child)]:rounded-none': 
              attached && orientation === 'horizontal',
            'space-y-0 [&>*:not(:last-child)]:border-b-0 [&>*:first-child]:rounded-b-none [&>*:last-child]:rounded-t-none [&>*:not(:first-child):not(:last-child)]:rounded-none': 
              attached && orientation === 'vertical',
            'space-x-2': !attached && orientation === 'horizontal',
            'space-y-2': !attached && orientation === 'vertical',
          },
          className
        )}
        role="group"
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === Button) {
            const buttonChild = child as React.ReactElement<ButtonProps>;
            return React.cloneElement(buttonChild, {
              size: buttonChild.props.size || size,
              variant: buttonChild.props.variant || variant,
            });
          }
          return child;
        })}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

export default Button;