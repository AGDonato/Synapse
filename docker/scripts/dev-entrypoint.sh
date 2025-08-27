#!/bin/bash

# Script de inicialização para ambiente de desenvolvimento

set -e

echo "🚀 Iniciando ambiente de desenvolvimento Synapse..."

# Verificar se node_modules existe, se não, instalar dependências
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm ci
fi

# Verificar se há atualizações de dependências
echo "🔍 Verificando atualizações..."
npm outdated || true

# Executar health check dos serviços dependentes
echo "🏥 Verificando serviços..."

# Aguardar Redis se estiver configurado
if [ ! -z "$REDIS_URL" ]; then
    echo "⏳ Aguardando Redis..."
    until nc -z redis 6379; do
        echo "Redis não está pronto - aguardando..."
        sleep 1
    done
    echo "✅ Redis está pronto!"
fi

# Aguardar backend PHP se estiver configurado
if [ ! -z "$VITE_API_BASE_URL" ]; then
    echo "⏳ Aguardando backend..."
    until curl -f ${VITE_API_BASE_URL}/health; do
        echo "Backend não está pronto - aguardando..."
        sleep 2
    done
    echo "✅ Backend está pronto!"
fi

# Limpar cache se solicitado
if [ "$CLEAR_CACHE" = "true" ]; then
    echo "🧹 Limpando cache..."
    rm -rf node_modules/.vite/
    rm -rf .vite/
fi

# Executar testes se solicitado
if [ "$RUN_TESTS" = "true" ]; then
    echo "🧪 Executando testes..."
    npm run test:run
fi

# Configurar hot reload otimizado
echo "🔥 Configurando hot reload..."
export VITE_HMR_PORT=24678

# Mostrar informações úteis
echo "📋 Informações do ambiente:"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - Porta do app: 5173"
echo "  - Porta HMR: 24678"
echo "  - Modo: desenvolvimento"

echo "✨ Ambiente pronto! Executando comando: $@"

# Executar comando passado como argumento
exec "$@"