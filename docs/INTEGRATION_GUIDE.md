# Guia de Integração - Synapse

**✅ ATUALIZADO**: Este guia descreve o **backend Node.js + TypeScript IMPLEMENTADO** e como integrar com o frontend maduro. O projeto possui **255 arquivos TypeScript frontend**, **11 arquivos TypeScript backend**, estrutura de testes configurada, 77 componentes e **backend Node.js completo e funcional**.

## 📋 Status das Funcionalidades de Integração

### ✅ **O que EXISTE e FUNCIONA**

#### **Frontend Maduro**
- **Sistema de Autenticação Frontend**: Preparado e funcionando
- **Estrutura de Serviços**: APIs organizadas em `src/shared/services/`
- **Adaptadores**: Configurados para backend Node.js
- **Tipos TypeScript**: Interfaces completas para integração
- **Testes**: Estrutura configurada (Vitest + RTL + Playwright)

#### **Backend Node.js + TypeScript (IMPLEMENTADO)**
- **✅ Express + TypeScript**: API REST completa
- **✅ Prisma + PostgreSQL**: ORM moderno com banco relacional
- **✅ Socket.io**: WebSocket para colaboração real-time
- **✅ Redis**: Cache e gerenciamento de sessões
- **✅ JWT + bcrypt**: Autenticação segura implementada
- **✅ Multer**: Upload de arquivos funcionando
- **✅ Winston**: Sistema de logging avançado
- **✅ Rate Limiting + Helmet**: Segurança em produção

### 🚀 **Rotas API Implementadas (5 módulos)**

```typescript
// Rotas disponíveis no backend Node.js
├── /api/auth          # Autenticação JWT
│   ├── POST /login    # Login de usuário
│   ├── POST /logout   # Logout e invalidação
│   ├── POST /refresh  # Refresh token
│   └── GET /me        # Dados do usuário atual
├── /api/demandas      # Gestão de demandas
│   ├── GET /          # Listar demandas
│   ├── POST /         # Criar demanda
│   ├── GET /:id       # Detalhes da demanda
│   ├── PUT /:id       # Atualizar demanda
│   └── DELETE /:id    # Remover demanda
├── /api/documentos    # Gestão de documentos
│   ├── GET /          # Listar documentos
│   ├── POST /         # Criar documento
│   ├── GET /:id       # Detalhes do documento
│   ├── PUT /:id       # Atualizar documento
│   └── DELETE /:id    # Remover documento
├── /api/upload        # Upload de arquivos
│   ├── POST /         # Upload único
│   └── POST /multiple # Upload múltiplo
└── /api/users         # Gestão de usuários
    ├── GET /          # Listar usuários
    ├── POST /         # Criar usuário
    ├── GET /:id       # Detalhes do usuário
    └── PUT /:id       # Atualizar usuário
```

### 🗄️ **Banco de Dados (Prisma + PostgreSQL)**

O backend usa **Prisma ORM** com **PostgreSQL** e possui os seguintes modelos implementados:

```prisma
// Principais entidades do schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      UserRole @default(USER)
  active    Boolean  @default(true)
  
  demandas      Demanda[]
  documentos    Documento[]
  userSessions  UserSession[]
  notifications Notification[]
}

model Demanda {
  id          String   @id @default(cuid())
  sged        String   @unique
  tipoDemanda String
  assunto     String
  status      StatusDemanda
  createdAt   DateTime @default(now())
  
  user       User        @relation(fields: [userId], references: [id])
  documentos Documento[]
}

model Documento {
  id           String      @id @default(cuid())
  tipo         TipoDocumento
  numero       String?
  destinatario String
  status       StatusDocumento
  arquivo      String?
  
  demanda    Demanda @relation(fields: [demandaId], references: [id])
  user       User    @relation(fields: [userId], references: [id])
}
```

## 🚀 Início Rápido - Backend Node.js

### 1. Pré-requisitos

```bash
# Node.js 18+ e PostgreSQL
node --version  # >= 18.0.0
psql --version  # PostgreSQL 12+
```

### 2. Configuração do Backend

```bash
# Entrar na pasta do backend
cd backend

# Instalar dependências
npm install

# Configurar banco de dados
cp .env.example .env
# Editar .env com suas configurações
```

### 3. Configuração de Ambiente (.env)

```bash
# Banco de dados PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/synapse"

# JWT e autenticação
JWT_SECRET="seu-jwt-secret-super-seguro"
JWT_REFRESH_SECRET="seu-refresh-secret-super-seguro"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis (cache e sessões)
REDIS_URL="redis://localhost:6379"

# Configurações do servidor
PORT=3001
NODE_ENV="development"

# Upload de arquivos
UPLOAD_MAX_SIZE="10mb"
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,application/pdf"

# Logging
LOG_LEVEL="info"
```

### 4. Executar o Backend

```bash
# Migrar banco de dados
npm run db:migrate

# Gerar cliente Prisma
npm run db:generate

# Popular dados iniciais (opcional)
npm run db:seed

# Desenvolvimento (hot reload)
npm run dev

# Produção
npm run build && npm start
```

