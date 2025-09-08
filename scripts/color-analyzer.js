#!/usr/bin/env node

/**
 * ================================================================
 * COLOR ANALYZER - LEVANTAMENTO DE CORES DO PROJETO SYNAPSE
 * ================================================================
 * 
 * Este script faz uma análise completa de todas as cores utilizadas
 * no código do projeto, incluindo:
 * - Design tokens CSS (variáveis CSS custom properties)
 * - Cores hexadecimais (#RGB, #RRGGBB, #RRGGBBAA)
 * - Funções de cor (rgb, rgba, hsl, hsla)
 * - Named colors (white, black, transparent, etc.)
 * 
 * Gera relatórios em JSON e Markdown para análise e auditoria.
 * 
 * Uso: node scripts/color-analyzer.js
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Configurações
const CONFIG = {
  // Padrões de arquivo a analisar
  patterns: [
    'src/**/*.{ts,tsx,js,jsx,css,module.css,scss}',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/*.stories.{ts,tsx,js,jsx}',
    '!src/shared/components/charts/**/*',
    '!src/pages/dashboard/styles/ChartContainer.module.css',
    '!src/shared/utils/chartTooltipConfig.ts',
    '!node_modules/**/*'
  ],
  
  // Diretório de output
  outputDir: 'docs',
  
  // Arquivos de saída
  outputFiles: {
    json: 'color-inventory.json',
    report: 'COLOR_AUDIT_REPORT.md'
  }
};

// Regex patterns para detectar cores
const COLOR_PATTERNS = {
  // Hexadecimal: #RGB, #RRGGBB, #RRGGBBAA
  hex: /(?:^|[^a-zA-Z0-9])#([0-9a-fA-F]{3,8})(?![0-9a-fA-F])/g,
  
  // RGB/RGBA
  rgb: /rgba?\s*\(\s*([^)]+)\s*\)/gi,
  
  // HSL/HSLA  
  hsl: /hsla?\s*\(\s*([^)]+)\s*\)/gi,
  
  // CSS Variables (design tokens)
  cssVar: /var\s*\(\s*--([^)]+)\s*\)/gi,
  
  // CSS Custom Properties definition
  cssVarDef: /--([a-zA-Z][a-zA-Z0-9-]*)\s*:\s*([^;]+)/gi,
  
  // Named colors (lista básica)
  named: /\b(transparent|inherit|initial|unset|currentColor|white|black|red|green|blue|yellow|orange|purple|pink|brown|gray|grey|cyan|magenta|lime|navy|olive|teal|silver|maroon|aqua|fuchsia)\b/gi
};

// Lista de named colors CSS mais completa
const CSS_NAMED_COLORS = [
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
  'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue',
  'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki',
  'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon',
  'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise',
  'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue',
  'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite',
  'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink',
  'indianred', 'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen',
  'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow',
  'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen',
  'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow',
  'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue',
  'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen',
  'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose',
  'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
  'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred',
  'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'red',
  'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen',
  'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey',
  'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise',
  'violet', 'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen',
  'transparent', 'inherit', 'initial', 'unset', 'currentColor'
];

// Estrutura para armazenar resultados
class ColorInventory {
  constructor() {
    this.designTokens = new Map();
    this.hardcodedColors = new Map();
    this.fileAnalysis = new Map();
    this.colorUsage = new Map();
    this.statistics = {
      totalFiles: 0,
      filesWithColors: 0,
      totalColors: 0,
      uniqueColors: 0,
      designTokensCount: 0,
      hardcodedCount: 0
    };
  }

  addColor(file, lineNum, colorType, colorValue, context = '') {
    const colorKey = `${colorType}:${colorValue.toLowerCase()}`;
    
    // Adicionar ao mapa de uso de cores
    if (!this.colorUsage.has(colorKey)) {
      this.colorUsage.set(colorKey, {
        type: colorType,
        value: colorValue,
        occurrences: [],
        count: 0
      });
    }
    
    const colorData = this.colorUsage.get(colorKey);
    colorData.occurrences.push({ file, line: lineNum, context });
    colorData.count++;
    
    // Adicionar ao mapa de análise por arquivo
    if (!this.fileAnalysis.has(file)) {
      this.fileAnalysis.set(file, {
        colors: [],
        designTokens: [],
        hardcoded: []
      });
    }
    
    const fileData = this.fileAnalysis.get(file);
    const colorInfo = { type: colorType, value: colorValue, line: lineNum, context };
    
    fileData.colors.push(colorInfo);
    
    if (colorType === 'css-var-def' || colorType === 'css-var') {
      fileData.designTokens.push(colorInfo);
      this.designTokens.set(colorValue, { file, line: lineNum, context });
    } else {
      fileData.hardcoded.push(colorInfo);
      if (!this.hardcodedColors.has(colorValue.toLowerCase())) {
        this.hardcodedColors.set(colorValue.toLowerCase(), []);
      }
      this.hardcodedColors.get(colorValue.toLowerCase()).push({ file, line: lineNum, context });
    }
  }

