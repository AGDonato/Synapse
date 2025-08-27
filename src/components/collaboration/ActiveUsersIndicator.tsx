
/**
 * Active Users Indicator
 * Componente para exibir usuários ativos em tempo real
 * Otimizado para até 4 usuários simultâneos
 */

import React, { useEffect, useMemo, useState } from 'react';
import { 
  Clock, 
  Edit, 
  Eye, 
  Lock, 
  MoreHorizontal, 
  User as UserIcon, 
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useCollaboration, type ActiveUser, type DocumentLock } from '../../services/collaboration/websocket';
import styles from './ActiveUsersIndicator.module.css';

export interface ActiveUsersIndicatorProps {
  entityType?: string;
  entityId?: number;
  showDetails?: boolean;
  compact?: boolean;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  onUserClick?: (user: ActiveUser) => void;
}

interface UserActivity {
  user: ActiveUser;
  isEditing: boolean;
  hasLock: boolean;
  lastActivity: string;
  status: 'active' | 'idle' | 'away';
}

/**
 * Componente principal
 */
export const ActiveUsersIndicator: React.FC<ActiveUsersIndicatorProps> = ({
  entityType,
  entityId,
  showDetails = false,
  compact = false,
  position = 'top-right',
  onUserClick
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(false);

  const {
    activeUsers,
    isLocked,
    isConnected,
    addEventListener,
    removeEventListener
  } = useCollaboration(entityType, entityId);

  // Estado local para rastrear atividades
  const [userActivities, setUserActivities] = useState<Map<string, UserActivity>>(new Map());

  // Processar usuários ativos e suas atividades
  const processedUsers = useMemo(() => {
    const now = Date.now();
    
    return activeUsers.map(user => {
      const timeSinceLastActivity = now - user.lastActivity;
      let status: 'active' | 'idle' | 'away' = 'active';

      if (timeSinceLastActivity > 5 * 60 * 1000) { // 5 minutos
        status = 'away';
      } else if (timeSinceLastActivity > 2 * 60 * 1000) { // 2 minutos
        status = 'idle';
      }

      const isEditing = user.currentEntity?.isEditing || false;
      const hasLock = Boolean(isLocked && isLocked.userId === user.userId);

      return {
        user,
        isEditing,
        hasLock,
        lastActivity: formatLastActivity(user.lastActivity),
        status
      } as UserActivity;
    });
  }, [activeUsers, isLocked]);

  // Estatísticas dos usuários
  const userStats = useMemo(() => {
    const total = processedUsers.length;
    const editing = processedUsers.filter(u => u.isEditing).length;
    const locked = processedUsers.filter(u => u.hasLock).length;
    const active = processedUsers.filter(u => u.status === 'active').length;

    return { total, editing, locked, active };
  }, [processedUsers]);

  // Configurar listeners para eventos de colaboração
  useEffect(() => {
    const handleUserActivity = (event: unknown) => {
      setUserActivities(prev => {
        const updated = new Map(prev);
        const userId = event.userId;
        
        if (event.type === 'typing') {
          updated.set(userId, {
            ...updated.get(userId),
            isTyping: event.data?.isTyping || false,
            typingField: event.data?.fieldName
          } as any);
        }

        return updated;
      });
    };

    addEventListener('typing', handleUserActivity);
    addEventListener('cursor_moved', handleUserActivity);
    addEventListener('document_locked', handleUserActivity);
    addEventListener('document_unlocked', handleUserActivity);

    return () => {
      removeEventListener('typing', handleUserActivity);
      removeEventListener('cursor_moved', handleUserActivity);
      removeEventListener('document_locked', handleUserActivity);
      removeEventListener('document_unlocked', handleUserActivity);
    };
  }, [addEventListener, removeEventListener]);

  // Renderizar avatar do usuário
  const renderUserAvatar = (activity: UserActivity, size: 'small' | 'medium' | 'large' = 'medium') => {
    const { user, status, isEditing, hasLock } = activity;
    const sizeClass = styles[`avatar-${size}`];
    const statusClass = styles[`status-${status}`];

    return (
      <div 
        key={user.userId}
        className={`${styles.userAvatar} ${sizeClass} ${statusClass}`}
        onClick={() => onUserClick?.(user)}
        title={`${user.userName} - ${status}`}
      >
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.userName}
            className={styles.avatarImage}
          />
        ) : (
          <div className={styles.avatarInitials}>
            {getUserInitials(user.userName)}
          </div>
        )}
        
        {/* Indicadores de status */}
        <div className={styles.statusIndicators}>
          {isEditing && <Edit size={10} className={styles.editingIcon} />}
          {hasLock && <Lock size={10} className={styles.lockIcon} />}
        </div>

        {/* Indicador de conexão */}
        <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
          {isConnected ? <Wifi size={8} /> : <WifiOff size={8} />}
        </div>
      </div>
    );
  };

  // Renderizar tooltip com detalhes
  const renderTooltip = () => (
    <div className={`${styles.tooltip} ${styles[position]}`}>
      <div className={styles.tooltipHeader}>
        <Users size={16} />
        <span>{userStats.total} usuários ativos</span>
        {!isConnected && <WifiOff size={14} className={styles.disconnectedIcon} />}
      </div>
      
      <div className={styles.tooltipStats}>
        <div className={styles.stat}>
          <Edit size={12} />
          <span>{userStats.editing} editando</span>
        </div>
        <div className={styles.stat}>
          <Lock size={12} />
          <span>{userStats.locked} com bloqueios</span>
        </div>
      </div>

      <div className={styles.usersList}>
        {processedUsers.map(activity => (
          <div key={activity.user.userId} className={styles.userItem}>
            {renderUserAvatar(activity, 'small')}
            <div className={styles.userInfo}>
              <span className={styles.userName}>{activity.user.userName}</span>
              <span className={styles.userActivity}>
                {activity.isEditing ? 'Editando' : 
                 activity.hasLock ? 'Bloqueou documento' :
                 activity.status === 'active' ? 'Visualizando' : 
                 activity.status === 'idle' ? 'Inativo' : 'Ausente'}
              </span>
              <span className={styles.lastActivity}>
                <Clock size={10} />
                {activity.lastActivity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Renderizar versão detalhada
  const renderDetailedView = () => (
    <div className={styles.detailedView}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Users size={20} />
          <span>Usuários Ativos ({userStats.total})</span>
        </div>
        
        <div className={styles.connectionStatus}>
          {isConnected ? (
            <div className={styles.connected}>
              <Wifi size={14} />
              <span>Conectado</span>
            </div>
          ) : (
            <div className={styles.disconnected}>
              <WifiOff size={14} />
              <span>Desconectado</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Edit size={16} />
          <div>
            <span className={styles.statValue}>{userStats.editing}</span>
            <span className={styles.statLabel}>Editando</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <Lock size={16} />
          <div>
            <span className={styles.statValue}>{userStats.locked}</span>
            <span className={styles.statLabel}>Bloqueios</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <Eye size={16} />
          <div>
            <span className={styles.statValue}>{userStats.active}</span>
            <span className={styles.statLabel}>Ativos</span>
          </div>
        </div>
      </div>

      <div className={styles.usersList}>
        {processedUsers.map(activity => (
          <div 
            key={activity.user.userId} 
            className={`${styles.userCard} ${styles[activity.status]}`}
            onClick={() => onUserClick?.(activity.user)}
          >
            {renderUserAvatar(activity, 'large')}
            
            <div className={styles.userDetails}>
              <div className={styles.userName}>{activity.user.userName}</div>
              
              <div className={styles.userMeta}>
                <span className={styles.status}>
                  {activity.status === 'active' ? 'Ativo' :
                   activity.status === 'idle' ? 'Inativo' : 'Ausente'}
                </span>
                <span className={styles.lastActivity}>
                  <Clock size={12} />
                  {activity.lastActivity}
                </span>
              </div>

              <div className={styles.userActions}>
                {activity.isEditing && (
                  <div className={styles.action}>
                    <Edit size={12} />
                    <span>Editando</span>
                  </div>
                )}
                {activity.hasLock && (
                  <div className={styles.action}>
                    <Lock size={12} />
                    <span>Documento bloqueado</span>
                  </div>
                )}
                {activity.user.currentEntity && (
                  <div className={styles.action}>
                    <Eye size={12} />
                    <span>
                      {activity.user.currentEntity.type} #{activity.user.currentEntity.id}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Renderização condicional baseada no modo
  if (showDetails) {
    return renderDetailedView();
  }

  if (compact) {
    return (
      <div className={`${styles.compactIndicator} ${styles[position]}`}>
        <div className={styles.avatarsStack}>
          {processedUsers.slice(0, 3).map(activity => 
            renderUserAvatar(activity, 'small')
          )}
          {processedUsers.length > 3 && (
            <div className={`${styles.userAvatar} ${styles['avatar-small']} ${styles.moreUsers}`}>
              <MoreHorizontal size={12} />
            </div>
          )}
        </div>
        
        {!isConnected && (
          <WifiOff size={12} className={styles.disconnectedOverlay} />
        )}
      </div>
    );
  }

  // Renderização padrão
  return (
    <div 
      className={`${styles.activeUsersIndicator} ${styles[position]}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setExpandedDetails(!expandedDetails)}
    >
      <div className={styles.indicator}>
        <Users size={16} />
        <span className={styles.count}>{userStats.total}</span>
        
        {userStats.editing > 0 && (
          <div className={styles.editingBadge}>
            <Edit size={10} />
            <span>{userStats.editing}</span>
          </div>
        )}
        
        {!isConnected && <WifiOff size={12} className={styles.disconnectedIcon} />}
      </div>

      {showTooltip && renderTooltip()}
      
      {expandedDetails && (
        <div className={styles.expandedPanel}>
          {renderDetailedView()}
        </div>
      )}
    </div>
  );
};

/**
 * Utilitários
 */
function getUserInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

function formatLastActivity(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor(diff / 1000) % 60;

  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h atrás`;
  } else if (minutes > 0) {
    return `${minutes}min atrás`;
  } else {
    return `${seconds}s atrás`;
  }
}

export default ActiveUsersIndicator;