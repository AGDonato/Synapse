// src/utils/statusUtils.ts

import type { Demanda } from '../types/entities';
import type { DocumentoDemanda } from '../data/mockDocumentos';

/**
 * Calcula o status da demanda baseado nas regras de negócio
 * 
 * Regras:
 * 1. Finalizada: dataInicial ✅ + dataFinal ✅
 * 2. Fila de Espera: dataInicial ✅ + dataFinal ❌ + documentos = 0
 * 3. Aguardando: dataInicial ✅ + dataFinal ❌ + documentos > 0 + algum documento pendente ✅
 * 4. Em Andamento: dataInicial ✅ + dataFinal ❌ + documentos > 0 + nenhum documento pendente ✅
 * 
 * @param demanda - Objeto da demanda
 * @param documentos - Array de documentos da demanda
 * @returns Status calculado da demanda
 */
export function calculateDemandaStatus(
  demanda: Demanda,
  documentos: DocumentoDemanda[]
): 'Em Andamento' | 'Finalizada' | 'Fila de Espera' | 'Aguardando' {
  // Regra 1: Se tiver data inicial e data final → Finalizada (prioridade absoluta)
  if (demanda.dataInicial && demanda.dataFinal) {
    return 'Finalizada';
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

  // Regra 3 e 4: Com documentos, verificar se há documentos pendentes
  const temDocumentosPendentes = documentosDaDemanda.some(doc => !doc.respondido);
  
  if (temDocumentosPendentes) {
    // Regra 3: Tem documentos pendentes → Aguardando
    return 'Aguardando';
  } else {
    // Regra 4: Nenhum documento pendente → Em Andamento
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