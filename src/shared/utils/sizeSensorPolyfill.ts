/**
 * POLYFILL PARA SIZE SENSOR
 *
 * Este módulo resolve problemas de compatibilidade com a biblioteca size-sensor em módulos ES.
 * Fornece implementação baseada em ResizeObserver para detectar mudanças de tamanho em elementos.
 * Usado principalmente para gráficos ECharts que precisam se redimensionar dinamicamente.
 */

// Corrige o problema onde size-sensor não exporta 'bind' corretamente em módulos ES

type ResizeHandler = (element: HTMLElement) => void;

interface SizeSensor {
  bind: (element: HTMLElement | null, callback: ResizeHandler) => void;
  unbind: (element: HTMLElement | null, callback?: ResizeHandler) => void;
  clear: (element: HTMLElement | null) => void;
}

const resizeHandlers = new WeakMap<HTMLElement, Set<ResizeHandler>>();

// Cria implementação baseada em ResizeObserver
const resizeObserver =
  typeof window !== 'undefined' && window.ResizeObserver
    ? new ResizeObserver(entries => {
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          const handlers = resizeHandlers.get(element);
          if (handlers) {
            handlers.forEach(handler => {
              try {
                handler(element);
              } catch (error) {
                console.error('Erro no callback do sensor de tamanho:', error);
              }
            });
          }
        }
      })
    : null;

export const sizeSensor: SizeSensor = {
  bind(element: HTMLElement | null, callback: ResizeHandler): void {
    if (!element || !callback) return;

    // Inicializa conjunto de handlers para este elemento
    if (!resizeHandlers.has(element)) {
      resizeHandlers.set(element, new Set());
    }

    const handlers = resizeHandlers.get(element)!;
    handlers.add(callback);

    // Começa a observar se ResizeObserver está disponível
    if (resizeObserver) {
      resizeObserver.observe(element);
    } else {
      // Fallback: dispara callback imediatamente e no resize da janela
      callback(element);

      const resizeHandler = () => callback(element);
      window.addEventListener('resize', resizeHandler);

      // Armazena o handler para limpeza
      (callback as any).__resizeHandler = resizeHandler;
    }
  },

  unbind(element: HTMLElement | null, callback?: ResizeHandler): void {
    if (!element) return;

    const handlers = resizeHandlers.get(element);
    if (!handlers) return;

    if (callback) {
      handlers.delete(callback);

      // Limpa listener de fallback se necessário
      if (!resizeObserver && (callback as any).__resizeHandler) {
        window.removeEventListener('resize', (callback as any).__resizeHandler);
        delete (callback as any).__resizeHandler;
      }
    } else {
      // Limpa todos os handlers
      handlers.clear();
    }

    // Para de observar se não há mais handlers
    if (handlers.size === 0) {
      if (resizeObserver) {
        resizeObserver.unobserve(element);
      }
      resizeHandlers.delete(element);
    }
  },

  clear(element: HTMLElement | null): void {
    if (!element) return;

    const handlers = resizeHandlers.get(element);
    if (handlers) {
      // Limpa todos os listeners de fallback
      if (!resizeObserver) {
        handlers.forEach(handler => {
          if ((handler as any).__resizeHandler) {
            window.removeEventListener('resize', (handler as any).__resizeHandler);
            delete (handler as any).__resizeHandler;
          }
        });
      }

      handlers.clear();
      resizeHandlers.delete(element);

      if (resizeObserver) {
        resizeObserver.unobserve(element);
      }
    }
  },
};

// Exporta exports nomeados para compatibilidade
export const bind = sizeSensor.bind;
export const unbind = sizeSensor.unbind;
export const clear = sizeSensor.clear;

// Export padrão
export default sizeSensor;
