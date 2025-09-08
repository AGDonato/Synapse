# 🎨 Color Analyzer Script - Documentação

## Visão Geral

O **Color Analyzer** é um script Node.js que faz um levantamento completo de todas as cores utilizadas no projeto Synapse. Ele analisa arquivos TypeScript, CSS e CSS Modules para identificar:

- 🎯 **Design Tokens** (CSS Custom Properties)  
- 🔷 **Cores Hexadecimais** (#RGB, #RRGGBB, #RRGGBBAA)
- 🟦 **Funções RGB/RGBA/HSL/HSLA**  
- 📛 **Named Colors** (white, black, transparent, etc.)

## Como Usar

### Comando npm
```bash
npm run analyze-colors
```

### Execução direta
```bash
node scripts/color-analyzer.js
```

## Arquivos Gerados

O script gera dois arquivos na pasta `docs/`:

### 1. `color-inventory.json` 
Dados estruturados em JSON com:
- Metadados da análise
- Estatísticas gerais  
- Mapeamento de design tokens
- Cores hardcoded por arquivo
- Detalhes de uso de cada cor

### 2. `COLOR_AUDIT_REPORT.md`
Relatório em Markdown com:
- Resumo executivo com métricas
- Lista completa de design tokens
- Cores hardcoded categorizadas por tipo
- Top 10 arquivos com mais cores  
- Recomendações de melhoria

## Resultados da Última Análise

**Executado em:** 08/09/2025  
**Arquivos analisados:** 311  

### 📊 Métricas Principais
- **Arquivos com cores:** 104  
- **Total de ocorrências:** 3.604  
- **Cores únicas:** 706  
- **Design tokens:** 266  
- **Cores hardcoded:** 309  

### ✅ Pontos Positivos
- ✅ Design tokens bem estruturados em `design-tokens.css`
- ✅ Sistema de cores organizado com paletas primitivas
- ✅ Suporte completo a tema escuro
- ✅ Tokens semânticos para diferentes contextos

### ⚠️ Oportunidades de Melhoria
- 🔍 **309 cores hardcoded** identificadas
- 📋 Migração gradual para design tokens
- 🎨 Padronização de cores recorrentes

## Arquivos Analisados

### Padrões Incluídos
- `src/**/*.{ts,tsx,js,jsx,css,module.css,scss}`

### Exclusões
- `*.test.*` - Arquivos de teste
- `*.stories.*` - Arquivos do Storybook  
- `node_modules/**/*` - Dependências

## Tipos de Cor Detectados

### Design Tokens (CSS Custom Properties)
```css
--color-brand-500: #3b82f6;
background: var(--color-brand-500);
```

### Cores Hexadecimais
```css
color: #3b82f6;
background: #fff;
border: 1px solid #e5e7eb;
```

### Funções RGB/RGBA
```css
background: rgba(255, 255, 255, 0.9);
color: rgb(59, 130, 246);
```

### Funções HSL/HSLA
```css
background: hsl(220, 91%, 60%);
color: hsla(220, 91%, 60%, 0.8);
```

### Named Colors
```css
color: white;
background: transparent;
border-color: currentColor;
```

## Como Interpretar o Relatório

### Seção "Design Tokens"
Lista todos os CSS custom properties encontrados, ordenados alfabeticamente. Indica qual arquivo define cada token.

### Seção "Cores Hardcoded por Tipo"
Agrupa cores por categoria (hex, rgb, named) e mostra:
- Quantas vezes cada cor aparece
- Em quais arquivos está sendo usada
- Top 20 cores mais utilizadas

### Seção "Análise por Arquivo"
Mostra os 10 arquivos com mais cores, dividindo entre:
- Total de cores no arquivo
- Cores hardcoded  
- Design tokens utilizados

## Próximos Passos Recomendados

### 1. Auditoria Manual 🔍
Revisar as cores hardcoded mais utilizadas e avaliar se devem virar design tokens.

### 2. Criação de Tokens 🎨
Para cores que aparecem 5+ vezes, considerar criar tokens centralizados.

### 3. Refatoração Gradual 🔧
Substituir hardcoded por tokens seguindo prioridade:
- Cores de marca/branding
- Cores funcionais (success, error, warning)  
- Cores neutras/grays recorrentes

### 4. Automação 🚀
Configurar ESLint rules para prevenir novas cores hardcoded:
```json
{
  "rules": {
    "no-hardcoded-colors": "warn"
  }
}
```

### 5. Documentação 📚
Manter guia de cores atualizado com:
- Paleta oficial do projeto
- Guidelines de uso
- Exemplos de implementação

## Versionamento

- **v1.0.0** - Versão inicial com análise completa
  - Detecta todos os tipos principais de cor
  - Gera relatórios JSON e Markdown  
  - Estatísticas detalhadas
  - Recomendações automáticas

## Manutenção

### Frequência Recomendada
- **Semanal:** Durante desenvolvimento ativo
- **Por feature:** Antes de merge de features grandes  
- **Por release:** Antes de cada versão

### Atualização Automática
Considerar adicionar ao pipeline CI/CD para:
- Gerar relatório a cada push
- Detectar regressões de cores hardcoded
- Manter documentação sempre atualizada

---

**Última atualização:** 08/09/2025  
**Mantenedores:** Equipe Synapse  
**Contato:** Para dúvidas ou sugestões sobre o Color Analyzer