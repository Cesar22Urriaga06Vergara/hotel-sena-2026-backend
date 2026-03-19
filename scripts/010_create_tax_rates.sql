-- ========================================
-- MIGRACIÓN 010: Tasas de Impuestos por Categoría
-- ========================================
-- Fecha: 2026-03-19
-- Descripción: 
--   1. Crear tabla tax_rates para mapear categoría → tasa de impuesto
--   2. Soportar múltiples tasas por categoría (IVA, INC, etc.)
--   3. Configuración por hotel para máxima flexibilidad
--   4. Mantener historial de cambios de tasas
-- ========================================

-- 1. Crear tabla tax_rates
CREATE TABLE IF NOT EXISTS `tax_rates` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `id_hotel` INT(11) NOT NULL,
  `categoria_servicios_id` INT(11) NOT NULL,
  `tipo_impuesto` ENUM('IVA', 'INC', 'OTROS') NOT NULL DEFAULT 'IVA',
  `tasa_porcentaje` DECIMAL(5, 2) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  `aplica_a_residentes` BOOLEAN NOT NULL DEFAULT TRUE,
  `aplica_a_extranjeros` BOOLEAN NOT NULL DEFAULT TRUE,
  `activa` BOOLEAN NOT NULL DEFAULT TRUE,
  `fecha_vigencia_inicio` DATE NOT NULL DEFAULT CURDATE(),
  `fecha_vigencia_fin` DATE NULL DEFAULT NULL,
  `notas` TEXT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_tax_rates_hotel` (`id_hotel`),
  KEY `IDX_tax_rates_categoria` (`categoria_servicios_id`),
  KEY `IDX_tax_rates_tipo_impuesto` (`tipo_impuesto`),
  KEY `IDX_tax_rates_activa` (`activa`),
  KEY `IDX_tax_rates_vigencia` (`fecha_vigencia_inicio`, `fecha_vigencia_fin`),
  UNIQUE KEY `UK_tax_rates_unique` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `fecha_vigencia_fin`),
  CONSTRAINT `FK_tax_rates_hotel` FOREIGN KEY (`id_hotel`) REFERENCES `hoteles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_tax_rates_categoria` FOREIGN KEY (`categoria_servicios_id`) REFERENCES `categoria_servicios` (`id`) ON DELETE RESTRICT ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Crear tabla tax_rates_audit para mantener historial de cambios
CREATE TABLE IF NOT EXISTS `tax_rates_audit` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tax_rates_id` INT(11) NOT NULL,
  `id_hotel` INT(11) NOT NULL,
  `usuario_id` INT(11) NULL,
  `operacion` ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
  `tasa_anterior` DECIMAL(5, 2) NULL,
  `tasa_nueva` DECIMAL(5, 2) NULL,
  `razon_cambio` TEXT NULL,
  `fecha` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_tax_rates_audit_hotel` (`id_hotel`),
  KEY `IDX_tax_rates_audit_usuario` (`usuario_id`),
  KEY `IDX_tax_rates_audit_fecha` (`fecha`),
  CONSTRAINT `FK_tax_rates_audit_hotel` FOREIGN KEY (`id_hotel`) REFERENCES `hoteles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Crear índice específico para búsquedas de tasas activas por categoría
CREATE INDEX `IDX_tax_rates_active_by_categoria` ON `tax_rates` 
  (`id_hotel`, `categoria_servicios_id`, `activa`, `fecha_vigencia_inicio`, `fecha_vigencia_fin`);

-- 4. Crear índice para búsquedas de tasas por residencia
CREATE INDEX `IDX_tax_rates_residencia` ON `tax_rates` 
  (`id_hotel`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`);

-- ========================================
-- Estructura de Tasas:
-- - Alojamiento: 19% IVA (residentes), 0% IVA (extranjeros no residentes)
-- - Restaurante: 8% INC (todos)
-- - Minibar: 19% IVA (productos normales), 0% IVA (productos básicos)
-- - Otros Servicios: 19% IVA
-- 
-- Notas:
-- - aplica_a_residentes: si TRUE, aplica la tasa a residentes
-- - aplica_a_extranjeros: si TRUE, aplica la tasa a extranjeros no residentes
-- - Las tasas vencidas (fecha_vigencia_fin < HOY) no se aplican
-- - El audit de cambios permite rastrear modificaciones de tasas
-- ========================================
