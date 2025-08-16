import type { Demanda } from '../../../types/entities';
import type { DemandModalType, TempDemandStates } from './types';

// Função para determinar o tipo de modal baseado no contexto da demanda
export const getModalType = (
  demanda: Demanda | null,
  context?: string
): DemandModalType => {
  if (!demanda) return 'default';

  // Se tem contexto específico, usar ele
  if (context) {
    if (context === 'reopen') return 'reopen_demand';
    if (context === 'final_date') return 'final_date';
    if (context === 'status') return 'status_update';
  }

  // Sempre usar o modal combinado que permite tanto finalizar quanto reabrir
  return 'final_date';
};

// Função para converter data do formato brasileiro (DD/MM/YYYY) para ISO (YYYY-MM-DD)
export const convertToHTMLDate = (brazilianDate: string): string => {
  if (!brazilianDate || brazilianDate.length !== 10) return '';
  const [day, month, year] = brazilianDate.split('/');
  if (!day || !month || !year) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Função para converter data do formato ISO (YYYY-MM-DD) para brasileiro (DD/MM/YYYY)
export const convertToBrazilianDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
};

// Função para formatar data para exibição
export const formatDateForDisplay = (date: string): string => {
  if (!date) return '';
  // Se já está no formato brasileiro, retorna como está
  if (date.includes('/')) return date;
  // Se está no formato ISO, converte
  return convertToBrazilianDate(date);
};

// Função para aplicar máscara de data (DD/MM/YYYY)
export const formatDateMask = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }
};

// Função para inicializar estados temporários com base na demanda
export const initializeTempStates = (
  demanda: Demanda | null
): TempDemandStates => {
  // Se a demanda já tem dataReabertura, inicializa com checkbox marcado
  const isAlreadyReopened = !!demanda?.dataReabertura;

  return {
    dataFinal: demanda?.dataFinal || '',
    dataFinalFormatted: formatDateForDisplay(demanda?.dataFinal || ''),
    isReaberto: isAlreadyReopened, // Marca checkbox se já foi reaberta
    dataReabertura: demanda?.dataReabertura || '',
    dataReaberturaFormatted: formatDateForDisplay(
      demanda?.dataReabertura || ''
    ),
    novaDataFinal: demanda?.novaDataFinal || '',
    novaDataFinalFormatted: formatDateForDisplay(demanda?.novaDataFinal || ''),
    status: demanda?.status || 'Em Andamento',
    observacoes: '',
  };
};

// Função para verificar se há mudanças nos estados
export const hasChanges = (
  tempStates: TempDemandStates,
  initialStates: TempDemandStates,
  modalType: DemandModalType
): boolean => {
  switch (modalType) {
    case 'final_date':
      // Verifica mudanças em qualquer campo relevante
      return (
        tempStates.dataFinalFormatted !== initialStates.dataFinalFormatted ||
        tempStates.isReaberto !== initialStates.isReaberto ||
        tempStates.dataReaberturaFormatted !==
          initialStates.dataReaberturaFormatted ||
        tempStates.novaDataFinalFormatted !==
          initialStates.novaDataFinalFormatted
      );

    case 'reopen_demand':
      // Se já tem dataReabertura (já foi reaberta), compara nova data final formatada
      // Senão, compara os campos de reabertura
      if (initialStates.dataReabertura) {
        return (
          tempStates.novaDataFinalFormatted !==
          initialStates.novaDataFinalFormatted
        );
      }
      return (
        tempStates.isReaberto !== initialStates.isReaberto ||
        tempStates.dataReaberturaFormatted !==
          initialStates.dataReaberturaFormatted ||
        tempStates.novaDataFinalFormatted !==
          initialStates.novaDataFinalFormatted
      );

    case 'status_update':
      return tempStates.status !== initialStates.status;

    default:
      return (
        tempStates.dataFinal !== initialStates.dataFinal ||
        tempStates.isReaberto !== initialStates.isReaberto ||
        tempStates.dataReabertura !== initialStates.dataReabertura ||
        tempStates.novaDataFinal !== initialStates.novaDataFinal ||
        tempStates.status !== initialStates.status ||
        tempStates.observacoes !== initialStates.observacoes
      );
  }
};

