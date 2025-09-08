import React, { useState } from 'react';
import {
  IoAdd,
  IoBookmark,
  IoBookmarkOutline,
  IoClose,
  IoStar,
  IoStarOutline,
  IoTime,
  IoTrash,
} from 'react-icons/io5';
import { type SavedFilter, useSavedFilters } from '../../../hooks/useSavedFilters';
import styles from './SavedFiltersPanel.module.css';

interface SavedFiltersPanelProps {
  storageKey: string;
  currentFilters: Record<string, unknown>;
  onApplyFilters: (filters: Record<string, unknown>) => void;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const SavedFiltersPanel: React.FC<SavedFiltersPanelProps> = ({
  storageKey,
  currentFilters,
  onApplyFilters,
  isOpen,
  onClose,
  className,
}) => {
  const {
    savedFilters,
    saveFilter,
    deleteFilter,
    applyFilter,
    setDefaultFilter,
    getDefaultFilter,
    findMatchingFilter,
    getRecentFilters,
  } = useSavedFilters({ storageKey });

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  // const [editingFilter, setEditingFilter] = useState<SavedFilter | null>(null); // TODO: Implementar edição

  const recentFilters = getRecentFilters(3);
  const hasCurrentFilters = Object.values(currentFilters).some(value =>
    Array.isArray(value) ? value.length > 0 : !!value
  );
  const matchingFilter = findMatchingFilter(currentFilters);

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      return;
    }

    saveFilter(filterName.trim(), currentFilters);
    setFilterName('');
    setShowSaveDialog(false);
  };

  const handleApplyFilter = (filter: SavedFilter) => {
    const applied = applyFilter(filter.id);
    if (applied) {
      onApplyFilters(applied.filters);
      onClose();
    }
  };

  const handleDeleteFilter = (filterId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    deleteFilter(filterId);
  };

  const handleSetDefault = (filterId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const defaultFilter = getDefaultFilter();
    setDefaultFilter(defaultFilter?.id === filterId ? null : filterId);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`${styles.overlay} ${className || ''}`}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <IoBookmark size={20} />
            <span>Filtros Salvos</span>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <IoClose size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Save Current Filters */}
          {hasCurrentFilters && !matchingFilter && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Filtros Atuais</div>
              {!showSaveDialog ? (
                <button
                  className={styles.saveCurrentButton}
                  onClick={() => setShowSaveDialog(true)}
                >
                  <IoAdd size={16} />
                  Salvar filtros atuais
                </button>
              ) : (
                <div className={styles.saveDialog}>
                  <input
                    type='text'
                    value={filterName}
                    onChange={e => setFilterName(e.target.value)}
                    placeholder='Nome do filtro...'
                    className={styles.filterNameInput}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleSaveFilter();
                      }
                      if (e.key === 'Escape') {
                        setShowSaveDialog(false);
                      }
                    }}
                  />
                  <div className={styles.saveDialogActions}>
                    <button
                      className={styles.saveButton}
                      onClick={handleSaveFilter}
                      disabled={!filterName.trim()}
                    >
                      Salvar
                    </button>
                    <button
                      className={styles.cancelButton}
                      onClick={() => {
                        setShowSaveDialog(false);
                        setFilterName('');
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current Filter Match */}
          {matchingFilter && (
            <div className={styles.section}>
              <div className={styles.currentMatch}>
                <IoBookmark size={16} className={styles.matchIcon} />
                <span>Filtros atuais: "{matchingFilter.name}"</span>
              </div>
            </div>
          )}

          {/* Recent Filters */}
          {recentFilters.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <IoTime size={16} />
                Recentemente usados
              </div>
              <div className={styles.filtersList}>
                {recentFilters.map(filter => {
                  const isDefault = getDefaultFilter()?.id === filter.id;
                  return (
                    <div
                      key={filter.id}
                      className={`${styles.filterItem} ${isDefault ? styles.defaultFilter : ''}`}
                      onClick={() => handleApplyFilter(filter)}
                    >
                      <div className={styles.filterInfo}>
                        <div className={styles.filterName}>{filter.name}</div>
                        <div className={styles.filterMeta}>
                          Usado em {new Date(filter.lastUsed!).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className={styles.filterActions}>
                        <button
                          className={`${styles.actionButton} ${isDefault ? styles.active : ''}`}
                          onClick={e => handleSetDefault(filter.id, e)}
                          title={isDefault ? 'Remover como padrão' : 'Definir como padrão'}
                        >
                          {isDefault ? <IoStar size={14} /> : <IoStarOutline size={14} />}
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={e => handleDeleteFilter(filter.id, e)}
                          title='Excluir filtro'
                        >
                          <IoTrash size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Saved Filters */}
          {savedFilters.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Todos os filtros</div>
              <div className={styles.filtersList}>
                {savedFilters.map(filter => {
                  const isDefault = getDefaultFilter()?.id === filter.id;
                  const isRecent = recentFilters.some(rf => rf.id === filter.id);

                  if (isRecent) {
                    return null;
                  } // Skip recent filters to avoid duplicates

                  return (
                    <div
                      key={filter.id}
                      className={`${styles.filterItem} ${isDefault ? styles.defaultFilter : ''}`}
                      onClick={() => handleApplyFilter(filter)}
                    >
                      <div className={styles.filterInfo}>
                        <div className={styles.filterName}>{filter.name}</div>
                        <div className={styles.filterMeta}>
                          Criado em {new Date(filter.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className={styles.filterActions}>
                        <button
                          className={`${styles.actionButton} ${isDefault ? styles.active : ''}`}
                          onClick={e => handleSetDefault(filter.id, e)}
                          title={isDefault ? 'Remover como padrão' : 'Definir como padrão'}
                        >
                          {isDefault ? <IoStar size={14} /> : <IoStarOutline size={14} />}
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={e => handleDeleteFilter(filter.id, e)}
                          title='Excluir filtro'
                        >
                          <IoTrash size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {savedFilters.length === 0 && (
            <div className={styles.emptyState}>
              <IoBookmarkOutline size={48} className={styles.emptyIcon} />
              <div className={styles.emptyTitle}>Nenhum filtro salvo</div>
              <div className={styles.emptyDescription}>
                Configure seus filtros e clique em "Salvar filtros atuais" para salvá-los
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
