// src/components/ui/Loading.tsx
import React from 'react';

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
  border: '2px solid var(--color-neutral-200)',
  borderTop: '2px solid #3b82f6',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
});

const containerStyles = (inline: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: inline ? 'flex-start' : 'center',
  gap: '0.5rem',
  padding: inline ? 0 : '1.25rem',
});

const textStyles: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '0.875rem',
};

// Keyframes for animation (injected into head)
const injectSpinAnimation = () => {
  const styleId = 'loading-spinner-animation';
  if (document.getElementById(styleId)) {
    return;
  }

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

const Loading = React.memo<LoadingProps>(
  ({ size = 'md', text = 'Carregando...', inline = false }) => {
    React.useEffect(() => {
      injectSpinAnimation();
    }, []);

    return (
      <div style={containerStyles(inline)}>
        <div style={spinnerStyles(size)} />
        {text && <span style={textStyles}>{text}</span>}
      </div>
    );
  }
);

Loading.displayName = 'Loading';

export default Loading;
