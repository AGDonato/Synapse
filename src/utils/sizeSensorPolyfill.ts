// Size Sensor Polyfill
// This fixes the issue where size-sensor doesn't export 'bind' properly in ES modules

type ResizeHandler = (element: HTMLElement) => void;

interface SizeSensor {
  bind: (element: HTMLElement | null, callback: ResizeHandler) => void;
  unbind: (element: HTMLElement | null, callback?: ResizeHandler) => void;
  clear: (element: HTMLElement | null) => void;
}

const resizeHandlers = new WeakMap<HTMLElement, Set<ResizeHandler>>();

// Create a ResizeObserver-based implementation
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
                console.error('Size sensor callback error:', error);
              }
            });
          }
        }
      })
    : null;

export const sizeSensor: SizeSensor = {
  bind(element: HTMLElement | null, callback: ResizeHandler): void {
    if (!element || !callback) return;

    // Initialize handlers set for this element
    if (!resizeHandlers.has(element)) {
      resizeHandlers.set(element, new Set());
    }

    const handlers = resizeHandlers.get(element)!;
    handlers.add(callback);

    // Start observing if ResizeObserver is available
    if (resizeObserver) {
      resizeObserver.observe(element);
    } else {
      // Fallback: trigger callback immediately and on window resize
      callback(element);

      const resizeHandler = () => callback(element);
      window.addEventListener('resize', resizeHandler);

      // Store the handler for cleanup
      (callback as any).__resizeHandler = resizeHandler;
    }
  },

  unbind(element: HTMLElement | null, callback?: ResizeHandler): void {
    if (!element) return;

    const handlers = resizeHandlers.get(element);
    if (!handlers) return;

    if (callback) {
      handlers.delete(callback);

      // Clean up fallback listener if needed
      if (!resizeObserver && (callback as any).__resizeHandler) {
        window.removeEventListener('resize', (callback as any).__resizeHandler);
        delete (callback as any).__resizeHandler;
      }
    } else {
      // Clear all handlers
      handlers.clear();
    }

    // Stop observing if no more handlers
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
      // Clean up all fallback listeners
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

// Export named exports for compatibility
export const bind = sizeSensor.bind;
export const unbind = sizeSensor.unbind;
export const clear = sizeSensor.clear;

// Default export
export default sizeSensor;
