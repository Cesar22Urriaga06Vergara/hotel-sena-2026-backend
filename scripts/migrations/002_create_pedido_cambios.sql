-- FASE 6: Migration - Crear tabla de auditoría para cambios en pedidos
-- Registra cada transición de estado con usuario, timestamp y motivo
-- Fecha: 5 de abril de 2026

CREATE TABLE IF NOT EXISTS pedido_cambios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  estado_anterior ENUM('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado') NOT NULL,
  estado_nuevo ENUM('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado') NOT NULL,
  usuario_id INT DEFAULT NULL,
  razon_cambio LONGTEXT DEFAULT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES empleados(id) ON DELETE SET NULL,
  
  INDEX idx_pedido (id_pedido),
  INDEX idx_pedido_timestamp (id_pedido, timestamp),
  INDEX idx_timestamp (timestamp),
  INDEX idx_estado_nuevo (estado_nuevo),
  INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- COMMENT for documentation
ALTER TABLE pedido_cambios COMMENT = 'Auditoría de cambios de estado en pedidos de servicios auxiliares (cafeteria, lavanderia, spa, room_service)';
