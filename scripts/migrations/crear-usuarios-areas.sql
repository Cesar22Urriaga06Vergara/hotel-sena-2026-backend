-- ========================================
-- Script de creación de usuarios por área
-- Fecha: 2026-04-05
-- Contraseña para todos: 123456789
-- Hash bcrypt: $2b$10$NXVLWoOYQJ2ydkrSLTPWMOljida0nAXDtXymq8dg2AbSoqci42eI6
-- ========================================

USE hotel;

-- Usuario para Lavandería
INSERT INTO `empleados` (
  `id_hotel`, `cedula`, `nombre`, `apellido`, `email`, `password`, 
  `rol`, `tax_profile`, `estado`, `createdAt`, `updatedAt`
) VALUES (
  1, '300000001', 'Empleado', 'Lavandería', 'lavanderia@gmail.com',
  '$2b$10$NXVLWoOYQJ2ydkrSLTPWMOljida0nAXDtXymq8dg2AbSoqci42eI6',
  'lavanderia', 'RESIDENT', 'activo', NOW(), NOW()
);

-- Usuario para Spa
INSERT INTO `empleados` (
  `id_hotel`, `cedula`, `nombre`, `apellido`, `email`, `password`, 
  `rol`, `tax_profile`, `estado`, `createdAt`, `updatedAt`
) VALUES (
  1, '300000002', 'Empleado', 'Spa', 'spa@gmail.com',
  '$2b$10$NXVLWoOYQJ2ydkrSLTPWMOljida0nAXDtXymq8dg2AbSoqci42eI6',
  'spa', 'RESIDENT', 'activo', NOW(), NOW()
);

-- Usuario para Room Service
INSERT INTO `empleados` (
  `id_hotel`, `cedula`, `nombre`, `apellido`, `email`, `password`, 
  `rol`, `tax_profile`, `estado`, `createdAt`, `updatedAt`
) VALUES (
  1, '300000003', 'Empleado', 'Room Service', 'roomservice@gmail.com',
  '$2b$10$NXVLWoOYQJ2ydkrSLTPWMOljida0nAXDtXymq8dg2AbSoqci42eI6',
  'room_service', 'RESIDENT', 'activo', NOW(), NOW()
);

-- Usuario para Minibar/Tienda
INSERT INTO `empleados` (
  `id_hotel`, `cedula`, `nombre`, `apellido`, `email`, `password`, 
  `rol`, `tax_profile`, `estado`, `createdAt`, `updatedAt`
) VALUES (
  1, '300000004', 'Empleado', 'Minibar', 'minibar@gmail.com',
  '$2b$10$NXVLWoOYQJ2ydkrSLTPWMOljida0nAXDtXymq8dg2AbSoqci42eI6',
  'minibar', 'RESIDENT', 'activo', NOW(), NOW()
);

-- Usuario para Transporte
INSERT INTO `empleados` (
  `id_hotel`, `cedula`, `nombre`, `apellido`, `email`, `password`, 
  `rol`, `tax_profile`, `estado`, `createdAt`, `updatedAt`
) VALUES (
  1, '300000005', 'Empleado', 'Transporte', 'transporte@gmail.com',
  '$2b$10$NXVLWoOYQJ2ydkrSLTPWMOljida0nAXDtXymq8dg2AbSoqci42eI6',
  'transporte', 'RESIDENT', 'activo', NOW(), NOW()
);

-- Usuario para Tours
INSERT INTO `empleados` (
  `id_hotel`, `cedula`, `nombre`, `apellido`, `email`, `password`, 
  `rol`, `tax_profile`, `estado`, `createdAt`, `updatedAt`
) VALUES (
  1, '300000006', 'Empleado', 'Tours', 'tours@gmail.com',
  '$2b$10$NXVLWoOYQJ2ydkrSLTPWMOljida0nAXDtXymq8dg2AbSoqci42eI6',
  'tours', 'RESIDENT', 'activo', NOW(), NOW()
);

-- Usuario para Eventos
INSERT INTO `empleados` (
  `id_hotel`, `cedula`, `nombre`, `apellido`, `email`, `password`, 
  `rol`, `tax_profile`, `estado`, `createdAt`, `updatedAt`
) VALUES (
  1, '300000007', 'Empleado', 'Eventos', 'eventos@gmail.com',
  '$2b$10$NXVLWoOYQJ2ydkrSLTPWMOljida0nAXDtXymq8dg2AbSoqci42eI6',
  'eventos', 'RESIDENT', 'activo', NOW(), NOW()
);

-- Usuario para Mantenimiento
INSERT INTO `empleados` (
  `id_hotel`, `cedula`, `nombre`, `apellido`, `email`, `password`, 
  `rol`, `tax_profile`, `estado`, `createdAt`, `updatedAt`
) VALUES (
  1, '300000008', 'Empleado', 'Mantenimiento', 'mantenimiento@gmail.com',
  '$2b$10$NXVLWoOYQJ2ydkrSLTPWMOljida0nAXDtXymq8dg2AbSoqci42eI6',
  'mantenimiento', 'RESIDENT', 'activo', NOW(), NOW()
);

-- Verificar inserción de todos los usuarios
SELECT id, cedula, nombre, apellido, email, rol, estado 
FROM empleados 
WHERE email IN (
  'lavanderia@gmail.com', 'spa@gmail.com', 'roomservice@gmail.com',
  'minibar@gmail.com', 'transporte@gmail.com', 'tours@gmail.com',
  'eventos@gmail.com', 'mantenimiento@gmail.com'
)
ORDER BY rol;

-- Resumen de usuarios por rol
SELECT rol, COUNT(*) as total
FROM empleados
WHERE estado = 'activo'
GROUP BY rol
ORDER BY rol;
