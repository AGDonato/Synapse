/**
 * UTILITÁRIOS DE ANÁLISE DE DEMANDAS POR PROVEDOR
 *
 * Este módulo contém funções para analisar e processar demandas enviadas a provedores.
 * Inclui funcionalidades para:
 * - Cálculo de quantidade de documentos enviados por provedor
 * - Aplicação de filtros e limites para análise de top provedores
 * - Processamento especial para ofícios circulares e múltiplos destinatários
 * - Formatação de dados para diferentes tipos de gráficos e visualizações
 * - Análise de taxas de resposta por provedor
 */

import { mockProvedores } from '../data/mockProvedores';
import type { DocumentoDemanda } from '../data/mockDocumentos';
import type { ProviderLimitType } from '../hooks/useProviderFilters';

export interface ProviderDemandCount {
  name: string;
  count: number;
}

/**
 * Calcula quantos documentos cada provedor recebeu
 * Considera apenas ofícios enviados com assuntos permitidos
 * @param documentos - Lista de documentos para análise
 * @param allowedSubjects - Assuntos permitidos para contagem
 * @returns Array ordenado de provedores com contagem de demandas
 */
export function calculateProviderDemands(
  documentos: DocumentoDemanda[],
  allowedSubjects: string[]
): ProviderDemandCount[] {
  const providerCounts = new Map<string, number>();

  const documentsToProviders = documentos.filter(doc => {
    // Deve ser Ofício ou Ofício Circular
    if (!['Ofício', 'Ofício Circular'].includes(doc.tipoDocumento)) {
      return false;
    }

    // Deve ter o assunto correto
    if (!allowedSubjects.includes(doc.assunto)) {
      return false;
    }

    // Deve ter sido enviado
    return doc.dataEnvio;
  });

  documentsToProviders.forEach(doc => {
    if (doc.tipoDocumento === 'Ofício Circular') {
      // Processa Ofício Circular - conta cada destinatário individual
      if (doc.destinatariosData) {
        doc.destinatariosData.forEach(destinatarioData => {
          const providerName = destinatarioData.nome;

          // Verifica se este provedor está em mockProvedores
          const isValidProvider = mockProvedores.some(
            provedor => provedor.nomeFantasia === providerName
          );

          if (isValidProvider && destinatarioData.dataEnvio) {
            const currentCount = providerCounts.get(providerName) || 0;
            providerCounts.set(providerName, currentCount + 1);
          }
        });
      }
    } else {
      // Processa Ofício regular
      const providerName = doc.destinatario;

      // Verifica se destinatário é um provedor
      const isProvider = mockProvedores.some(provedor => provedor.nomeFantasia === providerName);

      if (isProvider) {
        const currentCount = providerCounts.get(providerName) || 0;
        providerCounts.set(providerName, currentCount + 1);
      }
    }
  });

  // Converte para array e ordena por contagem de demandas (decrescente)
  const providerDemands = Array.from(providerCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return providerDemands;
}

/**
 * Aplica o limite de provedores baseado no filtro selecionado
 */
export function applyProviderLimit<T extends { name: string }>(
  providers: T[],
  limit: ProviderLimitType,
  demandCounts: ProviderDemandCount[]
): T[] {
  if (limit === 'all') {
    return providers;
  }

  // Obtém os nomes dos top N provedores com mais demandas
  const topProviderNames = new Set(demandCounts.slice(0, limit).map(p => p.name));

  // Filtra provedores para incluir apenas os do top N
  return providers.filter(provider => topProviderNames.has(provider.name));
}

/**
 * Aplica o limite de provedores para dados de boxplot (formato especial)
 */
export function applyProviderLimitToBoxplotData(
  providers: string[],
  rawData: (string | number)[][],
  limit: ProviderLimitType,
  demandCounts: ProviderDemandCount[]
): { providers: string[]; rawData: (string | number)[][] } {
  if (limit === 'all') {
    return { providers, rawData };
  }

  // Obtém os nomes dos top N provedores com mais demandas
  const topProviderNames = new Set(demandCounts.slice(0, limit).map(p => p.name));

  // Cria mapeamento de índices antigos para novos
  const filteredProviders: string[] = [];
  const indexMapping = new Map<number, number>();

  providers.forEach((provider, oldIndex) => {
    if (topProviderNames.has(provider)) {
      indexMapping.set(oldIndex, filteredProviders.length);
      filteredProviders.push(provider);
    }
  });

  // Filtra e remapeia rawData
  const filteredRawData = rawData
    .filter(([providerIndex]) => indexMapping.has(providerIndex as number))
    .map(([providerIndex, value]) => [indexMapping.get(providerIndex as number)!, value]);

  return {
    providers: filteredProviders,
    rawData: filteredRawData,
  };
}

/**
 * Aplica o limite de provedores para dados de taxa de resposta
 */
export function applyProviderLimitToResponseRate<T extends { providerName: string }>(
  providers: T[],
  limit: ProviderLimitType,
  demandCounts: ProviderDemandCount[]
): T[] {
  if (limit === 'all') {
    return providers;
  }

  // Obtém os nomes dos top N provedores com mais demandas
  const topProviderNames = new Set(demandCounts.slice(0, limit).map(p => p.name));

  // Filtra provedores para incluir apenas os do top N
  return providers.filter(provider => topProviderNames.has(provider.providerName));
}
