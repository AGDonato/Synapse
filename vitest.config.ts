/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/setup.ts',
        'src/test/test-utils.ts',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        '**/*.test.*',
        '**/*.spec.*',
        '**/test/**',
        '**/tests/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/workers/**',
        'public/**',
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 75,
          lines: 80,
          statements: 80,
        },
        // Specific file patterns
        'src/services/**': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/utils/**': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/hooks/**': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/components/ui/**': {
          branches: 70,
          functions: 75,
          lines: 75,
          statements: 75,
        },
      },
      reportsDirectory: './coverage',
      cleanOnRerun: true,
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/', 'dist/', '.next/', '.nuxt/', '.vercel/', '.output/'],
  },
});
