// src/data/documentoRegras.ts

import { mockTiposDocumentos } from './mockTiposDocumentos';
import { mockAssuntos } from './mockAssuntos';

/**
 * Configurações de regras para documentos
 * Centraliza todas as regras de negócio relacionadas a documentos
 */

// ===== TIPOS =====

export interface SectionVisibility {
  section2: boolean; // Dados da Decisão Judicial
  section3: boolean; // Dados da Mídia
  section4: boolean; // Dados da Pesquisa
}

export interface DocumentoAssuntoConfig {
  tipoDocumento: string;
  assuntos: string[];
}

export interface SecaoConfig {
  key: string; // formato: "TipoDocumento|Assunto"
  tipoDocumento: string;
  assunto: string;
  visibility: SectionVisibility;
}

// ===== CONFIGURAÇÃO DOCUMENTO → ASSUNTOS =====

export const documentoAssuntoConfig: Record<string, string[]> = {
  'Autos Circunstanciados': ['Ações Virtuais Controladas', 'Outros'],
  Mídia: [],
  Ofício: [
    'Comunicação de não cumprimento de decisão judicial',
    'Encaminhamento de autos circunstanciados',
    'Encaminhamento de decisão judicial',
    'Encaminhamento de mídia',
    'Encaminhamento de relatório de inteligência',
    'Encaminhamento de relatório técnico',
    'Encaminhamento de relatório técnico e mídia',
    'Requisição de dados cadastrais',
    'Requisição de dados cadastrais e preservação de dados',
    'Solicitação de dados cadastrais',
    'Outros',
  ],
  'Ofício Circular': [
    'Encaminhamento de decisão judicial',
    'Requisição de dados cadastrais',
    'Requisição de dados cadastrais e preservação de dados',
    'Solicitação de dados cadastrais',
    'Outros',
  ],
  'Relatório de Inteligência': [
    'Análise de evidências',
    'Análise de vulnerabilidade',
    'Compilação de evidências',
    'Compilação e análise de evidências',
    'Investigação Cibernética',
    'Levantamentos de dados cadastrais',
    'Preservação de dados',
    'Outros',
  ],
  'Relatório Técnico': [
    'Análise de evidências',
    'Análise de vulnerabilidade',
    'Compilação de evidências',
    'Compilação e análise de evidências',
    'Investigação Cibernética',
    'Levantamentos de dados cadastrais',
    'Preservação de dados',
    'Outros',
  ],
};

// ===== CONFIGURAÇÃO DE VISIBILIDADE DAS SEÇÕES =====

export const secaoConfiguracoes: Record<string, SectionVisibility> = {
  // Autos Circunstanciados
  'Autos Circunstanciados|Ações Virtuais Controladas': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Autos Circunstanciados|Outros': {
    section2: false,
    section3: false,
    section4: false,
  },

  // Ofício
  'Ofício|Comunicação de não cumprimento de decisão judicial': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Ofício|Encaminhamento de autos circunstanciados': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Ofício|Encaminhamento de decisão judicial': {
    section2: true,
    section3: false,
    section4: true,
  },
  'Ofício|Encaminhamento de mídia': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Ofício|Encaminhamento de relatório de inteligência': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Ofício|Encaminhamento de relatório técnico': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Ofício|Encaminhamento de relatório técnico e mídia': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Ofício|Requisição de dados cadastrais': {
    section2: false,
    section3: false,
    section4: true,
  },
  'Ofício|Requisição de dados cadastrais e preservação de dados': {
    section2: false,
    section3: false,
    section4: true,
  },
  'Ofício|Solicitação de dados cadastrais': {
    section2: false,
    section3: false,
    section4: true,
  },
  'Ofício|Outros': {
    section2: false,
    section3: false,
    section4: false,
  },

  // Ofício Circular
  'Ofício Circular|Encaminhamento de decisão judicial': {
    section2: true,
    section3: false,
    section4: true,
  },
  'Ofício Circular|Requisição de dados cadastrais': {
    section2: false,
    section3: false,
    section4: true,
  },
  'Ofício Circular|Requisição de dados cadastrais e preservação de dados': {
    section2: false,
    section3: false,
    section4: true,
  },
  'Ofício Circular|Solicitação de dados cadastrais': {
    section2: false,
    section3: false,
    section4: true,
  },
  'Ofício Circular|Outros': {
    section2: false,
    section3: false,
    section4: false,
  },

  // Relatório de Inteligência
  'Relatório de Inteligência|Análise de evidências': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório de Inteligência|Análise de vulnerabilidade': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório de Inteligência|Compilação de evidências': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório de Inteligência|Compilação e análise de evidências': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório de Inteligência|Investigação Cibernética': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório de Inteligência|Levantamentos de dados cadastrais': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório de Inteligência|Preservação de dados': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório de Inteligência|Outros': {
    section2: false,
    section3: false,
    section4: false,
  },

  // Relatório Técnico
  'Relatório Técnico|Análise de evidências': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Análise de vulnerabilidade': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Compilação de evidências': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Compilação e análise de evidências': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Investigação Cibernética': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Levantamentos de dados cadastrais': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Preservação de dados': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Outros': {
    section2: false,
    section3: false,
    section4: false,
  },

  // Mídia (caso especial)
  'Mídia|SEM_ASSUNTO': {
    section2: false,
    section3: true,
    section4: false,
  },
};

