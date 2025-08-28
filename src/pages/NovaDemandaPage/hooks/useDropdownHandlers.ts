// src/pages/NovaDemandaPage/hooks/useDropdownHandlers.ts
import { useCallback } from 'react';
import type { FormDataState, DropdownState } from './useFormularioEstado';

export const useDropdownHandlers = (
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>,
  setDropdownOpen: React.Dispatch<React.SetStateAction<DropdownState>>,
  setSelectedIndex: React.Dispatch<React.SetStateAction<any>>,
  setShowResults: React.Dispatch<React.SetStateAction<any>>,
  dropdownOpen: DropdownState
) => {
  const toggleDropdown = useCallback(
    (field: 'tipoDemanda' | 'analista' | 'distribuidor') => {
      const isCurrentlyOpen = dropdownOpen[field];

      setDropdownOpen({ tipoDemanda: false, analista: false, distribuidor: false });
      setShowResults({ solicitante: false });
      setSelectedIndex((prev: any) => ({ ...prev, solicitante: -1 }));

      if (!isCurrentlyOpen) {
        setDropdownOpen((prev: any) => ({ ...prev, [field]: true }));
        setSelectedIndex((prev: any) => ({ ...prev, [field]: -1 }));

        setTimeout(() => {
          const dropdown = document.querySelector(`[data-dropdown="${field}"]`);
          (dropdown as HTMLElement)?.focus();
        }, 0);
      }
    },
    [dropdownOpen, setDropdownOpen, setShowResults, setSelectedIndex]
  );

  const handleTipoDemandaSelect = useCallback(
    (tipo: { id: number; nome: string }) => {
      setFormData(prev => ({ ...prev, tipoDemanda: tipo }));
      setDropdownOpen(prev => ({ ...prev, tipoDemanda: false }));
      setSelectedIndex((prev: any) => ({ ...prev, tipoDemanda: -1 }));
      setTimeout(() => {
        const trigger = document.querySelector('[data-dropdown="tipoDemanda"]');
        (trigger as HTMLElement)?.focus();
      }, 0);
    },
    [setFormData, setDropdownOpen, setSelectedIndex]
  );

  const handleAnalistaSelect = useCallback(
    (analista: { id: number; nome: string }) => {
      setFormData(prev => ({ ...prev, analista: analista }));
      setDropdownOpen(prev => ({ ...prev, analista: false }));
      setSelectedIndex((prev: any) => ({ ...prev, analista: -1 }));
      setTimeout(() => {
        const trigger = document.querySelector('[data-dropdown="analista"]');
        (trigger as HTMLElement)?.focus();
      }, 0);
    },
    [setFormData, setDropdownOpen, setSelectedIndex]
  );

  const handleDistribuidorSelect = useCallback(
    (distribuidor: { id: number; nome: string }) => {
      setFormData(prev => ({ ...prev, distribuidor: distribuidor }));
      setDropdownOpen(prev => ({ ...prev, distribuidor: false }));
      setSelectedIndex((prev: any) => ({ ...prev, distribuidor: -1 }));
      setTimeout(() => {
        const trigger = document.querySelector('[data-dropdown="distribuidor"]');
        (trigger as HTMLElement)?.focus();
      }, 0);
    },
    [setFormData, setDropdownOpen, setSelectedIndex]
  );

  return {
    toggleDropdown,
    handleTipoDemandaSelect,
    handleAnalistaSelect,
    handleDistribuidorSelect,
  };
};
