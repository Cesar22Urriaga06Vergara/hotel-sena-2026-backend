-- FASE 7: Migration - Crear tabla de auditoría para cambios en facturas
-- Registra cambios de estado, monto, cliente para cumplimiento tributario
-- Fecha: 5 de abril de 2026

CREATE TABLE IF NOT EXISTS factura_cambios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_factura INT NOT NULL,
  tipo_cambio ENUM('CAMBIO_ESTADO', 'CAMBIO_MONTO', 'CAMBIO_CLIENTE', 'CREACION') NOT NULL,
  descripcion LONGTEXT NOT NULL,
  valor_anterior JSON DEFAULT NULL,
  valor_nuevo JSON DEFAULT NULL,
  usuario_id INT DEFAULT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_factura) REFERENCES facturas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES empleados(id) ON DELETE SET NULL,
  
  INDEX idx_factura (id_factura),
  INDEX idx_fecha (fecha),
  INDEX idx_factura_fecha (id_factura, fecha),
  INDEX idx_tipo_cambio (tipo_cambio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- COMMENT for documentation
ALTER TABLE factura_cambios COMMENT = 'Auditoría de cambios en facturas para cum plimiento tributario SENA. Registra cambios de estado, monto, cliente.';
