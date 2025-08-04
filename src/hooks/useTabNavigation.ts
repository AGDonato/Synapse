// Hook para controlar navegação por Tab globalmente
import { useEffect } from 'react';

export const useTabNavigation = () => {
  useEffect(() => {
    const handleTabNavigation = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // Busca o container principal da página (main, article, section, etc.)
      const mainContainer = document.querySelector(
        'main, article, section, [role="main"], .main-content, .page-content, .container, .formContainer, .pageContainer'
      ) as HTMLElement;

      if (!mainContainer) return;

      // Busca todos os elementos focáveis dentro do container principal
      const focusableElements = mainContainer.querySelectorAll(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"]):not([disabled])'
      ) as NodeListOf<HTMLElement>;

      const focusableArray = Array.from(focusableElements).filter((el) => {
        // Filtra apenas elementos visíveis e habilitados
        const style = window.getComputedStyle(el);
        const isFormElement =
          el instanceof HTMLInputElement ||
          el instanceof HTMLSelectElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLButtonElement;
        const isDisabled =
          isFormElement &&
          (
            el as
              | HTMLInputElement
              | HTMLSelectElement
              | HTMLTextAreaElement
              | HTMLButtonElement
          ).disabled;

        return (
          !isDisabled &&
          el.offsetParent !== null &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          el.tabIndex !== -1
        );
      });

      if (focusableArray.length === 0) return;

      const currentIndex = focusableArray.indexOf(
        document.activeElement as HTMLElement
      );

      if (e.shiftKey) {
        // Shift+Tab - navegação reversa
        if (currentIndex <= 0) {
          e.preventDefault(); // Impede sair do container pelo início
        }
      } else {
        // Tab normal - navegação para frente
        if (currentIndex >= focusableArray.length - 1) {
          e.preventDefault(); // Impede sair do container pelo final
        }
      }
    };

    // Adiciona o listener globalmente
    document.addEventListener('keydown', handleTabNavigation, true);

    return () => {
      document.removeEventListener('keydown', handleTabNavigation, true);
    };
  }, []);
};
