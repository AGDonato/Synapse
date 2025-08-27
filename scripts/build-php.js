#!/usr/bin/env node
/**
 * PHP Build Script
 * Script otimizado para build de produção PHP
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configurações
const CONFIG = {
  phpMode: true,
  outputDir: 'public/dist',
  tempDir: '.tmp-php-build',
  backupDir: 'backups',
  environments: ['production', 'staging', 'development']
};

/**
 * Logger utilitário
 */
const logger = {
  info: (message) => console.log(chalk.blue('ℹ'), message),
  success: (message) => console.log(chalk.green('✓'), message),
  warning: (message) => console.log(chalk.yellow('⚠'), message),
  error: (message) => console.log(chalk.red('✗'), message),
  step: (message) => console.log(chalk.cyan('→'), message)
};

/**
 * Verificar dependências necessárias
 */
function checkDependencies() {
  logger.step('Verificando dependências...');
  
  try {
    execSync('node --version', { stdio: 'ignore' });
    execSync('npm --version', { stdio: 'ignore' });
    
    // Verificar se Vite está instalado
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!packageJson.devDependencies?.vite && !packageJson.dependencies?.vite) {
      throw new Error('Vite não encontrado nas dependências');
    }
    
    logger.success('Dependências verificadas');
    return true;
  } catch (error) {
    logger.error(`Erro de dependência: ${error.message}`);
    return false;
  }
}

/**
 * Verificar ambiente PHP
 */
function checkPHPEnvironment() {
  logger.step('Verificando ambiente PHP...');
  
  try {
    execSync('php --version', { stdio: 'ignore' });
    logger.success('PHP encontrado');
    return true;
  } catch (error) {
    logger.warning('PHP não encontrado - prosseguindo sem verificação');
    return true; // Não é crítico para o build
  }
}

/**
 * Limpar builds anteriores
 */
function cleanPreviousBuilds() {
  logger.step('Limpando builds anteriores...');
  
  const dirsToClean = [CONFIG.outputDir, CONFIG.tempDir, 'dist'];
  
  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      logger.info(`Removido: ${dir}`);
    }
  });
  
  logger.success('Limpeza concluída');
}

/**
 * Backup de configuração atual
 */
function backupCurrentConfig() {
  logger.step('Fazendo backup da configuração atual...');
  
  const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(CONFIG.backupDir, `config-${backupTimestamp}`);
  
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }
  
  const filesToBackup = [
    'vite.config.ts',
    'package.json',
    '.env.production',
    '.env.staging'
  ];
  
  fs.mkdirSync(backupPath, { recursive: true });
  
  filesToBackup.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(backupPath, file));
      logger.info(`Backup: ${file}`);
    }
  });
  
  logger.success('Backup criado em ' + backupPath);
  return backupPath;
}

/**
 * Preparar ambiente de build
 */
function prepareBuildEnvironment(env = 'production') {
  logger.step(`Preparando ambiente de build: ${env}`);
  
  // Configurar variáveis de ambiente
  process.env.NODE_ENV = env;
  process.env.VITE_PHP_MODE = 'true';
  process.env.VITE_APP_ENV = env;
  
  // Carregar arquivo .env específico se existir
  const envFile = `.env.${env}`;
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value.replace(/^["'](.*)["']$/, '$1');
      }
    });
    logger.info(`Carregado: ${envFile}`);
  }
  
  logger.success('Ambiente preparado');
}

/**
 * Executar build do Vite
 */
function runViteBuild() {
  logger.step('Executando build do Vite...');
  
  try {
    const buildCommand = `npm run build -- --config vite.config.php.ts`;
    execSync(buildCommand, { stdio: 'inherit' });
    logger.success('Build do Vite concluído');
    return true;
  } catch (error) {
    logger.error('Falha no build do Vite');
    logger.error(error.message);
    return false;
  }
}

/**
 * Otimizar assets para PHP
 */
