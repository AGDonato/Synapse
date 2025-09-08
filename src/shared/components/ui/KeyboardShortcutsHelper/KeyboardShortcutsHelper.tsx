import React, { useState } from 'react';
import { IoClose, IoHelpCircle, IoKeypad } from 'react-icons/io5';
import { type KeyboardShortcut, formatShortcut } from '../../../hooks/useKeyboardShortcuts';
import styles from './KeyboardShortcutsHelper.module.css';

interface KeyboardShortcutsHelperProps {
  shortcuts: KeyboardShortcut[];
  className?: string;
}

export const KeyboardShortcutsHelper: React.FC<KeyboardShortcutsHelperProps> = ({
  shortcuts,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const groupedShortcuts = shortcuts.reduce(
    (groups, shortcut) => {
      // Group shortcuts by category (could be enhanced to accept categories)
      const category = shortcut.description.includes('busca')
        ? 'Navegação'
        : shortcut.description.includes('sidebar') || shortcut.description.includes('início')
          ? 'Interface'
          : shortcut.description.includes('configurações') || shortcut.description.includes('ajuda')
            ? 'Sistema'
            : 'Geral';

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
      return groups;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  if (shortcuts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Help Button */}
      <button
        className={`${styles.helpButton} ${className || ''}`}
        onClick={() => setIsOpen(true)}
        title='Atalhos de teclado (Shift + ?)'
      >
        <IoKeypad size={20} />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.header}>
              <div className={styles.headerTitle}>
                <IoHelpCircle size={24} />
                <span>Atalhos de Teclado</span>
              </div>
              <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
                <IoClose size={20} />
              </button>
            </div>

            <div className={styles.content}>
              {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                <div key={category} className={styles.category}>
                  <h3 className={styles.categoryTitle}>{category}</h3>
                  <div className={styles.shortcutsList}>
                    {categoryShortcuts.map((shortcut, index) => (
                      <div key={index} className={styles.shortcutItem}>
                        <div className={styles.shortcutKeys}>
                          {formatShortcut(shortcut)
                            .split(' + ')
                            .map((key, keyIndex, array) => (
                              <React.Fragment key={keyIndex}>
                                <kbd className={styles.key}>{key}</kbd>
                                {keyIndex < array.length - 1 && (
                                  <span className={styles.plus}>+</span>
                                )}
                              </React.Fragment>
                            ))}
                        </div>
                        <div className={styles.shortcutDescription}>{shortcut.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <div className={styles.footerNote}>
                💡 Dica: Pressione <kbd className={styles.inlineKey}>Shift</kbd> +{' '}
                <kbd className={styles.inlineKey}>?</kbd> a qualquer momento para ver esta lista
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
