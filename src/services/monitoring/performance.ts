/**
 * ================================================================
 * PERFORMANCE MONITORING - SISTEMA DE MONITORAMENTO DE PERFORMANCE
 * ================================================================
 *
 * Este arquivo implementa um sistema completo de monitoramento de performance
 * em tempo real, coletando Core Web Vitals, métricas de recursos e fornecendo
 * recomendações automatizadas para otimização da experiência do usuário.
 *
 * Funcionalidades principais:
 * - Coleta automática de Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
 * - Monitoramento de resource timing e long tasks
 * - Análise de uso de memória e frame rate (FPS)
 * - Detecção de recursos lentos e grandes
 * - Geração automática de recomendações de otimização
 * - Relatórios periódicos de performance com scoring
 * - Envio de métricas para serviços externos de análise
 *
 * Core Web Vitals monitorados:
 * - LCP (Largest Contentful Paint): Tempo até maior elemento visível
 * - FID (First Input Delay): Latência da primeira interação
 * - CLS (Cumulative Layout Shift): Estabilidade visual da página
 * - FCP (First Contentful Paint): Tempo até primeiro conteúdo
 * - TTFB (Time To First Byte): Tempo de resposta do servidor
 *
 * Métricas adicionais coletadas:
 * - Resource timing: Scripts, stylesheets, imagens, fontes
 * - Long tasks: Tarefas que bloqueiam thread principal
 * - Navigation timing: DNS, TCP, DOM processing
 * - Memory usage: Uso de heap JavaScript
 * - Frame timing: Taxa de frames por segundo (FPS)
 *
 * Sistema de scoring:
 * - Good (Verde): Performance excelente (90-100 pontos)
 * - Needs Improvement (Amarelo): Performance aceitável (50-89 pontos)
 * - Poor (Vermelho): Performance ruim (0-49 pontos)
 *
 * Recomendações automatizadas:
 * - Otimização de LCP: Server response, imagens, recursos bloqueantes
 * - Melhoria de FID: Long tasks, JavaScript, web workers
 * - Redução de CLS: Dimensões de elementos, inserção de conteúdo
 * - Compressão de recursos: Gzip/Brotli para arquivos texto
 * - Code splitting: Divisão de bundles JavaScript grandes
 *
 * Integração com navegador:
 * - Performance Observer API: Coleta nativa de métricas
 * - Resource Timing API: Análise detalhada de recursos
 * - Navigation Timing API: Métricas de carregamento de página
 * - Memory API: Monitoramento de uso de memória
 *
 * Padrões implementados:
 * - Observer pattern para métricas do navegador
 * - Strategy pattern para diferentes tipos de coleta
 * - Throttling pattern para controle de frequência
 * - Singleton pattern para instância global
 *
 * @fileoverview Sistema completo de monitoramento de performance
 * @version 2.0.0
 * @since 2024-01-29
 * @author Synapse Team
 */

import { logger } from '../../utils/logger';

/**
 * Interface que define uma métrica de performance individual
 * Representa uma medição específica com contexto e avaliação de qualidade
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  threshold?: {
    good: number;
    needs_improvement: number;
    poor: number;
  };
  score: 'good' | 'needs_improvement' | 'poor';
  context?: Record<string, any>;
}

/**
 * Interface para relatório completo de performance
 * Agrega todas as métricas coletadas com análise e recomendações
 */
export interface PerformanceReport {
  timestamp: number;
  duration: number;
  metrics: PerformanceMetric[];
  coreWebVitals: {
    lcp: PerformanceMetric | null; // Largest Contentful Paint
    fid: PerformanceMetric | null; // First Input Delay
    cls: PerformanceMetric | null; // Cumulative Layout Shift
    fcp: PerformanceMetric | null; // First Contentful Paint
    ttfb: PerformanceMetric | null; // Time to First Byte
  };
  resourceTiming: {
    scripts: PerformanceResourceTiming[];
    stylesheets: PerformanceResourceTiming[];
    images: PerformanceResourceTiming[];
    fonts: PerformanceResourceTiming[];
    xhr: PerformanceResourceTiming[];
  };
  recommendations: string[];
  score: number; // 0-100
}

/**
 * Interface de configuração do sistema de monitoramento
 * Define quais métricas coletar e como reportar os dados
 */
