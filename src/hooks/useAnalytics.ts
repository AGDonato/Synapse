// src/hooks/useAnalytics.ts

import React, { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../services/analytics/core';

interface UseAnalyticsReturn {
  track: (event: string, properties?: Record<string, any>) => void;
  trackPageView: (properties?: Record<string, any>) => void;
  trackBusinessAction: (action: string, entity: string, properties?: Record<string, any>) => void;
  trackError: (error: Error, properties?: Record<string, any>) => void;
  trackPerformance: (label: string, duration: number, properties?: Record<string, any>) => void;
  identify: (userId: string, properties?: Record<string, any>) => void;
  time: (label: string) => void;
  timeEnd: (label: string, properties?: Record<string, any>) => void;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const location = useLocation();
  const lastPathRef = useRef<string | undefined>(undefined);

  // Auto-track page views
  useEffect(() => {
    if (location.pathname !== lastPathRef.current) {
      analytics.page(location.pathname, {
        search: location.search,
        hash: location.hash,
        state: location.state,
      });
      lastPathRef.current = location.pathname;
    }
  }, [location]);

  const track = useCallback((event: string, properties?: Record<string, any>) => {
    analytics.track(event, properties);
  }, []);

  const trackPageView = useCallback((properties?: Record<string, any>) => {
    analytics.page(location.pathname, {
      search: location.search,
      hash: location.hash,
      ...properties,
    });
  }, [location]);

  const trackBusinessAction = useCallback((
    action: string, 
    entity: string, 
    properties?: Record<string, any>
  ) => {
    analytics.trackBusinessEvent(action, entity, properties);
  }, []);

  const trackError = useCallback((error: Error, properties?: Record<string, any>) => {
    analytics.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...properties,
    }, 'error');
  }, []);

  const trackPerformance = useCallback((
    label: string, 
    duration: number, 
    properties?: Record<string, any>
  ) => {
    analytics.track('performance_metric', {
      label,
      duration,
      ...properties,
    }, 'performance');
  }, []);

  const identify = useCallback((userId: string, properties?: Record<string, any>) => {
    analytics.identify(userId, properties);
  }, []);

  const time = useCallback((label: string) => {
    analytics.time(label);
  }, []);

  const timeEnd = useCallback((label: string, properties?: Record<string, any>) => {
    analytics.timeEnd(label, properties);
  }, []);

  return {
    track,
    trackPageView,
    trackBusinessAction,
    trackError,
    trackPerformance,
    identify,
    time,
    timeEnd,
  };
};

// Higher-order component for automatic component tracking
export function withAnalytics(
  Component: React.ComponentType<any>,
  componentName?: string
) {
  const WrappedComponent: React.FC<any> = (props) => {
    const { track, time, timeEnd } = useAnalytics();
    const mountTimeRef = useRef<number | undefined>(undefined);

    useEffect(() => {
      const name = componentName || Component.displayName || Component.name || 'UnknownComponent';
      
      // Track component mount
      mountTimeRef.current = Date.now();
      time(`component_render_${name}`);
      track('component_mount', { componentName: name });

      return () => {
        // Track component unmount and render time
        if (mountTimeRef.current) {
          const duration = Date.now() - mountTimeRef.current;
          timeEnd(`component_render_${name}`, { componentName: name });
          track('component_unmount', { 
            componentName: name,
            mountDuration: duration
          });
        }
      };
    }, [track, time, timeEnd]);

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withAnalytics(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for business-specific analytics
export const useBusinessAnalytics = () => {
  const { trackBusinessAction, track } = useAnalytics();

  return {
    // Document management
    trackDocumentCreated: (documentType: string, properties?: Record<string, any>) => 
      trackBusinessAction('create', 'document', { documentType, ...properties }),
    
    trackDocumentViewed: (documentId: string, properties?: Record<string, any>) => 
      trackBusinessAction('view', 'document', { documentId, ...properties }),
    
    trackDocumentEdited: (documentId: string, properties?: Record<string, any>) => 
      trackBusinessAction('edit', 'document', { documentId, ...properties }),

    // Demand management
    trackDemandCreated: (demandType: string, properties?: Record<string, any>) => 
      trackBusinessAction('create', 'demand', { demandType, ...properties }),
    
    trackDemandStatusChanged: (demandId: string, oldStatus: string, newStatus: string) => 
      trackBusinessAction('status_change', 'demand', { demandId, oldStatus, newStatus }),

    // Search and filtering
    trackSearch: (query: string, resultCount: number, context?: string) => 
      track('search', { query, resultCount, context }),
    
    trackFilterApplied: (filters: Record<string, any>, context?: string) => 
      track('filter_applied', { filters, context }),

    // Form interactions
    trackFormStarted: (formName: string) => 
      track('form_started', { formName }),
    
    trackFormCompleted: (formName: string, duration: number) => 
      track('form_completed', { formName, duration }),
    
    trackFormAbandoned: (formName: string, step: string) => 
      track('form_abandoned', { formName, step }),

    // Feature usage
    trackFeatureUsed: (feature: string, properties?: Record<string, any>) => 
      track('feature_used', { feature, ...properties }),
  };
};