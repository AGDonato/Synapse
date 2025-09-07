import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { requireAdmin, requireUserOrAdmin } from '../middleware/auth';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['USER', 'ADMIN', 'VIEWER']).optional().default('USER'),
  active: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['USER', 'ADMIN', 'VIEWER']).optional(),
  active: z.boolean().optional(),
});

const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// GET /api/users (Admin only)
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const {
    page = '1',
    limit = '10',
    search,
    role,
    active,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (active !== undefined) {
    where.active = active === 'true';
  }

  // Execute queries
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            demandas: true,
            documentos: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    data: users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
}));

// GET /api/users/:id
router.get('/:id', requireUserOrAdmin, asyncHandler(async (req, res) => {
  // Users can only access their own profile, admins can access any
  if (req.user?.role !== 'ADMIN' && req.user?.id !== req.params.id) {
    throw new NotFoundError('User not found');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          demandas: true,
          documentos: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({ data: user });
}));

// POST /api/users (Admin only)
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  // Validate request body
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid user data');
  }

  const data = result.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, config.BCRYPT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      ...data,
      email: data.email.toLowerCase(),
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logger.info('User created by admin', {
    userId: user.id,
    email: user.email,
    createdBy: req.user?.id,
  });

  res.status(201).json({ data: user });
}));

// PUT /api/users/:id
router.put('/:id', requireUserOrAdmin, asyncHandler(async (req, res) => {
  // Users can only update their own profile (except role/active)
  // Admins can update any user
  const isOwnProfile = req.user?.id === req.params.id;
  const isAdmin = req.user?.role === 'ADMIN';

  if (!isOwnProfile && !isAdmin) {
    throw new NotFoundError('User not found');
  }

  // Validate request body
  const result = updateUserSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid user data');
  }

  const data = result.data;

  // Non-admin users cannot change role or active status
  if (!isAdmin && (data.role !== undefined || data.active !== undefined)) {
    throw new ValidationError('Insufficient permissions to update role or status');
  }

  // Find existing user
  const existingUser = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  // Check if email is being changed and already exists
  if (data.email && data.email.toLowerCase() !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (emailExists) {
      throw new ValidationError('User with this email already exists');
    }
  }

  // Update user
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...data,
      ...(data.email && { email: data.email.toLowerCase() }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logger.info('User updated', {
    userId: user.id,
    email: user.email,
    updatedBy: req.user?.id,
    isOwnProfile,
  });

  res.json({ data: user });
}));

// PUT /api/users/:id/password (Admin only)
router.put('/:id/password', requireAdmin, asyncHandler(async (req, res) => {
  // Validate request body
  const result = updatePasswordSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid password data');
  }

  const { password } = result.data;

  // Find existing user
  const existingUser = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: req.params.id },
    data: { password: hashedPassword },
  });

  // Invalidate all sessions for this user
  await prisma.userSession.deleteMany({
    where: { userId: req.params.id },
  });

  logger.info('User password reset by admin', {
    userId: req.params.id,
    resetBy: req.user?.id,
  });

  res.json({ message: 'Password updated successfully' });
}));

// DELETE /api/users/:id (Admin only)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  // Find existing user
  const existingUser = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  // Cannot delete yourself
  if (req.user?.id === req.params.id) {
    throw new ValidationError('Cannot delete your own account');
  }

  // Delete user (cascade will handle related records)
  await prisma.user.delete({
    where: { id: req.params.id },
  });

  logger.info('User deleted by admin', {
    deletedUserId: req.params.id,
    deletedEmail: existingUser.email,
    deletedBy: req.user?.id,
  });

  res.json({ message: 'User deleted successfully' });
}));

// GET /api/users/:id/stats
router.get('/:id/stats', requireUserOrAdmin, asyncHandler(async (req, res) => {
  // Users can only access their own stats, admins can access any
  if (req.user?.role !== 'ADMIN' && req.user?.id !== req.params.id) {
    throw new NotFoundError('User not found');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      demandas: {
        select: { status: true, prioridade: true },
      },
      documentos: {
        select: { status: true, tipo: true },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const stats = {
    totalDemandas: user.demandas.length,
    demandasPorStatus: user.demandas.reduce((acc: any, demanda) => {
      acc[demanda.status] = (acc[demanda.status] || 0) + 1;
      return acc;
    }, {}),
    demandasPorPrioridade: user.demandas.reduce((acc: any, demanda) => {
      acc[demanda.prioridade] = (acc[demanda.prioridade] || 0) + 1;
      return acc;
    }, {}),
    totalDocumentos: user.documentos.length,
    documentosPorStatus: user.documentos.reduce((acc: any, documento) => {
      acc[documento.status] = (acc[documento.status] || 0) + 1;
      return acc;
    }, {}),
    documentosPorTipo: user.documentos.reduce((acc: any, documento) => {
      acc[documento.tipo] = (acc[documento.tipo] || 0) + 1;
      return acc;
    }, {}),
  };

  res.json({ data: stats });
}));

export default router;