export interface PerformanceConfig {
  enabled: boolean;
  collectResourceTiming: boolean;
  collectLongTasks: boolean;
  collectLayoutShifts: boolean;
  reportInterval: number;
  endpoint?: string;
}

const defaultConfig: PerformanceConfig = {
  enabled: true,
  collectResourceTiming: true,
  collectLongTasks: true,
  collectLayoutShifts: true,
  reportInterval: 30000, // 30 segundos
};

/**
 * Classe principal do serviço de monitoramento de performance
 *
 * Implementa coleta automática de métricas de performance usando APIs nativas
 * do navegador e fornece análise inteligente com recomendações de otimização.
 *
 * Funcionalidades:
 * - Coleta passiva de Core Web Vitals via Performance Observer
 * - Monitoramento contínuo de recursos e long tasks
 * - Análise de padrões de performance e detecção de problemas
 * - Geração de relatórios consolidados com scoring
 * - Recomendações automatizadas baseadas em thresholds
 * - Envio periódico de dados para análise externa
 *
 * @example
 * ```typescript
 * const monitor = new PerformanceMonitoringService({
 *   collectResourceTiming: true,
 *   collectLongTasks: true,
 *   reportInterval: 30000
 * });
 *
 * // Obter relatório atual
 * const report = monitor.generateReport();
 * console.log('Score:', report.score);
 * console.log('Recomendações:', report.recommendations);
 * ```
 */
class PerformanceMonitoringService {
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private reportTimer: number | null = null;
  private startTime: number;

  // Armazenamento Core Web Vitals
  private lcp: number | null = null;
  private fid: number | null = null;
  private cls = 0;
  private fcp: number | null = null;
  private ttfb: number | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.startTime = performance.now();

