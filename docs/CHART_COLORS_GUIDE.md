# 📊 Guia de Cores para Gráficos ECharts - Projeto Synapse

## Cores Específicas de Visualização de Dados

### 🎨 **Paletas por Tipo de Gráfico**

#### **Gráficos de Pizza (Pie Charts)**
Usado em: `DemandTypesChart.tsx`, `MediaTypesChart.tsx`

```javascript
// Paleta principal - tons equilibrados
const colors = [
  '#3b82f6', // blue - Azul institucional
  '#10b981', // emerald - Verde sucesso  
  '#f59e0b', // amber - Amarelo atenção
  '#ef4444', // red - Vermelho erro
  '#8b5cf6', // violet - Roxo diferenciação
  '#06b6d4', // cyan - Azul claro
  '#84cc16', // lime - Verde claro
  '#f97316', // orange - Laranja
];
```

#### **Named Colors (Cores Semânticas)**
Usado em gráficos específicos:

```javascript
// Cores com significado funcional
const semanticColors = {
  'blue': '#3b82f6',    // Informação, dados primários
  'green': '#10b981',   // Sucesso, positivo, crescimento
  'red': '#ef4444',     // Erro, negativo, alerta
  'orange': '#f59e0b',  // Atenção, warning
  'violet': '#8b5cf6',  // Categoria especial
  'cyan': '#06b6d4',    // Dados secundários
  'lime': '#84cc16',    // Dados terciários  
  'pink': '#ec4899',    // Destaque especial
  'indigo': '#6366f1'   // Categoria auxiliar
};
```

### 🎯 **Tooltips e Overlays**

#### **Configuração de Tooltips**
Arquivo: `chartTooltipConfig.ts`

```css
/* Tooltip padrão */
.tooltip {
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  color: #1e293b;
}

/* Tooltip título */
.tooltip-title {
  color: #64748b;
  border-bottom: 1px solid #e5e7eb;
}

/* Tooltip valor */
.tooltip-value {
  color: #6b7280;
}
```

#### **Overlays e Backgrounds**
```css
/* Background de gráficos */
.chart-container {
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* Hover states */
.chart-hover {
  background: rgba(0, 0, 0, 0.05);
}
```

### 📈 **Gráficos por Categoria**

#### **1. Análise de Demandas**
- `DemandTypesChart.tsx` - Tipos de demanda
- `DemandsYearlyChart.tsx` - Demandas por ano
- `StatusByYearChart.tsx` - Status por período

**Paleta:** Azuis e verdes (institucionais)

#### **2. Análise de Documentos** 
- `MediaTypesChart.tsx` - Tipos de mídia
- `ResponseRateChart.tsx` - Taxa de resposta
- `AverageResponseTimeChart.tsx` - Tempo médio

**Paleta:** Tons variados para diferenciação

#### **3. Análise de Provedores**
- `ProviderRanking.tsx` - Ranking de provedores  
- `ProviderStatsSummary.tsx` - Estatísticas resumidas
- `SolicitantesOrgansChart.tsx` - Órgãos solicitantes

**Paleta:** Performance-based (verde = bom, vermelho = ruim)

### 🔧 **Estilos CSS Específicos**

#### **Container Principal**
```css
.chartContainer {
  background: transparent;
  border: none;
  min-height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

#### **Responsividade**
```css
@media (max-width: 768px) {
  .chartContainer {
    min-height: 250px;
    padding: var(--space-2);
  }
}
```

#### **Loading States**
```css
.chartLoading {
  background: linear-gradient(
    90deg, 
    var(--color-gray-200) 25%, 
    var(--color-gray-100) 50%, 
    var(--color-gray-200) 75%
  );
  animation: shimmer 2s ease-in-out infinite;
}
```

### ⚠️ **Diretrizes Importantes**

#### **❌ NÃO Padronizar:**
- Cores de séries de dados (diferenciação necessária)
- Named colors semânticas (`red`, `green`, `blue`)  
- Paletas específicas de visualização
- Cores de tooltips (configuração ECharts)

#### **✅ Manter Consistente:**
- Background containers (usar design tokens)
- Bordas e divisores (usar `--border-primary`)
- Textos de labels (usar `--text-secondary`)
- Estados de loading (usar skeleton tokens)

#### **🎨 Critérios de Cor:**
1. **Contraste**: Mínimo 4.5:1 para acessibilidade
2. **Diferenciação**: Cores suficientemente distintas
3. **Significado**: Verde = positivo, Vermelho = negativo
4. **Consistência**: Mesma cor = mesmo significado entre gráficos

### 📋 **Paletas Recomendadas**

#### **Paleta Primária (5 cores)**
Para a maioria dos gráficos:
```javascript
const primaryPalette = [
  '#3b82f6', // Blue - Dados primários
  '#10b981', // Emerald - Sucesso/Crescimento  
  '#f59e0b', // Amber - Atenção/Neutro
  '#ef4444', // Red - Erro/Declínio
  '#8b5cf6'  // Violet - Categoria especial
];
```

#### **Paleta Estendida (10 cores)**  
Para gráficos com muitas séries:
```javascript
const extendedPalette = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];
```

#### **Paleta Monocromática (Azul)**
Para gráficos de uma categoria:
```javascript
const monochromePalette = [
  '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6',
  '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'
];
```

### 🛠️ **Ferramentas e Utilitários**

#### **Função de Geração de Cores**
```javascript
// Gera cores baseadas no tema atual
export const generateChartColors = (count: number) => {
  const baseColors = primaryPalette;
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  // Gera cores adicionais se necessário
  return [...baseColors, ...generateAdditionalColors(count - baseColors.length)];
};
```

#### **Validação de Contraste**
```javascript
// Valida se a cor tem contraste suficiente
export const validateContrast = (color: string, background = '#ffffff') => {
  const contrast = calculateContrast(color, background);
  return contrast >= 4.5; // WCAG AA standard
};
```

### 📚 **Documentação de Componentes**

#### **EChartsWrapper**
Wrapper principal para todos os gráficos:
- Tema automático (claro/escuro)
- Responsividade built-in
- Tooltips padronizados

#### **LazyChartWrapper** 
Carregamento lazy para performance:
- Loading states consistentes
- Error boundaries
- Fallbacks visuais

---

**🎯 Objetivo:** Manter a funcionalidade e diferenciação visual dos gráficos enquanto o resto do sistema usa design tokens padronizados. 

**✅ Resultado:** Dois sistemas coexistindo harmoniosamente - UI tokens para interface e cores específicas para visualização de dados.**