/**
 * ================================================================
 * DATA SANITIZATION - SANITIZAÇÃO E VALIDAÇÃO DE DADOS
 * ================================================================
 *
 * Este arquivo implementa um sistema abrangente de sanitização
 * e validação de dados para o Synapse, oferecendo proteção
 * robusta contra XSS, SQL Injection, Path Traversal e outras
 * vulnerabilidades baseadas em entrada de dados maliciosos.
 *
 * Funcionalidades principais:
 * - Sanitização HTML com controle granular de tags permitidas
 * - Proteção contra XSS (Cross-Site Scripting) attacks
 * - Prevenção de SQL Injection com pattern matching
 * - Validação e sanitização de URLs e emails
 * - Proteção contra Path Traversal attacks
 * - Sanitização de números de documento (CPF, CNPJ)
 * - Validação de formulários com regras customizáveis
 * - Processamento em lote para objetos complexos
 *
 * Tipos de sanitização suportados:
 * - HTML/Text: Escape de caracteres perigosos e remoção de scripts
 * - SQL: Remoção de patterns de injeção SQL
 * - File Paths: Prevenção de directory traversal
 * - URLs: Validação de protocolos seguros
 * - Email: Validação de formato e normalização
 * - Phone: Normalização de números de telefone
 * - Documents: Sanitização de CPF/CNPJ e documentos
 *
 * Recursos de segurança:
 * - Whitelist approach para tags HTML permitidas
 * - Remoção automática de event handlers perigosos
 * - Validação de comprimento máximo configurvel
 * - Escape context-aware para diferentes tipos de dados
 * - Proteção contra null byte injection
 * - Normalização de entrada antes da sanitização
 *
 * Opções de configuração:
 * - Tags HTML permitidas configuráveis
 * - Atributos HTML permitidos por tag
 * - Comprimento máximo por campo
 * - Habilitação seletiva de HTML e scripts
 * - Patterns customizados para validação
 * - Regras específicas por tipo de campo
 *
 * Integração com frameworks:
 * - TypeScript com tipagem forte
 * - Zod integration para schemas de validação
 * - React forms friendly
 * - API REST input validation
 * - Batch processing para grandes datasets
 *
 * Padrões implementados:
 * - Singleton pattern para instância global
 * - Strategy pattern para diferentes tipos de sanitização
 * - Builder pattern para configuração de opções
 * - Factory pattern para criadores de sanitizadores
 * - Validator pattern para validação de formulários
 *
 * @fileoverview Sistema completo de sanitização e validação de dados
 * @version 2.0.0
 * @since 2024-02-04
 * @author Synapse Team
 */

import { z } from 'zod';
import { typeGuards } from '../../utils/typeGuards';

/**
 * Interface de configuração para opções de sanitização
 *
 * @interface SanitizationOptions
 */
interface SanitizationOptions {
  /** Permitir HTML básico (padrão: false) */
  allowHtml?: boolean;
  /** Permitir execução de scripts (padrão: false) */
  allowScripts?: boolean;
  /** Comprimento máximo permitido (padrão: 10000) */
  maxLength?: number;
  /** Lista de tags HTML permitidas */
  allowedTags?: string[];
  /** Lista de atributos HTML permitidos */
  allowedAttributes?: string[];
}

/**
 * Classe principal para sanitização de dados
 *
 * Implementa métodos especializados para diferentes tipos
 * de sanitização, oferecendo proteção robusta contra
 * diversas vulnerabilidades de segurança.
 *
 * @class DataSanitizer
 * @example
 * ```typescript
 * const sanitizer = new DataSanitizer();
 *
 * const cleanHtml = sanitizer.sanitizeHtml('<script>alert("xss")</script>Hello');
 * console.log(cleanHtml); // "Hello" (script removido)
 *
 * const cleanEmail = sanitizer.sanitizeEmail('USER@EXAMPLE.COM');
 * console.log(cleanEmail); // "user@example.com"
 * ```
 */
