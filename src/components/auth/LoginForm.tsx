// src/components/auth/LoginForm.tsx
import React, { useCallback, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Form, Input, Toast } from '../ui';
import { useFormValidation, validationRules } from '../../hooks/validation';
import styles from './LoginForm.module.css';

interface LoginFormData {
  email: string;
  password: string;
}

const loginValidationSchema = {
  email: [
    validationRules.required('Email é obrigatório'),
    validationRules.email('Email inválido')
  ],
  password: [
    validationRules.required('Senha é obrigatória'),
    validationRules.minLength(6, 'Senha deve ter pelo menos 6 caracteres')
  ]
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
  const { validateForm, getFieldError } = useFormValidation(loginValidationSchema);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear auth error when user starts typing
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const showToastMessage = useCallback((message: string, type: 'error' | 'warning' | 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [formData, login, validateForm, showToastMessage, clearError]);

  const getInputClassName = useCallback((fieldName: keyof LoginFormData) => {
    const fieldError = getFieldError(fieldName, formData[fieldName], formData);
    return fieldError ? `${styles.input} ${styles.inputError}` : styles.input;
  }, [formData, getFieldError]);

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <img src="/synapse-icon.svg" alt="Synapse" className={styles.logo} />
          <h1 className={styles.title}>Synapse</h1>
          <p className={styles.subtitle}>Sistema de Gerenciamento de Demandas</p>
        </div>

        <Form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className={getInputClassName('email')}
              placeholder="seu@email.com"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Senha
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className={getInputClassName('password')}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </Form>

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