-- Tabla de servicios
CREATE TABLE IF NOT EXISTS servicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_hotel INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  categoria ENUM('cafeteria','lavanderia','spa','room_service','minibar','otros') NOT NULL DEFAULT 'otros',
  precio_unitario DECIMAL(12,2) NOT NULL,
  unidad_medida VARCHAR(50) DEFAULT 'unidad',
  imagen_url VARCHAR(500),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  disponible_delivery BOOLEAN NOT NULL DEFAULT TRUE,
  disponible_recogida BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_servicios_hotel (id_hotel),
  INDEX idx_servicios_categoria (categoria)
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_reserva INT NOT NULL,
  id_cliente INT NOT NULL,
  id_hotel INT NOT NULL,
  tipo_entrega ENUM('delivery','recogida') NOT NULL DEFAULT 'delivery',
  estado_pedido ENUM('pendiente','en_preparacion','listo','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  categoria VARCHAR(50) NOT NULL,
  nota_cliente TEXT,
  nota_empleado TEXT,
  id_empleado_atiende INT,
  total_pedido DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pedidos_reserva FOREIGN KEY (id_reserva) REFERENCES reservas(id) ON DELETE RESTRICT,
  INDEX idx_pedidos_reserva (id_reserva),
  INDEX idx_pedidos_hotel (id_hotel),
  INDEX idx_pedidos_estado (estado_pedido),
  INDEX idx_pedidos_categoria (categoria)
);

-- Tabla de items del pedido
CREATE TABLE IF NOT EXISTS pedido_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  id_servicio INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario_snapshot DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  nombre_servicio_snapshot VARCHAR(150) NOT NULL,
  observacion VARCHAR(300),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pedido_items_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_pedido_items_servicio FOREIGN KEY (id_servicio) REFERENCES servicios(id) ON DELETE RESTRICT
);
