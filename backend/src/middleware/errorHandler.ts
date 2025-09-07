import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { isDevelopment } from '../config/environment';

// Tipos de erro customizados
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Proibido') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

// Interface de resposta de erro
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: any;
  stack?: string;
}

// Manipulador principal de erros
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Erro interno do servidor';
  let details: any = undefined;

  // Registrar o erro
  logger.error('Erro ocorreu', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Tratar diferentes tipos de erro
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validação falhou';
    details = {
      issues: error.errors.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    };
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const { code, meta } = error;
    
    switch (code) {
      case 'P2002': // Violação de restrição única
        statusCode = 409;
        message = 'Recurso já existe';
        if (meta?.target) {
          details = { conflictingFields: meta.target };
        }
        break;
      case 'P2025': // Registro não encontrado
        statusCode = 404;
        message = 'Recurso não encontrado';
        break;
      case 'P2003': // Violação de restrição de chave estrangeira
        statusCode = 400;
        message = 'Referência inválida para recurso relacionado';
        break;
      case 'P2014': // Relação inválida
        statusCode = 400;
        message = 'Relação inválida na solicitação';
        break;
      default:
        statusCode = 500;
        message = 'Operação no banco de dados falhou';
        if (isDevelopment) {
          details = { code, meta };
        }
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Dados inválidos fornecidos';
    if (isDevelopment) {
      details = { originalError: error.message };
    }
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    statusCode = 400;
    message = 'JSON inválido no corpo da solicitação';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    const multerError = error as any;
    
    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'Arquivo muito grande';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Muitos arquivos';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Campo de arquivo inesperado';
        break;
      default:
        message = 'Erro no upload de arquivo';
    }
  }

  // Preparar resposta de erro
  const errorResponse: ErrorResponse = {
    error: 'Solicitação falhou',
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  // Adicionar detalhes no modo de desenvolvimento
  if (isDevelopment) {
    if (details) {
      errorResponse.details = details;
    }
    if (error.stack) {
      errorResponse.stack = error.stack;
    }
  }

  // Não expor informações sensíveis em produção
  if (!isDevelopment && statusCode === 500) {
    errorResponse.message = 'Erro interno do servidor';
  }

  res.status(statusCode).json(errorResponse);
};

// Wrapper para funções assíncronas
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Manipulador 404
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Rota ${req.originalUrl} não encontrada`);
  next(error);
};