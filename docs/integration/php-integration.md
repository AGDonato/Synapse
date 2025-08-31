# Documentação de Integração PHP - Sistema Synapse

## Visão Geral

O sistema Synapse foi completamente otimizado para integração com backend PHP, incluindo suporte para 4 usuários simultâneos, autenticação externa, colaboração em tempo real e monitoramento avançado.

## Arquitetura Implementada

### 1. Cliente API PHP Especializado
- **Localização**: `src/services/api/phpApiClient.ts`
- **Funcionalidades**:
  - Conversão automática snake_case ↔ camelCase
  - Rate limiting por usuário (4 usuários simultâneos)
  - Request deduplication e retry logic
  - Queue management com batch processing

### 2. Sistema de Autenticação
- **SSO Adapter**: `src/services/auth/ssoAdapter.ts`
- **PHP Session Bridge**: `src/services/auth/phpSessionBridge.ts`
- **Suporta**: LDAP, OAuth2, SAML, PHP sessions

### 3. Colaboração Multi-usuário
- **WebSocket real-time**: Até 4 usuários simultâneos
- **Smart Locking**: Bloqueios por campo/seção
- **Conflict Resolution**: Interface visual para resolução de conflitos

### 4. Monitoramento e Performance
- **PHP Integration Monitor**: Health checks automáticos
- **Dashboard visual**: Métricas em tempo real
- **Error tracking**: Logs centralizados

## Guia de Build para Produção

### Comando de Build
```bash
# Build otimizado para PHP
node scripts/build-php.js production

# Build para staging
node scripts/build-php.js staging
```

### Arquivos Gerados
- `public/dist/manifest.json` - Manifest do Vite
- `public/dist/ViteAssets.php` - Helper para carregar assets
- `public/dist/vite-config.php` - Configuração PHP
- `public/dist/assets-manifest.json` - Mapeamento de assets

## Integração Backend PHP

### 1. Incluindo o Helper PHP
```php
<?php
require_once 'public/dist/ViteAssets.php';
?>
```

### 2. Carregando Assets no HTML
```php
<!DOCTYPE html>
<html>
<head>
    <?= vite_tags() ?>
</head>
<body>
    <div id="root"></div>
</body>
</html>
```

### 3. Assets Específicos
```php
<img src="<?= vite_asset('logo.png') ?>" alt="Logo">
```

## API Endpoints Requeridos

### 1. Autenticação
```php
// POST /api/auth/login
// POST /api/auth/logout
// GET /api/auth/validate
// POST /api/auth/refresh
```

### 2. Colaboração
```php
// GET /api/collaboration/active-users
// POST /api/collaboration/lock-field
// DELETE /api/collaboration/release-lock
// WebSocket: /ws/collaboration
```

### 3. Monitoramento
```php
// GET /api/monitoring/health
// GET /api/monitoring/metrics
// GET /api/monitoring/alerts
```

### 4. CRUD Operações
```php
// Demandas
// GET /api/demandas
// POST /api/demandas
// PUT /api/demandas/{id}
// DELETE /api/demandas/{id}

// Documentos
// GET /api/documentos
// POST /api/documentos
// PUT /api/documentos/{id}
// DELETE /api/documentos/{id}

// Cadastros (Assuntos, Órgãos, etc.)
// GET /api/{resource}
// POST /api/{resource}
// PUT /api/{resource}/{id}
// DELETE /api/{resource}/{id}
```

## Estrutura de Dados PHP

### Conversões Automáticas
O sistema converte automaticamente entre formatos:

**React (camelCase) → PHP (snake_case)**:
```javascript
{
  tipoDocumento: 'oficio',
  dataVencimento: '2024-12-31'
}
```

**PHP (snake_case) → React (camelCase)**:
```php
[
  'tipo_documento' => 'oficio',
  'data_vencimento' => '2024-12-31'
]
```

### Exemplo de Resposta PHP
```php
<?php
// Resposta padrão esperada
$response = [
    'data' => $results,
    'meta' => [
        'total' => $total,
        'current_page' => $page,
        'per_page' => $limit,
        'has_more' => $hasMore
    ],
    'success' => true,
    'message' => 'Operação realizada com sucesso'
];

header('Content-Type: application/json');
echo json_encode($response);
?>
```

## Configuração do Servidor

### Variáveis de Ambiente PHP
```php
// .env.php
<?php
return [
    'APP_ENV' => 'production',
    'DATABASE_URL' => 'mysql://user:pass@localhost/synapse',
    'JWT_SECRET' => 'your-secret-key',
    'CORS_ORIGINS' => 'https://your-domain.com',
    'WEBSOCKET_PORT' => 8080,
    'MAX_CONCURRENT_USERS' => 4,
    'SESSION_TIMEOUT' => 3600, // 1 hora
    'LOCK_TIMEOUT' => 300 // 5 minutos
];
?>
```

