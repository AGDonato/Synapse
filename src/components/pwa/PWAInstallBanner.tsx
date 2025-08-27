
// src/components/pwa/PWAInstallBanner.tsx

import React, { useEffect, useState } from 'react';
import { createModuleLogger } from '../../utils/logger';

// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
import { pwaUtils } from '../../services/pwa/serviceWorkerRegistration';

const logger = createModuleLogger('PWAInstallBanner');

interface PWAInstallBannerProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onInstall, onDismiss }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(pwaUtils.isStandalone());

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show banner only if not in standalone mode and not dismissed
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!pwaUtils.isStandalone() && !dismissed) {
        setShowBanner(true);
      }
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      logger.info('PWA foi instalado com sucesso');
      setShowBanner(false);
      setDeferredPrompt(null);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      logger.info('Resposta do usuário', { outcome });
      
      if (outcome === 'accepted') {
        logger.info('Usuário aceitou instalar o PWA');
      } else {
        logger.info('Usuário rejeitou instalar o PWA');
      }
      
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    onDismiss?.();
  };

  if (!showBanner || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-blue-600 text-white rounded-lg shadow-lg p-4 animate-slide-up">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            📱
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium">Instalar Synapse</h3>
          <p className="text-xs text-blue-100 mt-1">
            Adicione o Synapse à sua tela inicial para acesso rápido e uso offline.
          </p>
          
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleInstallClick}
              className="text-xs bg-white text-blue-600 px-3 py-1 rounded-md font-medium hover:bg-blue-50 transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs text-blue-100 hover:text-white transition-colors px-2 py-1"
            >
              Agora não
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-blue-100 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;