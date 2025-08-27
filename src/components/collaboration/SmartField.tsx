
/**
 * Smart Field Component
 * Campo com sistema de bloqueio inteligente integrado
 */

import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Edit3, 
  Eye, 
  Lock, 
  LockOpen,
  User
} from 'lucide-react';
import { type FieldLock, type LockConflict, smartLockManager, useSmartLocking } from '../../services/collaboration/smartLocking';
import styles from './SmartField.module.css';

export interface SmartFieldProps {
  // Identificação do campo
  fieldId: string;
  fieldName: string;
  fieldLabel?: string;
  
  // Entidade relacionada
  entityType: string;
  entityId: number;
  
  // Propriedades do input
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  
  // Configuração de bloqueio
  lockType?: 'field' | 'section' | 'document';
  lockTimeout?: number;
  autoLock?: boolean; // Bloquear automaticamente ao focar
  
  // Aparência
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  
  // Validação
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  
  // Callbacks
  onLockAcquired?: (lock: FieldLock) => void;
  onLockReleased?: (fieldId: string) => void;
  onLockConflict?: (conflict: LockConflict) => void;
}

/**
 * Componente SmartField com bloqueio inteligente
 */
export const SmartField = forwardRef<HTMLInputElement, SmartFieldProps>(({
  fieldId,
  fieldName,
  fieldLabel,
  entityType,
  entityId,
  value,
  onChange,
  onBlur,
  onFocus,
  lockType = 'field',
  lockTimeout,
  autoLock = true,
  type = 'text',
  placeholder,
  disabled = false,
  readOnly = false,
  className = '',
  required = false,
  pattern,
  minLength,
  maxLength,
  onLockAcquired,
  onLockReleased,
  onLockConflict,
}, ref) => {
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockInfo, setLockInfo] = useState<FieldLock | null>(null);
  const [conflict, setConflict] = useState<LockConflict | null>(null);
  const [lockExtensionCount, setLockExtensionCount] = useState(0);

  const {
    requestLock,
    releaseLock,
    isFieldLocked,
    getFieldLock,
    extendLock
  } = useSmartLocking(entityType, entityId);

  // Verificar status de bloqueio inicial e monitorar mudanças
  useEffect(() => {
    const checkLockStatus = () => {
      const locked = isFieldLocked(fieldId);
      const lock = getFieldLock(fieldId);
      
      setIsLocked(locked);
      setLockInfo(lock);
      
      // Limpar conflito se campo foi liberado
      if (!locked && conflict) {
        setConflict(null);
      }
    };

    // Verificar status inicial
    checkLockStatus();

    // Monitorar mudanças de lock
    const handleLockChange = (event: unknown) => {
      const { eventType, lock } = event.detail;
      
      if (lock.fieldId === fieldId) {
        checkLockStatus();
        
        if (eventType === 'field_locked' && lock.userId !== getCurrentUserId()) {
          // Campo foi bloqueado por outro usuário
          if (isFocused) {
            inputRef.current?.blur();
            setIsFocused(false);
          }
        }
      }
    };

    window.addEventListener('field-lock-change', handleLockChange);
    
    return () => {
      window.removeEventListener('field-lock-change', handleLockChange);
    };
  }, [fieldId, isFieldLocked, getFieldLock, conflict, isFocused]);

  // Handle focus
  const handleFocus = async (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    
    if (autoLock && !isLocked) {
      try {
        const result = await requestLock({
          fieldId,
          fieldName,
          entityType,
          entityId,
          lockType,
          timeout: lockTimeout
        });

        if (result.success && result.lock) {
          setLockInfo(result.lock);
          setIsLocked(false); // Não está bloqueado para nós
          onLockAcquired?.(result.lock);
        } else if (result.conflict) {
          setConflict(result.conflict);
          onLockConflict?.(result.conflict);
          
          // Mostrar conflito e desfocar
          e.target.blur();
          setIsFocused(false);
          return;
        }
      } catch (error) {
        logger.error('Erro ao solicitar bloqueio:', error);
      }
    }
    
    onFocus?.(e);
  };

  // Handle blur
  const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    
    // Liberar lock se foi adquirido automaticamente
    if (autoLock && lockInfo && lockInfo.userId === getCurrentUserId()) {
      try {
        await releaseLock(fieldId);
        setLockInfo(null);
        onLockReleased?.(fieldId);
      } catch (error) {
        logger.error('Erro ao liberar bloqueio:', error);
      }
    }
    
    onBlur?.(e);
  };

  // Handle change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Verificar se temos permissão para editar
    if (isLocked) {
      return; // Campo está bloqueado
    }
    
    onChange(e.target.value);
  };

  // Estender lock automaticamente quando próximo do vencimento
  useEffect(() => {
    if (lockInfo && lockInfo.userId === getCurrentUserId()) {
      const checkExpiration = () => {
        const timeRemaining = lockInfo.expiresAt - Date.now();
        
        // Estender quando restam menos de 1 minuto
        if (timeRemaining < 60000 && timeRemaining > 0 && lockExtensionCount < 3) {
          extendLock(fieldId, 300000).then(extended => {
            if (extended) {
              setLockExtensionCount(prev => prev + 1);
            }
          });
        }
      };

      const interval = setInterval(checkExpiration, 10000); // Verificar a cada 10s
      
      return () => clearInterval(interval);
    }
  }, [lockInfo, fieldId, extendLock, lockExtensionCount]);

  // Limpar lock ao desmontar componente
  useEffect(() => {
    return () => {
      if (lockInfo && lockInfo.userId === getCurrentUserId()) {
        releaseLock(fieldId).catch(console.error);
      }
    };
  }, []);

  // Calcular classes CSS
  const inputClasses = [
    styles.smartField,
    className,
    isLocked ? styles.locked : '',
    isFocused ? styles.focused : '',
    conflict ? styles.conflict : '',
    lockInfo && lockInfo.userId === getCurrentUserId() ? styles.ownedLock : ''
  ].filter(Boolean).join(' ');

  // Renderizar indicador de status
  const renderStatusIndicator = () => {
    if (conflict) {
      return (
        <div className={styles.statusIndicator} title="Conflito de bloqueio">
          <AlertTriangle size={16} className={styles.conflictIcon} />
        </div>
      );
    }

    if (isLocked && lockInfo) {
      return (
        <div 
          className={styles.statusIndicator} 
          title={`Bloqueado por ${lockInfo.userName}`}
        >
          <Lock size={16} className={styles.lockIcon} />
        </div>
      );
    }

    if (lockInfo && lockInfo.userId === getCurrentUserId()) {
      return (
        <div 
          className={styles.statusIndicator} 
          title="Você possui o bloqueio"
        >
          <LockOpen size={16} className={styles.ownLockIcon} />
        </div>
      );
    }

    if (isFocused) {
      return (
        <div className={styles.statusIndicator} title="Editando">
          <Edit3 size={16} className={styles.editingIcon} />
        </div>
      );
    }

    return null;
  };

  // Renderizar tooltip de informações
  const renderTooltip = () => {
    if (conflict) {
      return (
        <div className={styles.tooltip}>
          <div className={styles.tooltipHeader}>
            <AlertTriangle size={14} />
            <span>Conflito de Bloqueio</span>
          </div>
          <div className={styles.tooltipContent}>
            <p>Campo bloqueado por <strong>{conflict.currentOwner}</strong></p>
            <div className={styles.suggestions}>
              <strong>Sugestões:</strong>
              <ul>
                {conflict.suggestedActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    if (lockInfo) {
      const isOwn = lockInfo.userId === getCurrentUserId();
      const timeRemaining = Math.max(0, lockInfo.expiresAt - Date.now());
      const minutes = Math.floor(timeRemaining / 60000);
      const seconds = Math.floor((timeRemaining % 60000) / 1000);

      return (
        <div className={styles.tooltip}>
          <div className={styles.tooltipHeader}>
            <User size={14} />
            <span>{isOwn ? 'Seu Bloqueio' : `Bloqueado por ${lockInfo.userName}`}</span>
          </div>
          <div className={styles.tooltipContent}>
            <div className={styles.lockDetails}>
              <div className={styles.lockTime}>
                <Clock size={12} />
                <span>
                  {timeRemaining > 0 
                    ? `Expira em ${minutes}:${seconds.toString().padStart(2, '0')}` 
                    : 'Expirado'
                  }
                </span>
              </div>
              {isOwn && (
                <div className={styles.lockActions}>
                  <button 
                    className={styles.extendButton}
                    onClick={() => extendLock(fieldId)}
                    disabled={lockExtensionCount >= 3}
                  >
                    Estender (+5min)
                  </button>
                  <button 
                    className={styles.releaseButton}
                    onClick={() => releaseLock(fieldId)}
                  >
                    Liberar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={styles.smartFieldWrapper}>
      {fieldLabel && (
        <label htmlFor={fieldId} className={styles.fieldLabel}>
          {fieldLabel}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        <input
          ref={ref || inputRef}
          id={fieldId}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || isLocked}
          readOnly={readOnly}
          className={inputClasses}
          required={required}
          pattern={pattern}
          minLength={minLength}
          maxLength={maxLength}
          autoComplete="off"
        />
        
        {renderStatusIndicator()}
        
        {(conflict || lockInfo || isFocused) && renderTooltip()}
      </div>

      {conflict && (
        <div className={styles.conflictMessage}>
          <AlertTriangle size={14} />
          <span>Campo bloqueado por {conflict.currentOwner}</span>
        </div>
      )}
    </div>
  );
});

SmartField.displayName = 'SmartField';

/**
 * Utilitários
 */
function getCurrentUserId(): string {
  return localStorage.getItem('user_id') || 'anonymous';
}

export default SmartField;