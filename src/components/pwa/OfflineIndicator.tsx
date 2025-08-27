// src/components/pwa/OfflineIndicator.tsx

import React, { useEffect, useState } from 'react';

// Network Connection API types
interface NetworkConnection {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection;
}
import { pwaUtils } from '../../services/pwa/serviceWorkerRegistration';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<NetworkConnection | null>(null);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (!online) {
        setShowOfflineMessage(true);
      } else {
        // Hide offline message after being back online
        setTimeout(() => setShowOfflineMessage(false), 3000);
      }
      
      // Update network info
      const status = pwaUtils.getNetworkStatus();
      setNetworkInfo(status.connection);
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for network changes
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Listen for connection changes (if supported)
    const navWithConnection = navigator as NavigatorWithConnection;
    if (navWithConnection.connection) {
      navWithConnection.connection.addEventListener('change', updateOnlineStatus);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      const navWithConnection = navigator as NavigatorWithConnection;
      if (navWithConnection.connection) {
        navWithConnection.connection.removeEventListener('change', updateOnlineStatus);
      }
    };
  }, []);

  if (!showOfflineMessage && isOnline) {
    return null;
  }

  return (
    <div
      className={`fixed top-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 rounded-lg shadow-lg p-4 transition-all duration-300 ${
        isOnline
          ? 'bg-green-600 text-white animate-fade-in'
          : 'bg-red-600 text-white animate-slide-down'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {isOnline ? '🌐' : '📵'}
          </div>
        </div>
        
        <div className="flex-1">
          <h4 className="text-sm font-medium">
            {isOnline ? 'Conectado novamente!' : 'Sem conexão com a internet'}
          </h4>
          <p className="text-xs opacity-90 mt-1">
            {isOnline 
              ? 'Sincronizando dados...'
              : 'Você pode continuar trabalhando offline. Os dados serão sincronizados quando a conexão voltar.'
            }
          </p>
          
          {networkInfo && isOnline && (
            <div className="text-xs opacity-75 mt-2">
              Conexão: {networkInfo.effectiveType?.toUpperCase() || 'Desconhecida'}
              {networkInfo.downlink && ` • ${networkInfo.downlink} Mbps`}
              {networkInfo.saveData && ' • Modo econômico'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;