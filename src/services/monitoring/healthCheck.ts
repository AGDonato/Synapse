// src/services/monitoring/healthCheck.ts

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: number | string;
  threshold?: {
    warning: number;
    critical: number;
  };
  unit?: string;
  timestamp: number;
}

interface HealthReport {
  overall: 'healthy' | 'warning' | 'critical';
  timestamp: number;
  metrics: HealthMetric[];
  errors: string[];
  recommendations: string[];
}

class HealthMonitor {
  private checks: (() => Promise<HealthMetric> | HealthMetric)[] = [];
  private monitoringInterval?: number;
  private isMonitoring = false;
  private reportHistory: HealthReport[] = [];
  private maxHistorySize = 100;

  constructor() {
    this.initializeDefaultChecks();
  }

  private initializeDefaultChecks(): void {
    // Memory usage check
    this.addHealthCheck(async (): Promise<HealthMetric> => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        const percentage = (usedMB / totalMB) * 100;

        return {
          name: 'memory_usage',
          status: percentage > 80 ? 'critical' : percentage > 60 ? 'warning' : 'healthy',
          value: percentage,
          threshold: { warning: 60, critical: 80 },
          unit: '%',
          timestamp: Date.now(),
        };
      }

      return {
        name: 'memory_usage',
        status: 'healthy',
        value: 'N/A',
        timestamp: Date.now(),
      };
    });

    // DOM nodes count check
    this.addHealthCheck((): HealthMetric => {
      const nodeCount = document.querySelectorAll('*').length;
      return {
        name: 'dom_nodes',
        status: nodeCount > 5000 ? 'critical' : nodeCount > 3000 ? 'warning' : 'healthy',
        value: nodeCount,
        threshold: { warning: 3000, critical: 5000 },
        unit: 'nodes',
        timestamp: Date.now(),
      };
    });

    // Event listeners check
    this.addHealthCheck((): HealthMetric => {
      const eventListenerCount = (performance as any).eventCounts?.total || 0;
      return {
        name: 'event_listeners',
        status: eventListenerCount > 1000 ? 'critical' : eventListenerCount > 500 ? 'warning' : 'healthy',
        value: eventListenerCount,
        threshold: { warning: 500, critical: 1000 },
        unit: 'listeners',
        timestamp: Date.now(),
      };
    });

    // Network connection check
    this.addHealthCheck((): HealthMetric => {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        const status = effectiveType === 'slow-2g' || effectiveType === '2g' ? 'warning' : 'healthy';
        
        return {
          name: 'network_connection',
          status,
          value: effectiveType,
          timestamp: Date.now(),
        };
      }

      return {
        name: 'network_connection',
        status: 'healthy',
        value: 'unknown',
        timestamp: Date.now(),
      };
    });

    // Error rate check (last 5 minutes)
    this.addHealthCheck((): HealthMetric => {
      const errors = JSON.parse(localStorage.getItem('error_count') || '0');
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const recentErrors = errors.filter((error: any) => error.timestamp > fiveMinutesAgo);
      
      return {
        name: 'error_rate',
        status: recentErrors.length > 10 ? 'critical' : recentErrors.length > 5 ? 'warning' : 'healthy',
        value: recentErrors.length,
        threshold: { warning: 5, critical: 10 },
        unit: 'errors/5min',
        timestamp: Date.now(),
      };
    });

    // Local storage usage check
    this.addHealthCheck((): HealthMetric => {
      let totalSize = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
      
      const sizeKB = Math.round(totalSize / 1024);
      const maxStorageKB = 10 * 1024; // Assume 10MB limit
      const percentage = (sizeKB / maxStorageKB) * 100;

      return {
        name: 'local_storage',
        status: percentage > 80 ? 'critical' : percentage > 60 ? 'warning' : 'healthy',
        value: percentage,
        threshold: { warning: 60, critical: 80 },
        unit: '%',
        timestamp: Date.now(),
      };
    });

    // Bundle load performance check
    this.addHealthCheck((): HealthMetric => {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        const loadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
        
        return {
          name: 'page_load_time',
          status: loadTime > 5000 ? 'critical' : loadTime > 3000 ? 'warning' : 'healthy',
          value: Math.round(loadTime),
          threshold: { warning: 3000, critical: 5000 },
          unit: 'ms',
          timestamp: Date.now(),
        };
      }

      return {
        name: 'page_load_time',
        status: 'healthy',
        value: 'N/A',
        timestamp: Date.now(),
      };
    });

    // React DevTools check (should not be in production)
    this.addHealthCheck((): HealthMetric => {
      const hasReactDevTools = !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      const isProduction = process.env.NODE_ENV === 'production';
      
      return {
        name: 'react_devtools',
        status: hasReactDevTools && isProduction ? 'warning' : 'healthy',
        value: hasReactDevTools ? 'detected' : 'not_detected',
        timestamp: Date.now(),
      };
    });
  }

  addHealthCheck(check: () => Promise<HealthMetric> | HealthMetric): void {
    this.checks.push(check);
  }

  async runHealthCheck(): Promise<HealthReport> {
    const metrics: HealthMetric[] = [];
    const errors: string[] = [];

    // Run all health checks
    for (const check of this.checks) {
      try {
        const result = await check();
        metrics.push(result);
      } catch (error) {
        errors.push(`Health check failed: ${error}`);
      }
    }

    // Determine overall status
    let overall: HealthReport['overall'] = 'healthy';
    if (metrics.some(m => m.status === 'critical') || errors.length > 0) {
      overall = 'critical';
    } else if (metrics.some(m => m.status === 'warning')) {
      overall = 'warning';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, errors);

    const report: HealthReport = {
      overall,
      timestamp: Date.now(),
      metrics,
      errors,
      recommendations,
    };

    // Store in history
    this.reportHistory.push(report);
    if (this.reportHistory.length > this.maxHistorySize) {
      this.reportHistory.shift();
    }

    return report;
  }

  private generateRecommendations(metrics: HealthMetric[], errors: string[]): string[] {
    const recommendations: string[] = [];

    // Memory recommendations
    const memoryMetric = metrics.find(m => m.name === 'memory_usage');
    if (memoryMetric && memoryMetric.status !== 'healthy') {
      recommendations.push('Consider reducing component complexity or implementing memory optimization');
    }

    // DOM recommendations
    const domMetric = metrics.find(m => m.name === 'dom_nodes');
    if (domMetric && domMetric.status !== 'healthy') {
      recommendations.push('Too many DOM nodes detected. Consider virtualizing large lists or lazy loading');
    }

    // Network recommendations
    const networkMetric = metrics.find(m => m.name === 'network_connection');
    if (networkMetric && networkMetric.status !== 'healthy') {
      recommendations.push('Slow network detected. Enable offline mode or reduce bundle sizes');
    }

    // Error recommendations
    const errorMetric = metrics.find(m => m.name === 'error_rate');
    if (errorMetric && errorMetric.status !== 'healthy') {
      recommendations.push('High error rate detected. Review error logs and implement error boundaries');
    }

    // Performance recommendations
    const loadTimeMetric = metrics.find(m => m.name === 'page_load_time');
    if (loadTimeMetric && loadTimeMetric.status !== 'healthy') {
      recommendations.push('Slow page load detected. Implement code splitting and optimize bundles');
    }

    // Storage recommendations
    const storageMetric = metrics.find(m => m.name === 'local_storage');
    if (storageMetric && storageMetric.status !== 'healthy') {
      recommendations.push('Local storage usage high. Implement data cleanup or move to server storage');
    }

    if (errors.length > 0) {
      recommendations.push('System errors detected. Check console logs and error tracking service');
    }

    return recommendations;
  }

  startMonitoring(intervalMs = 30000): void {
    if (this.isMonitoring) {return;}

    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(async () => {
      try {
        const report = await this.runHealthCheck();
        
        // Send critical alerts immediately
        if (report.overall === 'critical') {
          this.sendAlert(report);
        }

        // Log health status
        console.log(`🏥 Health Status: ${report.overall.toUpperCase()}`, {
          criticalMetrics: report.metrics.filter(m => m.status === 'critical').length,
          warningMetrics: report.metrics.filter(m => m.status === 'warning').length,
          errors: report.errors.length,
        });

      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      window.clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  getHistory(): HealthReport[] {
    return [...this.reportHistory];
  }

  getLatestReport(): HealthReport | null {
    return this.reportHistory[this.reportHistory.length - 1] || null;
  }

  private async sendAlert(report: HealthReport): Promise<void> {
    // In production, send to monitoring service
    console.error('🚨 CRITICAL HEALTH ALERT', {
      metrics: report.metrics.filter(m => m.status === 'critical'),
      errors: report.errors,
      recommendations: report.recommendations,
    });

    // Send to external monitoring service
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'health_critical',
          report,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.error('Failed to send health alert:', error);
    }
  }

  // Export health data for analysis
  exportHealthData(): string {
    return JSON.stringify({
      history: this.reportHistory,
      systemInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        connection: (navigator as any).connection,
        memory: (performance as any).memory,
      },
      timestamp: Date.now(),
    }, null, 2);
  }
}

export const healthMonitor = new HealthMonitor();
export type { HealthMetric, HealthReport };