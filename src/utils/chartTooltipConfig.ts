// src/utils/chartTooltipConfig.ts
// Configuração padronizada para tooltips dos gráficos ECharts

import { designTokens } from '../design-system/tokens';

// Import CSS classes for tooltips (will be injected as <style> tag)
const tooltipCSS = `
  .tooltip-container {
    padding: 10px;
    min-width: 200px;
    max-width: 400px;
    line-height: 1.4;
    word-wrap: break-word;
    white-space: normal;
    overflow-wrap: break-word;
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(8px);
  }
  
  .tooltip-treemap-container {
    padding: 10px;
    min-width: 220px;
    max-width: 450px;
    line-height: 1.4;
    word-wrap: break-word;
    white-space: normal;
    overflow-wrap: break-word;
    hyphens: auto;
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(8px);
  }
  
  .tooltip-title {
    font-weight: 600;
    margin-bottom: 8px;
    color: #1e293b;
    font-size: 14px;
    line-height: 1.3;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .tooltip-primary-value {
    margin-bottom: 4px;
    font-weight: 600;
    font-size: 12px;
    line-height: 1.4;
  }
  
  .tooltip-secondary-text {
    color: #64748b;
    font-size: 11px;
    font-weight: 400;
    line-height: 1.4;
    margin-bottom: 2px;
  }
  
  .tooltip-footer {
    color: #6b7280;
    font-size: 11px;
    font-weight: 500;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e5e7eb;
  }
`;

// Inject CSS only once
let cssInjected = false;
const injectTooltipCSS = () => {
  if (!cssInjected && typeof document !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.textContent = tooltipCSS;
    document.head.appendChild(styleTag);
    cssInjected = true;
  }
};

/**
 * Configuração padronizada para tooltips dos gráficos ECharts
 * Seguindo design tokens do sistema e boas práticas de acessibilidade
 */
export const STANDARD_TOOLTIP_CONFIG = {
  // Z-index usando design token correto para tooltips
  zIndex: designTokens.zIndex.tooltip, // 1060

  // CSS extra para garantir posicionamento correto e visual padronizado
  extraCssText: `
    z-index: ${designTokens.zIndex.tooltip} !important;
    box-shadow: ${designTokens.shadows.lg};
    border-radius: ${designTokens.borderRadius.lg};
    backdrop-filter: blur(8px);
  `
    .trim()
    .replace(/\s+/g, ' '),

  // Background semi-transparente para melhor legibilidade
  backgroundColor: 'rgba(255, 255, 255, 0.98)',

  // Borda sutil seguindo design tokens
  borderColor: designTokens.colors.neutral[200],
  borderWidth: 1,

  // Tipografia padronizada
  textStyle: {
    color: designTokens.colors.neutral[700],
    fontSize: parseInt(designTokens.typography.fontSize.sm), // 14px -> 14
    fontWeight: designTokens.typography.fontWeight.medium, // 500
    fontFamily: Array.isArray(designTokens.typography.fontFamily.sans)
      ? designTokens.typography.fontFamily.sans.join(', ')
      : 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
  },

  // Padding interno consistente
  padding: [
    parseInt(designTokens.spacing[2.5]), // 10px top
    parseInt(designTokens.spacing[3]), // 12px right
    parseInt(designTokens.spacing[2.5]), // 10px bottom
    parseInt(designTokens.spacing[3]), // 12px left
  ],

  // Comportamento do tooltip - configurações para escapar do container
  trigger: 'item' as const,
  hideDelay: 200,
  showDelay: 0,
  transitionDuration: 0.2,

  // Posicionamento - essencial para tooltips não serem cortados
  appendToBody: true,
  confine: false,

  // Posição inteligente - tenta posicionar acima primeiro
  position: function (
    point: number[],
    params: any,
    dom: HTMLElement,
    rect: any,
    size: { contentSize: number[]; viewSize: number[] }
  ) {
    // Obter dimensões da tela e do tooltip
    const [tooltipWidth, tooltipHeight] = size.contentSize;
    const [viewWidth, viewHeight] = size.viewSize;

    // Coordenadas do mouse/ponto
    const [x, y] = point;

    // Tentar posicionar acima do ponto primeiro
    if (y - tooltipHeight - 10 > 0) {
      return [x - tooltipWidth / 2, y - tooltipHeight - 10];
    }

    // Se não couber acima, posicionar abaixo
    if (y + tooltipHeight + 10 < viewHeight) {
      return [x - tooltipWidth / 2, y + 10];
    }

    // Se não couber nem acima nem abaixo, posicionar ao lado
    if (x + tooltipWidth + 10 < viewWidth) {
      return [x + 10, y - tooltipHeight / 2];
    } else {
      return [x - tooltipWidth - 10, y - tooltipHeight / 2];
    }
  },
} as const;

