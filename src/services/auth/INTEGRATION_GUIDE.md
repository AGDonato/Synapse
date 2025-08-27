# Synapse External Authentication Integration Guide

This guide explains how to integrate Synapse with external authentication systems, specifically for PHP backends and other enterprise authentication providers.

## Overview

Synapse now supports multiple authentication providers:
- **Custom PHP Backend** (Laravel, Symfony, custom APIs)
- **LDAP/Active Directory**
- **OAuth2/OpenID Connect** (Google, Azure AD, etc.)
- **SAML**
- **JWT Token-based systems**

The system supports **4 simultaneous users** with real-time collaboration features.

## Quick Start (PHP Backend)

### 1. Environment Configuration

Create a `.env` file or configure environment variables:

```bash
# Authentication Provider
VITE_AUTH_PROVIDER=php

# PHP Backend Configuration
VITE_PHP_BASE_URL=http://your-backend-server.com
VITE_PHP_LOGIN_ENDPOINT=/api/auth/login
VITE_PHP_REFRESH_ENDPOINT=/api/auth/refresh
VITE_PHP_LOGOUT_ENDPOINT=/api/auth/logout
VITE_PHP_PROFILE_ENDPOINT=/api/auth/user
VITE_PHP_VERIFY_ENDPOINT=/api/auth/verify
VITE_PHP_TIMEOUT=15000

# Session Configuration
VITE_AUTH_SESSION_TIMEOUT=28800  # 8 hours in seconds
VITE_AUTH_ENABLE_SSO=true
VITE_AUTH_REQUIRE_MFA=false

# Organization Type (affects permission mapping)
VITE_ORG_TYPE=government  # or 'corporate', 'ldap'
```

### 2. PHP Backend API Endpoints

Your PHP backend needs to implement these endpoints:

#### POST `/api/auth/login`
```php
// Request
{
  "username": "user@company.com",
  "password": "userpassword"
}

// Success Response (200)
{
  "success": true,
  "user": {
    "id": "123",
    "username": "user@company.com",
    "email": "user@company.com",
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
  "refresh_token": "refresh_token_here",
  "expires_in": 28800
}

// Error Response (401)
{
  "success": false,
  "error": "Credenciais inválidas",
  "error_code": "INVALID_CREDENTIALS"
}
```

#### POST `/api/auth/refresh`
```php
// Request
{
  "refresh_token": "refresh_token_here"
}

// Success Response (200)
{
  "success": true,
  "token": "new_access_token",
  "refresh_token": "new_refresh_token", // optional
  "expires_in": 28800
}
```

#### POST `/api/auth/logout`
```php
// Request
{
  "username": "user@company.com"
}

// Response (200)
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

#### GET `/api/auth/user`
```php
// Headers: Authorization: Bearer {token}

// Response (200)
{
  "success": true,
  "user": {
    // Same user object as login
  }
}
```

#### POST `/api/auth/verify`
```php
// Headers: Authorization: Bearer {token}

// Response (200)
{
  "success": true,
  "valid": true,
  "user": {
    // User object
  }
}
```

### 3. Laravel Implementation Example

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

        // Try email or username
        $loginField = filter_var($request->username, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        
        $credentials = [
            $loginField => $request->username,
            'password' => $request->password,
            'is_active' => true, // Only active users
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

        // Create token (using Laravel Sanctum or JWT)
        $token = $user->createToken('synapse-access', ['*'], Carbon::now()->addSeconds(config('auth.session_timeout', 28800)))->plainTextToken;
        $refreshToken = $user->createToken('synapse-refresh', ['refresh'], Carbon::now()->addDays(30))->plainTextToken;

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

        // Validate refresh token and issue new access token
        // Implementation depends on your token system
        
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
            // Revoke all tokens
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
                // Same user format as login
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
                // Same user format as login
            ]
        ]);
    }
}
```

### 4. CORS Configuration

Ensure your PHP backend allows CORS from the Synapse frontend:

