// src/hooks/search/useSearchState.ts
import { useCallback, useState } from 'react';

export interface SearchState {
  results: string[];
  showResults: boolean;
  selectedIndex: number;
  isLoading: boolean;
}

export interface SearchActions {
  setResults: (results: string[]) => void;
  setShowResults: (show: boolean) => void;
  setSelectedIndex: (index: number) => void;
  setIsLoading: (loading: boolean) => void;
  clearSearch: () => void;
  reset: () => void;
}

const initialSearchState: SearchState = {
  results: [],
  showResults: false,
  selectedIndex: -1,
  isLoading: false,
};

export function useSearchState(fieldId?: string): SearchState & SearchActions {
  const [state, setState] = useState<SearchState>(initialSearchState);

  const setResults = useCallback((results: string[]) => {
    setState(prev => ({
      ...prev,
      results,
      showResults: results.length > 0,
      selectedIndex: -1,
      isLoading: false,
    }));
  }, []);

  const setShowResults = useCallback((showResults: boolean) => {
    setState(prev => ({ ...prev, showResults }));
  }, []);

  const setSelectedIndex = useCallback((selectedIndex: number) => {
    setState(prev => ({ ...prev, selectedIndex }));
  }, []);

  const setIsLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: [],
      showResults: false,
      selectedIndex: -1,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialSearchState);
  }, []);

  return {
    ...state,
    setResults,
    setShowResults,
    setSelectedIndex,
    setIsLoading,
    clearSearch,
    reset,
  };
}