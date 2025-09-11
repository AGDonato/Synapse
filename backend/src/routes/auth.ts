import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/environment';
import { asyncHandler, ValidationError, UnauthorizedError } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
});

// Gerar tokens JWT
const generateTokens = (user: any) => {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

// Create user session
const createSession = async (user: any, token: string, req: any) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  return prisma.userSession.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || null,
    },
  });
};

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  // Validate request body
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid login data');
  }

  const { email, password } = result.data;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check if user is active
  if (!user.active) {
    throw new UnauthorizedError('Account is inactive');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Create session
  await createSession(user, accessToken, req);

  // Log successful login
  logger.info('User logged in', {
    userId: user.id,
    email: user.email,
    ip: req.ip,
  });

  // Return response without password
  const { password: _, ...userResponse } = user;
  res.json({
    user: userResponse,
    accessToken,
    refreshToken,
    expiresIn: config.JWT_EXPIRES_IN,
  });
}));

// POST /api/auth/register (optional - if registration is enabled)
router.post('/register', asyncHandler(async (req, res) => {
  // Validate request body
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid registration data');
  }

  const { name, email, password } = result.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'USER',
      active: true,
    },
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Create session
  await createSession(user, accessToken, req);

  // Log successful registration
  logger.info('User registered', {
    userId: user.id,
    email: user.email,
    ip: req.ip,
  });

  // Return response without password
  const { password: _, ...userResponse } = user;
  res.status(201).json({
    user: userResponse,
    accessToken,
    refreshToken,
    expiresIn: config.JWT_EXPIRES_IN,
  });
}));

// POST /api/auth/logout
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    // Remove session from database
    await prisma.userSession.deleteMany({
      where: { token },
    });

    logger.info('User logged out', {
      userId: req.user?.id,
      ip: req.ip,
    });
  }

  res.json({ message: 'Logged out successfully' });
}));

// GET /api/auth/me
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
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

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  res.json({ user });
}));

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, asyncHandler(async (req, res) => {
  // Validate request body
  const result = changePasswordSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid password change data');
  }

  const { currentPassword, newPassword } = result.data;

  // Get current user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNewPassword },
  });

  // Invalidate all sessions for this user (force re-login)
  await prisma.userSession.deleteMany({
    where: { userId: user.id },
  });

  logger.info('Password changed', {
    userId: user.id,
    email: user.email,
    ip: req.ip,
  });

  res.json({ message: 'Password changed successfully' });
}));

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token is required');
  }

  try {
    const payload = jwt.verify(refreshToken, config.JWT_SECRET) as any;
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.active) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: config.JWT_EXPIRES_IN,
    });
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
}));

export default router;