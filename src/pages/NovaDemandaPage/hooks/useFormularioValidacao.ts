// src/pages/NovaDemandaPage/hooks/useFormularioValidacao.ts
import { useCallback } from 'react';
import type { Option } from '../../../components/forms/SearchableSelect';

interface FormDataState {
  tipoDemanda: Option | null;
  solicitante: Option | null;
  dataInicial: string;
  descricao: string;
  sged: string;
  alvos: string;
  identificadores: string;
  analista: Option | null;
  distribuidor: Option | null;
}

export const useFormularioValidacao = (
  setToastMessage: (message: string) => void,
  setToastType: (type: 'error' | 'success' | 'warning') => void,
  setShowToast: (show: boolean) => void
) => {
  const isDateValid = useCallback((dateString: string): boolean => {
    if (!dateString || dateString.length < 10) return true;

    try {
      const [day, month, year] = dateString.split('/');
      const inputDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      return inputDate <= today;
    } catch {
      return false;
    }
  }, []);

  const validateForm = useCallback((formData: FormDataState): boolean => {
    // Validar regras de negócio primeiro
    if (formData.dataInicial.trim() && !isDateValid(formData.dataInicial)) {
      setToastMessage('Data inicial não pode ser posterior à data atual.');
      setToastType('error');
      setShowToast(true);
      return false;
    }

    // Validações de preenchimento obrigatório
    const validations = [
      {
        condition: !formData.tipoDemanda,
        message: 'Por favor, selecione o Tipo de Demanda.',
        focus: '[data-dropdown="tipoDemanda"]'
      },
      {
        condition: !formData.solicitante?.nome?.trim(),
        message: 'Por favor, selecione o Solicitante.',
        focus: null
      },
      {
        condition: !formData.dataInicial.trim(),
        message: 'Por favor, preencha a Data Inicial.',
        focus: null
      },
      {
        condition: !formData.descricao.trim(),
        message: 'Por favor, preencha a Descrição.',
        focus: null
      },
      {
        condition: !formData.sged.trim(),
        message: 'Por favor, preencha o SGED.',
        focus: null
      },
      {
        condition: !formData.alvos.trim(),
        message: 'Por favor, preencha o número de Alvos.',
        focus: null
      },
      {
        condition: !formData.identificadores.trim(),
        message: 'Por favor, preencha o número de Identificadores.',
        focus: null
      },
      {
        condition: !formData.analista,
        message: 'Por favor, selecione o Analista.',
        focus: '[data-dropdown="analista"]'
      },
      {
        condition: !formData.distribuidor,
        message: 'Por favor, selecione o Distribuidor.',
        focus: '[data-dropdown="distribuidor"]'
      }
    ];

    for (const validation of validations) {
      if (validation.condition) {
        setToastMessage(validation.message);
        setToastType('warning');
        setShowToast(true);
        
        if (validation.focus) {
          const trigger = document.querySelector(validation.focus) as HTMLElement;
          trigger?.focus();
        }
        
        return false;
      }
    }

    return true;
  }, [isDateValid, setToastMessage, setToastType, setShowToast]);

  return { validateForm, isDateValid };
};