/**
 * Hook para gerenciamento de seções de documentos
 *
 * @description
 * Controla a exibição e navegação entre seções de documentos:
 * - Alternância entre seções (informações, pesquisas, anexos)
 * - Estado de seção ativa
 * - Navegação sequencial entre seções
 * - Validação antes de trocar de seção
 * - Configuração de visibilidade baseada em regras
 *
 * @example
 * const sections = useDocumentSections(
 *   formData,
 *   errors,
 *   setErrors
 * );
 *
 * // Navegar para seção
 * sections.goToSection('pesquisas');
 *
 * // Verificar visibilidade
 * if (sections.sectionVisibility.pesquisas) {
 *   // Mostrar seção de pesquisas
 * }
 *
 * @module hooks/useDocumentSections
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type SectionVisibility, secaoConfiguracoes } from '../data/documentoRegras';

// Tipos
interface PesquisaItem {
  tipo: string;
  identificador: string;
  complementar?: string;
}

interface FormDataFields {
  tipoDocumento: string;
  assunto: string;
  autoridade: { id: number; nome: string } | null;
  orgaoJudicial: { id: number; nome: string } | null;
  dataAssinatura: string;
  retificada: boolean;
  tipoMidia: string;
  tamanhoMidia: string;
  hashMidia: string;
  senhaMidia: string;
  pesquisas: PesquisaItem[];
}

interface UseDocumentSectionsProps {
  tipoDocumento: string;
  assunto: string;
  isEditMode?: boolean;
  onFieldsClear?: (clearedFields: Partial<FormDataFields>) => void;
}

interface UseDocumentSectionsReturn {
  sectionVisibility: SectionVisibility;
  setSectionVisibility: React.Dispatch<React.SetStateAction<SectionVisibility>>;
  configKey: string | null;
  clearHiddenSectionFields: (visibility: SectionVisibility) => Partial<FormDataFields>;
  shouldShowSection: (section: keyof SectionVisibility) => boolean;
  isSectionRequired: (section: keyof SectionVisibility) => boolean;
}

export const useDocumentSections = ({
  tipoDocumento,
  assunto,
  isEditMode = false,
  onFieldsClear,
}: UseDocumentSectionsProps): UseDocumentSectionsReturn => {
  // Estado de visibilidade das seções
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>({
    section2: false,
    section3: false,
    section4: false,
  });

  // Usar useRef para manter a referência mais recente de onFieldsClear
  const onFieldsClearRef = useRef(onFieldsClear);
  onFieldsClearRef.current = onFieldsClear;

  // Função estável para chamar onFieldsClear
  const stableOnFieldsClear = useCallback((clearedFields: Partial<FormDataFields>) => {
    if (onFieldsClearRef.current) {
      onFieldsClearRef.current(clearedFields);
    }
  }, []);

  // Calcular chave de configuração baseado no tipo de documento e assunto
  const configKey = useMemo(() => {
    if (tipoDocumento === 'Mídia') {
      return 'Mídia|SEM_ASSUNTO';
    }

    if (tipoDocumento && assunto) {
      return `${tipoDocumento}|${assunto}`;
    }

    return null;
  }, [tipoDocumento, assunto]);

  // Função para limpar campos de seções ocultas
  const clearHiddenSectionFields = useCallback(
    (visibility: SectionVisibility): Partial<FormDataFields> => {
      const clearedFields: Partial<FormDataFields> = {};

      // Se seção 2 está oculta, limpar seus campos
      if (!visibility.section2) {
        clearedFields.autoridade = null;
        clearedFields.orgaoJudicial = null;
        clearedFields.dataAssinatura = '';
        clearedFields.retificada = false;
      }

      // Se seção 3 está oculta, limpar seus campos
      if (!visibility.section3) {
        clearedFields.tipoMidia = '';
        clearedFields.tamanhoMidia = '';
        clearedFields.hashMidia = '';
        clearedFields.senhaMidia = '';
      }

      // Se seção 4 está oculta, limpar seus campos
      if (!visibility.section4) {
        clearedFields.pesquisas = [{ tipo: '', identificador: '' }];
      }

      return clearedFields;
    },
    []
  );

  // Verificar se uma seção deve ser mostrada
  const shouldShowSection = useCallback(
    (section: keyof SectionVisibility): boolean => {
      return sectionVisibility[section] || false;
    },
    [sectionVisibility]
  );

  // Verificar se uma seção é obrigatória (quando visível)
  const isSectionRequired = useCallback(
    (section: keyof SectionVisibility): boolean => {
      // Em modo de edição, as seções não são obrigatórias para permitir edição parcial
      if (isEditMode) {
        return false;
      }

      // Se a seção está visível, ela é obrigatória
      return sectionVisibility[section] || false;
    },
    [sectionVisibility, isEditMode]
  );

  // Atualizar visibilidade das seções quando configKey muda
  useEffect(() => {
    if (!configKey) {
      const defaultSectionState: SectionVisibility = {
        section2: false,
        section3: false,
        section4: false,
      };
      setSectionVisibility(defaultSectionState);

      // Notificar sobre campos que devem ser limpos
      const clearedFields = clearHiddenSectionFields(defaultSectionState);
      stableOnFieldsClear(clearedFields);
      return;
    }

    const newVisibilityConfig = secaoConfiguracoes[configKey] || {
      section2: false,
      section3: false,
      section4: false,
    };

    setSectionVisibility(newVisibilityConfig);

    // Limpar campos das seções que estão ocultas na nova configuração
    // apenas se não estiver em modo de edição
    if (!isEditMode) {
      const clearedFields = clearHiddenSectionFields(newVisibilityConfig);
      stableOnFieldsClear(clearedFields);
    }
  }, [configKey, isEditMode, clearHiddenSectionFields, stableOnFieldsClear]);

  return {
    sectionVisibility,
    setSectionVisibility,
    configKey,
    clearHiddenSectionFields,
    shouldShowSection,
    isSectionRequired,
  };
};
