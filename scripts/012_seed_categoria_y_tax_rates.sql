-- ========================================
-- SEED: Categorías de Servicios y Tasas de Impuestos
-- ========================================
-- Fecha: 2026-03-19
-- Descripción: 
--   Insertar categorías estándar colombianas y tasas por defecto
--   Asume que el hotel con ID 1 existe (Hotel Sena)
-- ========================================

-- 1. Insertar categorías de servicios estándar colombianas
INSERT INTO `categoria_servicios` (`id_hotel`, `nombre`, `descripcion`, `codigo`, `activa`) VALUES
  (1, 'Alojamiento', 'Hospedaje en habitaciones del hotel', 'ALOJAMIENTO', TRUE),
  (1, 'Restaurante/Cafetería', 'Servicios de comidas y bebidas', 'RESTAURANTE', TRUE),
  (1, 'Minibar/Tienda', 'Minibar, tienda y productos básicos', 'MINIBAR', TRUE),
  (1, 'Lavandería', 'Servicios de lavado y planchado', 'LAVANDERIA', TRUE),
  (1, 'Spa', 'Servicios de bienestar y masajes', 'SPA', TRUE),
  (1, 'Room Service', 'Servicio a habitación (comidas, etc.)', 'ROOM_SERVICE', TRUE),
  (1, 'Transporte', 'Transporte y traslados', 'TRANSPORTE', TRUE),
  (1, 'Tours', 'Tours y excursiones', 'TOURS', TRUE),
  (1, 'Eventos', 'Salonería, salones para eventos', 'EVENTOS', TRUE),
  (1, 'Mantenimiento', 'Servicios internos de mantenimiento', 'MANTENIMIENTO', TRUE);

-- 2. Insertar tasas de impuestos para Alojamiento (IVA 19% para residentes, 0% para extranjeros)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 1, 'IVA', 19.00, 'IVA Alojamiento - Residentes', TRUE, FALSE, TRUE),
  (1, 1, 'IVA', 0.00, 'IVA Alojamiento - Extranjeros no residentes', FALSE, TRUE, TRUE);

-- 3. Insertar tasas para Restaurante/Cafetería (INC 8% para todos)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 2, 'INC', 8.00, 'INC Restaurante/Cafetería - Impuesto Nacional al Consumo', TRUE, TRUE, TRUE);

-- 4. Insertar tasas para Minibar (IVA 19% estándar, 0% para productos básicos)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 3, 'IVA', 19.00, 'IVA Minibar - Productos normales (19%)', TRUE, TRUE, TRUE),
  (1, 3, 'IVA', 0.00, 'IVA Minibar - Productos básicos excluidos (0%)', TRUE, TRUE, TRUE);

-- 5. Insertar tasas para Lavandería (IVA 19%)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 4, 'IVA', 19.00, 'IVA Lavandería (19%)', TRUE, TRUE, TRUE);

-- 6. Insertar tasas para Spa (IVA 19%)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 5, 'IVA', 19.00, 'IVA Spa - Servicios de bienestar (19%)', TRUE, TRUE, TRUE);

-- 7. Insertar tasas para Room Service (IVA 19% o INC 8% según si incluye bebidas)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 6, 'IVA', 19.00, 'IVA Room Service - Comidas sólidas (19%)', TRUE, TRUE, TRUE),
  (1, 6, 'INC', 8.00, 'INC Room Service - Bebidas alcohólicas/no alcohólicas (8%)', TRUE, TRUE, TRUE);

-- 8. Insertar tasas para Transporte (IVA 19%)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 7, 'IVA', 19.00, 'IVA Transporte - Traslados (19%)', TRUE, TRUE, TRUE);

-- 9. Insertar tasas para Tours (IVA 19%)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 8, 'IVA', 19.00, 'IVA Tours - Excursiones (19%)', TRUE, TRUE, TRUE);

-- 10. Insertar tasas para Eventos (IVA 19%)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 9, 'IVA', 19.00, 'IVA Eventos - Salonería (19%)', TRUE, TRUE, TRUE);

-- 11. Insertar tasas para Mantenimiento (Excluido/0% - servicio interno)
INSERT INTO `tax_rates` (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`) VALUES
  (1, 10, 'IVA', 0.00, 'Mantenimiento - Servicio interno (No aplica impuesto)', TRUE, TRUE, TRUE);

-- ========================================
-- Notas sobre las tasas:
--
-- ALOJAMIENTO:
-- - Residentes: 19% IVA (según Art. 426-1 Estatuto Tributario)
-- - Extranjeros No Residentes: 0% IVA (Decreto 297 de 2016)
-- 
-- RESTAURANTE/CAFETERÍA:
-- - Todos: 8% INC (Impuesto Nacional al Consumo, Art. 512-1 E.T.)
-- - No es IVA, es en adición a impuestos
-- 
-- MINIBAR/TIENDA:
-- - Productos Normales: 19% IVA
-- - Productos Básicos: 0% IVA (alimentos esenciales)
-- 
-- OTROS SERVICIOS (Lavandería, Spa, Room Service, Transporte, Tours, Eventos):
-- - Estándar: 19% IVA
-- 
-- MANTENIMIENTO:
-- - 0% (Servicio interno, no aplica)
-- 
-- RESIDENCIA:
-- - Si cliente tiene tax_profile = FOREIGN_TOURIST:
--   * ALOJAMIENTO: usa tasa 0% IVA
--   * Otros servicios: usan tasas normales (19% IVA, 8% INC, etc.)
-- 
-- - Si cliente tiene tax_profile = RESIDENT:
--   * Todos: usan tasas normales (19% IVA, 8% INC, etc.)
-- ========================================
