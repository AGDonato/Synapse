import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer as useTanStackVirtualizer } from '@tanstack/react-virtual';

interface UseVirtualizerOptions {
  count: number;
  estimateSize: (index: number) => number;
  overscan?: number;
  getItemKey?: (index: number) => string | number;
  enabled?: boolean;
  paddingStart?: number;
  paddingEnd?: number;
}

interface UseVirtualizerReturn {
  virtualizer: ReturnType<typeof useTanStackVirtualizer> | null;
  virtualItems: {
    index: number;
    start: number;
    size: number;
    end: number;
    key: string | number;
  }[];
  totalSize: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  isScrolling: boolean;
}

export const useVirtualizer = (options: UseVirtualizerOptions): UseVirtualizerReturn => {
  const {
    count,
    estimateSize,
    overscan = 5,
    getItemKey,
    enabled = true,
    paddingStart = 0,
    paddingEnd = 0,
  } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | undefined>(undefined);

  // Configurar virtualizer apenas se habilitado e com dados
  const virtualizer = useTanStackVirtualizer({
    count: enabled && count > 0 ? count : 0,
    getScrollElement: () => containerRef.current as Element | null,
    estimateSize,
    overscan,
    getItemKey,
    paddingStart,
    paddingEnd,
  });

  // Detectar scroll
  useEffect(() => {
    const element = containerRef.current;
    if (!element) {return;}

    const handleScroll = () => {
      setIsScrolling(true);
      
      // Clear timeout anterior
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }

      // Definir que parou de scrollar após 150ms
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Items virtuais
  const virtualItems = useMemo(() => {
    if (!virtualizer) {return [];}
    
    return virtualizer.getVirtualItems().map(item => ({
      index: item.index,
      start: item.start,
      size: item.size,
      end: item.end,
      key: getItemKey ? getItemKey(item.index) : item.index,
    }));
  }, [virtualizer, getItemKey]);

  // Tamanho total
  const totalSize = useMemo(() => {
    return virtualizer?.getTotalSize() ?? 0;
  }, [virtualizer]);

  // Funções de navegação
  const scrollToIndex = useCallback((index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => {
    virtualizer?.scrollToIndex(index, {
      align: options?.align ?? 'auto',
      behavior: 'smooth',
    });
  }, [virtualizer]);

  const scrollToTop = useCallback(() => {
    const element = containerRef.current;
    if (element) {
      element.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    const element = containerRef.current;
    if (element) {
      element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  return {
    virtualizer,
    virtualItems,
    totalSize,
    containerRef,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    isScrolling,
  };
};

// Hook especializado para tabelas
interface UseTableVirtualizerOptions<T> {
  data: T[];
  rowHeight: number;
  overscan?: number;
  enabled?: boolean;
}

export const useTableVirtualizer = <T>(options: UseTableVirtualizerOptions<T>) => {
  const { data, rowHeight, overscan = 10, enabled = true } = options;

  const virtualizer = useVirtualizer({
    count: data.length,
    estimateSize: () => rowHeight,
    overscan,
    enabled: enabled && data.length > 50, // Só ativar para listas grandes
    getItemKey: (index) => `table-row-${index}`,
  });

  // Dados visíveis
  const visibleData = useMemo(() => {
    if (!virtualizer.virtualizer) {
      return data; // Retornar todos os dados se virtual não estiver ativo
    }

    return virtualizer.virtualItems.map(virtualItem => ({
      ...virtualItem,
      data: data[virtualItem.index],
    }));
  }, [virtualizer.virtualItems, data, virtualizer.virtualizer]);

  return {
    ...virtualizer,
    visibleData,
    isVirtualized: !!virtualizer.virtualizer,
    visibleRange: virtualizer.virtualItems.length > 0 
      ? {
          start: virtualizer.virtualItems[0]?.index ?? 0,
          end: virtualizer.virtualItems[virtualizer.virtualItems.length - 1]?.index ?? 0,
        }
      : { start: 0, end: 0 },
  };
};

// Hook para listas com scroll infinito
interface UseInfiniteVirtualizerOptions<T> {
  data: T[][];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  rowHeight: number;
  overscan?: number;
}

export const useInfiniteVirtualizer = <T>(options: UseInfiniteVirtualizerOptions<T>) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    rowHeight,
    overscan = 5,
  } = options;

  // Flatten dos dados
  const flatData = useMemo(() => data.flat(), [data]);

  const virtualizer = useVirtualizer({
    count: flatData.length,
    estimateSize: () => rowHeight,
    overscan,
    getItemKey: (index) => `infinite-row-${index}`,
  });

  // Detectar quando chegou perto do fim
  useEffect(() => {
    if (!virtualizer.virtualizer || !hasNextPage || isFetchingNextPage) {return;}

    const lastItem = virtualizer.virtualItems[virtualizer.virtualItems.length - 1];
    
    if (lastItem && lastItem.index >= flatData.length - overscan - 1) {
      fetchNextPage();
    }
  }, [virtualizer.virtualItems, flatData.length, fetchNextPage, hasNextPage, isFetchingNextPage, overscan, virtualizer.virtualizer]);

  return {
    ...virtualizer,
    flatData,
  };
};