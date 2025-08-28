# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Synapse is a React-based document and demand management system built with TypeScript and Vite. The application manages legal or administrative demands with features for document handling, categorization, and reporting.

## Core Commands

### Development
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production (TypeScript compile + Vite build)
npm run lint         # Run ESLint for code quality checks
npm run preview      # Preview production build locally
npm run export-tree  # Generate project structure documentation
```

### Type Checking
The project uses TypeScript with separate configs:
- `tsconfig.app.json` - Application code configuration
- `tsconfig.node.json` - Node.js build tools configuration
- Run `tsc -b` for type checking (included in build command)

## Architecture

### Routing Structure
The application uses React Router with a nested route structure:
- **Root Layout**: `App.tsx` provides header/sidebar layout
- **Main Sections**: Demandas, Documentos, Cadastros, Configurações, Relatórios
- **Nested Routes**: Each section has detail pages and CRUD operations

### State Management
- **Context API**: Primary state management using React Context
- **DemandasContext**: Central state for demand management with CRUD operations
- **Local State**: Component-level state for UI interactions

### Data Layer
Mock data files in `src/data/` simulate backend responses:
- `mockDemandas.ts` - Core demand entities
- `mockAssuntos.ts`, `mockOrgaos.ts`, etc. - Reference data for dropdowns
- Data follows TypeScript interfaces for type safety

### Component Organization
- **Layout Components**: `src/components/layout/` - Header, Sidebar, page layouts
- **UI Components**: `src/components/ui/` - Reusable elements (Button, StatusBadge)
- **Form Components**: `src/components/forms/` - SearchableSelect and form utilities
- **Pages**: Organized by feature area (`pages/cadastros/`, `pages/configuracoes/`)

### Key Patterns
1. **Page Structure**: Most pages follow CadastroPageLayout for consistent UI
2. **Mock Data**: All data sources are currently mocked - consider this when implementing features
3. **Type Safety**: Heavy use of TypeScript interfaces throughout the application
4. **Context Provider**: DemandasProvider wraps the entire app in main.tsx
5. **Sidebar Navigation**: Dynamic sidebar with collapsible menu functionality

### Development Notes
- No test framework is currently configured
- ESLint is configured but type-aware rules are not enabled
- Vite is used for fast development builds and HMR
- All components are functional components using React hooks

## Recent Updates & Features

### Sidebar Navigation (Updated)
The sidebar now supports two states:
- **Expanded**: Shows all menu items including "Cadastros" and "Configurações" sections
- **Collapsed**: Shows only main icons (Início, Demandas, Documentos, Relatórios) as clickable buttons
- **Toggle**: Controlled by the hamburger menu button in the header
- **Responsive**: Automatically collapses on screens ≤768px
- **Consistent Spacing**: Icons maintain same vertical alignment in both states

Key files:
- `src/components/layout/Sidebar.tsx` - Main sidebar component with `isCollapsed` prop
- `src/components/layout/Sidebar.module.css` - Responsive styles for collapsed/expanded states
- `src/components/layout/AppLayout.tsx` - Controls sidebar state via `isSidebarCollapsed`

### Header Design (Updated) 
The header now features a clean, branded design:
- **App Icon**: Custom SVG logo located at `/public/synapse-icon.svg` (32px, circular)
- **Fixed Title**: Always shows "Synapse" (no dynamic page titles)
- **Layout**: Menu Button → Icon + "Synapse" → Spacer → "Olá, Alan!" + "Sair"
- **No Breadcrumbs**: Removed dynamic navigation breadcrumbs for cleaner look

Key files:
- `src/components/layout/Header.tsx` - Simplified header with app branding
- `src/components/layout/Header.module.css` - Icon and branding styles
- `/public/synapse-icon.svg` - App icon file (user-provided)

### Form Improvements

#### Novo Documento Page
Enhanced autocomplete behavior for destinatário/endereçamento fields:
- **Destinatário List**: Combines `nomeFantasia` from `mockProvedores` + `nome` from `mockAutoridades`
- **Smart Autocomplete**: 
  - If destinatário is from `mockProvedores` → auto-fills endereçamento with corresponding `razaoSocial`
  - If destinatário is from `mockAutoridades` → leaves endereçamento empty
- **Dynamic Endereçamento List**:
  - When destinatário is provedor → shows only `razaoSocial` from `mockProvedores`
  - When destinatário is autoridade → shows only `nomeCompleto` from `mockOrgaos`

#### Nova/Editar Demanda Page
Form field updates:
- **"Autos Administrativos"**: Made optional (removed `required` attribute and red asterisk)
- **Navigation**: Fixed "Voltar" button to use `navigate(-1)` instead of hardcoded route

Key files:
- `src/pages/NovoDocumentoPage.tsx` - Enhanced destinatário/endereçamento logic
- `src/pages/NovaDemandaPage.tsx` - Optional autos administrativos field

### Security Configuration

#### Content Security Policy (CSP)
- **Implementação**: Sistema CSP robusto em `src/services/security/csp.ts`
- **Meta Tags vs HTTP Headers**: Diretivas como `frame-ancestors` só funcionam via cabeçalhos HTTP
- **Configuração Automática**: Em desenvolvimento, instruções são exibidas no console
- **Produção**: Ver `SECURITY.md` para configuração no servidor (Apache/Nginx/PHP)

#### Progressive Web App (PWA)
- **Manifest**: Configuração completa em `/public/manifest.json` 
- **Meta Tags**: Atualizadas com padrões modernos (`mobile-web-app-capable`)
- **Compatibilidade**: Suporte para iOS, Android, Windows (browserconfig.xml)
- **Icons**: Ícone SVG otimizado para todas as plataformas

### Dashboard Layout & Charts (Janeiro 2025)

#### Grid Layout Optimization
- **Fixed Grid System**: Implementação de layouts grid fixos para pares de cards
- **Proportional Layouts**: Sistema 65/35 e 50/50 para distribuição consistente
- **Responsive Behavior**: Grids mantêm proporções em todas as breakpoints
- **Flex vs Grid**: Remoção de conflitos entre propriedades flex e display: grid

#### Chart Standardization
- **Uniform Heights**: Padronização de alturas dos gráficos em 350px
- **Legend Positioning**: Ajuste de legendas para top: 20 para melhor aproveitamento
- **Header Spacing**: Redução de margens de cabeçalho de 1.5rem para 0.5rem
- **Section Gaps**: Otimização de espaçamento entre seções (1rem padrão)

#### ECharts Integration
- **Inline Styles**: Aplicação de `style={{ height: '350px', minHeight: '350px' }}` para garantia de altura
- **Wrapper Optimization**: Melhorias no componente `EChartsWrapper` para performance
- **Size Sensor**: Polyfill para resolver problemas de dimensionamento (`src/utils/sizeSensorPolyfill.ts`)
- **Skeleton Loading**: Ajuste de skeletons para corresponder às alturas finais dos gráficos

#### Key Files Updated (Janeiro 2025):
- `src/pages/HomePage/styles/HomePage.module.css` - Grid layouts fixos e classes de margem
- `src/pages/HomePage/styles/ChartContainer.module.css` - Margens de cabeçalho otimizadas
- `src/components/charts/*/` - Padronização de alturas e styles inline
- `src/pages/HomePage/components/Lazy*Analysis.tsx` - Ajuste de skeletons e espaçamentos
- `vite.config.ts` - Configuração HMR e polyfill para size-sensor

### Code Patterns & Best Practices
1. **Responsive Design**: Components adapt to collapsed/expanded states and screen sizes
2. **Smart Form Logic**: Dynamic field behavior based on user selections
3. **Consistent Navigation**: Proper back button behavior using React Router
4. **TypeScript Safety**: All new features maintain strict type checking
5. **CSS Modules**: Scoped styling with design token integration
6. **Security First**: CSP implemented with proper separation between meta tags and HTTP headers
7. **DOM Safety**: Null-safe DOM manipulation with utility functions (`src/utils/domUtils.ts`)
8. **Chart Consistency**: Uniform heights, inline styles, and responsive behavior across all charts
9. **Grid Layouts**: Fixed proportional grids (65/35, 50/50) with responsive maintenance
10. **Performance**: Lazy loading, memoization, and optimized re-renders for dashboard components