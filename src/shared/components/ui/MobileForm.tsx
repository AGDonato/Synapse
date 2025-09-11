import React, { forwardRef } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import styles from './MobileForm.module.css';

// Form Container
interface MobileFormProps {
  children: React.ReactNode;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
}

export const MobileForm: React.FC<MobileFormProps> = ({ children, onSubmit, className }) => {
  return (
    <form
      className={`${styles.form} mobile-form ${className || ''}`}
      onSubmit={onSubmit}
      noValidate
    >
      {children}
    </form>
  );
};

// Form Group
interface MobileFormGroupProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export const MobileFormGroup: React.FC<MobileFormGroupProps> = ({
  children,
  label,
  error,
  required = false,
  className,
}) => {
  return (
    <div className={`${styles.formGroup} ${className || ''}`}>
      {label && (
        <label className={`${styles.label} ${required ? styles.required : ''}`}>
          {label}
          {required && (
            <span className={styles.requiredMark} aria-hidden='true'>
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error && (
        <span className={styles.error} role='alert'>
          {error}
        </span>
      )}
    </div>
  );
};

// Text Input
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  fullWidth?: boolean;
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, error, fullWidth = true, type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className={`${styles.inputWrapper} ${fullWidth ? styles.fullWidth : ''}`}>
        <input
          ref={ref}
          type={inputType}
          className={`${styles.input} ${error ? styles.inputError : ''} ${className || ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type='button'
            className={styles.passwordToggle}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    );
  }
);

MobileInput.displayName = 'MobileInput';

// Textarea
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  fullWidth?: boolean;
  autoResize?: boolean;
}

export const MobileTextarea = forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({ className, error, fullWidth = true, autoResize = false, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useImperativeHandle(ref, () => textareaRef.current!);

    const handleInput = React.useCallback(
      (e: React.FormEvent<HTMLTextAreaElement>) => {
        if (autoResize && textareaRef.current) {
          const textarea = textareaRef.current;
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
        }
        props.onInput?.(e);
      },
      [autoResize, props]
    );

    return (
      <textarea
        ref={textareaRef}
        className={`${styles.textarea} ${error ? styles.inputError : ''} ${fullWidth ? styles.fullWidth : ''} ${className || ''}`}
        onInput={handleInput}
        {...props}
      />
    );
  }
);

MobileTextarea.displayName = 'MobileTextarea';

// Select
interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
}

export const MobileSelect = forwardRef<HTMLSelectElement, MobileSelectProps>(
  ({ className, error, fullWidth = true, placeholder, children, ...props }, ref) => {
    return (
      <div className={`${styles.selectWrapper} ${fullWidth ? styles.fullWidth : ''}`}>
        <select
          ref={ref}
          className={`${styles.select} ${error ? styles.inputError : ''} ${className || ''}`}
          {...props}
        >
          {placeholder && (
            <option value='' disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown className={styles.selectIcon} size={20} />
      </div>
    );
  }
);

MobileSelect.displayName = 'MobileSelect';

// Button
interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`
        ${styles.button}
        ${styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`]}
        ${styles[`button${size.toUpperCase()}`]}
        ${fullWidth ? styles.fullWidth : ''}
        ${loading ? styles.loading : ''}
        ${className || ''}
      `}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <div className={styles.spinner} />}
        <span className={loading ? styles.hiddenText : ''}>{children}</span>
      </button>
    );
  }
);

MobileButton.displayName = 'MobileButton';

// Button Group
interface MobileButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  fullWidth?: boolean;
  className?: string;
}

export const MobileButtonGroup: React.FC<MobileButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  fullWidth = false,
  className,
}) => {
  return (
    <div
      className={`
        ${styles.buttonGroup}
        ${styles[`buttonGroup${orientation.charAt(0).toUpperCase() + orientation.slice(1)}`]}
        ${fullWidth ? styles.fullWidth : ''}
        ${className || ''}
      `}
    >
      {children}
    </div>
  );
};
