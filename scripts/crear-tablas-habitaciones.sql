-- ============================================
-- Script MySQL para Tablas de Habitaciones
-- Hotel SENA 2026
-- ============================================

-- Crear tabla de amenidades
CREATE TABLE IF NOT EXISTS `amenidades` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) UNIQUE NOT NULL,
  `icono` VARCHAR(255) NULL,
  `categoria` VARCHAR(255) NULL,
  `descripcion` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de tipos de habitación
CREATE TABLE IF NOT EXISTS `tipos_habitacion` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_hotel` INT NOT NULL,
  `nombre_tipo` VARCHAR(255) UNIQUE NOT NULL,
  `descripcion` TEXT NULL,
  `capacidad_personas` SMALLINT NOT NULL,
  `precio_base` DECIMAL(12,2) NULL,
  `activo` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de relación tipos_habitacion <-> amenidades (muchos a muchos)
CREATE TABLE IF NOT EXISTS `tipo_habitacion_amenidades` (
  `id_tipo_habitacion` INT NOT NULL,
  `id_amenidad` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_tipo_habitacion`, `id_amenidad`),
  FOREIGN KEY (`id_tipo_habitacion`) REFERENCES `tipos_habitacion`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`id_amenidad`) REFERENCES `amenidades`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de habitaciones
CREATE TABLE IF NOT EXISTS `habitaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_hotel` INT NOT NULL,
  `numero_habitacion` VARCHAR(255) NOT NULL,
  `piso` VARCHAR(255) NULL,
  `estado` VARCHAR(255) NULL,
  `id_tipo_habitacion` INT NOT NULL,
  `fecha_actualizacion` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id_tipo_habitacion`) REFERENCES `tipos_habitacion`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Fin de creación de tablas
-- ============================================