// ===== FUNÇÕES AUXILIARES =====

/**
 * Obtém os assuntos disponíveis para um tipo de documento
 */
export function getAssuntosByTipoDocumento(tipoDocumento: string): string[] {
  return documentoAssuntoConfig[tipoDocumento] || [];
}

/**
 * Obtém a configuração de visibilidade das seções
 */
export function getSectionVisibility(tipoDocumento: string, assunto: string): SectionVisibility {
  const key = assunto ? `${tipoDocumento}|${assunto}` : `${tipoDocumento}|SEM_ASSUNTO`;
  return (
    secaoConfiguracoes[key] || {
      section2: false,
      section3: false,
      section4: false,
    }
  );
}

/**
 * Obtém lista completa de configurações para edição
 */
export function getAllSecaoConfigs(): SecaoConfig[] {
  const configs: SecaoConfig[] = [];

  Object.keys(secaoConfiguracoes).forEach(key => {
    const [tipoDocumento, assunto] = key.split('|');
    configs.push({
      key,
      tipoDocumento,
      assunto: assunto === 'SEM_ASSUNTO' ? '' : assunto,
      visibility: secaoConfiguracoes[key],
    });
  });

  return configs;
}

/**
 * Atualiza uma configuração de seção
 */
export function updateSecaoConfig(key: string, visibility: Partial<SectionVisibility>): void {
  secaoConfiguracoes[key] = {
    ...secaoConfiguracoes[key],
    ...visibility,
  };
}

/**
 * Inicializa configurações para novos tipos de documento
 * Garante que todos os tipos do cadastro tenham configurações básicas
 */
export function initializeDocumentoConfigs(): void {
  // Para cada tipo de documento no cadastro
  mockTiposDocumentos.forEach(tipoDoc => {
    const tipoNome = tipoDoc.nome;

    // 1. Inicializar no documentoAssuntoConfig se não existir
    if (!documentoAssuntoConfig[tipoNome]) {
      documentoAssuntoConfig[tipoNome] = [];
    }

    // 2. Criar configuração SEM_ASSUNTO apenas se o tipo realmente não tem assuntos
    const assuntosDoTipo = documentoAssuntoConfig[tipoNome];
    if (assuntosDoTipo.length === 0) {
      const basicKey = `${tipoNome}|SEM_ASSUNTO`;
      if (!secaoConfiguracoes[basicKey]) {
        // Para tipos sem assuntos, definir configurações específicas
        if (tipoNome === 'Mídia') {
          secaoConfiguracoes[basicKey] = {
            section2: false,
            section3: true,
            section4: false,
          };
        } else {
          secaoConfiguracoes[basicKey] = {
            section2: false,
            section3: false,
            section4: false,
          };
        }
      }
    }
  });

  // Verificar tipos órfãos (tipos removidos do cadastro)
  const tiposValidos = mockTiposDocumentos.map(t => t.nome);
  Object.keys(documentoAssuntoConfig).forEach(tipoDoc => {
    if (!tiposValidos.includes(tipoDoc)) {
      // Tipo documento removido do cadastro - manter para compatibilidade
    }
  });

  // Verificar assuntos órfãos
  const assuntosOrfaos = detectAssuntosOrfaos();
  if (assuntosOrfaos.length > 0) {
    // Assuntos órfãos detectados - manter para compatibilidade
    // assuntosOrfaos;
  }

  // Verificar configurações de seção órfãs
  const secoesOrfas = detectSecaoOrfas();
  if (secoesOrfas.length > 0) {
    // Seções órfãs detectadas - manter para compatibilidade
    // secoesOrfas;
  }

  // Validar consistência geral do sistema
  const validacao = validateSystemConsistency();
  if (validacao.secoesFaltantes.length > 0) {
    // Seções faltantes detectadas
    // validacao.secoesFaltantes;

    // Criar configurações faltantes automaticamente
    validacao.secoesFaltantes.forEach(key => {
      const [tipoDoc, assunto] = key.split('|');
      createDefaultSectionConfig(tipoDoc, assunto);
    });
  }

  // Verificar SEM_ASSUNTO faltantes para tipos sem assuntos
  if (validacao.semAssuntoFaltantes.length > 0) {
    // Configurações SEM_ASSUNTO faltantes detectadas
    // validacao.semAssuntoFaltantes;

    // Criar configurações SEM_ASSUNTO faltantes
    validacao.semAssuntoFaltantes.forEach(key => {
      const [tipoDoc] = key.split('|');
      if (tipoDoc === 'Mídia') {
        secaoConfiguracoes[key] = {
          section2: false,
          section3: true,
          section4: false,
        };
      } else {
        secaoConfiguracoes[key] = {
          section2: false,
          section3: false,
          section4: false,
        };
      }
    });
  }
}

