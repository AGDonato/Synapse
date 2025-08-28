/**
 * Advanced virtual list hook for performance optimization
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// Virtual list configuration
interface VirtualListConfig {
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number; // Extra items to render outside visible area
  horizontal?: boolean;
  estimateSize?: (index: number) => number;
  getScrollElement?: () => Element | null;
  paddingStart?: number;
  paddingEnd?: number;
  scrollMargin?: number;
  gap?: number;
  measureElement?: (element: Element, entry: ResizeObserverEntry) => void;
}

// Virtual list item data
interface VirtualListItem<T = unknown> {
  index: number;
  data: T;
  isVisible: boolean;
  size: number;
  start: number;
  end: number;
}

// Virtual list return type
interface VirtualListReturn<T> {
  items: VirtualListItem<T>[];
  totalSize: number;
  scrollElementProps: {
    ref: React.RefObject<HTMLDivElement | null>;
    onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
    style: React.CSSProperties;
  };
  getItemProps: (item: VirtualListItem<T>) => {
    key: React.Key;
    style: React.CSSProperties;
    'data-index': number;
    ref: (element: HTMLElement | null) => void;
  };
  scrollToItem: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => void;
  scrollToOffset: (offset: number) => void;
  measureElement: (index: number, element: HTMLElement) => void;
  isScrolling: boolean;
  visibleRange: { start: number; end: number };
}

/**
 * Advanced virtual list hook
 */
export const useVirtualList = <T>(
  items: T[],
  config: VirtualListConfig
): VirtualListReturn<T> => {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    horizontal = false,
    paddingStart = 0,
    paddingEnd = 0,
    scrollMargin = 0,
    gap = 0,
  } = config;

  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | undefined>(undefined);

  // Get size estimator function
  const estimateSize = useCallback((index: number): number => {
    if (typeof itemHeight === 'function') {
      return itemHeight(index);
    }
    return itemHeight;
  }, [itemHeight]);

  // Create virtualizer
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize,
    overscan,
    horizontal,
    paddingStart,
    paddingEnd,
    scrollMargin,
    gap,
  });

  // Handle scroll events
  const handleScroll = useCallback((_event: React.UIEvent<HTMLDivElement>) => {
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set timeout to detect scroll end
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // Get virtual items with enhanced data
  const virtualItems = useMemo((): VirtualListItem<T>[] => {
    return virtualizer.getVirtualItems().map((virtualItem) => ({
      index: virtualItem.index,
      data: items[virtualItem.index],
      isVisible: true,
      size: virtualItem.size,
      start: virtualItem.start,
      end: virtualItem.end,
    }));
  }, [virtualizer, items]);

  // Get visible range
  const visibleRange = useMemo(() => {
    const virtualItems = virtualizer.getVirtualItems();
    if (virtualItems.length === 0) {
      return { start: 0, end: 0 };
    }
    
    return {
      start: virtualItems[0].index,
      end: virtualItems[virtualItems.length - 1].index,
    };
  }, [virtualizer]);

  // Scroll element props
  const scrollElementProps = useMemo(() => ({
    ref: scrollElementRef,
    onScroll: handleScroll,
    style: {
      height: `${containerHeight}px`,
      width: '100%',
      overflow: 'auto',
    } as React.CSSProperties,
  }), [containerHeight, handleScroll]);

  // Get item props function
  const getItemProps = useCallback((item: VirtualListItem<T>) => ({
    key: item.index,
    'data-index': item.index,
    style: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: `${item.size}px`,
      transform: horizontal
        ? `translateX(${item.start}px)`
        : `translateY(${item.start}px)`,
    },
    ref: (element: HTMLElement | null) => {
      if (element) {
        virtualizer.measureElement(element);
      }
    },
  }), [horizontal, virtualizer]);

  // Scroll to item function
  const scrollToItem = useCallback((
    index: number,
    options: { align?: 'start' | 'center' | 'end' | 'auto' } = {}
  ) => {
    virtualizer.scrollToIndex(index, options);
  }, [virtualizer]);

  // Scroll to offset function
  const scrollToOffset = useCallback((offset: number) => {
    virtualizer.scrollToOffset(offset);
  }, [virtualizer]);

  // Measure element function
  const measureElement = useCallback((index: number, element: HTMLElement) => {
    virtualizer.measureElement(element);
  }, [virtualizer]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    items: virtualItems,
    totalSize: virtualizer.getTotalSize(),
    scrollElementProps,
    getItemProps,
    scrollToItem,
    scrollToOffset,
    measureElement,
    isScrolling,
    visibleRange,
  };
};

/**
 * Virtual grid hook for 2D virtualization
 */
interface VirtualGridConfig {
  itemWidth: number | ((columnIndex: number) => number);
  itemHeight: number | ((rowIndex: number) => number);
  containerWidth: number;
  containerHeight: number;
  columnCount: number;
  rowCount: number;
  overscanX?: number;
  overscanY?: number;
  paddingX?: number;
  paddingY?: number;
  gapX?: number;
  gapY?: number;
}

interface VirtualGridItem<T = unknown> {
  rowIndex: number;
  columnIndex: number;
  index: number;
  data: T;
  width: number;
  height: number;
  x: number;
  y: number;
}

