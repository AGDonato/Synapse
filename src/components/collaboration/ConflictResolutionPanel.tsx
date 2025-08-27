/**
 * Conflict Resolution Panel
 * Interface para resolução de conflitos em colaboração multi-usuário
 */

import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ChevronDown,
  ChevronUp, 
  Clock, 
  Edit3, 
  Eye,
  FileText,
  Merge,
  MessageSquare,
  RefreshCw,
  User,
  Users,
  X,
  Zap
} from 'lucide-react';
import styles from './ConflictResolutionPanel.module.css';

export interface ConflictData {
  id: string;
  type: 'field_conflict' | 'section_conflict' | 'document_conflict' | 'version_conflict';
  entityType: string;
  entityId: number;
  fieldName?: string;
  sectionName?: string;
  
  // Dados dos usuários envolvidos
  users: {
    id: string;
    name: string;
    avatar?: string;
    lastUpdate: string;
    value: any;
    metadata?: Record<string, any>;
  }[];
  
  // Estado do conflito
  status: 'pending' | 'resolving' | 'resolved' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt?: string;
  
  // Contexto adicional
  description?: string;
  suggestedResolution?: 'merge' | 'accept_latest' | 'accept_specific' | 'manual';
  automaticResolution?: boolean;
}

export interface ConflictResolutionPanelProps {
  conflicts: ConflictData[];
  onResolveConflict: (conflictId: string, resolution: ConflictResolution) => void;
  onCancelResolution: (conflictId: string) => void;
  onRequestMoreInfo: (conflictId: string) => void;
  showHistory?: boolean;
  compactMode?: boolean;
}

export interface ConflictResolution {
  type: 'accept_user' | 'merge_values' | 'custom_value' | 'cancel';
  selectedUserId?: string;
  mergedValue?: any;
  customValue?: any;
  comments?: string;
}

/**
 * Componente principal do painel de resolução de conflitos
 */
