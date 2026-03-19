-- ========================================
-- MIGRACIÓN 009: Categorías de Servicios
-- ========================================
-- Fecha: 2026-03-19
-- Descripción: 
--   1. Crear tabla categoria_servicios para categorizar servicios
--   2. Mapear servicios a categorías
--   3. Preparar base para cálculo tributario por categoría
-- ========================================

-- 1. Crear tabla categoria_servicios
CREATE TABLE IF NOT EXISTS `categoria_servicios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `id_hotel` INT(11) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `activa` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_categoria_hotel` (`id_hotel`),
  KEY `IDX_categoria_codigo` (`codigo`),
  KEY `IDX_categoria_activa` (`activa`),
  CONSTRAINT `FK_categoria_hotel` FOREIGN KEY (`id_hotel`) REFERENCES `hoteles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Agregar FK a servicios (categoria_servicios_id)
ALTER TABLE `servicios` 
ADD COLUMN `categoria_servicios_id` INT(11) NULL DEFAULT NULL AFTER `categoria`;

-- Crear índice para la nueva FK
CREATE INDEX `IDX_servicios_categoria_servicios` ON `servicios` (`categoria_servicios_id`);

-- Agregar constraint FK
ALTER TABLE `servicios`
ADD CONSTRAINT `FK_servicios_categoria_servicios` 
FOREIGN KEY (`categoria_servicios_id`) REFERENCES `categoria_servicios` (`id`) 
ON DELETE SET NULL ON UPDATE NO ACTION;

-- 3. Agregar FK a tipos_habitacion (categoria_servicios_id para Alojamiento)
ALTER TABLE `tipos_habitacion` 
ADD COLUMN `categoria_servicios_id` INT(11) NULL DEFAULT NULL AFTER `nombre_tipo`;

-- Crear índice para la nueva FK
CREATE INDEX `IDX_tipos_habitacion_categoria_servicios` ON `tipos_habitacion` (`categoria_servicios_id`);

-- Agregar constraint FK
ALTER TABLE `tipos_habitacion`
ADD CONSTRAINT `FK_tipos_habitacion_categoria_servicios` 
FOREIGN KEY (`categoria_servicios_id`) REFERENCES `categoria_servicios` (`id`) 
ON DELETE SET NULL ON UPDATE NO ACTION;

-- 4. Agregar columnas de auditoría a categoria_servicios
ALTER TABLE `categoria_servicios`
ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL AFTER `updated_at`,
ADD COLUMN `deleted_by` INT(11) NULL DEFAULT NULL AFTER `deleted_at`;

CREATE INDEX `IDX_categoria_deleted_at` ON `categoria_servicios` (`deleted_at`);

-- ========================================
-- Notas:
-- - Cada hotel tendrá sus propias categorías
-- - Las categorías se compartirán entre servicios y habitaciones
-- - Categorias estándar serán insertadas en seed
-- ========================================
