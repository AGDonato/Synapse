import { z } from 'zod';

// Schema de validação das variáveis de ambiente
const envSchema = z.object({
  // Banco de dados
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // Servidor
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('8080'),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CACHE_TTL: z.string().transform(Number).pipe(z.number().int().positive()).default('600'),
  
  // Upload de arquivos
  UPLOAD_MAX_SIZE: z.string().transform(Number).pipe(z.number().int().positive()).default('10485760'),
  UPLOAD_PATH: z.string().default('./uploads'),
  ALLOWED_FILE_TYPES: z.string().default('pdf,doc,docx,jpg,jpeg,png'),
  
  // Segurança
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
  BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().int().min(10).max(15)).default('12'),
  
  // WebSocket
  WS_ENABLED: z.string().transform(val => val === 'true').default('true'),
  WS_CORS_ORIGIN: z.string().default('http://localhost:5173'),
  
  // Log
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
});

// Processar e validar variáveis de ambiente
function parseEnvironment() {
  const env = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    REDIS_URL: process.env.REDIS_URL,
    CACHE_TTL: process.env.CACHE_TTL,
    UPLOAD_MAX_SIZE: process.env.UPLOAD_MAX_SIZE,
    UPLOAD_PATH: process.env.UPLOAD_PATH,
    ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS,
    WS_ENABLED: process.env.WS_ENABLED,
    WS_CORS_ORIGIN: process.env.WS_CORS_ORIGIN,
    LOG_LEVEL: process.env.LOG_LEVEL,
    LOG_FILE: process.env.LOG_FILE,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    console.error('❌ Validação das variáveis de ambiente falhou:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

export const config = parseEnvironment();

// Valores calculados
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isStaging = config.NODE_ENV === 'staging';

// Array de tipos de arquivo permitidos
export const allowedFileTypes = config.ALLOWED_FILE_TYPES.split(',').map(type => type.trim());

// Exportar tipo para TypeScript
export type Config = typeof config;