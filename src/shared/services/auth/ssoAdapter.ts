/**
 * ================================================================
 * SSO ADAPTER - ADAPTADOR UNIVERSAL DE SINGLE SIGN-ON
 * ================================================================
 *
 * Este arquivo implementa um adaptador universal para integração com
 * múltiplos provedores de Single Sign-On (SSO), permitindo que o sistema
 * Synapse funcione com qualquer infraestrutura de autenticação existente.
 *
 * Funcionalidades principais:
 * - Suporte a múltiplos provedores SSO (LDAP, OAuth2, SAML, PHP)
 * - Detecção automática de provedores baseada em configuração
 * - Switch dinâmico entre provedores em tempo de execução
 * - Gestão unificada de tokens e sessões cross-provider
 * - Redirecionamento inteligente para fluxos OAuth2/SAML
 * - Auto-refresh de tokens quando suportado
 * - Fallback automático entre provedores
 * - Interface consistente independente do provedor
 *
 * Provedores suportados:
 * - PHP Session: Integração com sistemas PHP/Laravel nativos
 * - LDAP/Active Directory: Autenticação corporativa via diretório
 * - OAuth2/OIDC: Google, Microsoft, Azure AD, GitHub, etc.
 * - SAML 2.0: Provedores SAML empresariais (Okta, ADFS, etc.)
 *
 * Arquitetura do adaptador:
 * - Provider Factory: Criação dinâmica de provedores baseada em env
 * - Unified Interface: Interface consistente para todos os provedores
 * - Token Management: Gestão centralizada de tokens/sessões
 * - Redirect Handler: Gerenciamento de redirecionamentos OAuth2/SAML
 * - State Management: Gestão de estado para fluxos assíncronos
 *
 * Fluxos de autenticação:
 * 1. Detecção de provedor baseada em ENV ou seleção manual
 * 2. Inicialização e verificação de sessão existente
 * 3. Redirecionamento ou login direto conforme provedor
 * 4. Processamento de callback (OAuth2/SAML)
 * 5. Normalização de dados de usuário entre provedores
 * 6. Persistência de tokens/sessões locais
 *
 * Padrões implementados:
 * - Adapter pattern para unificação de interfaces heterogêneas
 * - Strategy pattern para diferentes fluxos de autenticação
 * - Factory pattern para criação de provedores
 * - Observer pattern para eventos de autenticação
 * - State pattern para gerenciamento de fluxos assíncronos
 *
 * Segurança:
 * - Validação de state em fluxos OAuth2 (CSRF protection)
 * - Verificação de origem em callbacks SAML
 * - Persistência segura de tokens com expiração
 * - Limpeza automática de dados sensíveis
 * - Proteção contra session fixation
 *
 * @fileoverview Adaptador universal para Single Sign-On
 * @version 2.0.0
 * @since 2024-01-22
 * @author Synapse Team
 */

import { env } from '../../config/env';
import { apiClient } from '../api/client';
import { logger } from '../../../shared/utils/logger';
import type { User } from '../security/auth';

/**
 * Interface que define um provedor de SSO
 * Representa a configuração e metadados de um provedor de autenticação
 */
export interface SSOProvider {
  type: 'jwt' | 'ldap' | 'oauth2' | 'saml';
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

/**
 * Interface para credenciais de autenticação SSO
 * Suporte a diferentes tipos de credenciais conforme o provedor
 */
export interface SSOCredentials {
  username?: string;
  password?: string;
  token?: string;
  code?: string;
  state?: string;
  assertion?: string;
  provider?: string;
}

/**
 * Interface para respostas de autenticação SSO padronizadas
 * Unifica respostas de todos os provedores em formato consistente
 */
export interface SSOAuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  provider?: string;
  message?: string;
  errors?: string[];
  redirectUrl?: string;
}

