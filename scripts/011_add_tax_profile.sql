-- ========================================
-- MIGRACIÓN 011: Tax Profile para Usuarios
-- ========================================
-- Fecha: 2026-03-19
-- Descripción: 
--   1. Agregar campo tax_profile a tabla usuarios
--   2. Agregar campos de validación documental
--   3. Permitir distinción entre residentes y extranjeros
--   4. Soportar diferentes perfiles tributarios
-- ========================================

-- 1. Agregar tax_profile a usuarios (para empleados del sistema)
ALTER TABLE `usuarios` 
ADD COLUMN `tax_profile` ENUM('RESIDENT', 'FOREIGN_TOURIST', 'ENTITY') NOT NULL DEFAULT 'RESIDENT' AFTER `activo`;

-- Crear índice para búsquedas de usuarios por perfil
CREATE INDEX `IDX_usuarios_tax_profile` ON `usuarios` (`tax_profile`);

-- 2. Agregar tax_profile a clientes (para huéspedes)
ALTER TABLE `clientes` 
ADD COLUMN `tax_profile` ENUM('RESIDENT', 'FOREIGN_TOURIST', 'ENTITY') NOT NULL DEFAULT 'RESIDENT' AFTER `visa_expira`,
ADD COLUMN `tipo_documento_estandar` VARCHAR(50) NULL AFTER `tax_profile`,
ADD COLUMN `documento_validado` BOOLEAN NOT NULL DEFAULT FALSE AFTER `tipo_documento_estandar`,
ADD COLUMN `fecha_validacion_documento` DATETIME NULL AFTER `documento_validado`,
ADD COLUMN `validado_por_usuario_id` INT(11) NULL AFTER `fecha_validacion_documento`;

-- Crear índice para búsquedas de clientes por perfil tributario
CREATE INDEX `IDX_clientes_tax_profile` ON `clientes` (`tax_profile`);

-- Crear índice para búsquedas de documentos validados
CREATE INDEX `IDX_clientes_documento_validado` ON `clientes` (`documento_validado`, `tax_profile`);

-- 3. Agregar campos de validación a empleados (si necesario)
ALTER TABLE `empleados` 
ADD COLUMN `tax_profile` ENUM('RESIDENT', 'FOREIGN_TOURIST', 'ENTITY') NOT NULL DEFAULT 'RESIDENT' AFTER `email`;

-- Crear índice para empleados
CREATE INDEX `IDX_empleados_tax_profile` ON `empleados` (`tax_profile`);

-- 4. Crear tabla de auditoría para cambios de tax_profile
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

-- 5. Agregar campo estado_factura para permitir edición pre-emisión
ALTER TABLE `facturas`
ADD COLUMN `estado_factura` ENUM('BORRADOR', 'EDITABLE', 'EMITIDA', 'PAGADA', 'ANULADA') NOT NULL DEFAULT 'BORRADOR' AFTER `estado`;

-- Crear índice para búsquedas por estado de factura
CREATE INDEX `IDX_facturas_estado_factura` ON `facturas` (`estado_factura`);

-- 6. Agregar campos de desglose por categoría (JSON para compatibilidad)
ALTER TABLE `facturas`
ADD COLUMN `desglose_impuestos` JSON NULL AFTER `monto_inc`,
ADD COLUMN `desglose_monetario` JSON NULL AFTER `desglose_impuestos`;

-- Ejemplo de estructura JSON esperada para desglose_impuestos:
-- {
--   "Alojamiento": {
--     "base": 1000000,
--     "iva": 190000,
--     "inc": null,
--     "total": 1190000
--   },
--   "Restaurante": {
--     "base": 50000,
--     "iva": null,
--     "inc": 4000,
--     "total": 54000
--   }
-- }

-- 7. Agregar campo de historial de cambios en facturas
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
-- Enumeración tax_profile:
-- - RESIDENT: Cliente residente (aplica IVA normal)
-- - FOREIGN_TOURIST: Extranjero no residente (exención IVA para alojamiento, IVA normal para otros servicios)
-- - ENTITY: Entidad jurídica / Empresa
--
-- Validación de Documento:
-- - tipo_documento: valor original (pasaporte, cédula, etc.)
-- - tipo_documento_estandar: mapeo a estándar ISO (CC: Cédula Colombiana, PA: Pasaporte, NIT)
-- - documento_validado: TRUE cuando HOTEL_ADMIN confirma el documento
-- - fecha_validacion_documento: timestamp cuando se validó
-- - validado_por_usuario_id: ID del usuario que validó
--
-- Estado Factura:
-- - BORRADOR: Recién creada, sin confirmar
-- - EDITABLE: Confirmada, se pueden hacer cambios hasta emitir
-- - EMITIDA: Ya emitida a DIAN/cliente, read-only desde front pero auditable
-- - PAGADA: Pagada completamente
-- - ANULADA: Anulada por cálculo incorrecto u otro motivo (requiere permisos)
-- ========================================
