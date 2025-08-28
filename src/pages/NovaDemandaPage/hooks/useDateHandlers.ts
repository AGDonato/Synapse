// src/pages/NovaDemandaPage/hooks/useDateHandlers.ts
import { useCallback } from 'react';
import type { FormDataState } from './useFormularioEstado';

export const useDateHandlers = (
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>
) => {
  const formatDateMask = useCallback((value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }, []);

  const convertToHTMLDate = useCallback((dateStr: string): string => {
    if (!dateStr || dateStr.length < 10) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  }, []);

  const convertFromHTMLDate = useCallback((dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return '';
  }, []);

  const handleDateChange = useCallback(
    (value: string) => {
      const formatted = formatDateMask(value);
      setFormData(prev => ({ ...prev, dataInicial: formatted }));
    },
    [formatDateMask, setFormData]
  );

  const handleCalendarChange = useCallback(
    (value: string) => {
      const formatted = convertFromHTMLDate(value);
      setFormData(prev => ({ ...prev, dataInicial: formatted }));
    },
    [convertFromHTMLDate, setFormData]
  );

  return {
    formatDateMask,
    convertToHTMLDate,
    convertFromHTMLDate,
    handleDateChange,
    handleCalendarChange,
  };
};
