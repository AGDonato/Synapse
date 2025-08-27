#!/bin/sh

# Health check script para container de produção

set -e

# URL base da aplicação
BASE_URL="${BASE_URL:-http://localhost:8080}"

# Função para verificar endpoint
check_endpoint() {
    local endpoint="$1"
    local expected_status="${2:-200}"
    
    echo "Verificando: $BASE_URL$endpoint"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo "✅ $endpoint: OK ($response)"
        return 0
    else
        echo "❌ $endpoint: FAIL ($response, esperado $expected_status)"
        return 1
    fi
}

echo "🏥 Executando health check..."

# Verificar página principal
check_endpoint "/" || exit 1

# Verificar arquivos estáticos críticos
check_endpoint "/assets/index.js" 404 || true  # Pode não existir com hash
check_endpoint "/favicon.ico" || exit 1

# Verificar se nginx está servindo arquivos corretamente
if ! curl -s "$BASE_URL" | grep -q "Synapse"; then
    echo "❌ Conteúdo da aplicação não encontrado"
    exit 1
fi

echo "✅ Health check passou!"
exit 0