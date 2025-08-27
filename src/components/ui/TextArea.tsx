// src/components/ui/TextArea.tsx
import React from 'react';
import { theme } from '../../styles/theme';

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
  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  fontSize: theme.fontSize.sm,
  color: theme.colors.text.primary,
  backgroundColor: theme.colors.background.primary,
  transition: theme.transitions.fast,
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
  borderColor: theme.colors.danger,
};

const textAreaDisabledStyles: React.CSSProperties = {
  backgroundColor: theme.colors.background.muted,
  color: theme.colors.text.muted,
  cursor: 'not-allowed',
  resize: 'none',
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  marginBottom: theme.spacing.xs,
  fontSize: theme.fontSize.sm,
  fontWeight: theme.fontWeight.medium,
  color: theme.colors.text.primary,
};

const errorStyles: React.CSSProperties = {
  marginTop: theme.spacing.xs,
  fontSize: theme.fontSize.xs,
  color: theme.colors.danger,
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
          {required && <span style={{ color: theme.colors.danger }}> *</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
