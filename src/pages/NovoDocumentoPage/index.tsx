// src/pages/NovoDocumentoPage/index.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

// UI Components
import Toast from '../../components/ui/Toast';

// Local Components
import DocumentFormHeader from './components/shared/DocumentFormHeader';
import DocumentTypeSection from './components/sections/DocumentTypeSection';

// Contexts & Hooks
import { useDocumentos } from '../../contexts/DocumentosContext';
import { useDemandas } from '../../hooks/useDemandas';
import { useNovoDocumentoValidation } from '../../hooks/useNovoDocumentoValidation';
import { useSearchHandlers } from '../../hooks/useSearchHandlers';
import { useDocumentSections } from '../../hooks/useDocumentSections';
import { useDocumentSubmission } from '../../hooks/useDocumentSubmission';

// Local Hooks
import {
  useDocumentForm,
  createInitialFormData,
} from './hooks/useDocumentForm';
import type { DocumentFormData } from './hooks/useDocumentForm';

// Mock Data
import { mockAnalistas } from '../../data/mockAnalistas';
import { mockAutoridades } from '../../data/mockAutoridades';
import { mockProvedores } from '../../data/mockProvedores';

// Utilities
import { getEnderecamentos } from '../../utils/documentoHelpers';

// Types
interface MultiSelectOption {
  id: string;
  nome: string;
}

// Styles
import styles from './NovoDocumentoPage.module.css';

// =============================================================================
// CONSTANTS & DATA PREPARATION
// =============================================================================

// Dados para busca combinando provedores e autoridades
const destinatarios = [
  ...mockProvedores.map(provedor => provedor.nomeFantasia),
  ...mockAutoridades.map(autoridade => autoridade.nome),
].sort();

// Opções para multi-seleção (Ofício Circular)
const destinatariosOptions: MultiSelectOption[] = [
  ...mockProvedores.map(provedor => ({
    id: `provedor-${provedor.id}`,
    nome: provedor.nomeFantasia,
  })),
  ...mockAutoridades.map(autoridade => ({
    id: `autoridade-${autoridade.id}`,
    nome: autoridade.nome,
  })),
].sort((a, b) => a.nome.localeCompare(b.nome));

