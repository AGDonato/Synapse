// src/repositories/AssuntosRepository.ts

import { BaseRepository } from './BaseRepository';
import type { Assunto } from '../types/entities';
import { mockAssuntos } from '../data/mockAssuntos';
import { CacheConfig, CacheKeys } from '../utils/storage';

export class AssuntosRepository extends BaseRepository<Assunto> {
  protected data = [...mockAssuntos];
  protected entityName = 'Assunto';

  constructor() {
    super(CacheKeys.ASSUNTOS, {
      ttl: CacheConfig.LONG_TTL,
      version: '1.0'
    });
  }

  // Método específico para assuntos - buscar por nome exato
  async findByNome(nome: string): Promise<Assunto | null> {
    await this.delay();
    const item = this.data.find(item => 
      item.nome.toLowerCase() === nome.toLowerCase()
    );
    return item ? this.clone(item) : null;
  }

  // Método para verificar se nome já existe (útil para validação)
  async nomeExists(nome: string, excludeId?: number): Promise<boolean> {
    await this.delay();
    return this.data.some(item => 
      item.nome.toLowerCase() === nome.toLowerCase() && 
      item.id !== excludeId
    );
  }

  // Método para buscar assuntos por padrão de nome
  async findByNomePattern(pattern: string): Promise<Assunto[]> {
    await this.delay();
    const regex = new RegExp(pattern, 'i');
    const results = this.data.filter(item => regex.test(item.nome));
    return this.clone(results);
  }
}

// Singleton instance
export const assuntosRepository = new AssuntosRepository();