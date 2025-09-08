// src/components/ui/MemoizedComponents.tsx
import React from 'react';
import StatusBadge from './StatusBadge';
import type { Demanda } from '../../types/entities';

// Memoized table row for better performance
export const MemoizedDemandaRow = React.memo<{
  demanda: Demanda;
  isSelected?: boolean;
  onRowClick?: (demanda: Demanda) => void;
  formatDate: (date: string | undefined) => string;
  calculateStatus: (demanda: Demanda) => string;
  getOrgaoAbreviacao: (orgao: string) => string;
}>(
  ({
    demanda,
    isSelected = false,
    onRowClick,
    formatDate,
    calculateStatus,
    getOrgaoAbreviacao,
  }) => {
    const handleClick = React.useCallback(() => {
      onRowClick?.(demanda);
    }, [onRowClick, demanda]);

    const status = React.useMemo(() => calculateStatus(demanda), [calculateStatus, demanda]);
    const dataFinal = React.useMemo(
      () => formatDate(demanda.dataFinal || undefined),
      [formatDate, demanda.dataFinal]
    );
    const orgaoAbbr = React.useMemo(
      () => getOrgaoAbreviacao(demanda.orgao),
      [getOrgaoAbreviacao, demanda.orgao]
    );

    return (
      <tr
        onClick={handleClick}
        className={isSelected ? 'selected' : ''}
        style={{ cursor: onRowClick ? 'pointer' : 'default' }}
      >
        <td>{demanda.sged}</td>
        <td title={demanda.tipoDemanda}>{demanda.tipoDemanda}</td>
        <td title={demanda.descricao}>{demanda.descricao}</td>
        <td title={demanda.orgao}>{orgaoAbbr}</td>
        <td title={demanda.distribuidor}>{demanda.distribuidor}</td>
        <td>{formatDate(demanda.dataInicial)}</td>
        <td>{dataFinal}</td>
        <td>
          <StatusBadge status={status as any} />
        </td>
      </tr>
    );
  }
);

MemoizedDemandaRow.displayName = 'MemoizedDemandaRow';

// Memoized filter dropdown
export const MemoizedFilterDropdown = React.memo<{
  isOpen: boolean;
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onToggle: () => void;
  onOptionSelect: (value: string) => void;
  className?: string;
  multiSelect?: boolean;
}>(
  ({
    isOpen,
    label,
    options,
    selectedValues,
    onToggle,
    onOptionSelect,
    className = '',
    multiSelect = false,
  }) => {
    const displayText = React.useMemo(() => {
      if (selectedValues.length === 0) {
        return `Selecione ${label.toLowerCase()}...`;
      }

      if (multiSelect) {
        if (selectedValues.length === options.length) {
          return 'Todos';
        }
        if (selectedValues.length === 1) {
          return options.find(opt => opt.value === selectedValues[0])?.label || selectedValues[0];
        }
        return `${selectedValues.length} ${label.toLowerCase()}`;
      }

      return options.find(opt => opt.value === selectedValues[0])?.label || selectedValues[0];
    }, [selectedValues, options, label, multiSelect]);

    return (
      <div className={`filter-dropdown ${className}`}>
        <button
          type='button'
          onClick={onToggle}
          className='filter-dropdown-toggle'
          aria-expanded={isOpen}
        >
          {displayText}
          <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </button>

        {isOpen && (
          <div className='filter-dropdown-menu'>
            {options.map(option => (
              <div
                key={option.value}
                className={`filter-dropdown-option ${
                  selectedValues.includes(option.value) ? 'selected' : ''
                }`}
                onClick={() => onOptionSelect(option.value)}
              >
                {multiSelect && (
                  <input
                    type='checkbox'
                    checked={selectedValues.includes(option.value)}
                    onChange={() => {}} // Controlled by onClick
                    tabIndex={-1}
                  />
                )}
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

MemoizedFilterDropdown.displayName = 'MemoizedFilterDropdown';

// Memoized pagination component
export const MemoizedPagination = React.memo<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}>(({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const handlePageChange = React.useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        onPageChange(page);
      }
    },
    [currentPage, totalPages, onPageChange]
  );

  const handleItemsPerPageChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newItemsPerPage = parseInt(e.target.value);
      onItemsPerPageChange(newItemsPerPage);
    },
    [onItemsPerPageChange]
  );

  const pageNumbers = React.useMemo(() => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages]);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className='pagination-container'>
      <div className='pagination-info'>
        Mostrando {startItem} a {endItem} de {totalItems} registros
      </div>

      <div className='pagination-controls'>
        <select
          value={itemsPerPage}
          onChange={handleItemsPerPageChange}
          className='items-per-page-select'
        >
          <option value={5}>5 por página</option>
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
          <option value={50}>50 por página</option>
        </select>

        <div className='pagination-buttons'>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className='pagination-button'
          >
            Anterior
          </button>

          {pageNumbers.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`pagination-button ${page === currentPage ? 'active' : ''}`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className='pagination-button'
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
});

MemoizedPagination.displayName = 'MemoizedPagination';

// Memoized search input with debounce
export const MemoizedSearchInput = React.memo<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}>(({ value, onChange, placeholder = 'Pesquisar...', debounceMs = 300, className = '' }) => {
  const [localValue, setLocalValue] = React.useState(value);
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  // Update local value when prop changes
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced change handler
  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [localValue, onChange, value, debounceMs]);

  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <input
      type='text'
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={`search-input ${className}`}
    />
  );
});

MemoizedSearchInput.displayName = 'MemoizedSearchInput';