function optimizeAssetsForPHP() {
  logger.step('Otimizando assets para PHP...');
  
  const outputDir = CONFIG.outputDir;
  if (!fs.existsSync(outputDir)) {
    logger.error(`Diretório de output não encontrado: ${outputDir}`);
    return false;
  }
  
  // Ler manifest gerado pelo Vite
  const manifestPath = path.join(outputDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Criar arquivo de helper PHP para carregar assets
    const phpHelper = `<?php
/**
 * Vite Assets Helper
 * Auto-generated helper for loading Vite assets in PHP
 */

class ViteAssets {
    private static $manifest = null;
    private static $config = null;
    
    public static function loadManifest() {
        if (self::$manifest === null) {
            $manifestPath = __DIR__ . '/manifest.json';
            if (file_exists($manifestPath)) {
                self::$manifest = json_decode(file_get_contents($manifestPath), true);
            } else {
                self::$manifest = [];
            }
        }
        return self::$manifest;
    }
    
    public static function loadConfig() {
        if (self::$config === null) {
            $configPath = __DIR__ . '/vite-config.php';
            if (file_exists($configPath)) {
                self::$config = include $configPath;
            } else {
                self::$config = ['assets' => [], 'base_url' => '/dist/'];
            }
        }
        return self::$config;
    }
    
    public static function asset($asset) {
        $manifest = self::loadManifest();
        $config = self::loadConfig();
        
        if (isset($manifest[$asset])) {
            return $config['base_url'] . $manifest[$asset]['file'];
        }
        
        // Fallback para assets não encontrados no manifest
        return $config['base_url'] . $asset;
    }
    
    public static function css($entry = 'index.html') {
        $manifest = self::loadManifest();
        $css = [];
        
        if (isset($manifest[$entry]) && isset($manifest[$entry]['css'])) {
            foreach ($manifest[$entry]['css'] as $cssFile) {
                $css[] = self::asset($cssFile);
            }
        }
        
        return $css;
    }
    
    public static function js($entry = 'index.html') {
        $manifest = self::loadManifest();
        $js = [];
        
        if (isset($manifest[$entry])) {
            $js[] = self::asset($entry);
            
            // Adicionar imports se existirem
            if (isset($manifest[$entry]['imports'])) {
                foreach ($manifest[$entry]['imports'] as $import) {
                    if (isset($manifest[$import])) {
                        $js[] = self::asset($import);
                    }
                }
            }
        }
        
        return $js;
    }
    
    public static function renderTags($entry = 'index.html') {
        $output = '';
        
        // CSS tags
        foreach (self::css($entry) as $cssFile) {
            $output .= '<link rel="stylesheet" href="' . htmlspecialchars($cssFile) . '">' . PHP_EOL;
        }
        
        // JS tags
        foreach (self::js($entry) as $jsFile) {
            $output .= '<script type="module" src="' . htmlspecialchars($jsFile) . '"></script>' . PHP_EOL;
        }
        
        return $output;
    }
    
    public static function getVersion() {
        $config = self::loadConfig();
        return $config['version'] ?? '1.0.0';
    }
    
    public static function getBuildTime() {
        $config = self::loadConfig();
        return $config['build_time'] ?? null;
    }
}

// Helper functions para compatibilidade
if (!function_exists('vite_asset')) {
    function vite_asset($asset) {
        return ViteAssets::asset($asset);
    }
}

if (!function_exists('vite_tags')) {
    function vite_tags($entry = 'index.html') {
        return ViteAssets::renderTags($entry);
    }
}
`;
    
    fs.writeFileSync(path.join(outputDir, 'ViteAssets.php'), phpHelper);
    logger.success('Helper PHP criado');
  }
  
  // Gerar arquivo de documentação
  const docsContent = `# Integração Vite + PHP

## Uso Básico

### 1. Incluir o helper
\`\`\`php
require_once 'public/dist/ViteAssets.php';
\`\`\`

### 2. Carregar assets no HTML
\`\`\`php
<!DOCTYPE html>
<html>
<head>
    <?= vite_tags() ?>
</head>
<body>
    <div id="root"></div>
</body>
</html>
\`\`\`

### 3. Assets específicos
\`\`\`php
<img src="<?= vite_asset('logo.png') ?>" alt="Logo">
\`\`\`

## Métodos Disponíveis

- \`vite_asset($file)\` - URL de um asset específico
- \`vite_tags($entry)\` - Tags HTML para CSS e JS
- \`ViteAssets::getVersion()\` - Versão do build
- \`ViteAssets::getBuildTime()\` - Timestamp do build

## Build Info

- Versão: ${process.env.npm_package_version || '1.0.0'}
- Build: ${new Date().toISOString()}
- Ambiente: ${process.env.VITE_APP_ENV || 'production'}
`;
  
  fs.writeFileSync(path.join(outputDir, 'README.md'), docsContent);
  logger.success('Documentação criada');
  
  logger.success('Otimização para PHP concluída');
  return true;
}

/**
 * Validar build final
 */
