-- ========================================
-- MIGRACIÓN 012: Mapear Servicios Existentes a Nuevas Categorías
-- ========================================
-- Fecha: 2026-03-19
-- Descripción: 
--   Mapear servicios existentes a la nueva tabla categoria_servicios
--   Esto garantiza que los servicios heredados sigan funcionando
-- ========================================

-- 1. Mapear servicios existentes CAFETERIA → Restaurante
UPDATE `servicios` 
SET `categoria_servicios_id` = 2
WHERE `categoria` = 'cafeteria' 
  AND `categoria_servicios_id` IS NULL;

-- 2. Mapear servicios existentes LAVANDERIA → Lavandería
UPDATE `servicios` 
SET `categoria_servicios_id` = 4
WHERE `categoria` = 'lavanderia' 
  AND `categoria_servicios_id` IS NULL;

-- 3. Mapear servicios existentes SPA → Spa
UPDATE `servicios` 
SET `categoria_servicios_id` = 5
WHERE `categoria` = 'spa' 
  AND `categoria_servicios_id` IS NULL;

-- 4. Mapear servicios existentes ROOM_SERVICE → Room Service
UPDATE `servicios` 
SET `categoria_servicios_id` = 6
WHERE `categoria` = 'room_service' 
  AND `categoria_servicios_id` IS NULL;

-- 5. Mapear servicios existentes MINIBAR → Minibar/Tienda
UPDATE `servicios` 
SET `categoria_servicios_id` = 3
WHERE `categoria` = 'minibar' 
  AND `categoria_servicios_id` IS NULL;

-- 6. Mapear servicios existentes OTROS → según nombre/descripción
-- Si contiene 'transporte': Tours (ID 7)
UPDATE `servicios` 
SET `categoria_servicios_id` = 7
WHERE `categoria` = 'otros' 
  AND LOWER(`nombre`) LIKE '%transporte%'
  AND `categoria_servicios_id` IS NULL;

-- Si contiene 'tour': Tours (ID 8)
UPDATE `servicios` 
SET `categoria_servicios_id` = 8
WHERE `categoria` = 'otros' 
  AND LOWER(`nombre`) LIKE '%tour%'
  AND `categoria_servicios_id` IS NULL;

-- Si contiene 'evento': Eventos (ID 9)
UPDATE `servicios` 
SET `categoria_servicios_id` = 9
WHERE `categoria` = 'otros' 
  AND LOWER(`nombre`) LIKE '%evento%'
  AND `categoria_servicios_id` IS NULL;

-- 7. Mapear resto de OTROS a Otros Servicios por defecto (ID 5 - Spa como default)
UPDATE `servicios` 
SET `categoria_servicios_id` = 5
WHERE `categoria` = 'otros' 
  AND `categoria_servicios_id` IS NULL;

-- 8. Asignar la categoría ALOJAMIENTO a todas las habitaciones
UPDATE `tipos_habitacion` 
SET `categoria_servicios_id` = 1
WHERE `categoria_servicios_id` IS NULL;

-- 9. Verificación: mostrar servicios que aún no tienen categoria_servicios_id asignada
-- NOTA: Si hay resultados, revisar y asignar manualmente
SELECT `id`, `nombre`, `categoria`, `categoria_servicios_id`
FROM `servicios`
WHERE `categoria_servicios_id` IS NULL
LIMIT 10;

-- 10. Verificación: mostrar habitaciones sin categoria_servicios_id
SELECT `id`, `nombre_tipo`, `categoria_servicios_id`
FROM `tipos_habitacion`
WHERE `categoria_servicios_id` IS NULL
LIMIT 10;

-- ========================================
-- Nota: 
-- Si después de ejecutar estas queries hay servicios o habitaciones sin 
-- categoria_servicios_id asignada, se recomienda revisar manualmente
-- y asignar la categoría apropiada usando:
-- 
-- UPDATE servicios SET categoria_servicios_id = X WHERE id = Y;
-- UPDATE tipo_habitacion SET categoria_servicios_id = X WHERE id = Y;
-- ========================================
