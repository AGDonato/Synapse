#!/usr/bin/env node

import { glob } from 'glob';
import { readFileSync, writeFileSync } from 'fs';

const FINAL_MIGRATIONS = {
  // Bootstrap legacy colors
  '#007bff': 'var(--interactive-primary)',
  '#0056b3': 'var(--interactive-primary-hover)',
  
  // Generic borders and backgrounds
  '#ccc': 'var(--form-border)',
  '#e6f3ff': 'var(--color-brand-50)',
  '#f8f9fa': 'var(--bg-secondary)',
  
  // Focus rings (specific values)
  'rgba(0, 123, 255, 0.25)': 'rgba(59, 130, 246, 0.25)',
  'rgba(0, 123, 255, 0.1)': 'rgba(59, 130, 246, 0.1)',
  
  // Status colors
  '#dc2626': 'var(--color-error-600)',
  '#16a34a': 'var(--color-success-600)',
  '#d97706': 'var(--color-warning-600)',
  
  // Neutrals
  '#666': 'var(--text-secondary)',
  '#999': 'var(--text-tertiary)',
  '#333': 'var(--text-primary)',
};

async function finalCleanup() {
  console.log('🎨 Final CSS cleanup - migrating remaining common colors...\n');
  
  const files = await glob([
    'src/**/*.{css,module.css}',
    '!src/shared/components/charts/**/*',
    '!node_modules/**/*'
  ], { absolute: true });
  
  let modifiedFiles = 0;
  let totalReplacements = 0;
  
  for (const filePath of files) {
    try {
      let content = readFileSync(filePath, 'utf-8');
      let changed = false;
      let fileReplacements = 0;
      
      Object.entries(FINAL_MIGRATIONS).forEach(([oldColor, newColor]) => {
        const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = content.match(regex);
        
        if (matches) {
          content = content.replace(regex, newColor);
          changed = true;
          fileReplacements += matches.length;
          console.log(`  ✅ ${oldColor} → ${newColor} (${matches.length}x)`);
        }
      });
      
      if (changed) {
        writeFileSync(filePath, content, 'utf-8');
        modifiedFiles++;
        totalReplacements += fileReplacements;
        
        const relativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
        console.log(`📁 Updated: ${relativePath} (${fileReplacements} changes)\n`);
      }
    } catch (err) {
      console.warn(`⚠️  Error processing ${filePath}: ${err.message}`);
    }
  }
  
  console.log('\n📊 **Final Cleanup Results**');
  console.log(`- Files modified: ${modifiedFiles}`);
  console.log(`- Total replacements: ${totalReplacements}`);
  console.log(`- Colors cleaned: ${Object.keys(FINAL_MIGRATIONS).length}`);
  
  if (modifiedFiles > 0) {
    console.log('\n🎯 **Execute "npm run validate-colors" to see the final results!**');
  }
  
  return totalReplacements;
}

async function main() {
  const replacements = await finalCleanup();
  process.exit(replacements > 0 ? 0 : 1);
}

if (process.argv[1] && process.argv[1].endsWith('final-cleanup.js')) {
  main();
}

export { finalCleanup };