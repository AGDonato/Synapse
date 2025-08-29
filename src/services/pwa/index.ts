/**
 * ================================================================
 * PWA SERVICE - SISTEMA COMPLETO DE PROGRESSIVE WEB APP
 * ================================================================
 *
 * Este arquivo implementa todas as funcionalidades de PWA (Progressive Web App)
 * para o Synapse, transformando a aplicação web em uma experiência nativa
 * com capacidades offline, instalação e sincronização em background.
 *
 * Funcionalidades principais:
 * - Registro e gerenciamento de Service Worker
 * - Estratégias avançadas de cache para performance
 * - Sincronização em background para suporte offline
 * - Prompts de instalação automáticos e inteligentes
 * - Notificações de atualização e status offline
 * - Persistência de dados offline com IndexedDB
 * - Detecção de capacidades e adaptação dinâmica
 *
 * Componentes integrados:
 * - ServiceWorkerRegistration: Gerenciamento do service worker
 * - BackgroundSync: Sincronização de dados offline
 * - Caching: Sistema multi-camadas de cache
 * - InstallPrompt: Gestão de prompts de instalação
 *
 * Estratégias de cache implementadas:
 * - Cache First: Recursos estáticos e assets
 * - Network First: Dados dinâmicos e APIs
 * - Stale While Revalidate: Conteúdo que pode ser obsoleto
 * - Network Only: Dados críticos sempre atualizados
 * - Cache Only: Recursos offline permanentes
 *
 * Capacidades offline:
 * - Armazenamento local de dados de trabalho
 * - Queue de operações para sincronização posterior
 * - Fallback pages para navegação offline
 * - Detecção automática de conectividade
 * - Sincronização inteligente ao voltar online
 *
 * Lifecycle management:
 * - Install events: Primeiro carregamento e setup
 * - Activate events: Atualizações e cleanup
 * - Update detection: Novas versões disponíveis
 * - Background sync: Sincronização automática
 * - Visibility changes: Otimizações baseadas em foco
 *
 * Padrões implementados:
 * - Service Worker pattern para proxy de rede
 * - Cache-aside pattern para estratégias de cache
 * - Observer pattern para eventos de lifecycle
 * - Queue pattern para operações offline
 * - Strategy pattern para diferentes tipos de cache
 *
 * @fileoverview Sistema completo de Progressive Web App
 * @version 2.0.0
 * @since 2024-01-27
 * @author Synapse Team
 */

import { logger } from '../../utils/logger';

/**
 * ===================================================================
 * EXPORTAÇÃO DE SERVIÇOS PWA
 * ===================================================================
 */
export { register, unregister, pwaUtils } from './serviceWorkerRegistration';
export { backgroundSyncService, getBackgroundSyncUtils } from './backgroundSync';
export { apiCache, staticCache, userDataCache, initializeCaching, getCacheUtils } from './caching';

/**
 * ===================================================================
 * EXPORTAÇÃO DE TIPOS E INTERFACES PWA
 * ===================================================================
 */
export type { ServiceWorkerConfig } from './serviceWorkerRegistration';
export type { SyncTask, SyncQueueStatus } from './backgroundSync';
export type { CacheConfig, CacheEntry, CacheStats } from './caching';

import { pwaUtils, register as registerSW } from './serviceWorkerRegistration';
import { backgroundSyncService } from './backgroundSync';
import { apiCache, initializeCaching } from './caching';

/**
 * Interface de configuração completa para funcionalidades PWA
 *
 * Define todas as opções de configuração disponíveis para personalizar
 * o comportamento dos serviços PWA conforme necessidades da aplicação.
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
 * Inicializa todas as funcionalidades PWA da aplicação
 *
 * Configura e ativa todos os serviços PWA incluindo service worker,
 * sistema de cache, sincronização em background, prompts de instalação
 * e suporte offline. Estabelece handlers para eventos de lifecycle.
 *
 * @param config - Configurações opcionais para personalizar comportamento
 * @returns Promise que resolve quando inicialização está completa
 *
 * @example
 * ```typescript
 * await initializePWA({
 *   serviceWorker: { enabled: true, scope: '/' },
 *   caching: { enabled: true },
 *   sync: { enabled: true, batchSize: 5 },
 *   install: { enabled: true, autoPrompt: false }
 * });
 * ```
 */
