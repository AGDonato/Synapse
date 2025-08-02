# Estrutura do Projeto

```text
├── .claude
│   └── settings.local.json
├── .gitignore
├── .husky
│   ├── _
│   │   ├── .gitignore
│   │   ├── applypatch-msg
│   │   ├── commit-msg
│   │   ├── h
│   │   ├── husky.sh
│   │   ├── post-applypatch
│   │   ├── post-checkout
│   │   ├── post-commit
│   │   ├── post-merge
│   │   ├── post-rewrite
│   │   ├── pre-applypatch
│   │   ├── pre-auto-gc
│   │   ├── pre-commit
│   │   ├── pre-merge-commit
│   │   ├── pre-push
│   │   ├── pre-rebase
│   │   └── prepare-commit-msg
│   └── pre-commit
├── .prettierignore
├── .prettierrc
├── CLAUDE.md
├── coverage
│   ├── base.css
│   ├── block-navigation.js
│   ├── coverage-final.json
│   ├── favicon.png
│   ├── index.html
│   ├── prettify.css
│   ├── prettify.js
│   ├── scripts
│   │   ├── export-tree.cjs.html
│   │   └── index.html
│   ├── sort-arrow-sprite.png
│   ├── sorter.js
│   └── src
│       ├── App.tsx.html
│       ├── components
│       │   ├── forms
│       │   │   ├── index.html
│       │   │   └── SearchableSelect.tsx.html
│       │   ├── layout
│       │   │   ├── CadastroPageLayout.tsx.html
│       │   │   ├── Header.tsx.html
│       │   │   ├── index.html
│       │   │   └── Sidebar.tsx.html
│       │   ├── pages
│       │   │   ├── index.html
│       │   │   └── SimpleCrudPage.tsx.html
│       │   └── ui
│       │       ├── Button.tsx.html
│       │       ├── ErrorBoundary.tsx.html
│       │       ├── ErrorFallback.tsx.html
│       │       ├── Form.tsx.html
│       │       ├── index.html
│       │       ├── Input.tsx.html
│       │       ├── Loading.tsx.html
│       │       ├── StatusBadge.tsx.html
│       │       ├── Table.tsx.html
│       │       └── TextArea.tsx.html
│       ├── constants
│       │   ├── index.html
│       │   ├── index.ts.html
│       │   ├── messages.ts.html
│       │   └── routes.ts.html
│       ├── contexts
│       │   ├── DemandasContext.ts.html
│       │   ├── DemandasContext.tsx.html
│       │   └── index.html
│       ├── data
│       │   ├── index.html
│       │   ├── mockAssuntos.ts.html
│       │   ├── mockAutoridades.ts.html
│       │   ├── mockDemandas.ts.html
│       │   ├── mockDistribuidores.ts.html
│       │   ├── mockOrgaos.ts.html
│       │   ├── mockProvedores.ts.html
│       │   ├── mockRegrasAssuntoDocumento.ts.html
│       │   ├── mockRegrasAutoridades.ts.html
│       │   ├── mockRegrasOrgaos.ts.html
│       │   ├── mockTiposDemandas.ts.html
│       │   ├── mockTiposDocumentos.ts.html
│       │   ├── mockTiposIdentificadores.ts.html
│       │   └── mockTiposMidias.ts.html
│       ├── hooks
│       │   ├── index.html
│       │   ├── index.ts.html
│       │   ├── useAssuntos.ts.html
│       │   ├── useCrud.ts.html
│       │   ├── useDebounce.ts.html
│       │   ├── useDemandas.ts.html
│       │   ├── useErrorHandler.ts.html
│       │   ├── useFormValidation.ts.html
│       │   ├── useOrgaos.ts.html
│       │   ├── useService.ts.html
│       │   ├── useValidatedCrud.ts.html
│       │   └── useVirtualization.ts.html
│       ├── index.html
│       ├── main.tsx.html
│       ├── pages
│       │   ├── cadastros
│       │   │   ├── AssuntosCadastroPage.tsx.html
│       │   │   ├── AutoridadesCadastroPage.tsx.html
│       │   │   ├── DistribuidoresCadastroPage.tsx.html
│       │   │   ├── index.html
│       │   │   ├── OrgaosCadastroPage.tsx.html
│       │   │   ├── ProvedoresCadastroPage.tsx.html
│       │   │   ├── TiposDemandasCadastroPage.tsx.html
│       │   │   ├── TiposDocumentosCadastroPage.tsx.html
│       │   │   ├── TiposIdentificadoresCadastroPage.tsx.html
│       │   │   └── TiposMidiasCadastroPage.tsx.html
│       │   ├── CadastrosPage.tsx.html
│       │   ├── configuracoes
│       │   │   ├── index.html
│       │   │   ├── RegrasPage.tsx.html
│       │   │   └── SistemaPage.tsx.html
│       │   ├── DemandasPage.tsx.html
│       │   ├── DetalheDemandaPage.tsx.html
│       │   ├── DocumentosPage.tsx.html
│       │   ├── HomePage.tsx.html
│       │   ├── index.html
│       │   ├── NovaDemandaPage.tsx.html
│       │   ├── NovoDocumentoPage.tsx.html
│       │   └── RelatoriosPage.tsx.html
│       ├── repositories
│       │   ├── AssuntosRepository.ts.html
│       │   ├── BaseRepository.ts.html
│       │   ├── index.html
│       │   ├── index.ts.html
│       │   └── OrgaosRepository.ts.html
│       ├── schemas
│       │   ├── entities.ts.html
│       │   └── index.html
│       ├── services
│       │   ├── AssuntosService.ts.html
│       │   ├── BaseService.ts.html
│       │   ├── index.html
│       │   ├── index.ts.html
│       │   └── OrgaosService.ts.html
│       ├── styles
│       │   ├── index.html
│       │   └── theme.ts.html
│       ├── types
│       │   ├── api.ts.html
│       │   ├── entities.ts.html
│       │   ├── index.html
│       │   ├── index.ts.html
│       │   └── ui.ts.html
│       └── utils
│           ├── formatters.ts.html
│           ├── helpers.ts.html
│           ├── index.html
│           ├── index.ts.html
│           └── validators.ts.html
├── dist
│   ├── assets
│   │   ├── AutoridadesCadastroPage-VapLHnAa.js
│   │   ├── CadastrosPage-FMvDy_W4.js
│   │   ├── DemandasPage-agoxPcWL.css
│   │   ├── DemandasPage-CtEIxD6o.js
│   │   ├── DetalheDemandaPage-Ca7B_JdE.js
│   │   ├── DistribuidoresCadastroPage-IQfWmRVT.js
│   │   ├── DocumentosPage-BrIhiD_X.js
│   │   ├── feature-cadastros-CEmBECYZ.js
│   │   ├── feature-services-BPONWG7d.js
│   │   ├── HomePage-DsmutQ4v.js
│   │   ├── index-Dtn62Xmo.css
│   │   ├── index-DXdbC-Eb.js
│   │   ├── mockAutoridades-BfJSmQRs.js
│   │   ├── mockDistribuidores-6JvcdKWX.js
│   │   ├── mockRegrasOrgaos-SmTFSD9k.js
│   │   ├── NovaDemandaPage-CsAZKq4W.js
│   │   ├── NovoDocumentoPage-DRZIb67Z.js
│   │   ├── ProvedoresCadastroPage-BWpFk4Tp.js
│   │   ├── RegrasPage-BdEGggfJ.js
│   │   ├── RelatoriosPage-BuHlQnvg.js
│   │   ├── SistemaPage-BnOBX1tu.js
│   │   ├── StatusBadge-CKRkj5bs.js
│   │   ├── TiposMidiasCadastroPage-gDkgzwD9.js
│   │   ├── useDemandas-OJADZNUE.js
│   │   ├── vendor-react-gH-7aFTg.js
│   │   ├── vendor-router-DRpn3MA5.js
│   │   └── vendor-validation-CwtAdh3w.js
│   ├── index.html
│   └── vite.svg
├── eslint.config.js
├── estrutura.md
├── index.html
├── package-lock.json
├── package.json
├── public
│   └── vite.svg
├── README.md
├── scripts
│   └── export-tree.cjs
├── src
│   ├── App.css
│   ├── App.tsx
│   ├── assets
│   │   └── react.svg
│   ├── components
│   │   ├── forms
│   │   │   └── SearchableSelect.tsx
│   │   ├── layout
│   │   │   ├── CadastroPageLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── pages
│   │   │   └── SimpleCrudPage.tsx
│   │   └── ui
│   │       ├── Button.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── ErrorFallback.tsx
│   │       ├── Form.tsx
│   │       ├── Input.tsx
│   │       ├── Loading.tsx
│   │       ├── StatusBadge.tsx
│   │       ├── Table.tsx
│   │       └── TextArea.tsx
│   ├── constants
│   │   ├── index.ts
│   │   ├── messages.ts
│   │   └── routes.ts
│   ├── contexts
│   │   ├── DemandasContext.ts
│   │   └── DemandasContext.tsx
│   ├── data
│   │   ├── mockAssuntos.ts
│   │   ├── mockAutoridades.ts
│   │   ├── mockDemandas.ts
│   │   ├── mockDistribuidores.ts
│   │   ├── mockOrgaos.ts
│   │   ├── mockProvedores.ts
│   │   ├── mockRegrasAssuntoDocumento.ts
│   │   ├── mockRegrasAutoridades.ts
│   │   ├── mockRegrasOrgaos.ts
│   │   ├── mockTiposDemandas.ts
│   │   ├── mockTiposDocumentos.ts
│   │   ├── mockTiposIdentificadores.ts
│   │   └── mockTiposMidias.ts
│   ├── hooks
│   │   ├── index.ts
│   │   ├── useAssuntos.ts
│   │   ├── useCrud.ts
│   │   ├── useDebounce.ts
│   │   ├── useDemandas.ts
│   │   ├── useEntityCache.ts
│   │   ├── useErrorHandler.ts
│   │   ├── useFormValidation.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useOfflineSync.ts
│   │   ├── useOrgaos.ts
│   │   ├── useService.ts
│   │   ├── useUserPreferences.ts
│   │   ├── useValidatedCrud.ts
│   │   └── useVirtualization.ts
│   ├── index.css
│   ├── main.tsx
│   ├── pages
│   │   ├── cadastros
│   │   │   ├── AssuntosCadastroPage.tsx
│   │   │   ├── AutoridadesCadastroPage.tsx
│   │   │   ├── DistribuidoresCadastroPage.tsx
│   │   │   ├── OrgaosCadastroPage.tsx
│   │   │   ├── ProvedoresCadastroPage.tsx
│   │   │   ├── TiposDemandasCadastroPage.tsx
│   │   │   ├── TiposDocumentosCadastroPage.tsx
│   │   │   ├── TiposIdentificadoresCadastroPage.tsx
│   │   │   └── TiposMidiasCadastroPage.tsx
│   │   ├── CadastrosPage.tsx
│   │   ├── configuracoes
│   │   │   ├── RegrasPage.tsx
│   │   │   └── SistemaPage.tsx
│   │   ├── DemandasPage.tsx
│   │   ├── DetalheDemandaPage.tsx
│   │   ├── DocumentosPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── NovaDemandaPage.tsx
│   │   ├── NovoDocumentoPage.tsx
│   │   └── RelatoriosPage.tsx
│   ├── repositories
│   │   ├── AssuntosRepository.ts
│   │   ├── BaseRepository.ts
│   │   ├── index.ts
│   │   └── OrgaosRepository.ts
│   ├── schemas
│   │   └── entities.ts
│   ├── services
│   │   ├── AssuntosService.ts
│   │   ├── BaseService.ts
│   │   ├── index.ts
│   │   └── OrgaosService.ts
│   ├── styles
│   │   └── theme.ts
│   ├── test
│   │   ├── components
│   │   │   └── Button.test.tsx
│   │   ├── hooks
│   │   │   ├── useAssuntos.test.ts
│   │   │   └── useDebounce.test.ts
│   │   ├── services
│   │   │   └── AssuntosService.test.ts
│   │   ├── setup.ts
│   │   ├── utils
│   │   │   └── storage.test.ts
│   │   └── utils.tsx
│   ├── types
│   │   ├── api.ts
│   │   ├── entities.ts
│   │   ├── index.ts
│   │   └── ui.ts
│   ├── utils
│   │   ├── formatters.ts
│   │   ├── helpers.ts
│   │   ├── index.ts
│   │   ├── storage.ts
│   │   └── validators.ts
│   └── vite-env.d.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

```
