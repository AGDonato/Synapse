import winston from 'winston';
import { config } from '../config/environment';

// Formato customizado de log
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Adicionar metadados se presentes
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    // Adicionar stack trace para erros
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Criar array de transportes
const transports: winston.transport[] = [
  // Transporte para console
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    )
  })
];

// Transporte para arquivo (se configurado)
if (config.LOG_FILE) {
  transports.push(
    new winston.transports.File({
      filename: config.LOG_FILE,
      format: logFormat
    })
  );
}

// Criar instância do logger
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  transports,
  // Não encerrar processo em exceções tratadas
  exitOnError: false,
});

// Registrar exceções e rejeições não manipuladas em arquivo se configurado
if (config.LOG_FILE) {
  logger.exceptions.handle(
    new winston.transports.File({ 
      filename: config.LOG_FILE.replace('.log', '.exceptions.log') 
    })
  );
  
  logger.rejections.handle(
    new winston.transports.File({ 
      filename: config.LOG_FILE.replace('.log', '.rejections.log') 
    })
  );
}

// Função auxiliar de log para desenvolvimento
export const devLog = (message: string, data?: any) => {
  if (config.NODE_ENV === 'development') {
    logger.debug(`[DEV] ${message}`, data);
  }
};

// Função auxiliar de log para solicitações
export const logRequest = (req: any, duration?: number) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    ...(duration && { duration: `${duration}ms` }),
  };
  
  logger.info('Solicitação processada', logData);
};

// Função auxiliar de log para erros
export const logError = (error: Error, context?: string, metadata?: any) => {
  logger.error(`${context ? `[${context}] ` : ''}${error.message}`, {
    stack: error.stack,
    ...metadata,
  });
};

export default logger;