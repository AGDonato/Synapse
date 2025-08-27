// src/components/ui/Loading.tsx
import React from 'react';
import { theme } from '../../styles/theme';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  inline?: boolean;
}

const getSpinnerSize = (size: 'sm' | 'md' | 'lg'): string => {
  const sizes = {
    sm: '16px',
    md: '24px',
    lg: '32px',
  };
  return sizes[size];
};

const spinnerStyles = (size: 'sm' | 'md' | 'lg'): React.CSSProperties => ({
  width: getSpinnerSize(size),
  height: getSpinnerSize(size),
  border: `2px solid ${theme.colors.gray[200]}`,
  borderTop: `2px solid ${theme.colors.primary}`,
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
});

const containerStyles = (inline: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: inline ? 'flex-start' : 'center',
  gap: theme.spacing.sm,
  padding: inline ? 0 : theme.spacing.lg,
});

const textStyles: React.CSSProperties = {
  color: theme.colors.text.secondary,
  fontSize: theme.fontSize.sm,
};

// Keyframes for animation (injected into head)
const injectSpinAnimation = () => {
  const styleId = 'loading-spinner-animation';
  if (document.getElementById(styleId)) {return;}

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
};

const Loading = React.memo<LoadingProps>(({
  size = 'md',
  text = 'Carregando...',
  inline = false,
}) => {
  React.useEffect(() => {
    injectSpinAnimation();
  }, []);

  return (
    <div style={containerStyles(inline)}>
      <div style={spinnerStyles(size)} />
      {text && <span style={textStyles}>{text}</span>}
    </div>
  );
});

Loading.displayName = 'Loading';

export default Loading;