### 5. Configuração do Frontend

O frontend (255 arquivos TypeScript) já está configurado para integrar com o backend Node.js (11 arquivos):

```typescript
// src/shared/services/api/apiConfig.ts
export const API_CONFIG = {
  baseUrl: 'http://localhost:3001/api', // Porta padrão do backend implementado
  timeout: 10000,
  endpoints: {
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      me: '/auth/me'
    },
    demandas: '/demandas',
    documentos: '/documentos',
    upload: '/upload',
    users: '/users'
  }
};
```

## 🔌 WebSocket e Colaboração Real-time

O backend implementa **Socket.io** para colaboração em tempo real:

```typescript
// Eventos WebSocket disponíveis
interface SocketEvents {
  // Colaboração em demandas
  'demanda:join': (demandaId: string) => void;
  'demanda:leave': (demandaId: string) => void;
  'demanda:update': (data: DemandaUpdate) => void;
  
  // Colaboração em documentos
  'documento:join': (documentoId: string) => void;
  'documento:update': (data: DocumentoUpdate) => void;
  
  // Notificações
  'notification:new': (notification: Notification) => void;
  
  // Status de usuários
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
}
```

## 📁 Upload de Arquivos

Sistema de upload implementado com **Multer**:

```typescript
// Configuração de upload
const uploadConfig = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png', 
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  storage: 'local', // ou 's3' para produção
  destination: './uploads/'
};

// Uso no frontend
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return await apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
```

## 🔐 Sistema de Autenticação

### JWT Token Flow (Implementado)

```typescript
// 1. Login
POST /api/auth/login
{
  "email": "user@example.com", 
  "password": "password"
}

// Resposta
{
  "user": { "id": "...", "name": "...", "email": "..." },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 3600
}

// 2. Requests autenticadas
Authorization: Bearer eyJ...

// 3. Refresh token
POST /api/auth/refresh
{
  "refreshToken": "eyJ..."
}
```

### Middleware de Autenticação

```typescript
// Backend middleware (implementado)
app.use('/api/protected', authMiddleware);

// Frontend interceptor (configurado)
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🧪 Testes do Backend

```bash
# Executar testes
npm test

# Testes com cobertura
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## 🐳 Docker (Configurado)

```bash
# Build da imagem
docker build -t synapse-backend .

# Executar com docker-compose
docker-compose up -d
```

## 📊 Monitoramento e Logs

Sistema de logging com **Winston**:

```typescript
// Níveis de log disponíveis
logger.error('Erro crítico', { error, context });
logger.warn('Aviso importante', { data });
logger.info('Informação', { userId, action });
logger.debug('Debug detalhado', { query, params });
```

## 🚀 Deploy em Produção

### Variáveis de Ambiente de Produção

```bash
NODE_ENV=production
DATABASE_URL="postgresql://prod-user:password@prod-host:5432/synapse"
REDIS_URL="redis://prod-redis:6379"
JWT_SECRET="production-super-secret-key"
PORT=3001
```

### Comandos de Deploy

```bash
# Build
npm run build

# Migrar banco em produção
npm run db:migrate

# Iniciar servidor
npm start
```

## 🔧 Estrutura do Backend (11 arquivos TypeScript IMPLEMENTADOS)

```
backend/src/
├── index.ts              # ✅ Servidor principal Express + Socket.io
├── config/
│   └── environment.ts    # ✅ Configurações de ambiente
├── middleware/           # ✅ Middlewares (auth, error, etc.)
│   ├── auth.ts           # ✅ Middleware de autenticação JWT
│   └── errorHandler.ts   # ✅ Tratamento de erros global
├── routes/               # ✅ Definições de rotas (5 módulos)
│   ├── auth.ts           # ✅ Rotas de autenticação
│   ├── demandas.ts       # ✅ CRUD de demandas
│   ├── documentos.ts     # ✅ CRUD de documentos  
│   ├── upload.ts         # ✅ Upload de arquivos
│   └── users.ts          # ✅ Gestão de usuários
├── services/             # ✅ Lógica de negócio
│   └── socketService.ts  # ✅ WebSocket real-time
└── utils/                # ✅ Utilitários e helpers
    └── logger.ts         # ✅ Sistema de logging Winston
```

## 📈 Performance e Cache

- **Redis**: Cache de sessões e dados frequentes
- **Prisma**: Query optimization e connection pooling  
- **Compression**: Compressão gzip automática
- **Rate Limiting**: Proteção contra abuse de API

---

**✅ Status**: Backend Node.js + TypeScript **IMPLEMENTADO e FUNCIONAL**  
**🔗 Integração**: Frontend **PREPARADO** para backend real  
**📊 Escala**: Suporte para **múltiplos usuários simultâneos**  
**🚀 Deploy**: **PRONTO** para produção  

**Última Atualização**: Setembro 2025  
**Versão Backend**: 1.0.0  
**Tecnologia**: Node.js + TypeScript + Express + Prisma + PostgreSQL + Socket.io