// Função para validar datas
export const validateDate = (
  dateStr: string,
  demanda: Demanda,
  dateType: 'final' | 'reabertura' | 'nova_final' = 'final',
  tempStates?: TempDemandStates
): { isValid: boolean; error?: string } => {
  console.log('validateDate chamado:', {
    dateStr,
    dateType,
    demandaDataFinal: demanda?.dataFinal,
  });

  if (!dateStr || !demanda?.dataInicial) {
    return { isValid: true };
  }

  try {
    const parseDate = (date: string) => {
      if (date.includes('/')) {
        const [day, month, year] = date.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (date.includes('-')) {
        const parts = date.split('-');
        if (parts[0].length === 4) {
          // Para formato ISO (YYYY-MM-DD), usar new Date() com parâmetros separados
          // para evitar problemas de fuso horário
          const [year, month, day] = parts;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          const [day, month, year] = parts;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
      return null;
    };

    const targetDate = parseDate(dateStr);
    const initialDate = parseDate(demanda.dataInicial);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (!targetDate || !initialDate) {
      return { isValid: true };
    }

    // Normalizar datas para comparação (zerar horas)
    const targetDateNormalized = new Date(targetDate);
    targetDateNormalized.setHours(0, 0, 0, 0);

    // Validação específica por tipo
    switch (dateType) {
      case 'final':
        // Data final não pode ser anterior à data inicial
        if (targetDate < initialDate) {
          return {
            isValid: false,
            error: 'Data final não pode ser anterior à data inicial.',
          };
        }
        // Data final não pode ser no futuro
        if (targetDateNormalized > currentDate) {
          return {
            isValid: false,
            error: 'Data final não pode ser posterior à data atual.',
          };
        }
        break;

      case 'reabertura':
        // Data de reabertura não pode ser no futuro
        if (targetDateNormalized > currentDate) {
          return {
            isValid: false,
            error: 'Data de reabertura não pode ser posterior à data atual.',
          };
        }
        // Data de reabertura deve ser >= data final original (pode ser igual)
        if (demanda.dataFinal) {
          // Usar dataFinalFormatted dos tempStates se disponível, senão usar demanda.dataFinal
          const finalDateStr =
            tempStates?.dataFinalFormatted || demanda.dataFinal;
          const finalDate = parseDate(finalDateStr);

          if (finalDate && targetDate) {
            // Normalizar ambas as datas para comparação
            const finalDateNormalized = new Date(finalDate);
            finalDateNormalized.setHours(0, 0, 0, 0);

            const targetDateForComparison = new Date(targetDate);
            targetDateForComparison.setHours(0, 0, 0, 0);

            console.log('Validando data de reabertura:', {
              dataReabertura: dateStr,
              dataFinalOriginal: demanda.dataFinal,
              dataFinalFormatted: tempStates?.dataFinalFormatted,
              finalDateUsed: finalDateStr,
              targetDateNormalized: targetDateForComparison,
              finalDateNormalized: finalDateNormalized,
              isTargetBeforeFinal:
                targetDateForComparison < finalDateNormalized,
              isEqual:
                targetDateForComparison.getTime() ===
                finalDateNormalized.getTime(),
            });

            // Verifica se data de reabertura é anterior à data final
            if (targetDateForComparison < finalDateNormalized) {
              return {
                isValid: false,
                error: 'Data de reabertura não pode ser anterior à data final.',
              };
            }
          }
        }
        break;

      case 'nova_final': {
        // Nova data final não pode ser no futuro
        if (targetDateNormalized > currentDate) {
          return {
            isValid: false,
            error: 'Nova data final não pode ser posterior à data atual.',
          };
        }
        // Nova data final deve ser >= data de reabertura (pode ser igual)
        // Precisa usar tempStates.dataReabertura ao invés de demanda.dataReabertura
        // pois estamos validando com base no que está sendo digitado agora
        const reaberturaStr =
          tempStates?.dataReabertura || demanda.dataReabertura || '';
        const reaberturaTemp = parseDate(reaberturaStr);
        if (reaberturaTemp && targetDate && targetDate < reaberturaTemp) {
          return {
            isValid: false,
            error:
              'A nova data final não pode ser anterior à data de reabertura.',
          };
        }
        break;
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating date:', error);
    return { isValid: true }; // Em caso de erro, permite a operação
  }
};

// Função para preparar dados de atualização
export const prepareUpdateData = (
  tempStates: TempDemandStates,
  modalType: DemandModalType,
  demanda: Demanda
): { data: Partial<Demanda> | null; error: string | null } => {
  const updateData: Partial<Demanda> = {};

  console.log('prepareUpdateData chamado:', {
    modalType,
    isReaberto: tempStates.isReaberto,
    dataReabertura: tempStates.dataReabertura,
    dataFinal: demanda.dataFinal,
  });

  switch (modalType) {
    case 'final_date':
      // Se checkbox reaberto estiver marcado, processa reabertura
      if (tempStates.isReaberto) {
        // Validar data de reabertura
        if (!tempStates.dataReabertura) {
          return {
            data: null,
            error:
              'Data de reabertura é obrigatória quando marcado como reaberto.',
          };
        }

        console.log('Validando data de reabertura em prepareUpdateData...');
        const reaberturaValidation = validateDate(
          tempStates.dataReabertura,
          demanda,
          'reabertura',
          tempStates
        );
        console.log('Resultado da validação:', reaberturaValidation);

        if (!reaberturaValidation.isValid) {
          return {
            data: null,
            error: reaberturaValidation.error || 'Data de reabertura inválida',
          };
        }

        // Validar nova data final se foi preenchida
        if (tempStates.novaDataFinal) {
          const novaFinalValidation = validateDate(
            tempStates.novaDataFinal,
            demanda,
            'nova_final',
            tempStates
          );
          if (!novaFinalValidation.isValid) {
            return {
              data: null,
              error: novaFinalValidation.error || 'Nova data final inválida',
            };
          }
        }

        updateData.dataReabertura =
          convertToBrazilianDate(tempStates.dataReabertura) ||
          tempStates.dataReabertura;
        updateData.novaDataFinal = tempStates.novaDataFinal
          ? convertToBrazilianDate(tempStates.novaDataFinal) ||
            tempStates.novaDataFinal
          : '';
        updateData.status = tempStates.novaDataFinal
          ? ('Finalizada' as const)
          : ('Em Andamento' as const);
      }
      // Se desmarcou o checkbox (não está reaberto mas tinha dataReabertura antes)
      else if (!tempStates.isReaberto && demanda.dataReabertura) {
        // Limpar dados de reabertura
        updateData.dataReabertura = '';
        updateData.novaDataFinal = '';
        // Manter ou atualizar a data final
        if (tempStates.dataFinal && tempStates.dataFinal.trim() !== '') {
          updateData.dataFinal =
            convertToBrazilianDate(tempStates.dataFinal) ||
            tempStates.dataFinal;
          updateData.status = 'Finalizada' as const;
        } else {
          updateData.dataFinal = '';
          updateData.status = 'Em Andamento' as const;
        }
      }
      // Se não está reaberto, processa data final normalmente
      else if (tempStates.dataFinal && tempStates.dataFinal.trim() !== '') {
        // Validar data final
        const validation = validateDate(
          tempStates.dataFinal,
          demanda,
          'final',
          tempStates
        );
        if (!validation.isValid) {
          return {
            data: null,
            error: validation.error || 'Data final inválida',
          };
        }

        updateData.dataFinal =
          convertToBrazilianDate(tempStates.dataFinal) || tempStates.dataFinal;
        updateData.status = 'Finalizada' as const;
      } else {
        // Remover data final - permite limpar a data
        updateData.dataFinal = '';
        updateData.status = 'Em Andamento' as const;
      }
      break;

    case 'reopen_demand':
      if (tempStates.isReaberto) {
        // Validar data de reabertura
        if (!tempStates.dataReabertura) {
          return {
            data: null,
            error:
              'Data de reabertura é obrigatória quando marcado como reaberto.',
          };
        }

        const reaberturaValidation = validateDate(
          tempStates.dataReabertura,
          demanda,
          'reabertura',
          tempStates
        );
        if (!reaberturaValidation.isValid) {
          return {
            data: null,
            error: reaberturaValidation.error || 'Data de reabertura inválida',
          };
        }

        // Validar nova data final se foi preenchida
        if (tempStates.novaDataFinal) {
          const novaFinalValidation = validateDate(
            tempStates.novaDataFinal,
            demanda,
            'nova_final',
            tempStates
          );
          if (!novaFinalValidation.isValid) {
            return {
              data: null,
              error: novaFinalValidation.error || 'Nova data final inválida',
            };
          }
        }

        updateData.dataReabertura =
          convertToBrazilianDate(tempStates.dataReabertura) ||
          tempStates.dataReabertura;
        updateData.novaDataFinal = tempStates.novaDataFinal
          ? convertToBrazilianDate(tempStates.novaDataFinal) ||
            tempStates.novaDataFinal
          : null;
        updateData.status = tempStates.novaDataFinal
          ? ('Finalizada' as const)
          : ('Em Andamento' as const);
      } else {
        // Cancelar reabertura - voltar ao estado original
        updateData.dataReabertura = null;
        updateData.novaDataFinal = null;
        updateData.status = demanda.dataFinal ? 'Finalizada' : 'Em Andamento';
      }
      break;

    case 'status_update':
      updateData.status = tempStates.status as
        | 'Em Andamento'
        | 'Finalizada'
        | 'Fila de Espera'
        | 'Aguardando';
      break;

    default:
      // Lógica geral - verificar todos os campos que mudaram
      if (tempStates.dataFinal) {
        updateData.dataFinal =
          convertToBrazilianDate(tempStates.dataFinal) || tempStates.dataFinal;
      }
      if (tempStates.status) {
        updateData.status = tempStates.status as
          | 'Em Andamento'
          | 'Finalizada'
          | 'Fila de Espera'
          | 'Aguardando';
      }
      break;
  }

  return { data: updateData, error: null };
};
