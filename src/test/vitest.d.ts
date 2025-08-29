/**
 * DEFINIÇÕES DE TIPOS PARA TESTES VITEST
 *
 * Este arquivo garante que o TypeScript reconheça corretamente:
 * - Matchers customizados do @testing-library/jest-dom
 * - Extensões do objeto expect do Vitest
 * - Tipos específicos para ambiente de teste
 */

import '@testing-library/jest-dom';

declare module 'vitest' {
  interface Assertion<T = any> extends jest.Matchers<void, T> {}
  interface AsymmetricMatchersContaining extends jest.Matchers<void, any> {}
}
