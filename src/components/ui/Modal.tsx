import { useEffect, useRef } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
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
      if (event.key !== 'Tab' || !modalRef.current) return;

      // Encontrar todos os elementos focalizáveis dentro do modal
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: se está no primeiro elemento, impede de sair do modal
        if (document.activeElement === firstElement) {
          event.preventDefault();
          // Não faz nada - fica no primeiro elemento
        }
      } else {
        // Tab: se está no último elemento, impede de sair do modal
        if (document.activeElement === lastElement) {
          event.preventDefault();
          // Não faz nada - fica no último elemento
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
          const firstFocusable = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
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

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby='modal-title'
      >
        <div className={styles.header}>
          <h3 id='modal-title' className={styles.title}>
            {title}
          </h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label='Fechar modal'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='20'
              height='20'
              fill='currentColor'
              viewBox='0 0 16 16'
            >
              <path d='M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z' />
            </svg>
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
