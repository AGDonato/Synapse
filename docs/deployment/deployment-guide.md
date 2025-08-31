# Guia de Deployment - Sistema Synapse + PHP

Este guia fornece instruções detalhadas para implementar o sistema Synapse com backend PHP em ambiente de produção.

## Pré-requisitos

### Servidor Web
- Apache 2.4+ ou Nginx 1.18+
- PHP 8.0+ com extensões:
  - PDO e PDO_MySQL
  - JSON
  - OpenSSL
  - cURL
  - APCu (recomendado)
  - Redis (opcional, mas recomendado)

### Banco de Dados
- MySQL 8.0+ ou MariaDB 10.5+
- Recomendado: 2GB+ RAM dedicada ao banco

### Node.js (para build)
- Node.js 18+
- npm 8+

## Passos de Deployment

### 1. Preparação do Ambiente

```bash
# Clone o repositório
git clone <repo-url> synapse
cd synapse

# Instalar dependências Node.js
npm install

# Instalar dependências PHP (se usar Composer)
composer install --no-dev --optimize-autoloader
```

### 2. Configuração do Banco de Dados

```sql
-- Criar banco de dados
CREATE DATABASE synapse_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário
CREATE USER 'synapse_user'@'localhost' IDENTIFIED BY 'senha_forte_aqui';
GRANT ALL PRIVILEGES ON synapse_prod.* TO 'synapse_user'@'localhost';
FLUSH PRIVILEGES;

-- Criar tabelas (exemplo básico)
USE synapse_prod;

CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(200) NOT NULL,
    nome_completo VARCHAR(200) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_ativo (ativo)
);

CREATE TABLE sessoes_ativas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_id VARCHAR(128) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    ultimo_acesso TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_ultimo_acesso (ultimo_acesso)
);

CREATE TABLE demandas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(50) NOT NULL UNIQUE,
    tipo_demanda_id INT,
    orgao_id INT,
    assunto VARCHAR(500) NOT NULL,
    descricao TEXT,
    status ENUM('aberta', 'em_andamento', 'pendente', 'concluida', 'cancelada') DEFAULT 'aberta',
    prioridade ENUM('baixa', 'media', 'alta', 'urgente') DEFAULT 'media',
    data_vencimento DATE,
    responsavel_id INT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (responsavel_id) REFERENCES usuarios(id),
    INDEX idx_numero (numero),
    INDEX idx_status (status),
    INDEX idx_data_vencimento (data_vencimento),
    INDEX idx_responsavel (responsavel_id)
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
    UNIQUE KEY unique_lock (recurso_tipo, recurso_id, campo_nome),
    INDEX idx_expira_em (expira_em)
);

CREATE TABLE logs_sistema (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    nivel ENUM('debug', 'info', 'warning', 'error', 'critical') NOT NULL,
    mensagem TEXT NOT NULL,
    contexto JSON,
    endpoint VARCHAR(200),
    ip_address VARCHAR(45),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nivel (nivel),
    INDEX idx_user_id (user_id),
    INDEX idx_criado_em (criado_em),
    INDEX idx_endpoint (endpoint)
);

-- Inserir usuário admin padrão
INSERT INTO usuarios (username, password_hash, email, nome_completo) 
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@synapse.com', 'Administrador');
```

### 3. Build da Aplicação React

```bash
# Build otimizado para PHP
node scripts/build-php.js production

# Verificar se os arquivos foram gerados
ls -la public/dist/
```

### 4. Configuração do PHP

```bash
# Copiar arquivo de configuração
cp docs/php-config-example.php config/config.php

# Editar configurações (banco, JWT secret, etc.)
nano config/config.php

# Criar diretórios necessários
mkdir -p logs uploads backups
chmod 755 logs uploads backups
```

### 5. Configuração do Servidor Web

#### Apache (.htaccess)
```apache
RewriteEngine On

# Handle CORS preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# API routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/index.php [QSA,L]

# React routes (SPA)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !^/dist/
RewriteRule ^(.*)$ index.php [QSA,L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
</IfModule>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/synapse/public;
    index index.php index.html;

    # Security headers
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Handle CORS preflight
    location / {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '$http_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            return 200;
        }

        try_files $uri $uri/ /index.php?$query_string;
    }

    # API routes
    location /api/ {
        try_files $uri $uri/ /api/index.php?$query_string;
    }

    # PHP processing
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Static assets caching
    location ~* \.(css|js|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to sensitive files
    location ~ /\.(ht|env) {
        deny all;
    }
}
```

### 6. Setup do WebSocket (Opcional)

```bash
# Instalar Ratchet via Composer
composer require ratchet/pawl

# Criar script de WebSocket
cp docs/websocket-server.php websocket/server.php

# Criar serviço systemd
sudo nano /etc/systemd/system/synapse-websocket.service
```

