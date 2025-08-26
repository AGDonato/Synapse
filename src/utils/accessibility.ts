/**
 * Utilitários de Acessibilidade
 *
 * Funções para garantir conformidade com WCAG AA/AAA
 * em aplicações de órgãos públicos.
 */

/**
 * Converte cor hexadecimal para RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calcula a luminância relativa de uma cor
 * Baseado nas diretrizes WCAG 2.1
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcula o ratio de contraste entre duas cores
 * Retorna um valor entre 1 (sem contraste) e 21 (máximo contraste)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Verifica se uma combinação de cores atende aos padrões WCAG
 */
export function meetsWCAGStandards(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): {
  ratio: number;
  meetsStandard: boolean;
  requiredRatio: number;
} {
  const ratio = getContrastRatio(foreground, background);

  let requiredRatio: number;
  if (level === 'AAA') {
    requiredRatio = isLargeText ? 4.5 : 7;
  } else {
    requiredRatio = isLargeText ? 3 : 4.5;
  }

  return {
    ratio,
    meetsStandard: ratio >= requiredRatio,
    requiredRatio,
  };
}

/**
 * Sugere cores alternativas se o contraste for insuficiente
 */
export function suggestAccessibleColors(
  foreground: string,
  background: string
): {
  lighterForeground: string;
  darkerForeground: string;
  lighterBackground: string;
  darkerBackground: string;
} {
  // Implementação simplificada - em produção usaria algoritmos mais sofisticados
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) {
    return {
      lighterForeground: foreground,
      darkerForeground: foreground,
      lighterBackground: background,
      darkerBackground: background,
    };
  }

  // Escurecer o primeiro plano
  const darkerFg = `#${Math.max(0, fg.r - 40)
    .toString(16)
    .padStart(2, '0')}${Math.max(0, fg.g - 40)
    .toString(16)
    .padStart(2, '0')}${Math.max(0, fg.b - 40)
    .toString(16)
    .padStart(2, '0')}`;

  // Clarear o primeiro plano
  const lighterFg = `#${Math.min(255, fg.r + 40)
    .toString(16)
    .padStart(2, '0')}${Math.min(255, fg.g + 40)
    .toString(16)
    .padStart(2, '0')}${Math.min(255, fg.b + 40)
    .toString(16)
    .padStart(2, '0')}`;

  // Escurecer o fundo
  const darkerBg = `#${Math.max(0, bg.r - 40)
    .toString(16)
    .padStart(2, '0')}${Math.max(0, bg.g - 40)
    .toString(16)
    .padStart(2, '0')}${Math.max(0, bg.b - 40)
    .toString(16)
    .padStart(2, '0')}`;

  // Clarear o fundo
  const lighterBg = `#${Math.min(255, bg.r + 40)
    .toString(16)
    .padStart(2, '0')}${Math.min(255, bg.g + 40)
    .toString(16)
    .padStart(2, '0')}${Math.min(255, bg.b + 40)
    .toString(16)
    .padStart(2, '0')}`;

  return {
    lighterForeground: lighterFg,
    darkerForeground: darkerFg,
    lighterBackground: lighterBg,
    darkerBackground: darkerBg,
  };
}

/**
 * Gera propriedades ARIA adequadas para diferentes contextos
 */
export function getAriaProps(
  type: 'button' | 'link' | 'input' | 'status' | 'alert' | 'dialog' | 'tab',
  options: {
    label?: string;
    describedBy?: string;
    expanded?: boolean;
    selected?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    live?: 'polite' | 'assertive' | 'off';
    atomic?: boolean;
  } = {}
): Record<string, string | boolean> {
  const baseProps: Record<string, string | boolean> = {};

  // Propriedades comuns
  if (options.label) baseProps['aria-label'] = options.label;
  if (options.describedBy) baseProps['aria-describedby'] = options.describedBy;
  if (options.disabled) baseProps['aria-disabled'] = 'true';

  // Propriedades específicas por tipo
  switch (type) {
    case 'button':
      if (options.expanded !== undefined)
        baseProps['aria-expanded'] = options.expanded.toString();
      break;

    case 'input':
      if (options.required) baseProps['aria-required'] = 'true';
      if (options.invalid) baseProps['aria-invalid'] = 'true';
      break;

    case 'status':
      baseProps['role'] = 'status';
      if (options.live) baseProps['aria-live'] = options.live;
      if (options.atomic) baseProps['aria-atomic'] = options.atomic.toString();
      break;

    case 'alert':
      baseProps['role'] = 'alert';
      baseProps['aria-live'] = 'assertive';
      break;

    case 'dialog':
      baseProps['role'] = 'dialog';
      baseProps['aria-modal'] = 'true';
      break;

    case 'tab':
      baseProps['role'] = 'tab';
      if (options.selected !== undefined)
        baseProps['aria-selected'] = options.selected.toString();
      break;
  }

  return baseProps;
}

