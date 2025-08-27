// src/services/analytics/core.ts

interface AnalyticsEvent {
  event: string;
  category?: 'navigation' | 'interaction' | 'performance' | 'error' | 'business';
  properties?: Record<string, any>;
  value?: number;
  timestamp?: number;
  sessionId?: string;
  userId?: string;
}

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  routeChangeTime?: number;
  chunkLoadTime?: number;
  apiResponseTime?: number;
  errorRate?: number;
  
  // Resource metrics
  bundleSize?: number;
  memoryUsage?: number;
  networkCondition?: string;
}

interface UserBehaviorMetrics {
  pageViews: number;
  sessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  featureUsage: Record<string, number>;
  userFlow: string[];
  exitPages: string[];
  mostUsedFeatures: string[];
}

class AnalyticsCore {
  private sessionId: string;
  private userId?: string;
  private eventQueue: AnalyticsEvent[] = [];
  private isEnabled = process.env.NODE_ENV === 'production';
  private flushInterval = 5000; // 5 seconds
  private batchSize = 50;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializePerformanceMonitoring();
    this.initializeErrorTracking();
    this.startPeriodicFlush();
  }

  // Event tracking
  track(event: string, properties?: Record<string, any>, category?: AnalyticsEvent['category']): void {
    if (!this.isEnabled) {return;}

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

  // Performance monitoring
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') {return;}

    // Core Web Vitals
    this.observeWebVitals();
    
    // Navigation timing
    this.trackNavigationTiming();
    
    // Resource timing
    this.trackResourceTiming();
  }

  private observeWebVitals(): void {
    // LCP - Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.track('core_web_vital', {
          metric: 'lcp',
          value: entry.startTime,
          rating: entry.startTime < 2500 ? 'good' : entry.startTime < 4000 ? 'needs_improvement' : 'poor'
        }, 'performance');
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // FID - First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.track('core_web_vital', {
          metric: 'fid',
          value: (entry as any).processingStart - entry.startTime,
          rating: (entry as any).processingStart - entry.startTime < 100 ? 'good' : 
                  (entry as any).processingStart - entry.startTime < 300 ? 'needs_improvement' : 'poor'
        }, 'performance');
      }
    }).observe({ type: 'first-input', buffered: true });

    // CLS - Cumulative Layout Shift
    let cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value;
        }
      }
      
      // Report CLS periodically
      setTimeout(() => {
        this.track('core_web_vital', {
          metric: 'cls',
          value: cls,
          rating: cls < 0.1 ? 'good' : cls < 0.25 ? 'needs_improvement' : 'poor'
        }, 'performance');
      }, 5000);
    }).observe({ type: 'layout-shift', buffered: true });
  }

  private trackNavigationTiming(): void {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.track('navigation_timing', {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
        load: navigation.loadEventEnd - navigation.domContentLoadedEventEnd,
        total: navigation.loadEventEnd - navigation.fetchStart,
      }, 'performance');
    });
  }

  private trackResourceTiming(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          this.track('resource_timing', {
            name: entry.name.split('/').pop(),
            duration: entry.duration,
            size: (entry as any).transferSize,
            type: entry.name.includes('.js') ? 'javascript' : 'css'
          }, 'performance');
        }
      }
    });
    
    observer.observe({ type: 'resource', buffered: true });
  }

  // Error tracking
  private initializeErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.track('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        severity: 'error'
      }, 'error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.track('promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
        severity: 'error'
      }, 'error');
    });
  }

  // Business metrics
  trackBusinessEvent(action: string, entity: string, properties?: Record<string, any>): void {
    this.track('business_action', {
      action,
      entity,
      ...properties
    }, 'business');
  }

  // User identification
  identify(userId: string, properties?: Record<string, any>): void {
    this.userId = userId;
    this.track('user_identify', {
      userId,
      ...properties
    });
  }

  // Page tracking
  page(path: string, properties?: Record<string, any>): void {
    this.track('page_view', {
      path,
      title: document.title,
      ...properties
    }, 'navigation');
  }

  // Custom timing
  time(label: string): void {
    performance.mark(`${label}-start`);
  }

  timeEnd(label: string, properties?: Record<string, any>): void {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0];
    this.track('custom_timing', {
      label,
      duration: measure.duration,
      ...properties
    }, 'performance');
  }

  // Data flushing
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {return;}

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // In production, send to analytics service
      if (this.isEnabled) {
        await this.sendToAnalyticsService(events);
      } else {
        console.group('📊 Analytics Events');
        events.forEach(event => {
          console.log(`${event.category?.toUpperCase()}: ${event.event}`, event.properties);
        });
        console.groupEnd();
      }
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  private async sendToAnalyticsService(events: AnalyticsEvent[]): Promise<void> {
    // Send to multiple services for redundancy
    const promises = [
      this.sendToGoogleAnalytics(events),
      this.sendToCustomAnalytics(events),
      this.sendToLocalStorage(events), // Fallback
    ];

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Analytics service error:', error);
    }
  }

  private async sendToGoogleAnalytics(events: AnalyticsEvent[]): Promise<void> {
    // GA4 implementation
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
    // Custom analytics endpoint
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
    // Store in localStorage as fallback
    const stored = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    stored.push(...events);
    
    // Keep only last 1000 events
    if (stored.length > 1000) {
      stored.splice(0, stored.length - 1000);
    }
    
    localStorage.setItem('analytics_events', JSON.stringify(stored));
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Flush before page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Flush when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health monitoring
  getHealthMetrics(): Record<string, any> {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      queueSize: this.eventQueue.length,
      memoryUsage: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit,
      } : null,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt,
      } : null,
      timestamp: Date.now(),
    };
  }

  // Manual flush for critical events
  flushNow(): Promise<void> {
    return this.flush();
  }

  // Disable/enable tracking
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

export const analytics = new AnalyticsCore();
export type { AnalyticsEvent, PerformanceMetrics, UserBehaviorMetrics };