export const initializePWA = async (config: Partial<PWAConfig> = {}): Promise<void> => {
  const pwaConfig = { ...defaultConfig, ...config };

  try {
    logger.info('🚀 Inicializando funcionalidade PWA...');

    // Inicializa cache primeiro (necessário para outros serviços)
    if (pwaConfig.caching?.enabled) {
      initializeCaching();
    }

    // Inicializa sincronização em background
    if (pwaConfig.sync?.enabled) {
      backgroundSyncService.initialize();
    }

    // Registra service worker
    if (pwaConfig.serviceWorker?.enabled) {
      registerSW({
        onSuccess: registration => {
          logger.info('✅ PWA: Service Worker registrado com sucesso');

          // Configura notificações de atualização
          setupUpdateNotifications(registration);
        },

        onUpdate: registration => {
          logger.info('🔄 PWA: Nova versão disponível');

          // Mostra notificação de atualização
          showUpdateNotification(registration);
        },

        onOffline: () => {
          logger.info('📵 PWA: Aplicação está offline');
          showOfflineNotification();
        },

        onOnline: () => {
          logger.info('🌐 PWA: Aplicação está online');
          hideOfflineNotification();

          // Aciona sincronização em background
          if (pwaConfig.sync?.enabled) {
            backgroundSyncService.initialize();
          }
        },
      });
    }

    // Configura prompt de instalação
    if (pwaConfig.install?.enabled) {
      pwaUtils.setupInstallPrompt();

      if (pwaConfig.install.autoPrompt) {
        setTimeout(() => {
          showInstallPrompt();
        }, 30000); // Mostra após 30 segundos
      }
    }

    // Configura suporte offline
    if (pwaConfig.offline?.enabled) {
      setupOfflineSupport(pwaConfig.offline.fallbackPage);
    }

    // Configura handlers de lifecycle PWA
    setupPWALifecycle();

    logger.info('✅ Inicialização PWA concluída com sucesso');

    // Reporta capacidades PWA
    reportPWACapabilities();
  } catch (error) {
    logger.error('❌ Inicialização PWA falhou:', error);
    throw error;
  }
};

/**
 * Configura notificações de atualização do service worker
 *
 * Registra listeners para detectar quando uma nova versão do
 * service worker está disponível e configura a UI para notificar o usuário.
 *
 * @param registration - Registro do service worker
 * @private
 */
const setupUpdateNotifications = (registration: ServiceWorkerRegistration): void => {
  // Escuta atualizações
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;

    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nova versão está pronta
          dispatchPWAEvent('update-available', { registration });
        }
      });
    }
  });
};

/**
 * Exibe notificação visual quando atualização está disponível
 *
 * Cria uma notificação estilizada informando sobre nova versão
 * e oferecendo opções para atualizar imediatamente ou adiar.
 *
 * @param registration - Registro do service worker para atualização
 * @private
 */
const showUpdateNotification = (registration: ServiceWorkerRegistration): void => {
  // Cria notificação de atualização
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

  // Trata atualização
  const updateBtn = document.getElementById('pwa-update-btn');
  updateBtn?.addEventListener('click', () => {
    // Pula espera e recarrega
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  });

  // Trata dispensa
  const dismissBtn = document.getElementById('pwa-dismiss-btn');
  dismissBtn?.addEventListener('click', () => {
    notification.remove();
  });

  // Remove automaticamente após 30 segundos
  setTimeout(() => {
    if (document.getElementById('pwa-update-notification')) {
      notification.remove();
    }
  }, 30000);
};

/**
 * Exibe notificação quando aplicação está offline
 *
 * Mostra um indicador visual informando que a aplicação está
 * funcionando em modo offline com funcionalidades limitadas.
 *
 * @private
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
 * Remove notificação de status offline quando conectividade é restaurada
 *
 * @private
 */
const hideOfflineNotification = (): void => {
  const notification = document.getElementById('pwa-offline-notification');
  if (notification) {
    notification.remove();
  }
};

/**
 * Exibe prompt customizado para instalação da PWA
 *
 * Apresenta uma interface amigável incentivando o usuário a
 * instalar a aplicação para melhor experiência e acesso offline.
 *
 * @private
 */
const showInstallPrompt = (): void => {
  // Mostra apenas se não estiver instalado e prompt disponível
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

  // Trata instalação (isso acionaria o prompt nativo de instalação)
  const installBtn = document.getElementById('pwa-install-btn');
  installBtn?.addEventListener('click', () => {
    // O prompt real de instalação seria tratado por setupInstallPrompt
    const installEvent = new CustomEvent('trigger-install-prompt');
    window.dispatchEvent(installEvent);
    notification.remove();
  });

  // Trata dispensa
  const dismissBtn = document.getElementById('pwa-install-dismiss-btn');
  dismissBtn?.addEventListener('click', () => {
    notification.remove();

    // Não mostra novamente nesta sessão
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  });

  // Dispensa automaticamente após 60 segundos
  setTimeout(() => {
    if (document.getElementById('pwa-install-notification')) {
      notification.remove();
    }
  }, 60000);
};

/**
 * Configura suporte completo para funcionamento offline
 *
 * Implementa estratégias de fallback, cache de páginas offline
 * e handlers para transições online/offline.
 *
 * @param fallbackPage - Página de fallback para navegação offline
 * @private
 */
const setupOfflineSupport = (fallbackPage?: string): void => {
  // Faz cache da página de fallback
  if (fallbackPage && 'caches' in window) {
    caches.open('synapse-offline').then(cache => {
      cache.add(fallbackPage);
    });
  }

  // Trata navegação offline
  window.addEventListener('online', () => {
    dispatchPWAEvent('network-online');
  });

  window.addEventListener('offline', () => {
    dispatchPWAEvent('network-offline');
  });
};

