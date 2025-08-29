// src/services/pwa/serviceWorkerRegistration.ts

import { createModuleLogger } from '../../utils/logger';

const logger = createModuleLogger('ServiceWorkerRegistration');

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.exec(window.location.hostname)
);

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export function register(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          logger.info(
            'This web app is being served cache-first by a service worker. To learn more, visit https://bit.ly/CRA-PWA'
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });

    // Listen for network status changes
    window.addEventListener('online', () => {
      logger.info('🌐 Back online');
      config?.onOnline?.();
    });

    window.addEventListener('offline', () => {
      logger.info('📵 Gone offline');
      config?.onOffline?.();
    });
  }
}

function registerValidSW(swUrl: string, config?: ServiceWorkerConfig) {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      logger.info('🔧 SW registered: ', registration);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              logger.info(
                '🔄 New content is available and will be used when all tabs for this page are closed.'
              );
              config?.onUpdate?.(registration);
            } else {
              logger.info('✅ Content is cached for offline use.');
              config?.onSuccess?.(registration);
            }
          }
        };
      };
    })
    .catch(error => {
      logger.error('❌ SW registration failed: ', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then(response => {
      const contentType = response.headers.get('content-type');
      if (response.status === 404 || (contentType != null && !contentType.includes('javascript'))) {
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      logger.info('No internet connection found. App is running in offline mode.');
      config?.onOffline?.();
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        logger.error(error.message);
      });
  }
}

// Utility functions for PWA features
export const pwaUtils = {
  // Check if app is running in standalone mode
  isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as any).standalone) ||
      document.referrer.includes('android-app://')
    );
  },

  // Get install prompt
  setupInstallPrompt() {
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;

      // Show custom install button
      const installButton = document.querySelector('#install-app-button');
      if (installButton) {
        (installButton as HTMLElement).style.display = 'block';

        installButton.addEventListener('click', async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            logger.info(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            (installButton as HTMLElement).style.display = 'none';
          }
        });
      }
    });

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
      logger.info('✅ App was installed successfully');

      // Track installation
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'pwa_install', {
          event_category: 'engagement',
          event_label: 'PWA Installation',
        });
      }
    });
  },

  // Check for app updates
  checkForUpdates(): Promise<boolean> {
    return new Promise(resolve => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
          resolve(true);
        });
      } else {
        resolve(false);
      }
    });
  },

  // Get network status
  getNetworkStatus(): { online: boolean; connection?: unknown } {
    const connection = (navigator as any).connection;
    return {
      online: navigator.onLine,
      connection: connection
        ? {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData,
          }
        : null,
    };
  },

  // Request persistent storage
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const isPersistent = await navigator.storage.persist();
        logger.info(`Persistent storage granted: ${isPersistent}`);
        return isPersistent;
      } catch (error) {
        logger.error('Error requesting persistent storage:', error);
        return false;
      }
    }
    return false;
  },

  // Get storage estimate
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        logger.info('Storage estimate:', estimate);
        return estimate;
      } catch (error) {
        logger.error('Error getting storage estimate:', error);
        return null;
      }
    }
    return null;
  },
};
