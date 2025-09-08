# 🎨 Relatório de Auditoria de Cores - Projeto Synapse (UI/UX apenas)

**Gerado em:** 08/09/2025, 01:07:16  
**Versão:** 1.1.0  
**Total de arquivos analisados:** 282
**Escopo:** UI/UX colors (excluindo gráficos ECharts)

---

## 📊 Resumo Executivo

| Métrica | Valor |
|---------|--------|
| **Arquivos com cores** | 78 |
| **Total de ocorrências** | 3240 |
| **Cores únicas** | 628 |
| **Design tokens** | 266 |
| **Cores hardcoded** | 231 |

---

## 🎯 Design Tokens (CSS Custom Properties)

### ✅ Tokens encontrados (266)

| Token | Arquivo | Linha | Contexto |
|-------|---------|--------|----------|
| `--bg-accent` | Sidebar.module.css | 170 | background-color: var(--bg-accent); |
| `--bg-elevated` | Header.module.css | 8 | background-color: var(--bg-elevated); |
| `--bg-overlay` | design-tokens.css | 269 | rgba(0, 0, 0, 0.5) | --bg-overlay: rgba(0, 0, 0, 0.5); |
| `--bg-primary` | AppLayout.module.css | 20 | background-color: var(--bg-primary); |
| `--bg-primary, #ffffff` | DataTable.module.css | 309 | background: var(--bg-primary, #ffffff); |
| `--bg-secondary` | DocumentUpdateModal.module.css | 21 | background-color: var(--bg-secondary); |
| `--bg-secondary, #f8fafc` | DataTable.module.css | 318 | background: var(--bg-secondary, #f8fafc); |
| `--bg-surface` | Skeleton.module.css | 175 | background: var(--bg-surface); |
| `--bg-tertiary` | Button.module.css | 113 | background-color: var(--bg-tertiary); |
| `--bg-tertiary, #f1f5f9` | DataTable.module.css | 80 | background: var(--bg-tertiary, #f1f5f9); |
| `--border-accent` | design-tokens.css | 282 | var(--color-brand-200) | --border-accent: var(--color-bra... |
| `--border-focus` | DemandUpdateModal.module.css | 216 | utline: 2px solid var(--border-focus); |
| `--border-focus, #3b82f6` | DataTable.module.css | 51 | border-color: var(--border-focus, #3b82f6); |
| `--border-primary` | Header.module.css | 9 | bottom: 1px solid var(--border-primary); |
| `--border-primary, #e2e8f0` | DataTable.module.css | 292 | dth-1, 1px) solid var(--border-primary, #e2e8f0); |
| `--border-secondary` | MobileHeader.module.css | 251 | ttom: 2px solid var(--border-secondary); |
| `--border-secondary, #cbd5e1` | DataTable.module.css | 308 | dth-1, 1px) solid var(--border-secondary, #cbd5e1); |
| `--border-width-1` | Skeleton.module.css | 177 | border: var(--border-width-1) solid var(--border-primary); |
| `--border-width-1, 1px` | DataTable.module.css | 308 | border: var(--border-width-1, 1px) solid var(--border-second |
| `--border-width-2` | design-tokens.css | 171 | 2px | --border-width-2: 2px; |
| `--breakpoint-2xl` | responsive.css | 12 | 1536px | --breakpoint-2xl: 1536px; /* 2XL devices (large ... |
| `--breakpoint-lg` | responsive.css | 10 | 1024px | --breakpoint-lg: 1024px; /* Large devices (small... |
| `--breakpoint-md` | responsive.css | 9 | 768px | --breakpoint-md: 768px; /* Medium devices (tablet... |
| `--breakpoint-sm` | responsive.css | 8 | 640px | --breakpoint-sm: 640px; /* Small devices (large p... |
| `--breakpoint-xl` | responsive.css | 11 | 1280px | --breakpoint-xl: 1280px; /* Extra large devices ... |
| `--breakpoint-xs` | responsive.css | 7 | 475px | --breakpoint-xs: 475px; /* Extra small devices */ |
| `--card-accent-color` | DetalheDocumentoPage.module.css | 256 | #20c997 | --card-accent-color: #20c997; |
| `--card-accent-color-rgb, 0, 123, 255` | DetalheDocumentoPage.module.css | 527 | background: rgba(var(--card-accent-color-rgb, 0, 123, 255... |
| `--card-accent-color, #007bff` | DetalheDocumentoPage.module.css | 528 | color: var(--card-accent-color, #007bff); |
| `--card-accent-color, #fd7e14` | DetalheDocumentoPage.module.css | 452 | color: var(--card-accent-color, #fd7e14); |
| `--color-brand-100` | design-tokens.css | 8 | #dbeafe | --color-brand-100: #dbeafe; |
| `--color-brand-200` | design-tokens.css | 282 | --border-accent: var(--color-brand-200); |
| `--color-brand-300` | design-tokens.css | 244 | -primary-pressed: var(--color-brand-300); |
| `--color-brand-400` | design-tokens.css | 243 | ve-primary-hover: var(--color-brand-400); |
| `--color-brand-50` | design-tokens.css | 267 | --bg-accent: var(--color-brand-50); |
| `--color-brand-500` | design-tokens.css | 283 | --border-focus: var(--color-brand-500); |
| `--color-brand-600` | design-tokens.css | 286 | eractive-primary: var(--color-brand-600); |
| `--color-brand-700` | design-tokens.css | 287 | ve-primary-hover: var(--color-brand-700); |
| `--color-brand-800` | design-tokens.css | 288 | -primary-pressed: var(--color-brand-800); |
| `--color-brand-900` | design-tokens.css | 16 | #1e3a8a | --color-brand-900: #1e3a8a; |
| `--color-brand-950` | design-tokens.css | 223 | --bg-accent: var(--color-brand-950); |
| `--color-error-100` | Skeleton.module.css | 251 | var(--color-error-100) 100% |
| `--color-error-200` | DocumentUpdateModal.module.css | 15 | border: 1px solid var(--color-error-200); |
| `--color-error-300` | design-tokens.css | 60 | #f87171 | --color-error-300: #f87171; |
| `--color-error-400` | design-tokens.css | 61 | #f56565 | --color-error-400: #f56565; |
| `--color-error-50` | MobileNav.module.css | 254 | background: var(--color-error-50); |
| `--color-error-50, #fef2f2` | DataTable.module.css | 274 | background: var(--color-error-50, #fef2f2); |
| `--color-error-500` | MobileHeader.module.css | 136 | background: var(--color-error-500); |
| `--color-error-500, #ef4444` | ErrorBoundary.module.css | 27 | color: var(--color-error-500, #ef4444); |
| `--color-error-600` | DocumentUpdateModal.module.css | 10 | color: var(--color-error-600); |
| `--color-error-600, #dc2626` | DataTable.module.css | 270 | color: var(--color-error-600, #dc2626); |
| `--color-error-700` | MobileNav.module.css | 256 | color: var(--color-error-700); |
| `--color-error-800` | Button.module.css | 168 | border-color: var(--color-error-800); |
| `--color-error-900` | design-tokens.css | 257 | --color-error-bg: var(--color-error-900); |
| `--color-error-bg` | DocumentUpdateModal.module.css | 9 | background-color: var(--color-error-bg); |
| `--color-gray-100` | Skeleton.module.css | 126 | var(--color-gray-100) 75% |
| `--color-gray-100, #f3f4f6` | ErrorBoundary.module.css | 121 | background: var(--color-gray-100, #f3f4f6); |
| `--color-gray-200` | Skeleton.module.css | 7 | var(--color-gray-200) 50%, |
| `--color-gray-600` | Icon.tsx | 280 |  const, color: 'var(--color-gray-600)' }, |
| `--color-gray-700` | Skeleton.module.css | 292 | var(--color-gray-700) 50%, |
| `--color-gray-800` | Skeleton.module.css | 293 | var(--color-gray-800) 100% |
| `--color-info-100` | design-tokens.css | 69 | #dbeafe | --color-info-100: #dbeafe; |
| `--color-info-200` | design-tokens.css | 70 | #bfdbfe | --color-info-200: #bfdbfe; |
| `--color-info-300` | design-tokens.css | 71 | #93c5fd | --color-info-300: #93c5fd; |
| `--color-info-400` | design-tokens.css | 72 | #60a5fa | --color-info-400: #60a5fa; |
| `--color-info-50` | design-tokens.css | 296 | --color-info-bg: var(--color-info-50); |
| `--color-info-500` | design-tokens.css | 73 | #3b82f6 | --color-info-500: #3b82f6; |
| `--color-info-600` | design-tokens.css | 74 | #2563eb | --color-info-600: #2563eb; |
| `--color-info-700` | design-tokens.css | 75 | #1d4ed8 | --color-info-700: #1d4ed8; |
| `--color-info-800` | design-tokens.css | 76 | #1e40af | --color-info-800: #1e40af; |
| `--color-info-900` | design-tokens.css | 258 | --color-info-bg: var(--color-info-900); |
| `--color-info-bg` | design-tokens.css | 296 | var(--color-info-50) | --color-info-bg: var(--color-info-... |
| `--color-neutral-0` | design-tokens.css | 276 | --text-on-brand: var(--color-neutral-0); |
| `--color-neutral-100` | design-tokens.css | 289 | active-secondary: var(--color-neutral-100); |
| `--color-neutral-200` | design-tokens.css | 290 | -secondary-hover: var(--color-neutral-200); |
| `--color-neutral-300` | design-tokens.css | 281 | border-secondary: var(--color-neutral-300); |
| `--color-neutral-400` | design-tokens.css | 275 | text-placeholder: var(--color-neutral-400); |
| `--color-neutral-50` | design-tokens.css | 265 | --bg-secondary: var(--color-neutral-50); |
| `--color-neutral-500` | design-tokens.css | 274 | --text-tertiary: var(--color-neutral-500); |
| `--color-neutral-600` | design-tokens.css | 273 | --text-secondary: var(--color-neutral-600); |
| `--color-neutral-700` | design-tokens.css | 245 | active-secondary: var(--color-neutral-700); |
| `--color-neutral-800` | design-tokens.css | 224 | --bg-elevated: var(--color-neutral-800); |
| `--color-neutral-900` | design-tokens.css | 272 | --text-primary: var(--color-neutral-900); |
| `--color-neutral-950` | design-tokens.css | 220 | --bg-primary: var(--color-neutral-950); |
| `--color-primary-100` | MobileHeader.module.css | 184 | background: var(--color-primary-100); |
| `--color-primary-200` | Skeleton.module.css | 223 | var(--color-primary-200) 50%, |
| `--color-primary-50` | MobileNav.module.css | 205 | background: var(--color-primary-50); |
| `--color-primary-500` | MobileHeader.module.css | 206 | background: var(--color-primary-500); |
| `--color-primary-500, #3b82f6` | ErrorBoundary.module.css | 66 | background: var(--color-primary-500, #3b82f6); |
| `--color-primary-600` | MobileHeader.module.css | 185 | color: var(--color-primary-600); |
| `--color-primary-600, #2563eb` | ErrorBoundary.module.css | 71 | background: var(--color-primary-600, #2563eb); |
| `--color-primary-700` | MobileNav.module.css | 206 | color: var(--color-primary-700); |
| `--color-purple-100` | design-tokens.css | 80 | #f3e8ff | --color-purple-100: #f3e8ff; |
| `--color-purple-200` | design-tokens.css | 81 | #e9d5ff | --color-purple-200: #e9d5ff; |
| `--color-purple-300` | design-tokens.css | 82 | #d8b4fe | --color-purple-300: #d8b4fe; |
| `--color-purple-400` | design-tokens.css | 83 | #c084fc | --color-purple-400: #c084fc; |
| `--color-purple-50` | design-tokens.css | 79 | #faf5ff | --color-purple-50: #faf5ff; |
| `--color-purple-500` | design-tokens.css | 84 | #a855f7 | --color-purple-500: #a855f7; |
| `--color-purple-600` | design-tokens.css | 85 | #9333ea | --color-purple-600: #9333ea; |
| `--color-purple-700` | design-tokens.css | 86 | #7c3aed | --color-purple-700: #7c3aed; |
| `--color-purple-800` | design-tokens.css | 87 | #6b21a8 | --color-purple-800: #6b21a8; |
| `--color-success-100` | Skeleton.module.css | 233 | var(--color-success-100) 100% |
| `--color-success-200` | Skeleton.module.css | 232 | var(--color-success-200) 50%, |
| `--color-success-300` | design-tokens.css | 37 | #86efac | --color-success-300: #86efac; |
| `--color-success-400` | design-tokens.css | 38 | #4ade80 | --color-success-400: #4ade80; |
| `--color-success-50` | design-tokens.css | 293 | color-success-bg: var(--color-success-50); |
| `--color-success-500` | Toast.module.css | 45 | -gradient(135deg, var(--color-success-500) 0%, var(--colo... |
| `--color-success-600` | Button.module.css | 117 | background-color: var(--color-success-600); |
| `--color-success-700` | Button.module.css | 122 | background-color: var(--color-success-700); |
| `--color-success-700, #15803d` | StatCard.module.css | 119 | color: var(--color-success-700, #15803d); |
| `--color-success-800` | Button.module.css | 126 | background-color: var(--color-success-800); |
| `--color-success-900` | design-tokens.css | 255 | color-success-bg: var(--color-success-900); |
| `--color-success-bg` | design-tokens.css | 293 | var(--color-success-50) | --color-success-bg: var(--color... |
| `--color-warning-100` | Skeleton.module.css | 242 | var(--color-warning-100) 100% |
| `--color-warning-200` | Skeleton.module.css | 241 | var(--color-warning-200) 50%, |
| `--color-warning-300` | design-tokens.css | 49 | #fcd34d | --color-warning-300: #fcd34d; |
| `--color-warning-400` | design-tokens.css | 50 | #fbbf24 | --color-warning-400: #fbbf24; |
| `--color-warning-50` | design-tokens.css | 294 | color-warning-bg: var(--color-warning-50); |
| `--color-warning-500` | Button.module.css | 130 | background-color: var(--color-warning-500); |
| `--color-warning-600` | Button.module.css | 135 | background-color: var(--color-warning-600); |
| `--color-warning-700` | Button.module.css | 139 | background-color: var(--color-warning-700); |
| `--color-warning-800` | design-tokens.css | 54 | #92400e | --color-warning-800: #92400e; |
| `--color-warning-900` | design-tokens.css | 256 | color-warning-bg: var(--color-warning-900); |
| `--color-warning-bg` | design-tokens.css | 294 | var(--color-warning-50) | --color-warning-bg: var(--color... |
| `--duration-200` | design-tokens.css | 189 | ansition-all: all var(--duration-200) var(--ease-out); |
| `--duration-300` | MobileNav.module.css | 30 | sition: transform var(--duration-300) var(--ease-out); |
| `--ease-out` | MobileNav.module.css | 30 | r(--duration-300) var(--ease-out); |
| `--font-family-mono` | design-tokens.css | 146 | 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Couri... |
| `--font-family-primary` | base.css | 20 | font-family: var(--font-family-primary); |
| `--font-mono, 'Courier New', monospace` | ErrorBoundary.module.css | 117 | font-family: var(--font-mono, 'Courier New', monospace); |
| `--font-sans` | MobileForm.module.css | 157 | font-family: var(--font-sans); |
| `--font-sans, ui-sans-serif, system-ui, sans-serif` | StatCard.module.css | 84 | font-family: var(--font-sans, ui-sans-serif, system-ui, s... |
| `--font-size-2xl` | base.css | 47 | font-size: var(--font-size-2xl); |
| `--font-size-2xl, 1.5rem` | ErrorBoundary.module.css | 32 | font-size: var(--font-size-2xl, 1.5rem); |
| `--font-size-3xl` | base.css | 44 | font-size: var(--font-size-3xl); |
| `--font-size-4xl` | design-tokens.css | 155 | 2.25rem | --font-size-4xl: 2.25rem; |
| `--font-size-4xl, 2.25rem` | StatCard.module.css | 80 | font-size: var(--font-size-4xl, 2.25rem); |
| `--font-size-base` | Header.module.css | 150 | font-size: var(--font-size-base); |
| `--font-size-base, 1rem` | DataTable.module.css | 75 | font-size: var(--font-size-base, 1rem); |
| `--font-size-lg` | Header.module.css | 70 | font-size: var(--font-size-lg); |
| `--font-size-sm` | DemandUpdateModal.module.css | 204 | font-size: var(--font-size-sm); |
| `--font-size-sm, 0.875rem` | DataTable.module.css | 328 | font-size: var(--font-size-sm, 0.875rem); |
| `--font-size-xl` | RegrasPage.module.css | 27 | font-size: var(--font-size-xl); |
| `--font-size-xs` | MobileHeader.module.css | 138 | font-size: var(--font-size-xs); |
| `--font-size-xs, 0.75rem` | DataTable.module.css | 348 | font-size: var(--font-size-xs, 0.75rem); |
| `--font-weight-bold` | MobileForm.module.css | 34 | font-weight: var(--font-weight-bold); |
| `--font-weight-bold, 700` | ErrorBoundary.module.css | 33 | font-weight: var(--font-weight-bold, 700); |
| `--font-weight-medium` | DemandUpdateModal.module.css | 205 | font-weight: var(--font-weight-medium); |
| `--font-weight-medium, 500` | DataTable.module.css | 330 | font-weight: var(--font-weight-medium, 500); |
| `--font-weight-normal` | Sidebar.module.css | 158 | font-weight: var(--font-weight-normal); |
| `--font-weight-semibold` | Header.module.css | 71 | font-weight: var(--font-weight-semibold); |
| `--font-weight-semibold, 600` | DataTable.module.css | 87 | font-weight: var(--font-weight-semibold, 600); |
| `--form-arrow-color` | NovaDemandaPage.module.css | 395 | color: var(--form-arrow-color); |
| `--form-arrow-font-size` | NovaDemandaPage.module.css | 394 | font-size: var(--form-arrow-font-size); |
| `--form-background` | NovaDemandaPage.module.css | 374 | background-color: var(--form-background); |
| `--form-bg-transition` | NovaDemandaPage.module.css | 280 | transition: var(--form-bg-transition); |
| `--form-border-color` | NovaDemandaPage.module.css | 373 | border: 1px solid var(--form-border-color); |
| `--form-border-focus` | Modal.module.css | 75 | utline: 2px solid var(--form-border-focus); |
| `--form-border-hover` | NovaDemandaPage.module.css | 384 | border-color: var(--form-border-hover); |
| `--form-border-radius` | NovaDemandaPage.module.css | 372 | border-radius: var(--form-border-radius); |
| `--form-dropdown-shadow` | NovaDemandaPage.module.css | 269 | box-shadow: var(--form-dropdown-shadow); |
| `--form-focus-shadow` | NovaDemandaPage.module.css | 390 | box-shadow: var(--form-focus-shadow); |
| `--form-font-size` | NovaDemandaPage.module.css | 376 | font-size: var(--form-font-size); |
| `--form-hover-bg` | NovaDemandaPage.module.css | 357 | background-color: var(--form-hover-bg); |
| `--form-input-height` | NovaDemandaPage.module.css | 378 | height: var(--form-input-height); |
| `--form-input-padding` | NovaDemandaPage.module.css | 371 | padding: var(--form-input-padding); |
| `--form-label-font-size` | NovaDemandaPage.module.css | 165 | font-size: var(--form-label-font-size); |
| `--form-required-color` | NovaDemandaPage.module.css | 169 | color: var(--form-required-color); |
| `--form-section-bg` | NovaDemandaPage.module.css | 9 | #f8f9fa | --form-section-bg: #f8f9fa; |
| `--form-text-color` | NovaDemandaPage.module.css | 164 | color: var(--form-text-color); |
| `--form-textarea-height` | NovaDemandaPage.module.css | 213 | height: var(--form-textarea-height); |
| `--form-transition` | NovaDemandaPage.module.css | 377 | transition: var(--form-transition); |
| `--in-range` | datepicker-custom.css | 46 | not(.react-datepicker__day--selected):not( | .react-datep... |
| `--in-selecting-range` | datepicker-custom.css | 55 | not(.react-datepicker__day--selected):not( | .react-datep... |
| `--interactive-primary` | DemandUpdateModal.module.css | 225 | background-color: var(--interactive-primary); |
| `--interactive-primary-hover` | DemandUpdateModal.module.css | 221 | background-color: var(--interactive-primary-hover); |
| `--interactive-primary-pressed` | Button.module.css | 69 | background-color: var(--interactive-primary-pressed); |
| `--interactive-secondary` | design-tokens.css | 289 | var(--color-neutral-100) | --interactive-secondary: var(-... |
| `--interactive-secondary-hover` | Header.module.css | 130 | background-color: var(--interactive-secondary-hover); |
| `--keyboard-selected` | datepicker-custom.css | 37 | not(.react-datepicker__day--selected):not( | .react-datep... |
| `--letter-spacing-tight` | design-tokens.css | 165 | -0.025em | --letter-spacing-tight: -0.025em; |
| `--letter-spacing-tight, -0.025em` | StatCard.module.css | 85 | letter-spacing: var(--letter-spacing-tight, -0.025em); |
| `--letter-spacing-wide` | MobileNav.module.css | 172 | letter-spacing: var(--letter-spacing-wide); |
| `--letter-spacing-wide, 0.025em` | StatCard.module.css | 94 | letter-spacing: var(--letter-spacing-wide, 0.025em); |
| `--line-height-normal` | MobileForm.module.css | 305 | line-height: var(--line-height-normal); |
| `--line-height-normal, 1.5` | ErrorBoundary.module.css | 41 | line-height: var(--line-height-normal, 1.5); |
| `--line-height-tight` | Header.module.css | 73 | line-height: var(--line-height-tight); |
| `--line-height-tight, 1.25` | StatCard.module.css | 95 | line-height: var(--line-height-tight, 1.25); |
| `--mobile-gap` | responsive.css | 107 | gap: var(--mobile-gap); |
| `--mobile-header-height` | MobileHeader.module.css | 6 | height: var(--mobile-header-height); |
| `--mobile-nav-width` | MobileNav.module.css | 25 | width: var(--mobile-nav-width); |
| `--mobile-padding` | MobileHeader.module.css | 23 | padding: 0 var(--mobile-padding); |
| `--radius-2xl` | design-tokens.css | 176 | 1rem | --radius-2xl: 1rem; |
| `--radius-2xl, 16px` | ErrorBoundary.module.css | 9 | border-radius: var(--radius-2xl, 16px); |
| `--radius-base` | Skeleton.module.css | 18 | border-radius: var(--radius-base); |
| `--radius-full` | Sidebar.module.css | 239 | border-radius: var(--radius-full); |
| `--radius-lg` | MobileHeader.module.css | 163 | border-radius: var(--radius-lg); |
| `--radius-lg, 8px` | ErrorBoundary.module.css | 56 | border-radius: var(--radius-lg, 8px); |
| `--radius-md` | DemandUpdateModal.module.css | 203 | border-radius: var(--radius-md); |
| `--radius-md, 6px` | DataTable.module.css | 312 | border-radius: var(--radius-md, 6px); |
| `--radius-md, 8px` | StatCard.module.css | 113 | border-radius: var(--radius-md, 8px); |
| `--radius-sm` | Sidebar.module.css | 159 | border-radius: var(--radius-sm); |
| `--radius-sm, 2px` | DataTable.module.css | 109 | border-radius: var(--radius-sm, 2px); |
| `--radius-sm, 4px` | ErrorBoundary.module.css | 123 | border-radius: var(--radius-sm, 4px); |
| `--radius-xl` | Skeleton.module.css | 137 | border-radius: var(--radius-xl); |
| `--radius-xl, 12px` | DataTable.module.css | 291 | border-radius: var(--radius-xl, 12px); |
| `--shadow-base` | MobileTable.module.css | 74 | box-shadow: var(--shadow-base); |
| `--shadow-base, 0 4px 6px -1px rgba(0, 0, 0, 0.05` | StatisticsSection.module.css | 6 | box-shadow: var(--shadow-base, 0 4px 6px -1px rgba(0, 0, ... |
| `--shadow-lg` | DataTable.module.css | 230 | box-shadow: var(--shadow-lg); |
| `--shadow-sm` | Header.module.css | 10 | box-shadow: var(--shadow-sm); |
| `--shadow-xl` | Toast.module.css | 12 | box-shadow: var(--shadow-xl); |
| `--size-header` | AppLayout.module.css | 22 | ght: calc(100vh - var(--size-header)); |
| `--size-sidebar` | Sidebar.module.css | 4 | width: var(--size-sidebar); |
| `--size-sidebar-collapsed` | design-tokens.css | 212 | 4rem | --size-sidebar-collapsed: 4rem; /* 64px */ |
| `--space-1` | Sidebar.module.css | 143 | gap: var(--space-1); |
| `--space-1, 0.25rem` | StatCard.module.css | 112 | padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem); |
| `--space-10` | Header.module.css | 118 | height: var(--space-10); |
| `--space-12` | MobileTable.module.css | 201 | padding: var(--space-12) var(--space-4); |
| `--space-16` | design-tokens.css | 133 | 4rem | --space-16: 4rem; |
| `--space-2` | Header.module.css | 167 | gap: var(--space-2); |
| `--space-2, 0.5rem` | ErrorBoundary.module.css | 122 | padding: var(--space-2, 0.5rem); |
| `--space-20` | design-tokens.css | 134 | 5rem | --space-20: 5rem; |
| `--space-3` | QuickManagement.module.css | 328 | padding: var(--space-3) var(--space-4); /* 0.75rem 1rem */ |
| `--space-3, 0.75rem` | ErrorBoundary.module.css | 55 | padding: var(--space-3, 0.75rem) var(--space-6, 1.5rem); |
| `--space-4` | QuickManagement.module.css | 328 |  var(--space-3) var(--space-4); /* 0.75rem 1rem */ |
| `--space-4, 1rem` | ErrorBoundary.module.css | 129 | padding: var(--space-4, 1rem); |
| `--space-5` | QuickManagement.module.css | 303 |  var(--space-4) var(--space-5); /* 1rem 1.25rem */ |
| `--space-5, 1.25rem` | StatCard.module.css | 61 | margin-right: var(--space-5, 1.25rem); |
| `--space-6` | QuickManagement.module.css | 5 | padding: var(--space-6); /* 1.5rem */ |
| `--space-6, 1.5rem` | ErrorBoundary.module.css | 133 | padding: var(--space-6, 1.5rem); |
| `--space-7` | Header.module.css | 155 | height: var(--space-7); |
| `--space-8` | Header.module.css | 63 | max-height: var(--space-8); |
| `--space-8, 2rem` | ErrorBoundary.module.css | 88 | margin-top: var(--space-8, 2rem); |
| `--text-brand` | Sidebar.module.css | 215 | stroke: var(--text-brand); |
| `--text-on-brand` | DemandUpdateModal.module.css | 212 | color: var(--text-on-brand); |
| `--text-on-brand, #ffffff` | ErrorBoundary.module.css | 67 | color: var(--text-on-brand, #ffffff); |
| `--text-placeholder` | Header.module.css | 86 | color: var(--text-placeholder); |
| `--text-primary` | AppLayout.module.css | 8 | color: var(--text-primary); |
| `--text-primary, #1e293b` | DataTable.module.css | 319 | color: var(--text-primary, #1e293b); |
| `--text-secondary` | Header.module.css | 108 | color: var(--text-secondary); |
| `--text-secondary, #64748b` | DataTable.module.css | 329 | color: var(--text-secondary, #64748b); |
| `--text-secondary, #6b7280` | StatCard.module.css | 91 | color: var(--text-secondary, #6b7280); |
| `--text-tertiary` | Header.module.css | 123 | color: var(--text-tertiary); |
| `--text-tertiary, #94a3b8` | DataTable.module.css | 213 | color: var(--text-tertiary, #94a3b8); |
| `--text-tertiary, #9ca3af` | StatCard.module.css | 100 | color: var(--text-tertiary, #9ca3af); |
| `--today` | datepicker-custom.css | 64 | not(.react-datepicker__day--selected):not( | .react-datep... |
| `--touch-target-comfortable` | MobileHeader.module.css | 160 | height: var(--touch-target-comfortable); |
| `--touch-target-min` | responsive.css | 21 | 44px | --touch-target-min: 44px; |
| `--transition-all` | DataTable.module.css | 314 | transition: var(--transition-all); |
| `--transition-all, all 0.2s ease` | StatCard.module.css | 12 | transition: var(--transition-all, all 0.2s ease); |
| `--transition-colors` | DataTable.module.css | 254 | transition: var(--transition-colors); |
| `--transition-fast` | DemandUpdateModal.module.css | 207 | transition: var(--transition-fast); |
| `--transition-normal` | design-tokens.css | 205 | 0.2s ease-in-out | --transition-normal: 0.2s ease-in-out; |
| `--transition-slow` | design-tokens.css | 206 | 0.3s ease-in-out | --transition-slow: 0.3s ease-in-out; |
| `--z-button` | NovaDemandaPage.module.css | 347 | z-index: var(--z-button); |
| `--z-dropdown` | MobileHeader.module.css | 11 | z-index: var(--z-dropdown); |
| `--z-dropdown, 1000` | DataTable.module.css | 235 | z-index: var(--z-dropdown, 1000); |
| `--z-fixed` | Sidebar.module.css | 273 | z-index: var(--z-fixed); |
| `--z-hidden` | NovaDemandaPage.module.css | 328 | z-index: var(--z-hidden); |
| `--z-modal` | MobileNav.module.css | 28 | z-index: var(--z-modal); |
| `--z-modal-backdrop` | design-tokens.css | 196 | 1040 | --z-modal-backdrop: 1040; |
| `--z-popover` | design-tokens.css | 198 | 1060 | --z-popover: 1060; |
| `--z-sticky` | Header.module.css | 13 | z-index: var(--z-sticky); |
| `--z-toast` | Toast.module.css | 8 | z-index: var(--z-toast); |
| `--z-tooltip` | design-tokens.css | 199 | 1070 | --z-tooltip: 1070; |
| `--z-wrapper` | NovaDemandaPage.module.css | 312 | z-index: var(--z-wrapper); |


---

## 🚨 Cores Hardcoded por Tipo

### 🔷 Hexadecimais (160 únicas)

| Cor | Ocorrências | Principais Arquivos |
|-----|-------------|-------------------|
| `#007BFF` | 100 | documentStatusUtils.ts, documentStatusUtils.ts, documentStatusUtils.ts |
| `#ccc` | 51 | shared.module.css, datepicker-custom.css, NovoDocumentoPage.module.css |
| `#374151` | 47 | tokens.ts, design-tokens.css, DocumentosPage.module.css |
| `#dee2e6` | 47 | shared.module.css, shared.module.css, shared.module.css |
| `#6b7280` | 44 | tokens.ts, design-tokens.css, DocumentosPage.module.css |
| `#f8f9fa` | 43 | shared.module.css, shared.module.css, shared.module.css |
| `#e5e7eb` | 40 | tokens.ts, design-tokens.css, DocumentosPage.module.css |
| `#e2e8f0` | 40 | shared.module.css, NovoDocumentoPage.module.css, NovoDocumentoPage.module.css |
| `#6C757D` | 33 | statusUtils.ts, statusUtils.ts, documentStatusUtils.ts |
| `#e6f3ff` | 33 | datepicker-custom.css, datepicker-custom.css, datepicker-custom.css |
| `#3b82f6` | 32 | design-tokens.css, design-tokens.css, DetalheDemandaPage.module.css |
| `#f3f4f6` | 32 | design-tokens.css, DocumentosPage.module.css, DetalheDocumentoPage.module.css |
| `#495057` | 28 | shared.module.css, shared.module.css, NovoDocumentoPage.module.css |
| `#d1d5db` | 28 | design-tokens.css, DocumentosPage.module.css, DocumentosPage.module.css |
| `#1e293b` | 26 | TextArea.tsx, TextArea.tsx, Table.tsx |
| `#64748b` | 25 | shared.module.css, Table.tsx, StickyYearFilter.module.css |
| `#f8fafc` | 23 | Table.tsx, Table.tsx, Table.tsx |
| `#f9fafb` | 22 | design-tokens.css, DetalheDemandaPage.module.css, LoginForm.module.css |
| `#ef4444` | 21 | design-tokens.css, DetalheDemandaPage.module.css, TextArea.tsx |
| `#ffffff` | 19 | design-tokens.css, NovoDocumentoPage.module.css, NovoDocumentoPage.module.css |

### 📛 Named Colors (11 únicas)

| Cor | Ocorrências | Principais Arquivos |
|-----|-------------|-------------------|
| `white` | 137 | shared.module.css, shared.module.css, shared.module.css |
| `transparent` | 79 | datepicker-custom.css, datepicker-custom.css, datepicker-custom.css |
| `inherit` | 16 | shared.module.css, shared.module.css, datepicker-custom.css |
| `initial` | 9 | main.tsx, StoreProvider.tsx, StoreProvider.tsx |
| `azure` | 5 | ssoAdapter.ts, externalAuthAdapter.ts, externalAuthAdapter.ts |
| `currentColor` | 5 | Toast.module.css, MobileForm.module.css, LoginForm.module.css |
| `unset` | 4 | Toast.module.css, Toast.module.css, Modal.module.css |
| `black` | 3 | base.css, MobileForm.module.css, AppLayout.module.css |
| `red` | 2 | browserSecurity.ts, browserSecurity.ts |
| `purple` | 1 | design-tokens.css |
| `orange` | 1 | browserSecurity.ts |

### 🟦 RGB/RGBA (60 únicas)

| Cor | Ocorrências | Principais Arquivos |
|-----|-------------|-------------------|
| `rgba(0, 0, 0, 0.1)` | 54 | shared.module.css, shared.module.css, shared.module.css |
| `rgba(0, 0, 0, 0.05)` | 23 | design-tokens.css, design-tokens.css, DetalheDocumentoPage.module.css |
| `rgba(0, 123, 255, 0.25)` | 21 | shared.module.css, NovoDocumentoPage.module.css, NovoDocumentoPage.module.css |
| `rgba(0, 123, 255, 0.1)` | 16 | NovoDocumentoPage.module.css, NovoDocumentoPage.module.css, DocumentosPage.module.css |
| `rgba(0, 0, 0, 0.15)` | 13 | datepicker-custom.css, DocumentosPage.module.css, DetalheDocumentoPage.module.css |
| `rgba(0, 0, 0, 0.5)` | 10 | responsive.css, design-tokens.css, design-tokens.css |
| `rgba(0, 0, 0, 0.08)` | 9 | DetalheDocumentoPage.module.css, DetalheDocumentoPage.module.css, DetalheDocumentoPage.module.css |
| `rgba(59, 130, 246, 0.1)` | 7 | DetalheDemandaPage.module.css, MobileForm.module.css, StatCard.module.css |
| `rgba(255, 255, 255, 0.9)` | 4 | DetalheDocumentoPage.module.css, DetalheDocumentoPage.module.css, DetalheDemandaPage.module.css |
| `rgba(255, 255, 255, 0.2)` | 4 | Toast.module.css, Toast.module.css, StatCard.module.css |
| `rgba(0, 0, 0, 0.04)` | 4 | Modal.module.css, SavedFiltersPanel.module.css, NotificationCenter.module.css |
| `rgba(0, 0, 0, 0.03)` | 4 | QuickManagement.module.css, QuickManagement.module.css, HomePage.module.css |
| `rgba(0, 0, 0, 0.4)` | 3 | design-tokens.css, design-tokens.css, design-tokens.css |
| `rgb(59 130 246 / 0.1)` | 3 | base.css, RegrasPage.module.css, RegrasPage.module.css |
| `rgba(0, 123, 255, 0.2)` | 3 | DetalheDocumentoPage.module.css, DetalheDocumentoPage.module.css, DetalheDocumentoPage.module.css |
| `rgba(255, 255, 255, 0.8)` | 3 | Toast.module.css, KeyboardShortcutsHelper.module.css, KeyboardShortcutsHelper.module.css |
| `rgba(255, 255, 255, 0.5)` | 3 | StickyYearFilter.module.css, Skeleton.module.css, StatCard.module.css |
| `rgba(239, 68, 68, 0.1)` | 3 | MobileForm.module.css, LoginForm.module.css, StatCard.module.css |
| `rgb(0 0 0 / 0.1)` | 2 | tokens.ts, tokens.ts |
| `rgba(0, 0, 0, 0.06)` | 2 | design-tokens.css, StatCard.module.css |



---

## 📁 Análise por Arquivo

### Top 10 arquivos com mais cores

| Arquivo | Total | Hardcoded | Design Tokens |
|---------|--------|-----------|---------------|
| design-tokens.css | 354 | 85 | 269 |
| DetalheDocumentoPage.module.css | 226 | 201 | 25 |
| StatCard.module.css | 136 | 104 | 32 |
| NovoDocumentoPage.module.css | 127 | 101 | 26 |
| DetalheDemandaPage.module.css | 125 | 107 | 18 |
| DataTable.module.css | 120 | 42 | 78 |
| NovaDemandaPage.module.css | 118 | 29 | 89 |
| RegrasPage.module.css | 103 | 10 | 93 |
| MobileForm.module.css | 99 | 14 | 85 |
| responsive.css | 91 | 3 | 88 |


---

## 💡 Recomendações

### ✅ Pontos Positivos
- Design tokens implementados no arquivo `design-tokens.css`
- Suporte a tema escuro configurado
- Uso de CSS custom properties

### ⚠️ Oportunidades de Melhoria
- Migrar cores hardcoded para design tokens
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

Total: 282 arquivos

### Padrões incluídos:
- `src/**/*.{ts,tsx,js,jsx,css,module.css,scss}`

### Exclusões:
- `*.test.*` - Arquivos de teste
- `*.stories.*` - Arquivos do Storybook  
- `src/shared/components/charts/**/*` - Arquivos de gráficos ECharts
- `src/shared/utils/chartTooltipConfig.ts` - Configurações de tooltip
- `src/pages/dashboard/styles/ChartContainer.module.css` - Estilos de container
- `node_modules/**/*` - Dependências

---

*Relatório gerado automaticamente pelo Color Analyzer*  
*Para atualizar, execute: `node scripts/color-analyzer.js`*
