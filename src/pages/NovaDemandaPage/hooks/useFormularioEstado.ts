// src/pages/NovaDemandaPage/hooks/useFormularioEstado.ts
import { useCallback, useState } from 'react';
import type { Option } from '../../../components/forms/SearchableSelect';

export interface FormDataState {
  tipoDemanda: Option | null;
  solicitante: Option | null;
  dataInicial: string;
  descricao: string;
  sged: string;
  autosAdministrativos: string;
  pic: string;
  autosJudiciais: string;
  autosExtrajudiciais: string;
  alvos: string;
  identificadores: string;
  analista: Option | null;
  distribuidor: Option | null;
}

export interface DropdownState {
  tipoDemanda: boolean;
  analista: boolean;
  distribuidor: boolean;
  [key: string]: boolean;
}

export interface SearchState {
  solicitante: string[];
}

export interface ShowResultsState {
  solicitante: boolean;
}

export interface SelectedIndexState {
  solicitante: number;
  tipoDemanda: number;
  analista: number;
  distribuidor: number;
}

export const useFormularioEstado = () => {
  const [formData, setFormData] = useState<FormDataState>({
    tipoDemanda: null,
    solicitante: null,
    dataInicial: '',
    descricao: '',
    sged: '',
    autosAdministrativos: '',
    pic: '',
    autosJudiciais: '',
    autosExtrajudiciais: '',
    alvos: '',
    identificadores: '',
    analista: null,
    distribuidor: null,
  });

  const [dropdownOpen, setDropdownOpen] = useState<DropdownState>({
    tipoDemanda: false,
    analista: false,
    distribuidor: false,
  });

  const [searchResults, setSearchResults] = useState<SearchState>({
    solicitante: [],
  });

  const [showResults, setShowResults] = useState<ShowResultsState>({
    solicitante: false,
  });

  const [selectedIndex, setSelectedIndex] = useState<SelectedIndexState>({
    solicitante: -1,
    tipoDemanda: -1,
    analista: -1,
    distribuidor: -1,
  });

  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleNumericChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  }, []);

  const closeOtherDropdowns = useCallback(() => {
    setDropdownOpen({
      tipoDemanda: false,
      analista: false,
      distribuidor: false,
    });
  }, []);

  return {
    formData,
    setFormData,
    dropdownOpen,
    setDropdownOpen,
    searchResults,
    setSearchResults,
    showResults,
    setShowResults,
    selectedIndex,
    setSelectedIndex,
    hasLoadedInitialData,
    setHasLoadedInitialData,
    handleChange,
    handleNumericChange,
    closeOtherDropdowns,
  };
};