/**
 * Cria configurações de seção padrão para uma combinação documento+assunto
 */
export function createDefaultSectionConfig(tipoDocumento: string, assunto: string): void {
  const key = `${tipoDocumento}|${assunto}`;

  if (!secaoConfiguracoes[key]) {
    secaoConfiguracoes[key] = {
      section2: false,
      section3: false,
      section4: false,
    };
  }
}

/**
 * Obtém os tipos de documento associados a um assunto específico
 * Faz o mapeamento reverso de documentoAssuntoConfig
 */
export function getDocumentosByAssunto(assuntoNome: string): string[] {
  const tiposDocumento: string[] = [];

  Object.entries(documentoAssuntoConfig).forEach(([tipoDoc, assuntos]) => {
    if (assuntos.includes(assuntoNome)) {
      tiposDocumento.push(tipoDoc);
    }
  });

  return tiposDocumento;
}

/**
 * Adiciona ou remove a associação entre um assunto e um tipo de documento
 */
export function toggleDocumentoAssunto(assuntoNome: string, tipoDocumento: string): void {
  // Garantir que o tipo de documento existe na configuração
  if (!documentoAssuntoConfig[tipoDocumento]) {
    documentoAssuntoConfig[tipoDocumento] = [];
  }

  const assuntosAtuais = documentoAssuntoConfig[tipoDocumento];

  if (assuntosAtuais.includes(assuntoNome)) {
    // Remove o assunto do tipo de documento
    documentoAssuntoConfig[tipoDocumento] = assuntosAtuais.filter(a => a !== assuntoNome);

    // Remover também a configuração de seção correspondente
    const sectionKey = `${tipoDocumento}|${assuntoNome}`;
    if (secaoConfiguracoes[sectionKey]) {
      delete secaoConfiguracoes[sectionKey];
    }
  } else {
    // Adiciona o assunto ao tipo de documento
    documentoAssuntoConfig[tipoDocumento] = [...assuntosAtuais, assuntoNome];

    // Criar configuração de seção padrão se não existir
    createDefaultSectionConfig(tipoDocumento, assuntoNome);
  }
}

/**
 * Verifica se um assunto está associado a um tipo de documento
 */
export function isAssuntoAssociadoAoDocumento(assuntoNome: string, tipoDocumento: string): boolean {
  const assuntos = documentoAssuntoConfig[tipoDocumento] || [];
  return assuntos.includes(assuntoNome);
}

/**
 * Detecta assuntos órfãos (que estão nas configurações mas foram removidos do cadastro)
 */
export function detectAssuntosOrfaos(): string[] {
  const assuntosValidos = mockAssuntos.map(a => a.nome);
  const assuntosOrfaos: string[] = [];

  Object.entries(documentoAssuntoConfig).forEach(([tipoDoc, assuntos]) => {
    assuntos.forEach(assunto => {
      if (!assuntosValidos.includes(assunto)) {
        assuntosOrfaos.push(`${tipoDoc} → ${assunto}`);
      }
    });
  });

  return assuntosOrfaos;
}

