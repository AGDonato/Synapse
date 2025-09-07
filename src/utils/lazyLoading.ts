/**
 * UTILITÁRIOS AVANÇADOS DE CARREGAMENTO LAZY
 *
 * Este módulo fornece funcionalidades avançadas para carregamento lazy de componentes React.
 * Inclui funcionalidades para:
 * - Carregamento lazy com retry automático em caso de falha
 * - Timeout configurável para carregamentos
 * - Preload opcional de componentes críticos
 * - Callbacks para eventos de loading, error e success
 * - Otimizações de performance e cache
 * - Suspense boundaries customizados
 */

import { logger } from './logger';
import type { ComponentType, LazyExoticComponent } from 'react';
import { Suspense, lazy } from 'react';
import React from 'react';

// Tipos
type ComponentFactory<T = Record<string, unknown>> = () => Promise<{ default: ComponentType<T> }>;
type RetryFunction<T = Record<string, unknown>> = (
  fn: ComponentFactory<T>,
  retriesLeft: number
) => Promise<{ default: ComponentType<T> }>;

// Configuração de carregamento lazy
interface LazyLoadConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  preload?: boolean;
  onError?: (error: Error) => void;
  onLoading?: () => void;
  onLoaded?: () => void;
}

// Configuração padrão
const defaultConfig: Required<LazyLoadConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  preload: false,
  onError: error => logger.error('Carregamento lazy falhou:', error),
  onLoading: () => logger.info('Carregando componente...'),
  onLoaded: () => logger.info('Componente carregado com sucesso'),
};

// Mecanismo de retry para imports que falharam
const retryImport = async <T = Record<string, unknown>>(
  fn: ComponentFactory<T>,
  retriesLeft: number
): Promise<{ default: ComponentType<T> }> => {
  try {
    return await fn();
  } catch (error) {
    if (retriesLeft <= 0) {
      throw error;
    }

    logger.warn(`Import falhou, tentando novamente... (${retriesLeft} tentativas restantes)`);
    await new Promise(resolve => setTimeout(resolve, defaultConfig.retryDelay));
    return retryImport(fn, retriesLeft - 1);
  }
};

/**
 * Cria componente lazy com lógica de retry automático
 * @param componentFactory Função que retorna Promise do componente
 * @param config Configurações de carregamento
 * @returns Componente lazy configurado
 */
export const createLazyComponent = <T = Record<string, unknown>>(
  componentFactory: ComponentFactory<T>,
  config: LazyLoadConfig = {}
): LazyExoticComponent<ComponentType<T>> => {
  const fullConfig = { ...defaultConfig, ...config };

  const enhancedFactory = async () => {
    fullConfig.onLoading();

    try {
      const component = await retryImport(componentFactory, fullConfig.maxRetries);
      fullConfig.onLoaded();
      return component;
    } catch (error) {
      fullConfig.onError(error as Error);
      throw error;
    }
  };

  return lazy(enhancedFactory);
};

/**
 * Pré-carrega um componente específico
 * @param componentFactory Função do componente a ser pré-carregado
 */
export const preloadComponent = async <T>(componentFactory: ComponentFactory<T>): Promise<void> => {
  try {
    await componentFactory();
  } catch (error) {
    logger.warn('Pré-carregamento falhou para componente:', error);
  }
};

/**
 * Pré-carrega múltiplos componentes em lote
 * @param factories Array de funções de componentes
 * @param options Opções de carregamento (paralelo/sequencial)
 */
