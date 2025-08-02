/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-validation': ['zod'],
          
          // Feature chunks
          'feature-cadastros': [
            './src/pages/cadastros/AssuntosCadastroPage.tsx',
            './src/pages/cadastros/OrgaosCadastroPage.tsx',
            './src/pages/cadastros/TiposDocumentosCadastroPage.tsx',
            './src/pages/cadastros/TiposDemandasCadastroPage.tsx',
            './src/pages/cadastros/TiposIdentificadoresCadastroPage.tsx'
          ],
          'feature-services': [
            './src/services/index.ts',
            './src/repositories/index.ts'
          ]
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zod']
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/'
      ]
    }
  }
});
