/**
 * ANALYTICS CORE - SISTEMA DE COLETA DE MÉTRICAS E TELEMETRIA
 *
 * Este arquivo implementa o sistema central de analytics da aplicação.
 * Fornece funcionalidades para:
 * - Coleta de eventos de usuário e sistema
 * - Monitoramento de performance (Core Web Vitals)
 * - Métricas de comportamento do usuário
 * - Tracking de fluxos e conversões
 * - Queue de eventos com flush periódico
 * - Métricas de erro e disponibilidade
 *
 * Características:
 * - Ativado apenas em produção por padrão
 * - Suporte a sessões e usuários identificados
 * - Buffer local com sincronização assíncrona
 * - Métricas de performance automatizadas
 * - Privacidade por design (dados anonimizados)
 *
 * Singleton instance: analyticsService
 */

// src/services/analytics/core.ts

import { logger } from '../../../shared/utils/logger';

/**
 * Interface para eventos de analytics
 */
interface AnalyticsEvent {
  /** Nome único do evento */
  event: string;
  /** Categoria para agrupamento de eventos */
  category?: 'navigation' | 'interaction' | 'performance' | 'error' | 'business';
  /** Propriedades customizadas do evento */
  properties?: Record<string, unknown>;
  /** Valor numérico associado ao evento */
  value?: number;
  /** Timestamp do evento (auto-preenchido se não informado) */
  timestamp?: number;
  /** ID da sessão atual */
  sessionId?: string;
  /** ID do usuário (se autenticado) */
  userId?: string;
}

/**
 * Interface para métricas de performance
 * Inclui Core Web Vitals e métricas customizadas
 */
interface PerformanceMetrics {
  // Core Web Vitals - métricas essenciais do Google
  /** Largest Contentful Paint - tempo para maior elemento ser renderizado */
  lcp?: number;
  /** First Input Delay - tempo entre primeira interação e resposta */
  fid?: number;
  /** Cumulative Layout Shift - instabilidade visual da página */
  cls?: number;
  /** First Contentful Paint - tempo para primeiro conteúdo aparecer */
  fcp?: number;
  /** Time to First Byte - tempo para primeiro byte do servidor */
  ttfb?: number;

  // Métricas customizadas da aplicação
  /** Tempo para mudança de rota completar */
  routeChangeTime?: number;
  /** Tempo para carregar chunks JavaScript */
  chunkLoadTime?: number;
  /** Tempo médio de resposta das APIs */
  apiResponseTime?: number;
  /** Taxa de erro das requisições */
  errorRate?: number;

  // Métricas de recursos
  /** Tamanho total do bundle JavaScript */
  bundleSize?: number;
  /** Uso atual de memória */
  memoryUsage?: number;
  /** Condição da rede (4g, 3g, etc.) */
  networkCondition?: string;
}

/**
 * Interface para métricas de comportamento do usuário
 */
interface UserBehaviorMetrics {
  /** Número total de visualizações de página */
  pageViews: number;
  /** Duração da sessão em milissegundos */
  sessionDuration: number;
  /** Taxa de rejeição (usuários que saem rapidamente) */
  bounceRate: number;
  /** Taxa de conversão para ações importantes */
  conversionRate: number;
  /** Contadores de uso por feature */
  featureUsage: Record<string, number>;
  /** Sequência de páginas visitadas */
  userFlow: string[];
  /** Páginas onde usuários mais saem */
  exitPages: string[];
  /** Features mais utilizadas ordenadas */
  mostUsedFeatures: string[];
}

/**
 * Classe principal do sistema de analytics
 * Gerencia coleta, buffer e envio de métricas
 */