export const ConflictResolutionPanel: React.FC<ConflictResolutionPanelProps> = ({
  conflicts,
  onResolveConflict,
  onCancelResolution,
  onRequestMoreInfo,
  showHistory = false,
  compactMode = false
}) => {
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());
  const [resolutionStates, setResolutionStates] = useState<Map<string, Partial<ConflictResolution>>>(new Map());
  const [showResolved, setShowResolved] = useState(false);

  // Filtrar conflitos por status
  const activeConflicts = conflicts.filter(c => c.status !== 'resolved' && c.status !== 'cancelled');
  const resolvedConflicts = conflicts.filter(c => c.status === 'resolved' || c.status === 'cancelled');

  // Ordenar por prioridade e data
  const sortedActiveConflicts = activeConflicts.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Toggle expansão do conflito
  const toggleExpanded = (conflictId: string) => {
    const newExpanded = new Set(expandedConflicts);
    if (newExpanded.has(conflictId)) {
      newExpanded.delete(conflictId);
    } else {
      newExpanded.add(conflictId);
    }
    setExpandedConflicts(newExpanded);
  };

  // Atualizar estado de resolução
  const updateResolutionState = (conflictId: string, updates: Partial<ConflictResolution>) => {
    setResolutionStates(prev => {
      const newStates = new Map(prev);
      const current = newStates.get(conflictId) || {};
      newStates.set(conflictId, { ...current, ...updates });
      return newStates;
    });
  };

  // Aplicar resolução
  const applyResolution = (conflictId: string) => {
    const resolution = resolutionStates.get(conflictId);
    if (resolution?.type) {
      onResolveConflict(conflictId, resolution as ConflictResolution);
      setResolutionStates(prev => {
        const newStates = new Map(prev);
        newStates.delete(conflictId);
        return newStates;
      });
    }
  };

  // Renderizar ícone do tipo de conflito
  const renderConflictTypeIcon = (type: ConflictData['type']) => {
    switch (type) {
      case 'field_conflict': return <Edit3 size={16} />;
      case 'section_conflict': return <FileText size={16} />;
      case 'document_conflict': return <Users size={16} />;
      case 'version_conflict': return <RefreshCw size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  // Renderizar badge de prioridade
  const renderPriorityBadge = (priority: ConflictData['priority']) => {
    const priorityConfig = {
      critical: { label: 'Crítico', className: styles.critical },
      high: { label: 'Alta', className: styles.high },
      medium: { label: 'Média', className: styles.medium },
      low: { label: 'Baixa', className: styles.low }
    };

    const config = priorityConfig[priority];
    return (
      <span className={`${styles.priorityBadge} ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // Renderizar avatar do usuário
  const renderUserAvatar = (user: ConflictData['users'][0], size: 'small' | 'medium' = 'small') => {
    const sizeClass = size === 'small' ? styles.avatarSmall : styles.avatarMedium;
    
    return (
      <div className={`${styles.userAvatar} ${sizeClass}`} title={user.name}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className={styles.avatarImage} />
        ) : (
          <div className={styles.avatarInitials}>
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        )}
      </div>
    );
  };

  // Renderizar comparação de valores
  const renderValueComparison = (conflict: ConflictData) => {
    const resolution = resolutionStates.get(conflict.id);
    
    return (
      <div className={styles.valueComparison}>
        <div className={styles.valuesGrid}>
          {conflict.users.map((user, index) => (
            <div 
              key={user.id} 
              className={`${styles.valueOption} ${
                resolution?.selectedUserId === user.id ? styles.selected : ''
              }`}
              onClick={() => updateResolutionState(conflict.id, { 
                type: 'accept_user', 
                selectedUserId: user.id 
              })}
            >
              <div className={styles.valueHeader}>
                {renderUserAvatar(user, 'medium')}
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.name}</span>
                  <span className={styles.userTime}>
                    <Clock size={12} />
                    {formatRelativeTime(user.lastUpdate)}
                  </span>
                </div>
                {resolution?.selectedUserId === user.id && (
                  <Check size={16} className={styles.selectedIcon} />
                )}
              </div>
              
              <div className={styles.valuePreview}>
                {renderValuePreview(user.value, conflict.type)}
              </div>
            </div>
          ))}
        </div>

        {/* Opção de merge automático */}
        {conflict.suggestedResolution === 'merge' && (
          <div 
            className={`${styles.mergeOption} ${
              resolution?.type === 'merge_values' ? styles.selected : ''
            }`}
            onClick={() => updateResolutionState(conflict.id, { 
              type: 'merge_values',
              mergedValue: generateMergedValue(conflict)
            })}
          >
            <div className={styles.mergeHeader}>
              <Merge size={16} />
              <span>Mesclagem Automática</span>
              {resolution?.type === 'merge_values' && (
                <Check size={16} className={styles.selectedIcon} />
              )}
            </div>
            
            <div className={styles.mergePreview}>
              {renderValuePreview(
                resolution?.mergedValue || generateMergedValue(conflict),
                conflict.type
              )}
            </div>
          </div>
        )}

        {/* Opção de valor customizado */}
        <div className={styles.customValueOption}>
          <label className={styles.customLabel}>
            <input
              type="radio"
              name={`resolution-${conflict.id}`}
              checked={resolution?.type === 'custom_value'}
              onChange={() => updateResolutionState(conflict.id, { type: 'custom_value' })}
            />
            Valor personalizado:
          </label>
          
          {resolution?.type === 'custom_value' && (
            <textarea
              className={styles.customInput}
              placeholder="Digite o valor personalizado..."
              value={resolution.customValue || ''}
              onChange={(e) => updateResolutionState(conflict.id, { 
                customValue: e.target.value 
              })}
            />
          )}
        </div>
      </div>
    );
  };

  // Renderizar ações de resolução
  const renderResolutionActions = (conflict: ConflictData) => {
    const resolution = resolutionStates.get(conflict.id);
    const canResolve = resolution?.type;

    return (
      <div className={styles.resolutionActions}>
        <div className={styles.actionButtons}>
          <button
            className={styles.resolveButton}
            onClick={() => applyResolution(conflict.id)}
            disabled={!canResolve}
          >
            <Check size={16} />
            Aplicar Resolução
          </button>
          
          <button
            className={styles.cancelButton}
            onClick={() => onCancelResolution(conflict.id)}
          >
            <X size={16} />
            Cancelar
          </button>
          
          <button
            className={styles.infoButton}
            onClick={() => onRequestMoreInfo(conflict.id)}
          >
            <Eye size={16} />
            Mais Informações
          </button>
        </div>

        {/* Campo de comentários */}
        <div className={styles.commentsSection}>
          <textarea
            className={styles.commentsInput}
            placeholder="Adicionar comentários sobre a resolução (opcional)..."
            value={resolution?.comments || ''}
            onChange={(e) => updateResolutionState(conflict.id, { 
              comments: e.target.value 
            })}
          />
        </div>
      </div>
    );
  };

  // Renderizar conflito individual
  const renderConflict = (conflict: ConflictData) => {
    const isExpanded = expandedConflicts.has(conflict.id);
    const usersCount = conflict.users.length;

    return (
      <div key={conflict.id} className={`${styles.conflictCard} ${styles[conflict.priority]}`}>
        {/* Header do conflito */}
        <div 
          className={styles.conflictHeader}
          onClick={() => toggleExpanded(conflict.id)}
        >
          <div className={styles.conflictInfo}>
            <div className={styles.conflictIcon}>
              {renderConflictTypeIcon(conflict.type)}
            </div>
            
            <div className={styles.conflictDetails}>
              <div className={styles.conflictTitle}>
                {conflict.fieldName || conflict.sectionName || 'Conflito de documento'}
              </div>
              
              <div className={styles.conflictMeta}>
                <span className={styles.entityInfo}>
                  {conflict.entityType} #{conflict.entityId}
                </span>
                
                <div className={styles.usersIndicator}>
                  <Users size={12} />
                  <span>{usersCount} usuários</span>
                </div>
                
                <span className={styles.timeAgo}>
                  {formatRelativeTime(conflict.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.conflictStatus}>
            {renderPriorityBadge(conflict.priority)}
            
            <div className={styles.userAvatars}>
              {conflict.users.slice(0, 3).map(user => renderUserAvatar(user))}
              {usersCount > 3 && (
                <div className={styles.moreUsers}>+{usersCount - 3}</div>
              )}
            </div>

            <div className={styles.expandIcon}>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </div>

        {/* Conteúdo expandido */}
        {isExpanded && (
          <div className={styles.conflictContent}>
            {conflict.description && (
              <div className={styles.conflictDescription}>
                <p>{conflict.description}</p>
              </div>
            )}

            {renderValueComparison(conflict)}
            {renderResolutionActions(conflict)}
          </div>
        )}
      </div>
    );
  };

  // Renderizar painel compacto
  const renderCompactPanel = () => (
    <div className={styles.compactPanel}>
      <div className={styles.compactHeader}>
        <AlertTriangle size={16} />
        <span>{activeConflicts.length} conflitos</span>
      </div>
      
      {activeConflicts.slice(0, 3).map(conflict => (
        <div key={conflict.id} className={styles.compactConflict}>
          {renderConflictTypeIcon(conflict.type)}
          <span>{conflict.fieldName || 'Conflito'}</span>
          {renderPriorityBadge(conflict.priority)}
        </div>
      ))}
      
      {activeConflicts.length > 3 && (
        <div className={styles.moreConflicts}>
          +{activeConflicts.length - 3} mais
        </div>
      )}
    </div>
  );

  // Renderização principal
  if (compactMode) {
    return renderCompactPanel();
  }

  if (sortedActiveConflicts.length === 0 && !showHistory) {
    return (
      <div className={styles.emptyState}>
        <Check size={48} />
        <h3>Nenhum conflito ativo</h3>
        <p>Todos os conflitos foram resolvidos com sucesso.</p>
      </div>
    );
  }

  return (
    <div className={styles.conflictResolutionPanel}>
      {/* Header do painel */}
      <div className={styles.panelHeader}>
        <div className={styles.title}>
          <AlertTriangle size={20} />
          <span>Resolução de Conflitos</span>
          {sortedActiveConflicts.length > 0 && (
            <span className={styles.count}>{sortedActiveConflicts.length}</span>
          )}
        </div>

        {showHistory && resolvedConflicts.length > 0 && (
          <button
            className={styles.historyToggle}
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? 'Ocultar Histórico' : 'Ver Histórico'}
          </button>
        )}
      </div>

      {/* Lista de conflitos ativos */}
      <div className={styles.conflictsList}>
        {sortedActiveConflicts.map(renderConflict)}
      </div>

      {/* Histórico de conflitos resolvidos */}
      {showHistory && showResolved && resolvedConflicts.length > 0 && (
        <div className={styles.historySection}>
          <h3 className={styles.historyTitle}>Histórico</h3>
          <div className={styles.historyList}>
            {resolvedConflicts.map(conflict => (
              <div key={conflict.id} className={styles.historyItem}>
                <div className={styles.historyIcon}>
                  {conflict.status === 'resolved' ? (
                    <Check size={16} className={styles.resolvedIcon} />
                  ) : (
                    <X size={16} className={styles.cancelledIcon} />
                  )}
                </div>
                
                <div className={styles.historyDetails}>
                  <span className={styles.historyTitle}>
                    {conflict.fieldName || conflict.sectionName || 'Documento'}
                  </span>
                  <span className={styles.historyTime}>
                    {formatRelativeTime(conflict.updatedAt || conflict.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Funções auxiliares
 */
function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {return `${days}d atrás`;}
  if (hours > 0) {return `${hours}h atrás`;}
  if (minutes > 0) {return `${minutes}min atrás`;}
  return 'Agora há pouco';
}

function renderValuePreview(value: any, conflictType: string): React.ReactNode {
  if (typeof value === 'string') {
    return <span className="text-preview">{value.slice(0, 100)}...</span>;
  }
  
  if (typeof value === 'object' && value !== null) {
    return <span className="object-preview">{JSON.stringify(value).slice(0, 50)}...</span>;
  }
  
  return <span className="value-preview">{String(value)}</span>;
}

function generateMergedValue(conflict: ConflictData): any {
  // Implementação simplificada de merge
  // Em produção, usar algoritmo de merge mais sofisticado
  const values = conflict.users.map(u => u.value);
  
  if (values.every(v => typeof v === 'string')) {
    // Para strings, tentar combinar de forma inteligente
    const sortedByLength = values.sort((a, b) => b.length - a.length);
    return sortedByLength[0]; // Por enquanto, usar a string mais longa
  }
  
  // Para outros tipos, usar o valor mais recente
  const sortedByTime = conflict.users.sort((a, b) => 
    new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()
  );
  
  return sortedByTime[0].value;
}

export default ConflictResolutionPanel;