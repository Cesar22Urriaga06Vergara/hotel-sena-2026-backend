-- Script de seed para servicios de ejemplo
-- Insertar servicios de Cafetería
INSERT IGNORE INTO servicios (id_hotel, nombre, descripcion, categoria, precio_unitario, unidad_medida, disponible_delivery, disponible_recogida, activo) VALUES
(1, 'Café Expreso', 'Café expreso de alta calidad', 'cafeteria', 15000, 'taza', 1, 1, 1),
(1, 'Cappuccino', 'Cappuccino cremoso con leche', 'cafeteria', 18000, 'taza', 1, 1, 1),
(1, 'Latte', 'Café con leche suave', 'cafeteria', 16000, 'taza', 1, 1, 1),
(1, 'Té Caliente', 'Variado de tés premium', 'cafeteria', 12000, 'taza', 1, 1, 1),
(1, 'Desayuno Continental', 'Pan, frutas y queso', 'cafeteria', 35000, 'porción', 1, 0, 1);

-- Insertar servicios de Lavandería
INSERT IGNORE INTO servicios (id_hotel, nombre, descripcion, categoria, precio_unitario, unidad_medida, disponible_delivery, disponible_recogida, activo) VALUES
(1, 'Lavado y Planchado de Ropa', 'Servicio estándar de lavandería', 'lavanderia', 50000, 'kg', 1, 1, 1),
(1, 'Servicio Express', 'Lavado rápido (4 horas)', 'lavanderia', 75000, 'kg', 1, 0, 1),
(1, 'Limpieza de Trajes', 'Servicio especializado para trajes', 'lavanderia', 40000, 'prenda', 0, 1, 1),
(1, 'Planchado de Camisas', 'Planchado impecable', 'lavanderia', 8000, 'prenda', 1, 1, 1);

-- Insertar servicios de Room Service
INSERT IGNORE INTO servicios (id_hotel, nombre, descripcion, categoria, precio_unitario, unidad_medida, disponible_delivery, disponible_recogida, activo) VALUES
(1, 'Almuerzo Ejecutivo', 'Menú del día con bebida', 'room_service', 45000, 'bandeja', 1, 0, 1),
(1, 'Cena Especial', 'Plato principal a elegir', 'room_service', 60000, 'bandeja', 1, 0, 1),
(1, 'Bebidas Variadas', 'Refrescos, jugos y bebidas frías', 'room_service', 8000, 'unidad', 1, 0, 1);

-- Insertar servicios de Spa
INSERT IGNORE INTO servicios (id_hotel, nombre, descripcion, categoria, precio_unitario, unidad_medida, disponible_delivery, disponible_recogida, activo) VALUES
(1, 'Masaje Relajante', 'Masaje corporal de 60 minutos', 'spa', 120000, 'sesión', 0, 1, 1),
(1, 'Facial Rejuvenecedor', 'Tratamiento facial premium', 'spa', 100000, 'sesión', 0, 1, 1),
(1, 'Sauna', 'Acceso a sauna privada', 'spa', 30000, 'sesión', 0, 1, 1);

