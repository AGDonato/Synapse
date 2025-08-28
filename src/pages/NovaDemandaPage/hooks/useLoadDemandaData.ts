// src/pages/NovaDemandaPage/hooks/useLoadDemandaData.ts
import { useCallback } from 'react';
import type { FormDataState } from './useFormularioEstado';
import { mockAnalistas } from '../../../data/mockAnalistas';
import { mockDistribuidores } from '../../../data/mockDistribuidores';
import { mockTiposDemandas } from '../../../data/mockTiposDemandas';

export const useLoadDemandaData = (
  isEditMode: boolean,
  demandaId: string | undefined,
  demandas: any[],
  hasLoadedInitialData: boolean,
  orgaosSolicitantes: any[],
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>,
  setHasLoadedInitialData: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const findDemandaEntities = useCallback(
    (demanda: any) => {
      const tipoEncontrado = mockTiposDemandas.find(t => t.nome === demanda.tipoDemanda);
      const solicitanteEncontrado = orgaosSolicitantes.find(
        o => o.nomeCompleto === demanda.orgao || o.abreviacao === demanda.orgao
      );
      const analistaEncontrado = mockAnalistas.find(a => a.nome === demanda.analista);
      const distribuidorEncontrado = mockDistribuidores.find(d => d.nome === demanda.distribuidor);

      return {
        tipoEncontrado,
        solicitanteEncontrado,
        analistaEncontrado,
        distribuidorEncontrado,
      };
    },
    [orgaosSolicitantes]
  );

  const buildFormDataFromDemanda = useCallback(
    (demanda: any, entities: any) => ({
      tipoDemanda: entities.tipoEncontrado ?? null,
      solicitante: entities.solicitanteEncontrado ? { id: 0, nome: demanda.orgao } : null,
      dataInicial: demanda.dataInicial ?? '',
      descricao: demanda.descricao ?? '',
      sged: demanda.sged ?? '',
      autosAdministrativos: demanda.autosAdministrativos ?? '',
      pic: demanda.pic ?? '',
      autosJudiciais: demanda.autosJudiciais ?? '',
      autosExtrajudiciais: demanda.autosExtrajudiciais ?? '',
      alvos: demanda.alvos !== undefined && demanda.alvos !== null ? String(demanda.alvos) : '',
      identificadores:
        demanda.identificadores !== undefined && demanda.identificadores !== null
          ? String(demanda.identificadores)
          : '',
      analista: entities.analistaEncontrado ?? null,
      distribuidor: entities.distribuidorEncontrado ?? null,
    }),
    []
  );

  const loadDemandaData = useCallback(() => {
    if (!isEditMode || !demandaId || demandas.length === 0 || hasLoadedInitialData) return;

    const demanda = demandas.find(d => d.id === parseInt(demandaId));
    if (!demanda) return;

    const entities = findDemandaEntities(demanda);
    const formData = buildFormDataFromDemanda(demanda, entities);

    setFormData(formData);
    setHasLoadedInitialData(true);
  }, [
    isEditMode,
    demandaId,
    demandas,
    hasLoadedInitialData,
    findDemandaEntities,
    buildFormDataFromDemanda,
    setFormData,
    setHasLoadedInitialData,
  ]);

  return { loadDemandaData };
};
