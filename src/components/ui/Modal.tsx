import { useEffect, useRef } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modalRef.current) {return;}

      // Encontrar todos os elementos focalizáveis dentro do modal
      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]):not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: se está no primeiro elemento, vai para o último
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: se está no último elemento, vai para o primeiro
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    if (isOpen) {
      // Salvar o elemento ativo antes de abrir o modal
      previousActiveElement.current = document.activeElement as HTMLElement;

      document.addEventListener('keydown', handleEsc);
      document.addEventListener('keydown', handleTab);
      document.body.style.overflow = 'hidden';

      // Focar no primeiro elemento focalizável quando o modal abrir
      setTimeout(() => {
        if (modalRef.current) {
          // Encontrar o primeiro elemento focalizável
          const firstFocusable = modalRef.current.querySelector(
            'button:not([disabled]):not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
          );

          firstFocusable?.focus();
        }
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = 'unset';

      // Restaurar foco para o elemento anterior quando fechar o modal
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) {return null;}

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${className || ''}`}
        onClick={e => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.header}>
          <h3 id="modal-title" className={styles.title}>
            {title}
          </h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
            </svg>
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
