-- ============================================================================
-- Migration 000: Initial Schema
-- Project:     Hotel Sena 2026 Backend
-- Database:    MySQL / MariaDB
-- Charset:     utf8mb4 / utf8mb4_general_ci
-- Created:     2026-01-01
--
-- Description:
--   Creates the complete database schema for the hotel management system.
--   Includes all 14 core tables plus supporting audit/change-tracking tables,
--   performance indexes, foreign key constraints, and initial seed data.
--
-- Tables created (core – 14):
--   1.  hoteles                      – Hotels
--   2.  clientes                     – Clients / guests
--   3.  empleados                    – Employees
--   4.  amenidades                   – Room amenities
--   5.  tipos_habitacion             – Room types
--   6.  tipo_habitacion_amenidades   – Room-type ↔ amenity junction
--   7.  habitaciones                 – Individual rooms
--   8.  reservas                     – Reservations
--   9.  medios_pago                  – Payment methods
--   10. facturas                     – Invoices
--   11. detalle_facturas             – Invoice line items
--   12. pagos                        – Payments
--   13. servicios                    – Hotel services (spa, laundry, etc.)
--   14. refresh_tokens               – JWT refresh tokens
--
-- Tables created (supporting):
--   categoria_servicios              – Service categories
--   pedidos                          – Service orders
--   pedido_items                     – Order line items
--   pedido_cambios                   – Order state-change audit
--   factura_cambios                  – Invoice change audit
--   detalle_factura_cambios          – Invoice-line change audit
--   folios                           – Room folios
--   room_incidents                   – Room incidents / maintenance
--   tax_rates                        – Tax rates per category
--   tax_rates_audit                  – Tax-rate change audit
--   tax_profile_audit                – Client/employee tax-profile audit
--   audit_logs                       – General operation audit log
--
-- Seed data:
--   - 7  payment methods (efectivo, tarjeta_credito, tarjeta_debito,
--         transferencia_bancaria, nequi, daviplata, pse)
--   - 10 amenities (WiFi, Aire acondicionado, Televisor, Baño privado,
--         Caja fuerte, Escritorio, Closet, Balcón, Jacuzzi, Sala)
--   - 1  hotel  (Hotel Sena 2026)
--
-- Usage:
--   mysql -u <user> -p <database> < 000_initial_schema.sql
--   (or run via your preferred MySQL client)
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================================================
-- 1. hoteles
-- ============================================================================
CREATE TABLE IF NOT EXISTS `hoteles` (
  `id`            INT(11)       NOT NULL AUTO_INCREMENT,
  `nombre`        VARCHAR(100)  NOT NULL,
  `nit`           VARCHAR(20)   NOT NULL,
  `direccion`     VARCHAR(200)  DEFAULT NULL,
  `ciudad`        VARCHAR(100)  DEFAULT NULL,
  `pais`          VARCHAR(100)  DEFAULT NULL,
  `telefono`      VARCHAR(20)   DEFAULT NULL,
  `email`         VARCHAR(100)  DEFAULT NULL,
  `estrellas`     INT(11)       DEFAULT NULL,
  `descripcion`   TEXT          DEFAULT NULL,
  `estado`        ENUM('activo','suspendido') NOT NULL DEFAULT 'activo',
  `fecha_registro` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt`     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt`     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_hoteles_nit` (`nit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Hotels registered in the system';

-- ============================================================================
-- 2. clientes
-- ============================================================================
CREATE TABLE IF NOT EXISTS `clientes` (
  `id`                          INT(11)      NOT NULL AUTO_INCREMENT,
  `cedula`                      VARCHAR(255) NOT NULL,
  `nombre`                      VARCHAR(255) NOT NULL,
  `apellido`                    VARCHAR(255) NOT NULL,
  `email`                       VARCHAR(255) NOT NULL,
  `password`                    VARCHAR(255) NOT NULL,
  `telefono`                    VARCHAR(255) DEFAULT NULL,
  `tipoDocumento`               VARCHAR(255) DEFAULT NULL,
  `rol`                         VARCHAR(255) NOT NULL DEFAULT 'cliente',
  `direccion`                   VARCHAR(255) DEFAULT NULL,
  `paisNacionalidad`            VARCHAR(255) DEFAULT NULL,
  `paisResidencia`              VARCHAR(255) DEFAULT NULL,
  `idiomaPreferido`             VARCHAR(255) DEFAULT NULL,
  `fechaNacimiento`             DATETIME     DEFAULT NULL,
  `tipoVisa`                    VARCHAR(255) DEFAULT NULL,
  `numeroVisa`                  VARCHAR(255) DEFAULT NULL,
  `visaExpira`                  DATETIME     DEFAULT NULL,
  `tax_profile`                 ENUM('RESIDENT','FOREIGN_TOURIST','ENTITY') NOT NULL DEFAULT 'RESIDENT',
  `tipo_documento_estandar`     VARCHAR(50)  DEFAULT NULL,
  `documento_validado`          TINYINT(1)   NOT NULL DEFAULT 0,
  `fecha_validacion_documento`  DATETIME     DEFAULT NULL,
  `validado_por_usuario_id`     INT(11)      DEFAULT NULL,
  `googleId`                    VARCHAR(255) DEFAULT NULL,
  `photoUrl`                    VARCHAR(255) DEFAULT NULL,
  `authProvider`                VARCHAR(255) NOT NULL DEFAULT 'local',
  `fecha_registro`              DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt`                   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt`                   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at`                  DATETIME     DEFAULT NULL,
  `deleted_by`                  INT(11)      DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_clientes_cedula`    (`cedula`),
  UNIQUE KEY `IDX_clientes_email`     (`email`),
  UNIQUE KEY `IDX_clientes_googleId`  (`googleId`),
  KEY `IDX_clientes_tax_profile`                  (`tax_profile`),
  KEY `IDX_clientes_documento_validado_tax`        (`documento_validado`, `tax_profile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Hotel guests and registered clients';

-- ============================================================================
-- 3. empleados
-- ============================================================================
CREATE TABLE IF NOT EXISTS `empleados` (
  `id`          INT(11)      NOT NULL AUTO_INCREMENT,
  `id_hotel`    INT(11)      DEFAULT NULL COMMENT 'NULL for superadmin (no hotel assigned)',
  `cedula`      VARCHAR(255) NOT NULL,
  `nombre`      VARCHAR(255) NOT NULL,
  `apellido`    VARCHAR(255) NOT NULL,
  `email`       VARCHAR(255) NOT NULL,
  `password`    VARCHAR(255) NOT NULL,
  `rol`         VARCHAR(255) NOT NULL COMMENT 'recepcionista, admin, superadmin, cafeteria, etc.',
  `tax_profile` ENUM('RESIDENT','FOREIGN_TOURIST','ENTITY') NOT NULL DEFAULT 'RESIDENT',
  `estado`      VARCHAR(255) NOT NULL DEFAULT 'activo' COMMENT 'activo | inactivo',
  `createdAt`   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt`   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at`  DATETIME     DEFAULT NULL,
  `deleted_by`  INT(11)      DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_empleados_cedula`       (`cedula`),
  UNIQUE KEY `IDX_empleados_email`        (`email`),
  KEY `IDX_empleados_tax_profile`         (`tax_profile`),
  KEY `IDX_empleados_id_hotel`            (`id_hotel`),
  CONSTRAINT `FK_empleados_hotel`
    FOREIGN KEY (`id_hotel`) REFERENCES `hoteles` (`id`)
    ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Hotel staff and system users';

-- ============================================================================
-- 4. amenidades
-- ============================================================================
CREATE TABLE IF NOT EXISTS `amenidades` (
  `id`          INT(11)      NOT NULL AUTO_INCREMENT,
  `nombre`      VARCHAR(255) NOT NULL,
  `icono`       VARCHAR(255) DEFAULT NULL,
  `categoria`   VARCHAR(255) DEFAULT NULL,
  `descripcion` TEXT         DEFAULT NULL,
  `created_at`  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at`  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_amenidades_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Room amenities (WiFi, AC, TV, etc.)';

-- ============================================================================
-- 5. categoria_servicios  (required before tipos_habitacion and servicios)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `categoria_servicios` (
  `id`          INT(11)      NOT NULL AUTO_INCREMENT,
  `id_hotel`    INT(11)      NOT NULL,
  `nombre`      VARCHAR(100) NOT NULL,
  `descripcion` TEXT         DEFAULT NULL,
  `codigo`      VARCHAR(50)  NOT NULL,
  `activa`      TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at`  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at`  DATETIME     DEFAULT NULL,
  `deleted_by`  INT(11)      DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_categoria_servicios_codigo` (`codigo`),
  KEY `IDX_categoria_servicios_hotel`  (`id_hotel`),
  KEY `IDX_categoria_servicios_activa` (`activa`),
  CONSTRAINT `FK_categoria_servicios_hotel`
    FOREIGN KEY (`id_hotel`) REFERENCES `hoteles` (`id`)
    ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Service categories per hotel (Alojamiento, Restaurante, Spa, etc.)';

-- ============================================================================
-- 6. tipos_habitacion
-- ============================================================================
CREATE TABLE IF NOT EXISTS `tipos_habitacion` (
  `id`                    INT(11)        NOT NULL AUTO_INCREMENT,
  `id_hotel`              INT(11)        NOT NULL,
  `nombre_tipo`           VARCHAR(255)   NOT NULL,
  `categoria_servicios_id` INT(11)       DEFAULT NULL,
  `descripcion`           TEXT           DEFAULT NULL,
  `capacidad_personas`    SMALLINT(6)    NOT NULL,
  `precio_base`           DECIMAL(12,2)  DEFAULT NULL,
  `activo`                TINYINT(4)     NOT NULL DEFAULT 1,
  `created_at`            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at`            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_tipos_habitacion_nombre_tipo` (`nombre_tipo`),
  KEY `IDX_tipos_habitacion_hotel`               (`id_hotel`),
  KEY `IDX_tipos_habitacion_categoria_servicios` (`categoria_servicios_id`),
  CONSTRAINT `FK_tipos_habitacion_categoria_servicios`
    FOREIGN KEY (`categoria_servicios_id`) REFERENCES `categoria_servicios` (`id`)
    ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Room types (Sencilla, Doble, Suite, Penthouse, etc.)';

-- ============================================================================
-- 7. tipo_habitacion_amenidades  (junction table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `tipo_habitacion_amenidades` (
  `id_tipo_habitacion` INT(11) NOT NULL,
  `id_amenidad`        INT(11) NOT NULL,
  PRIMARY KEY (`id_tipo_habitacion`, `id_amenidad`),
  KEY `IDX_tha_tipo_habitacion` (`id_tipo_habitacion`),
  KEY `IDX_tha_amenidad`        (`id_amenidad`),
  CONSTRAINT `FK_tha_tipo_habitacion`
    FOREIGN KEY (`id_tipo_habitacion`) REFERENCES `tipos_habitacion` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_tha_amenidad`
    FOREIGN KEY (`id_amenidad`) REFERENCES `amenidades` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Many-to-many: room types ↔ amenities';

-- ============================================================================
-- 8. habitaciones
-- ============================================================================
CREATE TABLE IF NOT EXISTS `habitaciones` (
  `id`                  INT(11)      NOT NULL AUTO_INCREMENT,
  `id_hotel`            INT(11)      NOT NULL,
  `numero_habitacion`   VARCHAR(255) NOT NULL,
  `piso`                VARCHAR(255) DEFAULT NULL,
  `estado`              VARCHAR(255) DEFAULT NULL COMMENT 'disponible, ocupada, limpieza, mantenimiento',
  `id_tipo_habitacion`  INT(11)      NOT NULL,
  `fecha_actualizacion` DATETIME     DEFAULT NULL,
  `imagenes`            TEXT         DEFAULT NULL,
  `created_at`          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at`          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_habitaciones_hotel_numero` (`id_hotel`, `numero_habitacion`),
  KEY `IDX_habitaciones_tipo_habitacion` (`id_tipo_habitacion`),
  KEY `IDX_habitaciones_estado`          (`estado`),
  CONSTRAINT `FK_habitaciones_tipo_habitacion`
    FOREIGN KEY (`id_tipo_habitacion`) REFERENCES `tipos_habitacion` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Individual hotel rooms';

-- ============================================================================
-- 9. reservas
-- ============================================================================
CREATE TABLE IF NOT EXISTS `reservas` (
  `id`                    INT(11)        NOT NULL AUTO_INCREMENT,
  `id_cliente`            INT(11)        NOT NULL,
  `id_hotel`              INT(11)        NOT NULL,
  `id_tipo_habitacion`    INT(11)        DEFAULT NULL,
  `id_habitacion`         INT(11)        DEFAULT NULL,
  `checkin_previsto`      DATE           NOT NULL,
  `checkout_previsto`     DATE           NOT NULL,
  `checkin_real`          DATETIME       DEFAULT NULL,
  `checkout_real`         DATETIME       DEFAULT NULL,
  `numero_huespedes`      SMALLINT(6)    NOT NULL,
  `estado_reserva`        VARCHAR(255)   NOT NULL DEFAULT 'reservada'
                            COMMENT 'reservada, confirmada, cancelada, rechazada, completada',
  `origen_reserva`        VARCHAR(255)   NOT NULL DEFAULT 'web'
                            COMMENT 'web, mostrador, telefono',
  `codigo_confirmacion`   VARCHAR(255)   NOT NULL,
  `precio_noche_snapshot` DECIMAL(12,2)  DEFAULT NULL,
  `observaciones`         TEXT           DEFAULT NULL,
  `cedula_cliente`        VARCHAR(255)   DEFAULT NULL,
  `nombre_cliente`        VARCHAR(255)   DEFAULT NULL,
  `email_cliente`         VARCHAR(255)   DEFAULT NULL,
  `created_at`            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at`            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at`            DATETIME       DEFAULT NULL,
  `deleted_by`            INT(11)        DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_reservas_codigo_confirmacion` (`codigo_confirmacion`),
  KEY `IDX_reservas_cliente`          (`id_cliente`),
  KEY `IDX_reservas_habitacion`       (`id_habitacion`),
  KEY `IDX_reservas_tipo_habitacion`  (`id_tipo_habitacion`),
  KEY `IDX_reservas_hotel`            (`id_hotel`),
  KEY `IDX_reservas_estado`           (`estado_reserva`),
  KEY `IDX_reservas_checkin`          (`checkin_previsto`),
  CONSTRAINT `FK_reservas_cliente`
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_reservas_habitacion`
    FOREIGN KEY (`id_habitacion`) REFERENCES `habitaciones` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_reservas_tipo_habitacion`
    FOREIGN KEY (`id_tipo_habitacion`) REFERENCES `tipos_habitacion` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Room reservations';

-- ============================================================================
-- 10. medios_pago
-- ============================================================================
CREATE TABLE IF NOT EXISTS `medios_pago` (
  `id`                  INT(11)      NOT NULL AUTO_INCREMENT,
  `nombre`              VARCHAR(255) NOT NULL,
  `descripcion`         VARCHAR(255) DEFAULT NULL,
  `activo`              TINYINT(4)   NOT NULL DEFAULT 1,
  `requiere_referencia` TINYINT(4)   NOT NULL DEFAULT 0,
  `created_at`          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_medios_pago_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Accepted payment methods';

-- ============================================================================
-- 11. facturas
-- ============================================================================
CREATE TABLE IF NOT EXISTS `facturas` (
  `id`                  INT(11)        NOT NULL AUTO_INCREMENT,
  `numero_factura`      VARCHAR(255)   NOT NULL,
  `uuid`                VARCHAR(255)   DEFAULT NULL,
  `id_reserva`          INT(11)        NOT NULL,
  `id_cliente`          INT(11)        NOT NULL,
  `nombre_cliente`      VARCHAR(255)   NOT NULL,
  `cedula_cliente`      VARCHAR(255)   NOT NULL,
  `email_cliente`       VARCHAR(255)   NOT NULL,
  `id_hotel`            INT(11)        NOT NULL,
  `subtotal`            DECIMAL(12,2)  NOT NULL,
  `porcentaje_iva`      DECIMAL(5,2)   NOT NULL DEFAULT 19.00,
  `porcentaje_inc`      DECIMAL(5,2)   DEFAULT NULL,
  `monto_iva`           DECIMAL(12,2)  NOT NULL,
  `monto_inc`           DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  `desglose_impuestos`  JSON           DEFAULT NULL,
  `desglose_monetario`  JSON           DEFAULT NULL,
  `total`               DECIMAL(12,2)  NOT NULL,
  `estado`              VARCHAR(255)   NOT NULL DEFAULT 'pendiente'
                          COMMENT 'pendiente, pagada, anulada, emitida',
  `estado_factura`      ENUM('BORRADOR','EDITABLE','EMITIDA','PAGADA','ANULADA')
                          NOT NULL DEFAULT 'BORRADOR',
  `fecha_emision`       DATETIME       DEFAULT NULL,
  `fecha_vencimiento`   DATETIME       DEFAULT NULL,
  `observaciones`       TEXT           DEFAULT NULL,
  `xml_data`            LONGTEXT       DEFAULT NULL,
  `json_data`           LONGTEXT       DEFAULT NULL,
  `cufe`                VARCHAR(255)   DEFAULT NULL,
  `created_at`          DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at`          DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at`          DATETIME       DEFAULT NULL,
  `deleted_by`          INT(11)        DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_facturas_numero_factura` (`numero_factura`),
  UNIQUE KEY `IDX_facturas_uuid`           (`uuid`),
  KEY `IDX_facturas_reserva`              (`id_reserva`),
  KEY `IDX_facturas_cliente`              (`id_cliente`),
  KEY `IDX_facturas_hotel`                (`id_hotel`),
  KEY `IDX_facturas_estado_factura`       (`estado_factura`),
  KEY `IDX_facturas_estado`               (`estado`),
  CONSTRAINT `FK_facturas_reserva`
    FOREIGN KEY (`id_reserva`) REFERENCES `reservas` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Invoices generated for reservations';

-- ============================================================================
-- 12. detalle_facturas
-- ============================================================================
CREATE TABLE IF NOT EXISTS `detalle_facturas` (
  `id`                    INT(11)        NOT NULL AUTO_INCREMENT,
  `id_factura`            INT(11)        NOT NULL,
  `id_pedido`             INT(11)        DEFAULT NULL,
  `tipo_concepto`         VARCHAR(255)   NOT NULL
                            COMMENT 'habitacion, servicio, descuento, cargo_adicional',
  `descripcion`           VARCHAR(255)   NOT NULL,
  `id_referencia`         INT(11)        DEFAULT NULL,
  `categoria_servicios_id` INT(11)       DEFAULT NULL,
  `categoria_nombre`      VARCHAR(100)   DEFAULT NULL
                            COMMENT 'Desnormalizado para integridad histórica',
  `cantidad`              DECIMAL(10,2)  NOT NULL,
  `precio_unitario`       DECIMAL(12,2)  NOT NULL,
  `subtotal`              DECIMAL(12,2)  NOT NULL,
  `descuento`             DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  `total`                 DECIMAL(12,2)  NOT NULL,
  `monto_iva`             DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  `porcentaje_inc`        DECIMAL(5,2)   DEFAULT NULL,
  `monto_inc`             DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  `estado`                ENUM('PENDIENTE','ENTREGADO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  PRIMARY KEY (`id`),
  KEY `IDX_detalle_facturas_factura`   (`id_factura`),
  KEY `IDX_detalle_facturas_pedido`    (`id_pedido`),
  KEY `IDX_detalle_facturas_estado`    (`estado`),
  KEY `IDX_detalle_facturas_fac_est`   (`id_factura`, `estado`),
  CONSTRAINT `FK_detalle_facturas_factura`
    FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Invoice line items (rooms, services, discounts, surcharges)';

-- ============================================================================
-- 13. pagos
-- ============================================================================
CREATE TABLE IF NOT EXISTS `pagos` (
  `id`                    INT(11)        NOT NULL AUTO_INCREMENT,
  `id_factura`            INT(11)        NOT NULL,
  `id_medio_pago`         INT(11)        NOT NULL,
  `monto`                 DECIMAL(12,2)  NOT NULL,
  `monto_recibido`        DECIMAL(12,2)  DEFAULT NULL,
  `cambio_devuelto`       DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  `referencia_pago`       VARCHAR(255)   DEFAULT NULL,
  `id_empleado_registro`  INT(11)        DEFAULT NULL,
  `estado`                VARCHAR(255)   NOT NULL DEFAULT 'completado'
                            COMMENT 'completado, rechazado, devuelto',
  `observaciones`         TEXT           DEFAULT NULL,
  `fecha_pago`            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `deleted_at`            DATETIME       DEFAULT NULL,
  `deleted_by`            INT(11)        DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_pagos_factura`     (`id_factura`),
  KEY `IDX_pagos_medio_pago`  (`id_medio_pago`),
  KEY `IDX_pagos_estado`      (`estado`),
  KEY `IDX_pagos_fecha`       (`fecha_pago`),
  CONSTRAINT `FK_pagos_factura`
    FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_pagos_medio_pago`
    FOREIGN KEY (`id_medio_pago`) REFERENCES `medios_pago` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Payments applied to invoices';

-- ============================================================================
-- 14. servicios
-- ============================================================================
CREATE TABLE IF NOT EXISTS `servicios` (
  `id`                    INT(11)        NOT NULL AUTO_INCREMENT,
  `id_hotel`              INT(11)        NOT NULL,
  `nombre`                VARCHAR(150)   NOT NULL,
  `descripcion`           TEXT           DEFAULT NULL,
  `categoria`             ENUM(
                            'cafeteria','lavanderia','spa','room_service',
                            'minibar','transporte','tours','eventos',
                            'mantenimiento','otros'
                          ) NOT NULL DEFAULT 'otros',
  `categoria_servicios_id` INT(11)       DEFAULT NULL,
  `es_alcoholico`         TINYINT(1)     NOT NULL DEFAULT 0,
  `precio_unitario`       DECIMAL(12,2)  NOT NULL,
  `unidad_medida`         VARCHAR(50)    NOT NULL DEFAULT 'unidad',
  `imagen_url`            VARCHAR(500)   DEFAULT NULL,
  `activo`                TINYINT(4)     NOT NULL DEFAULT 1,
  `disponible_delivery`   TINYINT(4)     NOT NULL DEFAULT 1,
  `disponible_recogida`   TINYINT(4)     NOT NULL DEFAULT 1,
  `created_at`            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at`            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_servicios_hotel`               (`id_hotel`),
  KEY `IDX_servicios_categoria`           (`categoria`),
  KEY `IDX_servicios_categoria_servicios` (`categoria_servicios_id`),
  KEY `IDX_servicios_activo`              (`activo`),
  CONSTRAINT `FK_servicios_categoria_servicios`
    FOREIGN KEY (`categoria_servicios_id`) REFERENCES `categoria_servicios` (`id`)
    ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Hotel services offered to guests (spa, laundry, room service, etc.)';

-- ============================================================================
-- 15. refresh_tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`        INT(11)      NOT NULL AUTO_INCREMENT,
  `token`     VARCHAR(500) NOT NULL,
  `userId`    INT(11)      NOT NULL,
  `userType`  VARCHAR(255) NOT NULL COMMENT 'cliente | empleado',
  `expiresAt` DATETIME     NOT NULL,
  `createdAt` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `isRevoked` TINYINT(4)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_refresh_tokens_token` (`token`),
  KEY `IDX_refresh_tokens_userId`       (`userId`),
  KEY `IDX_refresh_tokens_expiresAt`    (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='JWT refresh tokens for authentication';

-- ============================================================================
-- 16. pedidos  (service orders)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id`                  INT(11)        NOT NULL AUTO_INCREMENT,
  `id_reserva`          INT(11)        NOT NULL,
  `id_cliente`          INT(11)        NOT NULL,
  `id_hotel`            INT(11)        NOT NULL,
  `tipo_entrega`        ENUM('delivery','recogida') NOT NULL DEFAULT 'delivery',
  `estado_pedido`       ENUM('pendiente','en_preparacion','listo','entregado','cancelado')
                          NOT NULL DEFAULT 'pendiente',
  `categoria`           VARCHAR(50)    NOT NULL,
  `nota_cliente`        TEXT           DEFAULT NULL,
  `nota_empleado`       TEXT           DEFAULT NULL,
  `id_empleado_atiende` INT(11)        DEFAULT NULL,
  `fecha_entrega`       DATETIME       DEFAULT NULL,
  `total_pedido`        DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  `fecha_pedido`        DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `fecha_actualizacion` DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_pedidos_reserva`       (`id_reserva`),
  KEY `IDX_pedidos_cliente`       (`id_cliente`),
  KEY `IDX_pedidos_hotel`         (`id_hotel`),
  KEY `IDX_pedidos_estado_pedido` (`estado_pedido`),
  KEY `IDX_pedidos_categoria`     (`categoria`),
  CONSTRAINT `FK_pedidos_reserva`
    FOREIGN KEY (`id_reserva`) REFERENCES `reservas` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_pedidos_cliente`
    FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Service orders placed by guests during their stay';

-- ============================================================================
-- 17. pedido_items
-- ============================================================================
CREATE TABLE IF NOT EXISTS `pedido_items` (
  `id`                        INT(11)        NOT NULL AUTO_INCREMENT,
  `id_pedido`                 INT(11)        NOT NULL,
  `id_servicio`               INT(11)        NOT NULL,
  `cantidad`                  INT(11)        NOT NULL DEFAULT 1,
  `precio_unitario_snapshot`  DECIMAL(12,2)  NOT NULL,
  `subtotal`                  DECIMAL(12,2)  NOT NULL,
  `nombre_servicio_snapshot`  VARCHAR(150)   NOT NULL,
  `observacion`               VARCHAR(300)   DEFAULT NULL,
  `created_at`                DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_pedido_items_pedido`   (`id_pedido`),
  KEY `IDX_pedido_items_servicio` (`id_servicio`),
  CONSTRAINT `FK_pedido_items_pedido`
    FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id`)
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_pedido_items_servicio`
    FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id`)
    ON DELETE RESTRICT ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Line items within a service order';

-- ============================================================================
-- 18. pedido_cambios  (order state-change audit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `pedido_cambios` (
  `id`              INT(11)    NOT NULL AUTO_INCREMENT,
  `id_pedido`       INT(11)    NOT NULL,
  `estado_anterior` ENUM('pendiente','en_preparacion','listo','entregado','cancelado') NOT NULL,
  `estado_nuevo`    ENUM('pendiente','en_preparacion','listo','entregado','cancelado') NOT NULL,
  `usuario_id`      INT(11)    DEFAULT NULL,
  `razon_cambio`    LONGTEXT   DEFAULT NULL,
  `timestamp`       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_pedido_cambios_pedido`           (`id_pedido`),
  KEY `IDX_pedido_cambios_timestamp`        (`timestamp`),
  KEY `IDX_pedido_cambios_pedido_timestamp` (`id_pedido`, `timestamp`),
  KEY `IDX_pedido_cambios_estado_nuevo`     (`estado_nuevo`),
  KEY `IDX_pedido_cambios_usuario`          (`usuario_id`),
  CONSTRAINT `FK_pedido_cambios_pedido`
    FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id`)
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_pedido_cambios_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `empleados` (`id`)
    ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit trail for order state transitions';

-- ============================================================================
-- 19. factura_cambios  (invoice change audit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `factura_cambios` (
  `id`              INT(11)      NOT NULL AUTO_INCREMENT,
  `id_factura`      INT(11)      NOT NULL,
  `usuario_id`      INT(11)      DEFAULT NULL,
  `usuario_email`   VARCHAR(255) DEFAULT NULL,
  `tipo_cambio`     VARCHAR(100) NOT NULL,
  `descripcion`     TEXT         DEFAULT NULL,
  `valor_anterior`  JSON         DEFAULT NULL,
  `valor_nuevo`     JSON         DEFAULT NULL,
  `fecha`           DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_factura_cambios_factura`       (`id_factura`),
  KEY `IDX_factura_cambios_usuario`       (`usuario_id`),
  KEY `IDX_factura_cambios_fecha`         (`fecha`),
  KEY `IDX_factura_cambios_factura_fecha` (`id_factura`, `fecha`),
  CONSTRAINT `FK_factura_cambios_factura`
    FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id`)
    ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Audit trail for invoice changes (state, amount, client)';

-- ============================================================================
-- 20. detalle_factura_cambios  (invoice-line change audit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `detalle_factura_cambios` (
  `id`              INT(11)      NOT NULL AUTO_INCREMENT,
  `id_detalle`      INT(11)      NOT NULL,
  `tipo_cambio`     ENUM('CAMBIO_ESTADO','CAMBIO_MONTO','CAMBIO_CANTIDAD','CREACION','ELIMINACION')
                      NOT NULL,
  `descripcion`     TEXT         NOT NULL,
  `valor_anterior`  JSON         DEFAULT NULL,
  `valor_nuevo`     JSON         DEFAULT NULL,
  `usuario_id`      INT(11)      DEFAULT NULL,
  `fecha`           DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_dfc_detalle`       (`id_detalle`),
  KEY `IDX_dfc_fecha`         (`fecha`),
  KEY `IDX_dfc_tipo_cambio`   (`tipo_cambio`),
  KEY `IDX_dfc_detalle_fecha` (`id_detalle`, `fecha`),
  CONSTRAINT `FK_dfc_detalle`
    FOREIGN KEY (`id_detalle`) REFERENCES `detalle_facturas` (`id`)
    ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Audit trail for invoice line-item changes';

-- ============================================================================
-- 21. folios  (room folios)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `folios` (
  `id`                INT(11)        NOT NULL AUTO_INCREMENT,
  `idHabitacion`      INT(11)        NOT NULL,
  `idReserva`         INT(11)        DEFAULT NULL,
  `subtotal`          DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `cargos`            JSON           NOT NULL DEFAULT (JSON_ARRAY()),
  `total`             DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `estadoPago`        ENUM('ACTIVO','CERRADO','PAGADO') NOT NULL DEFAULT 'ACTIVO',
  `fechaApertura`     DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `fechaCierre`       DATETIME       DEFAULT NULL,
  `registradoPor`     INT(11)        DEFAULT NULL,
  `idMedioPago`       INT(11)        DEFAULT NULL,
  `referenciaPago`    VARCHAR(100)   DEFAULT NULL,
  `historicosPagos`   JSON           DEFAULT NULL,
  `updatedAt`         DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_folios_habitacion`  (`idHabitacion`),
  KEY `IDX_folios_reserva`     (`idReserva`),
  KEY `IDX_folios_estado_pago` (`estadoPago`),
  CONSTRAINT `FK_folios_habitacion`
    FOREIGN KEY (`idHabitacion`) REFERENCES `habitaciones` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_folios_reserva`
    FOREIGN KEY (`idReserva`) REFERENCES `reservas` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Room folios tracking charges during a stay';

-- ============================================================================
-- 22. room_incidents
-- ============================================================================
CREATE TABLE IF NOT EXISTS `room_incidents` (
  `id`                          INT(11)        NOT NULL AUTO_INCREMENT,
  `id_reserva`                  INT(11)        DEFAULT NULL,
  `id_habitacion`               INT(11)        NOT NULL,
  `id_cliente`                  INT(11)        DEFAULT NULL,
  `tipo`                        ENUM('daño','mantenimiento','limpieza','cliente_complaint','otros')
                                  NOT NULL DEFAULT 'otros',
  `estado`                      ENUM('reported','in_progress','resolved','cancelled')
                                  NOT NULL DEFAULT 'reported',
  `descripcion`                 TEXT           NOT NULL,
  `id_empleado_reporta`         INT(11)        NOT NULL,
  `nombre_empleado_reporta`     VARCHAR(100)   NOT NULL,
  `tipo_reportador`             VARCHAR(255)   NOT NULL COMMENT 'cliente | empleado',
  `area_asignada`               VARCHAR(50)    NOT NULL,
  `id_empleado_atiende`         INT(11)        DEFAULT NULL,
  `nombre_empleado_atiende`     VARCHAR(100)   DEFAULT NULL,
  `nota_resolucion`             TEXT           DEFAULT NULL,
  `prioridad`                   ENUM('baja','media','alta','urgente') NOT NULL DEFAULT 'media',
  `es_responsabilidad_cliente`  TINYINT(4)     NOT NULL DEFAULT 0,
  `cargo_adicional`             DECIMAL(12,2)  DEFAULT NULL,
  `descripcion_cargo`           VARCHAR(255)   DEFAULT NULL,
  `fecha_reporte`               DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `fecha_resolucion`            DATETIME       DEFAULT NULL,
  `updated_at`                  DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_room_incidents_habitacion`   (`id_habitacion`),
  KEY `IDX_room_incidents_reserva`      (`id_reserva`),
  KEY `IDX_room_incidents_cliente`      (`id_cliente`),
  KEY `IDX_room_incidents_estado`       (`estado`),
  KEY `IDX_room_incidents_tipo`         (`tipo`),
  KEY `IDX_room_incidents_area`         (`area_asignada`),
  CONSTRAINT `FK_room_incidents_habitacion`
    FOREIGN KEY (`id_habitacion`) REFERENCES `habitaciones` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_room_incidents_reserva`
    FOREIGN KEY (`id_reserva`) REFERENCES `reservas` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Room incidents, maintenance requests, and guest complaints';

-- ============================================================================
-- 23. tax_rates
-- ============================================================================
CREATE TABLE IF NOT EXISTS `tax_rates` (
  `id`                      INT(11)       NOT NULL AUTO_INCREMENT,
  `id_hotel`                INT(11)       NOT NULL,
  `categoria_servicios_id`  INT(11)       NOT NULL,
  `tipo_impuesto`           ENUM('IVA','INC','OTROS') NOT NULL DEFAULT 'IVA',
  `tasa_porcentaje`         DECIMAL(5,2)  NOT NULL,
  `descripcion`             VARCHAR(255)  DEFAULT NULL,
  `aplica_a_residentes`     TINYINT(1)    NOT NULL DEFAULT 1,
  `aplica_a_extranjeros`    TINYINT(1)    NOT NULL DEFAULT 1,
  `activa`                  TINYINT(1)    NOT NULL DEFAULT 1,
  `fecha_vigencia_inicio`   DATE          NOT NULL DEFAULT (CURDATE()),
  `fecha_vigencia_fin`      DATE          DEFAULT NULL,
  `notas`                   TEXT          DEFAULT NULL,
  `created_at`              DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at`              DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at`              DATETIME      DEFAULT NULL,
  `deleted_by`              INT(11)       DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_tax_rates_unique`
    (`id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `fecha_vigencia_fin`),
  KEY `IDX_tax_rates_hotel`             (`id_hotel`),
  KEY `IDX_tax_rates_categoria`         (`categoria_servicios_id`),
  KEY `IDX_tax_rates_tipo_impuesto`     (`tipo_impuesto`),
  KEY `IDX_tax_rates_activa`            (`activa`),
  KEY `IDX_tax_rates_vigencia`          (`fecha_vigencia_inicio`, `fecha_vigencia_fin`),
  KEY `IDX_tax_rates_active_categoria`
    (`id_hotel`, `categoria_servicios_id`, `activa`, `fecha_vigencia_inicio`, `fecha_vigencia_fin`),
  KEY `IDX_tax_rates_residencia`
    (`id_hotel`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`),
  CONSTRAINT `FK_tax_rates_hotel`
    FOREIGN KEY (`id_hotel`) REFERENCES `hoteles` (`id`)
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `FK_tax_rates_categoria`
    FOREIGN KEY (`categoria_servicios_id`) REFERENCES `categoria_servicios` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Tax rates per service category and hotel';

-- ============================================================================
-- 24. tax_rates_audit
-- ============================================================================
CREATE TABLE IF NOT EXISTS `tax_rates_audit` (
  `id`              INT(11)       NOT NULL AUTO_INCREMENT,
  `tax_rates_id`    INT(11)       NOT NULL,
  `id_hotel`        INT(11)       NOT NULL,
  `usuario_id`      INT(11)       DEFAULT NULL,
  `operacion`       ENUM('CREATE','UPDATE','DELETE') NOT NULL,
  `tasa_anterior`   DECIMAL(5,2)  DEFAULT NULL,
  `tasa_nueva`      DECIMAL(5,2)  DEFAULT NULL,
  `razon_cambio`    TEXT          DEFAULT NULL,
  `fecha`           DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_tax_rates_audit_hotel`    (`id_hotel`),
  KEY `IDX_tax_rates_audit_usuario`  (`usuario_id`),
  KEY `IDX_tax_rates_audit_fecha`    (`fecha`),
  CONSTRAINT `FK_tax_rates_audit_hotel`
    FOREIGN KEY (`id_hotel`) REFERENCES `hoteles` (`id`)
    ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Audit trail for tax rate changes';

-- ============================================================================
-- 25. tax_profile_audit
-- ============================================================================
CREATE TABLE IF NOT EXISTS `tax_profile_audit` (
  `id`                    INT(11)      NOT NULL AUTO_INCREMENT,
  `entidad`               VARCHAR(50)  NOT NULL COMMENT 'cliente | empleado',
  `id_entidad`            INT(11)      NOT NULL,
  `tax_profile_anterior`  VARCHAR(50)  DEFAULT NULL,
  `tax_profile_nuevo`     VARCHAR(50)  NOT NULL,
  `razon_cambio`          TEXT         DEFAULT NULL,
  `usuario_id`            INT(11)      DEFAULT NULL,
  `usuario_email`         VARCHAR(255) DEFAULT NULL,
  `fecha`                 DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ip_address`            VARCHAR(50)  DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_tax_profile_audit_entidad`  (`entidad`, `id_entidad`),
  KEY `IDX_tax_profile_audit_usuario`  (`usuario_id`),
  KEY `IDX_tax_profile_audit_fecha`    (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Audit trail for client/employee tax profile changes';

-- ============================================================================
-- 26. audit_logs  (general operation audit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`            INT(11)      NOT NULL AUTO_INCREMENT,
  `entidad`       VARCHAR(100) NOT NULL,
  `id_entidad`    INT(11)      NOT NULL,
  `operacion`     ENUM('CREATE','UPDATE','DELETE','RESTORE') NOT NULL,
  `usuario_id`    INT(11)      DEFAULT NULL,
  `usuario_email` VARCHAR(255) DEFAULT NULL,
  `usuario_rol`   VARCHAR(255) DEFAULT NULL,
  `cambios`       LONGTEXT     DEFAULT NULL,
  `descripcion`   TEXT         DEFAULT NULL,
  `ip_address`    VARCHAR(255) DEFAULT NULL,
  `user_agent`    VARCHAR(500) DEFAULT NULL,
  `accion`        VARCHAR(255) DEFAULT NULL,
  `fecha`         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_audit_logs_fecha`              (`fecha`),
  KEY `IDX_audit_logs_operacion`          (`operacion`),
  KEY `IDX_audit_logs_entidad_fecha`      (`entidad`, `id_entidad`, `fecha`),
  KEY `IDX_audit_logs_usuario_fecha`      (`usuario_id`, `fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='General audit log for all create/update/delete/restore operations';

-- ============================================================================
-- Re-enable foreign key checks
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Payment methods (medios_pago) – 7 records
-- ----------------------------------------------------------------------------
INSERT INTO `medios_pago`
  (`id`, `nombre`, `descripcion`, `activo`, `requiere_referencia`, `created_at`)
VALUES
  (1, 'efectivo',              'Pago en efectivo',                          1, 0, NOW()),
  (2, 'tarjeta_credito',       'Tarjeta de crédito',                        1, 1, NOW()),
  (3, 'tarjeta_debito',        'Tarjeta débito',                            1, 1, NOW()),
  (4, 'transferencia_bancaria','Transferencia bancaria',                     1, 1, NOW()),
  (5, 'nequi',                 'Pago por Nequi',                            1, 1, NOW()),
  (6, 'daviplata',             'Pago por Daviplata',                        1, 1, NOW()),
  (7, 'pse',                   'Pago por PSE (Pagos Seguros en Línea)',     1, 1, NOW())
ON DUPLICATE KEY UPDATE
  `descripcion`         = VALUES(`descripcion`),
  `activo`              = VALUES(`activo`),
  `requiere_referencia` = VALUES(`requiere_referencia`);

-- ----------------------------------------------------------------------------
-- Amenities (amenidades) – 10 records
-- ----------------------------------------------------------------------------
INSERT INTO `amenidades`
  (`id`, `nombre`, `icono`, `categoria`, `descripcion`, `created_at`, `updated_at`)
VALUES
  (1,  'WiFi',              'mdi-wifi',          'Conectividad',   'Internet de alta velocidad',    NOW(), NOW()),
  (2,  'Aire acondicionado','mdi-air-conditioner','Clima',          'Control de temperatura',        NOW(), NOW()),
  (3,  'Televisor',         'mdi-television',    'Entretenimiento','TV pantalla plana',              NOW(), NOW()),
  (4,  'Baño privado',      'mdi-shower',        'Baño',           'Baño privado con ducha',        NOW(), NOW()),
  (5,  'Caja fuerte',       'mdi-lock',          'Seguridad',      'Caja de seguridad digital',     NOW(), NOW()),
  (6,  'Escritorio',        'mdi-desk',          'Trabajo',        'Área de trabajo ejecutiva',     NOW(), NOW()),
  (7,  'Closet',            'mdi-hanger',        'Muebles',        'Armario amplio',                NOW(), NOW()),
  (8,  'Balcón',            'mdi-balcony',       'Extras',         'Balcón privado',                NOW(), NOW()),
  (9,  'Jacuzzi',           'mdi-hot-tub',       'Lujo',           'Jacuzzi privado',               NOW(), NOW()),
  (10, 'Sala',              'mdi-sofa',          'Lujo',           'Sala independiente',            NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `icono`       = VALUES(`icono`),
  `categoria`   = VALUES(`categoria`),
  `descripcion` = VALUES(`descripcion`),
  `updated_at`  = NOW();

-- ----------------------------------------------------------------------------
-- Hotel (hoteles) – 1 record: Hotel Sena 2026
-- ----------------------------------------------------------------------------
INSERT INTO `hoteles`
  (`id`, `nombre`, `nit`, `direccion`, `ciudad`, `pais`, `telefono`, `email`,
   `estrellas`, `descripcion`, `estado`, `fecha_registro`, `createdAt`, `updatedAt`)
VALUES
  (1, 'Hotel Sena 2026', '9001234567-1',
   'Carrera 5 No. 26-50', 'Bogotá', 'Colombia',
   '+57 1 1234567', 'info@hotelsena2026.com',
   4, 'Hotel de formación SENA – sistema de gestión hotelera 2026',
   'activo', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `nombre`      = VALUES(`nombre`),
  `direccion`   = VALUES(`direccion`),
  `ciudad`      = VALUES(`ciudad`),
  `pais`        = VALUES(`pais`),
  `telefono`    = VALUES(`telefono`),
  `email`       = VALUES(`email`),
  `estrellas`   = VALUES(`estrellas`),
  `descripcion` = VALUES(`descripcion`),
  `updatedAt`   = NOW();

-- ============================================================================
-- END OF MIGRATION 000
-- ============================================================================
