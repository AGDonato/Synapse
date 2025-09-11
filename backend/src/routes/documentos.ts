import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createDocumentoSchema = z.object({
  numero: z.string().min(1, 'Número is required'),
  tipo: z.enum(['OFICIO', 'MEMORANDO', 'RESPOSTA', 'SOLICITACAO', 'RELATORIO']),
  assunto: z.string().min(1, 'Assunto is required'),
  destinatario: z.string().min(1, 'Destinatário is required'),
  enderecamento: z.string().optional(),
  dataElaboracao: z.string().transform(str => new Date(str)),
  dataEnvio: z.string().transform(str => new Date(str)).optional(),
  status: z.enum(['RASCUNHO', 'PENDENTE_REVISAO', 'APROVADO', 'ENVIADO', 'CANCELADO']).optional(),
  conteudo: z.string().optional(),
  demandaId: z.string().optional(),
});

const updateDocumentoSchema = createDocumentoSchema.partial();

// GET /api/documentos
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = '1',
    limit = '10',
    search,
    tipo,
    status,
    demandaId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};

  // Only show user's documentos unless admin
  if (req.user?.role !== 'ADMIN') {
    where.createdBy = req.user?.id;
  }

  if (search) {
    where.OR = [
      { numero: { contains: search as string, mode: 'insensitive' } },
      { assunto: { contains: search as string, mode: 'insensitive' } },
      { destinatario: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (tipo) {
    where.tipo = tipo;
  }

  if (status) {
    where.status = status;
  }

  if (demandaId) {
    where.demandaId = demandaId;
  }

  // Execute queries
  const [documentos, total] = await Promise.all([
    prisma.documento.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        demanda: {
          select: { id: true, numero: true, assunto: true, status: true },
        },
      },
    }),
    prisma.documento.count({ where }),
  ]);

  res.json({
    data: documentos,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
}));

// GET /api/documentos/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const documento = await prisma.documento.findUnique({
    where: { id: req.params.id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      demanda: {
        select: { id: true, numero: true, assunto: true, status: true },
      },
    },
  });

  if (!documento) {
    throw new NotFoundError('Documento not found');
  }

  // Check ownership if not admin
  if (req.user?.role !== 'ADMIN' && documento.createdBy !== req.user?.id) {
    throw new NotFoundError('Documento not found');
  }

  res.json({ data: documento });
}));

// POST /api/documentos
router.post('/', asyncHandler(async (req, res) => {
  // Validate request body
  const result = createDocumentoSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid documento data');
  }

  const data = result.data;

  // Check if numero already exists
  const existingDocumento = await prisma.documento.findUnique({
    where: { numero: data.numero },
  });

  if (existingDocumento) {
    throw new ValidationError('Documento with this number already exists');
  }

  // Verify demanda exists and user has access to it (if provided)
  if (data.demandaId) {
    const demanda = await prisma.demanda.findUnique({
      where: { id: data.demandaId },
    });

    if (!demanda) {
      throw new ValidationError('Demanda not found');
    }

    if (req.user?.role !== 'ADMIN' && demanda.createdBy !== req.user?.id) {
      throw new ValidationError('Access denied to this demanda');
    }
  }

  // Create documento
  const documento = await prisma.documento.create({
    data: {
      ...data,
      createdBy: req.user!.id,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      demanda: {
        select: { id: true, numero: true, assunto: true },
      },
    },
  });

  // Add timeline entry to demanda if linked
  if (documento.demandaId) {
    await prisma.timeline.create({
      data: {
        demandaId: documento.demandaId,
        evento: 'DOCUMENTO_ADICIONADO',
        descricao: `Documento ${documento.numero} adicionado`,
      },
    });
  }

  logger.info('Documento created', {
    documentoId: documento.id,
    numero: documento.numero,
    createdBy: req.user?.id,
  });

  res.status(201).json({ data: documento });
}));

// PUT /api/documentos/:id
router.put('/:id', asyncHandler(async (req, res) => {
  // Validate request body
  const result = updateDocumentoSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Invalid documento data');
  }

  const data = result.data;

  // Find existing documento
  const existingDocumento = await prisma.documento.findUnique({
    where: { id: req.params.id },
  });

  if (!existingDocumento) {
    throw new NotFoundError('Documento not found');
  }

  // Check ownership if not admin
  if (req.user?.role !== 'ADMIN' && existingDocumento.createdBy !== req.user?.id) {
    throw new NotFoundError('Documento not found');
  }

  // Check if numero is being changed and already exists
  if (data.numero && data.numero !== existingDocumento.numero) {
    const numeroExists = await prisma.documento.findUnique({
      where: { numero: data.numero },
    });

    if (numeroExists) {
      throw new ValidationError('Documento with this number already exists');
    }
  }

  // Verify new demanda exists and user has access to it (if being changed)
  if (data.demandaId && data.demandaId !== existingDocumento.demandaId) {
    const demanda = await prisma.demanda.findUnique({
      where: { id: data.demandaId },
    });

    if (!demanda) {
      throw new ValidationError('Demanda not found');
    }

    if (req.user?.role !== 'ADMIN' && demanda.createdBy !== req.user?.id) {
      throw new ValidationError('Access denied to this demanda');
    }
  }

  // Update documento
  const documento = await prisma.documento.update({
    where: { id: req.params.id },
    data,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      demanda: {
        select: { id: true, numero: true, assunto: true },
      },
    },
  });

  logger.info('Documento updated', {
    documentoId: documento.id,
    numero: documento.numero,
    updatedBy: req.user?.id,
  });

  res.json({ data: documento });
}));

// DELETE /api/documentos/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  // Find existing documento
  const existingDocumento = await prisma.documento.findUnique({
    where: { id: req.params.id },
  });

  if (!existingDocumento) {
    throw new NotFoundError('Documento not found');
  }

  // Check ownership if not admin
  if (req.user?.role !== 'ADMIN' && existingDocumento.createdBy !== req.user?.id) {
    throw new NotFoundError('Documento not found');
  }

  // Delete documento
  await prisma.documento.delete({
    where: { id: req.params.id },
  });

  logger.info('Documento deleted', {
    documentoId: req.params.id,
    numero: existingDocumento.numero,
    deletedBy: req.user?.id,
  });

  res.json({ message: 'Documento deleted successfully' });
}));

export default router;