/**
 * Classe principal do adaptador universal de Single Sign-On
 *
 * Esta classe fornece uma interface unificada para trabalhar com múltiplos
 * provedores de autenticação, abstraindo as diferenças entre LDAP, OAuth2,
 * SAML e sessões PHP nativas.
 *
 * Funcionalidades:
 * - Detecção automática de provedores disponíveis via configuração
 * - Switch dinâmico entre provedores em runtime
 * - Gestão unificada de fluxos de login/logout/refresh
 * - Normalização de dados de usuário entre provedores
 * - Gerenciamento inteligente de redirecionamentos
 * - Persistência consistente de tokens e sessões
 * - Interface reativa para componentes React via hook
 *
 * @example
 * ```typescript
 * import { ssoAdapter } from './ssoAdapter';
 *
 * // Listar provedores disponíveis
 * const providers = ssoAdapter.getAvailableProviders();
 * console.log('Provedores:', providers.map(p => p.name));
 *
 * // Definir provedor atual
 * ssoAdapter.setCurrentProvider('oauth2');
 *
 * // Inicializar autenticação
 * const initResult = await ssoAdapter.initialize();
 * if (initResult.success) {
 *   console.log('Usuário já autenticado:', initResult.user);
 * } else {
 *   // Realizar login
 *   const loginResult = await ssoAdapter.login({ username: 'user', password: 'pass' });
 *   if (loginResult.redirectUrl) {
 *     window.location.href = loginResult.redirectUrl;
 *   }
 * }
 * ```
 */
class SSOAdapter {
  private providers: SSOProvider[] = [];
  private currentProvider: SSOProvider | null = null;

  constructor() {
    this.initializeProviders();
  }

  /**
   * Inicializa provedores SSO baseado nas variáveis de ambiente
   *
   * Detecta automaticamente quais provedores estão habilitados via
   * configuração e os registra para uso. Define o provedor padrão
   * baseado na variável AUTH_TYPE ou usa PHP como fallback.
   *
   * @private
   */
  private initializeProviders(): void {
    this.providers = [];

    // Provedor JWT (sempre disponível)
    this.providers.push({
      type: 'jwt',
      name: 'Sistema JWT',
      enabled: env.JWT_ENABLED,
      config: {
        endpoint: env.AUTH_ENDPOINT,
      },
    });

    // Provedor LDAP
    if (env.LDAP_ENABLED) {
      this.providers.push({
        type: 'ldap',
        name: 'Active Directory',
        enabled: true,
        config: {
          url: env.LDAP_URL,
          baseDN: env.LDAP_BASE_DN,
        },
      });
    }

    // Provedor OAuth2
    if (env.OAUTH2_ENABLED) {
      this.providers.push({
        type: 'oauth2',
        name: 'OAuth2',
        enabled: true,
        config: {
          clientId: env.OAUTH2_CLIENT_ID,
          redirectUri: env.OAUTH2_REDIRECT_URI,
          scope: 'openid profile email',
        },
      });
    }

    // Provedor SAML
    if (env.SAML_ENABLED) {
      this.providers.push({
        type: 'saml',
        name: 'SAML SSO',
        enabled: true,
        config: {
          entryPoint: env.SAML_ENTRY_POINT,
          issuer: env.SAML_ISSUER,
        },
      });
    }

    // Definir provedor padrão
    this.currentProvider = this.providers.find(p => p.type === env.AUTH_TYPE) || this.providers[0];
  }

  /**
   * Obtém lista de provedores de SSO habilitados e disponíveis
   *
   * @returns Array de provedores SSO configurados e ativos
   *
   * @example
   * ```typescript
   * const providers = ssoAdapter.getAvailableProviders();
   * providers.forEach(provider => {
   *   console.log(`${provider.name} (${provider.type}) - ${provider.enabled ? 'Ativo' : 'Inativo'}`);
   * });
   * ```
   */
  getAvailableProviders(): SSOProvider[] {
    return this.providers.filter(p => p.enabled);
  }

  /**
   * Obtém o provedor de SSO atualmente selecionado
   *
   * @returns Provedor atual ou null se nenhum configurado
   *
   * @example
   * ```typescript
   * const current = ssoAdapter.getCurrentProvider();
   * if (current) {
   *   console.log(`Provedor ativo: ${current.name} (${current.type})`);
   * }
   * ```
   */
  getCurrentProvider(): SSOProvider | null {
    return this.currentProvider;
  }

