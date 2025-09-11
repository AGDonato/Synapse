// src/components/ui/Input.tsx
import React from 'react';
import styles from './Input.module.css';

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  width?: string;
}

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: `${'0.5rem'} ${'0.75rem'}`,
  border: `1px solid ${'var(--border-primary)'}`,
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
  backgroundColor: '#ffffff',
  transition: '0.15s ease-in-out',
  outline: 'none',
};

const inputHoverStyles: React.CSSProperties = {
  borderColor: '#007bff',
};

const inputFocusStyles: React.CSSProperties = {
  borderColor: '#007bff',
  boxShadow: '0 0 0 2px rgba(0, 123, 255, 0.25)',
};

const inputErrorStyles: React.CSSProperties = {
  borderColor: '#ef4444',
};

const inputDisabledStyles: React.CSSProperties = {
  backgroundColor: 'var(--bg-tertiary)',
  color: 'var(--text-tertiary)',
  cursor: 'not-allowed',
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.25rem',
  fontSize: '0.875rem',
  fontWeight: '500',
  color: 'var(--text-primary)',
};

const errorStyles: React.CSSProperties = {
  marginTop: '0.25rem',
  fontSize: '0.75rem',
  color: '#ef4444',
};

const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

export default function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  label,
  width = '100%',
}: InputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const getInputStyles = (): React.CSSProperties => {
    let styles = { ...inputStyles };

    if (isHovered && !disabled && !error && !isFocused) {
      styles = { ...styles, ...inputHoverStyles };
    }

    if (isFocused && !disabled && !error) {
      styles = { ...styles, ...inputFocusStyles };
    }

    if (error) {
      styles = { ...styles, ...inputErrorStyles };
    }

    if (disabled) {
      styles = { ...styles, ...inputDisabledStyles };
    }

    return styles;
  };

  return (
    <div style={{ ...containerStyles, width }}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span className={styles.requiredAsterisk}> *</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={getInputStyles()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {error && <span style={errorStyles}>{error}</span>}
    </div>
  );
}