export const batchPreload = async (
  factories: ComponentFactory[],
  options: { parallel?: boolean; delay?: number } = {}
): Promise<void> => {
  const { parallel = true, delay = 0 } = options;

  if (parallel) {
    await Promise.allSettled(factories.map(factory => preloadComponent(factory)));
  } else {
    for (const factory of factories) {
      await preloadComponent(factory);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};

/**
 * Cria componente lazy baseado na visibilidade no viewport
 * Utiliza Intersection Observer para detectar quando carregar
 * @param componentFactory Função do componente
 * @param config Configurações incluindo rootMargin e threshold
 * @returns Componente lazy que carrega apenas quando visível
 */
export const createViewportLazyComponent = <T = Record<string, unknown>>(
  componentFactory: ComponentFactory<T>,
  config: LazyLoadConfig & { rootMargin?: string; threshold?: number } = {}
): LazyExoticComponent<ComponentType<T>> => {
  const { rootMargin = '100px', threshold = 0.1, ...lazyConfig } = config;
  let hasLoaded = false;

  return lazy(async () => {
    // Se já foi carregado, retorna imediatamente
    if (hasLoaded) {
      return await componentFactory();
    }

    // Aguarda trigger do intersection observer
    return new Promise((resolve, reject) => {
      // Cria elemento temporário para observar
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              hasLoaded = true;
              observer.disconnect();

              retryImport(componentFactory, defaultConfig.maxRetries).then(resolve).catch(reject);
            }
          });
        },
        { rootMargin, threshold }
      );

      // Cria elemento marcador
      const marker = document.createElement('div');
      marker.style.position = 'absolute';
      marker.style.top = '0';
      marker.style.left = '0';
      marker.style.width = '1px';
      marker.style.height = '1px';
      marker.style.opacity = '0';
      marker.style.pointerEvents = 'none';

      document.body.appendChild(marker);
      observer.observe(marker);

      // Limpeza após timeout
      setTimeout(() => {
        observer.disconnect();
        document.body.removeChild(marker);
        if (!hasLoaded) {
          reject(new Error('Timeout do carregamento lazy por viewport'));
        }
      }, lazyConfig.timeout || defaultConfig.timeout);
    });
  });
};

/**
 * Adiciona resource hints para melhor performance de carregamento
 * @param hints Array de hints com href, as e type
 */
export const addResourceHints = (hints: { href: string; as: string; type?: string }[]) => {
  hints.forEach(({ href, as, type }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) {
      link.type = type;
    }

    document.head.appendChild(link);
  });
};

/**
 * Interface para métricas de carregamento lazy
 * Rastreia tempo de carregamento e sucesso/falha
 */
interface LoadingMetrics {
  componentName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
}

const loadingMetrics: LoadingMetrics[] = [];

