import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/shared/components'),
      '@/hooks': resolve(__dirname, './src/shared/hooks'),
      '@/services': resolve(__dirname, './src/shared/services'),
      '@/utils': resolve(__dirname, './src/shared/utils'),
      '@/types': resolve(__dirname, './src/shared/types'),
      '@/data': resolve(__dirname, './src/shared/data'),
      '@/schemas': resolve(__dirname, './src/shared/schemas'),
      '@/stores': resolve(__dirname, './src/app/stores'),
      '@/test': resolve(__dirname, './src/test'),
      'size-sensor': resolve(__dirname, './src/shared/utils/sizeSensorPolyfill.ts'),
    },
  },
  // Enhanced dev server configuration
  server: {
    host: '0.0.0.0',
    port: 5175,
    hmr: {
      overlay: true,
    },
    // Force browser to always fetch fresh content
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
    // Pre-warm frequently requested files
    warmup: {
      clientFiles: [
        './src/app/main.tsx',
        './src/app/App.tsx',
        './src/shared/components/layout/**/*.tsx',
        './src/shared/hooks/**/*.ts',
      ],
    },
  },

  // Define configuration for problematic dependencies
  define: {
    // Help resolve fast-deep-equal import issues
    global: 'globalThis',
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'date-fns',
      'lucide-react',
      'fast-deep-equal', // Include to fix echarts-for-react import issue
    ],
    exclude: [
      'echarts', // Lazy load charts
      'echarts-for-react',
      '@vitest/ui',
    ],
    // Force pre-bundling of these packages
    force: true,
  },
  // Melhores configurações para tree-shaking
  build: {
    target: 'es2020',
    minify: 'terser',
    cssMinify: true,
    sourcemap: false,
    chunkSizeWarningLimit: 200, // Reduzido para 200KB
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log em produção
        drop_debugger: true,
        passes: 2, // Multiple passes para melhor minificação
      },
      format: {
        comments: false, // Remove comentários
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core vendor chunks - prioritize size and usage
          if (id.includes('node_modules')) {
            // React ecosystem - high priority, frequently used
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }

            // Routing - critical for navigation
            if (id.includes('react-router')) {
              return 'router';
            }

            // State management - critical for app state
            if (id.includes('zustand') || id.includes('@tanstack/react-query')) {
              return 'state';
            }

            // Charts - lazy loaded, separate chunk
            if (id.includes('echarts')) {
              return 'charts';
            }

            // UI libraries - medium priority
            if (
              id.includes('lucide-react') ||
              id.includes('react-icons') ||
              id.includes('framer-motion')
            ) {
              return 'ui-libs';
            }

            // Utilities - date, validation, etc
            if (id.includes('date-fns') || id.includes('zod') || id.includes('react-hook-form')) {
              return 'utilities';
            }

            // Everything else - smaller vendors
            return 'vendor';
          }

          // App code splitting - more strategic grouping
          if (id.includes('src/')) {
            // Core app infrastructure
            if (
              id.includes('src/shared/components/layout') ||
              id.includes('src/shared/components/ui') ||
              id.includes('src/shared/utils') ||
              id.includes('src/shared/hooks')
            ) {
              return 'app-core';
            }

            // Main dashboard and charts
            if (id.includes('src/pages/dashboard') || id.includes('src/shared/components/charts')) {
              return 'dashboard';
            }

            // Business logic modules
            if (id.includes('src/pages/demandas') || id.includes('src/shared/components/demands')) {
              return 'demandas';
            }

            if (
              id.includes('src/pages/documentos') ||
              id.includes('src/shared/components/documents')
            ) {
              return 'documentos';
            }

            // Admin features - less frequently used
            if (id.includes('src/pages/cadastros') || id.includes('src/pages/configuracoes')) {
              return 'admin';
            }

            // Mock data and services
            if (id.includes('src/shared/data') || id.includes('src/shared/services')) {
              return 'data-services';
            }
          }
        },
        // Otimização de nomes para melhor cache
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: assetInfo => {
          if (assetInfo.name) {
            const extType = assetInfo.name.split('.').pop();
            if (extType && /png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return `images/[name]-[hash][extname]`;
            }
            if (extType && /css/i.test(extType)) {
              return `css/[name]-[hash][extname]`;
            }
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
});
