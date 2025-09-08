# Guia de Integração de Autenticação Externa - Synapse

Este guia explica como integrar o Synapse com sistemas de autenticação externos, especificamente para backends PHP e outros provedores de autenticação empresarial.

## Visão Geral

O Synapse agora suporta múltiplos provedores de autenticação:
- **Backend PHP Customizado** (Laravel, Symfony, APIs customizadas)
- **LDAP/Active Directory**
- **OAuth2/OpenID Connect** (Google, Azure AD, etc.)
- **SAML**
- **Sistemas baseados em JWT**

O sistema suporta **4 usuários simultâneos** com recursos de colaboração em tempo real.

## Início Rápido (Backend PHP)

### 1. Configuração de Ambiente

Crie um arquivo `.env` ou configure variáveis de ambiente:

```bash
# Provedor de Autenticação
VITE_AUTH_PROVIDER=php

# Configuração do Backend PHP
VITE_PHP_BASE_URL=http://seu-servidor-backend.com
VITE_PHP_LOGIN_ENDPOINT=/api/auth/login
VITE_PHP_REFRESH_ENDPOINT=/api/auth/refresh
VITE_PHP_LOGOUT_ENDPOINT=/api/auth/logout
VITE_PHP_PROFILE_ENDPOINT=/api/auth/user
VITE_PHP_VERIFY_ENDPOINT=/api/auth/verify
VITE_PHP_TIMEOUT=15000

# Configuração de Sessão
VITE_AUTH_SESSION_TIMEOUT=28800  # 8 horas em segundos
VITE_AUTH_ENABLE_SSO=true
VITE_AUTH_REQUIRE_MFA=false

# Tipo de Organização (afeta mapeamento de permissões)
VITE_ORG_TYPE=government  # ou 'corporate', 'ldap'
```

### 2. Endpoints da API PHP Backend

Seu backend PHP precisa implementar estes endpoints:

#### POST `/api/auth/login`
```php
// Requisição
{
  "username": "usuario@empresa.com",
  "password": "senhausuario"
}

// Resposta de Sucesso (200)
{
  "success": true,
  "user": {
    "id": "123",
    "username": "usuario@empresa.com",
    "email": "usuario@empresa.com",
    "display_name": "João Silva",
    "first_name": "João",
    "last_name": "Silva",
    "department": "TI",
    "role": "analista",
    "permissions": ["demandas:read", "demandas:create", "documentos:read"],
    "groups": ["funcionarios", "analistas"],
    "is_active": true,
    "last_login_at": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_aqui",
  "expires_in": 28800
}

// Resposta de Erro (401)
{
  "success": false,
  "error": "Credenciais inválidas",
  "error_code": "INVALID_CREDENTIALS"
}
```

#### POST `/api/auth/refresh`
```php
// Requisição
{
  "refresh_token": "refresh_token_aqui"
}

// Resposta de Sucesso (200)
{
  "success": true,
  "token": "novo_access_token",
  "refresh_token": "novo_refresh_token", // opcional
  "expires_in": 28800
}
```

#### POST `/api/auth/logout`
```php
// Requisição
{
  "username": "usuario@empresa.com"
}

// Resposta (200)
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

#### GET `/api/auth/user`
```php
// Headers: Authorization: Bearer {token}

// Resposta (200)
{
  "success": true,
  "user": {
    // Mesmo objeto user do login
  }
}
```

#### POST `/api/auth/verify`
```php
// Headers: Authorization: Bearer {token}

