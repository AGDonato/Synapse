// src/utils/providerDemandUtils.ts
import { mockProvedores } from '../data/mockProvedores';
import type { DocumentoDemanda } from '../data/mockDocumentos';
import type { ProviderLimitType } from '../hooks/useProviderFilters';

export interface ProviderDemandCount {
  name: string;
  count: number;
}

/**
 * Calcula quantos documentos cada provedor recebeu
 */
export function calculateProviderDemands(
  documentos: DocumentoDemanda[],
  allowedSubjects: string[]
): ProviderDemandCount[] {
  const providerCounts = new Map<string, number>();

  const documentsToProviders = documentos.filter(doc => {
    // Must be Ofício or Ofício Circular
    if (!['Ofício', 'Ofício Circular'].includes(doc.tipoDocumento))
      return false;

    // Must have the correct subject
    if (!allowedSubjects.includes(doc.assunto)) return false;

    // Must have been sent
    return doc.dataEnvio;
  });

  documentsToProviders.forEach(doc => {
    if (doc.tipoDocumento === 'Ofício Circular') {
      // Handle Ofício Circular - count each individual destinatário
      if (doc.destinatariosData) {
        doc.destinatariosData.forEach(destinatarioData => {
          const providerName = destinatarioData.nome;

          // Check if this provider is in mockProvedores
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
      // Handle regular Ofício
      const providerName = doc.destinatario;

      // Check if destinatario is a provider
      const isProvider = mockProvedores.some(
        provedor => provedor.nomeFantasia === providerName
      );

      if (isProvider) {
        const currentCount = providerCounts.get(providerName) || 0;
        providerCounts.set(providerName, currentCount + 1);
      }
    }
  });

  // Convert to array and sort by demand count (descending)
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

  // Get the names of the top N most demanded providers
  const topProviderNames = new Set(
    demandCounts.slice(0, limit).map(p => p.name)
  );

  // Filter providers to only include those in the top N
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

  // Get the names of the top N most demanded providers
  const topProviderNames = new Set(
    demandCounts.slice(0, limit).map(p => p.name)
  );

  // Create mapping of old indices to new indices
  const filteredProviders: string[] = [];
  const indexMapping = new Map<number, number>();

  providers.forEach((provider, oldIndex) => {
    if (topProviderNames.has(provider)) {
      indexMapping.set(oldIndex, filteredProviders.length);
      filteredProviders.push(provider);
    }
  });

  // Filter and remap rawData
  const filteredRawData = rawData
    .filter(([providerIndex]) => indexMapping.has(providerIndex as number))
    .map(([providerIndex, value]) => [
      indexMapping.get(providerIndex as number)!,
      value,
    ]);

  return {
    providers: filteredProviders,
    rawData: filteredRawData,
  };
}

/**
 * Aplica o limite de provedores para dados de taxa de resposta
 */
export function applyProviderLimitToResponseRate<
  T extends { providerName: string },
>(
  providers: T[],
  limit: ProviderLimitType,
  demandCounts: ProviderDemandCount[]
): T[] {
  if (limit === 'all') {
    return providers;
  }

  // Get the names of the top N most demanded providers
  const topProviderNames = new Set(
    demandCounts.slice(0, limit).map(p => p.name)
  );

  // Filter providers to only include those in the top N
  return providers.filter(provider =>
    topProviderNames.has(provider.providerName)
  );
}
