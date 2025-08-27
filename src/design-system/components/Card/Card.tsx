// src/design-system/components/Card/Card.tsx

import React, { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * Card Component - Enterprise Design System
 * 
 * Flexible card component with header, content, and footer sections.
 * Supports various layouts and interactive states.
 */

const cardVariants = cva(
  [
    'rounded-lg border bg-white text-gray-950 shadow-sm transition-colors duration-200',
    'dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-gray-200 dark:border-gray-800',
        ],
        outlined: [
          'border-gray-300 shadow-none dark:border-gray-700',
        ],
        elevated: [
          'border-gray-200 shadow-lg dark:border-gray-800',
        ],
        ghost: [
          'border-transparent bg-transparent shadow-none',
        ],
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-900 dark:active:bg-gray-800',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      interactive: false,
    },
  }
);

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card visual variant */
  variant?: 'default' | 'outlined' | 'elevated' | 'ghost';
  
  /** Card padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  
  /** Interactive card (hover effects) */
  interactive?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Card content */
  children?: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      {...props}
    />
  )
);

Card.displayName = 'Card';

// Card Header
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string;
  
  /** Header content */
  children?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

// Card Title
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Title level */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  
  /** Additional CSS classes */
  className?: string;
  
  /** Title content */
  children?: React.ReactNode;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => (
    <Component
      ref={ref as any}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

// Card Description
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Additional CSS classes */
  className?: string;
  
  /** Description content */
  children?: React.ReactNode;
}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

// Card Content
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string;
  
  /** Content */
  children?: React.ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

// Card Footer
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string;
  
  /** Footer content */
  children?: React.ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

// Card Image
export interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Additional CSS classes */
  className?: string;
  
  /** Image aspect ratio */
  aspectRatio?: 'square' | 'video' | 'auto';
  
  /** Image position in card */
  position?: 'top' | 'bottom';
}

export const CardImage = forwardRef<HTMLImageElement, CardImageProps>(
  ({ className, aspectRatio = 'auto', position = 'top', alt, ...props }, ref) => {
    const aspectRatioClass = {
      square: 'aspect-square',
      video: 'aspect-video',
      auto: '',
    }[aspectRatio];
    
    const positionClass = {
      top: 'rounded-t-lg',
      bottom: 'rounded-b-lg',
    }[position];
    
    return (
      <img
        ref={ref}
        className={cn(
          'w-full object-cover',
          aspectRatioClass,
          positionClass,
          className
        )}
        alt={alt}
        {...props}
      />
    );
  }
);

CardImage.displayName = 'CardImage';

// Card Action Area (for interactive cards)
export interface CardActionAreaProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Additional CSS classes */
  className?: string;
  
  /** Action area content */
  children?: React.ReactNode;
}

export const CardActionArea = forwardRef<HTMLButtonElement, CardActionAreaProps>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'flex w-full flex-col items-start text-left transition-colors duration-200',
        'hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-900 dark:active:bg-gray-800',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'rounded-lg',
        className
      )}
      {...props}
    />
  )
);

CardActionArea.displayName = 'CardActionArea';

// Compound exports
export default {
  Root: Card,
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
  Image: CardImage,
  ActionArea: CardActionArea,
};