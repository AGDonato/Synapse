/**
 * Componente de Formulário de Login do Sistema Synapse
 *
 * @description
 * Formulário completo de autenticação com validação em tempo real e feedback visual.
 * Integra-se ao sistema de autenticação JWT através do AuthContext e fornece
 * uma experiência de login moderna e acessível.
 *
 * **Funcionalidades Principais**:
 * - Validação de email e senha em tempo real
 * - Feedback visual com componente Toast
 * - Estados de carregamento durante autenticação
 * - Integração completa com sistema JWT
 * - Design responsivo com identidade visual Synapse
 * - Tratamento robusto de erros de autenticação
 *
 * **Validações Implementadas**:
 * - Email: formato válido e obrigatório
 * - Senha: mínimo 6 caracteres e obrigatório
 * - Limpeza automática de erros ao digitar
 * - Feedback imediato para usuário
 *
 * **Integração com Sistema**:
 * - AuthContext: gerenciamento de estado de autenticação
 * - Toast: notificações de sucesso/erro
 * - Design System: componentes Button e Input padronizados
 *
 * **Estados Gerenciados**:
 * - formData: dados do formulário (email/senha)
 * - toast: controle de notificações visuais
 * - loading: estado de carregamento da autenticação
 *
 * @example
 * // Uso básico do componente
 * <LoginForm />
 *
 * // O componente gerencia internamente:
 * // - Validação de campos
 * // - Submissão para API
 * // - Feedback visual
 * // - Estados de loading
 *
 * @module components/auth/LoginForm
 */

import React, { useCallback, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Toast } from '../ui';
import styles from './LoginForm.module.css';

// ========== REGRAS DE VALIDAÇÃO ==========

/**
 * Conjunto de regras de validação para formulários
 *
 * **Substituição Temporária**: Originalmente em hooks/validation (movido para _trash)
 * Implementação simplificada mantendo mesma interface e funcionalidade.
 */
