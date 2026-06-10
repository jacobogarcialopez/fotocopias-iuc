-- Esquema de Base de Datos para el Sistema de Monedero Digital IUC
CREATE DATABASE IF NOT EXISTS `fotocopias_iuc` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `fotocopias_iuc`;

-- 1. Tabla Roles
CREATE TABLE IF NOT EXISTS `Roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 2. Tabla Usuarios
CREATE TABLE IF NOT EXISTS `Usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `correo` VARCHAR(150) NOT NULL UNIQUE,
  `contrasena_hash` VARCHAR(255) NOT NULL,
  `rol_id` INT NOT NULL,
  `estado` VARCHAR(20) DEFAULT 'activo',
  FOREIGN KEY (`rol_id`) REFERENCES `Roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. Tabla Estudiantes
CREATE TABLE IF NOT EXISTS `Estudiantes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL UNIQUE,
  `codigo_estudiante` VARCHAR(50) NOT NULL UNIQUE,
  `saldo_actual` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (`usuario_id`) REFERENCES `Usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Tabla Acudientes
CREATE TABLE IF NOT EXISTS `Acudientes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL UNIQUE,
  `telefono` VARCHAR(20) NOT NULL,
  FOREIGN KEY (`usuario_id`) REFERENCES `Usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Tabla Relacion_Acudientes
CREATE TABLE IF NOT EXISTS `Relacion_Acudientes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `acudiente_id` INT NOT NULL,
  `estudiante_id` INT NOT NULL,
  UNIQUE KEY `idx_acudiente_estudiante` (`acudiente_id`, `estudiante_id`),
  FOREIGN KEY (`acudiente_id`) REFERENCES `Acudientes` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`estudiante_id`) REFERENCES `Estudiantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Tabla Recargas
CREATE TABLE IF NOT EXISTS `Recargas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `estudiante_id` INT NOT NULL,
  `valor` DECIMAL(10, 2) NOT NULL,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `comprobante_pdf` VARCHAR(255) NULL,
  `usuario_registra_id` INT NOT NULL,
  FOREIGN KEY (`estudiante_id`) REFERENCES `Estudiantes` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`usuario_registra_id`) REFERENCES `Usuarios` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. Tabla Consumos
CREATE TABLE IF NOT EXISTS `Consumos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `estudiante_id` INT NOT NULL,
  `cantidad_copias` INT NOT NULL,
  `valor` DECIMAL(10, 2) NOT NULL,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `usuario_registra_id` INT NOT NULL,
  FOREIGN KEY (`estudiante_id`) REFERENCES `Estudiantes` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`usuario_registra_id`) REFERENCES `Usuarios` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 8. Tabla Qr_Tokens
CREATE TABLE IF NOT EXISTS `Qr_Tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `estudiante_id` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL UNIQUE,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` DATETIME NOT NULL,
  FOREIGN KEY (`estudiante_id`) REFERENCES `Estudiantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Tabla Notificaciones
CREATE TABLE IF NOT EXISTS `Notificaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `mensaje` TEXT NOT NULL,
  `leida` TINYINT(1) DEFAULT 0,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`usuario_id`) REFERENCES `Usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Tabla Auditoria
CREATE TABLE IF NOT EXISTS `Auditoria` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `accion` VARCHAR(255) NOT NULL,
  `ip` VARCHAR(45) NOT NULL,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`usuario_id`) REFERENCES `Usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Tabla Configuracion_Sistema
CREATE TABLE IF NOT EXISTS `Configuracion_Sistema` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `clave` VARCHAR(50) NOT NULL UNIQUE,
  `valor` VARCHAR(255) NOT NULL
) ENGINE=InnoDB;
