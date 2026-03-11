-- ============================================
-- Datos de Ejemplo para el Sistema de Habitaciones
-- Hotel SENA 2026
-- ============================================

-- IMPORTANTE: Primero ejecutar crear-tablas-habitaciones.sql

-- Limpiar datos anteriores (en orden inverso por las FK)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `habitaciones`;
TRUNCATE TABLE `tipo_habitacion_amenidades`;
TRUNCATE TABLE `tipos_habitacion`;
TRUNCATE TABLE `amenidades`;
SET FOREIGN_KEY_CHECKS = 1;

-- Insertar Amenidades
INSERT INTO `amenidades` (`nombre`, `icono`, `categoria`, `descripcion`) VALUES
('WiFi Gratis', 'mdi-wifi', 'Tecnología', 'Internet de alta velocidad en toda la habitación'),
('Aire Acondicionado', 'mdi-air-conditioner', 'Comodidad', 'Control de temperatura individual'),
('Televisión', 'mdi-television', 'Entretenimiento', 'TV de pantalla plana con cable'),
('Minibar', 'mdi-fridge', 'Comodidad', 'Refrigerador con bebidas y snacks'),
('Caja Fuerte', 'mdi-safe', 'Servicios básicos', 'Para guardar objetos de valor'),
('Escritorio', 'mdi-desk', 'Comodidad', 'Área de trabajo'),
('Teléfono', 'mdi-phone', 'Servicios básicos', 'Línea telefónica directa'),
('Secador de Pelo', 'mdi-hair-dryer', 'Higiene', 'En el baño'),
('Plancha', 'mdi-iron', 'Servicios básicos', 'Plancha y tabla de planchar'),
('Toallas Premium', 'mdi-spa', 'Higiene', 'Juego completo de toallas de alta calidad'),
('Cama King', 'mdi-bed-king', 'Comodidad', 'Cama tamaño king de lujo'),
('Cama Queen', 'mdi-bed-queen', 'Comodidad', 'Cama tamaño queen'),
('Cama Doble', 'mdi-bed-double', 'Comodidad', 'Dos camas individuales'),
('Cama Sencilla', 'mdi-bed-single', 'Comodidad', 'Cama individual'),
('Balcón', 'mdi-balcony', 'Comodidad', 'Vista al exterior'),
('Vista a la Ciudad', 'mdi-city-variant', 'Comodidad', 'Panorámica urbana'),
('Vista al Mar', 'mdi-waves', 'Comodidad', 'Vista panorámica al océano'),
('Bañera', 'mdi-bathtub', 'Higiene', 'Bañera de hidromasaje'),
('Cafetera', 'mdi-coffee-maker', 'Comodidad', 'Cafetera con café de cortesía'),
('Servicio de Habitaciones', 'mdi-room-service', 'Servicios básicos', 'Disponible 24/7');

-- Insertar Tipos de Habitación
-- Nota: Asumiendo que el id_hotel 1 existe
INSERT INTO `tipos_habitacion` (`id_hotel`, `nombre_tipo`, `descripcion`, `capacidad_personas`, `precio_base`, `activo`) VALUES
(1, 'Habitación Sencilla', 'Habitación cómoda para una persona con todas las comodidades básicas', 1, 80000, 1),
(1, 'Habitación Doble', 'Habitación espaciosa con dos camas individuales', 2, 120000, 1),
(1, 'Habitación Matrimonial', 'Habitación romántica con cama queen', 2, 150000, 1),
(1, 'Suite Junior', 'Suite con sala de estar y cama king', 2, 250000, 1),
(1, 'Suite Ejecutiva', 'Suite premium con área de trabajo y comodidades de lujo', 2, 350000, 1),
(1, 'Suite Presidencial', 'La mejor suite del hotel con todas las amenidades premium', 4, 600000, 1);

-- Relacionar Amenidades con Tipos de Habitación
-- Habitación Sencilla (básica)
INSERT INTO `tipo_habitacion_amenidades` (`id_tipo_habitacion`, `id_amenidad`) VALUES
(1, 1),  -- WiFi
(1, 2),  -- Aire Acondicionado
(1, 3),  -- Televisión
(1, 7),  -- Teléfono
(1, 8),  -- Secador
(1, 14), -- Cama Sencilla
(1, 10); -- Toallas

