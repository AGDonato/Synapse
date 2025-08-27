// src/hooks/useOptimizedFiltering.ts
import { useMemo } from 'react';
import { useDebounce } from './useDebounce';
import type { Demanda } from '../types/entities';

export interface FilterOptions {
  referencia: string;
  tipoDemanda: string;
  solicitante: string;
  status: string[];
  analista: string[];
  descricao: string;
  documentos: string;
  periodoInicial: [Date | null, Date | null];
  periodoFinal: [Date | null, Date | null];
}

export interface SortConfig {
  key: keyof Demanda | 'status';
  direction: 'asc' | 'desc';
}

export function useOptimizedFiltering(
  data: Demanda[], 
  filters: FilterOptions, 
  sortConfig: SortConfig | null,
  calculateStatus: (demanda: Demanda) => string
) {
  // Debounce text filters for better performance
  const debouncedReferencia = useDebounce(filters.referencia, 300);
  const debouncedDescricao = useDebounce(filters.descricao, 300);
  const debouncedDocumentos = useDebounce(filters.documentos, 300);

  // Memoized filtering logic
  const filteredData = useMemo(() => {
    let filtered = data;

    // Text filters (debounced)
    if (debouncedReferencia) {
      const searchTerm = debouncedReferencia.toLowerCase();
      filtered = filtered.filter(item => 
        item.sged.toLowerCase().includes(searchTerm) ||
        item.tipoDemanda.toLowerCase().includes(searchTerm) ||
        item.assunto.toLowerCase().includes(searchTerm)
      );
    }

    if (debouncedDescricao) {
      const searchTerm = debouncedDescricao.toLowerCase();
      filtered = filtered.filter(item =>
        item.assunto.toLowerCase().includes(searchTerm) ||
        (item.observacoes?.toLowerCase().includes(searchTerm))
      );
    }

    if (debouncedDocumentos) {
      const searchTerm = debouncedDocumentos.toLowerCase();
      filtered = filtered.filter(item =>
        item.sged.toString().includes(searchTerm)
      );
    }

    // Dropdown filters (immediate)
    if (filters.tipoDemanda) {
      filtered = filtered.filter(item => item.tipoDemanda === filters.tipoDemanda);
    }

    if (filters.solicitante) {
      filtered = filtered.filter(item => item.orgaoRequisitante === filters.solicitante);
    }

    // Multi-select filters
    if (filters.status.length > 0) {
      filtered = filtered.filter(item => {
        const status = calculateStatus(item);
        return filters.status.includes(status);
      });
    }

    if (filters.analista.length > 0) {
      filtered = filtered.filter(item => {
        // Assuming analista is stored in a property or derived somehow
        // This would need to be adapted based on your data structure
        return filters.analista.some(analista => 
          item.autoridade.includes(analista) // Example logic
        );
      });
    }

    // Date range filters
    if (filters.periodoInicial[0] || filters.periodoInicial[1]) {
      filtered = filtered.filter(item => {
        if (!item.dataInicial) {return false;}
        
        const itemDate = parseDate(item.dataInicial);
        if (!itemDate) {return false;}

        const [startDate, endDate] = filters.periodoInicial;
        
        if (startDate && itemDate < startDate) {return false;}
        if (endDate && itemDate > endDate) {return false;}
        
        return true;
      });
    }

    if (filters.periodoFinal[0] || filters.periodoFinal[1]) {
      filtered = filtered.filter(item => {
        if (!item.dataFinal) {return true;} // Include items without end date
        
        const itemDate = parseDate(item.dataFinal);
        if (!itemDate) {return true;}

        const [startDate, endDate] = filters.periodoFinal;
        
        if (startDate && itemDate < startDate) {return false;}
        if (endDate && itemDate > endDate) {return false;}
        
        return true;
      });
    }

    return filtered;
  }, [
    data,
    debouncedReferencia,
    debouncedDescricao,
    debouncedDocumentos,
    filters.tipoDemanda,
    filters.solicitante,
    filters.status,
    filters.analista,
    filters.periodoInicial,
    filters.periodoFinal,
    calculateStatus
  ]);

  // Memoized sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig) {return filteredData;}

    return [...filteredData].sort((a, b) => {
      let aValue: unknown;
      let bValue: unknown;

      if (sortConfig.key === 'status') {
        aValue = calculateStatus(a);
        bValue = calculateStatus(b);
      } else {
        aValue = a[sortConfig.key as keyof Demanda];
        bValue = b[sortConfig.key as keyof Demanda];
      }

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig, calculateStatus]);

  // Memoized pagination data
  const getPaginatedData = useMemo(() => {
    return (currentPage: number, itemsPerPage: number) => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      return {
        data: sortedData.slice(startIndex, endIndex),
        totalItems: sortedData.length,
        totalPages: Math.ceil(sortedData.length / itemsPerPage),
        hasNextPage: endIndex < sortedData.length,
        hasPrevPage: startIndex > 0,
      };
    };
  }, [sortedData]);

  return {
    filteredData: sortedData,
    getPaginatedData,
    totalFilteredItems: sortedData.length,
  };
}

// Helper function to parse Brazilian date format (DD/MM/YYYY)
function parseDate(dateString: string): Date | null {
  if (!dateString) {return null;}
  
  const [day, month, year] = dateString.split('/').map(Number);
  if (!day || !month || !year) {return null;}
  
  const date = new Date(year, month - 1, day);
  
  // Validate the date
  if (date.getFullYear() !== year || 
      date.getMonth() !== month - 1 || 
      date.getDate() !== day) {
    return null;
  }
  
  return date;
}