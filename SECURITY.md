# Configuração de Segurança - Synapse

## Content Security Policy (CSP)

O sistema Synapse implementa uma política de segurança de conteúdo robusta para prevenir ataques XSS e injeção de código.

### ⚠️ Configuração Importante para Produção

Algumas diretivas CSP **só funcionam via cabeçalhos HTTP** e devem ser configuradas no servidor web:

- `frame-ancestors` - Previne clickjacking
- `report-uri` / `report-to` - Relatórios de violação

### Configuração por Servidor

#### Apache (.htaccess ou VirtualHost)
```apache
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https: http://localhost:*; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://api.synapse.local https://*.analytics.com ws://localhost:* wss://*; media-src 'self' blob: data:; object-src 'none'; child-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; block-all-mixed-content"
```

#### Nginx
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https: http://localhost:*; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://api.synapse.local https://*.analytics.com ws://localhost:* wss://*; media-src 'self' blob: data:; object-src 'none'; child-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; block-all-mixed-content";
```

#### PHP (no backend)
```php
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https: http://localhost:*; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://api.synapse.local https://*.analytics.com ws://localhost:* wss://*; media-src 'self' blob: data:; object-src 'none'; child-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; block-all-mixed-content");
```

### Personalização

Para modificar as políticas CSP, edite o arquivo:
```
src/shared/services/security/csp.ts
```

### Sistema de Segurança Implementado

O Synapse possui um sistema abrangente de segurança localizado em `src/shared/services/security/`:

- **`csp.ts`** - Content Security Policy configurável
- **`auth.ts`** - Sistema de autenticação e autorização
- **`csrf.ts`** - Proteção contra ataques CSRF
- **`sanitization.ts`** - Sanitização de dados de entrada
- **`browserSecurity.ts`** - Configurações de segurança do navegador
- **`audit.ts`** - Sistema de auditoria e logs de segurança

### Verificação

Durante desenvolvimento, as instruções de configuração são exibidas no console do navegador para facilitar a configuração em produção.

## Outras Configurações de Segurança

### Cabeçalhos HTTP Recomendados

Além do CSP, configure estes cabeçalhos no servidor:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

### HTTPS

**Obrigatório em produção:** Configure SSL/TLS com certificado válido.

### Backup e Logs

- **Logs CSP**: Monitore violações através do sistema implementado em `src/shared/services/security/audit.ts`
- **Backups Automáticos**: Configure rotinas de backup para dados e configurações
- **Auditoria**: Sistema completo de logs para ações administrativas já implementado
- **Monitoramento**: Logs estruturados para análise de segurança e performance

### Documentação Técnica Complementar

Para informações detalhadas sobre implementação e configuração:

- **[Guia de Integração](./docs/INTEGRATION_GUIDE.md)** - Configuração de autenticação externa
- **[Status Atual](./docs/CURRENT_STATUS.md)** - Estado atual das funcionalidades de segurança
- **[Arquitetura](./CLAUDE.md)** - Visão técnica completa do sistema

## Progressive Web App (PWA)

### Meta Tags Atualizadas

A aplicação agora usa as meta tags PWA mais modernas:

```html
<!-- Meta tag moderna (padrão W3C) -->
<meta name="mobile-web-app-capable" content="yes" />

<!-- Meta tag apple-mobile-web-app-capable foi removida (depreciada) -->
<!-- A funcionalidade PWA em iOS funciona através do manifest.json -->
```

### Compatibilidade Multiplataforma

**iOS Safari:**
- `apple-mobile-web-app-title` e `apple-mobile-web-app-status-bar-style` para customização
- Funcionalidade PWA através do `manifest.json`
- Ícones otimizados para Touch Bar

**Android Chrome:**
- `mobile-web-app-capable` padrão moderno W3C
- Manifest.json completo com todas as configurações PWA

**Windows:**
- `browserconfig.xml` para tiles do Windows
- Configuração msapplication

### Instalação PWA

Os usuários podem instalar a aplicação como app nativo através de:
- **Chrome**: Botão "Instalar" na barra de endereços
- **iOS**: "Adicionar à tela inicial"
- **Windows**: "Instalar aplicativo"