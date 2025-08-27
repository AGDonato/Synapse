import { useCallback, useEffect, useState } from 'react';
import { 
  IoAlertCircle, 
  IoCheckmarkCircle, 
  IoClose, 
  IoInformationCircle, 
  IoWarning 
} from 'react-icons/io5';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  title?: string;
  persistent?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

const toastIcons = {
  success: <IoCheckmarkCircle size={20} />,
  error: <IoAlertCircle size={20} />,
  warning: <IoWarning size={20} />,
  info: <IoInformationCircle size={20} />,
};

export default function Toast({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 4000,
  title,
  persistent = false,
  position = 'top-right'
}: ToastProps) {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleClose = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 300); // Animation duration
  }, [onClose]);

  useEffect(() => {
    if (isVisible && !persistent) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, persistent, handleClose]);

  if (!isVisible && !isAnimatingOut) {return null;}

  return (
    <div 
      className={`
        ${styles.toast} 
        ${styles[type]} 
        ${styles[position]}
        ${isAnimatingOut ? styles.animatingOut : ''}
      `}
    >
      <div className={styles.toastContent}>
        <div className={styles.toastIcon}>
          {toastIcons[type]}
        </div>
        <div className={styles.toastText}>
          {title && <div className={styles.toastTitle}>{title}</div>}
          <div className={styles.toastMessage}>{message}</div>
        </div>
        <button 
          className={styles.closeButton}
          onClick={handleClose}
          type="button"
        >
          <IoClose size={16} />
        </button>
      </div>
      {!persistent && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}