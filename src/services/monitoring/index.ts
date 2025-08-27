import { logger } from "../../utils/logger";
/**
 * Monitoring Services - Comprehensive application monitoring
 * 
 * This module provides:
 * - Health monitoring and system vitals
 * - Error tracking and reporting
 * - Performance monitoring and Core Web Vitals
 * - Real-time alerting and notifications
 */

// Export services
export { healthMonitor } from './healthCheck';
export { errorTrackingService, createErrorTrackingWrapper, getErrorTrackingUtils } from './errorTracking';
export { performanceMonitoringService, getPerformanceUtils } from './performance';

// Export types
export type { HealthMetric, HealthReport } from './healthCheck';
export type { ErrorInfo, ErrorReport, ErrorTrackingConfig } from './errorTracking';
export type { PerformanceMetric, PerformanceReport, PerformanceConfig } from './performance';

import { healthMonitor } from './healthCheck';
import { errorTrackingService } from './errorTracking';
import { performanceMonitoringService } from './performance';

/**
 * Initialize all monitoring services
 */
export const initializeMonitoring = async (config: {
  health?: { intervalMs?: number };
  errors?: { endpoint?: string };
  performance?: { endpoint?: string };
} = {}): Promise<void> => {
  try {
    logger.info('🔍 Initializing monitoring services...');

    // Initialize error tracking first (catches initialization errors)
    errorTrackingService.captureError({
      message: 'Monitoring initialization started',
      type: 'javascript',
      severity: 'info',
      tags: ['monitoring', 'initialization'],
    });

    // Start health monitoring
    healthMonitor.startMonitoring(config.health?.intervalMs || 30000);

    // Performance monitoring is auto-started in constructor
    // Update config if provided
    if (config.performance?.endpoint) {
      (performanceMonitoringService as any).config.endpoint = config.performance.endpoint;
    }

    // Update error tracking config
    if (config.errors?.endpoint) {
      (errorTrackingService as any).config.endpoint = config.errors.endpoint;
    }

    // Setup cross-service integrations
    setupIntegrations();

    logger.info('✅ Monitoring services initialized successfully');
    
    // Log initial status
    setTimeout(async () => {
      const healthReport = await healthMonitor.runHealthCheck();
      const performanceReport = performanceMonitoringService.generateReport();
      const errorReport = errorTrackingService.generateReport();

      logger.info('📊 Initial monitoring status:', {
        health: healthReport.overall,
        performance: performanceReport.score,
        errors: errorReport.summary.total,
      });
    }, 2000);

  } catch (error) {
    logger.error('❌ Monitoring initialization failed:', error);
    
    // Try to capture this error
    try {
      errorTrackingService.captureError({
        message: `Monitoring initialization failed: ${error}`,
        type: 'javascript',
        severity: 'critical',
        context: { error: String(error) },
        tags: ['monitoring', 'initialization', 'failure'],
      });
    } catch (captureError) {
      logger.error('Failed to capture initialization error:', captureError);
    }
    
    throw error;
  }
};

/**
 * Setup integrations between monitoring services
 */
const setupIntegrations = (): void => {
  // Health monitoring -> Error tracking integration
  const originalHealthCheck = healthMonitor.runHealthCheck.bind(healthMonitor);
  healthMonitor.runHealthCheck = async () => {
    const report = await originalHealthCheck();
    
    // Report critical health issues as errors
    if (report.overall === 'critical') {
      errorTrackingService.captureError({
        message: 'Critical health issues detected',
        type: 'performance',
        severity: 'high',
        context: {
          metrics: report.metrics.filter(m => m.status === 'critical'),
          errors: report.errors,
        },
        tags: ['health', 'critical'],
      });
    }
    
    return report;
  };

  // Performance monitoring -> Error tracking integration
  const originalGenerateReport = performanceMonitoringService.generateReport.bind(performanceMonitoringService);
  performanceMonitoringService.generateReport = () => {
    const report = originalGenerateReport();
    
    // Report poor Core Web Vitals as performance errors
    Object.entries(report.coreWebVitals).forEach(([name, metric]) => {
      if (metric && metric.score === 'poor') {
        errorTrackingService.captureError({
          message: `Poor ${name.toUpperCase()}: ${metric.value}${metric.unit}`,
          type: 'performance',
          severity: 'medium',
          context: {
            metric: name,
            value: metric.value,
            unit: metric.unit,
            threshold: metric.threshold,
          },
          tags: ['performance', 'core-web-vitals', name],
        });
      }
    });
    
    return report;
  };
};