// Resposta (200)
{
  "success": true,
  "valid": true,
  "user": {
    // Objeto do usuário
  }
}
```

### 3. Exemplo de Implementação Laravel

```php
<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Tenta email ou username
        $loginField = filter_var($request->username, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        
        $credentials = [
            $loginField => $request->username,
            'password' => $request->password,
            'is_active' => true, // Apenas usuários ativos
        ];

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'error' => 'Credenciais inválidas',
                'error_code' => 'INVALID_CREDENTIALS'
            ], 401);
        }

        $user = Auth::user();
        $user->update(['last_login_at' => Carbon::now()]);

        // Cria token (usando Laravel Sanctum ou JWT)
        $token = $user->createToken('synapse-access', ['*'], 
            Carbon::now()->addSeconds(config('auth.session_timeout', 28800))
        )->plainTextToken;
        
        $refreshToken = $user->createToken('synapse-refresh', ['refresh'], 
            Carbon::now()->addDays(30)
        )->plainTextToken;

        return response()->json([
            'success' => true,
            'user' => [
                'id' => (string) $user->id,
                'username' => $user->username ?? $user->email,
                'email' => $user->email,
                'display_name' => $user->name,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'department' => $user->department,
                'role' => $user->role,
                'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                'groups' => $user->getRoleNames()->toArray(),
                'is_active' => $user->is_active,
                'last_login_at' => $user->last_login_at?->toISOString(),
            ],
            'token' => $token,
            'refresh_token' => $refreshToken,
            'expires_in' => config('auth.session_timeout', 28800)
        ]);
    }

    public function refresh(Request $request)
    {
        $request->validate([
            'refresh_token' => 'required|string'
        ]);

        // Valida refresh token e emite novo access token
        // Implementação depende do seu sistema de tokens
        
        return response()->json([
            'success' => true,
            'token' => $newAccessToken,
            'expires_in' => config('auth.session_timeout', 28800)
        ]);
    }

    public function logout(Request $request)
    {
        $user = Auth::user();
        if ($user) {
            // Revoga todos os tokens
            $user->tokens()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout realizado com sucesso'
        ]);
    }

    public function user(Request $request)
    {
        $user = Auth::user();
        
        return response()->json([
            'success' => true,
            'user' => [
                // Mesmo formato do user do login
            ]
        ]);
    }

    public function verify(Request $request)
    {
        $user = Auth::user();
        
        return response()->json([
            'success' => true,
            'valid' => true,
            'user' => [
                // Mesmo formato do user do login
            ]
        ]);
    }
}
```

### 4. Configuração CORS

Certifique-se de que seu backend PHP permite CORS do frontend Synapse:

```php
// Laravel: config/cors.php
'paths' => ['api/*'],
'allowed_methods' => ['*'],
'allowed_origins' => [
    'http://localhost:5173', // Servidor de dev Vite
    'https://seu-dominio-synapse.com'
],
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

## Integração Frontend

### 1. Sistema Mock vs Produção

O frontend Synapse funciona em dois modos:

```typescript
// src/services/api/mockAdapter.ts
const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

if (USE_REAL_API) {
  // Usa API real do backend PHP
  return httpClient.post('/auth/login', { json: credentials });
} else {
  // Usa dados mock para desenvolvimento
  return mockLogin(credentials);
}
```

### 2. Configuração de Autenticação

```typescript
// src/services/auth/config.ts
export function createAuthConfig(): AuthProviderConfig | null {
  const provider = import.meta.env.VITE_AUTH_PROVIDER as string;
  
  switch (provider?.toLowerCase()) {
    case 'laravel':
    case 'php':
    case 'custom_php':
      return createLaravelConfig();
      
    case 'ldap':
    case 'active_directory':
      return createLDAPConfig();
      
    case 'oauth2':
    case 'oidc':
      return createOAuth2Config();
      
    case 'saml':
      return createSAMLConfig();
      
    default:
      return null; // Usar autenticação padrão/interna
  }
}
```

### 3. Cliente HTTP Consolidado

Após a consolidação das APIs, o sistema usa um único cliente HTTP:

```typescript
// src/services/api/client.ts
import { httpClient } from '../api';

// Exemplo de uso
const response = await httpClient.post('/auth/login', {
  json: {
    username: 'usuario@empresa.com',
    password: 'senha123'
  }
});

const data = await response.json();
```

## Configuração Avançada

### Integração LDAP/Active Directory

```bash
VITE_AUTH_PROVIDER=ldap
VITE_LDAP_URL=ldaps://seu-domain-controller.empresa.local:636
VITE_LDAP_BIND_DN=CN=conta-servico,OU=Contas Servico,DC=empresa,DC=local
VITE_LDAP_BIND_PASSWORD=senha-servico
VITE_LDAP_BASE_DN=OU=Usuarios,DC=empresa,DC=local
VITE_LDAP_SEARCH_FILTER=(sAMAccountName={username})
VITE_ORG_TYPE=ldap
```

### Integração OAuth2/Azure AD

```bash
VITE_AUTH_PROVIDER=oauth2
VITE_OAUTH2_CLIENT_ID=seu-azure-client-id
VITE_OAUTH2_CLIENT_SECRET=seu-azure-client-secret
VITE_OAUTH2_AUTH_URL=https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
VITE_OAUTH2_TOKEN_URL=https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
VITE_OAUTH2_USER_INFO_URL=https://graph.microsoft.com/v1.0/me
VITE_OAUTH2_REDIRECT_URI=https://seu-dominio-synapse.com/auth/callback
```

### Personalização de Mapeamento de Permissões

Você pode personalizar como funções/grupos do seu sistema externo mapeiam para permissões do Synapse:

```typescript
// Exemplo de mapeamento de permissões customizado
const mapeamentoPermissoesCustomizado = {
  demandas: {
    read: ['funcionario', 'analista', 'coordenador', 'diretor'],
    create: ['analista', 'coordenador', 'diretor'],
    update: ['analista', 'coordenador', 'diretor'],
    delete: ['coordenador', 'diretor'],
    approve: ['coordenador', 'diretor'],
  },
  documentos: {
    read: ['funcionario', 'analista', 'coordenador', 'diretor'],
    create: ['analista', 'coordenador', 'diretor'],
    update: ['analista', 'coordenador', 'diretor'],
    delete: ['coordenador', 'diretor'],
    sign: ['coordenador', 'diretor'],
  },
  // ... outros recursos
};
```

