#!/usr/bin/env node

/**
 * Script para validação de variáveis de ambiente
 * Uso: npm run env:validate
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const envFiles = [
  '.env.local',
  '.env.development',
  '.env.staging', 
  '.env.production'
];

// Variáveis obrigatórias por ambiente
const REQUIRED_VARS = {
  all: [
    'VITE_APP_ENV',
    'VITE_API_BASE_URL',
    'VITE_AUTH_ENDPOINT'
  ],
  production: [
    'VITE_CSRF_ENABLED',
    'VITE_SECURITY_AUDIT_ENABLED'
  ]
};

// Padrões de validação
const VALIDATION_PATTERNS = {
  VITE_API_BASE_URL: /^https?:\/\/.+/,
  VITE_AUTH_ENDPOINT: /^https?:\/\/.+/,
  VITE_WS_URL: /^wss?:\/\/.+/,
  VITE_REDIS_URL: /^redis:\/\/.+/,
  VITE_MAX_FILE_SIZE: /^\d+$/,
  VITE_API_TIMEOUT: /^\d+$/,
};

console.log('🔍 Validando arquivos de ambiente...\n');

let hasErrors = false;
let totalFiles = 0;
let validFiles = 0;

// Validar cada arquivo de ambiente
envFiles.forEach(filename => {
  const filePath = path.join(rootDir, filename);
  
  if (!fs.existsSync(filePath)) {
    if (filename === '.env.local') {
      console.log(`⚠️  ${filename}: Arquivo não encontrado (opcional)`);
    }
    return;
  }
  
  totalFiles++;
  console.log(`📄 Validando ${filename}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const envVars = parseEnvFile(content);
    const environment = getEnvironmentFromFile(filename, envVars);
    
    const errors = validateEnvVars(envVars, environment);
    
    if (errors.length === 0) {
      console.log(`✅ ${filename}: Válido`);
      validFiles++;
    } else {
      console.log(`❌ ${filename}: ${errors.length} erro(s) encontrado(s)`);
      errors.forEach(error => console.log(`   - ${error}`));
      hasErrors = true;
    }
    
  } catch (error) {
    console.log(`❌ ${filename}: Erro ao processar - ${error.message}`);
    hasErrors = true;
  }
  
  console.log('');
});

// Resumo final
console.log('📊 Resumo da validação:');
console.log(`   Arquivos processados: ${totalFiles}`);
console.log(`   Arquivos válidos: ${validFiles}`);
console.log(`   Arquivos com erro: ${totalFiles - validFiles}`);

if (hasErrors) {
  console.log('\n❌ Validação falhou! Corrija os erros antes de prosseguir.');
  process.exit(1);
} else {
  console.log('\n✅ Todos os arquivos de ambiente são válidos!');
}

/**
 * Parse do arquivo .env para objeto
 */
function parseEnvFile(content) {
  const envVars = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    
    // Ignorar comentários e linhas vazias
    if (!line || line.startsWith('#')) return;
    
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return envVars;
}

/**
 * Determinar ambiente baseado no nome do arquivo ou conteúdo
 */
function getEnvironmentFromFile(filename, envVars) {
  if (filename.includes('development')) return 'development';
  if (filename.includes('staging')) return 'staging';
  if (filename.includes('production')) return 'production';
  
  // Tentar determinar pelo conteúdo
  const appEnv = envVars.VITE_APP_ENV;
  if (appEnv && ['development', 'staging', 'production'].includes(appEnv)) {
    return appEnv;
  }
  
  return 'unknown';
}

/**
 * Validar variáveis de ambiente
 */