export const useVirtualGrid = <T>(
  items: T[][],
  config: VirtualGridConfig
) => {
  const {
    itemWidth,
    itemHeight,
    containerWidth,
    containerHeight,
    columnCount,
    rowCount,
    overscanX = 3,
    overscanY = 3,
    paddingX = 0,
    paddingY = 0,
    gapX = 0,
    gapY = 0,
  } = config;

  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

  // Calculate item dimensions
  const getItemWidth = useCallback((columnIndex: number): number => {
    if (typeof itemWidth === 'function') {
      return itemWidth(columnIndex);
    }
    return itemWidth;
  }, [itemWidth]);

  const getItemHeight = useCallback((rowIndex: number): number => {
    if (typeof itemHeight === 'function') {
      return itemHeight(rowIndex);
    }
    return itemHeight;
  }, [itemHeight]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const avgItemWidth = typeof itemWidth === 'number' ? itemWidth : 200;
    const avgItemHeight = typeof itemHeight === 'number' ? itemHeight : 50;

    const startRow = Math.max(0, Math.floor(scrollPosition.y / (avgItemHeight + gapY)) - overscanY);
    const endRow = Math.min(
      rowCount - 1,
      Math.ceil((scrollPosition.y + containerHeight) / (avgItemHeight + gapY)) + overscanY
    );

    const startColumn = Math.max(0, Math.floor(scrollPosition.x / (avgItemWidth + gapX)) - overscanX);
    const endColumn = Math.min(
      columnCount - 1,
      Math.ceil((scrollPosition.x + containerWidth) / (avgItemWidth + gapX)) + overscanX
    );

    return { startRow, endRow, startColumn, endColumn };
  }, [
    scrollPosition,
    containerWidth,
    containerHeight,
    columnCount,
    rowCount,
    itemWidth,
    itemHeight,
    overscanX,
    overscanY,
    gapX,
    gapY,
  ]);

  // Get virtual items
  const virtualItems = useMemo((): VirtualGridItem<T>[] => {
    const result: VirtualGridItem<T>[] = [];
    let currentY = paddingY;

    for (let rowIndex = visibleRange.startRow; rowIndex <= visibleRange.endRow; rowIndex++) {
      let currentX = paddingX;
      
      for (let columnIndex = visibleRange.startColumn; columnIndex <= visibleRange.endColumn; columnIndex++) {
        const width = getItemWidth(columnIndex);
        const height = getItemHeight(rowIndex);
        const data = items[rowIndex]?.[columnIndex];

        if (data !== undefined) {
          result.push({
            rowIndex,
            columnIndex,
            index: rowIndex * columnCount + columnIndex,
            data,
            width,
            height,
            x: currentX,
            y: currentY,
          });
        }

        currentX += width + gapX;
      }

      currentY += getItemHeight(rowIndex) + gapY;
    }

    return result;
  }, [
    visibleRange,
    items,
    columnCount,
    getItemWidth,
    getItemHeight,
    paddingX,
    paddingY,
    gapX,
    gapY,
  ]);

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    setScrollPosition({
      x: element.scrollLeft,
      y: element.scrollTop,
    });
  }, []);

  // Calculate total size
  const totalSize = useMemo(() => {
    let totalWidth = paddingX * 2;
    let totalHeight = paddingY * 2;

    for (let i = 0; i < columnCount; i++) {
      totalWidth += getItemWidth(i) + (i < columnCount - 1 ? gapX : 0);
    }

    for (let i = 0; i < rowCount; i++) {
      totalHeight += getItemHeight(i) + (i < rowCount - 1 ? gapY : 0);
    }

    return { width: totalWidth, height: totalHeight };
  }, [columnCount, rowCount, getItemWidth, getItemHeight, paddingX, paddingY, gapX, gapY]);

  // Scroll element props
  const scrollElementProps = {
    ref: scrollElementRef,
    onScroll: handleScroll,
    style: {
      width: `${containerWidth}px`,
      height: `${containerHeight}px`,
      overflow: 'auto',
    } as React.CSSProperties,
  };

  // Get item props
  const getItemProps = useCallback((item: VirtualGridItem<T>) => ({
    key: `${item.rowIndex}-${item.columnIndex}`,
    'data-row': item.rowIndex,
    'data-column': item.columnIndex,
    style: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: `${item.width}px`,
      height: `${item.height}px`,
      transform: `translate(${item.x}px, ${item.y}px)`,
    },
  }), []);

  // Scroll to item
  const scrollToItem = useCallback((rowIndex: number, columnIndex: number) => {
    const element = scrollElementRef.current;
    if (!element) {return;}

    let targetX = paddingX;
    let targetY = paddingY;

    for (let i = 0; i < columnIndex; i++) {
      targetX += getItemWidth(i) + gapX;
    }

    for (let i = 0; i < rowIndex; i++) {
      targetY += getItemHeight(i) + gapY;
    }

    element.scrollTo({
      left: targetX,
      top: targetY,
      behavior: 'smooth',
    });
  }, [getItemWidth, getItemHeight, paddingX, paddingY, gapX, gapY]);

  return {
    items: virtualItems,
    totalSize,
    scrollElementProps,
    getItemProps,
    scrollToItem,
    visibleRange,
  };
};

// Utility hook for measuring dynamic item sizes
export const useItemSizeCache = () => {
  const sizeCache = useRef<Map<string | number, number>>(new Map());

  const setSize = useCallback((key: string | number, size: number) => {
    sizeCache.current.set(key, size);
  }, []);

  const getSize = useCallback((key: string | number, defaultSize = 50): number => {
    return sizeCache.current.get(key) ?? defaultSize;
  }, []);

  const clearCache = useCallback(() => {
    sizeCache.current.clear();
  }, []);

  return { setSize, getSize, clearCache };
};

export default {
  useVirtualList,
  useVirtualGrid,
  useItemSizeCache,
};