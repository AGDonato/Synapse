// src/components/layout/AnalyticsProvider.tsx

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../../../shared/services/analytics/core';
import { useAnalytics } from '../../../shared/hooks/useAnalytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const location = useLocation();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    // Track route changes
    trackPageView({
      path: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  }, [location, trackPageView]);

  useEffect(() => {
    // Track session duration
    const sessionStart = Date.now();

    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - sessionStart;
      analytics.track('session_end', {
        duration: sessionDuration,
        pages_visited:
          performance.getEntriesByType('navigation').length +
          performance.getEntriesByType('navigation').length,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Track visibility changes (tab switching)
    const handleVisibilityChange = () => {
      analytics.track('visibility_change', {
        hidden: document.hidden,
        timestamp: Date.now(),
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
};