## Recursos de Colaboração Multi-Usuário

O sistema suporta colaboração em tempo real para 4 usuários simultâneos:

### Integração WebSocket (Opcional)

Para recursos em tempo real, seu backend pode implementar suporte WebSocket:

```php
// Exemplo usando Laravel WebSockets ou Pusher
public function broadcastUpdate($entityType, $entityId, $data, $userId)
{
    broadcast(new EntityUpdated($entityType, $entityId, $data, $userId))
        ->to("entity.{$entityType}.{$entityId}");
}
```

### Resolução de Conflitos

O sistema automaticamente trata conflitos quando múltiplos usuários editam a mesma entidade:

- **Resolução automática** para mudanças não conflitantes
- **UI de resolução manual** para edições conflitantes
- **Bloqueio de documento** para prevenir edições simultâneas
- **Indicadores de presença** mostrando quem está editando no momento

## Recursos de Segurança

### Proteção CSRF

O sistema inclui proteção automática CSRF. Seu backend PHP deve:

1. Fornecer tokens CSRF via `/api/csrf-token`
2. Validar tokens CSRF em requisições que alteram estado
3. Usar cookies seguros e HttpOnly para armazenamento de tokens

### Auditoria de Segurança

O sistema inclui auditoria de segurança abrangente:

- **290+ verificações automáticas de segurança**
- **Detecção de vulnerabilidades em tempo real**
- **Monitoramento de performance**
- **Rastreamento e relatório de erros**

## Testando Sua Integração

### 1. Testar Fluxo de Autenticação

```bash
# Testar login
curl -X POST http://seu-backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"usuarioteste","password":"senha"}'

# Testar validação de token
curl -X GET http://seu-backend/api/auth/user \
  -H "Authorization: Bearer seu-token"
```

### 2. Verificar Permissões

```bash
# Testar permissões de usuário no Synapse
# Usuário deve ver/acessar apenas recursos para os quais tem permissões
```

### 3. Testar Cenários Multi-Usuário

- Fazer login com 4 usuários diferentes simultaneamente
- Testar edição concorrente de documentos/demandas
- Verificar atualizações em tempo real e resolução de conflitos

## Troubleshooting

### Problemas Comuns

1. **Erros CORS**: Verifique a configuração CORS do seu backend
2. **Expiração de Token**: Certifique-se que refresh tokens estão implementados corretamente
3. **Permissão Negada**: Verifique mapeamento de funções/permissões do usuário
4. **Timeout de Conexão**: Aumente valores de timeout se necessário

### Modo Debug

Habilite logging de debug definindo:

```bash
VITE_DEBUG_AUTH=true
```

Isso fornecerá logging detalhado do fluxo de autenticação no console do navegador.

### Monitoramento de Saúde

O sistema inclui monitoramento de saúde integrado que rastreia:
- Taxas de sucesso de autenticação
- Falhas de refresh de token  
- Falhas de verificação de permissão
- Problemas de conexão com backend

Monitore essas métricas no dashboard administrativo.

## Migração de Sistemas Existentes

### De Autenticação Interna

1. Exportar dados de usuário do sistema atual
2. Configurar autenticação externa
3. Testar com um subconjunto de usuários
4. Migrar gradualmente

### Mapeamento de Dados de Usuário

Mapeie os campos de usuário existentes para o formato esperado pelo Synapse:

```php
// Exemplo de mapeamento do seu sistema para formato Synapse
$usuarioSynapse = [
    'id' => $seuUsuario->user_id,
    'username' => $seuUsuario->login,
    'email' => $seuUsuario->email_address,
    'display_name' => $seuUsuario->full_name,
    'department' => $seuUsuario->dept_name,
    'role' => $seuUsuario->user_role,
    'permissions' => $seuUsuario->permissions->pluck('name'),
    'groups' => $seuUsuario->groups->pluck('name'),
];
```

## Suporte

Para suporte de integração:
1. Verifique o console do navegador para mensagens de erro detalhadas
2. Verifique se as respostas da API do seu backend correspondem ao formato esperado
3. Teste endpoints individuais com ferramentas como Postman
4. Revise o dashboard de auditoria de segurança para problemas

O sistema é projetado para estar pronto para produção com segurança de nível empresarial, monitoramento de performance e recursos de colaboração multi-usuário especificamente para o cenário de equipe de 4 pessoas descrito.

## Referências de Schema

Para facilitar a implementação do backend, consulte os schemas Zod atualizados em:
- `src/services/api/schemas.ts` - Definições completas de tipos e validações
- `src/services/api/endpoints.ts` - Mapeamento de endpoints com comentários explicativos

Todos os schemas incluem comentários em português explicando estruturas de dados esperadas pelo frontend.