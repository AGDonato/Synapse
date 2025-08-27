/**
 * Tests for sanitization utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { sanitizer, sanitize } from '../../services/security/sanitization';

describe('Sanitization Utilities', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  describe('HTML Sanitization', () => {
    it('escapa HTML por padrão', () => {
      const input = '<script>alert("xss")</script><p>content</p>';
      const result = sanitizer.sanitizeHtml(input);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('&lt;script&gt;');
    });

    it('permite HTML específico quando configurado', () => {
      const input = '<p>Safe content</p><script>alert("xss")</script>';
      const result = sanitizer.sanitizeHtml(input, {
        allowHtml: true,
        allowedTags: ['p'],
      });
      
      expect(result).toContain('<p>Safe content</p>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('remove scripts mesmo quando HTML é permitido', () => {
      const input = '<p onclick="alert()">Click me</p><script>malicious()</script>';
      const result = sanitizer.sanitizeHtml(input, {
        allowHtml: true,
        allowedTags: ['p'],
        allowedAttributes: [],
      });
      
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('script');
      expect(result).not.toContain('malicious');
    });

    it('trunca texto muito longo', () => {
      const longText = 'a'.repeat(1000);
      const result = sanitizer.sanitizeHtml(longText, { maxLength: 100 });
      
      expect(result.length).toBeLessThanOrEqual(100);
    });

    it('remove null bytes', () => {
      const input = 'text\0with\0nulls';
      const result = sanitizer.sanitizeHtml(input);
      
      expect(result).not.toContain('\0');
      expect(result).toBe('textwithNulls');
    });
  });

  describe('SQL Sanitization', () => {
    it('remove comandos SQL perigosos', () => {
      const input = "'; DROP TABLE users; --";
      const result = sanitizer.sanitizeSql(input);
      
      expect(result).not.toContain('DROP');
      expect(result).not.toContain('TABLE');
      expect(result).not.toContain(';');
      expect(result).not.toContain('--');
    });

    it('remove palavras-chave SQL', () => {
      const sqlKeywords = [
        'SELECT * FROM users',
        'INSERT INTO table',
        'UPDATE table SET',
        'DELETE FROM table',
        'UNION SELECT',
        'EXEC procedure',
      ];

      sqlKeywords.forEach(sql => {
        const result = sanitizer.sanitizeSql(sql);
        expect(result).not.toMatch(/\b(SELECT|INSERT|UPDATE|DELETE|UNION|EXEC)\b/i);
      });
    });

    it('mantém texto normal', () => {
      const input = 'Este é um texto normal sem SQL';
      const result = sanitizer.sanitizeSql(input);
      
      expect(result).toBe(input);
    });
  });

  describe('File Path Sanitization', () => {
    it('remove tentativas de path traversal', () => {
      const input = '../../../etc/passwd';
      const result = sanitizer.sanitizeFilePath(input);
      
      expect(result).not.toContain('..');
      expect(result).toBe('etc/passwd');
    });

    it('remove caracteres perigosos', () => {
      const input = 'file<name>with:bad|chars?.txt';
      const result = sanitizer.sanitizeFilePath(input);
      
      expect(result).not.toMatch(/[<>:"|?*]/);
    });

    it('normaliza separadores de path', () => {
      const input = 'folder\\\\subfolder\\file.txt';
      const result = sanitizer.sanitizeFilePath(input);
      
      expect(result).toBe('folder/subfolder/file.txt');
    });
  });

  describe('URL Sanitization', () => {
    it('permite URLs seguros', () => {
      const safeUrls = [
        'https://example.com',
        'http://localhost:3000',
        'mailto:user@example.com',
        'tel:+5511999999999',
      ];

      safeUrls.forEach(url => {
        const result = sanitizer.sanitizeUrl(url);
        expect(result).toBe(url);
      });
    });

    it('bloqueia protocolos perigosos', () => {
      const dangerousUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'ftp://malicious.com',
      ];

      dangerousUrls.forEach(url => {
        const result = sanitizer.sanitizeUrl(url);
        expect(result).toBe('');
      });
    });

    it('remove caracteres perigosos de URLs válidos', () => {
      const input = 'https://example.com/<script>';
      const result = sanitizer.sanitizeUrl(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('https://example.com/');
    });

    it('lida com URLs malformados', () => {
      const malformedUrls = [
        'not-a-url',
        'http://',
        'https:////',
        '',
      ];

      malformedUrls.forEach(url => {
        const result = sanitizer.sanitizeUrl(url);
        expect(result).toBe('');
      });
    });
  });

  describe('Email Sanitization', () => {
    it('aceita emails válidos', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.com',
        'user123@example-domain.com',
      ];

      validEmails.forEach(email => {
        const result = sanitizer.sanitizeEmail(email);
        expect(result).toBe(email.toLowerCase());
      });
    });

    it('rejeita emails inválidos', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user space@example.com',
      ];

      invalidEmails.forEach(email => {
        const result = sanitizer.sanitizeEmail(email);
        expect(result).toBe('');
      });
    });

    it('normaliza para lowercase', () => {
      const input = 'USER@EXAMPLE.COM';
      const result = sanitizer.sanitizeEmail(input);
      
      expect(result).toBe('user@example.com');
    });
  });

  describe('Phone Sanitization', () => {
    it('mantém números de telefone válidos', () => {
      const validPhones = [
        '(11) 99999-9999',
        '11 9999-9999',
        '+55 11 99999-9999',
        '11999999999',
      ];

      validPhones.forEach(phone => {
        const result = sanitizer.sanitizePhone(phone);
        expect(result).toMatch(/^[\d\s()+-]+$/);
        expect(result.trim()).not.toBe('');
      });
    });

    it('remove caracteres não numéricos especiais', () => {
      const input = '(11) 99999-9999 ext. 123';
      const result = sanitizer.sanitizePhone(input);
      
      expect(result).not.toContain('ext');
      expect(result).not.toContain('.');
      expect(result).toMatch(/^[\d\s()+-]+$/);
    });
  });

  describe('Text Sanitization', () => {
    it('escapa caracteres HTML especiais', () => {
      const input = '<div>Hello & "world"</div>';
      const result = sanitizer.sanitizeText(input);
      
      expect(result).toContain('&lt;div&gt;');
      expect(result).toContain('&amp;');
      expect(result).toContain('&quot;world&quot;');
    });

    it('trunca texto longo', () => {
      const longText = 'a'.repeat(2000);
      const result = sanitizer.sanitizeText(longText, 500);
      
      expect(result.length).toBeLessThanOrEqual(500);
    });

    it('remove espaços em branco extras', () => {
      const input = '   text with   spaces   ';
      const result = sanitizer.sanitizeText(input);
      
      expect(result).toBe('text with   spaces');
    });
  });

  describe('Document Number Sanitization', () => {
    it('mantém apenas dígitos', () => {
      const inputs = [
        '123.456.789-00',
        'CPF: 123.456.789-00',
        '12345678900',
        'ABC123456789XYZ',
      ];

      inputs.forEach(input => {
        const result = sanitizer.sanitizeDocumentNumber(input);
        expect(result).toMatch(/^\d+$/);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('retorna string vazia para input inválido', () => {
      const invalidInputs = [null, undefined, '', 'ABC'];
      
      invalidInputs.forEach(input => {
        const result = sanitizer.sanitizeDocumentNumber(input as any);
        expect(result).toBe('');
      });
    });
  });

  describe('Batch Object Sanitization', () => {
    it('sanitiza objeto com regras específicas', () => {
      const obj = {
        name: '<script>alert()</script>John',
        email: 'JOHN@EXAMPLE.COM',
        description: 'Safe description',
        tags: ['<tag1>', 'tag2'],
      };

      const rules = {
        name: { allowHtml: false },
        email: { allowHtml: false },
        description: { allowHtml: true, allowedTags: ['p', 'b'] },
      };

      const result = sanitizer.sanitizeObject(obj, rules);

      expect(result.name).not.toContain('<script>');
      expect(result.email).toBe('john@example.com');
      expect(result.tags[0]).not.toContain('<tag1>');
    });
  });

  describe('Form Validation and Sanitization', () => {
    it('valida e sanitiza dados de formulário', () => {
      const formData = {
        name: '<b>John Doe</b>',
        email: 'JOHN@EXAMPLE.COM',
        phone: '(11) 99999-9999',
        website: 'https://example.com',
        description: 'User description with <script>alert()</script>',
      };

      const rules = {
        name: {
          required: true,
          type: 'text' as const,
          maxLength: 100,
        },
        email: {
          required: true,
          type: 'email' as const,
        },
        phone: {
          required: false,
          type: 'phone' as const,
        },
        website: {
          required: false,
          type: 'url' as const,
        },
        description: {
          required: false,
          type: 'html' as const,
          sanitize: { allowHtml: true, allowedTags: ['p', 'b', 'i'] },
        },
      };

      const result = sanitizer.validateAndSanitizeForm(formData, rules);

      expect(result.isValid).toBe(true);
      expect(result.sanitized.email).toBe('john@example.com');
      expect(result.sanitized.description).not.toContain('<script>');
      expect(result.errors.length).toBe(0);
    });

    it('retorna erros para dados inválidos', () => {
      const formData = {
        name: '',
        email: 'invalid-email',
        phone: '123',
      };

      const rules = {
        name: {
          required: true,
          type: 'text' as const,
        },
        email: {
          required: true,
          type: 'email' as const,
        },
      };

      const result = sanitizer.validateAndSanitizeForm(formData, rules);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('name'))).toBe(true);
      expect(result.errors.some(error => error.includes('email'))).toBe(true);
    });
  });

  describe('Convenience Functions', () => {
    it('funções de conveniência funcionam corretamente', () => {
      expect(sanitize.html('<script>test</script>')).not.toContain('<script>');
      expect(sanitize.sql("'; DROP TABLE users; --")).not.toContain('DROP');
      expect(sanitize.path('../../../etc/passwd')).not.toContain('..');
      expect(sanitize.url('https://example.com')).toBe('https://example.com');
      expect(sanitize.email('TEST@EXAMPLE.COM')).toBe('test@example.com');
      expect(sanitize.phone('(11) 99999-9999')).toMatch(/[\d\s()-]/);
      expect(sanitize.text('<div>test</div>')).toContain('&lt;div&gt;');
      expect(sanitize.document('123.456.789-00')).toBe('12345678900');
    });
  });
});