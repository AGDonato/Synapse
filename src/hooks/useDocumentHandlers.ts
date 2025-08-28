// src/hooks/useDocumentHandlers.ts
/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */

import { type Dispatch, type SetStateAction, useCallback } from 'react';
import type { MultiSelectOption } from '../components/forms/MultiSelectDropdown';
import { mockProvedores } from '../data/mockProvedores';

// Tipos
interface SearchableField {
  id: number;
  nome: string;
}

interface DestinatarioField extends SearchableField {
  razaoSocial?: string;
}

type EnderecamentoField = SearchableField;
type AnalistaField = SearchableField;

interface PesquisaItem {
  tipo: string;
  identificador: string;
  complementar?: string;
}

interface FormData {
  tipoDocumento: string;
  assunto: string;
  assuntoOutros: string;
  destinatario: DestinatarioField | null;
  destinatarios: MultiSelectOption[];
  enderecamento: EnderecamentoField | null;
  numeroDocumento: string;
  anoDocumento: string;
  analista: AnalistaField | null;
  autoridade: SearchableField | null;
  orgaoJudicial: SearchableField | null;
  dataAssinatura: string;
  retificada: boolean;
  tipoMidia: string;
  tamanhoMidia: string;
  hashMidia: string;
  senhaMidia: string;
  pesquisas: PesquisaItem[];
}

type DropdownState = Record<string, boolean>;

type SelectedIndexState = Record<string, number>;

type ToastType = 'error' | 'success' | 'warning';

interface UseDocumentHandlersProps {
  formData: FormData;
  setFormData: Dispatch<SetStateAction<FormData>>;
  dropdownOpen: DropdownState;
  setDropdownOpen: Dispatch<SetStateAction<DropdownState>>;
  selectedIndex: SelectedIndexState;
  setSelectedIndex: Dispatch<SetStateAction<SelectedIndexState>>;
  setShowResults: Dispatch<SetStateAction<Record<string, boolean>>>;
  onShowToast: (message: string, type: ToastType) => void;
}

