/**
 * GERENCIADOR DE ARMAZENAMENTO LOCAL AVANÇADO
 *
 * Este módulo fornece um sistema robusto de armazenamento local com recursos avançados.
 * Inclui funcionalidades para:
 * - Controle de tempo de vida (TTL) automático para dados
 * - Versionamento de cache para invalidação controlada
 * - Prefixação automática de chaves para organização
 * - Limpeza automática de dados expirados
 * - Utilitários para monitoramento de tamanho e chaves
 * - Configurações predefinidas para diferentes tipos de cache
 */

export interface StorageOptions {
  ttl?: number; // Tempo de vida em milissegundos
  version?: string; // Versão para invalidação de cache
}

export interface StorageItem<T> {
  data: T;
  timestamp: number;
  ttl?: number;
  version?: string;
}

class LocalStorageManager {
  private prefix = 'synapse_';

  /**
   * Gera chave com prefixo para organização no localStorage
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Verifica se um item armazenado expirou baseado no TTL
   */
  private isExpired<T>(item: StorageItem<T>): boolean {
    if (!item.ttl) {
      return false;
    }
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Verifica se a versão do item armazenado é válida
   */
  private isValidVersion<T>(item: StorageItem<T>, version?: string): boolean {
    if (!version) {
      return true;
    } // Se nenhuma versão requerida, aceita qualquer
    if (!item.version) {
      return true;
    } // Se item não tem versão, aceita
    return item.version === version;
  }

  /**
   * Armazena dados com opções de TTL e versionamento
   * @param key - Chave para armazenamento
   * @param data - Dados a serem armazenados
   * @param options - Opções de TTL e versão
   * @returns true se armazenou com sucesso
   */
  set<T>(key: string, data: T, options: StorageOptions = {}): boolean {
    try {
      const item: StorageItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: options.ttl,
        version: options.version,
      };

      localStorage.setItem(this.getKey(key), JSON.stringify(item));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Recupera dados armazenados com validação de expiração e versão
   * @param key - Chave dos dados
   * @param version - Versão esperada dos dados
   * @returns Dados armazenados ou null se inválidos/expirados
   */
  get<T>(key: string, version?: string): T | null {
    try {
      const stored = localStorage.getItem(this.getKey(key));
      if (!stored) {
        return null;
      }

      const item: StorageItem<T> = JSON.parse(stored);

      // Verifica se expirou
      if (this.isExpired(item)) {
        this.remove(key);
        return null;
      }

      // Verifica versão
      if (!this.isValidVersion(item, version)) {
        this.remove(key);
        return null;
      }

      return item.data;
    } catch {
      this.remove(key);
      return null;
    }
  }

  /**
   * Remove item do armazenamento
   * @param key - Chave do item a ser removido
   * @returns true se removeu com sucesso
   */
  remove(key: string): boolean {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove todos os itens do sistema com prefixo
   * @returns true se limpou com sucesso
   */
  clear(): boolean {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch {
      return false;
    }
  }

  exists(key: string, version?: string): boolean {
    return this.get(key, version) !== null;
  }

  getSize(): number {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          total += localStorage.getItem(key)?.length || 0;
        }
      }
      return total;
    } catch {
      return 0;
    }
  }

  getKeys(): string[] {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.replace(this.prefix, ''));
        }
      }
      return keys;
    } catch {
      return [];
    }
  }
}

// Exporta instância singleton
export const storage = new LocalStorageManager();

// Utilitários auxiliares de cache
export const CacheKeys = {
  ASSUNTOS: 'assuntos',
  ORGAOS: 'orgaos',
  TIPOS_DOCUMENTOS: 'tipos_documentos',
  TIPOS_DEMANDAS: 'tipos_demandas',
  TIPOS_IDENTIFICADORES: 'tipos_identificadores',
  AUTORIDADES: 'autoridades',
  DISTRIBUIDORES: 'distribuidores',
  PROVEDORES: 'provedores',
  TIPOS_MIDIAS: 'tipos_midias',
  DEMANDAS: 'demandas',
  USER_PREFERENCES: 'user_preferences',
} as const;

export const CacheConfig = {
  // 5 minutos para dados que mudam frequentemente
  SHORT_TTL: 5 * 60 * 1000,
  // 30 minutos para dados semi-estáticos
  MEDIUM_TTL: 30 * 60 * 1000,
  // 2 horas para dados estáticos
  LONG_TTL: 2 * 60 * 60 * 1000,
  // 24 horas para dados que raramente mudam
  VERY_LONG_TTL: 24 * 60 * 60 * 1000,
} as const;
