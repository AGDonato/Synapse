<?php
/**
 * Exemplo de Endpoint API - Demandas
 * 
 * Este arquivo demonstra como implementar os endpoints de API
 * seguindo os padrões esperados pelo cliente React.
 */

require_once 'php-config-example.php';

// Roteamento básico
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Extrair partes da URL
$pathParts = explode('/', trim($requestUri, '/'));

// Exemplo: /api/demandas -> ['api', 'demandas']
if (count($pathParts) >= 2 && $pathParts[0] === 'api') {
    $resource = $pathParts[1];
    $id = $pathParts[2] ?? null;
    
    switch ($resource) {
        case 'demandas':
            handleDemandasAPI($requestMethod, $id);
            break;
        case 'auth':
            handleAuthAPI($requestMethod, $pathParts[2] ?? null);
            break;
        case 'collaboration':
            handleCollaborationAPI($requestMethod, $pathParts[2] ?? null);
            break;
        case 'monitoring':
            handleMonitoringAPI($requestMethod, $pathParts[2] ?? null);
            break;
        default:
            jsonResponse(null, false, 'Endpoint não encontrado', 404);
    }
}

/**
 * Handle Demandas API
 */
function handleDemandasAPI($method, $id) {
    // Verificar autenticação
    $user = authenticateRequest();
    if (!$user) {
        jsonResponse(null, false, 'Não autorizado', 401);
    }
    
    // Rate limiting
    if (!checkRateLimit($user['user_id'], 'demandas')) {
        jsonResponse(null, false, 'Limite de requisições excedido', 429);
    }
    
    $pdo = getDatabaseConnection();
    
    switch ($method) {
        case 'GET':
            if ($id) {
                getDemanda($pdo, $id, $user);
            } else {
                getDemandasList($pdo, $user);
            }
            break;
            
        case 'POST':
            createDemanda($pdo, $user);
            break;
            
        case 'PUT':
            if (!$id) {
                jsonResponse(null, false, 'ID é obrigatório para atualização', 400);
            }
            updateDemanda($pdo, $id, $user);
            break;
            
        case 'DELETE':
            if (!$id) {
                jsonResponse(null, false, 'ID é obrigatório para exclusão', 400);
            }
            deleteDemanda($pdo, $id, $user);
            break;
            
        default:
            jsonResponse(null, false, 'Método não permitido', 405);
    }
}

/**
 * Listar Demandas
 */
function getDemandasList($pdo, $user) {
    $page = (int)($_GET['page'] ?? 1);
    $limit = min((int)($_GET['limit'] ?? 20), 100); // Max 100 por página
    $offset = ($page - 1) * $limit;
    
    // Filtros opcionais
    $filters = [
        'status' => $_GET['status'] ?? null,
        'tipo_demanda_id' => $_GET['tipo_demanda_id'] ?? null,
        'orgao_id' => $_GET['orgao_id'] ?? null,
        'search' => $_GET['search'] ?? null
    ];
    
    // Construir query
    $whereConditions = [];
    $params = [];
    
    if ($filters['status']) {
        $whereConditions[] = 'd.status = :status';
        $params['status'] = $filters['status'];
    }
    
    if ($filters['tipo_demanda_id']) {
        $whereConditions[] = 'd.tipo_demanda_id = :tipo_demanda_id';
        $params['tipo_demanda_id'] = $filters['tipo_demanda_id'];
    }
    
    if ($filters['orgao_id']) {
        $whereConditions[] = 'd.orgao_id = :orgao_id';
        $params['orgao_id'] = $filters['orgao_id'];
    }
    
    if ($filters['search']) {
        $whereConditions[] = '(d.numero LIKE :search OR d.assunto LIKE :search OR d.descricao LIKE :search)';
        $params['search'] = '%' . $filters['search'] . '%';
    }
    
    $whereClause = $whereConditions ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    // Query principal
    $sql = "
        SELECT 
            d.*,
            td.nome as tipo_demanda_nome,
            o.nome as orgao_nome,
            u.nome_completo as responsavel_nome
        FROM demandas d
        LEFT JOIN tipos_demandas td ON d.tipo_demanda_id = td.id
        LEFT JOIN orgaos o ON d.orgao_id = o.id
        LEFT JOIN usuarios u ON d.responsavel_id = u.id
        $whereClause
        ORDER BY d.criado_em DESC
        LIMIT :limit OFFSET :offset
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->execute();
    $demandas = $stmt->fetchAll();
    
    // Count total
    $countSql = "SELECT COUNT(*) FROM demandas d $whereClause";
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $total = $countStmt->fetchColumn();
    
    // Log da operação
    writeLog('info', 'Lista de demandas solicitada', [
        'user_id' => $user['user_id'],
        'page' => $page,
        'limit' => $limit,
        'total_found' => count($demandas)
    ]);
    
    jsonResponse([
        'items' => $demandas,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $limit,
            'total' => (int)$total,
            'total_pages' => ceil($total / $limit),
            'has_more' => ($offset + $limit) < $total
        ]
    ]);
}

/**
 * Obter Demanda específica
 */
function getDemanda($pdo, $id, $user) {
    $sql = "
        SELECT 
            d.*,
            td.nome as tipo_demanda_nome,
            o.nome as orgao_nome,
            u.nome_completo as responsavel_nome
        FROM demandas d
        LEFT JOIN tipos_demandas td ON d.tipo_demanda_id = td.id
        LEFT JOIN orgaos o ON d.orgao_id = o.id
        LEFT JOIN usuarios u ON d.responsavel_id = u.id
        WHERE d.id = :id
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue('id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    $demanda = $stmt->fetch();
    
    if (!$demanda) {
        jsonResponse(null, false, 'Demanda não encontrada', 404);
    }
    
    writeLog('info', 'Demanda visualizada', [
        'user_id' => $user['user_id'],
        'demanda_id' => $id
    ]);
    
    jsonResponse($demanda);
}

/**
 * Criar nova Demanda
 */
function createDemanda($pdo, $user) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        jsonResponse(null, false, 'Dados inválidos', 400);
    }
    
    // Converter camelCase para snake_case
    $data = toSnakeCase($input);
    
    // Validação
    $rules = [
        'numero' => ['required' => true, 'type' => 'string'],
        'tipo_demanda_id' => ['required' => true, 'type' => 'int'],
        'orgao_id' => ['required' => true, 'type' => 'int'],
        'assunto' => ['required' => true, 'type' => 'string'],
        'descricao' => ['required' => false, 'type' => 'string'],
        'data_vencimento' => ['required' => false, 'type' => 'date'],
        'prioridade' => ['required' => true, 'type' => 'string']
    ];
    
    $validatedData = validateInput($data, $rules);
    
    // Verificar duplicação de número
    $checkSql = "SELECT id FROM demandas WHERE numero = :numero";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->bindValue('numero', $validatedData['numero']);
    $checkStmt->execute();
    
    if ($checkStmt->fetch()) {
        jsonResponse(null, false, 'Número de demanda já existe', 409);
    }
    
    // Inserir
    $sql = "
        INSERT INTO demandas (
            numero, tipo_demanda_id, orgao_id, assunto, descricao, 
            data_vencimento, prioridade, status, responsavel_id, criado_em
        ) VALUES (
            :numero, :tipo_demanda_id, :orgao_id, :assunto, :descricao,
            :data_vencimento, :prioridade, 'aberta', :responsavel_id, NOW()
        )
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue('numero', $validatedData['numero']);
    $stmt->bindValue('tipo_demanda_id', $validatedData['tipo_demanda_id']);
    $stmt->bindValue('orgao_id', $validatedData['orgao_id']);
    $stmt->bindValue('assunto', $validatedData['assunto']);
    $stmt->bindValue('descricao', $validatedData['descricao']);
    $stmt->bindValue('data_vencimento', $validatedData['data_vencimento']);
    $stmt->bindValue('prioridade', $validatedData['prioridade']);
    $stmt->bindValue('responsavel_id', $user['user_id']);
    
    if (!$stmt->execute()) {
        writeLog('error', 'Erro ao criar demanda', [
            'user_id' => $user['user_id'],
            'error' => $stmt->errorInfo()
        ]);
        jsonResponse(null, false, 'Erro ao criar demanda', 500);
    }
    
    $newId = $pdo->lastInsertId();
    
    writeLog('info', 'Nova demanda criada', [
        'user_id' => $user['user_id'],
        'demanda_id' => $newId,
        'numero' => $validatedData['numero']
    ]);
    
    jsonResponse(['id' => $newId], true, 'Demanda criada com sucesso');
}

/**
 * Handle Auth API
 */
function handleAuthAPI($method, $action) {
    switch ($action) {
        case 'validate':
            validateSessionEndpoint();
            break;
        case 'login':
            if ($method === 'POST') {
                loginEndpoint();
            } else {
                jsonResponse(null, false, 'Método não permitido', 405);
            }
            break;
        case 'logout':
            if ($method === 'POST') {
                logoutEndpoint();
            } else {
                jsonResponse(null, false, 'Método não permitido', 405);
            }
            break;
        default:
            jsonResponse(null, false, 'Endpoint de autenticação não encontrado', 404);
    }
}

/**
 * Validar sessão atual
 */
function validateSessionEndpoint() {
    session_start();
    
    $sessionData = [
        'user_id' => $_SESSION['user_id'] ?? null,
        'username' => $_SESSION['username'] ?? null,
        'nome_completo' => $_SESSION['nome_completo'] ?? null,
        'permissions' => $_SESSION['permissions'] ?? [],
        'expires_at' => $_SESSION['expires_at'] ?? null,
        'active' => isset($_SESSION['user_id']) && ($_SESSION['expires_at'] ?? 0) > time()
    ];
    
    jsonResponse($sessionData);
}

/**
 * Login endpoint
 */
function loginEndpoint() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['username']) || !isset($input['password'])) {
        jsonResponse(null, false, 'Username e password são obrigatórios', 400);
    }
    
    $pdo = getDatabaseConnection();
    
    // Buscar usuário (exemplo - adapte para seu sistema)
    $sql = "SELECT id, username, password_hash, nome_completo, ativo FROM usuarios WHERE username = :username";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue('username', $input['username']);
    $stmt->execute();
    
    $user = $stmt->fetch();
    
    if (!$user || !$user['ativo'] || !password_verify($input['password'], $user['password_hash'])) {
        writeLog('warning', 'Tentativa de login inválida', [
            'username' => $input['username'],
            'ip' => $_SERVER['REMOTE_ADDR']
        ]);
        jsonResponse(null, false, 'Credenciais inválidas', 401);
    }
    
    // Iniciar sessão
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['nome_completo'] = $user['nome_completo'];
    $_SESSION['permissions'] = []; // Carregar permissões do usuário
    $_SESSION['expires_at'] = time() + SESSION_TIMEOUT;
    
    // Registrar sessão ativa
    $insertSession = "INSERT INTO sessoes_ativas (user_id, session_id, ip_address, user_agent) 
                      VALUES (:user_id, :session_id, :ip, :user_agent)
                      ON DUPLICATE KEY UPDATE ultimo_acesso = NOW()";
    $stmt = $pdo->prepare($insertSession);
    $stmt->execute([
        'user_id' => $user['id'],
        'session_id' => session_id(),
        'ip' => $_SERVER['REMOTE_ADDR'],
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
    ]);
    
    writeLog('info', 'Login realizado', [
        'user_id' => $user['id'],
        'username' => $user['username']
    ]);
    
    jsonResponse([
        'user_id' => $user['id'],
        'username' => $user['username'],
        'nome_completo' => $user['nome_completo'],
        'token' => generateJWT($user['id'], $user['username'])
    ], true, 'Login realizado com sucesso');
}

/**
 * Handle Collaboration API
 */
function handleCollaborationAPI($method, $action) {
    $user = authenticateRequest();
    if (!$user) {
        jsonResponse(null, false, 'Não autorizado', 401);
    }
    
    switch ($action) {
        case 'active-users':
            getActiveUsers($user);
            break;
        case 'lock-field':
            if ($method === 'POST') {
                lockField($user);
            } else {
                jsonResponse(null, false, 'Método não permitido', 405);
            }
            break;
        case 'release-lock':
            if ($method === 'DELETE') {
                releaseLock($user);
            } else {
                jsonResponse(null, false, 'Método não permitido', 405);
            }
            break;
        default:
            jsonResponse(null, false, 'Endpoint de colaboração não encontrado', 404);
    }
}

/**
 * Obter usuários ativos
 */
function getActiveUsers($user) {
    $pdo = getDatabaseConnection();
    
    $sql = "
        SELECT 
            u.id, u.username, u.nome_completo,
            sa.ultimo_acesso,
            TIMESTAMPDIFF(MINUTE, sa.ultimo_acesso, NOW()) as minutos_inativo
        FROM sessoes_ativas sa
        JOIN usuarios u ON sa.user_id = u.id
        WHERE sa.ultimo_acesso > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        ORDER BY sa.ultimo_acesso DESC
        LIMIT 10
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $activeUsers = $stmt->fetchAll();
    
    // Determinar status
    foreach ($activeUsers as &$activeUser) {
        $minutesInactive = $activeUser['minutos_inativo'];
        
        if ($minutesInactive <= 2) {
            $activeUser['status'] = 'ativo';
        } elseif ($minutesInactive <= 10) {
            $activeUser['status'] = 'ausente';
        } else {
            $activeUser['status'] = 'inativo';
        }
    }
    
    jsonResponse($activeUsers);
}

/**
 * Autenticar requisição
 */
function authenticateRequest() {
    session_start();
    
    // Verificar sessão PHP
    if (isset($_SESSION['user_id']) && ($_SESSION['expires_at'] ?? 0) > time()) {
        return [
            'user_id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'nome_completo' => $_SESSION['nome_completo']
        ];
    }
    
    // Verificar JWT token
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        $payload = validateJWT($token);
        
        if ($payload) {
            return [
                'user_id' => $payload['user_id'],
                'username' => $payload['username']
            ];
        }
    }
    
    return null;
}

/**
 * Handle Monitoring API
 */
function handleMonitoringAPI($method, $action) {
    switch ($action) {
        case 'health':
            getHealthStatus();
            break;
        case 'metrics':
            getMetrics();
            break;
        default:
            jsonResponse(null, false, 'Endpoint de monitoramento não encontrado', 404);
    }
}

/**
 * Health check endpoint
 */
function getHealthStatus() {
    $health = [
        'status' => 'healthy',
        'timestamp' => time(),
        'services' => [
            'database' => checkDatabaseHealth(),
            'sessions' => checkSessionHealth(),
            'file_system' => checkFileSystemHealth()
        ]
    ];
    
    // Determinar status geral
    $allHealthy = true;
    foreach ($health['services'] as $service) {
        if ($service['status'] !== 'healthy') {
            $allHealthy = false;
            break;
        }
    }
    
    $health['status'] = $allHealthy ? 'healthy' : 'degraded';
    
    jsonResponse($health);
}

function checkDatabaseHealth() {
    try {
        $pdo = getDatabaseConnection();
        $stmt = $pdo->query('SELECT 1');
        return [
            'status' => 'healthy',
            'response_time' => 0, // Implementar medição
            'last_check' => time()
        ];
    } catch (Exception $e) {
        return [
            'status' => 'unhealthy',
            'error' => $e->getMessage(),
            'last_check' => time()
        ];
    }
}

function checkSessionHealth() {
    try {
        $pdo = getDatabaseConnection();
        $stmt = $pdo->query('SELECT COUNT(*) FROM sessoes_ativas WHERE ultimo_acesso > DATE_SUB(NOW(), INTERVAL 15 MINUTE)');
        $activeUsers = $stmt->fetchColumn();
        
        return [
            'status' => 'healthy',
            'active_sessions' => (int)$activeUsers,
            'last_check' => time()
        ];
    } catch (Exception $e) {
        return [
            'status' => 'unhealthy',
            'error' => $e->getMessage(),
            'last_check' => time()
        ];
    }
}

function checkFileSystemHealth() {
    $uploadDir = UPLOAD_PATH;
    $logDir = LOG_PATH;
    
    $checks = [
        'upload_writable' => is_writable($uploadDir),
        'log_writable' => is_writable($logDir),
        'disk_space' => disk_free_space('.') > (100 * 1024 * 1024) // 100MB livre
    ];
    
    $allGood = !in_array(false, $checks, true);
    
    return [
        'status' => $allGood ? 'healthy' : 'degraded',
        'checks' => $checks,
        'last_check' => time()
    ];
}

?>