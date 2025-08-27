/**
 * Vite Configuration for PHP Integration
 * Configuração otimizada para deployment com backend PHP
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// Plugin customizado para integração PHP
const phpIntegrationPlugin = () => {
  return {
    name: 'php-integration',
    generateBundle(options: any, bundle: any) {
      // Gerar arquivo de mapeamento de assets para PHP
      const assetsMap: Record<string, string> = {};
      
      Object.keys(bundle).forEach(fileName => {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk' && chunk.isEntry) {
          assetsMap[chunk.name || 'main'] = fileName;
        }
        if (chunk.type === 'asset' && chunk.name) {
          assetsMap[chunk.name] = fileName;
        }
      });

      // Criar arquivo de manifest para PHP
      this.emitFile({
        type: 'asset',
        fileName: 'assets-manifest.json',
        source: JSON.stringify({
          assets: assetsMap,
          buildTime: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0'
        }, null, 2)
      });

      // Criar arquivo de configuração para PHP
      const phpConfig = `<?php
// Auto-generated Vite assets configuration
return [
    'assets' => ${JSON.stringify(assetsMap, null, 4).replace(/"/g, "'")},
    'build_time' => '${new Date().toISOString()}',
    'version' => '${process.env.npm_package_version || '1.0.0'}',
    'base_url' => '${options.base || '/'}',
    'assets_dir' => '${options.assetsDir || 'assets'}',
];
`;
      
      this.emitFile({
        type: 'asset',
        fileName: 'vite-config.php',
        source: phpConfig
      });
    }
  };
};

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  const isPhpMode = process.env.VITE_PHP_MODE === 'true';

  return {
    plugins: [
      react({
        // Otimizações específicas para produção PHP
        babel: isProduction && isPhpMode ? {
          plugins: [
            // Remover console.logs em produção
            ['transform-remove-console', { exclude: ['error', 'warn'] }],
            // Otimizar imports
            ['babel-plugin-import', {
              libraryName: 'lucide-react',
              libraryDirectory: 'icons',
              camel2DashComponentName: false
            }],
          ]
        } : undefined
      }),

      // Plugin de integração PHP
      phpIntegrationPlugin(),

      // Analisador de bundle (apenas em produção)
      isProduction && visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),

    // Configuração de build otimizada para PHP
    build: {
      target: 'es2018', // Compatibilidade com navegadores mais antigos
      outDir: isPhpMode ? 'public/dist' : 'dist',
      assetsDir: 'assets',
      
      // Configurações específicas para PHP
      ...(isPhpMode && {
        base: '/dist/',
        publicDir: false, // PHP gerencia arquivos públicos
        emptyOutDir: true,
        
        // Manifesto para PHP
        manifest: true,
        
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'index.html'),
            // Chunks separados para diferentes páginas se necessário
            // admin: resolve(__dirname, 'admin.html'),
          },
          
          output: {
            // Nomes consistentes para o PHP
            entryFileNames: 'js/[name].[hash].js',
            chunkFileNames: 'js/[name].[hash].js',
            assetFileNames: (assetInfo) => {
              const extType = assetInfo.name?.split('.').pop();
              
              // Organizar assets por tipo
              if (/png|jpe?g|gif|svg|webp|ico/.test(extType || '')) {
                return 'images/[name].[hash][extname]';
              }
              if (/woff2?|ttf|eot/.test(extType || '')) {
                return 'fonts/[name].[hash][extname]';
              }
              if (extType === 'css') {
                return 'css/[name].[hash][extname]';
              }
              
              return 'assets/[name].[hash][extname]';
            },
            
            // Code splitting otimizado
            manualChunks: {
              // Vendor chunks
              'vendor-react': ['react', 'react-dom'],
              'vendor-icons': ['lucide-react'],
              'vendor-utils': ['date-fns', 'clsx'],
              
              // Feature chunks
              'charts': ['echarts'],
              'collaboration': [
                './src/services/collaboration/websocket',
                './src/services/collaboration/smartLocking'
              ],
              'php-integration': [
                './src/services/api/phpApiClient',
                './src/services/auth/phpSessionBridge',
                './src/services/monitoring/phpIntegrationMonitor'
              ]
            }
          }
        }
      }),
      
      // Otimizações gerais
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: isPhpMode, // Remover console apenas no modo PHP
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug', 'console.info']
        },
        mangle: {
          safari10: true
        }
      } : undefined,
      
      // Source maps apenas em desenvolvimento
      sourcemap: !isProduction || command === 'serve',
      
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      
      // Compressão
      cssCodeSplit: true,
      
      // Worker scripts
      worker: {
        format: 'es'
      }
    },

    // Configurações de desenvolvimento
    server: {
      port: 5173,
      host: true, // Permitir acesso externo
      cors: true,
      
      // Proxy para API PHP durante desenvolvimento
      proxy: isPhpMode ? {
        '/api': {
          target: process.env.VITE_PHP_DEV_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            // Adicionar headers customizados
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setHeader('X-Forwarded-Proto', 'http');
              proxyReq.setHeader('X-Forwarded-Host', req.headers.host || '');
            });
          }
        },
        '/auth': {
          target: process.env.VITE_PHP_DEV_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false
        },
        '/ws': {
          target: process.env.VITE_WS_DEV_URL || 'ws://localhost:8080',
          ws: true,
          changeOrigin: true
        }
      } : undefined,
      
      // Headers de segurança em desenvolvimento
      headers: isPhpMode ? {
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      } : undefined
    },

    // Preview (para testar build)
    preview: {
      port: 4173,
      host: true,
      cors: true,
      headers: {
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff'
      }
    },

    // Otimizações de dependências
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'lucide-react',
        'date-fns',
        'clsx'
      ],
      exclude: [
        // Excluir dependências que devem ser carregadas dinamicamente
      ]
    },

    // Resolve aliases
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@services': resolve(__dirname, './src/services'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@utils': resolve(__dirname, './src/utils'),
        '@types': resolve(__dirname, './src/types'),
        '@styles': resolve(__dirname, './src/styles')
      }
    },

    // Configurações de CSS
    css: {
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: isProduction 
          ? '[hash:base64:8]'
          : '[name]__[local]___[hash:base64:5]'
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@styles/variables.scss";`
        }
      },
      postcss: {
        plugins: [
          // Auto-prefixing
          require('autoprefixer'),
          
          // CSS optimization para produção
          ...(isProduction && isPhpMode ? [
            require('cssnano')({
              preset: 'default'
            })
          ] : [])
        ]
      }
    },

    // Configurações de ambiente
    define: {
      __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __PHP_MODE__: JSON.stringify(isPhpMode),
    },

    // Variables de ambiente
    envPrefix: ['VITE_', 'APP_'],

    // Configuração de logger
    logLevel: isProduction ? 'info' : 'warn',

    // Configurações experimentais
    experimental: {
      renderBuiltUrl(filename: string, { hostType }: { hostType: 'js' | 'css' | 'html' }) {
        // URLs customizadas para ambiente PHP
        if (isPhpMode && hostType === 'js') {
          return `<?php echo asset('dist/${filename}'); ?>`;
        }
        return filename;
      }
    }
  };
});