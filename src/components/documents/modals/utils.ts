import type { DocumentoDemanda } from '../../../data/mockDocumentos';
import type { ModalType, TempModalStates } from './types';

// Função para determinar o tipo de modal baseado no documento
export const getModalType = (documento: DocumentoDemanda | null): ModalType => {
  if (!documento) return 'default';

  const { tipoDocumento, assunto } = documento;

  // 1, 2, 3. Autos Circunstanciados e Relatórios - sempre apenas data de finalização
  if (
    tipoDocumento === 'Autos Circunstanciados' ||
    tipoDocumento === 'Relatório Técnico' ||
    tipoDocumento === 'Relatório de Inteligência'
  ) {
    return 'finalizacao';
  }

  // 4. Mídia - checkbox de defeito
  if (tipoDocumento === 'Mídia') {
    return 'midia';
  }

  // 5-13. Ofícios e Ofícios Circulares - baseado no assunto
  if (tipoDocumento === 'Ofício') {
    switch (assunto) {
      case 'Comunicação de não cumprimento de decisão judicial':
        return 'comunicacao_nao_cumprimento';
      case 'Encaminhamento de mídia':
        return 'oficio_midia';
      case 'Encaminhamento de relatório técnico':
        return 'oficio_relatorio_tecnico';
      case 'Encaminhamento de relatório de inteligência':
        return 'oficio_relatorio_inteligencia';
      case 'Encaminhamento de relatório técnico e mídia':
        return 'oficio_relatorio_midia';
      case 'Encaminhamento de autos circunstanciados':
        return 'oficio_autos_circunstanciados';
      case 'Requisição de dados cadastrais':
      case 'Requisição de dados cadastrais e preservação de dados':
      case 'Solicitação de dados cadastrais':
      case 'Encaminhamento de decisão judicial':
        return 'encaminhamento_decisao_judicial';
      default:
        return 'oficio';
    }
  }

  if (tipoDocumento === 'Ofício Circular') {
    if (assunto === 'Outros') {
      return 'oficio_circular_outros';
    } else {
      return 'oficio_circular';
    }
  }

  return 'default';
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

// Função para inicializar estados temporários com base no documento
export const initializeTempStates = (
  documento: DocumentoDemanda | null,
  destinatarioString?: string
): TempModalStates => {
  // Converter string de destinatários em array se necessário
  const destinatarios = destinatarioString
    ? destinatarioString.split(',').map((d) => d.trim())
    : [];
  const initialStates: TempModalStates = {
    numeroAtena: documento?.numeroAtena || '',
    dataFinalizacao: documento?.dataFinalizacao || '',
    dataFinalizacaoFormatted: formatDateForDisplay(
      documento?.dataFinalizacao || ''
    ),
    apresentouDefeito: documento?.apresentouDefeito || false,
    dataEnvio: documento?.dataEnvio || '',
    dataEnvioFormatted: formatDateForDisplay(documento?.dataEnvio || ''),
    dataResposta: documento?.dataResposta || '',
    dataRespostaFormatted: formatDateForDisplay(documento?.dataResposta || ''),
    codigoRastreio: documento?.codigoRastreio || '',
    naopossuiRastreio: documento?.naopossuiRastreio || false,
    selectedMidias: [],
    selectedRelatoriosTecnicos: [],
    selectedRelatoriosInteligencia: [],
    selectedAutosCircunstanciados: [],
    selectedDecisoes: [],
    destinatariosData: [],
  };

  // Inicializar dados de destinatários para Ofício Circular
  if (
    documento?.tipoDocumento === 'Ofício Circular' &&
    destinatarios.length > 0
  ) {
    initialStates.destinatariosData = destinatarios.map((nome) => ({
      nome,
      dataEnvio: documento.dataEnvio || '',
      dataEnvioFormatted: formatDateForDisplay(documento.dataEnvio || ''),
      dataResposta: documento.dataResposta || '',
      dataRespostaFormatted: formatDateForDisplay(documento.dataResposta || ''),
      codigoRastreio: documento.codigoRastreio || '',
      naopossuiRastreio: documento.naopossuiRastreio || false,
    }));
  }

  return initialStates;
};

// Função para verificar se há mudanças nos estados
export const hasChanges = (
  tempStates: TempModalStates,
  initialStates: TempModalStates,
  modalType: ModalType
): boolean => {
  switch (modalType) {
    case 'finalizacao':
      return tempStates.dataFinalizacao !== initialStates.dataFinalizacao;

    case 'midia':
      return tempStates.apresentouDefeito !== initialStates.apresentouDefeito;

    case 'oficio':
      return (
        tempStates.numeroAtena !== initialStates.numeroAtena ||
        tempStates.dataEnvio !== initialStates.dataEnvio ||
        tempStates.dataResposta !== initialStates.dataResposta ||
        tempStates.codigoRastreio !== initialStates.codigoRastreio ||
        tempStates.naopossuiRastreio !== initialStates.naopossuiRastreio
      );

    case 'oficio_circular':
    case 'oficio_circular_outros':
      return (
        tempStates.numeroAtena !== initialStates.numeroAtena ||
        JSON.stringify(tempStates.destinatariosData) !==
          JSON.stringify(initialStates.destinatariosData)
      );

    case 'comunicacao_nao_cumprimento':
    case 'encaminhamento_decisao_judicial':
      return (
        JSON.stringify(tempStates.selectedDecisoes) !==
        JSON.stringify(initialStates.selectedDecisoes)
      );

    case 'oficio_midia':
      return (
        tempStates.numeroAtena !== initialStates.numeroAtena ||
        JSON.stringify(tempStates.selectedMidias) !==
          JSON.stringify(initialStates.selectedMidias)
      );

    case 'oficio_relatorio_tecnico':
      return (
        JSON.stringify(tempStates.selectedRelatoriosTecnicos) !==
        JSON.stringify(initialStates.selectedRelatoriosTecnicos)
      );

    case 'oficio_relatorio_inteligencia':
      return (
        JSON.stringify(tempStates.selectedRelatoriosInteligencia) !==
        JSON.stringify(initialStates.selectedRelatoriosInteligencia)
      );

    case 'oficio_relatorio_midia':
      return (
        tempStates.numeroAtena !== initialStates.numeroAtena ||
        JSON.stringify(tempStates.selectedRelatoriosTecnicos) !==
          JSON.stringify(initialStates.selectedRelatoriosTecnicos) ||
        JSON.stringify(tempStates.selectedMidias) !==
          JSON.stringify(initialStates.selectedMidias)
      );

    case 'oficio_autos_circunstanciados':
      return (
        JSON.stringify(tempStates.selectedAutosCircunstanciados) !==
        JSON.stringify(initialStates.selectedAutosCircunstanciados)
      );

    default:
      return false;
  }
};

// Função para preparar dados de atualização
export const prepareUpdateData = (
  tempStates: TempModalStates,
  modalType: ModalType,
  _documentosDemanda: DocumentoDemanda[],
  getDocumento: (id: number) => DocumentoDemanda | undefined
): { data: Partial<DocumentoDemanda> | null; error: string | null } => {
  const updateData: Partial<DocumentoDemanda> = {
    numeroAtena: tempStates.numeroAtena,
  };

  switch (modalType) {
    case 'finalizacao':
      updateData.dataFinalizacao = convertToBrazilianDate(
        tempStates.dataFinalizacao
      );
      break;

    case 'midia':
      updateData.apresentouDefeito = tempStates.apresentouDefeito;
      break;

    case 'oficio':
      updateData.dataEnvio = convertToBrazilianDate(tempStates.dataEnvio);
      updateData.dataResposta = convertToBrazilianDate(tempStates.dataResposta);
      updateData.codigoRastreio = tempStates.naopossuiRastreio
        ? ''
        : tempStates.codigoRastreio;
      updateData.naopossuiRastreio = tempStates.naopossuiRastreio;
      updateData.respondido =
        !!tempStates.dataResposta && tempStates.dataResposta !== '';
      break;

    case 'oficio_circular':
    case 'oficio_circular_outros': {
      const todosRespondidos =
        tempStates.destinatariosData.length > 0 &&
        tempStates.destinatariosData.every(
          (d) => !!d.dataResposta && d.dataResposta !== ''
        );

      updateData.respondido = todosRespondidos;

      if (tempStates.destinatariosData.length > 0) {
        const primeiroDestinatar = tempStates.destinatariosData[0];
        updateData.dataEnvio = convertToBrazilianDate(
          primeiroDestinatar.dataEnvio
        );
        updateData.dataResposta = convertToBrazilianDate(
          primeiroDestinatar.dataResposta
        );
        updateData.codigoRastreio = primeiroDestinatar.naopossuiRastreio
          ? ''
          : primeiroDestinatar.codigoRastreio;
        updateData.naopossuiRastreio = primeiroDestinatar.naopossuiRastreio;
      }
      break;
    }

    case 'oficio_autos_circunstanciados': {
      // Validar se todos os autos selecionados foram finalizados
      const autosNaoFinalizados =
        tempStates.selectedAutosCircunstanciados.filter((autoId) => {
          const auto = getDocumento(parseInt(autoId));
          return !auto?.dataFinalizacao || auto.dataFinalizacao === '';
        });

      if (autosNaoFinalizados.length > 0) {
        const autosNaoFinalizadosInfo = autosNaoFinalizados
          .map((autoId) => {
            const auto = getDocumento(parseInt(autoId));
            return auto?.numeroDocumento;
          })
          .join(', ');

        return {
          data: null,
          error: `Autos Circunstanciados ${autosNaoFinalizadosInfo} não foi finalizado.`,
        };
      }
      break;
    }

    case 'comunicacao_nao_cumprimento':
    case 'encaminhamento_decisao_judicial':
    case 'oficio_midia':
    case 'oficio_relatorio_tecnico':
    case 'oficio_relatorio_inteligencia':
    case 'oficio_relatorio_midia':
      // Para estes casos, apenas salvar as seleções
      // Os dados específicos são mantidos nos respectivos estados
      break;

    default:
      // Comportamento padrão
      updateData.dataEnvio = convertToBrazilianDate(tempStates.dataEnvio);
      updateData.dataResposta = convertToBrazilianDate(tempStates.dataResposta);
      updateData.codigoRastreio = tempStates.naopossuiRastreio
        ? ''
        : tempStates.codigoRastreio;
      updateData.naopossuiRastreio = tempStates.naopossuiRastreio;
      updateData.respondido =
        !!tempStates.dataResposta && tempStates.dataResposta !== '';
      break;
  }

  return { data: updateData, error: null };
};
