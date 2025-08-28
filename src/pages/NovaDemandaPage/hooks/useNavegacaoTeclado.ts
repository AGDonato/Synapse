// src/pages/NovaDemandaPage/hooks/useNavegacaoTeclado.ts
import { useCallback } from 'react';

export const useNavegacaoTeclado = (
  searchResults: { solicitante: string[] },
  showResults: { solicitante: boolean },
  selectedIndex: {
    solicitante: number;
    tipoDemanda: number;
    analista: number;
    distribuidor: number;
  },
  setSelectedIndex: React.Dispatch<React.SetStateAction<any>>,
  setShowResults: React.Dispatch<React.SetStateAction<any>>
) => {
  const scrollToSelectedItem = useCallback((index: number) => {
    setTimeout(() => {
      const searchContainer = document.querySelector('[data-field="solicitante"]');
      const resultsContainer = searchContainer?.querySelector('.searchResults, [class*="searchResults"]');

      if (!resultsContainer) return;

      const selectedItem = resultsContainer.children[index] as HTMLElement;

      if (selectedItem && resultsContainer) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }, 0);
  }, []);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent,
    callback: (value: string) => void,
    handleSolicitanteSearch?: (query: string) => void
  ) => {
    const results = searchResults.solicitante;
    const isListVisible = showResults.solicitante;

    if (e.key === 'ArrowDown' && !isListVisible && handleSolicitanteSearch) {
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      const currentValue = input.value;
      handleSolicitanteSearch(currentValue);
      return;
    }

    if (results.length === 0) return;

    const currentIndex = selectedIndex.solicitante;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex = currentIndex < results.length - 1 ? currentIndex + 1 : currentIndex;
        setSelectedIndex((prev: any) => ({ ...prev, solicitante: nextIndex }));
        scrollToSelectedItem(nextIndex);
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
        setSelectedIndex((prev: any) => ({ ...prev, solicitante: prevIndex }));
        scrollToSelectedItem(prevIndex);
        break;
      }

      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (currentIndex >= 0 && currentIndex < results.length) {
          const selectedValue = results[currentIndex];
          callback(selectedValue);
          setShowResults((prev: any) => ({ ...prev, solicitante: false }));
          setSelectedIndex((prev: any) => ({ ...prev, solicitante: -1 }));
        }
        break;

      case 'Escape':
        setShowResults((prev: any) => ({ ...prev, solicitante: false }));
        setSelectedIndex((prev: any) => ({ ...prev, solicitante: -1 }));
        break;

      case 'Tab':
        setShowResults((prev: any) => ({ ...prev, solicitante: false }));
        setSelectedIndex((prev: any) => ({ ...prev, solicitante: -1 }));
        break;
    }
  }, [searchResults.solicitante, showResults.solicitante, selectedIndex.solicitante, setSelectedIndex, setShowResults, scrollToSelectedItem]);

  const handleDropdownKeyDown = useCallback((
    e: React.KeyboardEvent,
    field: 'tipoDemanda' | 'analista' | 'distribuidor',
    options: { id: number; nome: string }[],
    selectCallback: (option: { id: number; nome: string }) => void,
    dropdownOpen: { [key: string]: boolean },
    setDropdownOpen: (value: React.SetStateAction<{ [key: string]: boolean }>) => void
  ) => {
    if (!dropdownOpen[field] || options.length === 0) return;

    const currentIndex = selectedIndex[field];

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex = currentIndex === -1 ? 0 : currentIndex < options.length - 1 ? currentIndex + 1 : currentIndex;
        setSelectedIndex((prev: any) => ({ ...prev, [field]: nextIndex }));

        setTimeout(() => {
          const dropdown = document.querySelector(`[data-dropdown="${field}"][class*="multiSelectDropdown"]`);
          if (dropdown) {
            const items = dropdown.querySelectorAll('[class*="checkboxLabel"]');
            const focusedItem = items[nextIndex] as HTMLElement;
            if (focusedItem) {
              focusedItem.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
              });
            }
          }
        }, 0);
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = currentIndex === -1 ? 0 : currentIndex > 0 ? currentIndex - 1 : currentIndex;
        setSelectedIndex((prev: any) => ({ ...prev, [field]: prevIndex }));

        setTimeout(() => {
          const dropdown = document.querySelector(`[data-dropdown="${field}"][class*="multiSelectDropdown"]`);
          if (dropdown) {
            const items = dropdown.querySelectorAll('[class*="checkboxLabel"]');
            const focusedItem = items[prevIndex] as HTMLElement;
            if (focusedItem) {
              focusedItem.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
              });
            }
          }
        }, 0);
        break;
      }

      case 'Tab':
        setDropdownOpen((prev: any) => ({ ...prev, [field]: false }));
        setSelectedIndex((prev: any) => ({ ...prev, [field]: -1 }));
        break;

      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (currentIndex >= 0 && currentIndex < options.length) {
          selectCallback(options[currentIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setDropdownOpen((prev: any) => ({ ...prev, [field]: false }));
        setSelectedIndex((prev: any) => ({ ...prev, [field]: -1 }));
        break;
    }
  }, [selectedIndex, setSelectedIndex]);

  return { handleKeyDown, handleDropdownKeyDown, scrollToSelectedItem };
};