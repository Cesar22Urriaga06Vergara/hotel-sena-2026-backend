-- FASE 8: Crear tabla de auditoría para cambios en detalles de factura
-- Registra cada cambio de estado, cantidad, monto, precio
-- Cumplimiento: Trazabilidad completa para SENA

CREATE TABLE `detalle_factura_cambios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_detalle` INT NOT NULL,
  `tipo_cambio` ENUM(
    'CAMBIO_ESTADO',
    'CAMBIO_MONTO',
    'CAMBIO_CANTIDAD',
    'CREACION',
    'ELIMINACION'
  ) NOT NULL,
  `descripcion` LONGTEXT NOT NULL,
  `valor_anterior` JSON NULL,
  `valor_nuevo` JSON NULL,
  `usuario_id` INT NULL,
  `fecha` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT `fk_detalle_cambios_detalle` 
    FOREIGN KEY (`id_detalle`) REFERENCES `detalle_facturas`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  
  CONSTRAINT `fk_detalle_cambios_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `empleados`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para auditoría eficiente
CREATE INDEX `idx_detalle_cambios_detalle` ON `detalle_factura_cambios`(`id_detalle`);
CREATE INDEX `idx_detalle_cambios_fecha` ON `detalle_factura_cambios`(`fecha`);
CREATE INDEX `idx_detalle_cambios_tipo` ON `detalle_factura_cambios`(`tipo_cambio`);
CREATE INDEX `idx_detalle_cambios_detalle_fecha` ON `detalle_factura_cambios`(`id_detalle`, `fecha`);
