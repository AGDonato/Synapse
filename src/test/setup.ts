/**
 * CONFIGURAÇÃO INICIAL DOS TESTES
 *
 * Este módulo configura o ambiente de testes para todo o projeto.
 * Inclui funcionalidades para:
 * - Extensão do objeto expect com matchers do jest-dom
 * - Limpeza automática do DOM após cada teste
 * - Configuração global do Vitest com React Testing Library
 * - Garantia de isolamento entre testes
 * - Setup de matchers customizados para elementos React
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Estende o objeto expect com matchers úteis para testar elementos DOM
// Permite usar: expect(element).toBeInTheDocument(), toHaveClass(), etc.
expect.extend(matchers);

// Limpa o DOM após cada teste para garantir isolamento
// Previne vazamentos de estado entre testes diferentes
afterEach(() => {
  cleanup();
});
