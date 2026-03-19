-- ========================================
-- SCRIPT CONSOLIDADO DE MIGRACIONES
-- Hotel Sena 2026 - Refactorización Sistema Tributario
-- Fecha: 2026-03-19
-- ========================================

-- ========================================
-- MIGRACIÓN 009: Categorías de Servicios
-- ========================================
CREATE TABLE IF NOT EXISTS `categoria_servicios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `id_hotel` INT(11) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NULL,
  `codigo` VARCHAR(50) NOT NULL UNIQUE,
  `activa` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at` DATETIME NULL DEFAULT NULL,
  `deleted_by` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_categoria_hotel` (`id_hotel`),
  KEY `IDX_categoria_codigo` (`codigo`),
  KEY `IDX_categoria_activa` (`activa`),
  KEY `IDX_categoria_deleted_at` (`deleted_at`),
  CONSTRAINT `FK_categoria_hotel` FOREIGN KEY (`id_hotel`) REFERENCES `hoteles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Agregar FK a servicios (si no existe)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_NAME = 'servicios' AND COLUMN_NAME = 'categoria_servicios_id';
SET @query = IF(@col_exists = 0, 'ALTER TABLE `servicios` ADD COLUMN `categoria_servicios_id` INT(11) NULL DEFAULT NULL AFTER `categoria`', 'SELECT "Columna categoria_servicios_id ya existe en servicios"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.STATISTICS WHERE TABLE_NAME = 'servicios' AND INDEX_NAME = 'IDX_servicios_categoria_servicios';
SET @query = IF(@col_exists = 0, 'CREATE INDEX `IDX_servicios_categoria_servicios` ON `servicios` (`categoria_servicios_id`)', 'SELECT "Índice ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @constraint_exists = 0;
SELECT COUNT(*) INTO @constraint_exists FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'servicios' AND CONSTRAINT_NAME = 'FK_servicios_categoria_servicios';
SET @query = IF(@constraint_exists = 0, 'ALTER TABLE `servicios` ADD CONSTRAINT `FK_servicios_categoria_servicios` FOREIGN KEY (`categoria_servicios_id`) REFERENCES `categoria_servicios` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION', 'SELECT "FK ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar FK a tipos_habitacion (si no existe)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_NAME = 'tipos_habitacion' AND COLUMN_NAME = 'categoria_servicios_id';
SET @query = IF(@col_exists = 0, 'ALTER TABLE `tipos_habitacion` ADD COLUMN `categoria_servicios_id` INT(11) NULL DEFAULT NULL AFTER `nombre_tipo`', 'SELECT "Columna categoria_servicios_id ya existe en tipos_habitacion"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.STATISTICS WHERE TABLE_NAME = 'tipos_habitacion' AND INDEX_NAME = 'IDX_tipos_habitacion_categoria_servicios';
SET @query = IF(@col_exists = 0, 'CREATE INDEX `IDX_tipos_habitacion_categoria_servicios` ON `tipos_habitacion` (`categoria_servicios_id`)', 'SELECT "Índice ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @constraint_exists = 0;
SELECT COUNT(*) INTO @constraint_exists FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'tipos_habitacion' AND CONSTRAINT_NAME = 'FK_tipos_habitacion_categoria_servicios';
SET @query = IF(@constraint_exists = 0, 'ALTER TABLE `tipos_habitacion` ADD CONSTRAINT `FK_tipos_habitacion_categoria_servicios` FOREIGN KEY (`categoria_servicios_id`) REFERENCES `categoria_servicios` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION', 'SELECT "FK ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========================================
-- MIGRACIÓN 010: Tasas de Impuestos
-- ========================================
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
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM information_schema.STATISTICS WHERE TABLE_NAME = 'tax_rates' AND INDEX_NAME = 'IDX_tax_rates_active_by_categoria';
SET @query = IF(@idx_exists = 0, 'CREATE INDEX `IDX_tax_rates_active_by_categoria` ON `tax_rates` (`id_hotel`, `categoria_servicios_id`, `activa`, `fecha_vigencia_inicio`, `fecha_vigencia_fin`)', 'SELECT "Índice ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM information_schema.STATISTICS WHERE TABLE_NAME = 'tax_rates' AND INDEX_NAME = 'IDX_tax_rates_residencia';
SET @query = IF(@idx_exists = 0, 'CREATE INDEX `IDX_tax_rates_residencia` ON `tax_rates` (`id_hotel`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`)', 'SELECT "Índice ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
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

-- ========================================
-- MIGRACIÓN 011: Tax Profile (con validaciones)
-- ========================================
-- Agregar tax_profile a clientes si no existen
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_NAME = 'clientes' AND COLUMN_NAME = 'tax_profile';
SET @query = IF(@col_exists = 0, 'ALTER TABLE `clientes` ADD COLUMN `tax_profile` ENUM(\'RESIDENT\', \'FOREIGN_TOURIST\', \'ENTITY\') NOT NULL DEFAULT \'RESIDENT\' AFTER `visaExpira`', 'SELECT "Columna tax_profile ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_NAME = 'clientes' AND COLUMN_NAME = 'tipo_documento_estandar';
SET @query = IF(@col_exists = 0, 'ALTER TABLE `clientes` ADD COLUMN `tipo_documento_estandar` VARCHAR(50) NULL AFTER `tax_profile`', 'SELECT "Columna ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_NAME = 'clientes' AND COLUMN_NAME = 'documento_validado';
SET @query = IF(@col_exists = 0, 'ALTER TABLE `clientes` ADD COLUMN `documento_validado` BOOLEAN NOT NULL DEFAULT FALSE AFTER `tipo_documento_estandar`', 'SELECT "Columna ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_NAME = 'clientes' AND COLUMN_NAME = 'fecha_validacion_documento';
SET @query = IF(@col_exists = 0, 'ALTER TABLE `clientes` ADD COLUMN `fecha_validacion_documento` DATETIME NULL AFTER `documento_validado`', 'SELECT "Columna ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_NAME = 'clientes' AND COLUMN_NAME = 'validado_por_usuario_id';
SET @query = IF(@col_exists = 0, 'ALTER TABLE `clientes` ADD COLUMN `validado_por_usuario_id` INT(11) NULL AFTER `fecha_validacion_documento`', 'SELECT "Columna ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM information_schema.STATISTICS WHERE TABLE_NAME = 'clientes' AND INDEX_NAME = 'IDX_clientes_tax_profile';
SET @query = IF(@idx_exists = 0, 'CREATE INDEX `IDX_clientes_tax_profile` ON `clientes` (`tax_profile`)', 'SELECT "Índice ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM information_schema.STATISTICS WHERE TABLE_NAME = 'clientes' AND INDEX_NAME = 'IDX_clientes_documento_validado';
SET @query = IF(@idx_exists = 0, 'CREATE INDEX `IDX_clientes_documento_validado` ON `clientes` (`documento_validado`, `tax_profile`)', 'SELECT "Índice ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar tax_profile a empleados si no existe
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_NAME = 'empleados' AND COLUMN_NAME = 'tax_profile';
SET @query = IF(@col_exists = 0, 'ALTER TABLE `empleados` ADD COLUMN `tax_profile` ENUM(\'RESIDENT\', \'FOREIGN_TOURIST\', \'ENTITY\') NOT NULL DEFAULT \'RESIDENT\' AFTER `rol`', 'SELECT "Columna tax_profile ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM information_schema.STATISTICS WHERE TABLE_NAME = 'empleados' AND INDEX_NAME = 'IDX_empleados_tax_profile';
SET @query = IF(@idx_exists = 0, 'CREATE INDEX `IDX_empleados_tax_profile` ON `empleados` (`tax_profile`)', 'SELECT "Índice ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `tax_profile_audit` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `entidad` VARCHAR(50) NOT NULL,
  `id_entidad` INT(11) NOT NULL,
  `tax_profile_anterior` VARCHAR(50) NULL,
  `tax_profile_nuevo` VARCHAR(50) NOT NULL,
  `razon_cambio` TEXT NULL,
  `usuario_id` INT(11) NULL,
  `usuario_email` VARCHAR(255) NULL,
  `fecha` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ip_address` VARCHAR(50) NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_tax_profile_audit_entidad` (`entidad`, `id_entidad`),
  KEY `IDX_tax_profile_audit_usuario` (`usuario_id`),
  KEY `IDX_tax_profile_audit_fecha` (`fecha`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Agregar estado_factura a facturas si no existe
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_NAME = 'facturas' AND COLUMN_NAME = 'estado_factura';
SET @query = IF(@col_exists = 0, 'ALTER TABLE `facturas` ADD COLUMN `estado_factura` ENUM(\'BORRADOR\', \'EDITABLE\', \'EMITIDA\', \'PAGADA\', \'ANULADA\') NOT NULL DEFAULT \'BORRADOR\' AFTER `estado`', 'SELECT "Columna ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM information_schema.STATISTICS WHERE TABLE_NAME = 'facturas' AND INDEX_NAME = 'IDX_facturas_estado_factura';
SET @query = IF(@idx_exists = 0, 'CREATE INDEX `IDX_facturas_estado_factura` ON `facturas` (`estado_factura`)', 'SELECT "Índice ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar desglose_impuestos y desglose_monetario si no existen
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_NAME = 'facturas' AND COLUMN_NAME = 'desglose_impuestos';
SET @query = IF(@col_exists = 0, 'ALTER TABLE `facturas` ADD COLUMN `desglose_impuestos` JSON NULL AFTER `monto_inc`', 'SELECT "Columna ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS WHERE TABLE_NAME = 'facturas' AND COLUMN_NAME = 'desglose_monetario';
SET @query = IF(@col_exists = 0, 'ALTER TABLE `facturas` ADD COLUMN `desglose_monetario` JSON NULL AFTER `desglose_impuestos`', 'SELECT "Columna ya existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `factura_cambios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `id_factura` INT(11) NOT NULL,
  `usuario_id` INT(11) NULL,
  `usuario_email` VARCHAR(255) NULL,
  `tipo_cambio` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NULL,
  `valor_anterior` JSON NULL,
  `valor_nuevo` JSON NULL,
  `fecha` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_factura_cambios_factura` (`id_factura`),
  KEY `IDX_factura_cambios_usuario` (`usuario_id`),
  KEY `IDX_factura_cambios_fecha` (`fecha`),
  CONSTRAINT `FK_factura_cambios_factura` FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ========================================
-- MIGRACIÓN 012: SEED - Categorías y Tasas
-- ========================================
INSERT INTO `categoria_servicios` (`id_hotel`, `nombre`, `descripcion`, `codigo`, `activa`) VALUES
  (1, 'Alojamiento', 'Hospedaje en habitaciones del hotel', 'ALOJAMIENTO', TRUE),
  (1, 'Restaurante/Cafetería', 'Servicios de comidas y bebidas', 'RESTAURANTE', TRUE),
  (1, 'Minibar/Tienda', 'Minibar, tienda y productos básicos', 'MINIBAR', TRUE),
  (1, 'Lavandería', 'Servicios de lavado y planchado', 'LAVANDERIA', TRUE),
  (1, 'Spa', 'Servicios de bienestar y masajes', 'SPA', TRUE),
  (1, 'Room Service', 'Servicio a habitación (comidas, etc.)', 'ROOM_SERVICE', TRUE),
  (1, 'Transporte', 'Transporte y traslados', 'TRANSPORTE', TRUE),
  (1, 'Tours', 'Tours y excursiones', 'TOURS', TRUE),
  (1, 'Eventos', 'Salonería, salones para eventos', 'EVENTOS', TRUE),
  (1, 'Mantenimiento', 'Servicios internos de mantenimiento', 'MANTENIMIENTO', TRUE);

-- Tasas: Alojamiento (19% residentes, 0% extranjeros)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 1, 'IVA', 19.00, 'IVA Alojamiento - Residentes', TRUE, FALSE, TRUE),
  (1, 1, 'IVA', 0.00, 'IVA Alojamiento - Extranjeros no residentes', FALSE, TRUE, TRUE);

-- Tasas: Restaurante (INC 8%)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 2, 'INC', 8.00, 'INC Restaurante/Cafetería - Impuesto Nacional al Consumo', TRUE, TRUE, TRUE);

-- Tasas: Minibar (19% normal, 0% básicos)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 3, 'IVA', 19.00, 'IVA Minibar - Productos normales (19%)', TRUE, TRUE, TRUE),
  (1, 3, 'IVA', 0.00, 'IVA Minibar - Productos básicos excluidos (0%)', TRUE, TRUE, TRUE);

-- Tasas: Lavandería (19%)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 4, 'IVA', 19.00, 'IVA Lavandería (19%)', TRUE, TRUE, TRUE);

-- Tasas: Spa (19%)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 5, 'IVA', 19.00, 'IVA Spa - Servicios de bienestar (19%)', TRUE, TRUE, TRUE);

-- Tasas: Room Service (IVA 19% + INC 8%)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 6, 'IVA', 19.00, 'IVA Room Service - Comidas sólidas (19%)', TRUE, TRUE, TRUE),
  (1, 6, 'INC', 8.00, 'INC Room Service - Bebidas alcohólicas/no alcohólicas (8%)', TRUE, TRUE, TRUE);

-- Tasas: Transporte (19%)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 7, 'IVA', 19.00, 'IVA Transporte - Traslados (19%)', TRUE, TRUE, TRUE);

-- Tasas: Tours (19%)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 8, 'IVA', 19.00, 'IVA Tours - Excursiones (19%)', TRUE, TRUE, TRUE);

-- Tasas: Eventos (19%)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 9, 'IVA', 19.00, 'IVA Eventos - Salonería (19%)', TRUE, TRUE, TRUE);

-- Tasas: Mantenimiento (0%)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 10, 'IVA', 0.00, 'Mantenimiento - Servicio interno (No aplica impuesto)', TRUE, TRUE, TRUE);

-- ========================================
-- MIGRACIÓN 013: Mapear Servicios Existentes
-- ========================================
UPDATE `servicios` SET `categoria_servicios_id` = 2 WHERE `categoria` = 'cafeteria' AND `categoria_servicios_id` IS NULL;
UPDATE `servicios` SET `categoria_servicios_id` = 4 WHERE `categoria` = 'lavanderia' AND `categoria_servicios_id` IS NULL;
UPDATE `servicios` SET `categoria_servicios_id` = 5 WHERE `categoria` = 'spa' AND `categoria_servicios_id` IS NULL;
UPDATE `servicios` SET `categoria_servicios_id` = 6 WHERE `categoria` = 'room_service' AND `categoria_servicios_id` IS NULL;
UPDATE `servicios` SET `categoria_servicios_id` = 3 WHERE `categoria` = 'minibar' AND `categoria_servicios_id` IS NULL;
UPDATE `servicios` SET `categoria_servicios_id` = 7 WHERE `categoria` = 'otros' AND LOWER(`nombre`) LIKE '%transporte%' AND `categoria_servicios_id` IS NULL;
UPDATE `servicios` SET `categoria_servicios_id` = 8 WHERE `categoria` = 'otros' AND LOWER(`nombre`) LIKE '%tour%' AND `categoria_servicios_id` IS NULL;
UPDATE `servicios` SET `categoria_servicios_id` = 9 WHERE `categoria` = 'otros' AND LOWER(`nombre`) LIKE '%evento%' AND `categoria_servicios_id` IS NULL;
UPDATE `servicios` SET `categoria_servicios_id` = 5 WHERE `categoria` = 'otros' AND `categoria_servicios_id` IS NULL;
UPDATE `tipos_habitacion` SET `categoria_servicios_id` = 1 WHERE `categoria_servicios_id` IS NULL;

-- ========================================
-- VERIFICACIÓN FINAL - Validar todas las columnas creadas
-- ========================================

SELECT '=== VALIDACIONES ===' AS 'Status';

-- Verificar tabla categoria_servicios
SELECT 'categoria_servicios: EXISTE' AS 'Tabla' FROM information_schema.TABLES WHERE TABLE_NAME = 'categoria_servicios' LIMIT 1;
SELECT COUNT(*) as `Total Categorías` FROM `categoria_servicios`;

-- Verificar tabla tax_rates
SELECT 'tax_rates: EXISTE' AS 'Tabla' FROM information_schema.TABLES WHERE TABLE_NAME = 'tax_rates' LIMIT 1;
SELECT COUNT(*) as `Total Tasas` FROM `tax_rates`;

-- Verificar columna categoria_servicios_id en servicios
SELECT 'servicios.categoria_servicios_id' as 'Columna' FROM information_schema.COLUMNS 
WHERE TABLE_NAME = 'servicios' AND COLUMN_NAME = 'categoria_servicios_id' LIMIT 1;

-- Verificar columna categoria_servicios_id en tipos_habitacion
SELECT 'tipos_habitacion.categoria_servicios_id' as 'Columna' FROM information_schema.COLUMNS 
WHERE TABLE_NAME = 'tipos_habitacion' AND COLUMN_NAME = 'categoria_servicios_id' LIMIT 1;

-- Verificar columnas en clientes
SELECT 'clientes.tax_profile' as 'Columna' FROM information_schema.COLUMNS 
WHERE TABLE_NAME = 'clientes' AND COLUMN_NAME = 'tax_profile' LIMIT 1;
SELECT 'clientes.tipo_documento_estandar' as 'Columna' FROM information_schema.COLUMNS 
WHERE TABLE_NAME = 'clientes' AND COLUMN_NAME = 'tipo_documento_estandar' LIMIT 1;
SELECT 'clientes.documento_validado' as 'Columna' FROM information_schema.COLUMNS 
WHERE TABLE_NAME = 'clientes' AND COLUMN_NAME = 'documento_validado' LIMIT 1;
SELECT 'clientes.fecha_validacion_documento' as 'Columna' FROM information_schema.COLUMNS 
WHERE TABLE_NAME = 'clientes' AND COLUMN_NAME = 'fecha_validacion_documento' LIMIT 1;
SELECT 'clientes.validado_por_usuario_id' as 'Columna' FROM information_schema.COLUMNS 
WHERE TABLE_NAME = 'clientes' AND COLUMN_NAME = 'validado_por_usuario_id' LIMIT 1;

-- Verificar columna tax_profile en empleados
SELECT 'empleados.tax_profile' as 'Columna' FROM information_schema.COLUMNS 
WHERE TABLE_NAME = 'empleados' AND COLUMN_NAME = 'tax_profile' LIMIT 1;

-- Verificar columnas en facturas
SELECT 'facturas.estado_factura' as 'Columna' FROM information_schema.COLUMNS 
WHERE TABLE_NAME = 'facturas' AND COLUMN_NAME = 'estado_factura' LIMIT 1;
SELECT 'facturas.desglose_impuestos' as 'Columna' FROM information_schema.COLUMNS 
WHERE TABLE_NAME = 'facturas' AND COLUMN_NAME = 'desglose_impuestos' LIMIT 1;
SELECT 'facturas.desglose_monetario' as 'Columna' FROM information_schema.COLUMNS 
WHERE TABLE_NAME = 'facturas' AND COLUMN_NAME = 'desglose_monetario' LIMIT 1;

-- Verificar tablas audit
SELECT 'tax_rates_audit: EXISTE' AS 'Tabla' FROM information_schema.TABLES WHERE TABLE_NAME = 'tax_rates_audit' LIMIT 1;
SELECT 'tax_profile_audit: EXISTE' AS 'Tabla' FROM information_schema.TABLES WHERE TABLE_NAME = 'tax_profile_audit' LIMIT 1;
SELECT 'factura_cambios: EXISTE' AS 'Tabla' FROM information_schema.TABLES WHERE TABLE_NAME = 'factura_cambios' LIMIT 1;

-- Resumen final
SELECT '=== MIGRACIÓN COMPLETADA ===' AS 'Estado';

-- ========================================
-- FIN DE MIGRACIONES
-- ========================================
