/**
 * PWA Services - Progressive Web App functionality
 * 
 * This module provides:
 * - Service Worker registration and management
 * - Background synchronization for offline support  
 * - Advanced caching strategies
 * - Install prompts and PWA lifecycle management
 * - Offline data persistence
 */

// Export services
export { register, unregister, pwaUtils } from './serviceWorkerRegistration';
export { backgroundSyncService, getBackgroundSyncUtils } from './backgroundSync';
export { 
  apiCache, 
  staticCache, 
  userDataCache, 
  initializeCaching, 
  getCacheUtils 
} from './caching';

// Export types
export type { ServiceWorkerConfig } from './serviceWorkerRegistration';
export type { SyncTask, SyncQueueStatus } from './backgroundSync';
export type { CacheConfig, CacheEntry, CacheStats } from './caching';

import { pwaUtils, register as registerSW } from './serviceWorkerRegistration';
import { backgroundSyncService } from './backgroundSync';
import { apiCache, initializeCaching } from './caching';

/**
 * PWA Configuration
 */
export interface PWAConfig {
  serviceWorker?: {
    enabled: boolean;
    scope?: string;
    updateViaCache?: 'imports' | 'all' | 'none';
  };
  caching?: {
    enabled: boolean;
    strategies?: Record<string, string>;
  };
  sync?: {
    enabled: boolean;
    batchSize?: number;
    retryInterval?: number;
  };
  offline?: {
    enabled: boolean;
    fallbackPage?: string;
  };
  install?: {
    enabled: boolean;
    autoPrompt?: boolean;
    deferPrompt?: boolean;
  };
}

const defaultConfig: PWAConfig = {
  serviceWorker: {
    enabled: true,
    scope: '/',
    updateViaCache: 'none',
  },
  caching: {
    enabled: true,
  },
  sync: {
    enabled: true,
    batchSize: 10,
    retryInterval: 30000,
  },
  offline: {
    enabled: true,
    fallbackPage: '/offline.html',
  },
  install: {
    enabled: true,
    autoPrompt: false,
    deferPrompt: true,
  },
};

/**
 * Initialize PWA functionality
 */
export const initializePWA = async (config: Partial<PWAConfig> = {}): Promise<void> => {
  const pwaConfig = { ...defaultConfig, ...config };
  
  try {
    console.log('🚀 Initializing PWA functionality...');

    // Initialize caching first (needed by other services)
    if (pwaConfig.caching?.enabled) {
      initializeCaching();
    }

    // Initialize background sync
    if (pwaConfig.sync?.enabled) {
      backgroundSyncService.initialize();
    }

    // Register service worker
    if (pwaConfig.serviceWorker?.enabled) {
      registerSW({
        onSuccess: (registration) => {
          console.log('✅ PWA: Service Worker registered successfully');
          
          // Setup update notifications
          setupUpdateNotifications(registration);
        },
        
        onUpdate: (registration) => {
          console.log('🔄 PWA: New version available');
          
          // Show update notification
          showUpdateNotification(registration);
        },
        
        onOffline: () => {
          console.log('📵 PWA: Application is offline');
          showOfflineNotification();
        },
        
        onOnline: () => {
          console.log('🌐 PWA: Application is online');
          hideOfflineNotification();
          
          // Trigger background sync
          if (pwaConfig.sync?.enabled) {
            backgroundSyncService.initialize();
          }
        },
      });
    }

    // Setup install prompt
    if (pwaConfig.install?.enabled) {
      pwaUtils.setupInstallPrompt();
      
      if (pwaConfig.install.autoPrompt) {
        setTimeout(() => {
          showInstallPrompt();
        }, 30000); // Show after 30 seconds
      }
    }

    // Setup offline support
    if (pwaConfig.offline?.enabled) {
      setupOfflineSupport(pwaConfig.offline.fallbackPage);
    }

    // Setup PWA lifecycle handlers
    setupPWALifecycle();

    console.log('✅ PWA initialization completed successfully');
    
    // Report PWA capabilities
    reportPWACapabilities();

  } catch (error) {
    console.error('❌ PWA initialization failed:', error);
    throw error;
  }
};

