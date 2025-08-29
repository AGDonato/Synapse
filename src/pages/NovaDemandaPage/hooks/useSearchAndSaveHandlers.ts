// src/pages/NovaDemandaPage/hooks/useSearchAndSaveHandlers.ts
import { useCallback, useMemo } from 'react';
import type { FormDataState } from './useFormularioEstado';
import { filterWithAdvancedSearch } from '../../../utils/searchUtils';

interface SearchResultsState {
  solicitante: string[];
}

interface ShowResultsState {
  solicitante: boolean;
}

interface SelectedIndexState {
  solicitante: number;
  tipoDemanda: number;
  analista: number;
  distribuidor: number;
}

export const useSearchAndSaveHandlers = (
  orgaosSolicitantes: any[],
  formData: FormDataState,
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResultsState>>,
  setShowResults: React.Dispatch<React.SetStateAction<ShowResultsState>>,
  setSelectedIndex: React.Dispatch<React.SetStateAction<SelectedIndexState>>,
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>,
  setToastMessage: React.Dispatch<React.SetStateAction<string>>,
  setToastType: React.Dispatch<React.SetStateAction<'error' | 'success' | 'warning'>>,
  setShowToast: React.Dispatch<React.SetStateAction<boolean>>
) => {
  // Lista de nomes dos solicitantes para busca (apenas nomes dos órgãos)
  const solicitantesDisponiveis = useMemo(
    () => orgaosSolicitantes.map(orgao => orgao.nomeCompleto).sort(),
    [orgaosSolicitantes]
  );

  // Mapa de órgãos para facilitar busca por abreviação
  const orgaosMap = useMemo(
    () => new Map(orgaosSolicitantes.map(orgao => [orgao.nomeCompleto, orgao])),
    [orgaosSolicitantes]
  );

  // Funções de busca de solicitante movidas para useCallback para otimização
  const handleSolicitanteSearch = useCallback(
    (query: string) => {
      const queryLower = query.toLowerCase().trim();

      const filtered = solicitantesDisponiveis.filter(nomeCompleto => {
        const orgao = orgaosMap.get(nomeCompleto);
        if (!orgao) return false;

        const matchesNome = nomeCompleto.toLowerCase().includes(queryLower);
        const matchesAbreviacao = orgao.abreviacao.toLowerCase().includes(queryLower);
        const matchesAdvanced = filterWithAdvancedSearch([nomeCompleto], query).length > 0;

        return matchesNome || matchesAbreviacao || matchesAdvanced;
      });

      setSearchResults((prev: SearchResultsState) => ({ ...prev, solicitante: filtered }));
      setShowResults((prev: ShowResultsState) => ({
        ...prev,
        solicitante: query.length > 0 && filtered.length > 0,
      }));
      setSelectedIndex((prev: SelectedIndexState) => ({ ...prev, solicitante: -1 }));
    },
    [solicitantesDisponiveis, orgaosMap, setSearchResults, setShowResults, setSelectedIndex]
  );

  const selectSolicitanteResult = useCallback(
    (value: string) => {
      setFormData(prev => ({ ...prev, solicitante: { id: 0, nome: value } }));
      setShowResults((prev: ShowResultsState) => ({ ...prev, solicitante: false }));
    },
    [setFormData, setShowResults]
  );

  // Preparar dados comuns para salvar
  const prepararDadosComuns = useCallback(
    () => ({
      sged: formData.sged,
      tipoDemanda: formData.tipoDemanda?.nome ?? '',
      autosAdministrativos: formData.autosAdministrativos,
      pic: formData.pic,
      autosJudiciais: formData.autosJudiciais,
      autosExtrajudiciais: formData.autosExtrajudiciais,
      alvos: formData.alvos ? parseInt(formData.alvos) : 0,
      identificadores: formData.identificadores ? parseInt(formData.identificadores) : 0,
      distribuidor: formData.distribuidor?.nome ?? '',
      descricao:
        formData.descricao.substring(0, 50) + (formData.descricao.length > 50 ? '...' : ''),
      orgao: formData.solicitante?.nome ?? '',
      analista: formData.analista?.nome ?? '',
      dataInicial: formData.dataInicial,
    }),
    [formData]
  );

  // Função para mostrar toast de sucesso
  const showSuccessToast = useCallback(
    (message: string) => {
      setToastMessage(message);
      setToastType('success');
      setShowToast(true);
    },
    [setToastMessage, setToastType, setShowToast]
  );

  return {
    handleSolicitanteSearch,
    selectSolicitanteResult,
    prepararDadosComuns,
    showSuccessToast,
  };
};