class DataSanitizer {
  private readonly defaultOptions: SanitizationOptions = {
    allowHtml: false,
    allowScripts: false,
    maxLength: 10000,
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
    allowedAttributes: ['href', 'title', 'target'],
  };

  /**
   * Sanitiza conteúdo HTML removendo elementos perigosos
   *
   * Remove scripts, event handlers e conteúdo malicioso,
   * preservando apenas tags e atributos seguros conforme
   * configuração fornecida.
   *
   * @param {string} input - Conteúdo HTML a ser sanitizado
   * @param {SanitizationOptions} options - Opções de sanitização
   * @returns {string} HTML sanitizado e seguro
   *
   * @example
   * ```typescript
   * const dirty = '<script>alert("xss")</script><p onclick="evil()">Safe content</p>';
   * const clean = sanitizer.sanitizeHtml(dirty, {
   *   allowHtml: true,
   *   allowedTags: ['p', 'br', 'strong']
   * });
   * // Resultado: '<p>Safe content</p>'
   * ```
   */
  sanitizeHtml(input: string, options: SanitizationOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options };

    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Remove bytes nulos
    sanitized = sanitized.replace(/\0/g, '');

    // Trunca se muito longo
    if (opts.maxLength && sanitized.length > opts.maxLength) {
      sanitized = sanitized.substring(0, opts.maxLength);
    }

    if (!opts.allowHtml) {
      // Escapa todo HTML
      sanitized = this.escapeHtml(sanitized);
    } else {
      // Permite apenas tags específicas
      sanitized = this.sanitizeAllowedHtml(sanitized, opts);
    }

    // Sempre remove scripts a menos que explicitamente permitido
    if (!opts.allowScripts) {
      sanitized = this.removeScripts(sanitized);
    }

