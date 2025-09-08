import React, { useMemo, useState } from 'react';
import {
  IoAlertCircle,
  IoCheckmarkCircle,
  IoCheckmarkDone,
  IoClose,
  IoInformationCircle,
  IoNotifications,
  IoNotificationsOutline,
  IoTime,
  IoTrash,
  IoWarning,
} from 'react-icons/io5';
import { type Notification, useNotifications } from '../../../hooks/useNotifications';
import styles from './NotificationCenter.module.css';

interface NotificationCenterProps {
  className?: string;
}

const notificationIcons = {
  success: <IoCheckmarkCircle size={20} />,
  error: <IoAlertCircle size={20} />,
  warning: <IoWarning size={20} />,
  info: <IoInformationCircle size={20} />,
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getNotificationsByType,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | Notification['type']>('all');

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (filter === 'unread') {
      filtered = notifications.filter(n => !n.read);
    } else if (filter !== 'all') {
      filtered = getNotificationsByType(filter);
    }

    return filtered.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [notifications, filter, getNotificationsByType]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now.getTime() - notificationTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'agora mesmo';
    }
    if (diffMins < 60) {
      return `há ${diffMins} min`;
    }
    if (diffHours < 24) {
      return `há ${diffHours}h`;
    }
    if (diffDays < 7) {
      return `há ${diffDays} dia(s)`;
    }

    return notificationTime.toLocaleDateString('pt-BR');
  };

  const getFilterCounts = () => {
    return {
      all: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      success: getNotificationsByType('success').length,
      error: getNotificationsByType('error').length,
      warning: getNotificationsByType('warning').length,
      info: getNotificationsByType('info').length,
    };
  };

  const filterCounts = getFilterCounts();

  return (
    <div className={`${styles.notificationCenter} ${className || ''}`}>
      {/* Notification Bell */}
      <button
        className={`${styles.bellButton} ${unreadCount > 0 ? styles.hasUnread : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`${unreadCount} notificações não lidas`}
      >
        {unreadCount > 0 ? <IoNotifications size={20} /> : <IoNotificationsOutline size={20} />}
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={styles.panel}>
            <div className={styles.header}>
              <div className={styles.headerTitle}>
                <IoNotifications size={20} />
                <span>Notificações</span>
                {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>}
              </div>
              <div className={styles.headerActions}>
                {unreadCount > 0 && (
                  <button
                    className={styles.headerAction}
                    onClick={markAllAsRead}
                    title='Marcar todas como lidas'
                  >
                    <IoCheckmarkDone size={16} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button className={styles.headerAction} onClick={clearAll} title='Limpar todas'>
                    <IoTrash size={16} />
                  </button>
                )}
                <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
                  <IoClose size={16} />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
              <button
                className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
                onClick={() => setFilter('all')}
              >
                Todas ({filterCounts.all})
              </button>
              <button
                className={`${styles.filterButton} ${filter === 'unread' ? styles.active : ''}`}
                onClick={() => setFilter('unread')}
              >
                Não lidas ({filterCounts.unread})
              </button>
              {filterCounts.error > 0 && (
                <button
                  className={`${styles.filterButton} ${styles.errorFilter} ${filter === 'error' ? styles.active : ''}`}
                  onClick={() => setFilter('error')}
                >
                  Erros ({filterCounts.error})
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className={styles.notificationsList}>
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`${styles.notificationItem} ${
                      !notification.read ? styles.unread : ''
                    } ${styles[notification.type]}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={styles.notificationIcon}>
                      {notificationIcons[notification.type]}
                    </div>
                    <div className={styles.notificationContent}>
                      <div className={styles.notificationTitle}>{notification.title}</div>
                      <div className={styles.notificationMessage}>{notification.message}</div>
                      <div className={styles.notificationTime}>
                        <IoTime size={12} />
                        {formatRelativeTime(notification.timestamp)}
                      </div>
                      {notification.actions && notification.actions.length > 0 && (
                        <div className={styles.notificationActions}>
                          {notification.actions.map(action => (
                            <button
                              key={action.id}
                              className={`${styles.actionButton} ${styles[action.type]}`}
                              onClick={e => {
                                e.stopPropagation();
                                action.onClick(notification);
                              }}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={e => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      title='Remover notificação'
                    >
                      <IoClose size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <IoNotificationsOutline size={48} className={styles.emptyIcon} />
                  <div className={styles.emptyTitle}>
                    {filter === 'all'
                      ? 'Nenhuma notificação'
                      : filter === 'unread'
                        ? 'Nenhuma notificação não lida'
                        : `Nenhuma notificação do tipo ${filter}`}
                  </div>
                  <div className={styles.emptyDescription}>
                    {filter === 'all'
                      ? 'Você está em dia! Não há notificações para mostrar.'
                      : 'Tente alterar o filtro para ver outras notificações.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
