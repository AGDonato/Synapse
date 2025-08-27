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

export function useKeyboardShortcuts({ 
  shortcuts, 
  enabled = true, 
  preventDefault = true 
}: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  
  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) {return;}

    // Don't trigger shortcuts when user is typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      // Exception: Allow Ctrl+K for search even in inputs
      if (!(event.key === 'k' && (event.ctrlKey || event.metaKey))) {
        return;
      }
    }

    for (const shortcut of shortcutsRef.current) {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey);
      const altMatch = !!shortcut.altKey === event.altKey;
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        if (preventDefault || shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        
        shortcut.action();
        break; // Only trigger the first matching shortcut
      }
    }
  }, [enabled, preventDefault]);

  useEffect(() => {
    if (!enabled) {return;}

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return {
    shortcuts: shortcutsRef.current,
  };
}

// Helper function to format shortcut display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const keys = [];
  
  if (shortcut.ctrlKey) {
    keys.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (shortcut.altKey) {
    keys.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
  }
  if (shortcut.shiftKey) {
    keys.push('Shift');
  }
  
  keys.push(shortcut.key.toUpperCase());
  
  return keys.join(' + ');
}

// Common shortcuts factory
export const createCommonShortcuts = (actions: {
  openSearch?: () => void;
  toggleSidebar?: () => void;
  goHome?: () => void;
  openHelp?: () => void;
  openSettings?: () => void;
  refresh?: () => void;
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.openSearch) {
    shortcuts.push({
      key: 'k',
      ctrlKey: true,
      description: 'Abrir busca global',
      action: actions.openSearch,
    });
  }

  if (actions.toggleSidebar) {
    shortcuts.push({
      key: 'b',
      ctrlKey: true,
      description: 'Alternar sidebar',
      action: actions.toggleSidebar,
    });
  }

  if (actions.goHome) {
    shortcuts.push({
      key: 'h',
      ctrlKey: true,
      altKey: true,
      description: 'Ir para início',
      action: actions.goHome,
    });
  }

  if (actions.openHelp) {
    shortcuts.push({
      key: '?',
      shiftKey: true,
      description: 'Abrir ajuda',
      action: actions.openHelp,
    });
  }

  if (actions.openSettings) {
    shortcuts.push({
      key: ',',
      ctrlKey: true,
      description: 'Abrir configurações',
      action: actions.openSettings,
    });
  }

  if (actions.refresh) {
    shortcuts.push({
      key: 'r',
      ctrlKey: true,
      shiftKey: true,
      description: 'Atualizar dados',
      action: actions.refresh,
      preventDefault: false, // Allow browser refresh as fallback
    });
  }

  return shortcuts;
};