/**
 * Configura handlers para eventos de lifecycle da PWA
 *
 * Registra listeners para eventos importantes do lifecycle
 * incluindo instalação, prompt de instalação e mudanças de visibilidade.
 *
 * @private
 */
const setupPWALifecycle = (): void => {
  // Trata instalação do app
  window.addEventListener('appinstalled', () => {
    logger.info('📱 PWA instalado com sucesso');
    dispatchPWAEvent('app-installed');

    // Esconde notificação de instalação se visível
    const installNotification = document.getElementById('pwa-install-notification');
    if (installNotification) {
      installNotification.remove();
    }
  });

  // Trata beforeinstallprompt
  window.addEventListener('beforeinstallprompt', event => {
    logger.info('💡 Prompt de instalação PWA disponível');
    dispatchPWAEvent('install-prompt-available', { event });
  });

  // Trata mudança de visibilidade
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // App ficou visível - bom momento para sincronizar
      dispatchPWAEvent('app-focus');
    }
  });
};

/**
 * Dispatcha eventos customizados relacionados à PWA
 *
 * Permite comunicação entre componentes através de eventos
 * personalizados relacionados ao estado e ações da PWA.
 *
 * @param type - Tipo do evento PWA
 * @param detail - Dados opcionais do evento
 * @private
 */
const dispatchPWAEvent = (type: string, detail?: unknown): void => {
  const event = new CustomEvent(`pwa:${type}`, { detail });
  window.dispatchEvent(event);
};

/**
 * Detecta e reporta capacidades PWA do navegador
 *
 * Verifica suporte para service workers, background sync,
 * notificações push, cache API e outras funcionalidades PWA.
 *
 * @private
 */
const reportPWACapabilities = (): void => {
  const capabilities = {
    serviceWorker: 'serviceWorker' in navigator,
    backgroundSync:
      'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    pushNotifications: 'Notification' in window && 'serviceWorker' in navigator,
    installPrompt: 'BeforeInstallPromptEvent' in window,
    webShare: 'share' in navigator,
    cacheAPI: 'caches' in window,
    indexedDB: 'indexedDB' in window,
    offlineCapable: navigator.onLine !== undefined,
    standalone: pwaUtils.isStandalone(),
  };

  logger.info('📊 Capacidades PWA:', capabilities);

  // Armazena capacidades para uso posterior
  (window as any).__PWA_CAPABILITIES__ = capabilities;
};

/**
 * Obtém status completo dos serviços PWA
 *
 * Agrega informações de todos os serviços PWA incluindo
 * conectividade, sincronização, cache e capacidades do navegador.
 *
 * @returns Objeto com status detalhado da PWA
 *
 * @example
 * ```typescript
 * const status = getPWAStatus();
 *
 * console.log('Online:', status.online);
 * console.log('Sync queue:', status.sync.pending);
 * console.log('Cache size:', status.cache.size);
 * console.log('Standalone mode:', status.standalone);
 * ```
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
 * Desativa todos os serviços PWA e realiza cleanup
 *
 * Para serviços em execução, remove notificações visuais
 * e libera recursos. Útil para testes ou ao desmontar aplicação.
 *
 * @returns Promise que resolve quando shutdown está completo
 *
 * @example
 * ```typescript
 * // No cleanup da aplicação
 * window.addEventListener('beforeunload', async () => {
 *   await shutdownPWA();
 * });
 * ```
 */
export const shutdownPWA = async (): Promise<void> => {
  try {
    logger.info('🛑 Desligando serviços PWA...');

    // Para sincronização em background
    backgroundSyncService.shutdown();

    // Limpa notificações
    const notifications = [
      'pwa-update-notification',
      'pwa-offline-notification',
      'pwa-install-notification',
    ];

    notifications.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.remove();
      }
    });

    logger.info('✅ Desligamento dos serviços PWA concluído');
  } catch (error) {
    logger.error('❌ Desligamento PWA falhou:', error);
  }
};

/**
 * Obtém utilitários e funções auxiliares da PWA
 *
 * Fornece acesso a métodos utilitários para interação
 * com funcionalidades PWA de forma programática.
 *
 * @returns Objeto com métodos utilitários da PWA
 *
 * @example
 * ```typescript
 * const pwaUtils = getPWAUtils();
 *
 * // Verificar por atualizações manualmente
 * await pwaUtils.checkForUpdates();
 *
 * // Solicitar armazenamento persistente
 * const granted = await pwaUtils.requestPersistentStorage();
 *
 * // Obter estimativa de uso de armazenamento
 * const estimate = await pwaUtils.getStorageEstimate();
 * ```
 */
export const getPWAUtils = () => {
  return {
    getStatus: getPWAStatus,
    checkForUpdates: pwaUtils.checkForUpdates,
    requestPersistentStorage: pwaUtils.requestPersistentStorage,
    getStorageEstimate: pwaUtils.getStorageEstimate,
  };
};

/**
 * ===================================================================
 * EXPORTAÇÃO PADRÃO DO MÓDULO PWA
 * ===================================================================
 */
export default {
  initializePWA,
  getPWAStatus,
  shutdownPWA,
  getPWAUtils,
};
