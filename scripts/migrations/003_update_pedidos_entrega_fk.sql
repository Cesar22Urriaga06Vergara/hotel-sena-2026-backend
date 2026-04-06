-- FASE 6: Migration - Actualizar tabla pedidos con fechaEntrega y FK a empleados
-- Fecha: 5 de abril de 2026

-- Agregar columna fechaEntrega
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS fecha_entrega DATETIME DEFAULT NULL COMMENT 'Hora de entrega registrada' AFTER id_empleado_atiende;

-- Agregar índice para fecha_entrega para consultas de KPI
ALTER TABLE pedidos
ADD INDEX IF NOT EXISTS idx_fecha_entrega (fecha_entrega);

-- Agregar Foreign Key a empleados (si no existe)
-- Comentario: id_empleado_atiende debe referenciar empleados.id
ALTER TABLE pedidos
ADD CONSTRAINT fk_pedidos_empleado FOREIGN KEY (id_empleado_atiende) 
REFERENCES empleados(id) ON DELETE SET NULL;

-- Agregar índice compound para KPIs
ALTER TABLE pedidos
ADD INDEX IF NOT EXISTS idx_empleado_fecha (id_empleado_atiende, fecha_entrega);

-- Comentarios de documentación
ALTER TABLE pedidos COMMENT = 'Pedidos de servicios auxiliares con auditoría de cambios en pedido_cambios';
ALTER TABLE pedidos MODIFY COLUMN fecha_entrega DATETIME COMMENT 'Timestamp cuando el pedido fue entregado al cliente';
