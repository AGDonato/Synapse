/**
 * UTILITÁRIOS DE MANIPULAÇÃO SEGURA DO DOM
 *
 * Este módulo fornece funções utilitárias para manipular o DOM de forma segura.
 * Inclui funcionalidades para:
 * - Verificação nula de elementos antes de operações
 * - Acesso seguro a propriedades de eventos (target, currentTarget)
 * - Manipulação de elementos parent/child com proteção de erro
 * - Handlers de eventos com tratamento de delay e validação
 * - Prevenção de erros de referência nula em operações DOM
 */

import { createModuleLogger } from './logger';

const domLogger = createModuleLogger('DOMUtils');

/**
 * Chama o método closest() de forma segura com verificação nula
 * @param element - Elemento ou target de evento para buscar
 * @param selector - Seletor CSS para encontrar elemento ancestral
 * @returns Elemento encontrado ou null se não encontrado/erro
 */
export function safeClosest(
  element: Element | EventTarget | null,
  selector: string
): Element | null {
  if (!element || !('closest' in element)) {
    return null;
  }

  try {
    return element.closest(selector);
  } catch (error) {
    domLogger.warn('Erro ao chamar closest() com seletor', { selector, error });
    return null;
  }
}

/**
 * Obtém currentTarget de um evento de forma segura
 * @param event - Evento com propriedade currentTarget
 * @returns Elemento currentTarget tipado ou null
 */
export function safeCurrentTarget<T extends Element = Element>(event: {
  currentTarget: EventTarget | null;
}): T | null {
  return (event.currentTarget as T) || null;
}

/**
 * Obtém target de um evento de forma segura
 * @param event - Evento com propriedade target
 * @returns Elemento target tipado ou null
 */
export function safeTarget<T extends Element = Element>(event: {
  target: EventTarget | null;
}): T | null {
  return (event.target as T) || null;
}

/**
 * Verifica se um elemento contém outro elemento de forma segura
 * @param parent - Elemento pai para verificar
 * @param child - Elemento filho para buscar
 * @returns true se parent contém child
 */
export function safeContains(parent: Element | null, child: Element | null): boolean {
  if (!parent || !child) {
    return false;
  }

  try {
    return parent.contains(child);
  } catch (error) {
    domLogger.warn('Erro ao chamar contains()', { error });
    return false;
  }
}

/**
 * Cria handler de blur seguro que previne erros de referência nula
 * @param callback - Função a ser chamada com targets validados
 * @param delay - Delay em ms antes de executar callback (padrão: 0)
 * @returns Handler de blur React com validação
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
