import { useCallback, useEffect, useState } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  persistent?: boolean;
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
  autoMarkReadAfter?: number; // milliseconds
}

export function useNotifications({
  maxNotifications = 100,
  persistToStorage = true,
  storageKey = 'app_notifications',
  autoMarkReadAfter = 10000, // 10 seconds
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (persistToStorage) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsedNotifications = JSON.parse(stored) as Notification[];
          setNotifications(parsedNotifications.slice(0, maxNotifications));
        }
      } catch (error) {
        logger.error('Error loading notifications from storage:', error);
      }
    }
  }, [persistToStorage, storageKey, maxNotifications]);

  // Save notifications to localStorage when they change
  useEffect(() => {
    if (persistToStorage && notifications.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(notifications));
      } catch (error) {
        logger.error('Error saving notifications to storage:', error);
      }
    }
  }, [notifications, persistToStorage, storageKey]);

  // Add a new notification
  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
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

    // Auto-mark as read after specified time (for non-persistent notifications)
    if (!notification.persistent && autoMarkReadAfter > 0) {
      setTimeout(() => {
        markAsRead(newNotification.id);
      }, autoMarkReadAfter);
    }

    return newNotification;
  }, [maxNotifications, autoMarkReadAfter]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    if (persistToStorage) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        logger.error('Error clearing notifications from storage:', error);
      }
    }
  }, [persistToStorage, storageKey]);

  // Clear old notifications (older than specified days)
  const clearOldNotifications = useCallback((daysOld = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    setNotifications(prev =>
      prev.filter(notification =>
        new Date(notification.timestamp) > cutoffDate
      )
    );
  }, []);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: Notification['type']) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.read);
  }, [notifications]);

  // Get unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Quick notification methods
  const showSuccess = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ ...options, type: 'success', title, message });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ ...options, type: 'error', title, message, persistent: true });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ ...options, type: 'warning', title, message });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ ...options, type: 'info', title, message });
  }, [addNotification]);

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