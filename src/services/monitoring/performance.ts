/**
 * Performance Monitoring Service
 * Real-time performance tracking and optimization recommendations
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
  reportInterval: 30000, // 30 seconds
};

/**
 * Performance Monitoring Service
 */
class PerformanceMonitoringService {
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private reportTimer: number | null = null;
  private startTime: number;

  // Core Web Vitals storage
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
   * Initialize performance monitoring
   */
  private initialize(): void {
    // Core Web Vitals monitoring
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();

    // Resource timing
    if (this.config.collectResourceTiming) {
      this.observeResourceTiming();
    }

    // Long tasks
    if (this.config.collectLongTasks) {
      this.observeLongTasks();
    }

    // Navigation timing
    this.observeNavigationTiming();

    // Memory usage
    this.observeMemoryUsage();

    // Frame timing
    this.observeFrameTiming();

    // Start periodic reporting
    this.startPeriodicReporting();

    console.log('📊 Performance monitoring initialized');
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   */
  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) {return;}

    try {
      const observer = new PerformanceObserver((list) => {
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
      console.warn('LCP observation not supported:', error);
    }
  }

  /**
   * Observe First Input Delay (FID)
   */
  private observeFID(): void {
    if (!('PerformanceObserver' in window)) {return;}

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.fid = entry.processingStart - entry.startTime;
          this.addMetric({
            name: 'fid',
            value: this.fid,
            unit: 'ms',
            threshold: { good: 100, needs_improvement: 300, poor: Infinity },
            context: {
              name: entry.name,
              startTime: entry.startTime,
              processingStart: entry.processingStart,
            },
          });
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID observation not supported:', error);
    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS)
   */
  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) {return;}

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            this.cls += entry.value;
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
      console.warn('CLS observation not supported:', error);
    }
  }

  /**
   * Observe First Contentful Paint (FCP)
   */
  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) {return;}

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
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
      console.warn('FCP observation not supported:', error);
    }
  }

  /**
   * Observe Time to First Byte (TTFB)
   */
  private observeTTFB(): void {
    if (!('PerformanceObserver' in window)) {return;}

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.entryType === 'navigation') {
            this.ttfb = entry.responseStart - entry.requestStart;
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
      console.warn('TTFB observation not supported:', error);
    }
  }

  /**
   * Observe resource timing
   */
  private observeResourceTiming(): void {
    if (!('PerformanceObserver' in window)) {return;}

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        
        entries.forEach((entry) => {
          const duration = entry.responseEnd - entry.startTime;
          const size = entry.transferSize || 0;
          
          // Track slow resources
          if (duration > 1000) { // Slower than 1 second
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

          // Track large resources
          if (size > 500000) { // Larger than 500KB
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
      console.warn('Resource timing observation not supported:', error);
    }
  }

  /**
   * Observe long tasks
   */
  private observeLongTasks(): void {
    if (!('PerformanceObserver' in window)) {return;}

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
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
      console.warn('Long task observation not supported:', error);
    }
  }

  /**
   * Observe navigation timing
   */
  private observeNavigationTiming(): void {
    // Use requestIdleCallback to avoid blocking main thread
    const callback = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        // DNS lookup time
        const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart;
        this.addMetric({
          name: 'dns_lookup',
          value: dnsTime,
          unit: 'ms',
          threshold: { good: 100, needs_improvement: 500, poor: Infinity },
        });

        // TCP connection time
        const tcpTime = navigation.connectEnd - navigation.connectStart;
        this.addMetric({
          name: 'tcp_connection',
          value: tcpTime,
          unit: 'ms',
          threshold: { good: 100, needs_improvement: 300, poor: Infinity },
        });

        // DOM processing time
        const domTime = navigation.domComplete - navigation.domLoading;
        this.addMetric({
          name: 'dom_processing',
          value: domTime,
          unit: 'ms',
          threshold: { good: 1500, needs_improvement: 3000, poor: Infinity },
        });

        // Total page load time
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
   * Observe memory usage
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

    // Measure every 10 seconds
    setInterval(measureMemory, 10000);
    measureMemory(); // Initial measurement
  }

  /**
   * Observe frame timing
   */
  private observeFrameTiming(): void {
    let frames = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) { // Every second
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
   * Add performance metric
   */
  private addMetric(metric: Omit<PerformanceMetric, 'timestamp' | 'score'>): void {
    const score = this.calculateScore(metric.value, metric.threshold);
    
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
      score,
    };

    this.metrics.push(fullMetric);

    // Limit stored metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-800); // Keep last 800
    }
  }

  /**
   * Calculate performance score
   */
  private calculateScore(value: number, threshold?: PerformanceMetric['threshold']): PerformanceMetric['score'] {
    if (!threshold) {return 'good';}

    if (value <= threshold.good) {return 'good';}
    if (value <= threshold.needs_improvement) {return 'needs_improvement';}
    return 'poor';
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) {return 'script';}
    if (url.includes('.css')) {return 'stylesheet';}
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/.exec(url)) {return 'image';}
    if (/\.(woff|woff2|ttf|otf)$/.exec(url)) {return 'font';}
    if (url.includes('/api/') || url.includes('fetch')) {return 'xhr';}
    return 'other';
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const now = Date.now();
    const duration = now - this.startTime;

    // Get resource timing
    const resourceTiming = this.getResourceTimingData();

    // Core Web Vitals
    const coreWebVitals = {
      lcp: this.lcp ? this.createMetric('lcp', this.lcp, 'ms', { good: 2500, needs_improvement: 4000, poor: Infinity }) : null,
      fid: this.fid ? this.createMetric('fid', this.fid, 'ms', { good: 100, needs_improvement: 300, poor: Infinity }) : null,
      cls: this.createMetric('cls', this.cls, 'score', { good: 0.1, needs_improvement: 0.25, poor: Infinity }),
      fcp: this.fcp ? this.createMetric('fcp', this.fcp, 'ms', { good: 1800, needs_improvement: 3000, poor: Infinity }) : null,
      ttfb: this.ttfb ? this.createMetric('ttfb', this.ttfb, 'ms', { good: 800, needs_improvement: 1800, poor: Infinity }) : null,
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(coreWebVitals, resourceTiming);

    // Calculate overall score
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
   * Get resource timing data
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
   * Create metric object
   */
  private createMetric(name: string, value: number, unit: string, threshold: PerformanceMetric['threshold']): PerformanceMetric {
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
   * Generate performance recommendations
   */
  private generateRecommendations(coreWebVitals: PerformanceReport['coreWebVitals'], resourceTiming: PerformanceReport['resourceTiming']): string[] {
    const recommendations: string[] = [];

    // LCP recommendations
    if (coreWebVitals.lcp && coreWebVitals.lcp.score !== 'good') {
      recommendations.push('Optimize Largest Contentful Paint: reduce server response times, optimize images, remove render-blocking resources');
    }

    // FID recommendations
    if (coreWebVitals.fid && coreWebVitals.fid.score !== 'good') {
      recommendations.push('Improve First Input Delay: break up long tasks, optimize JavaScript execution, use web workers');
    }

    // CLS recommendations
    if (coreWebVitals.cls.score !== 'good') {
      recommendations.push('Reduce Cumulative Layout Shift: set dimensions for images/videos, avoid inserting content above existing content');
    }

    // FCP recommendations
    if (coreWebVitals.fcp && coreWebVitals.fcp.score !== 'good') {
      recommendations.push('Improve First Contentful Paint: optimize server response, eliminate render-blocking resources, minify CSS');
    }

    // Resource recommendations
    const largeScripts = resourceTiming.scripts.filter(s => (s.transferSize || 0) > 200000);
    if (largeScripts.length > 0) {
      recommendations.push(`Split large JavaScript bundles (${largeScripts.length} scripts > 200KB detected)`);
    }

    const slowImages = resourceTiming.images.filter(i => (i.responseEnd - i.startTime) > 2000);
    if (slowImages.length > 0) {
      recommendations.push(`Optimize slow-loading images (${slowImages.length} images taking > 2s)`);
    }

    const uncompressedResources = [...resourceTiming.scripts, ...resourceTiming.stylesheets]
      .filter(r => r.transferSize && r.decodedBodySize && r.transferSize > r.decodedBodySize * 0.9);
    if (uncompressedResources.length > 0) {
      recommendations.push('Enable compression for text resources (Gzip/Brotli)');
    }

    return recommendations;
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallScore(coreWebVitals: PerformanceReport['coreWebVitals']): number {
    const metrics = Object.values(coreWebVitals).filter(Boolean) as PerformanceMetric[];
    
    if (metrics.length === 0) {return 50;}

    const scores = metrics.map(metric => {
      switch (metric.score) {
        case 'good': return 100;
        case 'needs_improvement': return 60;
        case 'poor': return 20;
        default: return 50;
      }
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  /**
   * Start periodic reporting
   */
  private startPeriodicReporting(): void {
    this.reportTimer = window.setInterval(() => {
      const report = this.generateReport();
      
      // Log performance status
      console.log(`⚡ Performance Score: ${report.score}/100`, {
        lcp: report.coreWebVitals.lcp?.score,
        fid: report.coreWebVitals.fid?.score,
        cls: report.coreWebVitals.cls.score,
        recommendations: report.recommendations.length,
      });

      // Send to external service if configured
      if (this.config.endpoint) {
        this.sendReport(report);
      }
    }, this.config.reportInterval);
  }

  /**
   * Send report to external service
   */
  private async sendReport(report: PerformanceReport): Promise<void> {
    if (!this.config.endpoint) {return;}

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.error('Failed to send performance report:', error);
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Clear timer
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }

    console.log('📊 Performance monitoring stopped');
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

// Create singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();

// Utility functions for performance monitoring (React hook would be implemented separately)
export const getPerformanceUtils = () => {
  return {
    generateReport: performanceMonitoringService.generateReport.bind(performanceMonitoringService),
    getMetrics: performanceMonitoringService.getMetrics.bind(performanceMonitoringService),
    clearMetrics: performanceMonitoringService.clearMetrics.bind(performanceMonitoringService),
  };
};

export default performanceMonitoringService;