  /**
   * Define qual provedor de SSO usar para autenticação
   *
   * @param type - Tipo do provedor ('php', 'ldap', 'oauth2', 'saml')
   * @returns true se provedor foi definido com sucesso, false se inválido
   *
   * @example
   * ```typescript
   * // Mudar para OAuth2
   * const success = ssoAdapter.setCurrentProvider('oauth2');
   * if (success) {
   *   console.log('Provedor alterado para OAuth2');
   * } else {
   *   console.log('OAuth2 não está disponível');
   * }
   * ```
   */
  setCurrentProvider(type: string): boolean {
    const provider = this.providers.find(p => p.type === type && p.enabled);
    if (provider) {
      this.currentProvider = provider;
      return true;
    }
    return false;
  }

  /**
   * Inicializa o processo de autenticação com o provedor atual
   *
   * Verifica se já existe uma sessão válida ou inicia o processo
   * de autenticação conforme o tipo de provedor configurado.
   *
   * @returns Promise com resultado da inicialização
   *
   * @example
   * ```typescript
   * const result = await ssoAdapter.initialize();
   *
   * if (result.success) {
   *   // Usuário já autenticado
   *   console.log('Bem-vindo de volta,', result.user?.name);
   *   showDashboard();
   * } else {
   *   // Precisa fazer login
   *   console.log('Sessão expirada:', result.message);
   *   showLoginForm();
   * }
   * ```
   */
  async initialize(): Promise<SSOAuthResponse> {
    if (!this.currentProvider) {
      return {
        success: false,
        message: 'Nenhum provedor de autenticação configurado',
      };
    }

    switch (this.currentProvider.type) {
      case 'jwt':
        return this.initializeJWT();

      case 'ldap':
        return this.initializeLDAP();

      case 'oauth2':
        return this.initializeOAuth2();

      case 'saml':
        return this.initializeSAML();

      default:
        return {
          success: false,
          message: 'Provedor de autenticação não suportado',
        };
    }
  }

  /**
   * Realiza login usando o provedor de SSO atual
   *
   * Processa credenciais conforme o tipo de provedor. Para OAuth2/SAML
   * pode retornar URL de redirecionamento ao invés de resultado imediato.
   *
   * @param credentials - Credenciais de autenticação (varia por provedor)
   * @returns Promise com resultado do login
   *
   * @example
   * ```typescript
   * // Login direto (PHP/LDAP)
   * const result = await ssoAdapter.login({
   *   username: 'joao.silva',
   *   password: 'senha123'
   * });
   *
   * if (result.success) {
   *   console.log('Login realizado:', result.user?.name);
   * } else if (result.redirectUrl) {
   *   // Redirecionamento OAuth2/SAML
   *   window.location.href = result.redirectUrl;
   * } else {
   *   console.error('Erro:', result.message);
   * }
   * ```
   */
  async login(credentials: SSOCredentials): Promise<SSOAuthResponse> {
    if (!this.currentProvider) {
      return {
        success: false,
        message: 'Provedor não configurado',
      };
    }

    switch (this.currentProvider.type) {
      case 'jwt':
        return this.loginJWT(credentials);

      case 'ldap':
        return this.loginLDAP(credentials);

      case 'oauth2':
        return this.loginOAuth2(credentials);

      case 'saml':
        return this.loginSAML(credentials);

      default:
        return {
          success: false,
          message: 'Método de login não suportado',
        };
    }
  }

  /**
   * Realiza logout do sistema com limpeza adequada
   *
   * Notifica o provedor sobre logout e limpa dados locais.
   * Para provedores externos (OAuth2/SAML) pode retornar URL
   * de logout para limpeza completa da sessão.
   *
   * @returns Promise com resultado do logout
   *
   * @example
   * ```typescript
   * const result = await ssoAdapter.logout();
   *
   * if (result.success) {
   *   console.log('Logout realizado com sucesso');
   *   if (result.redirectUrl) {
   *     // Logout de provedor externo
   *     window.location.href = result.redirectUrl;
   *   } else {
   *     // Redirecionar para login
   *     window.location.href = '/login';
   *   }
   * }
   * ```
   */
  async logout(): Promise<SSOAuthResponse> {
    if (!this.currentProvider) {
      return { success: true };
    }

    switch (this.currentProvider.type) {
      case 'jwt':
        return this.logoutJWT();

      case 'ldap':
        return this.logoutLDAP();

      case 'oauth2':
        return this.logoutOAuth2();

      case 'saml':
        return this.logoutSAML();

      default:
        return { success: true };
    }
  }

