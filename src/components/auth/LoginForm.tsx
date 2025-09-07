// src/components/auth/LoginForm.tsx
import React, { useCallback, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Toast } from '../ui';
// import { useFormValidation, validationRules } from '../../hooks/validation'; // Moved to _trash
import styles from './LoginForm.module.css';

// Simple validation functions (replacing moved hooks)
const validationRules = {
  required: (message: string) => (value: string) => (value.trim() ? null : message),
  email: (message: string) => (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : message,
  minLength: (min: number, message: string) => (value: string) =>
    value.length >= min ? null : message,
};

interface LoginFormData {
  email: string;
  password: string;
}

const loginValidationSchema = {
  email: [validationRules.required('Email é obrigatório'), validationRules.email('Email inválido')],
  password: [
    validationRules.required('Senha é obrigatória'),
    validationRules.minLength(6, 'Senha deve ter pelo menos 6 caracteres'),
  ],
};

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'warning' | 'success'>('error');

  const { login, isLoading, error, clearError } = useAuth();

  // Simple validation functions (replacing moved hook)
  const validateForm = useCallback((data: LoginFormData) => {
    const errors: Partial<Record<keyof LoginFormData, string>> = {};

    // Validate email
    const emailValidators = loginValidationSchema.email;
    for (const validator of emailValidators) {
      const result = validator(data.email);
      if (result) {
        errors.email = result;
        break;
      }
    }

    // Validate password
    const passwordValidators = loginValidationSchema.password;
    for (const validator of passwordValidators) {
      const result = validator(data.password);
      if (result) {
        errors.password = result;
        break;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  const getFieldError = useCallback((fieldName: keyof LoginFormData, value: string) => {
    const validators = loginValidationSchema[fieldName];
    for (const validator of validators) {
      const result = validator(value);
      if (result) return result;
    }
    return null;
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));

      // Clear auth error when user starts typing
      if (error) {
        clearError();
      }
    },
    [error, clearError]
  );

  // Wrapper functions for the Input component's onChange signature
  const handleEmailChange = useCallback(
    (value: string) => {
      setFormData(prev => ({ ...prev, email: value }));
      if (error) clearError();
    },
    [error, clearError]
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      setFormData(prev => ({ ...prev, password: value }));
      if (error) clearError();
    },
    [error, clearError]
  );

  const getInputClassName = useCallback(
    (fieldName: keyof LoginFormData) => {
      const fieldError = getFieldError(fieldName, formData[fieldName]);
      return fieldError ? `${styles.input} ${styles.inputError}` : styles.input;
    },
    [formData, getFieldError]
  );

  const showToastMessage = useCallback((message: string, type: 'error' | 'warning' | 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearError();

      // Validate form
      const validation = validateForm(formData);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        if (firstError) {
          showToastMessage(firstError, 'warning');
        }
        return;
      }

      try {
        await login(formData.email, formData.password);
        showToastMessage('Login realizado com sucesso!', 'success');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro no login';
        showToastMessage(errorMessage, 'error');
      }
    },
    [formData, login, validateForm, showToastMessage, clearError]
  );

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <img src='/synapse-icon.svg' alt='Synapse' className={styles.logo} />
          <h1 className={styles.title}>Synapse</h1>
          <p className={styles.subtitle}>Sistema de Gerenciamento de Demandas</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label htmlFor='email' className={styles.label}>
              Email
            </label>
            <Input
              type='email'
              value={formData.email}
              onChange={handleEmailChange}
              placeholder='seu@email.com'
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor='password' className={styles.label}>
              Senha
            </label>
            <Input
              type='password'
              value={formData.password}
              onChange={handlePasswordChange}
              placeholder='••••••••'
              disabled={isLoading}
            />
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <Button type='submit' className={styles.loginButton} disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className={styles.loginFooter}>
          <p className={styles.helpText}>
            Problemas para acessar? Entre em contato com o administrador.
          </p>
        </div>
      </div>

      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};
