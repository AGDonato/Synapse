/**
 * AUXILIARES DE MANIPULAÇÃO DE DOCUMENTOS
 *
 * Este módulo contém funções auxiliares específicas para operações com documentos.
 * Inclui funcionalidades para:
 * - Gerenciamento de destinatários e endereçamentos dinâmicos
 * - Validação e formatação de números e anos de documentos
 * - Processamento de identificadores de pesquisa (CPF, CNPJ, telefone, etc.)
 * - Validação de hashes e tamanhos de mídia
 * - Formatação automática de dados conforme padrões brasileiros
 * - Suporte para ofícios circulares e múltiplos destinatários
 */

import { mockProvedores } from '../data/mockProvedores';
import { mockOrgaos } from '../data/mockOrgaos';

/**
 * Obtém lista de endereçamentos disponíveis baseado no destinatário selecionado
 * Lógica: provedores têm endereçamento fixo (razãoSocial), autoridades usam lista de órgãos
 * @param destinatario - Nome do destinatário selecionado
 * @returns Array com endereçamentos possíveis para o destinatário
 */
export const getEnderecamentos = (destinatario: string): string[] => {
  // Se não há destinatário, retorna lista vazia
  if (!destinatario) {
    return [];
  }

  // Busca o provedor correspondente pelo nomeFantasia
  const provedorEncontrado = mockProvedores.find(
    provedor => provedor.nomeFantasia === destinatario
  );

  // Se encontrou o provedor, retorna a razaoSocial como única opção
  if (provedorEncontrado) {
    return [provedorEncontrado.razaoSocial];
  }

  // Se não é um provedor (é uma autoridade), retorna lista de órgãos
  return mockOrgaos.map(orgao => orgao.nomeCompleto);
};

/**
 * Converte string de destinatários separada por vírgula em array
 * Remove espaços extras e filtra entradas vazias
 * @param destinatarioString - String com destinatários separados por vírgula
 * @returns Array com destinatários individuais limpos
 */
export const parseDestinatarios = (destinatarioString: string): string[] => {
  if (!destinatarioString) {
    return [];
  }

  // Remove espaços extras e separa por vírgula
  return destinatarioString
    .split(',')
    .map(dest => dest.trim())
    .filter(dest => dest.length > 0);
};

/**
 * Formata destinatários de array para string
 */
export const formatDestinatarios = (destinatarios: string[]): string => {
  return destinatarios.join(', ');
};

/**
 * Verifica se um destinatário é um provedor
 */
export const isProvedor = (destinatario: string): boolean => {
  return mockProvedores.some(provedor => provedor.nomeFantasia === destinatario);
};

/**
 * Obtém razão social de um provedor pelo nome fantasia
 */
export const getRazaoSocialByNomeFantasia = (nomeFantasia: string): string | null => {
  const provedor = mockProvedores.find(p => p.nomeFantasia === nomeFantasia);
  return provedor?.razaoSocial || null;
};

/**
 * Obtém endereçamento padrão para Ofício Circular
 */
export const getEnderecamentoOficioCircular = (): string => {
  return 'Respectivos departamentos jurídicos';
};

/**
 * Valida se um número de documento está no formato correto
 */
export const validateNumeroDocumento = (numero: string): boolean => {
  // Deve ser um número entre 1 e 9999
  const num = parseInt(numero, 10);
  return !isNaN(num) && num >= 1 && num <= 9999;
};

/**
 * Valida se um ano de documento está no formato correto
 */
export const validateAnoDocumento = (ano: string): boolean => {
  // Deve ser um ano de 4 dígitos entre 2000 e o ano atual + 1
  const anoNum = parseInt(ano, 10);
  const anoAtual = new Date().getFullYear();
  return !isNaN(anoNum) && anoNum >= 2000 && anoNum <= anoAtual + 1;
};

/**
 * Gera lista de anos disponíveis para seleção
 */
export const getAnosDisponiveis = (): string[] => {
  const anoAtual = new Date().getFullYear();
  const anos: string[] = [];

  // Do ano atual + 1 até 2000
  for (let ano = anoAtual + 1; ano >= 2000; ano--) {
    anos.push(ano.toString());
  }

  return anos;
};

/**
 * Formata hash de mídia (remove espaços e converte para lowercase)
 */
export const formatHashMidia = (hash: string): string => {
  return hash.replace(/\s/g, '').toLowerCase();
};

/**
 * Valida formato de hash de mídia
 */
export const validateHashMidia = (hash: string): boolean => {
  // Hash deve ter entre 32 e 128 caracteres hexadecimais
  const cleanHash = formatHashMidia(hash);
  return /^[a-f0-9]{32,128}$/.test(cleanHash);
};

/**
 * Valida formato de tamanho de mídia
 */
export const validateTamanhoMidia = (tamanho: string): boolean => {
  // Formato: número + unidade (GB, MB, KB, TB)
  return /^\d+(\.\d+)?\s*(GB|MB|KB|TB)$/i.test(tamanho.trim());
};

/**
 * Formata identificador de pesquisa baseado no tipo
 */
export const formatIdentificadorPesquisa = (tipo: string, valor: string): string => {
  const cleanValue = valor.replace(/\D/g, '');

  switch (tipo) {
    case 'CPF':
      // Formato: 000.000.000-00
      if (cleanValue.length === 11) {
        return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
      break;

    case 'CNPJ':
      // Formato: 00.000.000/0000-00
      if (cleanValue.length === 14) {
        return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
      break;

    case 'Telefone':
      // Formato: (00) 00000-0000 ou (00) 0000-0000
      if (cleanValue.length === 11) {
        return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (cleanValue.length === 10) {
        return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      }
      break;

    case 'Placa de Veículo':
      // Formato: ABC1234 ou ABC1D23
      return valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  return valor;
};

/**
 * Valida identificador de pesquisa baseado no tipo
 * Verifica formato e estrutura conforme padrões brasileiros
 * @param tipo - Tipo de identificador (CPF, CNPJ, Telefone, E-mail, etc.)
 * @param identificador - Valor do identificador a ser validado
 * @returns Mensagem de erro ou null se válido
 */
export const validateIdentificadorPesquisa = (
  tipo: string,
  identificador: string
): string | null => {
  if (!identificador.trim()) {
    return null;
  }

  switch (tipo) {
    case 'CPF':
      if (!/^\d{11}$/.test(identificador.replace(/\D/g, ''))) {
        return 'CPF deve ter 11 dígitos';
      }
      break;

    case 'CNPJ':
      if (!/^\d{14}$/.test(identificador.replace(/\D/g, ''))) {
        return 'CNPJ deve ter 14 dígitos';
      }
      break;

    case 'Telefone':
      if (!/^\d{10,11}$/.test(identificador.replace(/\D/g, ''))) {
        return 'Telefone deve ter 10 ou 11 dígitos';
      }
      break;

    case 'E-mail':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identificador)) {
        return 'E-mail inválido';
      }
      break;

    case 'Endereço IP':
      if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(identificador)) {
        return 'IP deve ter formato xxx.xxx.xxx.xxx';
      }
      break;

    case 'Placa de Veículo':
      if (!/^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/.test(identificador.replace(/[^A-Z0-9]/g, ''))) {
        return 'Placa inválida (formato: ABC1234 ou ABC1D23)';
      }
      break;
  }

  return null;
};
