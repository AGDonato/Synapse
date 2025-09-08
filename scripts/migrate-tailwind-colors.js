#!/usr/bin/env node

import { glob } from 'glob';
import { readFileSync, writeFileSync } from 'fs';

const CONFIG = {
  // Arquivos para migração (excluindo charts)
  patterns: [
    'src/**/*.{ts,tsx,js,jsx,css,module.css,scss}',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/*.stories.{ts,tsx,js,jsx}',
    '!src/shared/components/charts/**/*',
    '!src/pages/dashboard/styles/ChartContainer.module.css',
    '!src/shared/utils/chartTooltipConfig.ts',
    '!node_modules/**/*'
  ],
};

// Mapeamento de cores Tailwind para design tokens
const TAILWIND_COLOR_MAPPINGS = {
  // Slate/Gray scale
  '#64748b': 'var(--text-secondary)',      // slate-500 → text secondary
  '#374151': 'var(--text-primary)',        // gray-700 → text primary  
  '#6b7280': 'var(--text-secondary)',      // gray-500 → text secondary
  '#4b5563': 'var(--text-secondary)',      // gray-600 → text secondary
  '#1f2937': 'var(--text-primary)',        // gray-800 → text primary
  '#9ca3af': 'var(--text-tertiary)',       // gray-400 → text tertiary
  '#d1d5db': 'var(--color-neutral-300)',   // gray-300 → neutral 300
  '#e5e7eb': 'var(--color-neutral-200)',   // gray-200 → neutral 200
  '#f3f4f6': 'var(--bg-tertiary)',         // gray-100 → background tertiary
  '#f9fafb': 'var(--bg-secondary)',        // gray-50 → background secondary
  
  // Blue scale (slate variants)
  '#1e293b': 'var(--text-primary)',        // slate-800 → text primary
  '#e2e8f0': 'var(--border-primary)',      // slate-200 → border primary
  '#f8fafc': 'var(--bg-secondary)',        // slate-50 → background secondary
  '#f1f5f9': 'var(--bg-tertiary)',         // slate-100 → background tertiary
  '#cbd5e1': 'var(--color-neutral-300)',   // slate-300 → neutral 300
  '#94a3b8': 'var(--text-tertiary)',       // slate-400 → text tertiary
};

function migrateColorsInFile(filePath, content) {
  let modifiedContent = content;
  let changesMade = false;
  
  // Aplicar cada mapeamento
  Object.entries(TAILWIND_COLOR_MAPPINGS).forEach(([oldColor, newColor]) => {
    // Buscar a cor em diferentes formatos (case insensitive)
    const regex = new RegExp(oldColor.replace('#', '#'), 'gi');
    
    if (regex.test(modifiedContent)) {
      modifiedContent = modifiedContent.replace(regex, newColor);
      changesMade = true;
      console.log(`  ✅ ${oldColor} → ${newColor}`);
    }
  });
  
  return { content: modifiedContent, changed: changesMade };
}

async function migrateAllFiles() {
  console.log('🎨 Migrando cores Tailwind para design tokens...\n');
  
  try {
    const files = await glob(CONFIG.patterns, { 
      ignore: ['node_modules/**/*'],
      absolute: true 
    });
    
    let totalFiles = 0;
    let modifiedFiles = 0;
    let totalChanges = 0;
    
    for (const filePath of files) {
      try {
        const originalContent = readFileSync(filePath, 'utf-8');
        const result = migrateColorsInFile(filePath, originalContent);
        
        totalFiles++;
        
        if (result.changed) {
          writeFileSync(filePath, result.content, 'utf-8');
          modifiedFiles++;
          
          const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
          console.log(`📁 Migrado: ${relativePath}`);
          
          // Contar mudanças
          Object.keys(TAILWIND_COLOR_MAPPINGS).forEach(color => {
            const oldCount = (originalContent.match(new RegExp(color, 'gi')) || []).length;
            const newCount = (result.content.match(new RegExp(color, 'gi')) || []).length;
            totalChanges += (oldCount - newCount);
          });
        }
      } catch (err) {
        console.warn(`⚠️  Erro ao processar ${filePath}: ${err.message}`);
      }
    }
    
    // Relatório final
    console.log('\n📊 **Relatório de Migração Tailwind Colors**');
    console.log(`- Arquivos analisados: ${totalFiles}`);
    console.log(`- Arquivos modificados: ${modifiedFiles}`);
    console.log(`- Total de substituições: ${totalChanges}`);
    console.log(`- Cores migradas: ${Object.keys(TAILWIND_COLOR_MAPPINGS).length}`);
    
    if (modifiedFiles > 0) {
      console.log('\n🎯 **Próximos passos:**');
      console.log('1. Execute "npm run validate-colors" para verificar progresso');
      console.log('2. Teste a aplicação para garantir que nada quebrou');
      console.log('3. Continue com a migração dos componentes menores');
    } else {
      console.log('\n✅ **Nenhum arquivo precisava de migração!**');
    }
    
    return modifiedFiles > 0;
    
  } catch (error) {
    console.error('❌ Erro durante migração:', error.message);
    return false;
  }
}

// Execução principal
async function main() {
  const success = await migrateAllFiles();
  process.exit(success ? 0 : 1);
}

// Executa apenas se chamado diretamente
if (process.argv[1] && process.argv[1].endsWith('migrate-tailwind-colors.js')) {
  main();
}

export { migrateAllFiles };