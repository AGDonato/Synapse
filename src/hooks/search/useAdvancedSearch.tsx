// src/hooks/search/useAdvancedSearch.ts
import { useCallback, useMemo } from 'react';
import { useDebounce } from '../useDebounce';

export interface SearchOptions {
  searchFields?: string[];
  caseSensitive?: boolean;
  exactMatch?: boolean;
  minQueryLength?: number;
  maxResults?: number;
  debounceMs?: number;
}

export type SearchDataSource = string[] | Record<string, unknown>[];

const defaultSearchFields = ['nome', 'nomeFantasia', 'razaoSocial', 'nomeCompleto'];

const defaultOptions: Required<SearchOptions> = {
  searchFields: defaultSearchFields,
  caseSensitive: false,
  exactMatch: false,
  minQueryLength: 1,
  maxResults: 50,
  debounceMs: 150,
};

// Advanced search algorithm with fuzzy matching
function fuzzyMatch(text: string, query: string, caseSensitive = false): number {
  if (!text || !query) {return 0;}

  const textToMatch = caseSensitive ? text : text.toLowerCase();
  const queryToMatch = caseSensitive ? query : query.toLowerCase();

  // Exact match gets highest score
  if (textToMatch === queryToMatch) {return 100;}

  // Starts with query gets high score
  if (textToMatch.startsWith(queryToMatch)) {return 90;}

  // Contains query gets medium score
  if (textToMatch.includes(queryToMatch)) {return 70;}

  // Fuzzy matching for partial character matches
  let score = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < textToMatch.length && queryIndex < queryToMatch.length; i++) {
    if (textToMatch[i] === queryToMatch[queryIndex]) {
      score += 1;
      queryIndex++;
    }
  }

  // Calculate percentage match
  const matchPercentage = (score / queryToMatch.length) * 50; // Max 50 points for fuzzy match
  
  return queryIndex === queryToMatch.length ? matchPercentage : 0;
}

function extractSearchableText(
  item: unknown, 
  searchFields: string[]
): { text: string; originalItem: unknown } {
  if (typeof item === 'string') {
    return { text: item, originalItem: item };
  }

  // For objects, try to extract text from specified fields
  for (const field of searchFields) {
    if ((item as Record<string, unknown>)[field] && typeof (item as Record<string, unknown>)[field] === 'string') {
      return { text: (item as Record<string, unknown>)[field] as string, originalItem: item };
    }
  }

  return { text: '', originalItem: item };
}

export function useAdvancedSearch(
  dataSource: SearchDataSource,
  query: string,
  options: SearchOptions = {}
) {
  const config = useMemo(() => ({ ...defaultOptions, ...options }), [options]);
  const debouncedQuery = useDebounce(query, config.debounceMs);

  // Memoized search results
  const searchResults = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < config.minQueryLength) {
      return [];
    }

    if (!dataSource || dataSource.length === 0) {
      return [];
    }

    // Extract searchable text and perform fuzzy matching
    const matches = dataSource
      .map(item => extractSearchableText(item, config.searchFields))
      .filter(({ text }) => text.length > 0)
      .map(({ text, originalItem }) => ({
        text,
        originalItem,
        score: fuzzyMatch(text, debouncedQuery, config.caseSensitive)
      }))
      .filter(match => match.score > 0)
      .sort((a, b) => {
        // Sort by score descending, then alphabetically
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.text.localeCompare(b.text);
      })
      .slice(0, config.maxResults);

    // Return the original format (strings for string arrays, objects for object arrays)
    if (typeof dataSource[0] === 'string') {
      return matches.map(match => match.text);
    } else {
      return matches.map(match => match.originalItem);
    }
  }, [dataSource, debouncedQuery, config]);

  // Function to highlight matching text
  const highlightMatch = useCallback((text: string, query: string): React.ReactNode => {
    if (!query) {return text;}

    const queryToMatch = config.caseSensitive ? query : query.toLowerCase();
    const textToMatch = config.caseSensitive ? text : text.toLowerCase();
    
    const index = textToMatch.indexOf(queryToMatch);
    if (index === -1) {return text;}

    return (
      <>
        {text.slice(0, index)}
        <mark className="search-highlight">
          {text.slice(index, index + query.length)}
        </mark>
        {text.slice(index + query.length)}
      </>
    );
  }, [config.caseSensitive]);

  // Get search statistics
  const searchStats = useMemo(() => {
    const totalResults = searchResults.length;
    const hasMore = dataSource.length > config.maxResults && totalResults === config.maxResults;
    
    return {
      totalResults,
      hasMore,
      query: debouncedQuery,
      isSearching: query !== debouncedQuery, // Still debouncing
    };
  }, [searchResults, dataSource.length, config.maxResults, debouncedQuery, query]);

  return {
    results: searchResults,
    highlightMatch,
    searchStats,
    isSearching: searchStats.isSearching,
  };
}