### Headers CORS Necessários
```php
<?php
header('Access-Control-Allow-Origin: https://your-domain.com');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
?>
```

## Sistema de Sessões

### Integração com PHP Sessions
```php
<?php
session_start();

// Validação de sessão para o React
function validateSession() {
    return [
        'user_id' => $_SESSION['user_id'] ?? null,
        'username' => $_SESSION['username'] ?? null,
        'permissions' => $_SESSION['permissions'] ?? [],
        'expires_at' => $_SESSION['expires_at'] ?? null,
        'active' => isset($_SESSION['user_id'])
    ];
}

// Endpoint para validação
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $_SERVER['REQUEST_URI'] === '/api/auth/validate') {
    header('Content-Type: application/json');
    echo json_encode(validateSession());
}
?>
```

## WebSocket para Colaboração

### Servidor WebSocket PHP (usando Ratchet)
```php
<?php
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

class CollaborationServer implements MessageComponentInterface {
    private $clients;
    private $activeUsers = [];
    private $fieldLocks = [];
    
    public function __construct() {
        $this->clients = new \SplObjectStorage;
    }
    
    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
        
        switch ($data['type']) {
            case 'user_active':
                $this->handleUserActive($from, $data);
                break;
            case 'lock_field':
                $this->handleLockField($from, $data);
                break;
            case 'release_lock':
                $this->handleReleaseLock($from, $data);
                break;
        }
    }
}

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new CollaborationServer()
        )
    ),
    8080
);

$server->run();
?>
```

## Performance e Monitoramento

### Health Check Endpoint
```php
<?php
function checkSystemHealth() {
    $health = [
        'status' => 'healthy',
        'timestamp' => time(),
        'services' => [
            'database' => checkDatabase(),
            'session' => checkSession(),
            'websocket' => checkWebSocket(),
            'file_system' => checkFileSystem()
        ],
        'metrics' => [
            'active_users' => getActiveUsersCount(),
            'response_time' => getAverageResponseTime(),
            'error_rate' => getErrorRate(),
            'memory_usage' => memory_get_usage(true)
        ]
    ];
    
    return $health;
}

// GET /api/monitoring/health
if ($_SERVER['REQUEST_URI'] === '/api/monitoring/health') {
    header('Content-Type: application/json');
    echo json_encode(checkSystemHealth());
}
?>
```

## Segurança

### Validação de Requests
```php
<?php
function validateRequest($data, $rules) {
    $errors = [];
    
    foreach ($rules as $field => $rule) {
        if ($rule['required'] && !isset($data[$field])) {
            $errors[] = "Campo {$field} é obrigatório";
        }
        
        if (isset($data[$field]) && isset($rule['type'])) {
            if (!validateType($data[$field], $rule['type'])) {
                $errors[] = "Campo {$field} deve ser do tipo {$rule['type']}";
            }
        }
    }
    
    return $errors;
}

// Rate limiting por usuário
function checkRateLimit($userId) {
    $key = "rate_limit_{$userId}";
    $current = apcu_fetch($key) ?: 0;
    
    if ($current >= 60) { // 60 requests per minute
        return false;
    }
    
    apcu_store($key, $current + 1, 60);
    return true;
}
?>
```

## Deployment

### Estrutura de Arquivos
```
projeto-php/
├── public/
│   ├── dist/           # Assets do React (gerados pelo build)
│   │   ├── ViteAssets.php
│   │   ├── manifest.json
│   │   ├── js/
│   │   ├── css/
│   │   └── assets/
│   └── index.php       # Entry point
├── api/
│   ├── auth/
│   ├── collaboration/
│   ├── monitoring/
│   └── resources/
├── config/
├── includes/
└── logs/
```

### Apache/Nginx Configuration
```apache
# .htaccess para Apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ /api/index.php [QSA,L]
RewriteRule ^(?!dist).*$ /index.php [QSA,L]
```

## Troubleshooting

### Problemas Comuns

1. **Assets não carregam**
   - Verificar se `ViteAssets.php` foi gerado corretamente
   - Confirmar permissões de leitura na pasta `dist/`

2. **WebSocket não conecta**
   - Verificar se porta 8080 está disponível
   - Confirmar configuração de firewall

3. **Sessões não sincronizam**
   - Verificar headers CORS
   - Confirmar configuração de cookies SameSite

4. **Performance degradada**
   - Verificar logs de error em `logs/`
   - Monitorar métricas no dashboard
   - Ajustar rate limiting se necessário

## Próximos Passos

1. **Setup do ambiente PHP**
2. **Configuração do banco de dados**
3. **Implementação dos endpoints de API**
4. **Setup do WebSocket server**
5. **Testes de integração**
6. **Deploy em produção**

---

**Contato**: Para dúvidas sobre a integração, consulte o código fonte nos arquivos mencionados ou verifique os logs de monitoramento no dashboard.