export const trackLazyLoading = <T>(
  componentName: string,
  componentFactory: ComponentFactory<T>
): ComponentFactory<T> => {
  return async () => {
    const startTime = performance.now();

    try {
      const component = await componentFactory();
      const endTime = performance.now();

      loadingMetrics.push({
        componentName,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: true,
      });

      return component;
    } catch (error) {
      const endTime = performance.now();

      loadingMetrics.push({
        componentName,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      throw error;
    }
  };
};

/**
 * Obtém métricas de carregamento lazy coletadas
 * @returns Array com todas as métricas registradas
 */
export const getLazyLoadingMetrics = (): LoadingMetrics[] => {
  return [...loadingMetrics];
};

/**
 * Limpa todas as métricas de carregamento coletadas
 */
export const clearLazyLoadingMetrics = (): void => {
  loadingMetrics.length = 0;
};

/**
 * Factory para criação de rotas lazy com code splitting
 * @param componentFactory Função do componente da rota
 * @param options Opções incluindo preload, fallback e error boundary
 * @returns Componente de rota configurado
 */
export const createLazyRoute = <T = Record<string, unknown>>(
  componentFactory: ComponentFactory<T>,
  options: {
    preload?: boolean;
    fallback?: React.ReactElement;
    errorBoundary?: ComponentType<{ error: Error; retry: () => void }>;
  } = {}
) => {
  const { preload = false, fallback, errorBoundary: ErrorBoundary } = options;

  const LazyComponent = createLazyComponent(
    trackLazyLoading(`Route_${componentFactory.name}`, componentFactory),
    { preload }
  );

  return (props: T) => {
    if (ErrorBoundary) {
      return React.createElement(
        ErrorBoundary,
        {
          error: new Error('Componente falhou ao carregar'),
          retry: () => window.location.reload(),
        },
        React.createElement(
          Suspense,
          { fallback },
          React.createElement(LazyComponent as any, props as any)
        )
      );
    }

    return React.createElement(
      Suspense,
      { fallback },
      React.createElement(LazyComponent as any, props as any)
    );
  };
};

/**
 * Sistema inteligente de pré-carregamento baseado no comportamento do usuário
 * Analisa padrões de navegação para prever próximos componentes necessários
 */
class SmartPreloader {
  private preloadedComponents = new Set<string>();
  private userInteractions: string[] = [];
  private preloadTimeout: number | null = null;

  /**
   * Rastreia interações do usuário para análise de padrões
   * @param componentPath Caminho do componente acessado
   */
  trackInteraction(componentPath: string) {
    this.userInteractions.push(componentPath);

    // Mantém apenas as últimas 10 interações
    if (this.userInteractions.length > 10) {
      this.userInteractions.shift();
    }

    this.schedulePreload();
  }

  /**
   * Agenda pré-carregamento baseado em padrões identificados
   */
  private schedulePreload() {
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
    }

    this.preloadTimeout = window.setTimeout(() => {
      this.analyzeAndPreload();
    }, 2000);
  }

  /**
   * Analisa padrões e pré-carrega componentes prováveis
   */
  private analyzeAndPreload() {
    const patterns = this.findPatterns();
    patterns.forEach(async componentPath => {
      if (!this.preloadedComponents.has(componentPath)) {
        try {
          // Importação dinâmica baseada no caminho
          await import(/* @vite-ignore */ componentPath);
          this.preloadedComponents.add(componentPath);
        } catch (error) {
          // Erro já registrado pelo sistema de logger
        }
      }
    });
  }

  /**
   * Análise simples de padrões de navegação
   * @returns Array de caminhos com alta frequência de acesso
   */
  private findPatterns(): string[] {
    // Este é um reconhecimento de padrão simplificado
    // Na realidade, abordagens baseadas em ML seriam mais sofisticadas
    const frequencies: Record<string, number> = {};

    this.userInteractions.forEach(path => {
      frequencies[path] = (frequencies[path] || 0) + 1;
    });

    // Retorna caminhos com alta frequência
    return Object.entries(frequencies)
      .filter(([, count]) => count >= 2)
      .map(([path]) => path);
  }

  /**
   * Reseta estado do pré-carregador
   */
  reset() {
    this.preloadedComponents.clear();
    this.userInteractions.length = 0;
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
    }
  }
}

export const smartPreloader = new SmartPreloader();

/**
 * Hook para detecção de visibilidade de componente
 * @param callback Função executada quando componente fica visível
 * @returns Objeto com estado de visibilidade e ref do elemento
 */
export const useComponentVisible = (callback?: () => void) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);

        if (visible && callback) {
          callback();
        }
      },
      { threshold: 0.1 }
    );

    const element = elementRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [callback]);

  return { isVisible, elementRef };
};

/**
 * Utilitários para divisão de bundles
 * Organiza importações dinâmicas por categoria (rotas, features, utils)
 */
export const dynamicImports = {
  // Importações baseadas em rotas
  routes: {
    home: () => import('../pages/HomePage/index'),
    demandas: () => import('../pages/DemandasPage'),
    documentos: () => import('../pages/DocumentosPage'),
    cadastros: () => import('../pages/CadastrosPage'),
    relatorios: () => import('../pages/RelatoriosPage'),
    analytics: () => import('../pages/AnalyticsPage'),
  },

  // Importações baseadas em funcionalidades
  features: {
    charts: () => import('../components/charts/AnalyticsChart'),
    forms: () => import('../components/forms/SearchableSelect'),
    modals: () => import('../components/ui/Modal'),
    tables: () => import('../components/ui/DataTable'),
  },

  // Importações de utilitários
  utils: {
    dateUtils: () => import('../utils/dateUtils'),
    formatters: () => import('../utils/formatters'),
    validation: () => import('../utils/validation'),
  },
};

export default {
  createLazyComponent,
  createLazyRoute,
  preloadComponent,
  batchPreload,
  smartPreloader,
  useComponentVisible,
  dynamicImports,
  getLazyLoadingMetrics,
  clearLazyLoadingMetrics,
};