/**
 * Setup update notifications
 */
const setupUpdateNotifications = (registration: ServiceWorkerRegistration): void => {
  // Listen for updates
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version is ready
          dispatchPWAEvent('update-available', { registration });
        }
      });
    }
  });
};

/**
 * Show update notification
 */
const showUpdateNotification = (registration: ServiceWorkerRegistration): void => {
  // Create update notification
  const notification = document.createElement('div');
  notification.id = 'pwa-update-notification';
  notification.innerHTML = `
    <div style="position: fixed; top: 20px; right: 20px; background: #2563eb; color: white; padding: 16px; border-radius: 8px; z-index: 9999; max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
      <div style="font-weight: 600; margin-bottom: 8px;">Nova versão disponível!</div>
      <div style="font-size: 14px; margin-bottom: 12px;">Atualize para a versão mais recente do Synapse</div>
      <div style="display: flex; gap: 8px;">
        <button id="pwa-update-btn" style="background: white; color: #2563eb; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 500; cursor: pointer;">
          Atualizar
        </button>
        <button id="pwa-dismiss-btn" style="background: transparent; color: white; border: 1px solid white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Depois
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Handle update
  const updateBtn = document.getElementById('pwa-update-btn');
  updateBtn?.addEventListener('click', () => {
    // Skip waiting and reload
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  });
  
  // Handle dismiss
  const dismissBtn = document.getElementById('pwa-dismiss-btn');
  dismissBtn?.addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (document.getElementById('pwa-update-notification')) {
      notification.remove();
    }
  }, 30000);
};

/**
 * Show offline notification
 */
const showOfflineNotification = (): void => {
  const notification = document.createElement('div');
  notification.id = 'pwa-offline-notification';
  notification.innerHTML = `
    <div style="position: fixed; bottom: 20px; left: 20px; background: #f59e0b; color: white; padding: 12px 16px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
      📵 Você está offline - funcionando em modo offline
    </div>
  `;
  
  document.body.appendChild(notification);
};

/**
 * Hide offline notification
 */
const hideOfflineNotification = (): void => {
  const notification = document.getElementById('pwa-offline-notification');
  if (notification) {
    notification.remove();
  }
};

/**
 * Show install prompt
 */
const showInstallPrompt = (): void => {
  // Only show if not already installed and prompt is available
  if (pwaUtils.isStandalone()) {
    return;
  }
  
  const notification = document.createElement('div');
  notification.id = 'pwa-install-notification';
  notification.innerHTML = `
    <div style="position: fixed; bottom: 20px; right: 20px; background: #059669; color: white; padding: 16px; border-radius: 8px; z-index: 9999; max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
      <div style="font-weight: 600; margin-bottom: 8px;">Instalar Synapse</div>
      <div style="font-size: 14px; margin-bottom: 12px;">Instale o app para acesso rápido e funcionamento offline</div>
      <div style="display: flex; gap: 8px;">
        <button id="pwa-install-btn" style="background: white; color: #059669; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 500; cursor: pointer;">
          Instalar
        </button>
        <button id="pwa-install-dismiss-btn" style="background: transparent; color: white; border: 1px solid white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Não agora
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Handle install (this would trigger the native install prompt)
  const installBtn = document.getElementById('pwa-install-btn');
  installBtn?.addEventListener('click', () => {
    // The actual install prompt would be handled by setupInstallPrompt
    const installEvent = new CustomEvent('trigger-install-prompt');
    window.dispatchEvent(installEvent);
    notification.remove();
  });
  
  // Handle dismiss
  const dismissBtn = document.getElementById('pwa-install-dismiss-btn');
  dismissBtn?.addEventListener('click', () => {
    notification.remove();
    
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  });
  
  // Auto-dismiss after 60 seconds
  setTimeout(() => {
    if (document.getElementById('pwa-install-notification')) {
      notification.remove();
    }
  }, 60000);
};

