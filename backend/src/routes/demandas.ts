import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { requireOwnership } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createDemandaSchema = z.object({
  numero: z.string().min(1, 'Número is required'),
  assunto: z.string().min(1, 'Assunto is required'),
  orgaoSolicitante: z.string().min(1, 'Órgão solicitante is required'),
  autoridade: z.string().optional(),
  dataSolicitacao: z.string().transform(str => new Date(str)),
  dataLimite: z.string().transform(str => new Date(str)).optional(),
  status: z.enum(['PENDENTE', 'EM_ANDAMENTO', 'AGUARDANDO_RESPOSTA', 'CONCLUIDA', 'CANCELADA']).optional(),
  prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
  autosAdministrativos: z.string().optional(),
  observacoes: z.string().optional(),
});

const updateDemandaSchema = createDemandaSchema.partial();

// GET /api/demandas
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = '1',
    limit = '10',
    search,
    status,
    prioridade,
    orgaoSolicitante,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};

  // Only show user's demandas unless admin
  if (req.user?.role !== 'ADMIN') {
    where.createdBy = req.user?.id;
  }

  if (search) {
    where.OR = [
      { numero: { contains: search as string, mode: 'insensitive' } },
      { assunto: { contains: search as string, mode: 'insensitive' } },
      { orgaoSolicitante: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (prioridade) {
    where.prioridade = prioridade;
  }

  if (orgaoSolicitante) {
    where.orgaoSolicitante = { contains: orgaoSolicitante as string, mode: 'insensitive' };
  }

  // Execute queries
  const [demandas, total] = await Promise.all([
    prisma.demanda.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        documentos: {
          select: { id: true, numero: true, tipo: true, status: true },
        },
        _count: {
          select: { documentos: true },
        },
      },
    }),
    prisma.demanda.count({ where }),
  ]);

  res.json({
    data: demandas,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
}));

// GET /api/demandas/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const demanda = await prisma.demanda.findUnique({
    where: { id: req.params.id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      documentos: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      timeline: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!demanda) {
    throw new NotFoundError('Demanda not found');
  }

  // Check ownership if not admin
  if (req.user?.role !== 'ADMIN' && demanda.createdBy !== req.user?.id) {
    throw new NotFoundError('Demanda not found');
  }

  res.json({ data: demanda });
}));

// POST /api/demandas
router.post('/', asyncHandler(async (req, res) => {
  // Validate request body
  const result = createDemandaSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid demanda data');
  }

  const data = result.data;

  // Check if numero already exists
  const existingDemanda = await prisma.demanda.findUnique({
    where: { numero: data.numero },
  });

  if (existingDemanda) {
    throw new ValidationError('Demanda with this number already exists');
  }

  // Create demanda
  const demanda = await prisma.demanda.create({
    data: {
      ...data,
      createdBy: req.user!.id,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Add timeline entry
  await prisma.timeline.create({
    data: {
      demandaId: demanda.id,
      evento: 'CRIACAO',
      descricao: 'Demanda criada',
    },
  });

  logger.info('Demanda created', {
    demandaId: demanda.id,
    numero: demanda.numero,
    createdBy: req.user?.id,
  });

  res.status(201).json({ data: demanda });
}));

// PUT /api/demandas/:id
router.put('/:id', asyncHandler(async (req, res) => {
  // Validate request body
  const result = updateDemandaSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid demanda data');
  }

  const data = result.data;

  // Find existing demanda
  const existingDemanda = await prisma.demanda.findUnique({
    where: { id: req.params.id },
  });

  if (!existingDemanda) {
    throw new NotFoundError('Demanda not found');
  }

  // Check ownership if not admin
  if (req.user?.role !== 'ADMIN' && existingDemanda.createdBy !== req.user?.id) {
    throw new NotFoundError('Demanda not found');
  }

  // Check if numero is being changed and already exists
  if (data.numero && data.numero !== existingDemanda.numero) {
    const numeroExists = await prisma.demanda.findUnique({
      where: { numero: data.numero },
    });

    if (numeroExists) {
      throw new ValidationError('Demanda with this number already exists');
    }
  }

  // Update demanda
  const demanda = await prisma.demanda.update({
    where: { id: req.params.id },
    data,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Add timeline entry for significant changes
  if (data.status && data.status !== existingDemanda.status) {
    await prisma.timeline.create({
      data: {
        demandaId: demanda.id,
        evento: 'STATUS_CHANGE',
        descricao: `Status alterado de ${existingDemanda.status} para ${data.status}`,
      },
    });
  }

  logger.info('Demanda updated', {
    demandaId: demanda.id,
    numero: demanda.numero,
    updatedBy: req.user?.id,
  });

  res.json({ data: demanda });
}));

// DELETE /api/demandas/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  // Find existing demanda
  const existingDemanda = await prisma.demanda.findUnique({
    where: { id: req.params.id },
  });

  if (!existingDemanda) {
    throw new NotFoundError('Demanda not found');
  }

  // Check ownership if not admin
  if (req.user?.role !== 'ADMIN' && existingDemanda.createdBy !== req.user?.id) {
    throw new NotFoundError('Demanda not found');
  }

  // Delete demanda (cascade will handle related records)
  await prisma.demanda.delete({
    where: { id: req.params.id },
  });

  logger.info('Demanda deleted', {
    demandaId: req.params.id,
    numero: existingDemanda.numero,
    deletedBy: req.user?.id,
  });

  res.json({ message: 'Demanda deleted successfully' });
}));

// GET /api/demandas/:id/stats
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const demanda = await prisma.demanda.findUnique({
    where: { id: req.params.id },
    include: {
      documentos: true,
      timeline: true,
    },
  });

  if (!demanda) {
    throw new NotFoundError('Demanda not found');
  }

  // Check ownership if not admin
  if (req.user?.role !== 'ADMIN' && demanda.createdBy !== req.user?.id) {
    throw new NotFoundError('Demanda not found');
  }

  const stats = {
    totalDocumentos: demanda.documentos.length,
    documentosPorStatus: demanda.documentos.reduce((acc: any, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {}),
    diasAbertos: Math.ceil((new Date().getTime() - demanda.dataSolicitacao.getTime()) / (1000 * 60 * 60 * 24)),
    diasRestantes: demanda.dataLimite
      ? Math.ceil((demanda.dataLimite.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null,
    totalEventos: demanda.timeline.length,
  };

  res.json({ data: stats });
}));

export default router;