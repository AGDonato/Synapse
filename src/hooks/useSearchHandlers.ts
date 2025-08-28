// src/hooks/useSearchHandlers.ts

import { useCallback, useEffect, useState } from 'react';
import { filterWithAdvancedSearch } from '../utils/searchUtils';

// Tipos
type SearchResults = Record<string, string[]>;

type ShowResults = Record<string, boolean>;

type SelectedIndex = Record<string, number>;

type DropdownOpen = Record<string, boolean>;

interface UseSearchHandlersProps {
  initialFields?: string[];
  onFieldSelect?: (fieldId: string, value: string) => void;
}

interface UseSearchHandlersReturn {
  searchResults: SearchResults;
  showResults: ShowResults;
  selectedIndex: SelectedIndex;
  dropdownOpen: DropdownOpen;

  // Handlers
  handleSearch: (
    fieldId: string,
    query: string,
    dataSource: string[] | Record<string, unknown>[],
    searchFields?: string[]
  ) => void;
  handleSearchInput: (
    fieldId: string,
    value: string,
    dataSource: string[] | Record<string, unknown>[],
    searchFields?: string[]
  ) => void;
  handleKeyDown: (
    e: React.KeyboardEvent,
    fieldId: string,
    callback: (value: string) => void
  ) => void;
  closeOtherSearchResults: (currentFieldId: string) => void;
  clearSearchResults: (fieldId: string) => void;
  setShowResults: React.Dispatch<React.SetStateAction<ShowResults>>;
  setSelectedIndex: React.Dispatch<React.SetStateAction<SelectedIndex>>;
  setDropdownOpen: React.Dispatch<React.SetStateAction<DropdownOpen>>;
  scrollToSelectedItem: (fieldId: string, index: number) => void;
}

// Hook auxiliar para lógica de busca
const useSearchLogic = (
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResults>>,
  setShowResults: React.Dispatch<React.SetStateAction<ShowResults>>,
  setSelectedIndex: React.Dispatch<React.SetStateAction<SelectedIndex>>
) => {
  const handleSearch = useCallback(
    (
      fieldId: string,
      query: string,
      dataSource: string[] | Record<string, unknown>[],
      searchFields: string[] = [
        'nome',
        'nomeFantasia',
        'razaoSocial',
        'nomeCompleto',
      ]
    ) => {
      if (!query || query.trim() === '') {
        setSearchResults(prev => ({ ...prev, [fieldId]: [] }));
        setShowResults(prev => ({ ...prev, [fieldId]: false }));
        return;
      }

      // Se dataSource é array de strings, usar diretamente
      let filteredResults: string[];
      if (dataSource.length === 0) {
        filteredResults = [];
      } else if (typeof dataSource[0] === 'string') {
        filteredResults = filterWithAdvancedSearch(dataSource as string[], query);
      } else {
        // Se é array de objetos, extrair os campos e filtrar
        const typedDataSource = dataSource as Record<string, unknown>[];
        const searchStrings = typedDataSource
          .map(item => {
            // Extrair o campo relevante do objeto
            for (const field of searchFields) {
              if (item[field] && typeof item[field] === 'string') {
                return item[field];
              }
            }
            return '';
          })
          .filter(Boolean);

        // Filtrar as strings
        const filteredStrings = filterWithAdvancedSearch(searchStrings, query);

        // Mapear de volta para as strings encontradas
        filteredResults = typedDataSource
          .filter(item => {
            for (const field of searchFields) {
              if (item[field] && typeof item[field] === 'string' && 
                  filteredStrings.includes(item[field])) {
                return true;
              }
            }
            return false;
          })
          .map(item => {
            // Retornar o primeiro campo válido encontrado
            for (const field of searchFields) {
              if (item[field] && typeof item[field] === 'string') {
                return item[field];
              }
            }
            return '';
          })
          .filter(Boolean);
      }

      // Extrair apenas os valores únicos do campo principal
      const uniqueResults = Array.from(new Set(filteredResults)).sort();

      setSearchResults(prev => ({ ...prev, [fieldId]: uniqueResults }));
      setShowResults(prev => ({
        ...prev,
        [fieldId]: uniqueResults.length > 0,
      }));
      setSelectedIndex(prev => ({ ...prev, [fieldId]: -1 }));
    },
    [setSearchResults, setShowResults, setSelectedIndex]
  );

  const handleSearchInput = useCallback(
    (
      fieldId: string,
      value: string,
      dataSource: string[] | Record<string, unknown>[],
      searchFields?: string[]
    ) => {
      handleSearch(fieldId, value, dataSource, searchFields);
    },
    [handleSearch]
  );

  return { handleSearch, handleSearchInput };
};

