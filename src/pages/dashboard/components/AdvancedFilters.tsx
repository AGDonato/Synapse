import React, { useMemo } from 'react';
import { useDemandasData } from '../../../shared/hooks/queries/useDemandas';
import { useDocumentosData } from '../../../shared/hooks/queries/useDocumentos';
import { mockAssuntos } from '../../../shared/data/mockAssuntos';
import { FilterDropdown } from './FilterDropdown';
import type { FiltrosEstatisticas } from '../types';
import styles from '../styles/AdvancedFilters.module.css';

interface AdvancedFiltersProps {
  filtros: FiltrosEstatisticas;
  onStatusDemandaChange: (status: string) => void;
  onTipoDemandaChange: (tipo: string) => void;
  onOrgaoChange: (orgao: string) => void;
  onTipoDocumentoChange: (tipo: string) => void;
  onAssuntoChange: (assunto: string) => void;
  onStatusDocumentoChange: (status: string) => void;
  onClearFilters: () => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filtros,
  onStatusDemandaChange,
  onTipoDemandaChange,
  onOrgaoChange,
  onTipoDocumentoChange,
  onAssuntoChange,
  onStatusDocumentoChange,
  onClearFilters,
}) => {
  const { data: demandas = [] } = useDemandasData();
  const { data: documentos = [] } = useDocumentosData();

  // Opções para filtros de demandas
  const statusOptions = useMemo(() => {
    const statusSet = new Set<string>();
    demandas.forEach(demanda => {
      if (demanda.status) statusSet.add(demanda.status);
    });
    return Array.from(statusSet).map(status => ({ id: status, nome: status }));
  }, [demandas]);

  const tiposDemandaOptions = useMemo(() => {
    const tiposSet = new Set<string>();
    demandas.forEach(demanda => {
      if (demanda.tipoDemanda) tiposSet.add(demanda.tipoDemanda);
    });
    return Array.from(tiposSet).map(tipo => ({ id: tipo, nome: tipo }));
  }, [demandas]);

  const orgaoOptions = useMemo(() => {
    const orgaosSet = new Set<string>();
    demandas.forEach(demanda => {
      if (demanda.orgao) orgaosSet.add(demanda.orgao);
    });
    return Array.from(orgaosSet).map(orgao => ({ id: orgao, nome: orgao }));
  }, [demandas]);

  // Opções para filtros de documentos
  const tiposDocumentoOptions = useMemo(() => {
    const tiposSet = new Set<string>();
    documentos.forEach(doc => {
      if (doc.tipoDocumento) tiposSet.add(doc.tipoDocumento);
    });
    return Array.from(tiposSet).map(tipo => ({ id: tipo, nome: tipo }));
  }, [documentos]);

  const assuntoOptions = useMemo(() => {
    return mockAssuntos.map(assunto => ({ id: assunto.nome, nome: assunto.nome }));
  }, []);

  const statusDocumentoOptions = useMemo(
    () => [
      { id: 'Enviado', nome: 'Enviado' },
      { id: 'Respondido', nome: 'Respondido' },
      { id: 'Pendente', nome: 'Pendente' },
    ],
    []
  );

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return (
      filtros.demandas.status.length > 0 ||
      filtros.demandas.tipoDemanda.length > 0 ||
      filtros.demandas.orgao.length > 0 ||
      filtros.documentos.tipoDocumento.length > 0 ||
      filtros.documentos.assunto.length > 0 ||
      filtros.documentos.statusDocumento.length > 0
    );
  }, [filtros]);

  const [openDropdowns, setOpenDropdowns] = React.useState<Record<string, boolean>>({});

  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className={styles.container}>
      {/* Seção de Demandas */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>📈 Filtros de Demandas</h4>
        <div className={styles.filtersRow}>
          <FilterDropdown
            label='Status:'
            options={statusOptions}
            selectedValues={filtros.demandas.status}
            onSelectionChange={onStatusDemandaChange}
            isOpen={openDropdowns.statusDemanda || false}
            onToggle={() => toggleDropdown('statusDemanda')}
            getDisplayText={() =>
              filtros.demandas.status.length === 0
                ? ''
                : filtros.demandas.status.length === 1
                  ? filtros.demandas.status[0]
                  : `${filtros.demandas.status.length} status`
            }
          />

          <FilterDropdown
            label='Tipo:'
            options={tiposDemandaOptions}
            selectedValues={filtros.demandas.tipoDemanda}
            onSelectionChange={onTipoDemandaChange}
            isOpen={openDropdowns.tipoDemanda || false}
            onToggle={() => toggleDropdown('tipoDemanda')}
            getDisplayText={() =>
              filtros.demandas.tipoDemanda.length === 0
                ? ''
                : filtros.demandas.tipoDemanda.length === 1
                  ? filtros.demandas.tipoDemanda[0]
                  : `${filtros.demandas.tipoDemanda.length} tipos`
            }
          />

          <FilterDropdown
            label='Órgão:'
            options={orgaoOptions}
            selectedValues={filtros.demandas.orgao}
            onSelectionChange={onOrgaoChange}
            isOpen={openDropdowns.orgao || false}
            onToggle={() => toggleDropdown('orgao')}
            getDisplayText={() =>
              filtros.demandas.orgao.length === 0
                ? ''
                : filtros.demandas.orgao.length === 1
                  ? filtros.demandas.orgao[0]
                  : `${filtros.demandas.orgao.length} órgãos`
            }
          />
        </div>
      </div>

      {/* Seção de Documentos */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>📄 Filtros de Documentos</h4>
        <div className={styles.filtersRow}>
          <FilterDropdown
            label='Tipo Doc.:'
            options={tiposDocumentoOptions}
            selectedValues={filtros.documentos.tipoDocumento}
            onSelectionChange={onTipoDocumentoChange}
            isOpen={openDropdowns.tipoDocumento || false}
            onToggle={() => toggleDropdown('tipoDocumento')}
            getDisplayText={() =>
              filtros.documentos.tipoDocumento.length === 0
                ? ''
                : filtros.documentos.tipoDocumento.length === 1
                  ? filtros.documentos.tipoDocumento[0]
                  : `${filtros.documentos.tipoDocumento.length} tipos`
            }
          />

          <FilterDropdown
            label='Assunto:'
            options={assuntoOptions}
            selectedValues={filtros.documentos.assunto}
            onSelectionChange={onAssuntoChange}
            isOpen={openDropdowns.assunto || false}
            onToggle={() => toggleDropdown('assunto')}
            getDisplayText={() =>
              filtros.documentos.assunto.length === 0
                ? ''
                : filtros.documentos.assunto.length === 1
                  ? filtros.documentos.assunto[0]
                  : `${filtros.documentos.assunto.length} assuntos`
            }
          />

          <FilterDropdown
            label='Status Doc.:'
            options={statusDocumentoOptions}
            selectedValues={filtros.documentos.statusDocumento}
            onSelectionChange={onStatusDocumentoChange}
            isOpen={openDropdowns.statusDocumento || false}
            onToggle={() => toggleDropdown('statusDocumento')}
            getDisplayText={() =>
              filtros.documentos.statusDocumento.length === 0
                ? ''
                : filtros.documentos.statusDocumento.length === 1
                  ? filtros.documentos.statusDocumento[0]
                  : `${filtros.documentos.statusDocumento.length} status`
            }
          />
        </div>
      </div>

      {/* Botão para limpar filtros */}
      {hasActiveFilters && (
        <div className={styles.clearFiltersContainer}>
          <button onClick={onClearFilters} className={styles.clearButton}>
            🗑️ Limpar Filtros Avançados
          </button>
        </div>
      )}
    </div>
  );
};