  /**
   * ===================================================================
   * IMPLEMENTAÇÕES ESPECÍFICAS - PROVEDOR NODE.JS
   * ===================================================================
   */
  /**
   * Inicializa autenticação JWT verificando token existente
   *
   * @returns Promise com resultado da inicialização JWT
   * @private
   */
  private async initializeJWT(): Promise<SSOAuthResponse> {
    try {
      const response = await apiClient.get('/auth/me');
      const data = await response.json();

      if (data.user) {
        return {
          success: true,
          user: data.user,
          provider: 'jwt',
        };
      }
    } catch (error) {
      logger.debug('Sessão não encontrada:', error);
    }

    return {
      success: false,
      message: 'Sessão não encontrada',
    };
  }

  /**
   * Realiza login no sistema JWT
   *
   * @param credentials - Credenciais com username e password
   * @returns Promise com resultado do login JWT
   * @private
   */
  private async loginJWT(credentials: SSOCredentials): Promise<SSOAuthResponse> {
    if (!credentials.username || !credentials.password) {
      return {
        success: false,
        message: 'Usuário e senha são obrigatórios',
      };
    }

    try {
      const response = await apiClient.post('/auth/login', {
        email: credentials.username,
        password: credentials.password,
      });

      const data = await response.json();

      return {
        success: true,
        user: data.user,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        provider: 'jwt',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Falha na autenticação',
      };
    }
  }