export const useDocumentHandlers = ({
  formData,
  setFormData,
  dropdownOpen,
  setDropdownOpen,
  setSelectedIndex,
  setShowResults,
  onShowToast,
}: UseDocumentHandlersProps) => {
  // Handler genérico para mudanças de input
  const handleInputChange = useCallback(
    (field: keyof FormData, value: string | number | boolean | MultiSelectOption[]) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        // Para Ofício Circular, definir endereçamento fixo quando destinatários mudarem
        ...(field === 'destinatarios' && prev.tipoDocumento === 'Ofício Circular'
          ? {
              enderecamento: {
                id: 0,
                nome: 'Respectivos departamentos jurídicos',
              },
            }
          : {}),
      }));
    },
    [setFormData]
  );

  // Handler para campos de busca que usam objetos
  const handleSearchFieldChange = useCallback(
    (
      field: 'destinatario' | 'enderecamento' | 'analista' | 'autoridade' | 'orgaoJudicial',
      value: string
    ) => {
      setFormData(prev => ({
        ...prev,
        [field]: value.trim() ? { id: 0, nome: value } : null,
      }));
    },
    [setFormData]
  );

  // Handler para mudança de tipo de documento
  const handleTipoDocumentoChange = useCallback(
    (value: string) => {
      setFormData(prev => ({
        ...prev,
        tipoDocumento: value,
        assunto: '',
        assuntoOutros: '',
        // Limpar campos de destinatário ao mudar tipo
        destinatario: null,
        destinatarios: [],
        enderecamento: null,
      }));
    },
    [setFormData]
  );

  // Handler para mudança de assunto
  const handleAssuntoChange = useCallback(
    (value: string) => {
      setFormData(prev => ({
        ...prev,
        assunto: value,
        assuntoOutros: value === 'Outros' ? prev.assuntoOutros : '',
        // Auto-preencher endereçamento para Ofício Circular
        enderecamento:
          prev.tipoDocumento === 'Ofício Circular'
            ? { id: 0, nome: 'Respectivos departamentos jurídicos' }
            : prev.enderecamento,
      }));
    },
    [setFormData]
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

  // Handler para mudança de data com máscara
  const handleDateChange = useCallback(
    (field: 'dataAssinatura', value: string) => {
      const formatted = formatDateMask(value);
      handleInputChange(field, formatted);
    },
    [formatDateMask, handleInputChange]
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

  // Handler para mudança de data via calendário
  const handleCalendarChange = useCallback(
    (field: 'dataAssinatura', value: string) => {
      const formatted = convertFromHTMLDate(value);
      handleInputChange(field, formatted);
    },
    [convertFromHTMLDate, handleInputChange]
  );

  // Handler para tamanho da mídia
  const handleTamanhoMidiaChange = useCallback(
    (inputValue: string) => {
      // Remove espaços em branco
      let cleanValue = inputValue.trim();

      // Se estiver vazio, define como string vazia
      if (!cleanValue) {
        handleInputChange('tamanhoMidia', '');
        return;
      }

      // Remove caracteres não numéricos, exceto vírgula e ponto
      cleanValue = cleanValue.replace(/[^\d.,]/g, '');

      let formattedValue: string;

      // Se contém vírgula, é formato brasileiro ou misto
      if (cleanValue.includes(',')) {
        const parts = cleanValue.split(',');

        if (parts.length === 2) {
          // Formato brasileiro: parte inteira + vírgula + decimal
          let integerPart = parts[0].replace(/\./g, ''); // Remove pontos
          const decimalPart = parts[1].substring(0, 2); // Máximo 2 casas decimais

          // Adiciona separadores de milhares na parte inteira
          if (integerPart.length > 3) {
            integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          }

          formattedValue = `${integerPart},${decimalPart}`;
        } else {
          // Múltiplas vírgulas, pega apenas a primeira parte
          let integerPart = parts[0].replace(/\./g, '');
          if (integerPart.length > 3) {
            integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          }
          formattedValue = integerPart;
        }
      } else {
        // Se não há vírgula, pode ser número inteiro ou formato americano
        if (cleanValue.includes('.') && cleanValue.split('.').length === 2) {
          const parts = cleanValue.split('.');
          const lastPart = parts[parts.length - 1];

          // Se a última parte tem 1-2 dígitos, trata como decimal
          if (lastPart.length <= 2) {
            const allButLast = parts.slice(0, -1).join('');
            let integerPart = allButLast;

            if (integerPart.length > 3) {
              integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            }

            formattedValue = `${integerPart},${lastPart}`;
          } else {
            // Trata como separadores de milhares
            let integerPart = cleanValue.replace(/\./g, '');
            if (integerPart.length > 3) {
              integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            }
            formattedValue = integerPart;
          }
        } else {
          // Número sem ponto, adiciona separadores de milhares
          if (cleanValue.length > 3) {
            formattedValue = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          } else {
            formattedValue = cleanValue;
          }
        }
      }

      // Atualiza o estado com o valor formatado em padrão brasileiro
      handleInputChange('tamanhoMidia', formattedValue);
    },
    [handleInputChange]
  );

  // Handler para paste múltiplo em pesquisas
  const handlePasteMultipleValues = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text');
      if (!pastedData) {return;}

      // Divide os valores por quebra de linha, vírgula ou ponto e vírgula
      const values = pastedData
        .split(/[\n,;]+/)
        .map(v => v.trim())
        .filter(Boolean);
      if (values.length === 0) {return;}

      // Pega o tipo de pesquisa da linha atual
      const currentTipoPesquisa = formData.pesquisas[index].tipo;

      // Cria um array com as pesquisas existentes
      const updatedPesquisas = [...formData.pesquisas];

      // Para cada valor, atualiza ou cria nova linha
      values.forEach((value, valueIndex) => {
        if (valueIndex === 0) {
          // Primeiro valor vai na linha atual
          updatedPesquisas[index] = {
            ...updatedPesquisas[index],
            identificador: value,
            tipo: currentTipoPesquisa || updatedPesquisas[index].tipo,
          };
        } else {
          // Outros valores criam novas linhas
          const targetIndex = index + valueIndex;
          if (targetIndex < updatedPesquisas.length) {
            // Se já existe uma linha, atualiza
            updatedPesquisas[targetIndex] = {
              ...updatedPesquisas[targetIndex],
              identificador: value,
              tipo: currentTipoPesquisa,
            };
          } else {
            // Se não existe, cria nova linha
            updatedPesquisas.push({
              tipo: currentTipoPesquisa,
              identificador: value,
            });
          }
        }
      });

      setFormData(prev => ({ ...prev, pesquisas: updatedPesquisas }));

      // Exibe notificação de sucesso
      onShowToast(`${values.length} itens foram distribuídos com sucesso!`, 'success');
    },
    [formData.pesquisas, setFormData, onShowToast]
  );

  // Handler para toggle de dropdown
  const toggleDropdown = useCallback(
    (field: string) => {
      const isCurrentlyOpen = dropdownOpen[field];

      // Fechar todas as listas de busca quando abrir dropdown
      setShowResults({
        destinatario: false,
        enderecamento: false,
        autoridade: false,
        orgaoJudicial: false,
      });
      setSelectedIndex(prev => {
        const newState = { ...prev };
        // Limpar índices de busca
        Object.keys(newState).forEach(key => {
          if (
            key === 'destinatario' ||
            key === 'enderecamento' ||
            key === 'autoridade' ||
            key === 'orgaoJudicial' ||
            key.startsWith('ret-')
          ) {
            delete newState[key];
          }
        });
        return newState;
      });

      // Fechar outros dropdowns e abrir/fechar o atual
      setDropdownOpen(prev => {
        const newState = {
          analista: false,
          tipoMidia: false,
          tipoDocumento: false,
          assunto: false,
          anoDocumento: false,
        };

        // Manter outros campos de pesquisa fechados
        Object.keys(prev).forEach(key => {
          if (key.startsWith('tipoPesquisa_')) {
            (newState as Record<string, boolean>)[key] = false;
          }
        });

        // Alternar o campo atual
        (newState as Record<string, boolean>)[field] = !isCurrentlyOpen;

        return newState;
      });

      // Se está abrindo, resetar índice
      if (!isCurrentlyOpen) {
        setSelectedIndex(prevIndex => ({
          ...prevIndex,
          [field]: -1,
        }));
      }
    },
    [dropdownOpen, setDropdownOpen, setSelectedIndex, setShowResults]
  );

  // Handler para seleção em dropdown customizado
  const handleDropdownSelect = useCallback(
    (field: string, value: string, focusSelector?: string) => {
      if (field === 'analista') {
        handleSearchFieldChange('analista', value);
      } else if (field === 'tipoMidia') {
        setFormData(prev => ({ ...prev, tipoMidia: value }));
      } else if (field === 'tipoDocumento') {
        handleTipoDocumentoChange(value);
      } else if (field === 'assunto') {
        handleAssuntoChange(value);
      } else if (field === 'anoDocumento') {
        handleInputChange('anoDocumento', value);
      }

      setDropdownOpen(prev => ({ ...prev, [field]: false }));
      setSelectedIndex(prev => ({ ...prev, [field]: -1 }));

      // Retornar foco para o trigger
      if (focusSelector) {
        setTimeout(() => {
          const trigger = document.querySelector(focusSelector) as HTMLElement;
          trigger?.focus();
        }, 0);
      }
    },
    [
      handleSearchFieldChange,
      setFormData,
      handleTipoDocumentoChange,
      handleAssuntoChange,
      handleInputChange,
      setDropdownOpen,
      setSelectedIndex,
    ]
  );

  // Handler para seleção de resultado de busca
  const selectSearchResult = useCallback(
    (field: 'destinatario' | 'enderecamento' | 'autoridade' | 'orgaoJudicial', value: string) => {
      handleSearchFieldChange(field, value);
      setShowResults(prev => ({ ...prev, [field]: false }));
      setSelectedIndex(prev => ({ ...prev, [field]: -1 }));

      // Retornar foco ao campo após seleção
      setTimeout(() => {
        const input = document.querySelector(`[data-field="${field}"] input`) as HTMLInputElement;
        input?.focus();
      }, 0);

      // Se selecionou um destinatário, verifica se é um provedor para autocompletar o endereçamento
      if (field === 'destinatario') {
        // Busca o provedor correspondente pelo nomeFantasia
        const provedorEncontrado = mockProvedores.find(
          provedor => provedor.nomeFantasia === value
        );

        if (provedorEncontrado) {
          // Para Ofício Circular, sempre usar endereçamento fixo
          if (formData.tipoDocumento === 'Ofício Circular') {
            handleSearchFieldChange('enderecamento', 'Respectivos departamentos jurídicos');
          } else {
            // Se encontrou o provedor, preenche o endereçamento com a razaoSocial
            handleSearchFieldChange('enderecamento', provedorEncontrado.razaoSocial);
          }
        } else {
          // Para Ofício Circular, sempre usar endereçamento fixo
          if (formData.tipoDocumento === 'Ofício Circular') {
            handleSearchFieldChange('enderecamento', 'Respectivos departamentos jurídicos');
          } else {
            // Se não é um provedor (é uma autoridade), não preenche o endereçamento
            handleSearchFieldChange('enderecamento', '');
          }
        }
      }
    },
    [formData.tipoDocumento, handleSearchFieldChange, setSelectedIndex, setShowResults]
  );

  // Função para scroll automático em dropdowns customizados
  const scrollToDropdownItem = useCallback((dropdownKey: string, index: number) => {
    setTimeout(() => {
      const trigger = document.querySelector(`[data-dropdown="${dropdownKey}"]`);

      if (trigger) {
        const dropdown = trigger.parentElement?.querySelector('[class*="multiSelectDropdown"]');

        if (dropdown) {
          const items = dropdown.querySelectorAll('[class*="checkboxLabel"]');
          const focusedItem = items[index] as HTMLElement;

          if (focusedItem) {
            focusedItem.scrollIntoView({
              block: 'nearest',
              behavior: 'smooth',
            });
          }
        }
      }
    }, 0);
  }, []);

  // Função para converter data DD/MM/YYYY para YYYY-MM-DD (formato HTML date)
  const convertToHTMLDate = useCallback((dateStr: string): string => {
    if (!dateStr || dateStr.length < 10) {return '';}

    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  }, []);

  // Função para formatar o tamanho da mídia no padrão brasileiro
  const formatTamanhoMidia = useCallback((value: string): string => {
    return value; // Retorna direto já que mantemos formato brasileiro
  }, []);

  return {
    // Handlers principais
    handleInputChange,
    handleSearchFieldChange,
    handleTipoDocumentoChange,
    handleAssuntoChange,
    handleDateChange,
    handleCalendarChange,
    handleTamanhoMidiaChange,
    handlePasteMultipleValues,
    toggleDropdown,
    handleDropdownSelect,
    selectSearchResult,
    scrollToDropdownItem,

    // Funções auxiliares
    convertToHTMLDate,
    convertFromHTMLDate,
    formatTamanhoMidia,
    formatDateMask,
  };
};