const validationRules = {
  /** Valida campo obrigatório */
  required: (message: string) => (value: string) => (value.trim() ? null : message),
  /** Valida formato de email */
  email: (message: string) => (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : message,
  /** Valida comprimento mínimo */
  minLength: (min: number, message: string) => (value: string) =>
    value.length >= min ? null : message,
};

// ========== INTERFACES E TIPOS ==========

/**
 * Interface dos dados do formulário de login
 *
 * Define a estrutura esperada dos dados de entrada do usuário
 * para o processo de autenticação.
 */
interface LoginFormData {
  /** Endereço de email do usuário */
  email: string;
  /** Senha de acesso do usuário */
  password: string;
}

// ========== ESQUEMA DE VALIDAÇÃO ==========

/**
 * Esquema de validação para o formulário de login
 *
 * Define as regras aplicadas a cada campo durante validação.
 * Múltiplas regras podem ser aplicadas em sequência para cada campo.
 */
const loginValidationSchema = {
  /** Validações para campo email: obrigatório + formato válido */
  email: [validationRules.required('Email é obrigatório'), validationRules.email('Email inválido')],
  /** Validações para campo senha: obrigatório + comprimento mínimo */
  password: [
    validationRules.required('Senha é obrigatória'),
    validationRules.minLength(6, 'Senha deve ter pelo menos 6 caracteres'),
  ],
};

// ========== COMPONENTE PRINCIPAL ==========

/**
 * Componente de formulário de login
 *
 * Renderiza interface completa de autenticação com validação,
 * feedback visual e integração ao sistema de autenticação JWT.
 */
export const LoginForm: React.FC = () => {
  // ===== ESTADO LOCAL =====
  /**
   * Dados do formulário de login
   *
   * Mantém os valores atuais dos campos email e senha
   * digitados pelo usuário.
   */
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  /**
   * Controle de exibição do toast
   *
   * Flag booleana que determina se o toast de notificação
   * deve ser exibido na tela.
   */
  const [showToast, setShowToast] = useState(false);

  /**
   * Mensagem exibida no toast
   *
   * Conteúdo textual da notificação mostrada ao usuário
   * (erro, sucesso, aviso).
   */
  const [toastMessage, setToastMessage] = useState('');

  /**
   * Tipo de notificação do toast
   *
   * Define o estilo visual e semântica da notificação:
   * - error: erros de validação ou autenticação
   * - warning: avisos de validação de campos
   * - success: autenticação bem-sucedida
   */
  const [toastType, setToastType] = useState<'error' | 'warning' | 'success'>('error');

  // ===== INTEGRAÇÃO COM CONTEXTO DE AUTENTICAÇÃO =====
  /**
   * Hooks do contexto de autenticação
   *
   * Extrai funcionalidades e estados do AuthContext:
   * - login: função de autenticação
   * - isLoading: estado de carregamento
   * - error: mensagem de erro atual
   * - clearError: limpa mensagens de erro
   */
  const { login, isLoading, error, clearError } = useAuth();

  // ===== FUNÇÕES DE VALIDAÇÃO =====
  /**
   * Valida todo o formulário de login
   *
   * @param data - Dados do formulário a serem validados
   * @returns Objeto com resultado da validação e lista de erros
   *
   * **Processo de Validação**:
   * 1. Aplica todas as regras de email em sequência
   * 2. Para no primeiro erro encontrado para cada campo
   * 3. Aplica todas as regras de senha em sequência
   * 4. Retorna resumo com validade geral e erros específicos
   *
   * **Substituição Temporária**: Substitui hook useFormValidation movido para _trash
   */
  const validateForm = useCallback((data: LoginFormData) => {
    const errors: Partial<Record<keyof LoginFormData, string>> = {};

    // Valida campo email com todas as regras aplicáveis
    const emailValidators = loginValidationSchema.email;
    for (const validator of emailValidators) {
      const result = validator(data.email);
      if (result) {
        errors.email = result;
        break; // Para no primeiro erro encontrado
      }
    }

    // Valida campo senha com todas as regras aplicáveis
    const passwordValidators = loginValidationSchema.password;
    for (const validator of passwordValidators) {
      const result = validator(data.password);
      if (result) {
        errors.password = result;
        break; // Para no primeiro erro encontrado
      }
    }

    return {
      /** true se formulário é válido (sem erros) */
      isValid: Object.keys(errors).length === 0,
      /** Objeto com erros por campo (vazio se válido) */
      errors,
    };
  }, []);

  /**
   * Obtém erro de validação para um campo específico
   *
   * @param fieldName - Nome do campo a ser validado
   * @param value - Valor atual do campo
   * @returns Mensagem de erro ou null se campo válido
   *
   * **Uso**: Validação individual de campos durante digitação
   * para feedback visual imediato ao usuário.
   */
  const getFieldError = useCallback((fieldName: keyof LoginFormData, value: string) => {
    const validators = loginValidationSchema[fieldName];
    for (const validator of validators) {
      const result = validator(value);
      if (result) return result; // Retorna primeira mensagem de erro encontrada
    }
    return null; // Campo válido
  }, []);

  // ===== HANDLERS DE MUDANÇA DE INPUT =====
  /**
   * Handler genérico para mudanças nos campos do formulário
   *
   * @param e - Evento de mudança do input
   *
   * **Funcionalidade**:
   * - Atualiza estado do formulário
   * - Limpa erros de autenticação automaticamente
   * - Utilizado como fallback para inputs tradicionais
   *
   * **Nota**: Mantido para compatibilidade, mas não utilizado
   * pelos componentes Input atuais que têm signature diferente.
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));

      // Limpa erro de autenticação quando usuário começa a digitar
      if (error) {
        clearError();
      }
    },
    [error, clearError]
  );

  /**
   * Handler específico para mudanças no campo email
   *
   * @param value - Novo valor do campo email
   *
   * **Funcionalidade**:
   * - Atualiza especificamente o campo email no state
   * - Limpa erros de autenticação automaticamente
   * - Compatível com signature do componente Input
   */
  const handleEmailChange = useCallback(
    (value: string) => {
      setFormData(prev => ({ ...prev, email: value }));
      if (error) clearError();
    },
    [error, clearError]
  );

  /**
   * Handler específico para mudanças no campo senha
   *
   * @param value - Novo valor do campo senha
   *
   * **Funcionalidade**:
   * - Atualiza especificamente o campo password no state
   * - Limpa erros de autenticação automaticamente
   * - Compatível com signature do componente Input
   */
  const handlePasswordChange = useCallback(
    (value: string) => {
      setFormData(prev => ({ ...prev, password: value }));
      if (error) clearError();
    },
    [error, clearError]
  );

  // ===== FUNÇÕES AUXILIARES DE UI =====
  /**
   * Gera classe CSS para input baseada em estado de validação
   *
   * @param fieldName - Nome do campo a ser estilizado
   * @returns Classe CSS apropriada (normal ou erro)
   *
   * **Funcionalidade**:
   * - Aplica estilo de erro se campo tem validação pendente
   * - Mantém estilo normal para campos válidos
   * - Utilizado para feedback visual imediato
   *
   * **Nota**: Atualmente não utilizado, mas mantido para compatibilidade futura
   */
  const getInputClassName = useCallback(
    (fieldName: keyof LoginFormData) => {
      const fieldError = getFieldError(fieldName, formData[fieldName]);
      return fieldError ? `${styles.input} ${styles.inputError}` : styles.input;
    },
    [formData, getFieldError]
  );

  /**
   * Exibe notificação toast com mensagem e tipo específicos
   *
   * @param message - Texto da notificação
   * @param type - Tipo visual da notificação (error/warning/success)
   *
   * **Funcionalidade**:
   * - Configura mensagem do toast
   * - Define tipo visual (cor, ícone)
   * - Ativa exibição do toast
   * - Centraliza controle de notificações do componente
   */
  const showToastMessage = useCallback((message: string, type: 'error' | 'warning' | 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  }, []);

  // ===== HANDLER DE SUBMISSÃO =====
  /**
   * Processa submissão do formulário de login
   *
   * @param e - Evento de submissão do formulário
   *
   * **Fluxo de Execução**:
   * 1. Previne comportamento padrão do form
   * 2. Limpa erros de autenticação anteriores
   * 3. Executa validação completa do formulário
   * 4. Se inválido: exibe primeiro erro via toast
   * 5. Se válido: tenta autenticar via AuthContext
   * 6. Sucesso: exibe toast de sucesso
   * 7. Erro: exibe mensagem de erro via toast
   *
   * **Tratamento de Erros**:
   * - Validação: toast tipo warning
   * - Autenticação: toast tipo error
   * - Sucesso: toast tipo success
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      clearError();

      // Executa validação completa do formulário
      const validation = validateForm(formData);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        if (firstError) {
          showToastMessage(firstError, 'warning');
        }
        return;
      }

      try {
        // Tenta autenticar com credenciais fornecidas
        await login(formData.email, formData.password);
        showToastMessage('Login realizado com sucesso!', 'success');
      } catch (err) {
        // Trata erros de autenticação
        const errorMessage = err instanceof Error ? err.message : 'Erro no login';
        showToastMessage(errorMessage, 'error');
      }
    },
    [formData, login, validateForm, showToastMessage, clearError]
  );

  // ===== RENDERIZAÇÃO DO COMPONENTE =====
  return (
    <div className={styles.loginContainer}>
      {/* Container principal do formulário de login */}
      <div className={styles.loginCard}>
        {/* Cabeçalho com identidade visual do sistema */}
        <div className={styles.loginHeader}>
          <img src='/synapse-icon.svg' alt='Synapse' className={styles.logo} />
          <h1 className={styles.title}>Synapse</h1>
          <p className={styles.subtitle}>Sistema de Gerenciamento de Demandas</p>
        </div>

        {/* Formulário de autenticação */}
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {/* Campo de entrada para email */}
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

          {/* Campo de entrada para senha */}
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

          {/* Exibição de erros de autenticação do contexto */}
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* Botão de submissão com estado de carregamento */}
          <Button type='submit' className={styles.loginButton} disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        {/* Rodapé com informações de ajuda */}
        <div className={styles.loginFooter}>
          <p className={styles.helpText}>
            Problemas para acessar? Entre em contato com o administrador.
          </p>
        </div>
      </div>

      {/* Componente de notificação toast */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};
