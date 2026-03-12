-- Script de seed para servicios de ejemplo
-- Insertar servicios de Cafetería
INSERT IGNORE INTO servicios (id_hotel, nombre, descripcion, categoria, precio_unitario, unidad_medida, disponible_delivery, disponible_recogida) VALUES
(1, 'Café Expreso', 'Café expreso de alta calidad', 'cafeteria', 15000, 'taza', true, true),
(1, 'Cappuccino', 'Cappuccino cremoso con leche', 'cafeteria', 18000, 'taza', true, true),
(1, 'Latte', 'Café con leche suave', 'cafeteria', 16000, 'taza', true, true),
(1, 'Té Caliente', 'Variado de tés premium', 'cafeteria', 12000, 'taza', true, true),
(1, 'Desayuno Continental', 'Pan, frutas y queso', 'cafeteria', 35000, 'porción', true, false);

-- Insertar servicios de Lavandería
INSERT IGNORE INTO servicios (id_hotel, nombre, descripcion, categoria, precio_unitario, unidad_medida, disponible_delivery, disponible_recogida) VALUES
(1, 'Lavado y Planchado de Ropa', 'Servicio estándar de lavandería', 'lavanderia', 50000, 'kg', true, true),
(1, 'Servicio Express', 'Lavado rápido (4 horas)', 'lavanderia', 75000, 'kg', true, false),
(1, 'Limpieza de Trajes', 'Servicio especializado para trajes', 'lavanderia', 40000, 'prenda', false, true),
(1, 'Planchado de Camisas', 'Planchado impecable', 'lavanderia', 8000, 'prenda', true, true);

-- Insertar servicios de Room Service
INSERT IGNORE INTO servicios (id_hotel, nombre, descripcion, categoria, precio_unitario, unidad_medida, disponible_delivery, disponible_recogida) VALUES
(1, 'Almuerzo Ejecutivo', 'Menú del día con bebida', 'room_service', 45000, 'bandeja', true, false),
(1, 'Cena Especial', 'Plato principal a elegir', 'room_service', 60000, 'bandeja', true, false),
(1, 'Bebidas Variadas', 'Refrescos, jugos y bebidas frías', 'room_service', 8000, 'unidad', true, false);

-- Insertar servicios de Spa
INSERT IGNORE INTO servicios (id_hotel, nombre, descripcion, categoria, precio_unitario, unidad_medida, disponible_delivery, disponible_recogida) VALUES
(1, 'Masaje Relajante', 'Masaje corporal de 60 minutos', 'spa', 120000, 'sesión', false, true),
(1, 'Facial Rejuvenecedor', 'Tratamiento facial premium', 'spa', 100000, 'sesión', false, true),
(1, 'Sauna', 'Acceso a sauna privada', 'spa', 30000, 'sesión', false, true);
