-- 1. Crear tabla hoteles (es mejor que "hotel")
CREATE TABLE `hoteles` (
    `id_hotel` INT PRIMARY KEY AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `nit` VARCHAR(20) NOT NULL UNIQUE,
    `direccion` VARCHAR(200),
    `ciudad` VARCHAR(100),
    `pais` VARCHAR(100),
    `telefono` VARCHAR(20),
    `email` VARCHAR(100),
    `estrellas` INT,
    `descripcion` TEXT,
    `fecha_registro` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insertar Hotel Sena 2026
INSERT INTO `hoteles` (`nombre`, `nit`, `ciudad`, `pais`, `telefono`, `email`, `estrellas`) 
VALUES ('Hotel Sena 2026', '123456789', 'Bogotá', 'Colombia', '3005551234', 'hotel@sena.com', 5);

-- 3. Crear tabla empleados (FK a hoteles.id_hotel)
-- NOTA: id_hotel es NULLABLE para permitir superadmin sin hotel asignado
CREATE TABLE `empleados` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_hotel` INT,
  `cedula` VARCHAR(50) UNIQUE NOT NULL,
  `nombre` VARCHAR(255) NOT NULL,
  `apellido` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255),
  `telefono` VARCHAR(20),
  `rol` VARCHAR(100),
  `estado` VARCHAR(50) DEFAULT 'activo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_hotel`) REFERENCES `hoteles`(`id_hotel`)
);

-- 4. Insertar superadmin inicial (sin hotel asignado)
INSERT INTO `empleados` (`id_hotel`, `cedula`, `nombre`, `apellido`, `email`, `rol`) 
VALUES (NULL, '9999999999', 'SuperAdmin', 'Sistema', 'superadmin@hotelsena.com', 'superadmin');

-- 5. Vincular el usuario con el empleado
UPDATE `users` SET `id_empleado` = 1 WHERE `email` = 'recepcionista@gmail.com';

-- 6. Actualizar reservas para que apunten a hoteles.id_hotel (si no está correcto)
ALTER TABLE `reservas` ADD CONSTRAINT fk_reservas_hotel FOREIGN KEY (`id_hotel`) REFERENCES `hoteles`(`id_hotel`);