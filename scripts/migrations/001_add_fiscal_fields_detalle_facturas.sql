-- ============================================================================
-- Migración: Agregar campos fiscales y categoría a detalle_facturas
-- Fecha: 2026-04-05
-- Descripción: 
--   - Agrega campo categoria_nombre para desnormalización histórica
--   - Agrega campo monto_iva para almacenar el IVA calculado por línea
-- ============================================================================

USE hotel_management;

-- Agregar campo categoria_nombre (desnormalizado para integridad histórica)
ALTER TABLE detalle_facturas
ADD COLUMN categoria_nombre VARCHAR(100) NULL AFTER categoria_servicios_id;

-- Agregar campo monto_iva (impuesto IVA calculado para el detalle)
ALTER TABLE detalle_facturas
ADD COLUMN monto_iva DECIMAL(12, 2) DEFAULT 0.00 NOT NULL AFTER total;

-- Comentarios descriptivos
ALTER TABLE detalle_facturas
MODIFY COLUMN categoria_nombre VARCHAR(100) NULL 
COMMENT 'Nombre de la categoría (desnormalizado para preservar histórico)';

ALTER TABLE detalle_facturas
MODIFY COLUMN monto_iva DECIMAL(12, 2) DEFAULT 0.00 NOT NULL 
COMMENT 'Monto de IVA aplicado a esta línea de detalle';

-- Verificar estructura actualizada
DESCRIBE detalle_facturas;

-- ============================================================================
-- Notas:
-- - categoria_nombre se guarda al momento de generar la factura
-- - monto_iva se calcula usando ImpuestoService.calculateLineaImpuestos()
-- - Facturas antiguas tendrán NULL en categoria_nombre (backward compatible)
-- ============================================================================
