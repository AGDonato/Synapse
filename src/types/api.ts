// src/types/api.ts

import type { BaseEntity } from './entities';

// Re-export BaseEntity
export type { BaseEntity } from './entities';

// Generic CRUD operation types
export type CreateDTO<T extends BaseEntity> = Omit<T, 'id'>;
export type UpdateDTO<T extends BaseEntity> = Partial<CreateDTO<T>>;

// API Response types
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string | number;
  details?: unknown;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Search and filter types
export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
}

// Service operation results
export type ServiceResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ApiError;
    };
