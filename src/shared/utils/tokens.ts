/**
 * Design Tokens Simplificados - Apenas tokens utilizados no projeto
 * Versão reduzida focada nos tokens realmente necessários
 */

// Apenas cores necessárias para tooltips e charts
export const colors = {
  neutral: {
    200: 'var(--color-neutral-200)',
    500: 'var(--text-secondary)',
    600: 'var(--text-secondary)',
    700: 'var(--text-primary)',
    800: 'var(--text-primary)',
  },
};

// Apenas tipografia necessária
export const typography = {
  fontFamily: {
    sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
  },
  fontSize: {
    sm: '0.875rem', // 14px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
  },
};

// Apenas spacing necessário
export const spacing = {
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
};

// Apenas bordas necessárias
export const borderRadius = {
  lg: '0.5rem', // 8px
};

// Apenas sombras necessárias
export const shadows = {
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
};

// Apenas z-index necessário
export const zIndex = {
  tooltip: 1060,
};

// Export design tokens simplificado
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
} as const;

export default designTokens;