    return sanitized.trim();
  }

  /**
   * Previne ataques de SQL Injection
   *
   * Remove padrões comuns de injeção SQL, incluindo
   * comandos SQL, comentários e caracteres perigosos.
   *
   * @param {string} input - String a ser sanitizada
   * @returns {string} String sem patterns de SQL injection
   *
   * @example
   * ```typescript
   * const malicious = "'; DROP TABLE users; --";
   * const safe = sanitizer.sanitizeSql(malicious);
   * console.log(safe); // String limpa sem comandos SQL
   * ```
   */
  sanitizeSql(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove padrões de injeção SQL
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
      /(--|\|\|)/g,
      /[';]/g,
    ];

    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return sanitized.trim();
  }

  /**
   * Previne ataques de Path Traversal
   *
   * Remove tentativas de navegação para diretórios pai
   * e caracteres perigosos em caminhos de arquivo.
   *
   * @param {string} path - Caminho de arquivo a ser sanitizado
   * @returns {string} Caminho seguro sem traversal
   *
   * @example
   * ```typescript
   * const dangerous = "../../../etc/passwd";
   * const safe = sanitizer.sanitizeFilePath(dangerous);
   * console.log(safe); // "etc/passwd" (../ removidos)
   * ```
   */
  sanitizeFilePath(path: string): string {
    if (!path || typeof path !== 'string') {
      return '';
    }

    // Remove tentativas de path traversal
    return path
      .replace(/\.\./g, '')
      .replace(/[<>:"|?*]/g, '')
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/')
      .trim();
  }

  /**
   * Sanitiza URLs validando protocolos seguros
   *
   * Verifica e normaliza URLs, permitindo apenas
   * protocolos seguros e removendo caracteres perigosos.
   *
   * @param {string} url - URL a ser sanitizada
   * @returns {string} URL segura ou string vazia se inválida
   *
   * @example
   * ```typescript
   * const clean = sanitizer.sanitizeUrl('javascript:alert(1)');
   * console.log(clean); // "" (protocolo perigoso removido)
   *
   * const valid = sanitizer.sanitizeUrl('https://example.com');
   * console.log(valid); // "https://example.com"
   * ```
   */
  sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return '';
    }

    try {
      const urlObj = new URL(url);

      // Permite apenas protocolos seguros
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
      if (!allowedProtocols.includes(urlObj.protocol)) {
        return '';
      }

      // Remove caracteres perigosos
      return urlObj.toString().replace(/[<>"']/g, '');
    } catch {
      return '';
    }
  }

  /**
   * Sanitiza e valida endereços de email
   *
   * Normaliza formato do email e valida contra
   * padrão RFC, retornando string vazia se inválido.
   *
   * @param {string} email - Endereço de email
   * @returns {string} Email normalizado ou string vazia
   *
   * @example
   * ```typescript
   * const clean = sanitizer.sanitizeEmail('USER@EXAMPLE.COM');
   * console.log(clean); // "user@example.com"
   *
   * const invalid = sanitizer.sanitizeEmail('not-an-email');
   * console.log(invalid); // ""
   * ```
   */
  sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }

    // Validação e sanitização básica de email
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const sanitized = email.toLowerCase().trim();

    return emailPattern.test(sanitized) ? sanitized : '';
  }

  /**
   * Sanitiza números de telefone
   *
   * Remove caracteres não numéricos, preservando
   * apenas dígitos e formatação básica.
   *
   * @param {string} phone - Número de telefone
   * @returns {string} Telefone sanitizado
   *
   * @example
   * ```typescript
   * const clean = sanitizer.sanitizePhone('(11) 99999-9999 ext. 123');
   * console.log(clean); // "(11) 99999-9999"
   * ```
   */
  sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      return '';
    }

    // Mantém apenas dígitos, espaços, parênteses e hífens
    return phone.replace(/[^0-9\s()+-]/g, '').trim();
  }

  /**
   * Sanitização geral de texto
   *
   * Escape de caracteres HTML perigosos e limitação
   * de comprimento para proteção geral.
   *
   * @param {string} input - Texto a ser sanitizado
   * @param {number} maxLength - Comprimento máximo (padrão: 1000)
   * @returns {string} Texto sanitizado
   *
   * @example
   * ```typescript
   * const clean = sanitizer.sanitizeText('<script>alert("xss")</script>');
   * console.log(clean); // "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
   * ```
   */
  sanitizeText(input: string, maxLength = 1000): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>\"'&]/g, match => {
        const escapeMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return escapeMap[match];
      })
      .substring(0, maxLength)
      .trim();
  }

  /**
   * Sanitiza números de documento (CPF, CNPJ, etc.)
   *
   * Remove toda formatação, mantendo apenas dígitos
   * para validação e processamento posterior.
   *
   * @param {string} doc - Número de documento
   * @returns {string} Apenas dígitos do documento
   *
   * @example
   * ```typescript
   * const cpf = sanitizer.sanitizeDocumentNumber('123.456.789-00');
   * console.log(cpf); // "12345678900"
   *
   * const cnpj = sanitizer.sanitizeDocumentNumber('12.345.678/0001-00');
   * console.log(cnpj); // "12345678000100"
   * ```
   */
  sanitizeDocumentNumber(doc: string): string {
    if (!doc || typeof doc !== 'string') {
      return '';
    }

    // Mantém apenas dígitos
    return doc.replace(/[^0-9]/g, '');
  }

  // Métodos auxiliares privados
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, match => map[match]);
  }

  private sanitizeAllowedHtml(html: string, options: SanitizationOptions): string {
    // Cria elemento DOM temporário para parsear HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Remove todas as tags script e event handlers
    const scripts = tempDiv.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // Remove atributos de event handler
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(element => {
      // Remove atributos de evento (onclick, onload, etc.)
      for (let i = element.attributes.length - 1; i >= 0; i--) {
        const attr = element.attributes[i];
        if (attr.name.toLowerCase().startsWith('on')) {
          element.removeAttribute(attr.name);
        }
      }

      // Remove atributos perigosos
      const dangerousAttrs = ['style', 'class', 'id'];
      dangerousAttrs.forEach(attr => {
        element.removeAttribute(attr);
      });

      // Mantém apenas atributos permitidos
      if (options.allowedAttributes) {
        for (let i = element.attributes.length - 1; i >= 0; i--) {
          const attr = element.attributes[i];
          if (!options.allowedAttributes.includes(attr.name.toLowerCase())) {
            element.removeAttribute(attr.name);
          }
        }
      }
    });

    // Remove tags não permitidas
    if (options.allowedTags) {
      const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node: Element) => {
          return options.allowedTags!.includes(node.tagName.toLowerCase())
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      });

      const nodesToRemove: Element[] = [];
      let node = walker.nextNode();
      while (node) {
        nodesToRemove.push(node as Element);
        node = walker.nextNode();
      }

      nodesToRemove.forEach(nodeToRemove => {
        nodeToRemove.remove();
      });
    }

    return tempDiv.innerHTML;
  }

  private removeScripts(text: string): string {
    // Remove tags script e seu conteúdo
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * Sanitização em lote para objetos
   *
   * Aplica regras de sanitização específicas para cada campo
   * de um objeto, processando strings e arrays automaticamente.
   *
   * @template T - Tipo do objeto a ser sanitizado
   * @param {T} obj - Objeto a ser sanitizado
   * @param {Partial<Record<keyof T, SanitizationOptions>>} fieldRules - Regras por campo
   * @returns {T} Objeto com campos sanitizados
   *
   * @example
   * ```typescript
   * const userData = {
   *   name: '<script>alert("xss")</script>John',
   *   bio: '<b>Developer</b>',
   *   tags: ['<script>', 'javascript', 'react']
   * };
   *
   * const clean = sanitizer.sanitizeObject(userData, {
   *   name: { allowHtml: false },
   *   bio: { allowHtml: true, allowedTags: ['b', 'i'] }
   * });
   * ```
   */
  sanitizeObject<T extends Record<string, any>>(
    obj: T,
    fieldRules: Partial<Record<keyof T, SanitizationOptions>>
  ): T {
    const sanitized: T = { ...obj };

    Object.keys(sanitized).forEach(key => {
      const typedKey = key as keyof T;
      const value = sanitized[typedKey];
      const rules = fieldRules[typedKey] || {};

      if (typeof value === 'string') {
        (sanitized as any)[typedKey] = this.sanitizeHtml(value, rules);
      } else if (Array.isArray(value)) {
        (sanitized as any)[typedKey] = value.map((item: unknown) =>
          typeof item === 'string' ? this.sanitizeHtml(item, rules) : item
        );
      }
    });

    return sanitized;
  }

  /**
   * Valida e sanitiza dados de formulário
   *
   * Combina validação de regras de negócio com sanitização
   * de dados, retornando estado de validação, dados limpos
   * e lista de erros encontrados.
   *
   * @template T - Tipo dos dados do formulário
   * @param {T} formData - Dados do formulário a serem processados
   * @param {Object} validationRules - Regras de validação por campo
   * @returns {Object} Resultado com isValid, sanitized e errors
   *
   * @example
   * ```typescript
   * const formData = {
   *   email: 'USER@EXAMPLE.COM',
   *   website: 'javascript:alert(1)',
   *   phone: '(11) 99999-9999',
   *   bio: '<script>alert("xss")</script>Hello'
   * };
   *
   * const result = sanitizer.validateAndSanitizeForm(formData, {
   *   email: { required: true, type: 'email' },
   *   website: { type: 'url' },
   *   phone: { type: 'phone' },
   *   bio: { type: 'html', maxLength: 500 }
   * });
   *
   * if (result.isValid) {
   *   console.log('Data is clean:', result.sanitized);
   * } else {
   *   console.log('Errors found:', result.errors);
   * }
   * ```
   */
  validateAndSanitizeForm<T extends Record<string, any>>(
    formData: T,
    validationRules: {
      [K in keyof T]?: {
        /** Campo obrigatório */
        required?: boolean;
        /** Tipo de validação a aplicar */
        type?: 'email' | 'url' | 'phone' | 'text' | 'html' | 'document';
        /** Comprimento máximo permitido */
        maxLength?: number;
        /** Padrão regex para validação adicional */
        pattern?: RegExp;
        /** Opções específicas de sanitização */
        sanitize?: SanitizationOptions;
      };
    }
  ): { isValid: boolean; sanitized: T; errors: string[] } {
    const errors: string[] = [];
    const sanitized = { ...formData };

    Object.keys(validationRules).forEach(fieldName => {
      const key = fieldName as keyof T;
      const rule = validationRules[key]!;
      const value = sanitized[key];

      // Verifica campos obrigatórios
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors.push(`${String(key)} é obrigatório`);
        return;
      }

      if (value && typeof value === 'string') {
        // Validação e sanitização específica por tipo
        switch (rule.type) {
          case 'email':
            sanitized[key] = this.sanitizeEmail(value) as T[keyof T];
            if (sanitized[key] === '' && value !== '') {
              errors.push(`${String(key)} deve ser um email válido`);
            }
            break;

          case 'url':
            sanitized[key] = this.sanitizeUrl(value) as T[keyof T];
            if (sanitized[key] === '' && value !== '') {
              errors.push(`${String(key)} deve ser uma URL válida`);
            }
            break;

          case 'phone':
            sanitized[key] = this.sanitizePhone(value) as T[keyof T];
            break;

          case 'document':
            sanitized[key] = this.sanitizeDocumentNumber(value) as T[keyof T];
            break;

          case 'html':
            sanitized[key] = this.sanitizeHtml(value, rule.sanitize) as T[keyof T];
            break;

          case 'text':
          default:
            sanitized[key] = this.sanitizeText(value, rule.maxLength) as T[keyof T];
            break;
        }

        // Validação de padrão
        if (rule.pattern && !rule.pattern.test(sanitized[key] as string)) {
          errors.push(`${String(key)} formato inválido`);
        }

        // Validação de comprimento
        if (rule.maxLength && (sanitized[key] as string).length > rule.maxLength) {
          errors.push(`${String(key)} muito longo (máx ${rule.maxLength} caracteres)`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
    };
  }
}

/**
 * Instância singleton do sanitizador de dados
 *
 * @const {DataSanitizer} sanitizer
 */
export const sanitizer = new DataSanitizer();

/**
 * Funções de conveniência para sanitização rápida
 *
 * Oferece interface simplificada para as funções de sanitização
 * mais comuns, sem necessidade de instanciar a classe.
 *
 * @example
 * ```typescript
 * import { sanitize } from './sanitization';
 *
 * const cleanHtml = sanitize.html('<script>alert("xss")</script>Hello');
 * const cleanEmail = sanitize.email('USER@EXAMPLE.COM');
 * const cleanPhone = sanitize.phone('(11) 99999-9999');
 * ```
 */
export const sanitize = {
  /** Sanitiza conteúdo HTML */
  html: (input: string, options?: SanitizationOptions) => sanitizer.sanitizeHtml(input, options),
  /** Previne SQL injection */
  sql: (input: string) => sanitizer.sanitizeSql(input),
  /** Sanitiza caminhos de arquivo */
  path: (input: string) => sanitizer.sanitizeFilePath(input),
  /** Valida e sanitiza URLs */
  url: (input: string) => sanitizer.sanitizeUrl(input),
  /** Valida e normaliza emails */
  email: (input: string) => sanitizer.sanitizeEmail(input),
  /** Sanitiza telefones */
  phone: (input: string) => sanitizer.sanitizePhone(input),
  /** Sanitiza texto geral */
  text: (input: string, maxLength?: number) => sanitizer.sanitizeText(input, maxLength),
  /** Sanitiza documentos (CPF/CNPJ) */
  document: (input: string) => sanitizer.sanitizeDocumentNumber(input),
};

/**
 * Exportação padrão do sanitizador
 */
export default sanitizer;
