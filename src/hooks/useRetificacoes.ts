// src/hooks/useRetificacoes.ts

import { useCallback, useEffect, useState } from 'react';

// Tipos
interface SearchableField {
  id: number;
  nome: string;
}

type AutoridadeField = SearchableField;
type OrgaoField = SearchableField;

export interface RetificacaoItem {
  id: string;
  autoridade: AutoridadeField | null;
  orgaoJudicial: OrgaoField | null;
  dataAssinatura: string;
  retificada: boolean;
}

interface UseRetificacoesProps {
  initialRetificacoes?: RetificacaoItem[];
  isEditMode?: boolean;
  documentoToEdit?: {
    retificacoes?: {
      id: string;
      autoridade: string;
      orgaoJudicial: string;
      dataAssinatura: string;
      retificada: boolean;
    }[];
  } | null;
}

interface UseRetificacoesReturn {
  retificacoes: RetificacaoItem[];
  setRetificacoes: React.Dispatch<React.SetStateAction<RetificacaoItem[]>>;
  addRetificacao: () => void;
  updateRetificacao: (
    id: string,
    field: keyof RetificacaoItem,
    value: string | boolean | AutoridadeField   | null
  ) => void;
  updateRetificacaoSearchField: (
    id: string,
    field: 'autoridade' | 'orgaoJudicial',
    value: string
  ) => void;
  handleRetificacaoCheckboxChange: (retificacaoId: string, checked: boolean) => void;
  handleRetificacaoDateChange: (id: string, value: string) => void;
  handleRetificacaoCalendarChange: (id: string, value: string) => void;
  selectRetificacaoSearchResult: (
    retificacaoId: string,
    field: 'autoridade' | 'orgaoJudicial',
    value: string,
    setShowResults: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void,
    setSelectedIndex: (updater: (prev: Record<string, number>) => Record<string, number>) => void
  ) => void;
}

export const useRetificacoes = ({
  initialRetificacoes = [],
  isEditMode = false,
  documentoToEdit = null,
}: UseRetificacoesProps = {}): UseRetificacoesReturn => {
  const [retificacoes, setRetificacoes] = useState<RetificacaoItem[]>(initialRetificacoes);

  // Carregar retificações quando em modo de edição
  useEffect(() => {
    if (isEditMode && documentoToEdit?.retificacoes) {
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
          orgaoJudicial: ret.orgaoJudicial ? { id: 0, nome: ret.orgaoJudicial } : null,
          dataAssinatura: ret.dataAssinatura,
          retificada: ret.retificada,
        })
      );
      setRetificacoes(retificacoesFormatadas);
    }
  }, [isEditMode, documentoToEdit]);

  // Adicionar nova retificação
  const addRetificacao = useCallback(() => {
    const newRetificacao: RetificacaoItem = {
      id: Date.now().toString(),
      autoridade: null,
      orgaoJudicial: null,
      dataAssinatura: '',
      retificada: false,
    };
    setRetificacoes(prev => [...prev, newRetificacao]);
  }, []);

  // Atualizar retificação
  const updateRetificacao = useCallback(
    (
      id: string,
      field: keyof RetificacaoItem,
      value: string | boolean | AutoridadeField   | null
    ) => {
      setRetificacoes(prev =>
        prev.map(ret => (ret.id === id ? { ...ret, [field]: value } : ret))
      );
    },
    []
  );

  // Atualizar campo de busca de retificação
  const updateRetificacaoSearchField = useCallback(
    (id: string, field: 'autoridade' | 'orgaoJudicial', value: string) => {
      const objectValue = value.trim() ? { id: 0, nome: value } : null;
      updateRetificacao(id, field, objectValue);
    },
    [updateRetificacao]
  );

  // Handler para checkbox de retificação em cadeia
  const handleRetificacaoCheckboxChange = useCallback(
    (retificacaoId: string, checked: boolean) => {
      updateRetificacao(retificacaoId, 'retificada', checked);

      if (checked) {
        // Adiciona nova retificação após esta
        addRetificacao();
      } else {
        // Remove todas as retificações posteriores a esta
        const currentIndex = retificacoes.findIndex(ret => ret.id === retificacaoId);
        if (currentIndex !== -1) {
          setRetificacoes(prev => prev.slice(0, currentIndex + 1));
        }
      }
    },
    [addRetificacao, retificacoes, updateRetificacao]
  );

  // Função para formatar data com máscara DD/MM/YYYY
  const formatDateMask = useCallback((value: string): string => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');

    // Aplica a máscara progressivamente
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  }, []);

  // Handler para mudança de data das retificações
  const handleRetificacaoDateChange = useCallback(
    (id: string, value: string) => {
      const formatted = formatDateMask(value);
      updateRetificacao(id, 'dataAssinatura', formatted);
    },
    [formatDateMask, updateRetificacao]
  );

  // Função para converter data YYYY-MM-DD para DD/MM/YYYY
  const convertFromHTMLDate = useCallback((dateStr: string): string => {
    if (!dateStr) {return '';}

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return '';
  }, []);

  // Handler para mudança de data das retificações via calendário
  const handleRetificacaoCalendarChange = useCallback(
    (id: string, value: string) => {
      const formatted = convertFromHTMLDate(value);
      updateRetificacao(id, 'dataAssinatura', formatted);
    },
    [convertFromHTMLDate, updateRetificacao]
  );

  // Função para seleção de resultados nas retificações
  const selectRetificacaoSearchResult = useCallback(
    (
      retificacaoId: string,
      field: 'autoridade' | 'orgaoJudicial',
      value: string,
      setShowResults: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void,
      setSelectedIndex: (updater: (prev: Record<string, number>) => Record<string, number>) => void
    ) => {
      updateRetificacaoSearchField(retificacaoId, field, value);
      const fieldKey = `ret-${field === 'autoridade' ? 'autoridade' : 'orgao'}-${retificacaoId}`;
      setShowResults(prev => ({ ...prev, [fieldKey]: false }));
      setSelectedIndex(prev => ({ ...prev, [fieldKey]: -1 }));

      // Retornar foco ao campo após seleção
      setTimeout(() => {
        const input = document.querySelector(
          `[data-field="${fieldKey}"] input`
        )!;
        if (input) {
          input.focus();
        }
      }, 0);
    },
    [updateRetificacaoSearchField]
  );

  return {
    retificacoes,
    setRetificacoes,
    addRetificacao,
    updateRetificacao,
    updateRetificacaoSearchField,
    handleRetificacaoCheckboxChange,
    handleRetificacaoDateChange,
    handleRetificacaoCalendarChange,
    selectRetificacaoSearchResult,
  };
};