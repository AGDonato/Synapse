// src/styles/theme.ts
// Modern CSS-in-JS theme that maps to CSS custom properties

export const modernTheme = {
  // CSS custom properties integration
  colors: {
    // Brand colors
    brand: {
      50: 'var(--color-brand-50)',
      100: 'var(--color-brand-100)',
      200: 'var(--color-brand-200)',
      300: 'var(--color-brand-300)',
      400: 'var(--color-brand-400)',
      500: 'var(--color-brand-500)',
      600: 'var(--color-brand-600)',
      700: 'var(--color-brand-700)',
      800: 'var(--color-brand-800)',
      900: 'var(--color-brand-900)',
      950: 'var(--color-brand-950)',
    },
    
    // Neutral colors
    neutral: {
      0: 'var(--color-neutral-0)',
      50: 'var(--color-neutral-50)',
      100: 'var(--color-neutral-100)',
      200: 'var(--color-neutral-200)',
      300: 'var(--color-neutral-300)',
      400: 'var(--color-neutral-400)',
      500: 'var(--color-neutral-500)',
      600: 'var(--color-neutral-600)',
      700: 'var(--color-neutral-700)',
      800: 'var(--color-neutral-800)',
      900: 'var(--color-neutral-900)',
      950: 'var(--color-neutral-950)',
    },

    // Status colors
    success: 'var(--color-success-500)',
    warning: 'var(--color-warning-500)',
    error: 'var(--color-error-500)',
    info: 'var(--color-info-500)',

    // Semantic tokens
    background: {
      primary: 'var(--bg-primary)',
      secondary: 'var(--bg-secondary)',
      tertiary: 'var(--bg-tertiary)',
      accent: 'var(--bg-accent)',
      elevated: 'var(--bg-elevated)',
    },
    
    text: {
      primary: 'var(--text-primary)',
      secondary: 'var(--text-secondary)',
      tertiary: 'var(--text-tertiary)',
      placeholder: 'var(--text-placeholder)',
      brand: 'var(--text-brand)',
      onBrand: 'var(--text-on-brand)',
    },
    
    border: {
      primary: 'var(--border-primary)',
      secondary: 'var(--border-secondary)',
      accent: 'var(--border-accent)',
      focus: 'var(--border-focus)',
    },

    interactive: {
      primary: 'var(--interactive-primary)',
      primaryHover: 'var(--interactive-primary-hover)',
      primaryPressed: 'var(--interactive-primary-pressed)',
      secondary: 'var(--interactive-secondary)',
      secondaryHover: 'var(--interactive-secondary-hover)',
    },
  },

  spacing: {
    1: 'var(--space-1)',
    2: 'var(--space-2)',
    3: 'var(--space-3)',
    4: 'var(--space-4)',
    5: 'var(--space-5)',
    6: 'var(--space-6)',
    8: 'var(--space-8)',
    10: 'var(--space-10)',
    12: 'var(--space-12)',
    16: 'var(--space-16)',
    20: 'var(--space-20)',
  },

  borderRadius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    '2xl': 'var(--radius-2xl)',
    full: 'var(--radius-full)',
  },

  fontSize: {
    xs: 'var(--font-size-xs)',
    sm: 'var(--font-size-sm)',
    base: 'var(--font-size-base)',
    lg: 'var(--font-size-lg)',
    xl: 'var(--font-size-xl)',
    '2xl': 'var(--font-size-2xl)',
    '3xl': 'var(--font-size-3xl)',
    '4xl': 'var(--font-size-4xl)',
  },

  fontWeight: {
    normal: 'var(--font-weight-normal)',
    medium: 'var(--font-weight-medium)',
    semibold: 'var(--font-weight-semibold)',
    bold: 'var(--font-weight-bold)',
  },

  lineHeight: {
    tight: 'var(--line-height-tight)',
    snug: 'var(--line-height-snug)',
    normal: 'var(--line-height-normal)',
    relaxed: 'var(--line-height-relaxed)',
  },

  shadows: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
  },

  transitions: {
    fast: 'var(--transition-fast)',
    normal: 'var(--transition-normal)',
    slow: 'var(--transition-slow)',
  },

  zIndex: {
    dropdown: 'var(--z-dropdown)',
    sticky: 'var(--z-sticky)',
    fixed: 'var(--z-fixed)',
    modalBackdrop: 'var(--z-modal-backdrop)',
    modal: 'var(--z-modal)',
    popover: 'var(--z-popover)',
    tooltip: 'var(--z-tooltip)',
    toast: 'var(--z-toast)',
  },

  // Layout tokens
  layout: {
    headerHeight: 'var(--size-header)',
    sidebarWidth: 'var(--size-sidebar)',
    sidebarCollapsedWidth: 'var(--size-sidebar-collapsed)',
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: 'var(--breakpoint-sm)',
    md: 'var(--breakpoint-md)',
    lg: 'var(--breakpoint-lg)',
    xl: 'var(--breakpoint-xl)',
    '2xl': 'var(--breakpoint-2xl)',
  },
} as const;

export type ModernTheme = typeof modernTheme;

// Legacy support - gradually migrate from these
export const theme = {
  colors: {
    primary: modernTheme.colors.interactive.primary,
    primaryHover: modernTheme.colors.interactive.primaryHover,
    danger: modernTheme.colors.error,
    dangerHover: modernTheme.colors.error,
    gray: modernTheme.colors.neutral,
    border: modernTheme.colors.border.primary,
    background: {
      ...modernTheme.colors.background,
      muted: modernTheme.colors.background.tertiary,
    },
    text: {
      ...modernTheme.colors.text,
      muted: modernTheme.colors.text.tertiary,
    },
  },
  spacing: {
    xs: modernTheme.spacing[1],
    sm: modernTheme.spacing[2],
    md: modernTheme.spacing[3],
    lg: modernTheme.spacing[4],
    xl: modernTheme.spacing[5],
    '2xl': modernTheme.spacing[6],
    '3xl': modernTheme.spacing[8],
  },
  borderRadius: modernTheme.borderRadius,
  fontSize: modernTheme.fontSize,
  fontWeight: modernTheme.fontWeight,
  shadows: modernTheme.shadows,
  transitions: modernTheme.transitions,
};

export type Theme = typeof theme;