/**
 * Remove configurações SEM_ASSUNTO desnecessárias
 * (para tipos de documento que têm assuntos definidos)
 */
export function cleanupUnnecessarySemAssunto(): number {
  let removidas = 0;
  const keysToRemove: string[] = [];

  Object.keys(secaoConfiguracoes).forEach(key => {
    if (key.endsWith('|SEM_ASSUNTO')) {
      const [tipoDocumento] = key.split('|');
      const assuntosDoTipo = documentoAssuntoConfig[tipoDocumento] || [];

      // Se o tipo tem assuntos definidos, não deveria ter SEM_ASSUNTO
      if (assuntosDoTipo.length > 0) {
        keysToRemove.push(key);
      }
    }
  });

  keysToRemove.forEach(key => {
    delete secaoConfiguracoes[key];
    removidas++;
  });

  return removidas;
}

/**
 * Remove assuntos órfãos das configurações
 */
export function cleanupAssuntosOrfaos(): number {
  const assuntosValidos = mockAssuntos.map(a => a.nome);
  let removidos = 0;

  Object.keys(documentoAssuntoConfig).forEach(tipoDoc => {
    const assuntosOriginais = documentoAssuntoConfig[tipoDoc];
    const assuntosFiltrados = assuntosOriginais.filter(assunto =>
      assuntosValidos.includes(assunto)
    );

    if (assuntosFiltrados.length !== assuntosOriginais.length) {
      removidos += assuntosOriginais.length - assuntosFiltrados.length;
      documentoAssuntoConfig[tipoDoc] = assuntosFiltrados;
    }
  });

  return removidos;
}

/**
 * Detecta configurações de seção órfãs (que não têm associação válida em documentoAssuntoConfig)
 */
export function detectSecaoOrfas(): string[] {
  const configsOrfas: string[] = [];

  Object.keys(secaoConfiguracoes).forEach(key => {
    if (key.endsWith('|SEM_ASSUNTO')) {
      // Para SEM_ASSUNTO, validar se o tipo realmente não tem assuntos
      const [tipoDocumento] = key.split('|');
      const assuntosDoTipo = documentoAssuntoConfig[tipoDocumento] || [];

      // Se o tipo tem assuntos, SEM_ASSUNTO é órfã
      if (assuntosDoTipo.length > 0) {
        configsOrfas.push(key);
      }
    } else {
      // Para configurações normais, verificar se a associação existe
      const [tipoDocumento, assunto] = key.split('|');
      const assuntosDoTipo = documentoAssuntoConfig[tipoDocumento] || [];
      if (!assuntosDoTipo.includes(assunto)) {
        configsOrfas.push(key);
      }
    }
  });

  return configsOrfas;
}

/**
 * Remove configurações de seção órfãs
 */
export function removeOrphanSectionConfigs(): number {
  const configsOrfas = detectSecaoOrfas();
  let removidas = 0;

  configsOrfas.forEach(key => {
    delete secaoConfiguracoes[key];
    removidas++;
  });

  return removidas;
}

/**
 * Valida a consistência entre documentoAssuntoConfig e secaoConfiguracoes
 */
export function validateSystemConsistency(): {
  assuntosOrfaos: string[];
  secoesOrfas: string[];
  secoesFaltantes: string[];
  semAssuntoFaltantes: string[];
} {
  const assuntosOrfaos = detectAssuntosOrfaos();
  const secoesOrfas = detectSecaoOrfas();
  const secoesFaltantes: string[] = [];
  const semAssuntoFaltantes: string[] = [];

  // Verificar se todas as combinações válidas têm configuração de seção
  Object.entries(documentoAssuntoConfig).forEach(([tipoDoc, assuntos]) => {
    if (assuntos.length > 0) {
      // Tipos com assuntos: verificar se cada assunto tem configuração
      assuntos.forEach(assunto => {
        const key = `${tipoDoc}|${assunto}`;
        if (!secaoConfiguracoes[key]) {
          secoesFaltantes.push(key);
        }
      });
    } else {
      // Tipos sem assuntos: devem ter configuração SEM_ASSUNTO
      const semAssuntoKey = `${tipoDoc}|SEM_ASSUNTO`;
      if (!secaoConfiguracoes[semAssuntoKey]) {
        semAssuntoFaltantes.push(semAssuntoKey);
      }
    }
  });

  return {
    assuntosOrfaos,
    secoesOrfas,
    secoesFaltantes,
    semAssuntoFaltantes,
  };
}
