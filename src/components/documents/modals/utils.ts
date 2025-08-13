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
        return 'oficio';
      case 'Outros':
        return 'oficio_outros';
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

export function validateDateNotFuture(dateString: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  if (!dateString || dateString.length !== 10) {
    return { isValid: true }; // Não validar datas incompletas
  }

  try {
    const [day, month, year] = dateString.split('/');
    const inputDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );
    const today = new Date();

    // Resetar horas para comparar apenas as datas
    today.setHours(23, 59, 59, 999);

    if (inputDate > today) {
      return {
        isValid: false,
        errorMessage:
          'A data informada deve ser igual ou anterior à data atual.',
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      errorMessage: 'Data inválida',
    };
  }
}

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
  // Função para dividir string de destinatários (tratando formato com "e")
  const parseDestinatarios = (destinatarioString: string): string[] => {
    if (!destinatarioString) return [];
    
    // Se contém " e ", tratar o formato "A, B e C"
    if (destinatarioString.includes(' e ')) {
      const parts = destinatarioString.split(' e ');
      const ultimoNome = parts.pop()?.trim();
      const primeirosNomes = parts.join(' e ').split(', ').map(nome => nome.trim());
      
      if (ultimoNome) {
        return [...primeirosNomes, ultimoNome];
      }
      return primeirosNomes;
    }
    
    // Formato simples com apenas vírgulas "A, B, C"
    return destinatarioString.split(',').map(nome => nome.trim()).filter(nome => nome.length > 0);
  };

  // Converter string de destinatários em array se necessário
  const destinatarios = destinatarioString
    ? parseDestinatarios(destinatarioString)
    : [];
  // Normalizar datas para o formato usado nos inputs (formatado ou ISO completo)
  const normalizeInitialDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const formatted = formatDateForDisplay(dateStr);
    return formatted.length === 10 ? convertToHTMLDate(formatted) : formatted;
  };

  const initialStates: TempModalStates = {
    numeroAtena: documento?.numeroAtena || '',
    dataFinalizacao: normalizeInitialDate(documento?.dataFinalizacao || ''),
    dataFinalizacaoFormatted: formatDateForDisplay(
      documento?.dataFinalizacao || ''
    ),
    apresentouDefeito: documento?.apresentouDefeito || false,
    dataEnvio: normalizeInitialDate(documento?.dataEnvio || ''),
    dataEnvioFormatted: formatDateForDisplay(documento?.dataEnvio || ''),
    dataResposta: normalizeInitialDate(documento?.dataResposta || ''),
    dataRespostaFormatted: formatDateForDisplay(documento?.dataResposta || ''),
    codigoRastreio: documento?.codigoRastreio || '',
    naopossuiRastreio: documento?.naopossuiRastreio || false,
    selectedMidias: documento?.selectedMidias || [],
    selectedRelatoriosTecnicos: documento?.selectedRelatoriosTecnicos || [],
    selectedRelatoriosInteligencia: documento?.selectedRelatoriosInteligencia || [],
    selectedAutosCircunstanciados: documento?.selectedAutosCircunstanciados || [],
    selectedDecisoes: documento?.selectedDecisoes || [],
    destinatariosData: [],
  };

  // Inicializar dados de destinatários para Ofício Circular
  if (documento?.tipoDocumento === 'Ofício Circular') {
    // Usar dados individuais se existem, senão usar dados compartilhados
    if (documento.destinatariosData && documento.destinatariosData.length > 0) {
      initialStates.destinatariosData = documento.destinatariosData.map((dest) => ({
        nome: dest.nome,
        dataEnvio: normalizeInitialDate(dest.dataEnvio || ''),
        dataEnvioFormatted: formatDateForDisplay(dest.dataEnvio || ''),
        dataResposta: normalizeInitialDate(dest.dataResposta || ''),
        dataRespostaFormatted: formatDateForDisplay(dest.dataResposta || ''),
        codigoRastreio: dest.codigoRastreio || '',
        naopossuiRastreio: dest.naopossuiRastreio || false,
      }));
    } else if (destinatarios.length > 0) {
      // Fallback para documentos antigos sem destinatariosData
      initialStates.destinatariosData = destinatarios.map((nome) => ({
        nome,
        dataEnvio: normalizeInitialDate(documento.dataEnvio || ''),
        dataEnvioFormatted: formatDateForDisplay(documento.dataEnvio || ''),
        dataResposta: normalizeInitialDate(documento.dataResposta || ''),
        dataRespostaFormatted: formatDateForDisplay(documento.dataResposta || ''),
        codigoRastreio: documento.codigoRastreio || '',
        naopossuiRastreio: documento.naopossuiRastreio || false,
      }));
    }
  }

  return initialStates;
};

