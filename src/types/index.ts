/**
 * ÍNDICE CENTRAL DE TIPOS DO SISTEMA
 *
 * Este módulo centraliza todas as definições de tipos do sistema para facilitar importações.
 * Inclui funcionalidades para:
 * - Re-exportação de todas as interfaces de entidades do domínio
 * - Tipos de API e estruturas de resposta padronizadas
 * - Componentes de UI e suas propriedades
 * - Schemas de validação para consistência de dados
 * - Ponto único de importação para organização do código
 * - Estrutura modular que facilita manutenção de tipos
 */

// Re-exporta todos os tipos para facilitar importações
export type * from './entities';
export type * from './api';
export type * from './ui';

// Re-exporta tipos de schema para validação
export * from '../schemas/entities';
