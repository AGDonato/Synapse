/**
 * Hook para gerenciamento de atalhos de teclado
 *
 * @description
 * Permite definir e gerenciar atalhos de teclado globais:
 * - Suporte a combinações com Ctrl, Alt e Shift
 * - Prevenção de conflitos com campos de entrada
 * - Habilitação/desabilitação dinâmica
 * - Descrições para documentação de atalhos
 *
 * @example
 * const shortcuts = useKeyboardShortcuts({
 *   shortcuts: [
 *     {
 *       key: 's',
 *       ctrlKey: true,
 *       description: 'Salvar documento',
 *       action: () => save()
 *     },
 *     {
 *       key: 'k',
 *       ctrlKey: true,
 *       description: 'Abrir busca',
 *       action: () => openSearch()
 *     }
 *   ]
 * });
 *
 * @module hooks/useKeyboardShortcuts
 */

import { useCallback, useEffect, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook principal para atalhos de teclado
 *
 * @param options - Opções de configuração:
 *   - shortcuts: Array com os atalhos a registrar
 *   - enabled: Se os atalhos estão ativos (padrão: true)
 *   - preventDefault: Prevenir comportamento padrão (padrão: true)
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  preventDefault = true,
}: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);

  // Mantém referência atualizada dos atalhos para evitar stale closure
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // Função principal que captura e processa eventos de teclado
  // Função principal que captura e processa eventos de teclado
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignora eventos quando atalhos estão desabilitados
      if (!enabled) {
        return;
      }

      // Previne conflitos: não ativa atalhos durante edição de texto
      // Verifica se o foco está em um elemento editável
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Exceção especial: Ctrl+K (busca global) funciona mesmo em campos de texto
        if (!(event.key === 'k' && (event.ctrlKey || event.metaKey))) {
          return; // Sai da função se não for a exceção
        }
      }

      // Itera sobre todos os atalhos registrados para encontrar correspondência
      for (const shortcut of shortcutsRef.current) {
        // Compara cada modificador da combinação de teclas
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey); // metaKey para Mac
        const altMatch = !!shortcut.altKey === event.altKey;
        const shiftMatch = !!shortcut.shiftKey === event.shiftKey;

        // Executa ação apenas se todos os modificadores coincidirem
        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          // Previne comportamento padrão do navegador (exceto se especificamente desabilitado)
          if (preventDefault || shortcut.preventDefault !== false) {
            event.preventDefault();
          }

          // Executa a ação do atalho
          shortcut.action();
          break; // Para no primeiro atalho que coincidir (evita execuções múltiplas)
        }
      }
    },
    [enabled, preventDefault]
  );

  // Registra/remove listener de eventos de teclado no documento
  useEffect(() => {
    // Só adiciona listener se os atalhos estiverem habilitados
    if (!enabled) {
      return;
    }

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: remove listener quando componente desmonta ou hook é desabilitado
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  // Retorna interface pública do hook
  return {
    shortcuts: shortcutsRef.current, // Lista atual dos atalhos registrados
  };
}

// ========== FUNÇÕES UTILITÁRIAS ==========
// Formata atalho para exibição visual (ex: "Ctrl + K", "⌘ + K" no Mac)
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const keys = []; // Array para construir a string do atalho

  // Adiciona modificador Ctrl/Cmd (detecta Mac automaticamente)
  if (shortcut.ctrlKey) {
    keys.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  // Adiciona modificador Alt/Option (símbolos diferentes no Mac)
  if (shortcut.altKey) {
    keys.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
  }
  // Adiciona modificador Shift (mesmo símbolo em todas as plataformas)
  if (shortcut.shiftKey) {
    keys.push('Shift');
  }

  // Adiciona a tecla principal em maiúsculo
  keys.push(shortcut.key.toUpperCase());

  // Junta tudo com separador visual
  return keys.join(' + ');
}

// ========== FACTORY DE ATALHOS COMUNS ==========
// Cria atalhos padrão da aplicação com ações configuradas pelo usuário
export const createCommonShortcuts = (actions: {
  openSearch?: () => void; // Ctrl+K - Busca global
  toggleSidebar?: () => void; // Ctrl+B - Alternar sidebar
  goHome?: () => void; // Ctrl+Alt+H - Ir para início
  openHelp?: () => void; // Shift+? - Abrir ajuda
  openSettings?: () => void; // Ctrl+, - Configurações
  refresh?: () => void; // Ctrl+Shift+R - Atualizar dados
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = []; // Array que será populado condicionalmente

  // Ctrl+K: Busca global (funciona mesmo em campos de texto)
  if (actions.openSearch) {
    shortcuts.push({
      key: 'k',
      ctrlKey: true,
      description: 'Abrir busca global',
      action: actions.openSearch,
    });
  }

  // Ctrl+B: Alternar visibilidade da sidebar
  if (actions.toggleSidebar) {
    shortcuts.push({
      key: 'b',
      ctrlKey: true,
      description: 'Alternar sidebar',
      action: actions.toggleSidebar,
    });
  }

  // Ctrl+Alt+H: Navegar para página inicial
  if (actions.goHome) {
    shortcuts.push({
      key: 'h',
      ctrlKey: true,
      altKey: true,
      description: 'Ir para início',
      action: actions.goHome,
    });
  }

  // Shift+?: Abrir painel de ajuda/documentação
  if (actions.openHelp) {
    shortcuts.push({
      key: '?',
      shiftKey: true,
      description: 'Abrir ajuda',
      action: actions.openHelp,
    });
  }

  // Ctrl+,: Abrir painel de configurações (padrão em muitos apps)
  if (actions.openSettings) {
    shortcuts.push({
      key: ',',
      ctrlKey: true,
      description: 'Abrir configurações',
      action: actions.openSettings,
    });
  }

  // Ctrl+Shift+R: Atualizar dados da aplicação
  if (actions.refresh) {
    shortcuts.push({
      key: 'r',
      ctrlKey: true,
      shiftKey: true,
      description: 'Atualizar dados',
      action: actions.refresh,
      preventDefault: false, // Permite fallback para refresh do navegador
    });
  }

  // Retorna apenas os atalhos que foram configurados
  return shortcuts;
};