  updateStatistics() {
    this.statistics.totalColors = Array.from(this.colorUsage.values())
      .reduce((sum, color) => sum + color.count, 0);
    this.statistics.uniqueColors = this.colorUsage.size;
    this.statistics.designTokensCount = this.designTokens.size;
    this.statistics.hardcodedCount = this.hardcodedColors.size;
    this.statistics.filesWithColors = Array.from(this.fileAnalysis.values())
      .filter(fileData => fileData.colors.length > 0).length;
  }
}

// Função para analisar um arquivo
function analyzeFile(filePath, inventory) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    inventory.statistics.totalFiles++;
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Detectar cores hexadecimais
      let match;
      while ((match = COLOR_PATTERNS.hex.exec(line)) !== null) {
        const hexValue = '#' + match[1];
        const context = line.trim().substring(Math.max(0, match.index - 20), match.index + 30);
        inventory.addColor(filePath, lineNum, 'hex', hexValue, context);
      }
      
      // Reset regex lastIndex
      COLOR_PATTERNS.hex.lastIndex = 0;
      
      // Detectar RGB/RGBA
      while ((match = COLOR_PATTERNS.rgb.exec(line)) !== null) {
        const rgbValue = match[0];
        const context = line.trim().substring(Math.max(0, match.index - 20), match.index + 50);
        inventory.addColor(filePath, lineNum, 'rgb', rgbValue, context);
      }
      COLOR_PATTERNS.rgb.lastIndex = 0;
      
      // Detectar HSL/HSLA
      while ((match = COLOR_PATTERNS.hsl.exec(line)) !== null) {
        const hslValue = match[0];
        const context = line.trim().substring(Math.max(0, match.index - 20), match.index + 50);
        inventory.addColor(filePath, lineNum, 'hsl', hslValue, context);
      }
      COLOR_PATTERNS.hsl.lastIndex = 0;
      
      // Detectar CSS Variables (uso)
      while ((match = COLOR_PATTERNS.cssVar.exec(line)) !== null) {
        const varName = match[1].trim();
        const context = line.trim().substring(Math.max(0, match.index - 20), match.index + 50);
        inventory.addColor(filePath, lineNum, 'css-var', `--${varName}`, context);
      }
      COLOR_PATTERNS.cssVar.lastIndex = 0;
      
      // Detectar CSS Variables (definição)
      while ((match = COLOR_PATTERNS.cssVarDef.exec(line)) !== null) {
        const varName = match[1];
        const varValue = match[2].trim();
        const context = line.trim();
        inventory.addColor(filePath, lineNum, 'css-var-def', `--${varName}`, `${varValue} | ${context}`);
      }
      COLOR_PATTERNS.cssVarDef.lastIndex = 0;
      
      // Detectar named colors
      CSS_NAMED_COLORS.forEach(colorName => {
        const regex = new RegExp(`\\b${colorName}\\b`, 'gi');
        let namedMatch;
        while ((namedMatch = regex.exec(line)) !== null) {
          // Verificar se não é parte de uma variável ou propriedade
          const beforeChar = line[namedMatch.index - 1];
          const afterChar = line[namedMatch.index + colorName.length];
          
          if ((!beforeChar || /[\s:;,(){}]/.test(beforeChar)) && 
              (!afterChar || /[\s:;,(){}]/.test(afterChar))) {
            const context = line.trim().substring(Math.max(0, namedMatch.index - 20), namedMatch.index + 30);
            inventory.addColor(filePath, lineNum, 'named', colorName, context);
          }
        }
      });
    });
    
  } catch (error) {
    console.error(`Erro ao analisar arquivo ${filePath}:`, error.message);
  }
}

