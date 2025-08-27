// src/utils/storage.ts

export interface StorageOptions {
  ttl?: number; // Time to live in milliseconds
  version?: string; // Version for cache invalidation
}

export interface StorageItem<T> {
  data: T;
  timestamp: number;
  ttl?: number;
  version?: string;
}

class LocalStorageManager {
  private prefix = 'synapse_';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private isExpired<T>(item: StorageItem<T>): boolean {
    if (!item.ttl) {return false;}
    return Date.now() - item.timestamp > item.ttl;
  }

  private isValidVersion<T>(item: StorageItem<T>, version?: string): boolean {
    if (!version) {return true;} // If no version required, accept any
    if (!item.version) {return true;} // If item has no version, accept it
    return item.version === version;
  }

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

  get<T>(key: string, version?: string): T | null {
    try {
      const stored = localStorage.getItem(this.getKey(key));
      if (!stored) {return null;}

      const item: StorageItem<T> = JSON.parse(stored);

      // Check if expired
      if (this.isExpired(item)) {
        this.remove(key);
        return null;
      }

      // Check version
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

  remove(key: string): boolean {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch {
      return false;
    }
  }

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
          total += (localStorage.getItem(key)?.length || 0);
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

// Export singleton instance
export const storage = new LocalStorageManager();

// Cache helper utilities
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
  // 5 minutes for frequently changing data
  SHORT_TTL: 5 * 60 * 1000,
  // 30 minutes for semi-static data
  MEDIUM_TTL: 30 * 60 * 1000,
  // 2 hours for static data
  LONG_TTL: 2 * 60 * 60 * 1000,
  // 24 hours for rarely changing data
  VERY_LONG_TTL: 24 * 60 * 60 * 1000,
} as const;