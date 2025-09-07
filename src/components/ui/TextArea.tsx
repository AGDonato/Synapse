// src/components/ui/TextArea.tsx
import React from 'react';

export interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  rows?: number;
  width?: string;
}

const textAreaStyles: React.CSSProperties = {
  width: '100%',
  padding: `${'0.5rem'} ${'0.75rem'}`,
  border: `1px solid ${'#e2e8f0'}`,
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  color: '#1e293b',
  backgroundColor: '#ffffff',
  transition: '0.15s ease-in-out',
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
};

const textAreaHoverStyles: React.CSSProperties = {
  borderColor: '#007bff',
};

const textAreaFocusStyles: React.CSSProperties = {
  borderColor: '#007bff',
  boxShadow: '0 0 0 2px rgba(0, 123, 255, 0.25)',
};

const textAreaErrorStyles: React.CSSProperties = {
  borderColor: '#ef4444',
};

const textAreaDisabledStyles: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  color: '#94a3b8',
  cursor: 'not-allowed',
  resize: 'none',
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.25rem',
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#1e293b',
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

export default function TextArea({
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  label,
  rows = 3,
  width = '100%',
}: TextAreaProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const getTextAreaStyles = (): React.CSSProperties => {
    let styles = { ...textAreaStyles };

    if (isHovered && !disabled && !error && !isFocused) {
      styles = { ...styles, ...textAreaHoverStyles };
    }

    if (isFocused && !disabled && !error) {
      styles = { ...styles, ...textAreaFocusStyles };
    }

    if (error) {
      styles = { ...styles, ...textAreaErrorStyles };
    }

    if (disabled) {
      styles = { ...styles, ...textAreaDisabledStyles };
    }

    return styles;
  };

  return (
    <div style={{ ...containerStyles, width }}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: '#ef4444' }}> *</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        style={getTextAreaStyles()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {error && <span style={errorStyles}>{error}</span>}
    </div>
  );
}
