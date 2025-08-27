/**
 * DOM utility functions for safe element manipulation
 */

import { createModuleLogger } from './logger';

const domLogger = createModuleLogger('DOMUtils');

/**
 * Safely calls closest() method on an element with null checking
 */
export function safeClosest(element: Element | EventTarget | null, selector: string): Element | null {
  if (!element || !('closest' in element)) {
    return null;
  }
  
  try {
    return (element).closest(selector);
  } catch (error) {
    domLogger.warn('Error calling closest() with selector', { selector, error });
    return null;
  }
}

/**
 * Safely gets the currentTarget from an event
 */
export function safeCurrentTarget<T extends Element = Element>(
  event: { currentTarget: EventTarget | null }
): T | null {
  return (event.currentTarget as T) || null;
}

/**
 * Safely gets the target from an event
 */
export function safeTarget<T extends Element = Element>(
  event: { target: EventTarget | null }
): T | null {
  return (event.target as T) || null;
}

/**
 * Checks if an element contains another element safely
 */
export function safeContains(parent: Element | null, child: Element | null): boolean {
  if (!parent || !child) {
    return false;
  }
  
  try {
    return parent.contains(child);
  } catch (error) {
    domLogger.warn('Error calling contains()', { error });
    return false;
  }
}

/**
 * Safe blur handler that prevents null reference errors
 */
export function createSafeBlurHandler(
  callback: (relatedTarget: Element | null, currentTarget: Element | null) => void,
  delay = 0
) {
  return (e: React.FocusEvent) => {
    setTimeout(() => {
      const relatedTarget = e.relatedTarget as Element | null;
      const currentTarget = safeCurrentTarget(e);
      
      callback(relatedTarget, currentTarget);
    }, delay);
  };
}

export default {
  safeClosest,
  safeCurrentTarget,
  safeTarget,
  safeContains,
  createSafeBlurHandler,
};