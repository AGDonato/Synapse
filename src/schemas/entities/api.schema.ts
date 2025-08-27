// src/schemas/entities/api.schema.ts
import { z } from 'zod';

// Schemas para respostas da API
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  message: z.string().optional(),
  errors: z.array(z.string()).optional(),
  meta: z.object({
    total: z.number().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    totalPages: z.number().optional(),
  }).optional(),
});

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.string()).optional(),
  code: z.string().optional(),
  statusCode: z.number().optional(),
});

// Schema para paginação
export const PaginationSchema = z.object({
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limit deve ser maior que 0').max(100, 'Limit máximo é 100').default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

// Schema para upload de arquivo
export const FileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'Arquivo é obrigatório' })
    .refine((file) => file.size <= 10 * 1024 * 1024, 'Arquivo deve ter no máximo 10MB')
    .refine((file) => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      return allowedTypes.includes(file.type);
    }, 'Tipo de arquivo não permitido'),
  description: z.string().optional(),
});

// Schema para autenticação JWT
export const JwtPayloadSchema = z.object({
  sub: z.string(), // user ID
  email: z.string().email(),
  name: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  iat: z.number(),
  exp: z.number(),
});

// Tipos inferidos
export type ApiResponse<T = unknown> = z.infer<typeof ApiResponseSchema> & { data?: T };
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;