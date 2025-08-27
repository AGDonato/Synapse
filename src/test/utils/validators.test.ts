// src/test/utils/validators.test.ts

import { describe, it, expect } from 'vitest';

// Simple validation utility tests
describe('validators', () => {
  describe('email validation', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('admin@test-domain.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('required field validation', () => {
    const isRequired = (value: any): boolean => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== null && value !== undefined;
    };

    it('should validate required strings', () => {
      expect(isRequired('valid string')).toBe(true);
      expect(isRequired('  valid  ')).toBe(true);
      expect(isRequired('')).toBe(false);
      expect(isRequired('   ')).toBe(false);
    });

    it('should validate required arrays', () => {
      expect(isRequired([1, 2, 3])).toBe(true);
      expect(isRequired(['item'])).toBe(true);
      expect(isRequired([])).toBe(false);
    });

    it('should validate required values', () => {
      expect(isRequired(123)).toBe(true);
      expect(isRequired(0)).toBe(true);
      expect(isRequired(false)).toBe(true);
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
    });
  });

  describe('length validation', () => {
    const isValidLength = (value: string, min: number, max?: number): boolean => {
      if (typeof value !== 'string') return false;
      const length = value.trim().length;
      if (max === undefined) {
        return length >= min;
      }
      return length >= min && length <= max;
    };

    it('should validate minimum length', () => {
      expect(isValidLength('hello', 3)).toBe(true);
      expect(isValidLength('hi', 3)).toBe(false);
      expect(isValidLength('', 1)).toBe(false);
    });

    it('should validate length range', () => {
      expect(isValidLength('hello', 3, 10)).toBe(true);
      expect(isValidLength('hi', 3, 10)).toBe(false);
      expect(isValidLength('this is too long', 3, 10)).toBe(false);
    });

    it('should handle whitespace correctly', () => {
      expect(isValidLength('  hello  ', 5)).toBe(true);
      expect(isValidLength('  hi  ', 5)).toBe(false);
    });
  });

  describe('numeric validation', () => {
    const isValidNumber = (value: any, min?: number, max?: number): boolean => {
      const num = Number(value);
      if (isNaN(num)) return false;
      if (min !== undefined && num < min) return false;
      if (max !== undefined && num > max) return false;
      return true;
    };

    it('should validate numbers', () => {
      expect(isValidNumber(123)).toBe(true);
      expect(isValidNumber('456')).toBe(true);
      expect(isValidNumber('0')).toBe(true);
      expect(isValidNumber('-5')).toBe(true);
      expect(isValidNumber('abc')).toBe(false);
      expect(isValidNumber('')).toBe(false);
      expect(isValidNumber(' ')).toBe(false);
    });

    it('should validate number ranges', () => {
      expect(isValidNumber(5, 1, 10)).toBe(true);
      expect(isValidNumber(0, 1, 10)).toBe(false);
      expect(isValidNumber(15, 1, 10)).toBe(false);
    });

    it('should validate minimum values', () => {
      expect(isValidNumber(5, 3)).toBe(true);
      expect(isValidNumber(2, 3)).toBe(false);
    });
  });

  describe('date validation', () => {
    const isValidDate = (dateString: string): boolean => {
      if (!dateString) return false;
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date.getTime());
    };

    it('should validate date formats', () => {
      expect(isValidDate('2024-03-15')).toBe(true);
      expect(isValidDate('2024/03/15')).toBe(true);
      expect(isValidDate('March 15, 2024')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('2024-13-15')).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('32/01/2024')).toBe(false);
    });
  });
});