function validateBuild() {
  logger.step('Validando build...');
  
  const outputDir = CONFIG.outputDir;
  const requiredFiles = [
    'manifest.json',
    'ViteAssets.php',
    'vite-config.php'
  ];
  
  let isValid = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(outputDir, file);
    if (!fs.existsSync(filePath)) {
      logger.error(`Arquivo obrigatório não encontrado: ${file}`);
      isValid = false;
    } else {
      logger.info(`✓ ${file}`);
    }
  });
  
  // Verificar se existem arquivos JS e CSS
  const hasJS = fs.existsSync(path.join(outputDir, 'js')) || 
               fs.readdirSync(outputDir).some(file => file.endsWith('.js'));
  const hasCSS = fs.existsSync(path.join(outputDir, 'css')) || 
                fs.readdirSync(outputDir).some(file => file.endsWith('.css'));
  
  if (!hasJS) {
    logger.warning('Nenhum arquivo JavaScript encontrado');
  }
  
  if (!hasCSS) {
    logger.warning('Nenhum arquivo CSS encontrado');
  }
  
  if (isValid) {
    logger.success('Build validado com sucesso');
  }
  
  return isValid;
}

/**
 * Gerar relatório de build
 */
function generateBuildReport() {
  logger.step('Gerando relatório de build...');
  
  const outputDir = CONFIG.outputDir;
  const stats = {
    buildTime: new Date().toISOString(),
    environment: process.env.VITE_APP_ENV || 'production',
    version: process.env.npm_package_version || '1.0.0',
    files: {},
    totalSize: 0
  };
  
  // Coletar informações dos arquivos
  function collectFileStats(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        collectFileStats(itemPath, prefix + item + '/');
      } else {
        const relativePath = prefix + item;
        const size = stat.size;
        
        stats.files[relativePath] = {
          size: size,
          sizeFormatted: formatFileSize(size),
          modified: stat.mtime.toISOString()
        };
        
        stats.totalSize += size;
      }
    });
  }
  
  if (fs.existsSync(outputDir)) {
    collectFileStats(outputDir);
  }
  
  stats.totalSizeFormatted = formatFileSize(stats.totalSize);
  
  // Salvar relatório
  const reportPath = path.join(outputDir, 'build-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2));
  
  logger.success(`Relatório salvo em: ${reportPath}`);
  logger.info(`Total de arquivos: ${Object.keys(stats.files).length}`);
  logger.info(`Tamanho total: ${stats.totalSizeFormatted}`);
  
  return stats;
}

/**
 * Função principal
 */
async function main() {
  const startTime = Date.now();
  
  console.log(chalk.bold.blue('\n🔨 Build PHP do Synapse\n'));
  
  try {
    // Verificações iniciais
    if (!checkDependencies()) {
      process.exit(1);
    }
    
    checkPHPEnvironment();
    
    // Obter ambiente da linha de comando
    const environment = process.argv[2] || 'production';
    if (!CONFIG.environments.includes(environment)) {
      logger.warning(`Ambiente desconhecido: ${environment}. Usando 'production'.`);
    }
    
    // Fazer backup
    const backupPath = backupCurrentConfig();
    
    // Preparar build
    cleanPreviousBuilds();
    prepareBuildEnvironment(environment);
    
    // Executar build
    const buildSuccess = runViteBuild();
    if (!buildSuccess) {
      logger.error('Build falhou');
      process.exit(1);
    }
    
    // Otimizar para PHP
    const optimizeSuccess = optimizeAssetsForPHP();
    if (!optimizeSuccess) {
      logger.error('Otimização para PHP falhou');
      process.exit(1);
    }
    
    // Validar resultado
    const isValid = validateBuild();
    if (!isValid) {
      logger.error('Validação do build falhou');
      process.exit(1);
    }
    
    // Gerar relatório
    const report = generateBuildReport();
    
    // Sucesso
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(chalk.bold.green('\n🎉 Build concluído com sucesso!\n'));
    logger.success(`Duração: ${duration}s`);
    logger.success(`Output: ${CONFIG.outputDir}`);
    logger.success(`Arquivos: ${Object.keys(report.files).length}`);
    logger.success(`Tamanho: ${report.totalSizeFormatted}`);
    logger.info(`Backup: ${backupPath}`);
    
    console.log(chalk.bold.cyan('\n📋 Próximos passos:'));
    console.log('1. Copiar arquivos de ' + CONFIG.outputDir + ' para o servidor PHP');
    console.log('2. Incluir ViteAssets.php no seu projeto PHP');
    console.log('3. Usar vite_tags() no HTML para carregar assets');
    console.log('\nVeja README.md no diretório de output para mais detalhes.\n');
    
  } catch (error) {
    logger.error('Erro durante o build:');
    logger.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Utilitário para formatar tamanho de arquivo
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkDependencies,
  prepareBuildEnvironment,
  optimizeAssetsForPHP,
  validateBuild
};