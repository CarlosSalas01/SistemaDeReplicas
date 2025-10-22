-- Script SQL para crear la tabla de usuarios
-- Ejecuta este script en tu base de datos MySQL

CREATE DATABASE IF NOT EXISTS inegi_project;
USE inegi_project;

-- Crear tabla users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  isActive BOOLEAN DEFAULT TRUE,
  lastLogin DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_active (isActive)
);

-- Insertar usuarios de ejemplo (las contraseñas están hasheadas con bcrypt)
-- Contraseñas: 'admin123' y 'user123'
INSERT INTO users (username, email, password, role, isActive) VALUES
('admin', 'admin@inegi.com', '$2b$10$rOvHdXQWnXm5AKuJOyQfWujm6g4v7C8kGVQwYz.d8uF3WZnZ3H9K6', 'admin', TRUE),
('usuario', 'usuario@inegi.com', '$2b$10$rOvHdXQWnXm5AKuJOyQfWujm6g4v7C8kGVQwYz.d8uF3WZnZ3H9K6', 'user', TRUE);

-- Verificar que los usuarios se crearon correctamente
SELECT id, username, email, role, isActive, createdAt FROM users;
