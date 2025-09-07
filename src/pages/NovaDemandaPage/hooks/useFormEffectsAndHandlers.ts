// src/pages/NovaDemandaPage/hooks/useFormEffectsAndHandlers.ts
import { useCallback, useEffect } from 'react';
import type { FormDataState, DropdownState } from './useFormularioEstado';
import type { Demanda } from '../../../types/entities';
import { useNavigate } from 'react-router-dom';

interface ShowResultsState {
  solicitante: boolean;
}

interface DemandaData {
  status: string;
  dataFinal: string | null;
  tipoDemanda: string;
  orgao: string;
  analista: string;
  distribuidor: string;
  dataInicial: string;
  descricao: string;
  sged: string;
  autosAdministrativos: string;
  pic: string;
  autosJudiciais: string;
  autosExtrajudiciais: string;
  alvos: number;
  identificadores: number;
}

interface StateSetters {
  setDropdownOpen: React.Dispatch<React.SetStateAction<DropdownState>>;
  setShowResults: React.Dispatch<React.SetStateAction<ShowResultsState>>;
}

interface DemandaHandlers {
  updateDemanda: (id: number, data: Partial<any>) => Promise<void>;
  createDemanda: (data: Partial<any>) => Promise<any>;
  prepararDadosComuns: () => any;
  showSuccessToast: (message: string) => void;
}

interface EditModeData {
  isEditMode: boolean;
  demandaId: string | undefined;
  demandas: Demanda[];
  returnTo: string | null;
}

interface FormHandlers {
  loadDemandaData: () => void;
  validateForm: (formData: FormDataState) => boolean;
}

export const useFormEffectsAndHandlers = (
  stateSetters: StateSetters,
  demandaHandlers: DemandaHandlers,
  editModeData: EditModeData,
  formHandlers: FormHandlers,
  formData: FormDataState
) => {
  const navigate = useNavigate();

  // Event listener para fechar dropdown e resultados de busca quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest(`[class*='multiSelectContainer']`)) {
        stateSetters.setDropdownOpen({ tipoDemanda: false, analista: false, distribuidor: false });
      }

      if (!target.closest(`[class*='searchContainer']`)) {
        stateSetters.setShowResults({ solicitante: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [stateSetters]);

  // Carregar dados da demanda quando estiver em modo de edição
  useEffect(() => {
    formHandlers.loadDemandaData();
  }, [formHandlers]);

  const handleFormKeyDown = useCallback((e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    const isSubmitButton = (target as HTMLInputElement | HTMLButtonElement).type === 'submit';

    if (e.key === 'Enter' && !isSubmitButton) {
      const isInDropdown =
        target.closest('[data-dropdown]') ??
        target.closest('.multiSelectDropdown') ??
        target.hasAttribute('data-dropdown');

      if (!isInDropdown) {
        e.preventDefault();
      }
    }
  }, []);

  // Função para salvar demanda
  const salvarDemanda = useCallback(() => {
    const dadosComuns = demandaHandlers.prepararDadosComuns();

    if (editModeData.isEditMode && editModeData.demandaId) {
      const demandaId = editModeData.demandaId;
      const demandaExistente = editModeData.demandas.find(d => d.id === parseInt(demandaId));
      const dadosParaSalvar: DemandaData = {
        ...dadosComuns,
        status: demandaExistente?.status ?? 'Fila de Espera',
        dataFinal: demandaExistente?.dataFinal ?? null,
      };
      demandaHandlers.updateDemanda(parseInt(demandaId), dadosParaSalvar);
      demandaHandlers.showSuccessToast('Demanda atualizada com sucesso!');
    } else {
      const dadosParaSalvar: DemandaData = {
        ...dadosComuns,
        status: 'Fila de Espera',
        dataFinal: null,
      };
      demandaHandlers.createDemanda(dadosParaSalvar);
      demandaHandlers.showSuccessToast('Nova demanda adicionada com sucesso!');
    }

    navigate(
      editModeData.isEditMode && editModeData.returnTo === 'detail'
        ? `/demandas/${editModeData.demandaId}`
        : '/demandas'
    );
  }, [demandaHandlers, editModeData, navigate]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formHandlers.validateForm(formData)) return;
      salvarDemanda();
    },
    [formHandlers, formData, salvarDemanda]
  );

  return {
    handleFormKeyDown,
    handleSubmit,
  };
};
