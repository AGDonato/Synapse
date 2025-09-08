// src/pages/configuracoes/RegrasPage.tsx
import { useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './RegrasPage.module.css';

// Componentes extraídos
import { AutoridadesSection } from './components/AutoridadesSection';
import { OrgaosSection } from './components/OrgaosSection';
import { AssuntosDocumentosSection } from './components/AssuntosDocumentosSection';
import { VisibilidadeSection } from './components/VisibilidadeSection';
import { dynamicStyles } from './styles/regrasPageStyles';

// Hooks personalizados
import { useRegrasLogic } from './hooks/useRegrasLogic';
import { useUIState } from './hooks/useUIState';

// Importando regras de documento
import {
  initializeDocumentoConfigs,
  validateSystemConsistency,
} from '../../shared/data/documentoRegras';

export default function RegrasPage() {
  // Hooks personalizados para lógica de negócio e estado da UI
  const regrasLogic = useRegrasLogic();
  const uiState = useUIState();

  // Funções de sincronização
  const updateSyncInfo = useCallback(() => {
    validateSystemConsistency();
  }, []);

  // Inicialização
  useEffect(() => {
    initializeDocumentoConfigs();
    updateSyncInfo();
  }, [updateSyncInfo]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Regras do Sistema</h2>
        <p className={styles.pageDescription}>
          Nesta área, gerenciaremos as propriedades e os relacionamentos entre os cadastros.
        </p>
      </div>

      {/* Seção Cadastros */}
      <div className={styles.sectionCard}>
        <div
          style={dynamicStyles.sectionHeader(
            uiState.isCadastrosOpen,
            uiState.hoveredSectionHeader === 'cadastros'
          )}
          onClick={uiState.handleToggleCadastros}
          onMouseEnter={() => uiState.setHoveredSectionHeader('cadastros')}
          onMouseLeave={() => uiState.setHoveredSectionHeader(null)}
        >
          <span>Cadastros</span>
          <span>
            {uiState.isCadastrosOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
        </div>
        {uiState.isCadastrosOpen && (
          <div className={styles.sectionContent}>
            <div className={styles.tabsContainer}>
              <button
                onClick={() => uiState.setCadastrosActiveTab('autoridades')}
                style={dynamicStyles.tabButton(uiState.cadastrosActiveTab === 'autoridades')}
              >
                Autoridades
              </button>
              <button
                onClick={() => uiState.setCadastrosActiveTab('orgaos')}
                style={dynamicStyles.tabButton(uiState.cadastrosActiveTab === 'orgaos')}
              >
                Órgãos
              </button>
            </div>

            {uiState.cadastrosActiveTab === 'autoridades' && (
              <AutoridadesSection
                regrasAutoridades={regrasLogic.regrasAutoridades}
                isDirtyAutoridades={regrasLogic.isDirtyAutoridades}
                searchTermAutoridades={uiState.searchTermAutoridades}
                onSearchChange={uiState.setSearchTermAutoridades}
                onRuleChange={regrasLogic.handleRuleChangeAutoridades}
                onSaveChanges={regrasLogic.handleSaveChangesAutoridades}
              />
            )}

            {uiState.cadastrosActiveTab === 'orgaos' && (
              <OrgaosSection
                regrasOrgaos={regrasLogic.regrasOrgaos}
                isDirtyOrgaos={regrasLogic.isDirtyOrgaos}
                searchTermOrgaos={uiState.searchTermOrgaos}
                onSearchChange={uiState.setSearchTermOrgaos}
                onRuleChange={regrasLogic.handleRuleChangeOrgaos}
                onSaveChanges={regrasLogic.handleSaveChangesOrgaos}
              />
            )}
          </div>
        )}
      </div>

      {/* Seção Documentos */}
      <div className={styles.sectionCard}>
        <div
          style={dynamicStyles.sectionHeader(
            uiState.isDocumentosOpen,
            uiState.hoveredSectionHeader === 'documentos'
          )}
          onClick={uiState.handleToggleDocumentos}
          onMouseEnter={() => uiState.setHoveredSectionHeader('documentos')}
          onMouseLeave={() => uiState.setHoveredSectionHeader(null)}
        >
          <span>Documentos</span>
          <span>
            {uiState.isDocumentosOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
        </div>
        {uiState.isDocumentosOpen && (
          <div className={styles.sectionContent}>
            <div className={styles.tabsContainer}>
              <button
                onClick={() => uiState.setDocumentosActiveTab('assunto-tipo')}
                style={dynamicStyles.tabButton(uiState.documentosActiveTab === 'assunto-tipo')}
              >
                Assunto → Tipo de Documento
              </button>
              <button
                onClick={() => uiState.setDocumentosActiveTab('visibilidade')}
                style={dynamicStyles.tabButton(uiState.documentosActiveTab === 'visibilidade')}
              >
                Visibilidade
              </button>
            </div>

            {uiState.documentosActiveTab === 'assunto-tipo' && (
              <AssuntosDocumentosSection
                selectedAssuntoId={regrasLogic.selectedAssuntoId}
                isDirtyAssuntos={regrasLogic.isDirtyAssuntos}
                onAssuntoSelect={regrasLogic.handleAssuntoSelect}
                onAssuntoDocChange={regrasLogic.handleAssuntoDocChange}
                onSaveChanges={regrasLogic.handleSaveChangesAssuntos}
              />
            )}

            {uiState.documentosActiveTab === 'visibilidade' && (
              <VisibilidadeSection
                isDirtyDocumento={regrasLogic.isDirtyDocumento}
                onVisibilityChange={regrasLogic.handleVisibilityChange}
                onSaveChanges={regrasLogic.handleSaveChangesDocumento}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