    if (this.config.enabled) {
      this.initialize();
    }
  }

  /**
   * Inicializa todos os observers de performance
   *
   * Configura monitoramento para Core Web Vitals, resource timing,
   * long tasks, navigation timing, memória e frame rate.
   *
   * @private
   */
  private initialize(): void {
    // Monitoramento Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();

    // Timing de recursos
    if (this.config.collectResourceTiming) {
      this.observeResourceTiming();
    }

    // Tarefas longas
    if (this.config.collectLongTasks) {
      this.observeLongTasks();
    }

    // Timing de navegação
    this.observeNavigationTiming();

    // Uso de memória
    this.observeMemoryUsage();

    // Timing de frames
    this.observeFrameTiming();

    // Inicia relatório periódico
    this.startPeriodicReporting();

    logger.info('📊 Performance monitoring initialized');
  }

  /**
   * Configura observação do Largest Contentful Paint (LCP)
   *
   * LCP mede o tempo até o maior elemento de conteúdo ficar visível.
   * Indica quando o conteúdo principal da página foi carregado.
   *
   * @private
   */
  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        if (lastEntry) {
          this.lcp = lastEntry.startTime;
          this.addMetric({
            name: 'lcp',
            value: lastEntry.startTime,
            unit: 'ms',
            threshold: { good: 2500, needs_improvement: 4000, poor: Infinity },
          });
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Observação LCP não suportada:', error);
    }
  }

  /**
   * Configura observação do First Input Delay (FID)
   *
   * FID mede a latência da primeira interação do usuário.
   * Indica responsividade da página a interações.
   *
   * @private
   */
  private observeFID(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          const firstInputEntry = entry as any;
          this.fid = firstInputEntry.processingStart - entry.startTime;
          this.addMetric({
            name: 'fid',
            value: this.fid,
            unit: 'ms',
            threshold: { good: 100, needs_improvement: 300, poor: Infinity },
            context: {
              name: entry.name,
              startTime: entry.startTime,
              processingStart: firstInputEntry.processingStart,
            },
          });
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Observação FID não suportada:', error);
    }
  }

  /**
   * Configura observação do Cumulative Layout Shift (CLS)
   *
   * CLS mede a estabilidade visual da página durante carregamento.
   * Detecta mudanças inesperadas de layout.
   *
   * @private
   */
  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          const layoutShiftEntry = entry as any;
          if (!layoutShiftEntry.hadRecentInput) {
            this.cls += layoutShiftEntry.value;
          }
        });

        this.addMetric({
          name: 'cls',
          value: this.cls,
          unit: 'score',
          threshold: { good: 0.1, needs_improvement: 0.25, poor: Infinity },
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Observação CLS não suportada:', error);
    }
  }

  /**
   * Configura observação do First Contentful Paint (FCP)
   *
   * FCP mede o tempo até o primeiro conteúdo ser renderizado.
   * Indica quando usuário percebe que página está carregando.
   *
   * @private
   */
  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.fcp = entry.startTime;
            this.addMetric({
              name: 'fcp',
              value: entry.startTime,
              unit: 'ms',
              threshold: { good: 1800, needs_improvement: 3000, poor: Infinity },
            });
          }
        });
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Observação FCP não suportada:', error);
    }
  }

  /**
   * Configura observação do Time to First Byte (TTFB)
   *
   * TTFB mede latência de rede do servidor.
   * Indica performance do backend e infraestrutura.
   *
   * @private
   */
  private observeTTFB(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          if (entry.entryType === 'navigation') {
            const navigationEntry = entry as PerformanceNavigationTiming;
            this.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
            this.addMetric({
              name: 'ttfb',
              value: this.ttfb,
              unit: 'ms',
              threshold: { good: 800, needs_improvement: 1800, poor: Infinity },
            });
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Observação TTFB não suportada:', error);
    }
  }

  /**
   * Configura observação de resource timing
   *
   * Monitora carregamento de recursos (scripts, CSS, imagens)
   * para detectar recursos lentos ou grandes que impactam performance.
   *
   * @private
   */
  private observeResourceTiming(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries() as PerformanceResourceTiming[];

        entries.forEach(entry => {
          const duration = entry.responseEnd - entry.startTime;
          const size = entry.transferSize || 0;

          // Rastreia recursos lentos
          if (duration > 1000) {
            // Mais lento que 1 segundo
            this.addMetric({
              name: 'slow_resource',
              value: duration,
              unit: 'ms',
              context: {
                name: entry.name,
                type: this.getResourceType(entry.name),
                size: size,
                protocol: entry.nextHopProtocol,
              },
            });
          }

          // Rastreia recursos grandes
          if (size > 500000) {
            // Maior que 500KB
            this.addMetric({
              name: 'large_resource',
              value: size,
              unit: 'bytes',
              context: {
                name: entry.name,
                type: this.getResourceType(entry.name),
                duration: duration,
              },
            });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Observação de resource timing não suportada:', error);
    }
  }

  /**
   * Configura observação de long tasks
   *
   * Detecta tarefas JavaScript que bloqueiam thread principal
   * por mais de 50ms, causando travamentos na interface.
   *
   * @private
   */
  private observeLongTasks(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          this.addMetric({
            name: 'long_task',
            value: entry.duration,
            unit: 'ms',
            threshold: { good: 50, needs_improvement: 100, poor: Infinity },
            context: {
              name: entry.name,
              startTime: entry.startTime,
            },
          });
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Observação de long task não suportada:', error);
    }
  }

  /**
   * Configura observação de navigation timing
   *
   * Coleta métricas detalhadas do processo de navegação
   * incluindo DNS, TCP, processamento DOM e carregamento.
   *
   * @private
   */
  private observeNavigationTiming(): void {
    // Usa requestIdleCallback para evitar bloquear thread principal
    const callback = () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        // Tempo de lookup DNS
        const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart;
        this.addMetric({
          name: 'dns_lookup',
          value: dnsTime,
          unit: 'ms',
          threshold: { good: 100, needs_improvement: 500, poor: Infinity },
        });

        // Tempo de conexão TCP
        const tcpTime = navigation.connectEnd - navigation.connectStart;
        this.addMetric({
          name: 'tcp_connection',
          value: tcpTime,
          unit: 'ms',
          threshold: { good: 100, needs_improvement: 300, poor: Infinity },
        });

        // Tempo de processamento DOM
        const domTime = navigation.domComplete - (navigation as any).domLoading;
        this.addMetric({
          name: 'dom_processing',
          value: domTime,
          unit: 'ms',
          threshold: { good: 1500, needs_improvement: 3000, poor: Infinity },
        });

        // Tempo total de carregamento da página
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        this.addMetric({
          name: 'page_load_time',
          value: loadTime,
          unit: 'ms',
          threshold: { good: 2000, needs_improvement: 4000, poor: Infinity },
        });
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback);
    } else {
      setTimeout(callback, 0);
    }
  }

  /**
   * Configura monitoramento de uso de memória JavaScript
   *
   * Acompanha uso de heap para detectar vazamentos de memória
   * e consumo excessivo que pode causar lentidão.
   *
   * @private
   */
  private observeMemoryUsage(): void {
    const measureMemory = () => {
      const memory = (performance as any).memory;

      if (memory) {
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        const percentage = (usedMB / totalMB) * 100;

        this.addMetric({
          name: 'memory_usage',
          value: percentage,
          unit: '%',
          threshold: { good: 50, needs_improvement: 80, poor: Infinity },
          context: {
            used: usedMB,
            total: totalMB,
          },
        });
      }
    };

    // Mede a cada 10 segundos
    setInterval(measureMemory, 10000);
    measureMemory(); // Medição inicial
  }

  /**
   * Configura monitoramento de frame rate (FPS)
   *
   * Mede taxa de frames por segundo para detectar
   * travamentos e problemas de fluidez na interface.
   *
   * @private
   */
  private observeFrameTiming(): void {
    let frames = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        // A cada segundo
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));

        this.addMetric({
          name: 'fps',
          value: fps,
          unit: 'fps',
          threshold: { good: 55, needs_improvement: 30, poor: 0 },
        });

        frames = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Adiciona nova métrica ao sistema de monitoramento
   *
   * Calcula score baseado em thresholds e armazena com timestamp.
   * Limita número de métricas armazenadas para controle de memória.
   *
   * @param metric - Dados da métrica sem timestamp e score
   * @private
   */
  private addMetric(metric: Omit<PerformanceMetric, 'timestamp' | 'score'>): void {
    const score = this.calculateScore(metric.value, metric.threshold);

    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
      score,
    };

    this.metrics.push(fullMetric);

    // Limita métricas armazenadas
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-800); // Mantém últimas 800
    }
  }

  /**
   * Calcula score de performance baseado em thresholds
   *
   * @param value - Valor medido da métrica
   * @param threshold - Thresholds para classificação
   * @returns Classificação da performance (good/needs_improvement/poor)
   * @private
   */
  private calculateScore(
    value: number,
    threshold?: PerformanceMetric['threshold']
  ): PerformanceMetric['score'] {
    if (!threshold) {
      return 'good';
    }

    if (value <= threshold.good) {
      return 'good';
    }
    if (value <= threshold.needs_improvement) {
      return 'needs_improvement';
    }
    return 'poor';
  }

  /**
   * Identifica tipo de recurso baseado na URL
   *
   * @param url - URL do recurso
   * @returns Tipo do recurso (script/stylesheet/image/font/xhr/other)
   * @private
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) {
      return 'script';
    }
    if (url.includes('.css')) {
      return 'stylesheet';
    }
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/.exec(url)) {
      return 'image';
    }
    if (/\.(woff|woff2|ttf|otf)$/.exec(url)) {
      return 'font';
    }
    if (url.includes('/api/') || url.includes('fetch')) {
      return 'xhr';
    }
    return 'other';
  }

  /**
   * Gera relatório completo de performance
   *
   * Consolida todas as métricas coletadas, calcula Core Web Vitals,
   * analisa resource timing e gera recomendações automáticas.
   *
   * @returns Relatório completo com métricas, análise e recomendações
   *
   * @example
   * ```typescript
   * const report = monitor.generateReport();
   *
   * console.log('Score geral:', report.score);
   * console.log('LCP:', report.coreWebVitals.lcp?.value + 'ms');
   * console.log('Recomendações:', report.recommendations.length);
   *
   * report.recommendations.forEach(rec => {
   *   console.log('- ' + rec);
   * });
   * ```
   */
  generateReport(): PerformanceReport {
    const now = Date.now();
    const duration = now - this.startTime;

    // Obtém timing de recursos
    const resourceTiming = this.getResourceTimingData();

    // Core Web Vitals
    const coreWebVitals = {
      lcp: this.lcp
        ? this.createMetric('lcp', this.lcp, 'ms', {
            good: 2500,
            needs_improvement: 4000,
            poor: Infinity,
          })
        : null,
      fid: this.fid
        ? this.createMetric('fid', this.fid, 'ms', {
            good: 100,
            needs_improvement: 300,
            poor: Infinity,
          })
        : null,
      cls: this.createMetric('cls', this.cls, 'score', {
        good: 0.1,
        needs_improvement: 0.25,
        poor: Infinity,
      }),
      fcp: this.fcp
        ? this.createMetric('fcp', this.fcp, 'ms', {
            good: 1800,
            needs_improvement: 3000,
            poor: Infinity,
          })
        : null,
      ttfb: this.ttfb
        ? this.createMetric('ttfb', this.ttfb, 'ms', {
            good: 800,
            needs_improvement: 1800,
            poor: Infinity,
          })
        : null,
    };

    // Gera recomendações
    const recommendations = this.generateRecommendations(coreWebVitals, resourceTiming);

    // Calcula score geral
    const score = this.calculateOverallScore(coreWebVitals);

    return {
      timestamp: now,
      duration,
      metrics: [...this.metrics],
      coreWebVitals,
      resourceTiming,
      recommendations,
      score,
    };
  }

  /**
   * Coleta dados de resource timing organizados por tipo
   *
   * @returns Recursos categorizados por tipo
   * @private
   */
  private getResourceTimingData() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    return {
      scripts: resources.filter(r => this.getResourceType(r.name) === 'script'),
      stylesheets: resources.filter(r => this.getResourceType(r.name) === 'stylesheet'),
      images: resources.filter(r => this.getResourceType(r.name) === 'image'),
      fonts: resources.filter(r => this.getResourceType(r.name) === 'font'),
      xhr: resources.filter(r => this.getResourceType(r.name) === 'xhr'),
    };
  }

  /**
   * Cria objeto de métrica com score calculado
   *
   * @param name - Nome da métrica
   * @param value - Valor medido
   * @param unit - Unidade de medida
   * @param threshold - Thresholds para avaliação
   * @returns Objeto de métrica completo
   * @private
   */
  private createMetric(
    name: string,
    value: number,
    unit: string,
    threshold: PerformanceMetric['threshold']
  ): PerformanceMetric {
    return {
      name,
      value,
      unit,
      threshold,
      score: this.calculateScore(value, threshold),
      timestamp: Date.now(),
    };
  }

  /**
   * Gera recomendações automatizadas baseadas nas métricas
   *
   * Analisa Core Web Vitals e resource timing para identificar
   * problemas e sugerir otimizações específicas.
   *
   * @param coreWebVitals - Métricas dos Core Web Vitals
   * @param resourceTiming - Dados de timing dos recursos
   * @returns Array de recomendações de otimização
   * @private
   */
  private generateRecommendations(
    coreWebVitals: PerformanceReport['coreWebVitals'],
    resourceTiming: PerformanceReport['resourceTiming']
  ): string[] {
    const recommendations: string[] = [];

    // LCP recommendations
    if (coreWebVitals.lcp && coreWebVitals.lcp.score !== 'good') {
      recommendations.push(
        'Otimize Largest Contentful Paint: reduza tempos de resposta do servidor, otimize imagens, remova recursos que bloqueiam renderização'
      );
    }

    // FID recommendations
    if (coreWebVitals.fid && coreWebVitals.fid.score !== 'good') {
      recommendations.push(
        'Melhore First Input Delay: divida tarefas longas, otimize execução JavaScript, use web workers'
      );
    }

    // CLS recommendations
    if (coreWebVitals.cls && coreWebVitals.cls.score !== 'good') {
      recommendations.push(
        'Reduza Cumulative Layout Shift: defina dimensões para imagens/vídeos, evite inserir conteúdo acima do existente'
      );
    }

    // FCP recommendations
    if (coreWebVitals.fcp && coreWebVitals.fcp.score !== 'good') {
      recommendations.push(
        'Melhore First Contentful Paint: otimize resposta do servidor, elimine recursos que bloqueiam renderização, minifique CSS'
      );
    }

    // Resource recommendations
    const largeScripts = resourceTiming.scripts.filter(s => (s.transferSize || 0) > 200000);
    if (largeScripts.length > 0) {
      recommendations.push(
        `Divida bundles JavaScript grandes (${largeScripts.length} scripts > 200KB detectados)`
      );
    }

    const slowImages = resourceTiming.images.filter(i => i.responseEnd - i.startTime > 2000);
    if (slowImages.length > 0) {
      recommendations.push(
        `Otimize imagens de carregamento lento (${slowImages.length} imagens levando > 2s)`
      );
    }

    const uncompressedResources = [...resourceTiming.scripts, ...resourceTiming.stylesheets].filter(
      r => r.transferSize && r.decodedBodySize && r.transferSize > r.decodedBodySize * 0.9
    );
    if (uncompressedResources.length > 0) {
      recommendations.push('Habilite compressão para recursos de texto (Gzip/Brotli)');
    }

    return recommendations;
  }

  /**
   * Calcula score geral baseado nos Core Web Vitals
   *
   * @param coreWebVitals - Métricas dos Core Web Vitals
   * @returns Score de 0-100 representando performance geral
   * @private
   */
  private calculateOverallScore(coreWebVitals: PerformanceReport['coreWebVitals']): number {
    const metrics = Object.values(coreWebVitals).filter(Boolean) as PerformanceMetric[];

    if (metrics.length === 0) {
      return 50;
    }

    const scores = metrics.map(metric => {
      switch (metric.score) {
        case 'good':
          return 100;
        case 'needs_improvement':
          return 60;
        case 'poor':
          return 20;
        default:
          return 50;
      }
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  /**
   * Inicia relatórios periódicos de performance
   *
   * Configura timer para gerar e enviar relatórios em intervalos
   * regulares, tanto para logging quanto para serviços externos.
   *
   * @private
   */
  private startPeriodicReporting(): void {
    this.reportTimer = window.setInterval(() => {
      const report = this.generateReport();

      // Registra status de performance
      logger.info(`⚡ Performance Score: ${report.score}/100`, {
        lcp: report.coreWebVitals.lcp?.score,
        fid: report.coreWebVitals.fid?.score,
        cls: report.coreWebVitals.cls?.score,
        recommendations: report.recommendations.length,
      });

      // Envia para serviço externo se configurado
      if (this.config.endpoint) {
        this.sendReport(report);
      }
    }, this.config.reportInterval);
  }

  /**
   * Envia relatório para serviço externo de análise
   *
   * @param report - Relatório de performance para envio
   * @returns Promise que resolve quando envio é concluído
   * @private
   */
  private async sendReport(report: PerformanceReport): Promise<void> {
    if (!this.config.endpoint) {
      return;
    }

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });
    } catch (error) {
      logger.error('Falha ao enviar relatório de performance:', error);
    }
  }

  /**
   * Para o monitoramento e libera recursos
   *
   * Desconecta todos os observers e limpa timers.
   * Usado para cleanup ao desmontar aplicação.
   *
   * @example
   * ```typescript
   * // Para monitoramento ao sair da página
   * window.addEventListener('beforeunload', () => {
   *   performanceMonitoringService.stop();
   * });
   * ```
   */
  stop(): void {
    // Desconecta observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Limpa timer
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }

    logger.info('📊 Performance monitoring stopped');
  }

  /**
   * Obtém todas as métricas coletadas atualmente
   *
   * @returns Array com cópia das métricas armazenadas
   *
   * @example
   * ```typescript
   * const metrics = monitor.getMetrics();
   * const longTasks = metrics.filter(m => m.name === 'long_task');
   * console.log('Long tasks detectadas:', longTasks.length);
   * ```
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Limpa todas as métricas armazenadas
   *
   * Útil para resetar monitoramento ou liberar memória.
   *
   * @example
   * ```typescript
   * // Reset após mudança de rota
   * monitor.clearMetrics();
   * ```
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

// Cria instância singleton
export const performanceMonitoringService = new PerformanceMonitoringService();

// Funções utilitárias para monitoramento de performance (React hook seria implementado separadamente)
export const getPerformanceUtils = () => {
  return {
    generateReport: performanceMonitoringService.generateReport.bind(performanceMonitoringService),
    getMetrics: performanceMonitoringService.getMetrics.bind(performanceMonitoringService),
    clearMetrics: performanceMonitoringService.clearMetrics.bind(performanceMonitoringService),
  };
};

export default performanceMonitoringService;
