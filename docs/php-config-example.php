<?php
/**
 * Exemplo de Configuração PHP para Integração Synapse
 * 
 * Este arquivo serve como base para a configuração do backend PHP.
 * Copie e adapte conforme necessário para seu ambiente.
 */

// Configurações gerais
define('APP_ENV', 'production'); // ou 'development', 'staging'
define('MAX_CONCURRENT_USERS', 4);
define('SESSION_TIMEOUT', 3600); // 1 hora
define('LOCK_TIMEOUT', 300); // 5 minutos para field locks

// Configurações de banco de dados
define('DB_HOST', 'localhost');
define('DB_NAME', 'synapse_db');
define('DB_USER', 'synapse_user');
define('DB_PASS', 'sua_senha_aqui');
define('DB_CHARSET', 'utf8mb4');

// Configurações de autenticação
define('JWT_SECRET', 'sua_chave_secreta_jwt_aqui_muito_segura');
define('JWT_EXPIRATION', 3600); // 1 hora

// LDAP Configuration (se usar LDAP)
define('LDAP_HOST', 'ldap://seu-servidor-ldap.com');
define('LDAP_PORT', 389);
define('LDAP_BASE_DN', 'ou=users,dc=empresa,dc=com');
define('LDAP_ADMIN_DN', 'cn=admin,dc=empresa,dc=com');
define('LDAP_ADMIN_PASSWORD', 'senha_admin_ldap');

// OAuth2 Configuration (se usar OAuth2)
define('OAUTH2_CLIENT_ID', 'seu_client_id');
define('OAUTH2_CLIENT_SECRET', 'seu_client_secret');
define('OAUTH2_REDIRECT_URI', 'https://seu-dominio.com/auth/callback');

// WebSocket Configuration
define('WS_HOST', 'localhost');
define('WS_PORT', 8080);

// CORS Configuration
$corsOrigins = [
    'http://localhost:5173', // Desenvolvimento
    'https://seu-dominio.com' // Produção
];

// Rate Limiting
define('RATE_LIMIT_PER_MINUTE', 60);
define('RATE_LIMIT_PER_HOUR', 1000);

// File Upload
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('UPLOAD_PATH', __DIR__ . '/uploads/');

// Logging
define('LOG_PATH', __DIR__ . '/logs/');
define('LOG_LEVEL', 'info'); // debug, info, warning, error

// Cache (Redis se disponível)
define('REDIS_HOST', 'localhost');
define('REDIS_PORT', 6379);
define('REDIS_PREFIX', 'synapse:');

/**
 * Inicialização da configuração
 */
function initializeConfig() {
    // Configurar timezone
    date_default_timezone_set('America/Sao_Paulo');
    
    // Configurar session
    ini_set('session.gc_maxlifetime', SESSION_TIMEOUT);
    ini_set('session.cookie_lifetime', SESSION_TIMEOUT);
    
    // Configurar error reporting
    if (APP_ENV === 'development') {
        error_reporting(E_ALL);
        ini_set('display_errors', 1);
    } else {
        error_reporting(E_ERROR | E_WARNING);
        ini_set('display_errors', 0);
    }
    
    // Configurar CORS
    setupCORS();
}

/**
 * Configurar CORS headers
 */
function setupCORS() {
    global $corsOrigins;
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $corsOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400'); // Cache por 24h
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Conectar ao banco de dados
 */
function getDatabaseConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            error_log("Erro de conexão com banco: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Erro interno do servidor']);
            exit;
        }
    }
    
    return $pdo;
}

/**
 * Validar JWT Token
 */
function validateJWT($token) {
    // Implementar validação JWT
    // Esta é uma versão simplificada - use uma biblioteca como firebase/jwt
    try {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        
        $payload = json_decode(base64_decode($parts[1]), true);
        
        if (!$payload || $payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Gerar JWT Token
 */
function generateJWT($userId, $username) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $userId,
        'username' => $username,
        'iat' => time(),
        'exp' => time() + JWT_EXPIRATION
    ]);
    
    $headerEncoded = base64url_encode($header);
    $payloadEncoded = base64url_encode($payload);
    
    $signature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, JWT_SECRET, true);
    $signatureEncoded = base64url_encode($signature);
    
    return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
}

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Logging function
 */
function writeLog($level, $message, $context = []) {
    $logFile = LOG_PATH . 'synapse_' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    
    $logEntry = sprintf(
        "[%s] %s: %s %s\n",
        $timestamp,
        strtoupper($level),
        $message,
        $context ? json_encode($context) : ''
    );
    
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Rate limiting check
 */
function checkRateLimit($userId, $endpoint = 'general') {
    $key = "rate_limit_{$userId}_{$endpoint}";
    
    // Usar Redis se disponível, senão APCu
    if (extension_loaded('redis')) {
        $redis = new Redis();
        $redis->connect(REDIS_HOST, REDIS_PORT);
        
        $current = $redis->get($key) ?: 0;
        
        if ($current >= RATE_LIMIT_PER_MINUTE) {
            return false;
        }
        
        $redis->setex($key, 60, $current + 1);
        return true;
    }
    
    // Fallback para APCu
    $current = apcu_fetch($key) ?: 0;
    
    if ($current >= RATE_LIMIT_PER_MINUTE) {
        return false;
    }
    
    apcu_store($key, $current + 1, 60);
    return true;
}

/**
 * Conversão camelCase para snake_case
 */
function toSnakeCase($input) {
    if (is_array($input)) {
        $result = [];
        foreach ($input as $key => $value) {
            $newKey = strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $key));
            $result[$newKey] = is_array($value) ? toSnakeCase($value) : $value;
        }
        return $result;
    }
    return $input;
}

/**
 * Conversão snake_case para camelCase
 */
function toCamelCase($input) {
    if (is_array($input)) {
        $result = [];
        foreach ($input as $key => $value) {
            $newKey = lcfirst(str_replace('_', '', ucwords($key, '_')));
            $result[$newKey] = is_array($value) ? toCamelCase($value) : $value;
        }
        return $result;
    }
    return $input;
}

/**
 * Resposta JSON padronizada
 */
function jsonResponse($data, $success = true, $message = '', $httpCode = 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');
    
    $response = [
        'success' => $success,
        'data' => toCamelCase($data),
        'message' => $message,
        'timestamp' => time()
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Validar e sanitizar entrada
 */
function validateInput($data, $rules) {
    $errors = [];
    $sanitized = [];
    
    foreach ($rules as $field => $rule) {
        $value = $data[$field] ?? null;
        
        // Required check
        if ($rule['required'] && empty($value)) {
            $errors[] = "Campo {$field} é obrigatório";
            continue;
        }
        
        // Type validation
        if ($value !== null && isset($rule['type'])) {
            switch ($rule['type']) {
                case 'email':
                    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $errors[] = "Campo {$field} deve ser um email válido";
                    }
                    break;
                case 'int':
                    if (!filter_var($value, FILTER_VALIDATE_INT)) {
                        $errors[] = "Campo {$field} deve ser um número inteiro";
                    }
                    break;
                case 'date':
                    if (!strtotime($value)) {
                        $errors[] = "Campo {$field} deve ser uma data válida";
                    }
                    break;
            }
        }
        
        // Sanitização
        if (is_string($value)) {
            $sanitized[$field] = trim(htmlspecialchars($value, ENT_QUOTES, 'UTF-8'));
        } else {
            $sanitized[$field] = $value;
        }
    }
    
    if (!empty($errors)) {
        jsonResponse(null, false, implode(', ', $errors), 400);
    }
    
    return $sanitized;
}

// Inicializar configuração
initializeConfig();

/**
 * Estrutura de tabelas SQL de exemplo
 */
/*
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(200) NOT NULL,
    nome_completo VARCHAR(200) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE sessoes_ativas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id VARCHAR(128) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    ultimo_acesso TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id)
);

CREATE TABLE bloqueios_campos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    recurso_tipo VARCHAR(50) NOT NULL,
    recurso_id INT NOT NULL,
    campo_nome VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expira_em TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_lock (recurso_tipo, recurso_id, campo_nome)
);

CREATE TABLE logs_sistema (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    nivel VARCHAR(20) NOT NULL,
    mensagem TEXT NOT NULL,
    contexto JSON,
    endpoint VARCHAR(200),
    ip_address VARCHAR(45),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nivel (nivel),
    INDEX idx_user_id (user_id),
    INDEX idx_criado_em (criado_em)
);
*/

?>