#!/usr/bin/env node

/**
 * Script para configuração automática de variáveis de ambiente
 * Uso: npm run env:setup [environment]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Ambientes disponíveis
const ENVIRONMENTS = ['development', 'staging', 'production'];

// Obter ambiente da linha de comando ou usar development como padrão
const environment = process.argv[2] || 'development';

if (!ENVIRONMENTS.includes(environment)) {
  console.error(`❌ Ambiente inválido: ${environment}`);
  console.error(`Ambientes disponíveis: ${ENVIRONMENTS.join(', ')}`);
  process.exit(1);
}

const sourceFile = path.join(rootDir, `.env.${environment}`);
const targetFile = path.join(rootDir, '.env.local');
const exampleFile = path.join(rootDir, '.env.example');

console.log(`🔧 Configurando ambiente: ${environment}`);

try {
  // Verificar se arquivo de ambiente existe
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Arquivo não encontrado: .env.${environment}`);
    
    if (fs.existsSync(exampleFile)) {
      console.log(`💡 Criando .env.${environment} baseado no exemplo...`);
      fs.copyFileSync(exampleFile, sourceFile);
      console.log(`✅ Arquivo .env.${environment} criado!`);
      console.log(`📝 Edite o arquivo e execute novamente este script.`);
    }
    
    process.exit(1);
  }

  // Copiar arquivo de ambiente para .env.local
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`✅ Arquivo .env.local configurado com as variáveis de ${environment}`);

  // Ler e validar variáveis
  const envContent = fs.readFileSync(sourceFile, 'utf8');
  const envVars = parseEnvFile(envContent);
  
  console.log('\n📋 Resumo das configurações:');
  console.log(`   Ambiente: ${envVars.VITE_APP_ENV || 'não definido'}`);
  console.log(`   API URL: ${envVars.VITE_API_BASE_URL || 'não definido'}`);
  console.log(`   WebSocket: ${envVars.VITE_WS_URL || 'não definido'}`);
  console.log(`   Debug: ${envVars.VITE_DEBUG_MODE === 'true' ? 'Habilitado' : 'Desabilitado'}`);
  console.log(`   PWA: ${envVars.VITE_PWA_ENABLED === 'true' ? 'Habilitado' : 'Desabilitado'}`);
  console.log(`   Cache: ${envVars.VITE_CACHE_ENABLED === 'true' ? 'Habilitado' : 'Desabilitado'}`);

  // Validações específicas por ambiente
  const warnings = validateEnvironmentConfig(envVars, environment);
  if (warnings.length > 0) {
    console.log('\n⚠️  Avisos de configuração:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  console.log('\n🎉 Configuração concluída com sucesso!');
  console.log('💡 Execute `npm run dev` para iniciar o servidor de desenvolvimento.');

} catch (error) {
  console.error('❌ Erro ao configurar ambiente:', error.message);
  process.exit(1);
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
 * Validar configuração do ambiente
 */
function validateEnvironmentConfig(envVars, environment) {
  const warnings = [];
  
  // Validações gerais
  if (!envVars.VITE_API_BASE_URL) {
    warnings.push('VITE_API_BASE_URL não está definida');
  }
  
  if (!envVars.VITE_AUTH_ENDPOINT) {
    warnings.push('VITE_AUTH_ENDPOINT não está definida');
  }

  // Validações por ambiente
  switch (environment) {
    case 'development':
      if (envVars.VITE_DEBUG_MODE !== 'true') {
        warnings.push('Recomenda-se habilitar VITE_DEBUG_MODE em desenvolvimento');
      }
      
      if (envVars.VITE_MOCK_DATA !== 'true') {
        warnings.push('Considere habilitar VITE_MOCK_DATA para desenvolvimento');
      }
      break;
      
    case 'production':
      if (envVars.VITE_DEBUG_MODE === 'true') {
        warnings.push('VITE_DEBUG_MODE deveria estar desabilitado em produção');
      }
      
      if (envVars.VITE_MOCK_DATA === 'true') {
        warnings.push('VITE_MOCK_DATA deveria estar desabilitado em produção');
      }
      
      if (envVars.VITE_CSRF_ENABLED !== 'true') {
        warnings.push('VITE_CSRF_ENABLED deveria estar habilitado em produção');
      }
      
      if (!envVars.VITE_API_BASE_URL.startsWith('https://')) {
        warnings.push('API URL deveria usar HTTPS em produção');
      }
      break;
      
    case 'staging':
      if (envVars.VITE_ANALYTICS_ENABLED !== 'true') {
        warnings.push('Considere habilitar VITE_ANALYTICS_ENABLED em staging');
      }
      break;
  }
  
  // Validar autenticação externa
  if (envVars.VITE_LDAP_ENABLED === 'true' && !envVars.VITE_LDAP_URL) {
    warnings.push('VITE_LDAP_URL é obrigatória quando LDAP está habilitado');
  }
  
  if (envVars.VITE_OAUTH2_ENABLED === 'true' && !envVars.VITE_OAUTH2_CLIENT_ID) {
    warnings.push('VITE_OAUTH2_CLIENT_ID é obrigatório quando OAuth2 está habilitado');
  }
  
  return warnings;
}