-- Habitación Doble
INSERT INTO `tipo_habitacion_amenidades` (`id_tipo_habitacion`, `id_amenidad`) VALUES
(2, 1),  -- WiFi
(2, 2),  -- Aire Acondicionado
(2, 3),  -- Televisión
(2, 5),  -- Caja Fuerte
(2, 6),  -- Escritorio
(2, 7),  -- Teléfono
(2, 8),  -- Secador
(2, 13), -- Cama Doble
(2, 10), -- Toallas
(2, 19); -- Cafetera

-- Habitación Matrimonial
INSERT INTO `tipo_habitacion_amenidades` (`id_tipo_habitacion`, `id_amenidad`) VALUES
(3, 1),  -- WiFi
(3, 2),  -- Aire Acondicionado
(3, 3),  -- Televisión
(3, 4),  -- Minibar
(3, 5),  -- Caja Fuerte
(3, 6),  -- Escritorio
(3, 7),  -- Teléfono
(3, 8),  -- Secador
(3, 12), -- Cama Queen
(3, 10), -- Toallas
(3, 15), -- Balcón
(3, 19); -- Cafetera

-- Suite Junior
INSERT INTO `tipo_habitacion_amenidades` (`id_tipo_habitacion`, `id_amenidad`) VALUES
(4, 1),  -- WiFi
(4, 2),  -- Aire Acondicionado
(4, 3),  -- Televisión
(4, 4),  -- Minibar
(4, 5),  -- Caja Fuerte
(4, 6),  -- Escritorio
(4, 7),  -- Teléfono
(4, 8),  -- Secador
(4, 9),  -- Plancha
(4, 11), -- Cama King
(4, 10), -- Toallas
(4, 15), -- Balcón
(4, 16), -- Vista Ciudad
(4, 19), -- Cafetera
(4, 20); -- Room Service

-- Suite Ejecutiva
INSERT INTO `tipo_habitacion_amenidades` (`id_tipo_habitacion`, `id_amenidad`) VALUES
(5, 1),  -- WiFi
(5, 2),  -- Aire Acondicionado
(5, 3),  -- Televisión
(5, 4),  -- Minibar
(5, 5),  -- Caja Fuerte
(5, 6),  -- Escritorio
(5, 7),  -- Teléfono
(5, 8),  -- Secador
(5, 9),  -- Plancha
(5, 11), -- Cama King
(5, 10), -- Toallas
(5, 15), -- Balcón
(5, 16), -- Vista Ciudad
(5, 18), -- Bañera
(5, 19), -- Cafetera
(5, 20); -- Room Service

-- Suite Presidencial (todas las amenidades)
INSERT INTO `tipo_habitacion_amenidades` (`id_tipo_habitacion`, `id_amenidad`) VALUES
(6, 1),  -- WiFi
(6, 2),  -- Aire Acondicionado
(6, 3),  -- Televisión
(6, 4),  -- Minibar
(6, 5),  -- Caja Fuerte
(6, 6),  -- Escritorio
(6, 7),  -- Teléfono
(6, 8),  -- Secador
(6, 9),  -- Plancha
(6, 11), -- Cama King
(6, 10), -- Toallas
(6, 15), -- Balcón
(6, 17), -- Vista Mar
(6, 18), -- Bañera
(6, 19), -- Cafetera
(6, 20); -- Room Service

-- Insertar Habitaciones de ejemplo
-- Piso 1
INSERT INTO `habitaciones` (`id_hotel`, `numero_habitacion`, `piso`, `estado`, `id_tipo_habitacion`) VALUES
(1, '101', '1', 'disponible', 1),
(1, '102', '1', 'disponible', 1),
(1, '103', '1', 'disponible', 2),
(1, '104', '1', 'ocupada', 2),
(1, '105', '1', 'disponible', 3);

-- Piso 2
INSERT INTO `habitaciones` (`id_hotel`, `numero_habitacion`, `piso`, `estado`, `id_tipo_habitacion`) VALUES
(1, '201', '2', 'disponible', 3),
(1, '202', '2', 'limpieza', 3),
(1, '203', '2', 'disponible', 4),
(1, '204', '2', 'disponible', 4);

-- Piso 3
INSERT INTO `habitaciones` (`id_hotel`, `numero_habitacion`, `piso`, `estado`, `id_tipo_habitacion`) VALUES
(1, '301', '3', 'disponible', 5),
(1, '302', '3', 'mantenimiento', 5),
(1, '303', '3', 'disponible', 6);

-- ============================================
-- Fin de los datos de ejemplo
-- ============================================
