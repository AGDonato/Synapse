/**
 * SERVICE WORKER REGISTRATION - GERENCIAMENTO DE PWA
 *
 * Este arquivo implementa o registro e gerenciamento do Service Worker.
 * Funcionalidades:
 * - Registro automático do Service Worker
 * - Detecção de ambientes (localhost vs produção)
 * - Callbacks para eventos do ciclo de vida
 * - Suporte a atualizações da aplicação
 * - Detecção de status online/offline
 * - Integração com sistema de logging
 *
 * Características:
 * - Funciona apenas em navegadores compatíveis
 * - Diferentes estratégias para localhost e produção
 * - Verificação de validade do Service Worker
 * - Configurações opcionais via callback
 *
 * Uso: register(config) para ativar PWA
 */

// src/services/pwa/serviceWorkerRegistration.ts

import { createModuleLogger } from '../../utils/logger';

/** Logger específico para Service Worker registration */
const logger = createModuleLogger('ServiceWorkerRegistration');

/**
 * Detecta se está rodando em ambiente de desenvolvimento local
 * Considera localhost, IPv6 loopback e range IPv4 127.x.x.x
 */
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.exec(window.location.hostname)
);

/**
 * Configuração opcional para callbacks do Service Worker
 */
export interface ServiceWorkerConfig {
  /** Callback executado quando registro é bem-sucedido */
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  /** Callback executado quando há atualização disponível */
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  /** Callback executado quando aplicação fica offline */
  onOffline?: () => void;
  /** Callback executado quando aplicação volta online */
  onOnline?: () => void;
}

/**
 * Registra o Service Worker com configurações opcionais
 * @param config Configurações e callbacks opcionais
 */
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
            'Este web app está sendo servido cache-first por um service worker. Para saber mais, visite https://bit.ly/CRA-PWA'
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });

    // Escuta mudanças de status de rede
    window.addEventListener('online', () => {
      logger.info('🌐 De volta online');
      config?.onOnline?.();
    });

    window.addEventListener('offline', () => {
      logger.info('📵 Ficou offline');
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
                '🔄 Novo conteúdo está disponível e será usado quando todas as abas desta página forem fechadas.'
              );
              config?.onUpdate?.(registration);
            } else {
              logger.info('✅ Conteúdo está em cache para uso offline.');
              config?.onSuccess?.(registration);
            }
          }
        };
      };
    })
    .catch(error => {
      logger.error('❌ Falha no registro do SW: ', error);
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
      logger.info('Nenhuma conexão com a internet encontrada. App está rodando em modo offline.');
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

// Funções utilitárias para funcionalidades PWA
export const pwaUtils = {
  // Verifica se app está rodando em modo standalone
  isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as any).standalone) ||
      document.referrer.includes('android-app://')
    );
  },

  // Obtém prompt de instalação
  setupInstallPrompt() {
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;

      // Mostra botão customizado de instalação
      const installButton = document.querySelector('#install-app-button');
      if (installButton) {
        (installButton as HTMLElement).style.display = 'block';

        installButton.addEventListener('click', async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            logger.info(`Resposta do usuário ao prompt de instalação: ${outcome}`);
            deferredPrompt = null;
            (installButton as HTMLElement).style.display = 'none';
          }
        });
      }
    });

    // Trata instalação bem-sucedida
    window.addEventListener('appinstalled', () => {
      logger.info('✅ App foi instalado com sucesso');

      // Rastreia instalação
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'pwa_install', {
          event_category: 'engagement',
          event_label: 'Instalação PWA',
        });
      }
    });
  },

  // Verifica atualizações do app
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

  // Obtém status da rede
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

  // Solicita armazenamento persistente
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const isPersistent = await navigator.storage.persist();
        logger.info(`Armazenamento persistente concedido: ${isPersistent}`);
        return isPersistent;
      } catch (error) {
        logger.error('Erro ao solicitar armazenamento persistente:', error);
        return false;
      }
    }
    return false;
  },

  // Obtém estimativa de armazenamento
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        logger.info('Estimativa de armazenamento:', estimate);
        return estimate;
      } catch (error) {
        logger.error('Erro ao obter estimativa de armazenamento:', error);
        return null;
      }
    }
    return null;
  },
};
