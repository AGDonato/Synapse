// src/repositories/OrgaosRepository.ts

import { BaseRepository } from './BaseRepository';
import type { Orgao } from '../types/entities';
import { mockOrgaos } from '../data/mockOrgaos';
import { CacheConfig, CacheKeys } from '../utils/storage';

export class OrgaosRepository extends BaseRepository<Orgao> {
  protected data = [...mockOrgaos];
  protected entityName = 'Órgão';

  constructor() {
    super(CacheKeys.ORGAOS, {
      ttl: CacheConfig.LONG_TTL,
      version: '1.0'
    });
  }

  // Método específico para órgãos - buscar por nome fantasia
  async findByNomeFantasia(nomeFantasia: string): Promise<Orgao | null> {
    await this.delay();
    const item = this.data.find(item => 
      item.nomeCompleto.toLowerCase() === nomeFantasia.toLowerCase()
    );
    return item ? this.clone(item) : null;
  }

  // Método para verificar se nome já existe
  async nomeCompletoExists(nomeCompleto: string, excludeId?: number): Promise<boolean> {
    await this.delay();
    return this.data.some(item => 
      item.nomeCompleto.toLowerCase() === nomeCompleto.toLowerCase() && 
      item.id !== excludeId
    );
  }

  // Método para buscar órgãos ativos (se houver campo de status no futuro)
  async findActive(): Promise<Orgao[]> {
    await this.delay();
    // Por enquanto retorna todos, mas pode ser expandido
    return this.clone(this.data);
  }
}

// Singleton instance
export const orgaosRepository = new OrgaosRepository();