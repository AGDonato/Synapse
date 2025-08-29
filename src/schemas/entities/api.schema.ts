/**
 * SCHEMAS PARA OPERAÇÕES DE API E AUTENTICAÇÃO
 *
 * Este arquivo define schemas padronizados para comunicação com APIs.
 * Implementa validações para:
 * - Respostas padronizadas da API (success, data, errors, meta)
 * - Tratamento de erros com códigos e mensagens
 * - Paginação server-side com ordenação e busca
 * - Upload de arquivos com validação de tipo e tamanho
 * - Payload JWT para autenticação e autorização
 *
 * Utiliza Zod para validação runtime e inferência de tipos.
 * Fornece tipos TypeScript derivados para uso em toda a aplicação.
 * Limites e restrições seguem boas práticas de segurança.
 */

// src/schemas/entities/api.schema.ts
import { z } from 'zod';
/**
 * Schema para respostas padronizadas da API
 * - success: indica se operação foi bem-sucedida
 * - data: conteúdo da resposta (genérico)
 * - message: mensagem explicativa opcional
 * - errors: array de mensagens de erro
 * - meta: metadados de paginação e estatísticas
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  message: z.string().optional(),
  errors: z.array(z.string()).optional(),
  meta: z
    .object({
      total: z.number().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
      totalPages: z.number().optional(),
    })
    .optional(),
});

/**
 * Schema para tratamento de erros da API
 * - success: sempre false para erros
 * - message: mensagem principal do erro
 * - errors: detalhes adicionais dos erros
 * - code: código interno do erro
 * - statusCode: código HTTP do erro
 */
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.string()).optional(),
  code: z.string().optional(),
  statusCode: z.number().optional(),
});

/**
 * Schema para parâmetros de paginação e ordenação
 * - page: número da página (mínimo 1)
 * - limit: itens por página (1-100, padrão 10)
 * - sortBy: campo para ordenação
 * - sortOrder: direção da ordenação (asc/desc)
 * - search: termo de busca textual
 */
export const PaginationSchema = z.object({
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limit deve ser maior que 0').max(100, 'Limit máximo é 100').default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

/**
 * Schema para upload de arquivos com restrições de segurança
 * - file: instância de File obrigatória
 * - Limite de tamanho: 10MB máximo
 * - Tipos permitidos: PDF, JPG, PNG, DOC, DOCX
 * - description: descrição opcional do arquivo
 */
export const FileUploadSchema = z.object({
  file: z
    .instanceof(File, { message: 'Arquivo é obrigatório' })
    .refine(file => file.size <= 10 * 1024 * 1024, 'Arquivo deve ter no máximo 10MB')
    .refine(file => {
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      return allowedTypes.includes(file.type);
    }, 'Tipo de arquivo não permitido'),
  description: z.string().optional(),
});

/**
 * Schema para payload de tokens JWT
 * - sub: ID único do usuário (subject)
 * - email: endereço de email validado
 * - name: nome de exibição do usuário
 * - roles: funções/cargos do usuário
 * - permissions: permissões específicas
 * - iat: timestamp de emissão (issued at)
 * - exp: timestamp de expiração
 */
export const JwtPayloadSchema = z.object({
  sub: z.string(), // user ID
  email: z.string().email(),
  name: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  iat: z.number(),
  exp: z.number(),
});

/**
 * Tipos TypeScript inferidos dos schemas
 * Utilizados em toda a aplicação para type safety
 */
export type ApiResponse<T = unknown> = z.infer<typeof ApiResponseSchema> & { data?: T };
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