```ini
[Unit]
Description=Synapse WebSocket Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/synapse
ExecStart=/usr/bin/php websocket/server.php
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
# Ativar serviço
sudo systemctl enable synapse-websocket
sudo systemctl start synapse-websocket
```

### 7. Setup de Monitoramento

```bash
# Criar cron job para limpeza
crontab -e

# Adicionar linhas:
# Limpar logs antigos (30 dias)
0 2 * * * find /var/www/synapse/logs -name "*.log" -mtime +30 -delete

# Limpar sessões expiradas
*/5 * * * * php /var/www/synapse/cleanup/clear-expired-sessions.php

# Limpar locks expirados
*/1 * * * * php /var/www/synapse/cleanup/clear-expired-locks.php

# Health check (a cada minuto)
* * * * * curl -s http://localhost/api/monitoring/health > /dev/null
```

### 8. SSL/TLS (Produção)

```bash
# Instalar Certbot (Let's Encrypt)
sudo apt install certbot python3-certbot-apache

# Obter certificado
sudo certbot --apache -d seu-dominio.com

# Auto-renovação
sudo crontab -e
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 9. Performance e Otimização

#### PHP-FPM Tuning
```ini
; /etc/php/8.1/fpm/pool.d/synapse.conf
[synapse]
user = www-data
group = www-data
listen = /run/php/php8.1-fpm-synapse.sock
listen.owner = www-data
listen.group = www-data

pm = dynamic
pm.max_children = 20
pm.start_servers = 4
pm.min_spare_servers = 2
pm.max_spare_servers = 8
pm.max_requests = 500

request_slowlog_timeout = 5s
slowlog = /var/log/php8.1-fpm-synapse-slow.log
```

#### MySQL Tuning
```ini
# /etc/mysql/mysql.conf.d/synapse.cnf
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
query_cache_type = 1
query_cache_size = 64M
max_connections = 100
```

#### Redis Setup (Recomendado)
```bash
# Instalar Redis
sudo apt install redis-server

# Configurar
sudo nano /etc/redis/redis.conf
# maxmemory 256mb
# maxmemory-policy allkeys-lru

sudo systemctl restart redis
```

### 10. Backup e Recuperação

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/synapse"
DB_NAME="synapse_prod"
DB_USER="synapse_user"
DB_PASS="sua_senha"

# Criar diretório de backup
mkdir -p $BACKUP_DIR/$DATE

# Backup do banco de dados
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/$DATE/database.sql

# Backup dos uploads
tar -czf $BACKUP_DIR/$DATE/uploads.tar.gz uploads/

# Backup das configurações
cp config/config.php $BACKUP_DIR/$DATE/

# Manter apenas 7 dias de backup
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;

echo "Backup concluído: $BACKUP_DIR/$DATE"
```

### 11. Verificação Final

```bash
# Verificar logs de erro
tail -f logs/synapse_$(date +%Y-%m-%d).log

# Testar endpoints
curl -X GET http://seu-dominio.com/api/monitoring/health

# Verificar performance
curl -w "@curl-format.txt" -s -o /dev/null http://seu-dominio.com/api/demandas
```

## Troubleshooting Comum

### 1. Problemas de Permissão
```bash
# Ajustar permissões
sudo chown -R www-data:www-data /var/www/synapse
sudo chmod -R 755 /var/www/synapse
sudo chmod -R 777 logs uploads
```

### 2. Erro de Conexão com Banco
- Verificar credenciais em `config/config.php`
- Testar conexão: `mysql -u synapse_user -p synapse_prod`

### 3. Assets não Carregam
- Verificar se `public/dist/ViteAssets.php` existe
- Verificar permissões de leitura em `public/dist/`

### 4. WebSocket não Conecta
- Verificar se porta 8080 está aberta
- Verificar se serviço está rodando: `systemctl status synapse-websocket`

### 5. Performance Lenta
- Verificar logs em `logs/`
- Monitorar uso de memória: `free -m`
- Verificar conexões MySQL: `SHOW PROCESSLIST;`

## Segurança em Produção

1. **Firewall**: Bloquear portas desnecessárias
2. **Atualizações**: Manter PHP, MySQL, OS atualizados
3. **Logs**: Monitorar logs de acesso e erro regularmente
4. **Backups**: Automatizar backups e testar restauração
5. **SSL**: Usar HTTPS em produção
6. **Headers**: Configurar headers de segurança adequados

## Suporte

Para questões específicas sobre a integração, consulte:
- `docs/INTEGRACAO_PHP.md` - Documentação técnica completa
- `docs/api-endpoint-example.php` - Exemplos de implementação
- Logs do sistema em `logs/`
- Dashboard de monitoramento em `/monitoring`