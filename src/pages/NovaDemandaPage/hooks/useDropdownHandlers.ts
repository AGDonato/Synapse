// src/pages/NovaDemandaPage/hooks/useDropdownHandlers.ts
import { useCallback } from 'react';
import type { FormDataState, DropdownState } from './useFormularioEstado';

interface SelectedIndexState {
  solicitante: number;
  tipoDemanda: number;
  analista: number;
  distribuidor: number;
}

interface ShowResultsState {
  solicitante: boolean;
}

export const useDropdownHandlers = (
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>,
  setDropdownOpen: React.Dispatch<React.SetStateAction<DropdownState>>,
  setSelectedIndex: React.Dispatch<React.SetStateAction<SelectedIndexState>>,
  setShowResults: React.Dispatch<React.SetStateAction<ShowResultsState>>,
  dropdownOpen: DropdownState
) => {
  const toggleDropdown = useCallback(
    (field: 'tipoDemanda' | 'analista' | 'distribuidor') => {
      const isCurrentlyOpen = dropdownOpen[field];

      setDropdownOpen({ tipoDemanda: false, analista: false, distribuidor: false });
      setShowResults({ solicitante: false });
      setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, solicitante: -1 }));

      if (!isCurrentlyOpen) {
        setDropdownOpen((prev: DropdownState) => ({ ...prev, [field]: true }));
        setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, [field]: -1 }));

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
      setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, tipoDemanda: -1 }));
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
      setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, analista: -1 }));
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
      setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, distribuidor: -1 }));
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
