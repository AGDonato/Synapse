import { useCallback, useEffect, useState } from 'react';

interface UseServiceWorkerReturn {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
  updateServiceWorker: () => void;
  unregisterServiceWorker: () => Promise<boolean>;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Detectar suporte ao Service Worker
  useEffect(() => {
    setIsSupported('serviceWorker' in navigator);
  }, []);

  // Detectar status online/offline
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    setIsOffline(!navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Registrar Service Worker
  useEffect(() => {
    if (!isSupported) {return;}

    const registerSW = async () => {
      try {
        console.log('[SW] Registering service worker...');
        
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none', // Sempre verificar updates
        });

        setRegistration(registration);
        setIsRegistered(true);

        console.log('[SW] Service worker registered successfully');

        // Verificar por updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            console.log('[SW] New service worker found, installing...');
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // Novo SW instalado, update disponível
                  console.log('[SW] New service worker installed, update available');
                  setIsUpdateAvailable(true);
                } else {
                  // Primeiro install
                  console.log('[SW] Service worker installed for the first time');
                }
              }
            });
          }
        });

        // Escutar mensagens do SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type, payload } = event.data || {};
          
          switch (type) {
            case 'CACHE_UPDATED':
              console.log('[SW] Cache updated:', payload);
              break;
            case 'OFFLINE_READY':
              console.log('[SW] App ready to work offline');
              break;
            case 'UPDATE_AVAILABLE':
              setIsUpdateAvailable(true);
              break;
            default:
              console.log('[SW] Message from SW:', event.data);
          }
        });

        // Verificar updates periodicamente (a cada 1 hora)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

      } catch (error) {
        console.error('[SW] Service worker registration failed:', error);
        setIsRegistered(false);
      }
    };

    registerSW();
  }, [isSupported]);

  // Função para atualizar service worker
  const updateServiceWorker = useCallback(() => {
    if (!registration) {return;}

    const waitingWorker = registration.waiting;
    
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      waitingWorker.addEventListener('statechange', () => {
        if (waitingWorker.state === 'activated') {
          setIsUpdateAvailable(false);
          window.location.reload();
        }
      });
    }
  }, [registration]);

  // Função para desregistrar service worker
  const unregisterServiceWorker = useCallback(async (): Promise<boolean> => {
    if (!registration) {return false;}

    try {
      const result = await registration.unregister();
      if (result) {
        console.log('[SW] Service worker unregistered successfully');
        setIsRegistered(false);
        setRegistration(null);
        setIsUpdateAvailable(false);
      }
      return result;
    } catch (error) {
      console.error('[SW] Error unregistering service worker:', error);
      return false;
    }
  }, [registration]);

  // Pré-carregar recursos críticos
  useEffect(() => {
    if (!isRegistered || !registration) {return;}

    const preloadCriticalResources = () => {
      const criticalResources = [
        '/',
        '/manifest.json',
        // Adicionar outros recursos críticos aqui
      ];

      registration.active?.postMessage({
        type: 'PRECACHE_RESOURCES',
        payload: criticalResources,
      });
    };

    // Pré-carregar após alguns segundos para não impactar carregamento inicial
    const timer = setTimeout(preloadCriticalResources, 5000);
    return () => clearTimeout(timer);
  }, [isRegistered, registration]);

  return {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    isOffline,
    registration,
    updateServiceWorker,
    unregisterServiceWorker,
  };
}

// Hook para notificar usuário sobre updates
export function useServiceWorkerUpdate() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    if (isUpdateAvailable) {
      setShowUpdatePrompt(true);
    }
  }, [isUpdateAvailable]);

  const acceptUpdate = useCallback(() => {
    setShowUpdatePrompt(false);
    updateServiceWorker();
  }, [updateServiceWorker]);

  const dismissUpdate = useCallback(() => {
    setShowUpdatePrompt(false);
  }, []);

  return {
    showUpdatePrompt,
    acceptUpdate,
    dismissUpdate,
  };
}

// Hook para status offline
export function useOfflineStatus() {
  const { isOffline } = useServiceWorker();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (isOffline && !wasOffline) {
      setWasOffline(true);
      console.log('[SW] App went offline');
    } else if (!isOffline && wasOffline) {
      setWasOffline(false);
      console.log('[SW] App back online');
    }
  }, [isOffline, wasOffline]);

  return {
    isOffline,
    wasOffline,
    isOnline: !isOffline,
  };
}