// Função auxiliar para comparar arrays de forma mais precisa
const compareArrays = (arr1: string[], arr2: string[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
};

// Função auxiliar para comparar datas formatadas
const compareDates = (current: string | undefined, initial: string | undefined): boolean => {
  return (current || '') !== (initial || '');
};

// Função para verificar se há mudanças nos estados
export const hasChanges = (
  tempStates: TempModalStates,
  initialStates: TempModalStates,
  modalType: ModalType
): boolean => {
  switch (modalType) {
    case 'finalizacao':
      // Comparar com inteligência para detectar mudanças reais
      return compareDates(
        tempStates.dataFinalizacaoFormatted,
        initialStates.dataFinalizacaoFormatted
      );

    case 'midia':
      return tempStates.apresentouDefeito !== initialStates.apresentouDefeito;

    case 'oficio':
      return (
        tempStates.numeroAtena !== initialStates.numeroAtena ||
        compareDates(tempStates.dataEnvioFormatted, initialStates.dataEnvioFormatted) ||
        compareDates(tempStates.dataRespostaFormatted, initialStates.dataRespostaFormatted) ||
        tempStates.codigoRastreio !== initialStates.codigoRastreio ||
        tempStates.naopossuiRastreio !== initialStates.naopossuiRastreio
      );

    case 'oficio_circular':
      // Comparar número no Atena
      if (tempStates.numeroAtena !== initialStates.numeroAtena) {
        return true;
      }
      // Comparar cada destinatário individualmente
      if (tempStates.destinatariosData.length !== initialStates.destinatariosData.length) {
        return true;
      }
      for (let i = 0; i < tempStates.destinatariosData.length; i++) {
        const temp = tempStates.destinatariosData[i];
        const initial = initialStates.destinatariosData[i];
        if (
          temp.nome !== initial.nome ||
          compareDates(temp.dataEnvioFormatted, initial.dataEnvioFormatted) ||
          compareDates(temp.dataRespostaFormatted, initial.dataRespostaFormatted) ||
          temp.codigoRastreio !== initial.codigoRastreio ||
          temp.naopossuiRastreio !== initial.naopossuiRastreio
        ) {
          return true;
        }
      }
      return false;

    case 'oficio_circular_outros':
      // Comparar número no Atena
      if (tempStates.numeroAtena !== initialStates.numeroAtena) {
        return true;
      }
      // Comparar cada destinatário (apenas data de envio)
      if (tempStates.destinatariosData.length !== initialStates.destinatariosData.length) {
        return true;
      }
      for (let i = 0; i < tempStates.destinatariosData.length; i++) {
        const temp = tempStates.destinatariosData[i];
        const initial = initialStates.destinatariosData[i];
        if (
          temp.nome !== initial.nome ||
          compareDates(temp.dataEnvioFormatted, initial.dataEnvioFormatted)
        ) {
          return true;
        }
      }
      return false;

    case 'comunicacao_nao_cumprimento':
      return !compareArrays(tempStates.selectedDecisoes, initialStates.selectedDecisoes);

    case 'oficio_outros':
      return (
        tempStates.numeroAtena !== initialStates.numeroAtena ||
        compareDates(tempStates.dataEnvioFormatted, initialStates.dataEnvioFormatted)
      );

    case 'oficio_midia':
      return (
        tempStates.numeroAtena !== initialStates.numeroAtena ||
        !compareArrays(tempStates.selectedMidias, initialStates.selectedMidias)
      );

    case 'oficio_relatorio_tecnico':
      return !compareArrays(tempStates.selectedRelatoriosTecnicos, initialStates.selectedRelatoriosTecnicos);

    case 'oficio_relatorio_inteligencia':
      return !compareArrays(tempStates.selectedRelatoriosInteligencia, initialStates.selectedRelatoriosInteligencia);

    case 'oficio_relatorio_midia':
      return (
        tempStates.numeroAtena !== initialStates.numeroAtena ||
        !compareArrays(tempStates.selectedRelatoriosTecnicos, initialStates.selectedRelatoriosTecnicos) ||
        !compareArrays(tempStates.selectedMidias, initialStates.selectedMidias)
      );

    case 'oficio_autos_circunstanciados':
      return !compareArrays(tempStates.selectedAutosCircunstanciados, initialStates.selectedAutosCircunstanciados);

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

      // Atualizar dados individuais dos destinatários
      updateData.destinatariosData = tempStates.destinatariosData.map(dest => ({
        nome: dest.nome,
        dataEnvio: convertToBrazilianDate(dest.dataEnvio),
        dataResposta: convertToBrazilianDate(dest.dataResposta),
        codigoRastreio: dest.naopossuiRastreio ? '' : dest.codigoRastreio,
        naopossuiRastreio: dest.naopossuiRastreio,
        respondido: !!dest.dataResposta && dest.dataResposta !== '',
      }));

      // Manter campos gerais para compatibilidade (usar dados do primeiro destinatário)
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
        return {
          data: null,
          error: 'Documento selecionado não foi finalizado.',
        };
      }
      // Salvar seleção
      updateData.selectedAutosCircunstanciados = tempStates.selectedAutosCircunstanciados;
      break;
    }

    case 'oficio_relatorio_tecnico': {
      // Validar se todos os relatórios técnicos selecionados foram finalizados
      const relatoriosNaoFinalizados =
        tempStates.selectedRelatoriosTecnicos.filter((relatorioId) => {
          const relatorio = getDocumento(parseInt(relatorioId));
          return !relatorio?.dataFinalizacao || relatorio.dataFinalizacao === '';
        });

      if (relatoriosNaoFinalizados.length > 0) {
        return {
          data: null,
          error: 'Documento selecionado não foi finalizado.',
        };
      }
      // Salvar seleção
      updateData.selectedRelatoriosTecnicos = tempStates.selectedRelatoriosTecnicos;
      break;
    }

    case 'oficio_relatorio_inteligencia': {
      // Validar se todos os relatórios de inteligência selecionados foram finalizados
      const relatoriosNaoFinalizados =
        tempStates.selectedRelatoriosInteligencia.filter((relatorioId) => {
          const relatorio = getDocumento(parseInt(relatorioId));
          return !relatorio?.dataFinalizacao || relatorio.dataFinalizacao === '';
        });

      if (relatoriosNaoFinalizados.length > 0) {
        return {
          data: null,
          error: 'Documento selecionado não foi finalizado.',
        };
      }
      // Salvar seleção
      updateData.selectedRelatoriosInteligencia = tempStates.selectedRelatoriosInteligencia;
      break;
    }

    case 'oficio_relatorio_midia': {
      // Validar relatórios técnicos
      const relatoriosNaoFinalizados =
        tempStates.selectedRelatoriosTecnicos.filter((relatorioId) => {
          const relatorio = getDocumento(parseInt(relatorioId));
          return !relatorio?.dataFinalizacao || relatorio.dataFinalizacao === '';
        });

      if (relatoriosNaoFinalizados.length > 0) {
        return {
          data: null,
          error: 'Documento selecionado não foi finalizado.',
        };
      }
      // Salvar seleções
      updateData.selectedRelatoriosTecnicos = tempStates.selectedRelatoriosTecnicos;
      updateData.selectedMidias = tempStates.selectedMidias;
      break;
    }

    case 'comunicacao_nao_cumprimento':
      // Salvar seleção de decisões judiciais não cumpridas
      updateData.selectedDecisoes = tempStates.selectedDecisoes;
      break;

    case 'oficio_midia':
      // Salvar seleção de mídias
      updateData.selectedMidias = tempStates.selectedMidias;
      break;

    case 'oficio_outros':
      updateData.dataEnvio = convertToBrazilianDate(tempStates.dataEnvio);
      updateData.respondido = false;
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

// Tipo para definir campos visíveis
export interface VisibleFields {
  numeroAtena: boolean;
  dataEnvio: boolean;
  dataResposta: boolean;
  codigoRastreio: boolean;
  dataFinalizacao: boolean;
  apresentouDefeito: boolean;
  status: boolean;
  selectedMidias: boolean;
  selectedRelatoriosTecnicos: boolean;
  selectedRelatoriosInteligencia: boolean;
  selectedAutosCircunstanciados: boolean;
  selectedDecisoes: boolean;
  destinatariosIndividuais: boolean;
}

// Função para determinar quais campos devem ser visíveis nas informações adicionais
export const getVisibleFields = (documento: DocumentoDemanda | null): VisibleFields => {
  const modalType = getModalType(documento);
  
  const fields: VisibleFields = {
    numeroAtena: false,
    dataEnvio: false,
    dataResposta: false,
    codigoRastreio: false,
    dataFinalizacao: false,
    apresentouDefeito: false,
    status: false,
    selectedMidias: false,
    selectedRelatoriosTecnicos: false,
    selectedRelatoriosInteligencia: false,
    selectedAutosCircunstanciados: false,
    selectedDecisoes: false,
    destinatariosIndividuais: false,
  };

  switch (modalType) {
    case 'finalizacao':
      // Apenas data de finalização (sem status)
      fields.dataFinalizacao = true;
      break;

    case 'midia':
      // Apenas checkbox de defeito
      fields.apresentouDefeito = true;
      break;

    case 'oficio':
      // Ofício padrão com datas e rastreio
      fields.numeroAtena = true;
      fields.dataEnvio = true;
      fields.dataResposta = true;
      fields.codigoRastreio = true;
      fields.status = true; // Status calculado das datas
      break;

    case 'oficio_circular':
      // Ofício Circular completo - dados individuais por destinatário
      fields.numeroAtena = true;
      fields.destinatariosIndividuais = true;
      fields.status = true; // Status por destinatário
      break;

    case 'oficio_circular_outros':
      // Ofício Circular simplificado - apenas data de envio
      fields.numeroAtena = true;
      fields.dataEnvio = true;
      break;

    case 'comunicacao_nao_cumprimento':
      // Apenas seleção de decisões
      fields.selectedDecisoes = true;
      break;

    case 'oficio_outros':
      // Apenas número no Atena e data de envio
      fields.numeroAtena = true;
      fields.dataEnvio = true;
      break;

    case 'oficio_midia':
      // Número no Atena e detalhes das mídias selecionadas
      fields.numeroAtena = true;
      fields.selectedMidias = true;
      break;

    case 'oficio_relatorio_tecnico':
      // Número no Atena e detalhes dos relatórios técnicos
      fields.numeroAtena = true;
      fields.selectedRelatoriosTecnicos = true;
      break;

    case 'oficio_relatorio_inteligencia':
      // Número no Atena e detalhes dos relatórios de inteligência
      fields.numeroAtena = true;
      fields.selectedRelatoriosInteligencia = true;
      break;

    case 'oficio_relatorio_midia':
      // Número no Atena, relatórios técnicos e mídias
      fields.numeroAtena = true;
      fields.selectedRelatoriosTecnicos = true;
      fields.selectedMidias = true;
      break;

    case 'oficio_autos_circunstanciados':
      // Número no Atena e detalhes dos autos circunstanciados
      fields.numeroAtena = true;
      fields.selectedAutosCircunstanciados = true;
      break;

    default:
      // Sem campos adicionais
      break;
  }

  return fields;
};