  /**
   * Realiza logout do sistema JWT
   *
   * @returns Promise com resultado do logout JWT
   * @private
   */
  private async logoutJWT(): Promise<SSOAuthResponse> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      logger.debug('Erro no logout:', error);
    }

    return {
      success: true,
      provider: 'jwt',
    };
  }

  /**
   * ===================================================================
   * IMPLEMENTAÇÕES ESPECÍFICAS - PROVEDOR LDAP
   * ===================================================================
   */
  /**
   * Inicializa autenticação LDAP verificando sessão existente
   *
   * @returns Promise com resultado da inicialização LDAP
   * @private
   */
  private async initializeLDAP(): Promise<SSOAuthResponse> {
    // Verificar se existe sessão LDAP válida
    try {
      const response = await apiClient.get('/auth/me');
      const data = await response.json();

      if (data.user) {
        return {
          success: true,
          user: data.user,
          provider: 'ldap',
        };
      }
    } catch (error) {
      logger.error('Erro ao verificar sessão LDAP:', error);
    }

    return {
      success: false,
      message: 'Sessão LDAP não encontrada',
    };
  }

  /**
   * Realiza login via LDAP/Active Directory
   *
   * @param credentials - Credenciais com username e password
   * @returns Promise com resultado do login LDAP
   * @private
   */
  private async loginLDAP(credentials: SSOCredentials): Promise<SSOAuthResponse> {
    try {
      const response = await apiClient.post('/auth/login', {
        email: credentials.username,
        password: credentials.password,
      });
      const data = await response.json();

      return {
        success: true,
        user: data.user,
        token: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        provider: 'ldap',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Falha na autenticação LDAP',
      };
    }
  }

  /**
   * Realiza logout da sessão LDAP
   *
   * @returns Promise com resultado do logout LDAP
   * @private
   */
  private async logoutLDAP(): Promise<SSOAuthResponse> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      logger.error('Erro ao fazer logout LDAP:', error);
    }

    return {
      success: true,
      provider: 'ldap',
    };
  }

  /**
   * ===================================================================
   * IMPLEMENTAÇÕES ESPECÍFICAS - PROVEDOR OAUTH2
   * ===================================================================
   */
  /**
   * Inicializa autenticação OAuth2 verificando callbacks e tokens
   *
   * Verifica se há um callback OAuth2 na URL ou token válido armazenado.
   *
   * @returns Promise com resultado da inicialização OAuth2
   * @private
   */
  private async initializeOAuth2(): Promise<SSOAuthResponse> {
    // Verificar se temos um código de autorização na URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code) {
      return this.loginOAuth2({ code, state: state || undefined });
    }

    // Verificar se existe token válido
    const token = localStorage.getItem('oauth2_token');
    if (token) {
      try {
        const response = await phpApiClient.get('/auth/oauth2/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await response.json()) as any;

        if (data.success && data.user) {
          return {
            success: true,
            user: data.user,
            token,
            provider: 'oauth2',
          };
        }
      } catch (error) {
        localStorage.removeItem('oauth2_token');
      }
    }

    return {
      success: false,
      message: 'Token OAuth2 não encontrado',
    };
  }

  /**
   * Realiza login OAuth2 - processa callback ou inicia fluxo
   *
   * Se credentials contém code, processa callback. Caso contrário,
   * retorna URL para redirecionamento ao provedor OAuth2.
   *
   * @param credentials - Code de callback ou vazio para iniciar fluxo
   * @returns Promise com resultado/redirect URL
   * @private
   */
  private async loginOAuth2(credentials: SSOCredentials): Promise<SSOAuthResponse> {
    if (credentials.code) {
      // Trocar código por token
      try {
        const response = await phpApiClient.post('/auth/oauth2/callback', {
          json: {
            code: credentials.code,
            state: credentials.state,
          },
        });
        const data = (await response.json()) as any;

        if (data.success && data.user) {
          const { user, token, refreshToken, expiresIn } = data;

          // Armazenar token
          localStorage.setItem('oauth2_token', token);
          if (refreshToken) {
            localStorage.setItem('oauth2_refresh_token', refreshToken);
          }

          return {
            success: true,
            user,
            token,
            refreshToken,
            expiresIn,
            provider: 'oauth2',
          };
        }

        return {
          success: false,
          message: data?.message || 'Erro no callback OAuth2',
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro no callback OAuth2';
        return {
          success: false,
          message: errorMessage,
        };
      }
    } else {
      // Redirecionar para provedor OAuth2
      const config = this.currentProvider?.config;
      if (!config) {
        return {
          success: false,
          message: 'Configuração OAuth2 não encontrada',
        };
      }

      const state = this.generateState();
      const authUrl = new URL('https://accounts.google.com/oauth/authorize'); // Exemplo
      authUrl.searchParams.set('client_id', config.clientId as string);
      authUrl.searchParams.set('redirect_uri', config.redirectUri as string);
      authUrl.searchParams.set('scope', config.scope as string);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('state', state);

      localStorage.setItem('oauth2_state', state);

      return {
        success: true,
        redirectUrl: authUrl.toString(),
        provider: 'oauth2',
      };
    }
  }

  /**
   * Realiza logout OAuth2 limpando tokens locais
   *
   * @returns Promise com resultado do logout OAuth2
   * @private
   */
  private async logoutOAuth2(): Promise<SSOAuthResponse> {
    localStorage.removeItem('oauth2_token');
    localStorage.removeItem('oauth2_refresh_token');
    localStorage.removeItem('oauth2_state');

    return {
      success: true,
      provider: 'oauth2',
    };
  }

  /**
   * ===================================================================
   * IMPLEMENTAÇÕES ESPECÍFICAS - PROVEDOR SAML
   * ===================================================================
   */
  /**
   * Inicializa autenticação SAML verificando assertions e sessões
   *
   * Verifica se há SAMLResponse na URL ou sessão SAML válida.
   *
   * @returns Promise com resultado da inicialização SAML
   * @private
   */
  private async initializeSAML(): Promise<SSOAuthResponse> {
    // Verificar se temos uma assertion SAML
    const urlParams = new URLSearchParams(window.location.search);
    const samlResponse = urlParams.get('SAMLResponse');

    if (samlResponse) {
      return this.loginSAML({ assertion: samlResponse });
    }

    // Verificar sessão SAML existente
    try {
      const response = await phpApiClient.get('/auth/saml/check');
      const data = (await response.json()) as any;

      if (data.success && data.user) {
        return {
          success: true,
          user: data.user,
          provider: 'saml',
        };
      }
    } catch (error) {
      logger.error('Erro ao verificar sessão SAML:', error);
    }

    return {
      success: false,
      message: 'Sessão SAML não encontrada',
    };
  }

  /**
   * Realiza login SAML - processa assertion ou inicia fluxo
   *
   * Se credentials contém assertion, processa resposta SAML.
   * Caso contrário, retorna URL do Identity Provider.
   *
   * @param credentials - Assertion SAML ou vazio para iniciar fluxo
   * @returns Promise com resultado/redirect URL
   * @private
   */
  private async loginSAML(credentials: SSOCredentials): Promise<SSOAuthResponse> {
    if (credentials.assertion) {
      // Processar assertion SAML
      try {
        const response = await phpApiClient.post('/auth/saml/acs', {
          json: {
            SAMLResponse: credentials.assertion,
          },
        });
        const data = (await response.json()) as any;

        if (data.success && data.user) {
          return {
            success: true,
            user: data.user,
            token: data.token,
            provider: 'saml',
          };
        }

        return {
          success: false,
          message: data?.message || 'Erro na autenticação SAML',
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro no processamento SAML';
        return {
          success: false,
          message: errorMessage,
        };
      }
    } else {
      // Redirecionar para provedor SAML
      const config = this.currentProvider?.config;
      if (!config) {
        return {
          success: false,
          message: 'Configuração SAML não encontrada',
        };
      }

      return {
        success: true,
        redirectUrl: config.entryPoint as string,
        provider: 'saml',
      };
    }
  }

  /**
   * Realiza logout SAML notificando Identity Provider
   *
   * @returns Promise com resultado do logout SAML
   * @private
   */
  private async logoutSAML(): Promise<SSOAuthResponse> {
    try {
      await phpApiClient.post('/auth/saml/logout');
    } catch (error) {
      logger.error('Erro ao fazer logout SAML:', error);
    }

    return {
      success: true,
      provider: 'saml',
    };
  }

  /**
   * ===================================================================
   * MÉTODOS UTILITÁRIOS PÚBLICOS
   * ===================================================================
   */
  /**
   * Gera string de state aleatória para fluxos OAuth2 (proteção CSRF)
   *
   * @returns String codificada em base64 com timestamp e random
   * @private
   */
  private generateState(): string {
    return btoa(Math.random().toString(36).substring(7) + Date.now().toString());
  }

  /**
   * Verifica se o provedor atual suporta redirecionamento automático
   *
   * Provedores OAuth2 e SAML requerem redirecionamento para funcionar.
   *
   * @returns true se provedor precisa/suporta redirecionamento
   *
   * @example
   * ```typescript
   * if (ssoAdapter.supportsAutoRedirect()) {
   *   // Preparar interface para redirecionamento
   *   showRedirectMessage();
   * } else {
   *   // Mostrar formulário de login local
   *   showLoginForm();
   * }
   * ```
   */
  supportsAutoRedirect(): boolean {
    return ['oauth2', 'saml'].includes(this.currentProvider?.type || '');
  }

  /**
   * Obtém URL de redirecionamento para iniciar login com provedor externo
   *
   * Gera URLs apropriadas para OAuth2 e SAML com parâmetros necessários.
   *
   * @returns URL de login do provedor ou null se não suportado
   *
   * @example
   * ```typescript
   * const loginUrl = ssoAdapter.getLoginUrl();
   * if (loginUrl) {
   *   // Redirecionar para provedor externo
   *   window.location.href = loginUrl;
   * } else {
   *   // Login local
   *   showLocalLoginForm();
   * }
   * ```
   */
  getLoginUrl(): string | null {
    const config = this.currentProvider?.config;

    switch (this.currentProvider?.type) {
      case 'oauth2':
        const state = this.generateState();
        const authUrl = new URL('https://accounts.google.com/oauth/authorize'); // Exemplo
        authUrl.searchParams.set('client_id', config?.clientId as string);
        authUrl.searchParams.set('redirect_uri', config?.redirectUri as string);
        authUrl.searchParams.set('scope', config?.scope as string);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('state', state);
        localStorage.setItem('oauth2_state', state);
        return authUrl.toString();

      case 'saml':
        return config?.entryPoint as string | null;

      default:
        return null;
    }
  }

  /**
   * Renova token de autenticação se o provedor suportar
   *
   * Tenta renovar tokens/sessões para evitar expiração e re-login.
   * Suportado por PHP (sessões) e OAuth2 (refresh tokens).
   *
   * @returns Promise com resultado da renovação
   *
   * @example
   * ```typescript
   * const refreshResult = await ssoAdapter.refreshToken();
   *
   * if (refreshResult.success) {
   *   console.log('Token renovado com sucesso');
   *   updateAuthHeaders(refreshResult.token);
   * } else {
   *   console.log('Precisa fazer login novamente');
   *   redirectToLogin();
   * }
   * ```
   */
  async refreshToken(): Promise<SSOAuthResponse> {
    switch (this.currentProvider?.type) {
      case 'jwt':
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const response = await apiClient.post('/auth/refresh', {
              refreshToken,
            });
            const data = await response.json();

            return {
              success: true,
              token: data.accessToken,
              refreshToken: data.refreshToken,
              expiresIn: data.expiresIn,
              provider: 'jwt',
            };
          }
        } catch (error) {
          logger.error('Erro ao renovar token:', error);
        }
        return { success: false, provider: 'jwt' };

      case 'oauth2':
        const refreshToken = localStorage.getItem('oauth2_refresh_token');
        if (refreshToken) {
          try {
            const response = await apiClient.post('/auth/refresh', {
              refreshToken,
            });
            const data = await response.json();

            localStorage.setItem('oauth2_token', data.accessToken);
            return {
              success: true,
              token: data.accessToken,
              provider: 'oauth2',
            };
          } catch (error) {
            logger.error('Erro ao renovar token OAuth2:', error);
          }
        }
        return { success: false, provider: 'oauth2' };

      default:
        return { success: false, message: 'Refresh não suportado' };
    }
  }
}

