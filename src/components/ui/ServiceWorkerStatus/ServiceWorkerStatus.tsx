import React from 'react';
import { 
  IoCheckmarkCircle, 
  IoClose, 
  IoCloudDone, 
  IoCloudOffline,
  IoRefresh,
} from 'react-icons/io5';
import { useOfflineStatus, useServiceWorkerUpdate } from '../../../hooks/useServiceWorker';
import { useNotifications } from '../../../hooks/useNotifications';
import styles from './ServiceWorkerStatus.module.css';

interface ServiceWorkerStatusProps {
  className?: string;
}

export const ServiceWorkerStatus: React.FC<ServiceWorkerStatusProps> = ({
  className,
}) => {
  const { showUpdatePrompt, acceptUpdate, dismissUpdate } = useServiceWorkerUpdate();
  const { isOffline, wasOffline } = useOfflineStatus();
  const { showInfo, showSuccess, showWarning } = useNotifications();

  // Notificar sobre mudanças de status
  React.useEffect(() => {
    if (isOffline && !wasOffline) {
      showWarning(
        'Modo Offline',
        'Aplicação funcionando offline. Algumas funcionalidades podem estar limitadas.'
      );
    } else if (!isOffline && wasOffline) {
      showSuccess(
        'Conexão Restaurada',
        'Aplicação conectada novamente. Sincronizando dados...'
      );
    }
  }, [isOffline, wasOffline, showWarning, showSuccess]);

  // Notificar sobre updates disponíveis
  React.useEffect(() => {
    if (showUpdatePrompt) {
      showInfo(
        'Atualização Disponível',
        'Uma nova versão da aplicação está disponível.',
        {
          persistent: true,
          actions: [
            {
              id: 'update',
              label: 'Atualizar',
              type: 'primary',
              onClick: () => acceptUpdate(),
            },
            {
              id: 'later',
              label: 'Mais tarde',
              type: 'secondary',
              onClick: () => dismissUpdate(),
            },
          ],
        }
      );
    }
  }, [showUpdatePrompt, showInfo, acceptUpdate, dismissUpdate]);

  return (
    <div className={`${styles.serviceWorkerStatus} ${className || ''}`}>
      {/* Update Prompt */}
      {showUpdatePrompt && (
        <div className={styles.updatePrompt}>
          <div className={styles.promptContent}>
            <div className={styles.promptIcon}>
              <IoRefresh size={20} />
            </div>
            <div className={styles.promptText}>
              <div className={styles.promptTitle}>
                Nova versão disponível
              </div>
              <div className={styles.promptMessage}>
                Atualize para obter as últimas funcionalidades e correções
              </div>
            </div>
            <div className={styles.promptActions}>
              <button
                className={`${styles.promptButton} ${styles.primary}`}
                onClick={acceptUpdate}
                title="Atualizar agora"
              >
                <IoRefresh size={16} />
                Atualizar
              </button>
              <button
                className={`${styles.promptButton} ${styles.secondary}`}
                onClick={dismissUpdate}
                title="Atualizar mais tarde"
              >
                <IoClose size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Status */}
      <div className={`${styles.offlineStatus} ${isOffline ? styles.offline : styles.online}`}>
        <div className={styles.statusIcon}>
          {isOffline ? (
            <IoCloudOffline size={18} />
          ) : (
            <IoCloudDone size={18} />
          )}
        </div>
        <span className={styles.statusText}>
          {isOffline ? 'Offline' : 'Online'}
        </span>
        
        {/* Indicator dot */}
        <div className={`${styles.statusDot} ${isOffline ? styles.dotOffline : styles.dotOnline}`} />
      </div>

      {/* PWA Install Prompt (se suportado) */}
      <InstallPrompt />
    </div>
  );
};

// Componente para prompt de instalação PWA
const InstallPrompt: React.FC = () => {
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<unknown>(null);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir que o browser mostre o prompt automático
      e.preventDefault();
      
      // Salvar o evento para usar depois
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      logger.info('[PWA] App was installed');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {return;}

    // Mostrar o prompt de instalação
    deferredPrompt.prompt();

    // Aguardar escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      logger.info('[PWA] User accepted the install prompt');
    } else {
      logger.info('[PWA] User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    
    // Não mostrar novamente por um tempo
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  // Verificar se já foi dispensado recentemente
  React.useEffect(() => {
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      if (dismissedTime > oneDayAgo) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  if (!showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className={styles.installPrompt}>
      <div className={styles.installContent}>
        <div className={styles.installIcon}>
          <IoCheckmarkCircle size={20} />
        </div>
        <div className={styles.installText}>
          <div className={styles.installTitle}>
            Instalar Synapse
          </div>
          <div className={styles.installMessage}>
            Acesse rapidamente pelo desktop ou menu de apps
          </div>
        </div>
        <div className={styles.installActions}>
          <button
            className={`${styles.installButton} ${styles.primary}`}
            onClick={handleInstallClick}
            title="Instalar aplicação"
          >
            Instalar
          </button>
          <button
            className={`${styles.installButton} ${styles.secondary}`}
            onClick={handleDismissInstall}
            title="Não instalar agora"
          >
            <IoClose size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceWorkerStatus;