// src/hooks/search/useKeyboardNavigation.ts
import { useCallback, useRef } from 'react';

export interface KeyboardNavigationOptions {
  onSelect: (value: string, index: number) => void;
  onEscape?: () => void;
  onTab?: () => void;
  scrollContainer?: string; // CSS selector for scroll container
}

export function useKeyboardNavigation(
  results: string[],
  selectedIndex: number,
  setSelectedIndex: (index: number) => void,
  options: KeyboardNavigationOptions
) {
  const lastKeyRef = useRef<string>('');

  const scrollToSelectedItem = useCallback((index: number) => {
    requestAnimationFrame(() => {
      const container = document.querySelector(options.scrollContainer || '.search-results')!;
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
    });
  }, [options.scrollContainer]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const resultsCount = results.length;
    if (resultsCount === 0) {return;}

    lastKeyRef.current = e.key;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex = selectedIndex < resultsCount - 1 ? selectedIndex + 1 : selectedIndex;
        setSelectedIndex(nextIndex);
        scrollToSelectedItem(nextIndex);
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : selectedIndex;
        setSelectedIndex(prevIndex);
        scrollToSelectedItem(prevIndex);
        break;
      }

      case 'Home': {
        e.preventDefault();
        setSelectedIndex(0);
        scrollToSelectedItem(0);
        break;
      }

      case 'End': {
        e.preventDefault();
        const lastIndex = resultsCount - 1;
        setSelectedIndex(lastIndex);
        scrollToSelectedItem(lastIndex);
        break;
      }

      case 'Enter': {
        e.preventDefault();
        e.stopPropagation();
        if (selectedIndex >= 0 && selectedIndex < resultsCount) {
          const selectedValue = results[selectedIndex];
          options.onSelect(selectedValue, selectedIndex);
        }
        break;
      }

      case 'Escape': {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex(-1);
        options.onEscape?.();
        break;
      }

      case 'Tab': {
        setSelectedIndex(-1);
        options.onTab?.();
        break;
      }

      default:
        // For character keys, reset selection to allow natural searching
        if (e.key.length === 1) {
          setSelectedIndex(-1);
        }
        break;
    }
  }, [results, selectedIndex, setSelectedIndex, scrollToSelectedItem, options]);

  const handleMouseEnter = useCallback((index: number) => {
    // Only update selection on mouse enter if the last action wasn't a keyboard action
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(lastKeyRef.current)) {
      setSelectedIndex(index);
    }
    lastKeyRef.current = '';
  }, [setSelectedIndex]);

  const handleMouseLeave = useCallback(() => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(lastKeyRef.current)) {
      setSelectedIndex(-1);
    }
  }, [setSelectedIndex]);

  return {
    handleKeyDown,
    handleMouseEnter,
    handleMouseLeave,
    scrollToSelectedItem,
  };
}