// Função para gerar relatório em Markdown
function generateMarkdownReport(inventory) {
  const date = new Date().toLocaleString('pt-BR');
  
  let report = `# 🎨 Relatório de Auditoria de Cores - Projeto Synapse (UI/UX apenas)

**Gerado em:** ${date}  
**Versão:** 1.1.0  
**Total de arquivos analisados:** ${inventory.statistics.totalFiles}
**Escopo:** UI/UX colors (excluindo gráficos ECharts)

---

## 📊 Resumo Executivo

| Métrica | Valor |
|---------|--------|
| **Arquivos com cores** | ${inventory.statistics.filesWithColors} |
| **Total de ocorrências** | ${inventory.statistics.totalColors} |
| **Cores únicas** | ${inventory.statistics.uniqueColors} |
| **Design tokens** | ${inventory.statistics.designTokensCount} |
| **Cores hardcoded** | ${inventory.statistics.hardcodedCount} |

---

## 🎯 Design Tokens (CSS Custom Properties)

`;

  if (inventory.designTokens.size > 0) {
    report += `### ✅ Tokens encontrados (${inventory.designTokens.size})

| Token | Arquivo | Linha | Contexto |
|-------|---------|--------|----------|
`;
    
    Array.from(inventory.designTokens.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([token, data]) => {
        const fileName = path.basename(data.file);
        const context = data.context.length > 60 ? data.context.substring(0, 57) + '...' : data.context;
        report += `| \`${token}\` | ${fileName} | ${data.line} | ${context} |\n`;
      });
  } else {
    report += "❌ **Nenhum design token encontrado**\n";
  }

  report += `

---

## 🚨 Cores Hardcoded por Tipo

`;

  // Agrupar por tipo de cor
  const colorsByType = new Map();
  inventory.colorUsage.forEach((colorData, colorKey) => {
    if (!colorsByType.has(colorData.type)) {
      colorsByType.set(colorData.type, []);
    }
    colorsByType.get(colorData.type).push(colorData);
  });

  colorsByType.forEach((colors, type) => {
    if (type === 'css-var' || type === 'css-var-def') return; // Skip design tokens
    
    report += `### ${getTypeTitle(type)} (${colors.length} únicas)

| Cor | Ocorrências | Principais Arquivos |
|-----|-------------|-------------------|
`;

    colors
      .sort((a, b) => b.count - a.count)
      .slice(0, 20) // Top 20
      .forEach(colorData => {
        const filesList = colorData.occurrences
          .slice(0, 3)
          .map(occ => path.basename(occ.file))
          .join(', ');
        
        const displayValue = colorData.value.length > 30 ? 
          colorData.value.substring(0, 27) + '...' : 
          colorData.value;
        
        report += `| \`${displayValue}\` | ${colorData.count} | ${filesList} |\n`;
      });
    
    report += '\n';
  });

  report += `

---

## 📁 Análise por Arquivo

### Top 10 arquivos com mais cores

`;

  const filesByColorCount = Array.from(inventory.fileAnalysis.entries())
    .map(([file, data]) => ({ file, count: data.colors.length, data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  report += `| Arquivo | Total | Hardcoded | Design Tokens |
|---------|--------|-----------|---------------|
`;

  filesByColorCount.forEach(({ file, count, data }) => {
    const fileName = path.basename(file);
    const hardcodedCount = data.hardcoded.length;
    const tokensCount = data.designTokens.length;
    
    report += `| ${fileName} | ${count} | ${hardcodedCount} | ${tokensCount} |\n`;
  });

  report += `

---

## 💡 Recomendações

### ✅ Pontos Positivos
- Design tokens implementados no arquivo \`design-tokens.css\`
- Suporte a tema escuro configurado
- Uso de CSS custom properties

### ⚠️ Oportunidades de Melhoria
`;

  if (inventory.statistics.hardcodedCount > inventory.statistics.designTokensCount) {
    report += `- **Alta incidência de cores hardcoded**: ${inventory.statistics.hardcodedCount} vs ${inventory.statistics.designTokensCount} design tokens\n`;
  }

  report += `- Migrar cores hardcoded para design tokens
- Padronizar paleta de cores
- Implementar linting para prevenir cores hardcoded
- Documentar guidelines de uso de cores

### 🔧 Próximos Passos
1. **Auditoria manual** das cores hardcoded mais utilizadas
2. **Criação de tokens** para cores recorrentes
3. **Refatoração gradual** substituindo hardcoded por tokens
4. **Configuração de ESLint rules** para cores
5. **Documentação** da paleta oficial do projeto

---

## 📚 Arquivos Analisados

Total: ${inventory.statistics.totalFiles} arquivos

### Padrões incluídos:
- \`src/**/*.{ts,tsx,js,jsx,css,module.css,scss}\`

### Exclusões:
- \`*.test.*\` - Arquivos de teste
- \`*.stories.*\` - Arquivos do Storybook  
- \`src/shared/components/charts/**/*\` - Arquivos de gráficos ECharts
- \`src/shared/utils/chartTooltipConfig.ts\` - Configurações de tooltip
- \`src/pages/dashboard/styles/ChartContainer.module.css\` - Estilos de container
- \`node_modules/**/*\` - Dependências

---

*Relatório gerado automaticamente pelo Color Analyzer*  
*Para atualizar, execute: \`node scripts/color-analyzer.js\`*
`;

  return report;
}

// Função para obter título do tipo de cor
function getTypeTitle(type) {
  const titles = {
    'hex': '🔷 Hexadecimais',
    'rgb': '🟦 RGB/RGBA',
    'hsl': '🌈 HSL/HSLA', 
    'named': '📛 Named Colors'
  };
  return titles[type] || type.toUpperCase();
}

// Função para gerar saída JSON
function generateJSONOutput(inventory) {
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.1.0',
      analyzer: 'Synapse Color Analyzer (UI/UX only)',
      scope: 'Excludes ECharts files and chart-related colors'
    },
    statistics: inventory.statistics,
    designTokens: Object.fromEntries(inventory.designTokens),
    hardcodedColors: Object.fromEntries(inventory.hardcodedColors),
    colorUsage: Object.fromEntries(
      Array.from(inventory.colorUsage.entries()).map(([key, data]) => [
        key,
        {
          ...data,
          occurrences: data.occurrences.map(occ => ({
            file: path.relative(process.cwd(), occ.file),
            line: occ.line,
            context: occ.context
          }))
        }
      ])
    ),
    fileAnalysis: Object.fromEntries(
      Array.from(inventory.fileAnalysis.entries()).map(([file, data]) => [
        path.relative(process.cwd(), file),
        data
      ])
    )
  };
}

// Função principal
async function main() {
  console.log('🎨 Iniciando análise de cores do projeto Synapse...\n');
  
  const inventory = new ColorInventory();
  
  try {
    // Encontrar todos os arquivos
    console.log('📁 Coletando arquivos...');
    const files = await glob(CONFIG.patterns, { 
      cwd: process.cwd(),
      ignore: [
        'node_modules/**/*', 
        '**/*.test.*', 
        '**/*.stories.*',
        'src/shared/components/charts/**/*',
        'src/shared/utils/chartTooltipConfig.ts',
        'src/pages/dashboard/styles/ChartContainer.module.css'
      ]
    });
    
    console.log(`   Encontrados ${files.length} arquivos\n`);
    
    // Analisar cada arquivo
    console.log('🔍 Analisando arquivos...');
    files.forEach((file, index) => {
      const filePath = path.resolve(file);
      analyzeFile(filePath, inventory);
      
      if ((index + 1) % 50 === 0) {
        console.log(`   Processados ${index + 1}/${files.length} arquivos`);
      }
    });
    
    inventory.updateStatistics();
    
    console.log(`\n✅ Análise concluída!`);
    console.log(`   Arquivos analisados: ${inventory.statistics.totalFiles}`);
    console.log(`   Cores encontradas: ${inventory.statistics.totalColors}`);
    console.log(`   Cores únicas: ${inventory.statistics.uniqueColors}`);
    
    // Criar diretório de output se não existir
    const outputDir = path.resolve(CONFIG.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Gerar e salvar JSON
    console.log('\n📄 Gerando relatórios...');
    const jsonOutput = generateJSONOutput(inventory);
    const jsonPath = path.join(outputDir, CONFIG.outputFiles.json);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
    console.log(`   JSON salvo em: ${jsonPath}`);
    
    // Gerar e salvar Markdown
    const markdownReport = generateMarkdownReport(inventory);
    const markdownPath = path.join(outputDir, CONFIG.outputFiles.report);
    fs.writeFileSync(markdownPath, markdownReport);
    console.log(`   Relatório salvo em: ${markdownPath}`);
    
    console.log('\n🎉 Análise completa! Verifique os arquivos gerados.');
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  main();
}

export { main, analyzeFile, ColorInventory };