/**
 * Stop all monitoring services
 */
export const stopMonitoring = (): void => {
  logger.info('🛑 Stopping monitoring services...');
  
  try {
    healthMonitor.stopMonitoring();
    performanceMonitoringService.stop();
    errorTrackingService.stop();
    
    logger.info('✅ Monitoring services stopped');
  } catch (error) {
    logger.error('❌ Error stopping monitoring services:', error);
  }
};

/**
 * Get comprehensive monitoring status
 */
export const getMonitoringStatus = async (): Promise<{
  health: import('./healthCheck').HealthReport;
  performance: import('./performance').PerformanceReport;
  errors: import('./errorTracking').ErrorReport;
  overall: 'healthy' | 'warning' | 'critical';
}> => {
  try {
    const healthReport = await healthMonitor.runHealthCheck();
    const performanceReport = performanceMonitoringService.generateReport();
    const errorReport = errorTrackingService.generateReport();

    // Determine overall status
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (healthReport.overall === 'critical' || 
        performanceReport.score < 30 || 
        errorReport.summary.unresolved > 10) {
      overall = 'critical';
    } else if (healthReport.overall === 'warning' || 
               performanceReport.score < 60 || 
               errorReport.summary.unresolved > 5) {
      overall = 'warning';
    }

    return {
      health: {
        status: healthReport.overall,
        metrics: healthReport.metrics.length,
        errors: healthReport.errors.length,
      },
      performance: {
        score: performanceReport.score,
        coreWebVitals: Object.keys(performanceReport.coreWebVitals).length,
        recommendations: performanceReport.recommendations.length,
      },
      errors: {
        total: errorReport.summary.total,
        unresolved: errorReport.summary.unresolved,
        critical: errorReport.summary.bySeverity.critical || 0,
        high: errorReport.summary.bySeverity.high || 0,
      },
      overall,
    };
  } catch (error) {
    logger.error('Failed to get monitoring status:', error);
    return {
      health: { status: 'critical', metrics: 0, errors: 1 },
      performance: { score: 0, coreWebVitals: 0, recommendations: 0 },
      errors: { total: 1, unresolved: 1, critical: 1, high: 0 },
      overall: 'critical',
    };
  }
};

/**
 * Export monitoring data for analysis
 */
export const exportMonitoringData = (): string => {
  try {
    const healthData = healthMonitor.exportHealthData();
    const errorReport = errorTrackingService.generateReport();
    const performanceReport = performanceMonitoringService.generateReport();

    const exportData = {
      timestamp: Date.now(),
      version: '1.0.0',
      environment: import.meta.env.MODE,
      url: window.location.href,
      userAgent: navigator.userAgent,
      data: {
        health: JSON.parse(healthData),
        errors: errorReport,
        performance: performanceReport,
      },
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    logger.error('Failed to export monitoring data:', error);
    return JSON.stringify({ error: String(error) }, null, 2);
  }
};

/**
 * Monitoring configuration
 */
export const monitoringConfig = {
  // Default intervals
  healthCheckInterval: 30000, // 30 seconds
  performanceReportInterval: 30000, // 30 seconds
  errorReportInterval: 5 * 60 * 1000, // 5 minutes
  
  // Thresholds
  healthThresholds: {
    memory: { warning: 60, critical: 80 },
    domNodes: { warning: 3000, critical: 5000 },
    errorRate: { warning: 5, critical: 10 },
  },
  
  performanceThresholds: {
    lcp: { good: 2500, needs_improvement: 4000 },
    fid: { good: 100, needs_improvement: 300 },
    cls: { good: 0.1, needs_improvement: 0.25 },
    score: { good: 90, needs_improvement: 60 },
  },
  
  errorThresholds: {
    critical: 0, // No critical errors allowed
    high: 2, // Maximum 2 high-severity errors
    medium: 10, // Maximum 10 medium-severity errors
  },
  
  // Feature flags
  features: {
    realTimeAlerts: import.meta.env.PROD,
    detailedLogging: import.meta.env.DEV,
    performanceOptimization: true,
    errorDeduplication: true,
    healthAutoRecovery: import.meta.env.PROD,
  },
} as const;

// Default export
export default {
  initializeMonitoring,
  stopMonitoring,
  getMonitoringStatus,
  exportMonitoringData,
  config: monitoringConfig,
};