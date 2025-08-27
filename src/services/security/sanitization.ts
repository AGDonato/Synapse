/**
 * Data Sanitization utilities for security
 * Prevents XSS, SQL injection, and other input-based attacks
 */

import { z } from 'zod';
import { typeGuards } from '../../utils/typeGuards';

interface SanitizationOptions {
  allowHtml?: boolean;
  allowScripts?: boolean;
  maxLength?: number;
  allowedTags?: string[];
  allowedAttributes?: string[];
}

class DataSanitizer {
  private readonly defaultOptions: SanitizationOptions = {
    allowHtml: false,
    allowScripts: false,
    maxLength: 10000,
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
    allowedAttributes: ['href', 'title', 'target'],
  };

  // HTML/XSS sanitization
  sanitizeHtml(input: string, options: SanitizationOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options };
    
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Truncate if too long
    if (opts.maxLength && sanitized.length > opts.maxLength) {
      sanitized = sanitized.substring(0, opts.maxLength);
    }

    if (!opts.allowHtml) {
      // Escape all HTML
      sanitized = this.escapeHtml(sanitized);
    } else {
      // Allow only specific tags
      sanitized = this.sanitizeAllowedHtml(sanitized, opts);
    }

    // Always remove scripts unless explicitly allowed
    if (!opts.allowScripts) {
      sanitized = this.removeScripts(sanitized);
    }

    return sanitized.trim();
  }

  // SQL injection prevention
  sanitizeSql(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove SQL injection patterns
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

  // Path traversal prevention
  sanitizeFilePath(path: string): string {
    if (!path || typeof path !== 'string') {
      return '';
    }

    // Remove path traversal attempts
    return path
      .replace(/\.\./g, '')
      .replace(/[<>:"|?*]/g, '')
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/')
      .trim();
  }

  // URL sanitization
  sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return '';
    }

    try {
      const urlObj = new URL(url);
      
      // Only allow safe protocols
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
      if (!allowedProtocols.includes(urlObj.protocol)) {
        return '';
      }

      // Remove dangerous characters
      return urlObj.toString().replace(/[<>"']/g, '');
    } catch {
      return '';
    }
  }

  // Email sanitization
  sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }

    // Basic email validation and sanitization
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const sanitized = email.toLowerCase().trim();
    
    return emailPattern.test(sanitized) ? sanitized : '';
  }

  // Phone number sanitization
  sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      return '';
    }

    // Keep only digits, spaces, parentheses, and hyphens
    return phone.replace(/[^0-9\s()+-]/g, '').trim();
  }

  // General text sanitization
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

  // Document number sanitization (CPF, CNPJ, etc.)
  sanitizeDocumentNumber(doc: string): string {
    if (!doc || typeof doc !== 'string') {
      return '';
    }

    // Keep only digits
    return doc.replace(/[^0-9]/g, '');
  }

  // Private helper methods
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
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Remove all script tags and event handlers
    const scripts = tempDiv.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // Remove event handler attributes
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(element => {
      // Remove event attributes (onclick, onload, etc.)
      for (let i = element.attributes.length - 1; i >= 0; i--) {
        const attr = element.attributes[i];
        if (attr.name.toLowerCase().startsWith('on')) {
          element.removeAttribute(attr.name);
        }
      }

      // Remove dangerous attributes
      const dangerousAttrs = ['style', 'class', 'id'];
      dangerousAttrs.forEach(attr => {
        element.removeAttribute(attr);
      });

      // Keep only allowed attributes
      if (options.allowedAttributes) {
        for (let i = element.attributes.length - 1; i >= 0; i--) {
          const attr = element.attributes[i];
          if (!options.allowedAttributes.includes(attr.name.toLowerCase())) {
            element.removeAttribute(attr.name);
          }
        }
      }
    });

    // Remove non-allowed tags
    if (options.allowedTags) {
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node: Element) => {
            return options.allowedTags!.includes(node.tagName.toLowerCase())
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          }
        }
      );

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
    // Remove script tags and their content
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  // Batch sanitization for objects
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

  // Validate and sanitize form data
  validateAndSanitizeForm<T extends Record<string, any>>(
    formData: T,
    validationRules: {
      [K in keyof T]?: {
        required?: boolean;
        type?: 'email' | 'url' | 'phone' | 'text' | 'html' | 'document';
        maxLength?: number;
        pattern?: RegExp;
        sanitize?: SanitizationOptions;
      }
    }
  ): { isValid: boolean; sanitized: T; errors: string[] } {
    const errors: string[] = [];
    const sanitized = { ...formData };

    Object.keys(validationRules).forEach(fieldName => {
      const key = fieldName as keyof T;
      const rule = validationRules[key]!;
      const value = sanitized[key];

      // Check required fields
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        errors.push(`${String(key)} is required`);
        return;
      }

      if (value && typeof value === 'string') {
        // Type-specific validation and sanitization
        switch (rule.type) {
          case 'email':
            sanitized[key] = this.sanitizeEmail(value) as T[keyof T];
            if (sanitized[key] === '' && value !== '') {
              errors.push(`${String(key)} must be a valid email`);
            }
            break;

          case 'url':
            sanitized[key] = this.sanitizeUrl(value) as T[keyof T];
            if (sanitized[key] === '' && value !== '') {
              errors.push(`${String(key)} must be a valid URL`);
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

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(sanitized[key] as string)) {
          errors.push(`${String(key)} format is invalid`);
        }

        // Length validation
        if (rule.maxLength && (sanitized[key] as string).length > rule.maxLength) {
          errors.push(`${String(key)} is too long (max ${rule.maxLength} characters)`);
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

export const sanitizer = new DataSanitizer();

// Convenience functions
export const sanitize = {
  html: (input: string, options?: SanitizationOptions) => sanitizer.sanitizeHtml(input, options),
  sql: (input: string) => sanitizer.sanitizeSql(input),
  path: (input: string) => sanitizer.sanitizeFilePath(input),
  url: (input: string) => sanitizer.sanitizeUrl(input),
  email: (input: string) => sanitizer.sanitizeEmail(input),
  phone: (input: string) => sanitizer.sanitizePhone(input),
  text: (input: string, maxLength?: number) => sanitizer.sanitizeText(input, maxLength),
  document: (input: string) => sanitizer.sanitizeDocumentNumber(input),
};