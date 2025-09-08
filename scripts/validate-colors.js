#!/usr/bin/env node

import { glob } from 'glob';
import { readFileSync } from 'fs';
import { join } from 'path';

const CONFIG = {
  // Arquivos para análise
  patterns: [
    'src/**/*.{ts,tsx,js,jsx,css,module.css,scss}',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/*.stories.{ts,tsx,js,jsx}',
    '!src/shared/components/charts/**/*', // Excluir charts (cores funcionais)
    '!src/pages/dashboard/styles/ChartContainer.module.css',
    '!src/shared/utils/chartTooltipConfig.ts',
    '!node_modules/**/*'
  ],
  
  // Cores permitidas (funcionais, sem alternativa em tokens)
  allowedColors: new Set([
    // Transparências
    'transparent', 'rgba(0,0,0,0)', 'rgba(0, 0, 0, 0)',
    
    // Cores básicas do sistema
    'inherit', 'currentColor', 'initial', 'unset',
    
    // Cores absolutas específicas
    '#ffffff', '#fff', 'white',
    '#000000', '#000', 'black',
    
    // Cores de chart (semânticas específicas) 
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
    
    // Shadow transparências específicas
    'rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.15)',
    'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.25)',
    
    // Focus ring brand
    'rgba(59, 130, 246, 0.25)'
  ])
};

// Regex patterns para detectar cores
const COLOR_PATTERNS = {
  hex: /#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?/g,
  rgb: /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g,
  hsl: /hsla?\(\s*\d+(?:deg)?\s*,\s*\d+%\s*,\s*\d+%(?:\s*,\s*[\d.]+)?\s*\)/g,
  named: /\b(?:red|green|blue|yellow|orange|purple|pink|gray|grey|brown|black|white|silver|gold|cyan|magenta|lime|navy|maroon|olive|aqua|fuchsia|teal)\b(?!-)/gi
};

function extractColorsFromContent(content, filePath) {
  const colors = new Set();
  
  // Skip se for arquivo de design tokens
  if (filePath.includes('design-tokens.css')) {
    return [];
  }
  
  // Extrair todas as cores usando regex
  Object.values(COLOR_PATTERNS).forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(color => colors.add(color.toLowerCase().trim()));
    }
  });
  
  return Array.from(colors);
}

function isColorAllowed(color) {
  return CONFIG.allowedColors.has(color) || 
         color.startsWith('var(--') || // Design tokens
         /^--/.test(color); // CSS custom properties
}

async function validateColors() {
  console.log('🔍 Validando cores hardcoded no projeto Synapse...\n');
  
  try {
    const files = await glob(CONFIG.patterns, { 
      ignore: ['node_modules/**/*'],
      absolute: true 
    });
    
    let totalFiles = 0;
    let filesWithIssues = 0;
    const issues = [];
    
    for (const filePath of files) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const colors = extractColorsFromContent(content, filePath);
        const hardcodedColors = colors.filter(color => !isColorAllowed(color));
        
        totalFiles++;
        
        if (hardcodedColors.length > 0) {
          filesWithIssues++;
          
          // Contar ocorrências por cor
          const colorCounts = {};
          hardcodedColors.forEach(color => {
            const matches = content.match(new RegExp(color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'));
            colorCounts[color] = matches ? matches.length : 1;
          });
          
          issues.push({
            file: filePath.replace(process.cwd(), '').replace(/\\/g, '/'),
            colors: colorCounts
          });
        }
      } catch (err) {
        console.warn(`⚠️  Erro ao ler ${filePath}: ${err.message}`);
      }
    }
    
    // Relatório de resultados
    console.log(`📊 **Relatório de Validação de Cores**`);
    console.log(`- Arquivos analisados: ${totalFiles}`);
    console.log(`- Arquivos com problemas: ${filesWithIssues}`);
    
    if (issues.length === 0) {
      console.log('✅ **Nenhuma cor hardcoded encontrada! Projeto está padronizado.**\n');
      return true;
    }
    
    console.log(`❌ **Encontradas cores hardcoded em ${issues.length} arquivos:**\n`);
    
    // Agrupar cores por frequência
    const allHardcodedColors = {};
    issues.forEach(issue => {
      Object.entries(issue.colors).forEach(([color, count]) => {
        allHardcodedColors[color] = (allHardcodedColors[color] || 0) + count;
      });
    });
    
    // Top 10 cores mais usadas
    const topColors = Object.entries(allHardcodedColors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    console.log('🎨 **Top 10 cores hardcoded mais utilizadas:**');
    topColors.forEach(([color, count], index) => {
      console.log(`${index + 1}. ${color} - ${count}x`);
    });
    console.log();
    
    // Detalhes por arquivo
    console.log('📁 **Detalhes por arquivo:**');
    issues.forEach(issue => {
      console.log(`\n${issue.file}:`);
      Object.entries(issue.colors).forEach(([color, count]) => {
        console.log(`  - ${color} (${count}x)`);
      });
    });
    
    console.log('\n💡 **Sugestões:**');
    console.log('1. Substitua cores hardcoded por design tokens (var(--token-name))');
    console.log('2. Use as cores semânticas definidas em design-tokens.css');
    console.log('3. Para cores específicas de charts, documente o motivo');
    console.log('4. Execute "npm run analyze-colors" para análise completa\n');
    
    return false;
    
  } catch (error) {
    console.error('❌ Erro durante validação:', error.message);
    return false;
  }
}

// Execução principal
async function main() {
  const isValid = await validateColors();
  process.exit(isValid ? 0 : 1);
}

// Executa apenas se chamado diretamente
if (process.argv[1] && process.argv[1].endsWith('validate-colors.js')) {
  main();
}

export { validateColors };