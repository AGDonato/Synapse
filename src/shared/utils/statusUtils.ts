/**
 * UTILITÁRIOS DE CÁLCULO DE STATUS DE DEMANDAS
 *
 * Este módulo implementa a lógica complexa de cálculo de status de demandas.
 * Inclui funcionalidades para:
 * - Cálculo de status baseado em regras de negócio específicas
 * - Tratamento de reabertura de demandas com novas datas
 * - Análise de documentos pendentes para determinar status
 * - Diferenciação entre estados "Aguardando", "Em Andamento", "Finalizada"
 * - Integração com status de documentos individuais
 */

import type { DocumentoDemanda } from '../../shared/data/mockDocumentos';
import type { Demanda } from '../types/entities';
import { getDocumentStatus } from './documentStatusUtils';

/**
 * Calcula o status da demanda baseado nas regras de negócio (incluindo reabertura)
 *
 * Regras:
 * 1. Finalizada: dataInicial ✅ + dataFinal ✅ (sem reabertura) OU dataInicial ✅ + novaDataFinal ✅ (com reabertura)
 * 2. Fila de Espera: dataInicial ✅ + dataFinal ❌ + documentos = 0
 * 3. Aguardando: dataInicial ✅ + dataFinal ❌ + documentos > 0 + algum documento pendente ✅
 * 4. Em Andamento: dataInicial ✅ + dataFinal ❌ + documentos > 0 + nenhum documento pendente ✅
 *
 * Reabertura:
 * - Se dataReabertura existe, ignora dataFinal original
 * - Status baseado em novaDataFinal (se existe) ou nas regras 2-4
 *
 * @param demanda - Objeto da demanda
 * @param documentos - Array de documentos da demanda
 * @returns Status calculado da demanda
 */
export function calculateDemandaStatus(
  demanda: Demanda,
  documentos: DocumentoDemanda[]
): 'Em Andamento' | 'Finalizada' | 'Fila de Espera' | 'Aguardando' {
  // Verificar se a demanda foi reaberta
  if (demanda.dataReabertura) {
    // Demanda reaberta: status baseado em novaDataFinal
    if (demanda.novaDataFinal) {
      return 'Finalizada';
    }
    // Se não tem novaDataFinal, aplica regras normais (2-4)
  } else {
    // Demanda normal: Regra 1 original
    if (demanda.dataInicial && demanda.dataFinal && demanda.dataFinal.trim() !== '') {
      return 'Finalizada';
    }
  }

  // Se não tiver data inicial, não pode determinar status (fallback para dados salvos)
  if (!demanda.dataInicial) {
    return demanda.status || 'Fila de Espera';
  }

  // Se tiver data inicial mas não tiver data final, avaliar documentos
  const documentosDaDemanda = documentos.filter(doc => doc.demandaId === demanda.id);

  // Regra 2: Sem documentos → Fila de Espera
  if (documentosDaDemanda.length === 0) {
    return 'Fila de Espera';
  }

  // Regra 3 e 4: Com documentos, verificar se há documentos aguardando resposta externa
  // Usar lógica correta de status de documentos
  const temDocumentosAguardandoResposta = documentosDaDemanda.some(doc => {
    const status = getDocumentStatus(doc);
    // Considera "aguardando" apenas documentos que foram enviados e aguardam resposta
    return status === 'Pendente';
  });

  const temDocumentosEmAndamento = documentosDaDemanda.some(doc => {
    const status = getDocumentStatus(doc);
    // Considera "em andamento" documentos sendo preparados ou produzidos
    return status === 'Não Enviado' || status === 'Em Produção';
  });

  // Prioridade: Aguardando > Em Andamento
  if (temDocumentosAguardandoResposta) {
    // Regra 3: Tem documentos enviados aguardando resposta → Aguardando
    return 'Aguardando';
  } else if (temDocumentosEmAndamento) {
    // Regra 4a: Tem documentos sendo preparados/produzidos → Em Andamento
    return 'Em Andamento';
  } else {
    // Regra 4b: Todos os documentos estão finalizados → Em Andamento
    return 'Em Andamento';
  }
}

/**
 * Hook/função helper para obter o status calculado de uma demanda
 * Pode ser usado nos componentes para obter o status dinâmico
 *
 * @param demanda - Objeto da demanda
 * @param allDocumentos - Array completo de documentos do sistema
 * @returns Status calculado da demanda
 */
export function useDemandaStatus(
  demanda: Demanda,
  allDocumentos: DocumentoDemanda[]
): 'Em Andamento' | 'Finalizada' | 'Fila de Espera' | 'Aguardando' {
  return calculateDemandaStatus(demanda, allDocumentos);
}

/**
 * Obtém a cor correspondente ao status da demanda
 * @param status - Status da demanda
 * @returns Cor hexadecimal correspondente ao status
 */
export function getDemandaStatusColor(
  status: 'Em Andamento' | 'Finalizada' | 'Fila de Espera' | 'Aguardando'
): string {
  switch (status) {
    case 'Em Andamento':
      return '#FFC107'; // Amarelo
    case 'Finalizada':
      return '#28A745'; // Verde
    case 'Fila de Espera':
      return '#6C757D'; // Cinza
    case 'Aguardando':
      return '#DC3545'; // Vermelho
    default:
      return '#6C757D'; // Cinza padrão
  }
}