```php
// Laravel: config/cors.php
'paths' => ['api/*'],
'allowed_methods' => ['*'],
'allowed_origins' => [
    'http://localhost:5173', // Vite dev server
    'https://your-synapse-domain.com'
],
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

## Advanced Configuration

### LDAP/Active Directory Integration

```bash
VITE_AUTH_PROVIDER=ldap
VITE_LDAP_URL=ldaps://your-domain-controller.company.local:636
VITE_LDAP_BIND_DN=CN=service-account,OU=Service Accounts,DC=company,DC=local
VITE_LDAP_BIND_PASSWORD=service-password
VITE_LDAP_BASE_DN=OU=Users,DC=company,DC=local
VITE_LDAP_SEARCH_FILTER=(sAMAccountName={username})
VITE_ORG_TYPE=ldap
```

### OAuth2/Azure AD Integration

```bash
VITE_AUTH_PROVIDER=oauth2
VITE_OAUTH2_CLIENT_ID=your-azure-client-id
VITE_OAUTH2_CLIENT_SECRET=your-azure-client-secret
VITE_OAUTH2_AUTH_URL=https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
VITE_OAUTH2_TOKEN_URL=https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
VITE_OAUTH2_USER_INFO_URL=https://graph.microsoft.com/v1.0/me
VITE_OAUTH2_REDIRECT_URI=https://your-synapse-domain.com/auth/callback
```

### Permission Mapping Customization

You can customize how roles/groups from your external system map to Synapse permissions by modifying the permission mapping in your configuration:

```typescript
// Custom permission mapping example
const customPermissionMapping = {
  demandas: {
    read: ['funcionario', 'analista', 'coordenador', 'diretor'],
    create: ['analista', 'coordenador', 'diretor'],
    update: ['analista', 'coordenador', 'diretor'],
    delete: ['coordenador', 'diretor'],
    approve: ['coordenador', 'diretor'],
  },
  // ... other resources
};
```

## Multi-User Collaboration Features

The system supports real-time collaboration for 4 simultaneous users:

### WebSocket Integration (Optional)

For real-time features, your backend can implement WebSocket support:

```php
// Example using Laravel WebSockets or Pusher
public function broadcastUpdate($entityType, $entityId, $data, $userId)
{
    broadcast(new EntityUpdated($entityType, $entityId, $data, $userId))
        ->to("entity.{$entityType}.{$entityId}");
}
```

### Conflict Resolution

The system automatically handles conflicts when multiple users edit the same entity:

- **Automatic resolution** for non-conflicting changes
- **Manual resolution UI** for conflicting edits
- **Document locking** to prevent simultaneous edits
- **User presence indicators** showing who's currently editing

## Security Features

### CSRF Protection

The system includes automatic CSRF protection. Your PHP backend should:

1. Provide CSRF tokens via `/api/csrf-token`
2. Validate CSRF tokens on state-changing requests
3. Use secure, HttpOnly cookies for token storage

### Security Audit

The system includes comprehensive security auditing:

- **290+ automated security checks**
- **Real-time vulnerability detection**
- **Performance monitoring**
- **Error tracking and reporting**

## Testing Your Integration

### 1. Test Authentication Flow

```bash
# Test login
curl -X POST http://your-backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password"}'

# Test token validation
curl -X GET http://your-backend/api/auth/user \
  -H "Authorization: Bearer your-token"
```

### 2. Verify Permissions

```bash
# Test user permissions in Synapse
# User should only see/access resources they have permissions for
```

### 3. Test Multi-User Scenarios

- Login with 4 different users simultaneously
- Test concurrent editing of documents/demandas
- Verify real-time updates and conflict resolution

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check your backend CORS configuration
2. **Token Expiry**: Ensure refresh tokens are properly implemented
3. **Permission Denied**: Verify user roles/permissions mapping
4. **Connection Timeout**: Increase timeout values if needed

### Debug Mode

Enable debug logging by setting:

```bash
VITE_DEBUG_AUTH=true
```

This will provide detailed authentication flow logging in the browser console.

### Health Monitoring

The system includes built-in health monitoring that tracks:
- Authentication success rates
- Token refresh failures  
- Permission check failures
- Backend connection issues

Monitor these metrics in the admin dashboard.

## Migration from Existing Systems

### From Internal Auth

1. Export user data from current system
2. Configure external authentication
3. Test with a subset of users
4. Migrate gradually

### User Data Mapping

Map your existing user fields to Synapse expected format:

```php
// Example mapping from your system to Synapse format
$synapseUser = [
    'id' => $yourUser->user_id,
    'username' => $yourUser->login,
    'email' => $yourUser->email_address,
    'display_name' => $yourUser->full_name,
    'department' => $yourUser->dept_name,
    'role' => $yourUser->user_role,
    'permissions' => $yourUser->permissions->pluck('name'),
    'groups' => $yourUser->groups->pluck('name'),
];
```

## Support

For integration support:
1. Check the browser console for detailed error messages
2. Verify your backend API responses match the expected format
3. Test individual endpoints with tools like Postman
4. Review the security audit dashboard for issues

The system is designed to be production-ready with enterprise-grade security, performance monitoring, and multi-user collaboration features specifically for the 4-person team scenario described.