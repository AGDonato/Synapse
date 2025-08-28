// src/pages/NovaDemandaPage/hooks/useFormEffectsAndHandlers.ts
import { useCallback, useEffect } from 'react';
import type { FormDataState } from './useFormularioEstado';
import { useNavigate } from 'react-router-dom';

export const useFormEffectsAndHandlers = (
  setDropdownOpen: React.Dispatch<React.SetStateAction<any>>,
  setShowResults: React.Dispatch<React.SetStateAction<any>>,
  loadDemandaData: () => void,
  isEditMode: boolean,
  demandaId: string | undefined,
  demandas: any[],
  updateDemanda: (id: number, data: any) => void,
  createDemanda: (data: any) => void,
  prepararDadosComuns: () => any,
  showSuccessToast: (message: string) => void,
  returnTo: string | null,
  validateForm: (formData: FormDataState) => boolean,
  formData: FormDataState
) => {
  const navigate = useNavigate();

  // Event listener para fechar dropdown e resultados de busca quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest(`[class*='multiSelectContainer']`)) {
        setDropdownOpen({ tipoDemanda: false, analista: false, distribuidor: false });
      }

      if (!target.closest(`[class*='searchContainer']`)) {
        setShowResults({ solicitante: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setDropdownOpen, setShowResults]);

  // Carregar dados da demanda quando estiver em modo de edição
  useEffect(() => {
    loadDemandaData();
  }, [loadDemandaData]);

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
    const dadosComuns = prepararDadosComuns();

    if (isEditMode && demandaId) {
      const demandaExistente = demandas.find(d => d.id === parseInt(demandaId));
      const dadosParaSalvar = {
        ...dadosComuns,
        status: demandaExistente?.status ?? ('Fila de Espera' as const),
        dataFinal: demandaExistente?.dataFinal ?? null,
      };
      updateDemanda(parseInt(demandaId), dadosParaSalvar);
      showSuccessToast('Demanda atualizada com sucesso!');
    } else {
      const dadosParaSalvar = {
        ...dadosComuns,
        status: 'Fila de Espera' as const,
        dataFinal: null,
      };
      createDemanda(dadosParaSalvar);
      showSuccessToast('Nova demanda adicionada com sucesso!');
    }

    navigate(isEditMode && returnTo === 'detail' ? `/demandas/${demandaId}` : '/demandas');
  }, [
    prepararDadosComuns,
    isEditMode,
    demandaId,
    demandas,
    updateDemanda,
    showSuccessToast,
    createDemanda,
    navigate,
    returnTo,
  ]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm(formData)) return;
      salvarDemanda();
    },
    [validateForm, formData, salvarDemanda]
  );

  return {
    handleFormKeyDown,
    handleSubmit,
  };
};
