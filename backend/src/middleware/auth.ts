import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/environment';
import { UnauthorizedError } from './errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Estender interface Request para incluir usuário
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

// Interface do payload JWT
interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

// Extrair token dos cabeçalhos da solicitação
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Verificar formato de token Bearer
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

// Verificar token JWT
const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expirado');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Token inválido');
    } else {
      throw new UnauthorizedError('Verificação do token falhou');
    }
  }
};

// Middleware principal de autenticação
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extrair token da solicitação
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError('Nenhum token fornecido');
    }

    // Verificar token JWT
    const payload = verifyToken(token);

    // Verificar se a sessão do usuário existe e é válida
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedError('Sessão inválida');
    }

    // Verificar se a sessão está expirada
    if (session.expiresAt < new Date()) {
      // Limpar sessão expirada
      await prisma.userSession.delete({
        where: { id: session.id },
      });
      throw new UnauthorizedError('Sessão expirada');
    }

    // Verificar se o usuário está ativo
    if (!session.user.active) {
      throw new UnauthorizedError('Conta do usuário está inativa');
    }

    // Adicionar informações do usuário à solicitação
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    };

    // Registrar autenticação bem-sucedida
    logger.debug('Usuário autenticado', {
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware de autenticação opcional (não lança erro se não houver token)
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }

    const payload = verifyToken(token);
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (session && session.expiresAt > new Date() && session.user.active) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      };
    }

    next();
  } catch (error) {
    // Não disparar erro para autenticação opcional
    next();
  }
};

// Middleware de autorização baseada em papel
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Autenticação necessária');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new UnauthorizedError('Permissões insuficientes');
    }

    next();
  };
};

// Middleware apenas para administrador
export const requireAdmin = requireRole(['ADMIN']);

// Middleware para usuário ou administrador
export const requireUserOrAdmin = requireRole(['USER', 'ADMIN']);

// Middleware de propriedade de recurso
export const requireOwnership = (
  getResourceOwnerId: (req: Request) => Promise<string>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Autenticação necessária');
      }

      // Admin pode acessar qualquer recurso
      if (req.user.role === 'ADMIN') {
        return next();
      }

      const resourceOwnerId = await getResourceOwnerId(req);
      
      if (req.user.id !== resourceOwnerId) {
        throw new UnauthorizedError('Acesso negado a este recurso');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};