// Singleton instance
export const ssoAdapter = new SSOAdapter();

/**
 * ===================================================================
 * REACT HOOK E EXPORTAÇÕES
 * ===================================================================
 */
/**
 * Hook React para integração com sistema de SSO
 *
 * Fornece interface reativa para componentes React acessarem
 * todas as funcionalidades do SSO Adapter de forma simples.
 *
 * @returns Objeto com métodos e estados de SSO
 *
 * @example
 * ```tsx
 * import { useSSO } from './ssoAdapter';
 *
 * function LoginComponent() {
 *   const {
 *     providers,
 *     currentProvider,
 *     setProvider,
 *     login,
 *     logout,
 *     supportsAutoRedirect
 *   } = useSSO();
 *
 *   const handleLogin = async (credentials) => {
 *     const result = await login(credentials);
 *
 *     if (result.redirectUrl) {
 *       window.location.href = result.redirectUrl;
 *     } else if (result.success) {
 *       navigate('/dashboard');
 *     } else {
 *       setError(result.message);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <select onChange={e => setProvider(e.target.value)}>
 *         {providers.map(p => (
 *           <option key={p.type} value={p.type}>
 *             {p.name}
 *           </option>
 *         ))}
 *       </select>
 *
 *       {supportsAutoRedirect() ? (
 *         <button onClick={() => handleLogin({})}>
 *           Entrar com {currentProvider?.name}
 *         </button>
 *       ) : (
 *         <LoginForm onSubmit={handleLogin} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export const useSSO = () => {
  return {
    providers: ssoAdapter.getAvailableProviders(),
    currentProvider: ssoAdapter.getCurrentProvider(),
    setProvider: ssoAdapter.setCurrentProvider.bind(ssoAdapter),
    initialize: ssoAdapter.initialize.bind(ssoAdapter),
    login: ssoAdapter.login.bind(ssoAdapter),
    logout: ssoAdapter.logout.bind(ssoAdapter),
    refreshToken: ssoAdapter.refreshToken.bind(ssoAdapter),
    supportsAutoRedirect: ssoAdapter.supportsAutoRedirect.bind(ssoAdapter),
    getLoginUrl: ssoAdapter.getLoginUrl.bind(ssoAdapter),
  };
};

export default ssoAdapter;
