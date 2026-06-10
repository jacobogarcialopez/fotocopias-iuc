-- Semillas de prueba para el Sistema de Monedero Digital IUC
USE `fotocopias_iuc`;

-- Insertar Roles
INSERT INTO `Roles` (`id`, `nombre`) VALUES
(1, 'Estudiante'),
(2, 'Acudiente'),
(3, 'Operador'),
(4, 'Administrativo'),
(5, 'Rector')
ON DUPLICATE KEY UPDATE `nombre`=VALUES(`nombre`);

-- Insertar Configuración Inicial del Sistema
INSERT INTO `Configuracion_Sistema` (`clave`, `valor`) VALUES
('precio_copia', '150'),
('modo_emergencia', '0'),
('credito_emergencia', '1500')
ON DUPLICATE KEY UPDATE `valor`=VALUES(`valor`);

-- Insertar Usuarios de Prueba
-- Todos los usuarios usan la contraseña '123456' (Hash bcrypt: $2a$10$X8mGv42RmdU769F8Yw/eReLdYf.Tq9p2/91/tU.J5W3pGkS1R9c1K)
INSERT INTO `Usuarios` (`id`, `nombre`, `apellido`, `correo`, `contrasena_hash`, `rol_id`, `estado`) VALUES
(1, 'Carlos', 'Rector', 'rector@iuc.edu.co', '$2a$10$X8mGv42RmdU769F8Yw/eReLdYf.Tq9p2/91/tU.J5W3pGkS1R9c1K', 5, 'activo'),
(2, 'Ana', 'Administradora', 'admin@iuc.edu.co', '$2a$10$X8mGv42RmdU769F8Yw/eReLdYf.Tq9p2/91/tU.J5W3pGkS1R9c1K', 4, 'activo'),
(3, 'Juan', 'Operador', 'operador@iuc.edu.co', '$2a$10$X8mGv42RmdU769F8Yw/eReLdYf.Tq9p2/91/tU.J5W3pGkS1R9c1K', 3, 'activo'),
(4, 'Mateo', 'Garcia Lopez', 'estudiante@iuc.edu.co', '$2a$10$X8mGv42RmdU769F8Yw/eReLdYf.Tq9p2/91/tU.J5W3pGkS1R9c1K', 1, 'activo'),
(5, 'Pedro', 'Garcia', 'acudiente@iuc.edu.co', '$2a$10$X8mGv42RmdU769F8Yw/eReLdYf.Tq9p2/91/tU.J5W3pGkS1R9c1K', 2, 'activo'),
(6, 'Sofia', 'Martinez', 'estudiante2@iuc.edu.co', '$2a$10$X8mGv42RmdU769F8Yw/eReLdYf.Tq9p2/91/tU.J5W3pGkS1R9c1K', 1, 'activo')
ON DUPLICATE KEY UPDATE `correo`=VALUES(`correo`);

-- Insertar Estudiantes de Prueba
INSERT INTO `Estudiantes` (`id`, `usuario_id`, `codigo_estudiante`, `saldo_actual`) VALUES
(1, 4, '20261001', 15000.00),
(2, 6, '20261002', 300.00) -- Saldo bajo (2 copias del precio de 150)
ON DUPLICATE KEY UPDATE `codigo_estudiante`=VALUES(`codigo_estudiante`), `saldo_actual`=VALUES(`saldo_actual`);

-- Insertar Acudientes de Prueba
INSERT INTO `Acudientes` (`id`, `usuario_id`, `telefono`) VALUES
(1, 5, '3001234567')
ON DUPLICATE KEY UPDATE `telefono`=VALUES(`telefono`);

-- Relación de Acudientes
INSERT INTO `Relacion_Acudientes` (`id`, `acudiente_id`, `estudiante_id`) VALUES
(1, 1, 1),
(2, 1, 2)
ON DUPLICATE KEY UPDATE `acudiente_id`=VALUES(`acudiente_id`), `estudiante_id`=VALUES(`estudiante_id`);

-- Insertar Recargas Iniciales
INSERT INTO `Recargas` (`id`, `estudiante_id`, `valor`, `fecha`, `comprobante_pdf`, `usuario_registra_id`) VALUES
(1, 1, 15000.00, NOW(), 'comprobante_1.pdf', 2),
(2, 2, 300.00, NOW(), 'comprobante_2.pdf', 2)
ON DUPLICATE KEY UPDATE `valor`=VALUES(`valor`);