/**
 * Configuração específica para gráficos de eixo (barras, linhas)
 */
export const AXIS_TOOLTIP_CONFIG = {
  ...STANDARD_TOOLTIP_CONFIG,
  trigger: 'axis' as const,
  axisPointer: {
    type: 'shadow' as const,
    shadowStyle: {
      color: 'rgba(0, 0, 0, 0.05)',
    },
  },
} as const;

/**
 * Classes de tipografia padronizada para conteúdo HTML dos tooltips
 */
export const TOOLTIP_TYPOGRAPHY = {
  // Estilos para diferentes elementos do tooltip
  title: `
    font-weight: ${designTokens.typography.fontWeight.semibold};
    margin-bottom: 6px;
    color: ${designTokens.colors.neutral[800]};
    font-size: 14px;
    line-height: ${designTokens.typography.lineHeight.tight};
  `
    .trim()
    .replace(/\s+/g, ' '),

  primaryValue: `
    margin-bottom: 3px;
    font-weight: ${designTokens.typography.fontWeight.semibold};
    font-size: 12px;
    line-height: ${designTokens.typography.lineHeight.snug};
  `
    .trim()
    .replace(/\s+/g, ' '),

  secondaryText: `
    color: ${designTokens.colors.neutral[600]};
    font-size: 11px;
    font-weight: ${designTokens.typography.fontWeight.normal};
    line-height: ${designTokens.typography.lineHeight.snug};
  `
    .trim()
    .replace(/\s+/g, ' '),

  label: `
    color: ${designTokens.colors.neutral[500]};
    font-size: 11px;
    font-weight: ${designTokens.typography.fontWeight.medium};
  `
    .trim()
    .replace(/\s+/g, ' '),

  // Container padrão com quebra de linha
  container: `
    padding: 10px;
    min-width: 200px;
    max-width: 400px;
    line-height: 1.4;
    word-wrap: break-word;
    white-space: normal;
    overflow-wrap: break-word;
  `
    .trim()
    .replace(/\s+/g, ' '),

  // Container específico para TreeMaps com nomes longos
  treemapContainer: `
    padding: 10px;
    min-width: 220px;
    max-width: 450px;
    line-height: 1.4;
    word-wrap: break-word;
    white-space: normal;
    overflow-wrap: break-word;
    hyphens: auto;
  `
    .trim()
    .replace(/\s+/g, ' '),
} as const;

/**
 * Helper function para criar HTML padronizado de tooltip
 */
export const createTooltipHTML = (config: {
  title: string;
  items: {
    label: string;
    value: string | number;
    color?: string;
    isSecondary?: boolean;
  }[];
  footer?: string;
  isTreemap?: boolean;
}) => {
  const { title, items, footer, isTreemap } = config;

  // Inject CSS if not already done
  injectTooltipCSS();

  const containerClass = isTreemap ? 'tooltip-treemap-container' : 'tooltip-container';
  let html = `<div class="${containerClass}">`;

  // Título
  html += `<div class="tooltip-title">${title}</div>`;

  // Items
  items.forEach(item => {
    const className = item.isSecondary ? 'tooltip-secondary-text' : 'tooltip-primary-value';

    const color = item.color ? ` style="color: ${item.color};"` : '';

    html += `<div class="${className}"${color}>`;
    html += `${item.label}: ${item.value}`;
    html += `</div>`;
  });

  // Footer opcional
  if (footer) {
    html += `<div class="tooltip-footer">`;
    html += footer;
    html += `</div>`;
  }

  html += `</div>`;

  return html;
};

/**
 * Configuração para gráficos de pizza/donut
 */
export const PIE_TOOLTIP_CONFIG = {
  ...STANDARD_TOOLTIP_CONFIG,
  trigger: 'item' as const,
} as const;

/**
 * Configuração para boxplots e gráficos complexos
 */
export const COMPLEX_TOOLTIP_CONFIG = {
  ...STANDARD_TOOLTIP_CONFIG,
  confine: true, // Mantém tooltip dentro do container
  appendToBody: false,
} as const;