// Analistas vindos do mock
const analistas = mockAnalistas.map(analista => analista.nome).sort();

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const NovoDocumentoPage: React.FC = () => {
  // -------------------------------------------------------------------------
  // HOOKS & ROUTER STATE
  // -------------------------------------------------------------------------
  const navigate = useNavigate();
  const { demandaId, documentoId } = useParams();
  const [searchParams] = useSearchParams();
  const demandaIdFromQuery = searchParams.get('demandaId');
  const { getDocumento } = useDocumentos();
  const { demandas } = useDemandas();

  // -------------------------------------------------------------------------
  // COMPONENT STATE
  // -------------------------------------------------------------------------

  // Estados para Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success' | 'warning'>(
    'error'
  );

  // Detectar se está em modo de edição
  const isEditMode = Boolean(documentoId);

  // Buscar documento para edição se necessário
  const documentoToEdit =
    isEditMode && documentoId ? getDocumento(parseInt(documentoId)) : null;

  // -------------------------------------------------------------------------
  // UTILITY FUNCTIONS
  // -------------------------------------------------------------------------

  // Função para dividir string de destinatários (tratando formato com "e")
  const parseDestinatarios = (destinatarioString: string): string[] => {
    if (!destinatarioString) return [];

    if (destinatarioString.includes(' e ')) {
      const parts = destinatarioString.split(' e ');
      const ultimoNome = parts.pop()?.trim();
      const primeirosNomes = parts
        .join(' e ')
        .split(', ')
        .map(nome => nome.trim());

      if (ultimoNome) {
        return [...primeirosNomes, ultimoNome];
      }
      return primeirosNomes;
    }

    return destinatarioString
      .split(',')
      .map(nome => nome.trim())
      .filter(nome => nome.length > 0);
  };

  // Função para criar dados iniciais do formulário
  const createInitialData = (): DocumentFormData => {
    if (isEditMode && documentoToEdit) {
      return {
        tipoDocumento: documentoToEdit.tipoDocumento,
        assunto: documentoToEdit.assunto || '',
        assuntoOutros: documentoToEdit.assuntoOutros || '',
        destinatario: documentoToEdit.destinatario
          ? { id: 0, nome: documentoToEdit.destinatario }
          : null,
        destinatarios:
          documentoToEdit.tipoDocumento === 'Ofício Circular'
            ? documentoToEdit.destinatario
              ? (() => {
                  const nomesDestinatarios = parseDestinatarios(
                    documentoToEdit.destinatario
                  );
                  return nomesDestinatarios.map((nome, index) => {
                    const opcaoEncontrada = destinatariosOptions.find(
                      opt => opt.nome === nome
                    );
                    return (
                      opcaoEncontrada || { id: `dest_${index}`, nome: nome }
                    );
                  });
                })()
              : []
            : [],
        enderecamento: documentoToEdit.enderecamento
          ? { id: 0, nome: documentoToEdit.enderecamento }
          : null,
        numeroDocumento: documentoToEdit.numeroDocumento,
        anoDocumento: documentoToEdit.anoDocumento || '',
        analista: documentoToEdit.analista
          ? { id: 0, nome: documentoToEdit.analista }
          : null,
        autoridade: documentoToEdit.autoridade
          ? { id: 0, nome: documentoToEdit.autoridade }
          : null,
        orgaoJudicial: documentoToEdit.orgaoJudicial
          ? { id: 0, nome: documentoToEdit.orgaoJudicial }
          : null,
        dataAssinatura: documentoToEdit.dataAssinatura || '',
        retificada: documentoToEdit.retificada || false,
        tipoMidia: documentoToEdit.tipoMidia || '',
        tamanhoMidia: documentoToEdit.tamanhoMidia || '',
        hashMidia: documentoToEdit.hashMidia || '',
        senhaMidia: documentoToEdit.senhaMidia || '',
        pesquisas:
          documentoToEdit.pesquisas && documentoToEdit.pesquisas.length > 0
            ? documentoToEdit.pesquisas
            : [{ tipo: '', identificador: '' }],
      };
    } else {
      return createInitialFormData();
    }
  };

  // -------------------------------------------------------------------------
  // DOCUMENT FORM HOOK
  // -------------------------------------------------------------------------
  const documentForm = useDocumentForm(createInitialData());

  // -------------------------------------------------------------------------
  // SEARCH HANDLERS HOOK
  // -------------------------------------------------------------------------
  const searchHandlers = useSearchHandlers({
    initialFields: [
      'destinatario',
      'enderecamento',
      'autoridade',
      'orgaoJudicial',
    ],
  });

  // -------------------------------------------------------------------------
  // DOCUMENT SECTIONS HOOK
  // -------------------------------------------------------------------------
  const { sectionVisibility } = useDocumentSections({
    tipoDocumento: documentForm.formData.tipoDocumento,
    assunto: documentForm.formData.assunto,
    isEditMode,
    onFieldsClear: clearedFields => {
      documentForm.clearFields(clearedFields);
    },
  });

  // -------------------------------------------------------------------------
  // UTILITY FUNCTIONS
  // -------------------------------------------------------------------------

  // Função helper para mostrar Toast
  const showToastMsg = (
    message: string,
    type: 'success' | 'error' | 'warning' = 'error'
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // -------------------------------------------------------------------------
  // VALIDATION HOOK
  // -------------------------------------------------------------------------
  const { validateForm: validateFormWithHook } = useNovoDocumentoValidation({
    formData: documentForm.formData,
    retificacoes: documentForm.retificacoes,
    sectionVisibility,
    onShowToast: showToastMsg,
  });

  // -------------------------------------------------------------------------
  // DOCUMENT SUBMISSION HOOK
  // -------------------------------------------------------------------------
  const { handleSubmit } = useDocumentSubmission({
    formData: documentForm.formData,
    retificacoes: documentForm.retificacoes,
    validateForm: validateFormWithHook,
    onShowToast: showToastMsg,
    isEditMode,
    documentId: documentoId || undefined,
    demandaId,
    demandaIdFromQuery: demandaIdFromQuery || undefined,
  });

  // -------------------------------------------------------------------------
  // MEMOIZED COMPUTATIONS
  // -------------------------------------------------------------------------

  // Lista de endereçamentos baseada no destinatário atual
  const enderecamentosDisponiveis = useMemo(() => {
    return getEnderecamentos(documentForm.formData.destinatario?.nome || '');
  }, [documentForm.formData.destinatario?.nome]);

  // -------------------------------------------------------------------------
  // EFFECTS
  // -------------------------------------------------------------------------

  // Carregar retificações quando em modo de edição
  useEffect(() => {
    if (isEditMode && documentoToEdit && documentoToEdit.retificacoes) {
      const retificacoesFormatadas = documentoToEdit.retificacoes.map(
        (ret: {
          id: string;
          autoridade: string;
          orgaoJudicial: string;
          dataAssinatura: string;
          retificada: boolean;
        }) => ({
          id: ret.id,
          autoridade: ret.autoridade ? { id: 0, nome: ret.autoridade } : null,
          orgaoJudicial: ret.orgaoJudicial
            ? { id: 0, nome: ret.orgaoJudicial }
            : null,
          dataAssinatura: ret.dataAssinatura,
          retificada: ret.retificada,
        })
      );
      documentForm.setRetificacoes(retificacoesFormatadas);
    }
  }, [isEditMode, documentoToEdit]);

  // Validação: Verificar se a demanda está finalizada
  useEffect(() => {
    const currentDemandaId = demandaId || demandaIdFromQuery;

    if (currentDemandaId && !isEditMode) {
      const demanda = demandas.find(d => d.id === parseInt(currentDemandaId));

      if (demanda?.status === 'Finalizada') {
        setToastMessage(
          'Não é possível criar documentos em demandas finalizadas.'
        );
        setToastType('error');
        setShowToast(true);

        const timeoutId = setTimeout(() => {
          navigate(`/demandas/${currentDemandaId}`);
        }, 2000);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [demandaId, demandaIdFromQuery, isEditMode, demandas, navigate]);

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------

  const handleTipoDocumentoChange = useCallback(
    (value: string) => {
      documentForm.setMultipleFields({
        tipoDocumento: value,
        assunto: '',
        assuntoOutros: '',
        destinatario: null,
        destinatarios: [],
        enderecamento: null,
      });
    },
    [documentForm]
  );

  const handleAssuntoChange = useCallback(
    (value: string) => {
      documentForm.setMultipleFields({
        assunto: value,
        assuntoOutros:
          value === 'Outros' ? '' : documentForm.formData.assuntoOutros,
      });
    },
    [documentForm]
  );

  // Handlers para dropdowns (simplificados)
  const toggleDropdown = useCallback(
    (field: string) => {
      searchHandlers.setDropdownOpen(prev => ({
        ...prev,
        [field]: !prev[field],
      }));
    },
    [searchHandlers]
  );

  const handleTipoDocumentoSelect = useCallback(
    (tipo: string) => {
      handleTipoDocumentoChange(tipo);
      toggleDropdown('tipoDocumento');
    },
    [handleTipoDocumentoChange, toggleDropdown]
  );

  const handleAssuntoSelect = useCallback(
    (assunto: string) => {
      handleAssuntoChange(assunto);
      toggleDropdown('assunto');
    },
    [handleAssuntoChange, toggleDropdown]
  );

  const handleAnoDocumentoSelect = useCallback(
    (ano: string) => {
      documentForm.setField('anoDocumento', ano);
      toggleDropdown('anoDocumento');
    },
    [documentForm.setField, toggleDropdown]
  );

  const handleAnalistaSelect = useCallback(
    (analista: string) => {
      documentForm.setSearchField('analista', analista);
      toggleDropdown('analista');
    },
    [documentForm, toggleDropdown]
  );

  const selectSearchResult = useCallback(
    (field: string, value: string) => {
      documentForm.setSearchField(field, value);
      searchHandlers.setShowResults(prev => ({ ...prev, [field]: false }));

      // Lógica especial para destinatário
      if (field === 'destinatario') {
        const provedorEncontrado = mockProvedores.find(
          provedor => provedor.nomeFantasia === value
        );

        if (provedorEncontrado) {
          if (documentForm.formData.tipoDocumento === 'Ofício Circular') {
            documentForm.setSearchField(
              'enderecamento',
              'Respectivos departamentos jurídicos'
            );
          } else {
            documentForm.setSearchField(
              'enderecamento',
              provedorEncontrado.razaoSocial
            );
          }
        } else {
          if (documentForm.formData.tipoDocumento === 'Ofício Circular') {
            documentForm.setSearchField(
              'enderecamento',
              'Respectivos departamentos jurídicos'
            );
          } else {
            documentForm.setSearchField('enderecamento', '');
          }
        }
      }
    },
    [documentForm, searchHandlers]
  );

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        {/* Header */}
        <DocumentFormHeader
          isEditMode={isEditMode}
          demandaId={demandaId}
          demandaIdFromQuery={demandaIdFromQuery || undefined}
        />

        <div className={styles.formContent}>
          <form
            className={styles.form}
            onSubmit={handleSubmit}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.target instanceof HTMLElement) {
                const tagName = e.target.tagName.toLowerCase();
                const isSubmitButton =
                  e.target.getAttribute('type') === 'submit';

                if (tagName !== 'textarea' && !isSubmitButton) {
                  e.preventDefault();
                }
              }
            }}
          >
            {/* Seção 1 - Informações do Documento */}
            <DocumentTypeSection
              formData={documentForm.formData}
              dropdownOpen={searchHandlers.dropdownOpen}
              selectedIndex={searchHandlers.selectedIndex}
              searchResults={searchHandlers.searchResults}
              showResults={searchHandlers.showResults}
              destinatarios={destinatarios}
              destinatariosOptions={destinatariosOptions}
              enderecamentosDisponiveis={enderecamentosDisponiveis}
              analistas={analistas}
              onInputChange={documentForm.setField}
              onSearchFieldChange={documentForm.setSearchField}
              onSearch={searchHandlers.handleSearch}
              onKeyDown={searchHandlers.handleKeyDown}
              onSelectSearchResult={selectSearchResult}
              onCloseOtherSearchResults={searchHandlers.closeOtherSearchResults}
              toggleDropdown={toggleDropdown}
              handleTipoDocumentoSelect={handleTipoDocumentoSelect}
              handleAssuntoSelect={handleAssuntoSelect}
              handleAnoDocumentoSelect={handleAnoDocumentoSelect}
              handleAnalistaSelect={handleAnalistaSelect}
            />

            {/* TODO: Adicionar outras seções aqui */}

            {/* Footer - Botões de Ação */}
            <footer className={styles.formActions}>
              <button type="submit" className={styles.btnSubmit}>
                {isEditMode ? 'Salvar Alterações' : 'Criar Documento'}
              </button>
            </footer>
          </form>
        </div>
      </div>

      {/* Toast de Validação */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default NovoDocumentoPage;
