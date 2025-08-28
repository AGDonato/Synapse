// src/hooks/search/useOptimizedSearch.ts
import { useCallback, useEffect } from 'react';
import { useSearchState } from './useSearchState';
import { useKeyboardNavigation } from './useKeyboardNavigation';
import { type SearchDataSource, type SearchOptions, useAdvancedSearch } from './useAdvancedSearch';

export interface OptimizedSearchOptions extends SearchOptions {
  onSelect: (value: string, originalItem?: unknown) => void;
  onEscape?: () => void;
  fieldId?: string;
  placeholder?: string;
  scrollContainer?: string;
}

export function useOptimizedSearch(
  dataSource: SearchDataSource,
  options: OptimizedSearchOptions
) {
  const searchState = useSearchState(options.fieldId);
  const { results, highlightMatch, searchStats, isSearching } = useAdvancedSearch(
    dataSource,
    '', // Query will be managed by searchState
    options
  );

  // Update search results when they change
  useEffect(() => {
    if (Array.isArray(results)) {
      // Extract display strings from results
      const displayResults = results.map(result => {
        if (typeof result === 'string') {return result;}
        
        // For objects, find the first searchable field
        const searchFields = options.searchFields ?? ['nome', 'nomeFantasia', 'razaoSocial', 'nomeCompleto'];
        for (const field of searchFields) {
          if ((result as Record<string, unknown>)[field] && typeof (result as Record<string, unknown>)[field] === 'string') {
            return (result as Record<string, unknown>)[field] as string;
          }
        }
        return String(result);
      });
      
      searchState.setResults(displayResults);
    }
  }, [results, searchState, options.searchFields]);

  const handleSelect = useCallback((value: string, index: number) => {
    const originalItem = results[index];
    options.onSelect(value, originalItem);
    searchState.clearSearch();
  }, [results, options, searchState]);

  const handleEscape = useCallback(() => {
    searchState.clearSearch();
    options.onEscape?.();
  }, [searchState, options]);

  const keyboardNavigation = useKeyboardNavigation(
    searchState.results,
    searchState.selectedIndex,
    searchState.setSelectedIndex,
    {
      onSelect: handleSelect,
      onEscape: handleEscape,
      onTab: handleEscape,
      scrollContainer: options.scrollContainer,
    }
  );

  // Search function to be called when input changes
  const performSearch = useCallback((query: string) => {
    if (!query || query.length < (options.minQueryLength ?? 1)) {
      searchState.clearSearch();
      return;
    }

    searchState.setIsLoading(true);
    
    // This would trigger useAdvancedSearch to recompute
    // In a real implementation, you'd pass the query to useAdvancedSearch
    // For now, we'll simulate the search result update
    setTimeout(() => {
      // The results will be updated through the useEffect above
      searchState.setIsLoading(false);
    }, 50);
  }, [searchState, options.minQueryLength]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const container = options.fieldId 
        ? document.querySelector(`[data-field="${options.fieldId}"]`)
        : null;
      
      if (container && !container.contains(target)) {
        searchState.clearSearch();
      }
    };

    if (searchState.showResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [searchState.showResults, searchState, options.fieldId]);

  // Result item click handler
  const handleResultClick = useCallback((value: string, index: number) => {
    handleSelect(value, index);
  }, [handleSelect]);

  return {
    // State
    results: searchState.results,
    showResults: searchState.showResults,
    selectedIndex: searchState.selectedIndex,
    isLoading: searchState.isLoading || isSearching,
    
    // Actions
    performSearch,
    clearSearch: searchState.clearSearch,
    
    // Event handlers
    onKeyDown: keyboardNavigation.handleKeyDown,
    onResultClick: handleResultClick,
    onResultMouseEnter: keyboardNavigation.handleMouseEnter,
    onResultMouseLeave: keyboardNavigation.handleMouseLeave,
    
    // Utilities
    highlightMatch,
    searchStats,
    
    // State setters (for advanced usage)
    setShowResults: searchState.setShowResults,
    setSelectedIndex: searchState.setSelectedIndex,
  };
}