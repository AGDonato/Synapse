/**
 * Hook para sistema de notificações da aplicação
 *
 * @description
 * Gerencia notificações do usuário com funcionalidades:
 * - Criação de notificações de diferentes tipos (sucesso, erro, aviso, info)
 * - Persistência opcional no localStorage
 * - Marcação automática como lida após tempo configurado
 * - Ações customizadas nas notificações
 * - Limite máximo de notificações armazenadas
 *
 * @example
 * const { notifications, addNotification, markAsRead } = useNotifications();
 *
 * addNotification({
 *   type: 'success',
 *   title: 'Sucesso!',
 *   message: 'Demanda criada com sucesso',
 *   duration: 5000
 * });
 *
 * @module hooks/useNotifications
 */

import { useCallback, useEffect, useState } from 'react';
import { logger } from '../../shared/utils/logger';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  persistent?: boolean;
  duration?: number;
  actions?: NotificationAction[];
  metadata?: Record<string, unknown>;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  onClick: (notification: Notification) => void;
}

interface UseNotificationsOptions {
  maxNotifications?: number;
  persistToStorage?: boolean;
  storageKey?: string;
  autoMarkReadAfter?: number; // milissegundos
}

/**
 * Hook principal para gerenciar notificações
 *
 * @param options - Opções de configuração:
 *   - maxNotifications: Número máximo de notificações (padrão: 100)
 *   - persistToStorage: Salvar no localStorage (padrão: true)
 *   - storageKey: Chave do localStorage (padrão: 'app_notifications')
 *   - autoMarkReadAfter: Tempo para marcar como lida em ms (padrão: 10000)
 */
export function useNotifications({
  maxNotifications = 100,
  persistToStorage = true,
  storageKey = 'app_notifications',
  autoMarkReadAfter = 10000, // 10 segundos
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Carrega notificações persistidas do localStorage na inicialização
  useEffect(() => {
    if (persistToStorage) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsedNotifications = JSON.parse(stored) as Notification[];
          setNotifications(parsedNotifications.slice(0, maxNotifications));
        }
      } catch (error) {
        logger.error('Erro ao carregar notificações do localStorage:', error);
      }
    }
  }, [persistToStorage, storageKey, maxNotifications]);

  // Persiste notificações no localStorage sempre que há alterações
  useEffect(() => {
    if (persistToStorage && notifications.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(notifications));
      } catch (error) {
        logger.error('Erro ao salvar notificações no localStorage:', error);
      }
    }
  }, [notifications, persistToStorage, storageKey]);

  // Marca uma notificação específica como lida
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  // Adiciona uma nova notificação ao início da lista
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        read: false,
      };

      setNotifications(prev => {
        const updated = [newNotification, ...prev].slice(0, maxNotifications);
        return updated;
      });

      // Marca automaticamente como lida após tempo especificado (notificações não-persistentes)
      if (!notification.persistent && autoMarkReadAfter > 0) {
        setTimeout(() => {
          markAsRead(newNotification.id);
        }, autoMarkReadAfter);
      }

      return newNotification;
    },
    [maxNotifications, autoMarkReadAfter, markAsRead]
  );

  // Marca todas as notificações como lidas de uma vez
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  }, []);

  // Remove uma notificação específica da lista
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Limpa todas as notificações (memória e localStorage)
  const clearAll = useCallback(() => {
    setNotifications([]);
    if (persistToStorage) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        logger.error('Erro ao limpar notificações do localStorage:', error);
      }
    }
  }, [persistToStorage, storageKey]);

  // Remove notificações antigas (mais antigas que o número de dias especificado)
  const clearOldNotifications = useCallback((daysOld = 7) => {
    // Calcula data de corte baseada no número de dias
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Mantém apenas notificações mais recentes que a data de corte
    setNotifications(prev =>
      prev.filter(notification => new Date(notification.timestamp) > cutoffDate)
    );
  }, []);

  // Filtra notificações por tipo específico
  const getNotificationsByType = useCallback(
    (type: Notification['type']) => {
      return notifications.filter(notification => notification.type === type);
    },
    [notifications]
  );

  // Obtém apenas notificações não lidas
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.read);
  }, [notifications]);

  // Conta total de notificações não lidas
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Métodos de conveniência para tipos comuns de notificação
  const showSuccess = useCallback(
    (title: string, message: string, options?: Partial<Notification>) => {
      return addNotification({ ...options, type: 'success', title, message });
    },
    [addNotification]
  );

  const showError = useCallback(
    (title: string, message: string, options?: Partial<Notification>) => {
      return addNotification({ ...options, type: 'error', title, message, persistent: true });
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (title: string, message: string, options?: Partial<Notification>) => {
      return addNotification({ ...options, type: 'warning', title, message });
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (title: string, message: string, options?: Partial<Notification>) => {
      return addNotification({ ...options, type: 'info', title, message });
    },
    [addNotification]
  );

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    clearOldNotifications,
    getNotificationsByType,
    getUnreadNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
