import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { RedisClientType, createClient } from 'redis';

import { config } from './config/environment';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Rotas
import authRoutes from './routes/auth';
import demandaRoutes from './routes/demandas';
import documentoRoutes from './routes/documentos';
import userRoutes from './routes/users';
import uploadRoutes from './routes/upload';

// Serviços
import { SocketService } from './services/socketService';

class SynapseServer {
  private app: express.Application;
  private server: any;
  private io: Server;
  private prisma: PrismaClient;
  private redis: RedisClientType;
  private socketService: SocketService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.prisma = new PrismaClient();
    this.redis = createClient({ url: config.REDIS_URL });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Middleware de segurança
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Limitação de taxa
    const limiter = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      message: { error: 'Muitas solicitações, tente novamente mais tarde.' },
    });
    this.app.use(limiter);

    // Análise do corpo da solicitação
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Log de solicitações
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Verificação de saúde
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // Rotas da API
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/demandas', authMiddleware, demandaRoutes);
    this.app.use('/api/documentos', authMiddleware, documentoRoutes);
    this.app.use('/api/users', authMiddleware, userRoutes);
    this.app.use('/api/upload', authMiddleware, uploadRoutes);

    // Manipulador 404
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Rota não encontrada' });
    });
  }

  private setupWebSocket(): void {
    this.io = new Server(this.server, {
      cors: {
        origin: config.WS_CORS_ORIGIN,
        methods: ['GET', 'POST'],
      },
    });

    this.socketService = new SocketService(this.io, this.prisma);
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);

    process.on('uncaughtException', (error) => {
      logger.error('Exceção não capturada:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Rejeição não manipulada em:', promise, 'motivo:', reason);
      process.exit(1);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM recebido');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT recebido');
      this.shutdown();
    });
  }

  private async connectDatabases(): Promise<void> {
    try {
      // Conectar ao PostgreSQL via Prisma
      await this.prisma.$connect();
      logger.info('Conectado ao banco de dados PostgreSQL');

      // Conectar ao Redis
      await this.redis.connect();
      logger.info('Conectado ao cache Redis');
    } catch (error) {
      logger.error('Falha na conexão com o banco de dados:', error);
      throw error;
    }
  }

  private async shutdown(): Promise<void> {
    logger.info('Desligando servidor...');

    this.server.close(() => {
      logger.info('Servidor HTTP fechado');
    });

    await this.prisma.$disconnect();
    await this.redis.quit();

    logger.info('Desligamento do servidor concluído');
    process.exit(0);
  }

  public async start(): Promise<void> {
    try {
      await this.connectDatabases();

      this.server.listen(config.PORT, () => {
          logger.info(`🚀 Synapse Backend rodando na porta ${config.PORT}`);
        logger.info(`📊 Ambiente: ${config.NODE_ENV}`);
        logger.info(`🔍 Verificação de saúde: http://localhost:${config.PORT}/health`);
      });
    } catch (error) {
      logger.error('Falha ao iniciar servidor:', error);
      process.exit(1);
    }
  }
}

// Iniciar o servidor
const server = new SynapseServer();
server.start();

export default server;