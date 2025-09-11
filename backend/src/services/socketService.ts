import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

export class SocketService {
  private io: Server;
  private prisma: PrismaClient;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(io: Server, prisma: PrismaClient) {
    this.io = io;
    this.prisma = prisma;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
  }

  // Middleware para autenticar conexões socket
  private async authenticateSocket(socket: AuthenticatedSocket, next: any): Promise<void> {
    try {
      const token = socket.handshake.auth?.token;
      
      if (!token) {
        return next(new Error('Nenhum token fornecido'));
      }

      // Verificar token JWT
      const payload = jwt.verify(token, config.JWT_SECRET) as any;

      // Verificar se a sessão existe e é válida
      const session = await this.prisma.userSession.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date() || !session.user.active) {
        return next(new Error('Sessão inválida ou expirada'));
      }

      // Adicionar informações do usuário ao socket
      socket.userId = session.user.id;
      socket.userEmail = session.user.email;

      next();
    } catch (error) {
      next(new Error('Autenticação falhou'));
    }
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    
    logger.info('Socket conectado', {
      socketId: socket.id,
      userId,
      userEmail: socket.userEmail,
    });

    // Rastrear usuário conectado
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socket.id);

    // Entrar na sala do usuário para notificações pessoais
    socket.join(`user:${userId}`);

    // Notificar outros usuários que este usuário ficou online
    socket.broadcast.emit('user:online', {
      userId,
      userEmail: socket.userEmail,
    });

    // Enviar lista de usuários ativos para usuário recém conectado
    this.sendActiveUsersList(socket);

    // Manipular eventos personalizados
    this.setupSocketEvents(socket);

    // Manipular desconexão
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  private setupSocketEvents(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;

    // Entrar na sala da demanda para atualizações em tempo real
    socket.on('join:demanda', (demandaId: string) => {
      socket.join(`demanda:${demandaId}`);
      logger.debug('Usuário entrou na sala da demanda', {
        userId,
        demandaId,
        socketId: socket.id,
      });
    });

    // Sair da sala da demanda
    socket.on('leave:demanda', (demandaId: string) => {
      socket.leave(`demanda:${demandaId}`);
      logger.debug('Usuário saiu da sala da demanda', {
        userId,
        demandaId,
        socketId: socket.id,
      });
    });

    // Manipular indicadores de digitação para discussões de demanda
    socket.on('demanda:typing:start', (demandaId: string) => {
      socket.to(`demanda:${demandaId}`).emit('demanda:typing', {
        userId,
        userEmail: socket.userEmail,
        isTyping: true,
      });
    });

    socket.on('demanda:typing:stop', (demandaId: string) => {
      socket.to(`demanda:${demandaId}`).emit('demanda:typing', {
        userId,
        userEmail: socket.userEmail,
        isTyping: false,
      });
    });

    // Manipular atualizações de colaboração em tempo real
    socket.on('document:editing', (data: { documentId: string; section: string }) => {
      socket.broadcast.emit('document:being-edited', {
        documentId: data.documentId,
        section: data.section,
        editedBy: {
          userId,
          userEmail: socket.userEmail,
        },
      });
    });
  }

  private handleDisconnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;

    logger.info('Socket desconectado', {
      socketId: socket.id,
      userId,
      userEmail: socket.userEmail,
    });

    // Remover do rastreamento de usuários conectados
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      
      // Se o usuário não tem mais conexões, notificar outros que ele ficou offline
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
        socket.broadcast.emit('user:offline', {
          userId,
          userEmail: socket.userEmail,
        });
      }
    }
  }

  private sendActiveUsersList(socket: AuthenticatedSocket): void {
    const activeUsers = Array.from(this.connectedUsers.entries()).map(([userId, sockets]) => ({
      userId,
      connectionCount: sockets.size,
    }));

    socket.emit('users:active', activeUsers);
  }

  // Métodos públicos para emitir eventos de outras partes da aplicação

  // Notificar sobre atualizações de demanda
  public notifyDemandaUpdate(demandaId: string, data: any): void {
    this.io.to(`demanda:${demandaId}`).emit('demanda:updated', {
      demandaId,
      ...data,
      timestamp: new Date(),
    });
  }

  // Notificar sobre novo documento adicionado à demanda
  public notifyDocumentoAdded(demandaId: string, documento: any): void {
    this.io.to(`demanda:${demandaId}`).emit('documento:added', {
      demandaId,
      documento,
      timestamp: new Date(),
    });
  }

  // Enviar notificação pessoal para usuário específico
  public sendPersonalNotification(userId: string, notification: any): void {
    this.io.to(`user:${userId}`).emit('notification:personal', {
      ...notification,
      timestamp: new Date(),
    });
  }

  // Transmitir notificação para todo o sistema
  public broadcastSystemNotification(notification: any): void {
    this.io.emit('notification:system', {
      ...notification,
      timestamp: new Date(),
    });
  }

  // Obter contagem de usuários conectados
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Verificar se o usuário está online
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Obter todos os usuários ativos
  public getActiveUsers(): Array<{ userId: string; connectionCount: number }> {
    return Array.from(this.connectedUsers.entries()).map(([userId, sockets]) => ({
      userId,
      connectionCount: sockets.size,
    }));
  }
}