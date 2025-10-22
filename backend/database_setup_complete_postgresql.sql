-- Script SQL completo para PostgreSQL - Sistema de Despliegue WAR
-- Ejecuta este script en tu base de datos PostgreSQL

-- Crear tabla users (si no existe)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  isActive BOOLEAN DEFAULT TRUE,
  lastLogin TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla deployment_requests
CREATE TABLE IF NOT EXISTS deployment_requests (
  id SERIAL PRIMARY KEY,
  
  -- Información del usuario
  userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  
  -- Información del archivo WAR
  warFileName VARCHAR(255) NOT NULL,
  warFilePath VARCHAR(500) NOT NULL,
  warFileSize BIGINT NOT NULL,
  
  -- Información del despliegue
  targetServer VARCHAR(100) NOT NULL,
  applicationName VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Estado del proceso
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'deploying', 'deployed', 'failed')),
  
  -- Información del admin
  reviewedBy INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewedAt TIMESTAMP NULL,
  reviewComments TEXT,
  
  -- Información del despliegue
  deploymentStartedAt TIMESTAMP NULL,
  deploymentCompletedAt TIMESTAMP NULL,
  deploymentLogs TEXT,
  
  -- Metadatos adicionales
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  environment VARCHAR(20) NOT NULL DEFAULT 'development' 
    CHECK (environment IN ('development', 'testing', 'staging')),
  
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  
  -- Información del evento
  eventType VARCHAR(30) NOT NULL 
    CHECK (eventType IN (
      'war_upload', 'review_started', 'request_approved', 'request_rejected',
      'deployment_started', 'deployment_completed', 'deployment_failed',
      'user_login', 'user_logout', 'file_downloaded'
    )),
  description VARCHAR(500) NOT NULL,
  
  -- Información del usuario/admin
  userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  userRole VARCHAR(10) NOT NULL CHECK (userRole IN ('admin', 'user')),
  
  -- Relación con solicitud de despliegue (si aplica)
  deploymentRequestId INTEGER REFERENCES deployment_requests(id) ON DELETE SET NULL,
  
  -- Metadatos adicionales
  metadata JSONB,
  ipAddress INET,
  userAgent VARCHAR(500),
  
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(isActive);

CREATE INDEX IF NOT EXISTS idx_deployment_requests_userId ON deployment_requests(userId);
CREATE INDEX IF NOT EXISTS idx_deployment_requests_status ON deployment_requests(status);
CREATE INDEX IF NOT EXISTS idx_deployment_requests_reviewedBy ON deployment_requests(reviewedBy);
CREATE INDEX IF NOT EXISTS idx_deployment_requests_createdAt ON deployment_requests(createdAt);
CREATE INDEX IF NOT EXISTS idx_deployment_requests_priority ON deployment_requests(priority);

CREATE INDEX IF NOT EXISTS idx_activity_logs_eventType ON activity_logs(eventType);
CREATE INDEX IF NOT EXISTS idx_activity_logs_userId ON activity_logs(userId);
CREATE INDEX IF NOT EXISTS idx_activity_logs_deploymentRequestId ON activity_logs(deploymentRequestId);
CREATE INDEX IF NOT EXISTS idx_activity_logs_createdAt ON activity_logs(createdAt);
CREATE INDEX IF NOT EXISTS idx_activity_logs_userRole ON activity_logs(userRole);

-- Función para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updatedAt automáticamente
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployment_requests_updated_at 
    BEFORE UPDATE ON deployment_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_logs_updated_at 
    BEFORE UPDATE ON activity_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar usuarios de ejemplo (las contraseñas están hasheadas con bcrypt)
-- Contraseñas: 'admin123' y 'user123'
INSERT INTO users (username, email, password, role, isActive) VALUES
('admin', 'admin@inegi.com', '$2b$10$rOvHdXQWnXm5AKuJOyQfWujm6g4v7C8kGVQwYz.d8uF3WZnZ3H9K6', 'admin', TRUE),
('usuario', 'usuario@inegi.com', '$2b$10$rOvHdXQWnXm5AKuJOyQfWujm6g4v7C8kGVQwYz.d8uF3WZnZ3H9K6', 'user', TRUE),
('desarrollador1', 'dev1@inegi.com', '$2b$10$rOvHdXQWnXm5AKuJOyQfWujm6g4v7C8kGVQwYz.d8uF3WZnZ3H9K6', 'user', TRUE),
('desarrollador2', 'dev2@inegi.com', '$2b$10$rOvHdXQWnXm5AKuJOyQfWujm6g4v7C8kGVQwYz.d8uF3WZnZ3H9K6', 'user', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Insertar algunos datos de ejemplo para pruebas
INSERT INTO deployment_requests (
  userId, username, warFileName, warFilePath, warFileSize, 
  targetServer, applicationName, description, status, priority, environment
) VALUES
(2, 'usuario', 'app-v1.2.3.war', '/uploads/wars/app-v1.2.3.war', 15728640, 
 'Servidor 1', 'Aplicación 1', 'Actualización de interfaz de usuario', 'pending', 'medium', 'development'),
(3, 'desarrollador1', 'sistema-core-v2.1.0.war', '/uploads/wars/sistema-core-v2.1.0.war', 23592960, 
 'Servidor 2', 'Sistema Core', 'Corrección de bug crítico en autenticación', 'reviewing', 'high', 'development'),
(4, 'desarrollador2', 'modulo-reportes-v1.0.1.war', '/uploads/wars/modulo-reportes-v1.0.1.war', 8947712, 
 'Servidor 1', 'Módulo Reportes', 'Nueva funcionalidad de exportación', 'approved', 'low', 'development')
ON CONFLICT DO NOTHING;

-- Insertar algunos logs de actividad de ejemplo
INSERT INTO activity_logs (
  eventType, description, userId, username, userRole, deploymentRequestId, 
  metadata, ipAddress
) VALUES
('war_upload', 'Usuario subió archivo WAR: app-v1.2.3.war', 2, 'usuario', 'user', 1, 
 '{"fileSize": 15728640, "targetServer": "Servidor 1"}', '192.168.1.100'),
('war_upload', 'Usuario subió archivo WAR: sistema-core-v2.1.0.war', 3, 'desarrollador1', 'user', 2, 
 '{"fileSize": 23592960, "targetServer": "Servidor 2"}', '192.168.1.101'),
('review_started', 'Admin inició revisión de solicitud', 1, 'admin', 'admin', 2, 
 '{"requestId": 2}', '192.168.1.10'),
('request_approved', 'Admin aprobó solicitud de despliegue', 1, 'admin', 'admin', 3, 
 '{"requestId": 3, "comments": "Aprobado para desarrollo"}', '192.168.1.10'),
('user_login', 'Usuario inició sesión', 2, 'usuario', 'user', NULL, 
 '{"loginMethod": "form"}', '192.168.1.100')
ON CONFLICT DO NOTHING;

-- Verificar que todo se creó correctamente
SELECT 'Users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'Deployment Requests' as tabla, COUNT(*) as registros FROM deployment_requests
UNION ALL
SELECT 'Activity Logs' as tabla, COUNT(*) as registros FROM activity_logs;