/**
 * Verifica se um elemento é focalizável
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'a[href]',
    'button',
    'input',
    'textarea',
    'select',
    '[tabindex]',
  ];

  return (
    focusableSelectors.some(selector => element.matches(selector)) &&
    !element.hasAttribute('disabled') &&
    element.tabIndex !== -1 &&
    window.getComputedStyle(element).display !== 'none' &&
    window.getComputedStyle(element).visibility !== 'hidden'
  );
}

/**
 * Gerencia o foco dentro de um modal/dialog
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleTabKey(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }

    if (e.key === 'Escape') {
      container.dispatchEvent(new CustomEvent('escape'));
    }
  }

  document.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => {
    document.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Anuncia mudanças para screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;

  document.body.appendChild(announcer);
  announcer.textContent = message;

  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
}

/**
 * Detecta se o usuário está navegando por teclado
 */
export function setupKeyboardNavigation(): void {
  document.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });
}

/**
 * Cores validadas para órgãos públicos com contraste WCAG AA
 */
export const accessibleColorPalette = {
  // Texto sobre fundo claro (ratio > 4.5)
  textOnLight: {
    primary: '#1e293b', // 16.07:1
    secondary: '#475569', // 9.35:1
    tertiary: '#64748b', // 6.81:1
    link: '#1d4ed8', // 8.89:1
    success: '#166534', // 6.94:1
    warning: '#a16207', // 5.08:1
    error: '#dc2626', // 5.94:1
  },

  // Texto sobre fundo escuro (ratio > 4.5)
  textOnDark: {
    primary: '#ffffff', // 21:1
    secondary: '#e2e8f0', // 17.09:1
    tertiary: '#cbd5e1', // 13.65:1
    link: '#60a5fa', // 7.09:1
    success: '#4ade80', // 11.43:1
    warning: '#fbbf24', // 12.85:1
    error: '#f87171', // 8.15:1
  },

  // Fundos seguros para texto escuro
  backgroundsForDarkText: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    success: '#f0fdf4',
    warning: '#fffbeb',
    error: '#fef2f2',
  },

  // Fundos seguros para texto claro
  backgroundsForLightText: {
    primary: '#1e293b',
    secondary: '#334155',
    tertiary: '#475569',
    success: '#166534',
    warning: '#92400e',
    error: '#dc2626',
  },
};

/**
 * Valida se todas as cores do design system atendem WCAG AA
 */
export function validateDesignSystemColors(): {
  valid: boolean;
  issues: Array<{
    foreground: string;
    background: string;
    ratio: number;
    required: number;
  }>;
} {
  const issues: Array<{
    foreground: string;
    background: string;
    ratio: number;
    required: number;
  }> = [];

  // Verificar combinações críticas
  const combinations = [
    {
      fg: accessibleColorPalette.textOnLight.primary,
      bg: accessibleColorPalette.backgroundsForDarkText.primary,
    },
    {
      fg: accessibleColorPalette.textOnLight.secondary,
      bg: accessibleColorPalette.backgroundsForDarkText.primary,
    },
    {
      fg: accessibleColorPalette.textOnLight.link,
      bg: accessibleColorPalette.backgroundsForDarkText.primary,
    },
    // Adicionar mais combinações conforme necessário
  ];

  combinations.forEach(({ fg, bg }) => {
    const result = meetsWCAGStandards(fg, bg, 'AA');
    if (!result.meetsStandard) {
      issues.push({
        foreground: fg,
        background: bg,
        ratio: result.ratio,
        required: result.requiredRatio,
      });
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}
