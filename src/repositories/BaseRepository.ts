// src/repositories/BaseRepository.ts

import type { BaseEntity, CreateDTO, UpdateDTO } from '../types/api';
import { type StorageOptions, storage } from '../utils/storage';

export interface Repository<T extends BaseEntity> {
  // Read operations
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  findByIds(ids: number[]): Promise<T[]>;
  
  // Search operations
  search(query: string): Promise<T[]>;
  findWhere(predicate: (item: T) => boolean): Promise<T[]>;
  
  // Write operations
  create(data: CreateDTO<T>): Promise<T>;
  update(id: number, data: UpdateDTO<T>): Promise<T>;
  delete(id: number): Promise<void>;
  
  // Bulk operations
  bulkCreate(data: CreateDTO<T>[]): Promise<T[]>;
  bulkUpdate(updates: { id: number; data: UpdateDTO<T> }[]): Promise<T[]>;
  bulkDelete(ids: number[]): Promise<void>;
  
  // Utility operations
  count(): Promise<number>;
  exists(id: number): Promise<boolean>;
}

export abstract class BaseRepository<T extends BaseEntity> implements Repository<T> {
  protected abstract data: T[];
  protected abstract entityName: string;
  protected cacheKey: string;
  protected cacheOptions: StorageOptions;

  constructor(cacheKey: string, cacheOptions: StorageOptions = {}) {
    this.cacheKey = cacheKey;
    this.cacheOptions = {
      ttl: 30 * 60 * 1000, // 30 minutes default
      version: '1.0',
      ...cacheOptions,
    };
  }

  // Helper method to generate IDs
  protected generateId(): number {
    const maxId = this.data.length === 0 
      ? 0 
      : Math.max(...this.data.map(item => item.id));
    return maxId + 1;
  }

  // Helper method to simulate API delay
  protected async delay(ms = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper method to clone data (immutability)
  protected clone<U>(obj: U): U {
    return JSON.parse(JSON.stringify(obj));
  }

  // Cache helper methods
  protected saveToCache(data: T[]): void {
    storage.set(this.cacheKey, data, this.cacheOptions);
  }

  protected loadFromCache(): T[] | null {
    return storage.get<T[]>(this.cacheKey, this.cacheOptions.version);
  }

  protected clearCache(): void {
    storage.remove(this.cacheKey);
  }

  protected syncDataWithCache(): void {
    this.saveToCache(this.data);
  }

  // Read operations
  async findAll(): Promise<T[]> {
    await this.delay();
    
    // Try to load from cache first
    const cached = this.loadFromCache();
    if (cached) {
      this.data = cached;
      return this.clone(this.data);
    }
    
    // Save to cache and return
    this.syncDataWithCache();
    return this.clone(this.data);
  }

  async findById(id: number): Promise<T | null> {
    await this.delay();
    const item = this.data.find(item => item.id === id);
    return item ? this.clone(item) : null;
  }

  async findByIds(ids: number[]): Promise<T[]> {
    await this.delay();
    const items = this.data.filter(item => ids.includes(item.id));
    return this.clone(items);
  }

  // Search operations
  async search(query: string): Promise<T[]> {
    await this.delay();
    const lowercaseQuery = query.toLowerCase().trim();
    
    if (!lowercaseQuery) {
      return this.findAll();
    }
    
    const results = this.data.filter(item =>
      Object.values(item).some(value =>
        typeof value === 'string' && 
        value.toLowerCase().includes(lowercaseQuery)
      )
    );
    
    return this.clone(results);
  }

  async findWhere(predicate: (item: T) => boolean): Promise<T[]> {
    await this.delay();
    const results = this.data.filter(predicate);
    return this.clone(results);
  }

  // Write operations
  async create(data: CreateDTO<T>): Promise<T> {
    await this.delay(200);
    
    const newItem = {
      ...data,
      id: this.generateId()
    } as T;
    
    this.data.push(newItem);
    this.syncDataWithCache(); // Update cache
    return this.clone(newItem);
  }

  async update(id: number, data: UpdateDTO<T>): Promise<T> {
    await this.delay(200);
    
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`${this.entityName} with ID ${id} not found`);
    }
    
    this.data[index] = { ...this.data[index], ...data };
    this.syncDataWithCache(); // Update cache
    return this.clone(this.data[index]);
  }

  async delete(id: number): Promise<void> {
    await this.delay(150);
    
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`${this.entityName} with ID ${id} not found`);
    }
    
    this.data.splice(index, 1);
    this.syncDataWithCache(); // Update cache
  }

  // Bulk operations
  async bulkCreate(dataArray: CreateDTO<T>[]): Promise<T[]> {
    await this.delay(300);
    
    const newItems = dataArray.map(data => ({
      ...data,
      id: this.generateId()
    } as T));
    
    this.data.push(...newItems);
    return this.clone(newItems);
  }

  async bulkUpdate(updates: { id: number; data: UpdateDTO<T> }[]): Promise<T[]> {
    await this.delay(300);
    
    const updatedItems: T[] = [];
    
    for (const { id, data } of updates) {
      const index = this.data.findIndex(item => item.id === id);
      if (index !== -1) {
        this.data[index] = { ...this.data[index], ...data };
        updatedItems.push(this.data[index]);
      }
    }
    
    return this.clone(updatedItems);
  }

  async bulkDelete(ids: number[]): Promise<void> {
    await this.delay(250);
    
    this.data = this.data.filter(item => !ids.includes(item.id));
  }

  // Utility operations
  async count(): Promise<number> {
    await this.delay(50);
    return this.data.length;
  }

  async exists(id: number): Promise<boolean> {
    await this.delay(50);
    return this.data.some(item => item.id === id);
  }
}