/**
 * SSO Adapter
 * Adaptador para integração com sistemas de Single Sign-On
 * Suporte para LDAP, OAuth2, SAML e PHP Session
 */

import { env } from '../../config/env';
import { phpSessionBridge } from './phpSessionBridge';
import { httpClient as phpApiClient } from '../api';
import { logger } from '../../utils/logger';
import type { User } from '../security/auth';

export interface SSOProvider {
  type: 'php' | 'ldap' | 'oauth2' | 'saml';
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface SSOCredentials {
  username?: string;
  password?: string;
  token?: string;
  code?: string;
  state?: string;
  assertion?: string;
  provider?: string;
}

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
 * Adaptador principal para SSO
 */
class SSOAdapter {
  private providers: SSOProvider[] = [];
  private currentProvider: SSOProvider | null = null;

  constructor() {
    this.initializeProviders();
  }

  /**
   * Inicializar provedores SSO baseado na configuração
   */
  private initializeProviders(): void {
    this.providers = [];

    // Provedor PHP (sempre disponível)
    this.providers.push({
      type: 'php',
      name: 'Sistema PHP',
      enabled: true,
      config: {
        endpoint: env.PHP_AUTH_URL,
        sessionName: env.PHP_SESSION_NAME,
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
   * Obter provedores disponíveis
   */
  getAvailableProviders(): SSOProvider[] {
    return this.providers.filter(p => p.enabled);
  }

  /**
   * Obter provedor atual
   */
  getCurrentProvider(): SSOProvider | null {
    return this.currentProvider;
  }

  /**
   * Definir provedor atual
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
   * Inicializar autenticação
   */
  async initialize(): Promise<SSOAuthResponse> {
    if (!this.currentProvider) {
      return {
        success: false,
        message: 'Nenhum provedor de autenticação configurado',
      };
    }

    switch (this.currentProvider.type) {
      case 'php':
        return this.initializePHP();

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
   * Fazer login
   */
  async login(credentials: SSOCredentials): Promise<SSOAuthResponse> {
    if (!this.currentProvider) {
      return {
        success: false,
        message: 'Provedor não configurado',
      };
    }

    switch (this.currentProvider.type) {
      case 'php':
        return this.loginPHP(credentials);

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
   * Fazer logout
   */
  async logout(): Promise<SSOAuthResponse> {
    if (!this.currentProvider) {
      return { success: true };
    }

    switch (this.currentProvider.type) {
      case 'php':
        return this.logoutPHP();

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
   * Implementações específicas por provedor - PHP
   */
  private async initializePHP(): Promise<SSOAuthResponse> {
    const isInitialized = await phpSessionBridge.initializeSession();

    if (isInitialized) {
      const user = phpSessionBridge.getCurrentUser();
      return {
        success: true,
        user: user || undefined,
        provider: 'php',
      };
    }

    return {
      success: false,
      message: 'Sessão PHP não encontrada',
    };
  }

  private async loginPHP(credentials: SSOCredentials): Promise<SSOAuthResponse> {
    if (!credentials.username || !credentials.password) {
      return {
        success: false,
        message: 'Usuário e senha são obrigatórios',
      };
    }

    const response = await phpSessionBridge.login({
      username: credentials.username,
      password: credentials.password,
    });

    return {
      success: response.success,
      user: response.user,
      token: response.token,
      message: response.message,
      errors: response.errors,
      provider: 'php',
    };
  }

  private async logoutPHP(): Promise<SSOAuthResponse> {
    await phpSessionBridge.logout();
    return {
      success: true,
      provider: 'php',
    };
  }

  /**
   * Implementações específicas por provedor - LDAP
   */
  private async initializeLDAP(): Promise<SSOAuthResponse> {
    // Verificar se existe sessão LDAP válida
    try {
      const response = await phpApiClient.get('/auth/ldap/check');
      const data = (await response.json()) as any;

      if (data.success && data.user) {
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

  private async loginLDAP(credentials: SSOCredentials): Promise<SSOAuthResponse> {
    try {
      const response = await phpApiClient.post('/auth/ldap/login', {
        json: {
          username: credentials.username,
          password: credentials.password,
        },
      });
      const data = (await response.json()) as any;

      if (data.success && data.user) {
        return {
          success: true,
          user: data.user,
          token: data.token,
          provider: 'ldap',
        };
      }

      return {
        success: false,
        message: data?.message || 'Falha na autenticação LDAP',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na autenticação LDAP';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  private async logoutLDAP(): Promise<SSOAuthResponse> {
    try {
      await phpApiClient.post('/auth/ldap/logout');
    } catch (error) {
      logger.error('Erro ao fazer logout LDAP:', error);
    }

    return {
      success: true,
      provider: 'ldap',
    };
  }

  /**
   * Implementações específicas por provedor - OAuth2
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
   * Implementações específicas por provedor - SAML
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
   * Utilitários
   */
  private generateState(): string {
    return btoa(Math.random().toString(36).substring(7) + Date.now().toString());
  }

  /**
   * Verificar se provedor suporta auto-redirect
   */
  supportsAutoRedirect(): boolean {
    return ['oauth2', 'saml'].includes(this.currentProvider?.type || '');
  }

  /**
   * Obter URL de redirecionamento para login
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
   * Refresh token se suportado
   */
  async refreshToken(): Promise<SSOAuthResponse> {
    switch (this.currentProvider?.type) {
      case 'php':
        const refreshed = await phpSessionBridge.refreshSession();
        return {
          success: refreshed,
          user: refreshed ? phpSessionBridge.getCurrentUser() || undefined : undefined,
          provider: 'php',
        };

      case 'oauth2':
        const refreshToken = localStorage.getItem('oauth2_refresh_token');
        if (refreshToken) {
          try {
            const response = await phpApiClient.post('/auth/oauth2/refresh', {
              json: {
                refresh_token: refreshToken,
              },
            });
            const data = (await response.json()) as any;

            if (data.success) {
              localStorage.setItem('oauth2_token', data.token);
              return {
                success: true,
                token: data.token,
                provider: 'oauth2',
              };
            }
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

// Hook para usar no React
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