// Hook auxiliar para gerenciamento de UI
const useUIManagement = (
  setShowResults: React.Dispatch<React.SetStateAction<ShowResults>>,
  setSelectedIndex: React.Dispatch<React.SetStateAction<SelectedIndex>>,
  setDropdownOpen: React.Dispatch<React.SetStateAction<DropdownOpen>>,
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResults>>
) => {
  const closeOtherSearchResults = useCallback((currentFieldId: string) => {
    setShowResults(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        if (key !== currentFieldId) {
          newState[key] = false;
        }
      });
      return newState;
    });
    setSelectedIndex(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        if (!key.includes(currentFieldId)) {
          delete newState[key];
        }
      });
      return newState;
    });

    // Fechar também dropdowns customizados quando campo de busca recebe foco
    setDropdownOpen({
      analista: false,
      tipoMidia: false,
      tipoDocumento: false,
      assunto: false,
      anoDocumento: false,
    });
  }, [setShowResults, setSelectedIndex, setDropdownOpen]);

  const clearSearchResults = useCallback((fieldId: string) => {
    setSearchResults(prev => ({ ...prev, [fieldId]: [] }));
    setShowResults(prev => ({ ...prev, [fieldId]: false }));
    setSelectedIndex(prev => {
      const newState = { ...prev };
      delete newState[fieldId];
      return newState;
    });
  }, [setSearchResults, setShowResults, setSelectedIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Verifica se o clique foi dentro de um container de busca ou seus resultados
      const isInsideSearchContainer =
        Boolean(target.closest('[class*="searchContainer"]')) ||
        Boolean(target.closest('[class*="searchResults"]')) ||
        Boolean(target.closest('[class*="searchResultItem"]'));

      // Verifica se o clique foi fora de qualquer container de busca
      if (!isInsideSearchContainer) {
        // Fechar todas as listas de busca
        setShowResults(prev => {
          const newState = { ...prev };
          Object.keys(prev).forEach(key => {
            newState[key] = false;
          });
          return newState;
        });
        setSelectedIndex({});
      }

      // Fechar dropdowns customizados
      if (
        !target.closest(`[class*='multiSelectContainer']`) &&
        !target.closest(`[class*='customDropdownContainer']`)
      ) {
        setDropdownOpen(prev => {
          const newState: Record<string, boolean> = {};
          Object.keys(prev).forEach(key => {
            newState[key] = false;
          });
          return newState;
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowResults, setSelectedIndex, setDropdownOpen]);

  return { closeOtherSearchResults, clearSearchResults };
};

// Hook auxiliar para gerenciamento de estado de busca
const useSearchState = (initialFields: string[]) => {
  // Estado inicial baseado nos campos fornecidos
  const initialState = initialFields.reduce(
    (acc, field) => {
      acc[field] =
        field === 'destinatario' ||
        field === 'enderecamento' ||
        field === 'autoridade' ||
        field === 'orgaoJudicial'
          ? []
          : false;
      return acc;
    },
    {} as Record<string, string[] | boolean>
  );

  // Estados
  const [searchResults, setSearchResults] = useState<SearchResults>({
    destinatario: [],
    enderecamento: [],
    autoridade: [],
    orgaoJudicial: [],
    ...initialState,
  });

  const [showResults, setShowResults] = useState<ShowResults>({
    destinatario: false,
    enderecamento: false,
    autoridade: false,
    orgaoJudicial: false,
    ...Object.keys(initialState).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as ShowResults),
  });

  const [selectedIndex, setSelectedIndex] = useState<SelectedIndex>({});

  const [dropdownOpen, setDropdownOpen] = useState<DropdownOpen>({
    analista: false,
    tipoMidia: false,
    tipoDocumento: false,
    assunto: false,
    anoDocumento: false,
  });

  return {
    searchResults,
    setSearchResults,
    showResults,
    setShowResults,
    selectedIndex,
    setSelectedIndex,
    dropdownOpen,
    setDropdownOpen,
  };
};

export const useSearchHandlers = ({
  initialFields = [],
  onFieldSelect,
}: UseSearchHandlersProps = {}): UseSearchHandlersReturn => {
  const {
    searchResults,
    setSearchResults,
    showResults,
    setShowResults,
    selectedIndex,
    setSelectedIndex,
    dropdownOpen,
    setDropdownOpen,
  } = useSearchState(initialFields);

  const { handleSearch, handleSearchInput } = useSearchLogic(
    setSearchResults,
    setShowResults,
    setSelectedIndex
  );

  const { closeOtherSearchResults, clearSearchResults } = useUIManagement(
    setShowResults,
    setSelectedIndex,
    setDropdownOpen,
    setSearchResults
  );

  // Função para scroll até o item selecionado
  const scrollToSelectedItem = useCallback((fieldId: string, index: number) => {
    setTimeout(() => {
      const container = document.querySelector<HTMLElement>(
        `[data-field="${fieldId}"] .searchResults`
      );
      const selectedItem = container?.children[index] as HTMLElement;

      if (container && selectedItem) {
        const containerRect = container.getBoundingClientRect();
        const itemRect = selectedItem.getBoundingClientRect();

        if (itemRect.bottom > containerRect.bottom) {
          container.scrollTop += itemRect.bottom - containerRect.bottom;
        } else if (itemRect.top < containerRect.top) {
          container.scrollTop -= containerRect.top - itemRect.top;
        }
      }
    }, 0);
  }, []);

  // Handler para navegação por teclado
  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      fieldId: string,
      callback: (value: string) => void
    ) => {
      const results = searchResults[fieldId] || [];
      const currentIndex = selectedIndex[fieldId] ?? -1;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex =
            currentIndex < results.length - 1 ? currentIndex + 1 : currentIndex;
          setSelectedIndex(prev => ({ ...prev, [fieldId]: nextIndex }));
          scrollToSelectedItem(fieldId, nextIndex);
          break;
        }

        case 'ArrowUp': {
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
          setSelectedIndex(prev => ({ ...prev, [fieldId]: prevIndex }));
          scrollToSelectedItem(fieldId, prevIndex);
          break;
        }

        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          if (currentIndex >= 0 && currentIndex < results.length) {
            const selectedValue = results[currentIndex];
            callback(selectedValue);
            if (onFieldSelect) {
              onFieldSelect(fieldId, selectedValue);
            }
          }
          break;

        case 'Escape':
          e.preventDefault();
          setShowResults(prev => ({ ...prev, [fieldId]: false }));
          setSelectedIndex(prev => ({ ...prev, [fieldId]: -1 }));
          // Retornar foco ao campo
          setTimeout(() => {
            const input = document.querySelector<HTMLInputElement>(
              `[data-field="${fieldId}"] input`
            );
            if (input) {
              input.focus();
            }
          }, 0);
          break;

        case 'Tab':
          // Fechar resultados ao pressionar Tab
          setShowResults(prev => ({ ...prev, [fieldId]: false }));
          setSelectedIndex(prev => ({ ...prev, [fieldId]: -1 }));
          break;
      }
    },
    [searchResults, selectedIndex, scrollToSelectedItem, onFieldSelect, setSelectedIndex, setShowResults]
  );


  return {
    searchResults,
    showResults,
    selectedIndex,
    dropdownOpen,
    handleSearch,
    handleSearchInput,
    handleKeyDown,
    closeOtherSearchResults,
    clearSearchResults,
    setShowResults,
    setSelectedIndex,
    setDropdownOpen,
    scrollToSelectedItem,
  };
};
