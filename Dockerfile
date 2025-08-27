# Multi-stage Dockerfile para produção otimizada

# Estágio 1: Build
FROM node:18-alpine AS builder

LABEL maintainer="Synapse Team"
LABEL version="1.0"
LABEL description="Synapse - Sistema de Gestão de Demandas"

# Instalar dependências do sistema
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Instalar dependências (usar npm ci para builds determinísticos)
RUN npm ci --only=production --ignore-scripts

# Copiar código fonte
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build da aplicação
RUN npm run build

# Otimizar build
RUN npm run build:analyze || true

# Estágio 2: Servidor de produção
FROM nginx:alpine AS production

# Instalar utilitários
RUN apk add --no-cache \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copiar script de healthcheck
COPY docker/scripts/healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/healthcheck.sh

# Configurar usuário não-root para segurança
RUN addgroup -g 101 -S nginx-custom \
    && adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx-custom -g nginx-custom nginx-custom

# Ajustar permissões
RUN chown -R nginx-custom:nginx-custom /usr/share/nginx/html \
    && chown -R nginx-custom:nginx-custom /var/cache/nginx \
    && chown -R nginx-custom:nginx-custom /var/log/nginx \
    && chown -R nginx-custom:nginx-custom /etc/nginx/conf.d

# Criar diretório para PID
RUN mkdir -p /var/run/nginx && \
    chown -R nginx-custom:nginx-custom /var/run/nginx

# Usar usuário não-root
USER nginx-custom

# Expor porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Comando para iniciar servidor
CMD ["nginx", "-g", "daemon off;"]

# Estágio 3: Desenvolvimento
FROM node:18-alpine AS development

WORKDIR /app

# Instalar dependências globais para desenvolvimento
RUN npm install -g nodemon concurrently

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY vitest.config.ts ./
COPY playwright.config.ts ./

# Instalar todas as dependências (incluindo dev)
RUN npm ci

# Copiar código fonte
COPY . .

# Expor portas (Vite dev server + HMR)
EXPOSE 5173 24678

# Health check para desenvolvimento
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5173/ || exit 1

# Comando para desenvolvimento
CMD ["npm", "run", "dev"]

# Estágio 4: Testes
FROM development AS test

# Instalar browsers do Playwright
RUN npx playwright install --with-deps

# Executar testes
RUN npm run test:run
RUN npm run test:e2e || true

# Gerar relatórios de cobertura
RUN npm run test:coverage

# Labels para metadados
LABEL org.opencontainers.image.title="Synapse"
LABEL org.opencontainers.image.description="Sistema de Gestão de Demandas e Documentos"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="Synapse Team"
LABEL org.opencontainers.image.licenses="MIT"