/**
 * Setup offline support
 */
const setupOfflineSupport = (fallbackPage?: string): void => {
  // Cache fallback page
  if (fallbackPage && 'caches' in window) {
    caches.open('synapse-offline').then(cache => {
      cache.add(fallbackPage);
    });
  }
  
  // Handle offline navigation
  window.addEventListener('online', () => {
    dispatchPWAEvent('network-online');
  });
  
  window.addEventListener('offline', () => {
    dispatchPWAEvent('network-offline');
  });
};

/**
 * Setup PWA lifecycle handlers
 */
const setupPWALifecycle = (): void => {
  // Handle app installation
  window.addEventListener('appinstalled', () => {
    console.log('📱 PWA installed successfully');
    dispatchPWAEvent('app-installed');
    
    // Hide install notification if visible
    const installNotification = document.getElementById('pwa-install-notification');
    if (installNotification) {
      installNotification.remove();
    }
  });
  
  // Handle beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (event) => {
    console.log('💡 PWA install prompt available');
    dispatchPWAEvent('install-prompt-available', { event });
  });
  
  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // App became visible - good time to sync
      dispatchPWAEvent('app-focus');
    }
  });
};

/**
 * Dispatch PWA events
 */
const dispatchPWAEvent = (type: string, detail?: any): void => {
  const event = new CustomEvent(`pwa:${type}`, { detail });
  window.dispatchEvent(event);
};

/**
 * Report PWA capabilities
 */
const reportPWACapabilities = (): void => {
  const capabilities = {
    serviceWorker: 'serviceWorker' in navigator,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    pushNotifications: 'Notification' in window && 'serviceWorker' in navigator,
    installPrompt: 'BeforeInstallPromptEvent' in window,
    webShare: 'share' in navigator,
    cacheAPI: 'caches' in window,
    indexedDB: 'indexedDB' in window,
    offlineCapable: navigator.onLine !== undefined,
    standalone: pwaUtils.isStandalone(),
  };
  
  console.log('📊 PWA Capabilities:', capabilities);
  
  // Store capabilities for later use
  (window as any).__PWA_CAPABILITIES__ = capabilities;
};

/**
 * Get PWA status
 */
export const getPWAStatus = () => {
  const networkStatus = pwaUtils.getNetworkStatus();
  const syncStatus = backgroundSyncService.getStatus();
  const cacheStats = apiCache.getStats();
  
  return {
    online: networkStatus.online,
    connection: networkStatus.connection,
    sync: syncStatus,
    cache: cacheStats,
    standalone: pwaUtils.isStandalone(),
    capabilities: (window as any).__PWA_CAPABILITIES__ || {},
  };
};

/**
 * Shutdown PWA services
 */
export const shutdownPWA = async (): Promise<void> => {
  try {
    console.log('🛑 Shutting down PWA services...');
    
    // Stop background sync
    backgroundSyncService.shutdown();
    
    // Clear notifications
    const notifications = [
      'pwa-update-notification',
      'pwa-offline-notification', 
      'pwa-install-notification'
    ];
    
    notifications.forEach(id => {
      const el = document.getElementById(id);
      if (el) {el.remove();}
    });
    
    console.log('✅ PWA services shutdown complete');
  } catch (error) {
    console.error('❌ PWA shutdown failed:', error);
  }
};

/**
 * PWA utilities
 */
export const getPWAUtils = () => {
  return {
    getStatus: getPWAStatus,
    checkForUpdates: pwaUtils.checkForUpdates,
    requestPersistentStorage: pwaUtils.requestPersistentStorage,
    getStorageEstimate: pwaUtils.getStorageEstimate,
  };
};

// Default export
export default {
  initializePWA,
  getPWAStatus,
  shutdownPWA,
  getPWAUtils,
};