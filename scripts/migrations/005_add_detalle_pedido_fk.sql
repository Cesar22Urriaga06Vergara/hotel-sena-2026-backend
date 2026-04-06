-- FASE 8: Agregar relación Pedido → DetalleFactura
-- Permite vincular detalles de factura con pedidos específicos
-- Facilita sincronización automática de cambios

-- 1. Agregar columna id_pedido
ALTER TABLE `detalle_facturas` 
ADD COLUMN `id_pedido` INT NULL AFTER `id_factura`,
ADD CONSTRAINT `fk_detalle_pedido` 
  FOREIGN KEY (`id_pedido`) REFERENCES `pedidos`(`id`) 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Índice para búsquedas por pedido
CREATE INDEX `idx_detalle_pedido` ON `detalle_facturas`(`id_pedido`);

-- 3. Agregar columna estado para tracking de entrega
ALTER TABLE `detalle_facturas`
ADD COLUMN `estado` ENUM('PENDIENTE', 'ENTREGADO', 'CANCELADO') DEFAULT 'PENDIENTE' AFTER `monto_inc`;

-- 4. Índice para búsquedas por estado
CREATE INDEX `idx_detalle_estado` ON `detalle_facturas`(`estado`);

-- 5. Índice compuesto para búsquedas frecuentes
CREATE INDEX `idx_detalle_factura_estado` ON `detalle_facturas`(`id_factura`, `estado`);