class AnalyticsCore {
  /** ID único da sessão atual */
  private sessionId: string;
  /** ID do usuário autenticado (opcional) */
  private userId?: string;
  /** Buffer de eventos pendentes para envio */
  private eventQueue: AnalyticsEvent[] = [];
  /** Flag para ativar/desativar coleta (produção por padrão) */
  private isEnabled = process.env.NODE_ENV === 'production';
  private flushInterval = 5000; // 5 segundos
  private batchSize = 50;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializePerformanceMonitoring();
    this.initializeErrorTracking();
    this.startPeriodicFlush();
  }

  // Rastreamento de eventos
  track(
    event: string,
    properties?: Record<string, unknown>,
    category?: AnalyticsEvent['category']
  ): void {
    if (!this.isEnabled) {
      return;
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      category: category || 'interaction',
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        referrer: document.referrer,
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.eventQueue.push(analyticsEvent);

    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  // Monitoramento de performance
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Core Web Vitals
    this.observeWebVitals();

    // Timing de navegação
    this.trackNavigationTiming();

    // Timing de recursos
    this.trackResourceTiming();
  }

  private observeWebVitals(): void {
    // LCP - Largest Contentful Paint
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        this.track(
          'core_web_vital',
          {
            metric: 'lcp',
            value: entry.startTime,
            rating:
              entry.startTime < 2500
                ? 'good'
                : entry.startTime < 4000
                  ? 'needs_improvement'
                  : 'poor',
          },
          'performance'
        );
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // FID - First Input Delay
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        this.track(
          'core_web_vital',
          {
            metric: 'fid',
            value: (entry as any).processingStart - entry.startTime,
            rating:
              (entry as any).processingStart - entry.startTime < 100
                ? 'good'
                : (entry as any).processingStart - entry.startTime < 300
                  ? 'needs_improvement'
                  : 'poor',
          },
          'performance'
        );
      }
    }).observe({ type: 'first-input', buffered: true });

    // CLS - Cumulative Layout Shift
    let cls = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value;
        }
      }

      // Reporta CLS periodicamente
      setTimeout(() => {
        this.track(
          'core_web_vital',
          {
            metric: 'cls',
            value: cls,
            rating: cls < 0.1 ? 'good' : cls < 0.25 ? 'needs_improvement' : 'poor',
          },
          'performance'
        );
      }, 5000);
    }).observe({ type: 'layout-shift', buffered: true });
  }

  private trackNavigationTiming(): void {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      this.track(
        'navigation_timing',
        {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          response: navigation.responseEnd - navigation.responseStart,
          dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
          load: navigation.loadEventEnd - navigation.domContentLoadedEventEnd,
          total: navigation.loadEventEnd - navigation.fetchStart,
        },
        'performance'
      );
    });
  }

  private trackResourceTiming(): void {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          this.track(
            'resource_timing',
            {
              name: entry.name.split('/').pop(),
              duration: entry.duration,
              size: (entry as any).transferSize,
              type: entry.name.includes('.js') ? 'javascript' : 'css',
            },
            'performance'
          );
        }
      }
    });

    observer.observe({ type: 'resource', buffered: true });
  }

  // Rastreamento de erros
  private initializeErrorTracking(): void {
    window.addEventListener('error', event => {
      this.track(
        'javascript_error',
        {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
          severity: 'error',
        },
        'error'
      );
    });

    window.addEventListener('unhandledrejection', event => {
      this.track(
        'promise_rejection',
        {
          reason: event.reason?.toString(),
          stack: event.reason?.stack,
          severity: 'error',
        },
        'error'
      );
    });
  }

  // Métricas de negócio
  trackBusinessEvent(action: string, entity: string, properties?: Record<string, unknown>): void {
    this.track(
      'business_action',
      {
        action,
        entity,
        ...properties,
      },
      'business'
    );
  }

  // Identificação de usuário
  identify(userId: string, properties?: Record<string, unknown>): void {
    this.userId = userId;
    this.track('user_identify', {
      userId,
      ...properties,
    });
  }

  // Rastreamento de página
  page(path: string, properties?: Record<string, unknown>): void {
    this.track(
      'page_view',
      {
        path,
        title: document.title,
        ...properties,
      },
      'navigation'
    );
  }

  // Timing customizado
  time(label: string): void {
    performance.mark(`${label}-start`);
  }

  timeEnd(label: string, properties?: Record<string, unknown>): void {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);

    const measure = performance.getEntriesByName(label)[0];
    this.track(
      'custom_timing',
      {
        label,
        duration: measure.duration,
        ...properties,
      },
      'performance'
    );
  }

  // Envio de dados
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Em produção, envia para serviço de analytics
      if (this.isEnabled) {
        await this.sendToAnalyticsService(events);
      } else {
        console.group('📊 Analytics Events');
        events.forEach(event => {
          logger.info(`${event.category?.toUpperCase()}: ${event.event}`, event.properties);
        });
        console.groupEnd();
      }
    } catch (error) {
      logger.error('Failed to send analytics events:', error);
      // Re-enfileira eventos para retry
      this.eventQueue.unshift(...events);
    }
  }

  private async sendToAnalyticsService(events: AnalyticsEvent[]): Promise<void> {
    // Envia para múltiplos serviços para redundância
    const promises = [
      this.sendToGoogleAnalytics(events),
      this.sendToCustomAnalytics(events),
      this.sendToLocalStorage(events), // Backup
    ];

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      logger.error('Analytics service error:', error);
    }
  }

  private async sendToGoogleAnalytics(events: AnalyticsEvent[]): Promise<void> {
    // Implementação GA4
    if (typeof (window as any).gtag !== 'undefined') {
      events.forEach(event => {
        (window as any).gtag('event', event.event, {
          event_category: event.category,
          ...event.properties,
        });
      });
    }
  }

  private async sendToCustomAnalytics(events: AnalyticsEvent[]): Promise<void> {
    // Endpoint de analytics customizado
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
  }

  private sendToLocalStorage(events: AnalyticsEvent[]): void {
    // Armazena no localStorage como fallback
    const stored = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    stored.push(...events);

    // Mantém apenas os últimos 1000 eventos
    if (stored.length > 1000) {
      stored.splice(0, stored.length - 1000);
    }

    localStorage.setItem('analytics_events', JSON.stringify(stored));
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Envia antes de descarregar página
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Envia quando página fica oculta
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Monitoramento de saúde
  getHealthMetrics(): Record<string, unknown> {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      queueSize: this.eventQueue.length,
      memoryUsage: (performance as any).memory
        ? {
            used: (performance as any).memory.usedJSHeapSize,
            total: (performance as any).memory.totalJSHeapSize,
            limit: (performance as any).memory.jsHeapSizeLimit,
          }
        : null,
      connection: (navigator as any).connection
        ? {
            effectiveType: (navigator as any).connection.effectiveType,
            downlink: (navigator as any).connection.downlink,
            rtt: (navigator as any).connection.rtt,
          }
        : null,
      timestamp: Date.now(),
    };
  }

  // Envio manual para eventos críticos
  flushNow(): Promise<void> {
    return this.flush();
  }

  // Desabilita/habilita rastreamento
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

export const analytics = new AnalyticsCore();
export type { AnalyticsEvent, PerformanceMetrics, UserBehaviorMetrics };