function validateEnvVars(envVars, environment) {
  const errors = [];
  
  // Verificar variáveis obrigatórias gerais
  REQUIRED_VARS.all.forEach(varName => {
    if (!envVars[varName]) {
      errors.push(`${varName} é obrigatória`);
    }
  });
  
  // Verificar variáveis obrigatórias específicas do ambiente
  if (REQUIRED_VARS[environment]) {
    REQUIRED_VARS[environment].forEach(varName => {
      if (!envVars[varName]) {
        errors.push(`${varName} é obrigatória para ambiente ${environment}`);
      }
    });
  }
  
  // Verificar padrões de validação
  Object.entries(VALIDATION_PATTERNS).forEach(([varName, pattern]) => {
    const value = envVars[varName];
    if (value && !pattern.test(value)) {
      errors.push(`${varName} tem formato inválido: ${value}`);
    }
  });
  
  // Validações específicas por ambiente
  if (environment === 'production') {
    // HTTPS obrigatório em produção
    const apiUrl = envVars.VITE_API_BASE_URL;
    if (apiUrl && !apiUrl.startsWith('https://')) {
      errors.push('VITE_API_BASE_URL deve usar HTTPS em produção');
    }
    
    const wsUrl = envVars.VITE_WS_URL;
    if (wsUrl && !wsUrl.startsWith('wss://')) {
      errors.push('VITE_WS_URL deve usar WSS em produção');
    }
    
    // Debug deve estar desabilitado
    if (envVars.VITE_DEBUG_MODE === 'true') {
      errors.push('VITE_DEBUG_MODE deve estar desabilitado em produção');
    }
    
    // Mock data deve estar desabilitado
    if (envVars.VITE_MOCK_DATA === 'true') {
      errors.push('VITE_MOCK_DATA deve estar desabilitado em produção');
    }
  }
  
  // Validar configuração de autenticação externa
  if (envVars.VITE_LDAP_ENABLED === 'true') {
    if (!envVars.VITE_LDAP_URL) {
      errors.push('VITE_LDAP_URL é obrigatória quando LDAP está habilitado');
    }
    if (!envVars.VITE_LDAP_BASE_DN) {
      errors.push('VITE_LDAP_BASE_DN é obrigatória quando LDAP está habilitado');
    }
  }
  
  if (envVars.VITE_OAUTH2_ENABLED === 'true') {
    if (!envVars.VITE_OAUTH2_CLIENT_ID) {
      errors.push('VITE_OAUTH2_CLIENT_ID é obrigatório quando OAuth2 está habilitado');
    }
    if (!envVars.VITE_OAUTH2_REDIRECT_URI) {
      errors.push('VITE_OAUTH2_REDIRECT_URI é obrigatório quando OAuth2 está habilitado');
    }
  }
  
  if (envVars.VITE_SAML_ENABLED === 'true') {
    if (!envVars.VITE_SAML_ENTRY_POINT) {
      errors.push('VITE_SAML_ENTRY_POINT é obrigatório quando SAML está habilitado');
    }
    if (!envVars.VITE_SAML_ISSUER) {
      errors.push('VITE_SAML_ISSUER é obrigatório quando SAML está habilitado');
    }
  }
  
  // Validar cache
  if (envVars.VITE_CACHE_ENABLED === 'true' && !envVars.VITE_REDIS_URL) {
    errors.push('VITE_REDIS_URL é obrigatória quando cache está habilitado');
  }
  
  // Validar monitoramento
  if (envVars.VITE_ANALYTICS_ENABLED === 'true' && !envVars.VITE_ANALYTICS_ENDPOINT) {
    errors.push('VITE_ANALYTICS_ENDPOINT é obrigatório quando analytics está habilitado');
  }
  
  // Validar valores numéricos
  const numericVars = [
    'VITE_API_TIMEOUT',
    'VITE_API_RETRY_ATTEMPTS',
    'VITE_WS_RECONNECT_ATTEMPTS',
    'VITE_WS_RECONNECT_INTERVAL',
    'VITE_CACHE_TTL',
    'VITE_CACHE_MAX_SIZE',
    'VITE_MAX_FILE_SIZE',
    'VITE_DEFAULT_PAGE_SIZE',
    'VITE_MAX_PAGE_SIZE',
    'VITE_AUTH_REFRESH_THRESHOLD',
    'VITE_AUTH_SESSION_TIMEOUT'
  ];
  
  numericVars.forEach(varName => {
    const value = envVars[varName];
    if (value && (isNaN(value) || parseInt(value) < 0)) {
      errors.push(`${varName} deve ser um número válido positivo`);
    }
  });
  
  // Validar valores boolean
  const booleanVars = Object.keys(envVars).filter(key => 
    key.endsWith('_ENABLED') || key.endsWith('_MODE')
  );
  
  booleanVars.forEach(varName => {
    const value = envVars[varName];
    if (value && !['true', 'false'].includes(value.toLowerCase())) {
      errors.push(`${varName} deve ser 'true' ou 'false'`);
    }
  });
  
  return errors;
}