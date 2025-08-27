import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config([
  // Global ignores
  {
    ignores: [
      'dist/**/*',
      'node_modules/**/*',
      'coverage/**/*',
      '.vite/**/*',
      'bundle-analysis.html',
      'src/assets/**/*',
      'src/test/**/*',
      '**/*.svg',
      '**/*.png',
      '**/*.jpg',
      '**/*.jpeg',
      '*.config.{js,ts}',
      'playwright.config.ts',
      'vite.config.*.ts',
      'vitest.config.ts',
      '**/*.d.ts',
    ],
  },
  
  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      prettier, // Must be last to override other configs
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.app.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript-specific rules - reasonable enforcement
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': ['warn', { checksVoidReturn: false }],
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/consistent-type-exports': 'off',
      '@typescript-eslint/no-import-type-side-effects': 'off',
      
      // React-specific rules - essential only
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      
      // General code quality rules - essential for good practices
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-return-assign': 'off',
      'no-sequences': 'off',
      'no-throw-literal': 'off',
      'no-void': 'off',
      'no-with': 'error',
      'no-case-declarations': 'off',
      'no-empty': 'off',
      'no-useless-escape': 'off',
      'no-prototype-builtins': 'off',
      'prefer-const': 'warn',
      'prefer-template': 'off',
      'eqeqeq': 'off',
      'curly': 'off',
      
      // Complexity rules - reasonable limits for this project
      'complexity': ['warn', 20],
      'max-depth': ['warn', 5], 
      'max-lines': ['warn', 800],
      'max-lines-per-function': ['warn', 200],
      'max-nested-callbacks': ['warn', 6],
      'max-params': ['warn', 8],
      
      // Import/export rules - basic organization
      'no-duplicate-imports': 'warn',
      'sort-imports': 'off',
      
      // Security rules - essential security checks
      'no-new-wrappers': 'error',
      'no-constructor-return': 'error',
    },
  },
]);
