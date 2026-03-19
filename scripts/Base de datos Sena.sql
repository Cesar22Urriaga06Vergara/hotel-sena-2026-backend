-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         10.4.32-MariaDB - mariadb.org binary distribution
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.14.0.7169
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para hotel
CREATE DATABASE IF NOT EXISTS `hotel` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `hotel`;

-- Volcando estructura para tabla hotel.amenidades
CREATE TABLE IF NOT EXISTS `amenidades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `icono` varchar(255) DEFAULT NULL,
  `categoria` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_1ce2145a419f1331705a65196b` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.amenidades: ~10 rows (aproximadamente)
INSERT INTO `amenidades` (`id`, `nombre`, `icono`, `categoria`, `descripcion`, `created_at`, `updated_at`) VALUES
	(1, 'WiFi', 'mdi-wifi', 'Conectividad', 'Internet de alta velocidad', '2026-03-16 18:44:25.123659', '2026-03-16 18:44:25.123659'),
	(2, 'Aire acondicionado', 'mdi-air-conditioner', 'Clima', 'Control de temperatura', '2026-03-16 18:44:25.123659', '2026-03-16 18:44:25.123659'),
	(3, 'Televisor', 'mdi-television', 'Entretenimiento', 'TV pantalla plana', '2026-03-16 18:44:25.123659', '2026-03-16 18:44:25.123659'),
	(4, 'Baño privado', 'mdi-shower', 'Baño', 'Baño privado con ducha', '2026-03-16 18:44:25.123659', '2026-03-16 18:44:25.123659'),
	(5, 'Caja fuerte', 'mdi-lock', 'Seguridad', 'Caja de seguridad digital', '2026-03-16 18:44:25.123659', '2026-03-16 18:44:25.123659'),
	(6, 'Escritorio', 'mdi-desk', 'Trabajo', 'Área de trabajo ejecutiva', '2026-03-16 18:44:25.123659', '2026-03-16 18:44:25.123659'),
	(7, 'Closet', 'mdi-hanger', 'Muebles', 'Armario amplio', '2026-03-16 18:44:25.123659', '2026-03-16 18:44:25.123659'),
	(8, 'Balcón', 'mdi-balcony', 'Extras', 'Balcón privado', '2026-03-16 18:44:25.123659', '2026-03-16 18:44:25.123659'),
	(9, 'Jacuzzi', 'mdi-hot-tub', 'Lujo', 'Jacuzzi privado', '2026-03-16 18:44:25.123659', '2026-03-16 18:44:25.123659'),
	(10, 'Sala', 'mdi-sofa', 'Lujo', 'Sala independiente', '2026-03-16 18:44:25.123659', '2026-03-16 18:44:25.123659');

-- Volcando estructura para tabla hotel.audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entidad` varchar(100) NOT NULL,
  `id_entidad` int(11) NOT NULL,
  `operacion` enum('CREATE','UPDATE','DELETE','RESTORE') NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `usuario_email` varchar(255) DEFAULT NULL,
  `usuario_rol` varchar(255) DEFAULT NULL,
  `cambios` longtext DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `accion` varchar(255) DEFAULT NULL,
  `fecha` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_45db6eae248cdbe43a0a6b6ae7` (`fecha`),
  KEY `IDX_74a563e1de1019ff09ae26fcef` (`operacion`),
  KEY `IDX_af37712a5badb8f6d003c5b628` (`entidad`,`id_entidad`,`fecha`),
  KEY `IDX_d952d588cf9c12c9297c2e9161` (`usuario_id`,`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.audit_logs: ~0 rows (aproximadamente)

-- Volcando estructura para tabla hotel.categoria_servicios
CREATE TABLE IF NOT EXISTS `categoria_servicios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_hotel` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `codigo` varchar(50) NOT NULL,
  `activa` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `IDX_categoria_hotel` (`id_hotel`),
  KEY `IDX_categoria_codigo` (`codigo`),
  KEY `IDX_categoria_activa` (`activa`),
  CONSTRAINT `FK_categoria_hotel` FOREIGN KEY (`id_hotel`) REFERENCES `hoteles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.categoria_servicios: ~10 rows (aproximadamente)
INSERT INTO `categoria_servicios` (`id`, `id_hotel`, `nombre`, `descripcion`, `codigo`, `activa`, `created_at`, `updated_at`) VALUES
	(1, 1, 'Alojamiento', 'Hospedaje en habitaciones del hotel', 'ALOJAMIENTO', 1, '2026-03-19 15:17:47.334795', '2026-03-19 15:17:47.334795'),
	(2, 1, 'Restaurante/Cafetería', 'Servicios de comidas y bebidas', 'RESTAURANTE', 1, '2026-03-19 15:17:47.334795', '2026-03-19 15:17:47.334795'),
	(3, 1, 'Minibar/Tienda', 'Minibar, tienda y productos básicos', 'MINIBAR', 1, '2026-03-19 15:17:47.334795', '2026-03-19 15:17:47.334795'),
	(4, 1, 'Lavandería', 'Servicios de lavado y planchado', 'LAVANDERIA', 1, '2026-03-19 15:17:47.334795', '2026-03-19 15:17:47.334795'),
	(5, 1, 'Spa', 'Servicios de bienestar y masajes', 'SPA', 1, '2026-03-19 15:17:47.334795', '2026-03-19 15:17:47.334795'),
	(6, 1, 'Room Service', 'Servicio a habitación (comidas, etc.)', 'ROOM_SERVICE', 1, '2026-03-19 15:17:47.334795', '2026-03-19 15:17:47.334795'),
	(7, 1, 'Transporte', 'Transporte y traslados', 'TRANSPORTE', 1, '2026-03-19 15:17:47.334795', '2026-03-19 15:17:47.334795'),
	(8, 1, 'Tours', 'Tours y excursiones', 'TOURS', 1, '2026-03-19 15:17:47.334795', '2026-03-19 15:17:47.334795'),
	(9, 1, 'Eventos', 'Salonería, salones para eventos', 'EVENTOS', 1, '2026-03-19 15:17:47.334795', '2026-03-19 15:17:47.334795'),
	(10, 1, 'Mantenimiento', 'Servicios internos de mantenimiento', 'MANTENIMIENTO', 1, '2026-03-19 15:17:47.334795', '2026-03-19 15:17:47.334795');

-- Volcando estructura para tabla hotel.clientes
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cedula` varchar(255) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `apellido` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `telefono` varchar(255) DEFAULT NULL,
  `tipoDocumento` varchar(255) DEFAULT NULL,
  `rol` varchar(255) NOT NULL DEFAULT 'cliente',
  `direccion` varchar(255) DEFAULT NULL,
  `paisNacionalidad` varchar(255) DEFAULT NULL,
  `paisResidencia` varchar(255) DEFAULT NULL,
  `idiomaPreferido` varchar(255) DEFAULT NULL,
  `fechaNacimiento` datetime DEFAULT NULL,
  `tipoVisa` varchar(255) DEFAULT NULL,
  `numeroVisa` varchar(255) DEFAULT NULL,
  `visaExpira` datetime DEFAULT NULL,
  `tax_profile` enum('RESIDENT','FOREIGN_TOURIST','ENTITY') NOT NULL DEFAULT 'RESIDENT',
  `tipo_documento_estandar` varchar(50) DEFAULT NULL,
  `documento_validado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_validacion_documento` datetime DEFAULT NULL,
  `validado_por_usuario_id` int(11) DEFAULT NULL,
  `googleId` varchar(255) DEFAULT NULL,
  `photoUrl` varchar(255) DEFAULT NULL,
  `authProvider` varchar(255) NOT NULL DEFAULT 'local',
  `fecha_registro` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_28fa93cdc380ac510988890cce` (`cedula`),
  UNIQUE KEY `IDX_3cd5652ab34ca1a0a2c7a25531` (`email`),
  UNIQUE KEY `IDX_180e285c672066d3cca2ce1a8d` (`googleId`),
  KEY `IDX_clientes_tax_profile` (`tax_profile`),
  KEY `IDX_clientes_documento_validado` (`documento_validado`,`tax_profile`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.clientes: ~0 rows (aproximadamente)
INSERT INTO `clientes` (`id`, `cedula`, `nombre`, `apellido`, `email`, `password`, `telefono`, `tipoDocumento`, `rol`, `direccion`, `paisNacionalidad`, `paisResidencia`, `idiomaPreferido`, `fechaNacimiento`, `tipoVisa`, `numeroVisa`, `visaExpira`, `tax_profile`, `tipo_documento_estandar`, `documento_validado`, `fecha_validacion_documento`, `validado_por_usuario_id`, `googleId`, `photoUrl`, `authProvider`, `fecha_registro`, `createdAt`, `updatedAt`, `deleted_at`, `deleted_by`) VALUES
	(1, '50919231', 'Juan', 'Sena', 'sena@gmail.com', '$2b$10$ImXMdOFf2..dji8vwaLq3./yeVrFmg5nE82Puqdc8IxlFNR7TBk76', '', 'CC', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'RESIDENT', NULL, 0, NULL, NULL, NULL, NULL, 'local', '2026-03-14 13:15:17.154991', '2026-03-14 13:15:17.154991', '2026-03-15 15:34:49.000000', NULL, NULL);

-- Volcando estructura para tabla hotel.detalle_facturas
CREATE TABLE IF NOT EXISTS `detalle_facturas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_factura` int(11) NOT NULL,
  `tipo_concepto` varchar(255) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `id_referencia` int(11) DEFAULT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `descuento` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL,
  `porcentaje_inc` decimal(5,2) DEFAULT NULL,
  `monto_inc` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `FK_8c0face38acb83d9b55adb0e807` (`id_factura`),
  CONSTRAINT `FK_8c0face38acb83d9b55adb0e807` FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.detalle_facturas: ~10 rows (aproximadamente)
INSERT INTO `detalle_facturas` (`id`, `id_factura`, `tipo_concepto`, `descripcion`, `id_referencia`, `cantidad`, `precio_unitario`, `subtotal`, `descuento`, `total`, `porcentaje_inc`, `monto_inc`) VALUES
	(1, 2, 'habitacion', 'Habitación 101 - 1 noche(s) (16/3/2026 al 16/3/2026)', 1, 1.00, 80000.00, 80000.00, 0.00, 80000.00, NULL, 0.00),
	(2, 3, 'habitacion', 'Habitación 101 - 1 noche(s) (16/3/2026 al 16/3/2026)', 1, 1.00, 80000.00, 80000.00, 0.00, 80000.00, NULL, 0.00),
	(3, 3, 'servicio', 'Agua mineral (16/3/2026)', 1, 1.00, 5000.00, 5000.00, 0.00, 5000.00, NULL, 0.00),
	(4, 3, 'servicio', 'Café americano (16/3/2026)', 2, 1.00, 8000.00, 8000.00, 0.00, 8000.00, NULL, 0.00),
	(5, 3, 'servicio', 'Té aromático (16/3/2026)', 3, 1.00, 7000.00, 7000.00, 0.00, 7000.00, NULL, 0.00),
	(6, 9, 'habitacion', 'Habitación 101 - 1 noche(s) (16/3/2026 al 17/3/2026)', 1, 1.00, 80000.00, 80000.00, 0.00, 80000.00, NULL, 0.00),
	(7, 9, 'servicio', 'Agua mineral (17/3/2026)', 4, 1.00, 5000.00, 5000.00, 0.00, 5000.00, NULL, 0.00),
	(8, 9, 'servicio', 'Café americano (17/3/2026)', 5, 1.00, 8000.00, 8000.00, 0.00, 8000.00, NULL, 0.00),
	(9, 9, 'servicio', 'Cappuccino (17/3/2026)', 6, 1.00, 12000.00, 12000.00, 0.00, 12000.00, NULL, 0.00),
	(10, 9, 'servicio', 'Chocolate caliente (17/3/2026)', 7, 1.00, 10000.00, 10000.00, 0.00, 10000.00, NULL, 0.00);

-- Volcando estructura para tabla hotel.empleados
CREATE TABLE IF NOT EXISTS `empleados` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_hotel` int(11) DEFAULT NULL,
  `cedula` varchar(255) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `apellido` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` varchar(255) NOT NULL,
  `tax_profile` enum('RESIDENT','FOREIGN_TOURIST','ENTITY') NOT NULL DEFAULT 'RESIDENT',
  `estado` varchar(255) NOT NULL DEFAULT 'activo',
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_531b62206ec48fc3ba88593af3` (`cedula`),
  UNIQUE KEY `IDX_a5c9113abdd7c58a2290208119` (`email`),
  KEY `IDX_empleados_tax_profile` (`tax_profile`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.empleados: ~4 rows (aproximadamente)
INSERT INTO `empleados` (`id`, `id_hotel`, `cedula`, `nombre`, `apellido`, `email`, `password`, `rol`, `tax_profile`, `estado`, `createdAt`, `updatedAt`, `deleted_at`, `deleted_by`) VALUES
	(1, NULL, '1003001750', 'Cesar', 'Urriaga', 'urriagac44@gmail.com', '$2b$10$OJ1eEny.HEuGrLI.bsDZUOVcOF9aqR/LYjyqRMBwWNuLldjfV3Msy', 'superadmin', 'RESIDENT', 'activo', '2026-03-14 12:52:05.423254', '2026-03-14 13:02:41.926290', NULL, NULL),
	(2, 1, '123456789', 'Juan', 'Sena', 'recepcionista@gmail.com', '$2b$10$wXPhbqO8u3obk4/2iKbGYO.YbCMw3bPZlUaBEcKMoBOJiz0YvTCFy', 'recepcionista', 'RESIDENT', 'activo', '2026-03-14 13:13:37.300321', '2026-03-14 13:13:37.300321', NULL, NULL),
	(3, 1, '1003001751', 'Cesar', 'Urriaga', 'admin@gmail.com', '$2b$10$2RQOr05vUfP4ikrygcpAgem0VHaeEoQtnvcHjaio/RjZgatQ0Emg2', 'admin', 'RESIDENT', 'activo', '2026-03-15 11:41:23.766228', '2026-03-15 11:41:23.766228', NULL, NULL),
	(6, 1, '234567890', 'Camilo Torres', '', 'camilo@gmail.com', '$2b$10$gR9wLTArbnDn97I4Pud5k.e9BXQL6B5k3Xm8zanMXd4.6l1R2ak96', 'cafeteria', 'RESIDENT', 'activo', '2026-03-15 20:14:42.287163', '2026-03-15 20:14:42.287163', NULL, NULL);

-- Volcando estructura para tabla hotel.factura_cambios
CREATE TABLE IF NOT EXISTS `factura_cambios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_factura` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `usuario_email` varchar(255) DEFAULT NULL,
  `tipo_cambio` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `valor_anterior` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`valor_anterior`)),
  `valor_nuevo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`valor_nuevo`)),
  `fecha` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_factura_cambios_factura` (`id_factura`),
  KEY `IDX_factura_cambios_usuario` (`usuario_id`),
  KEY `IDX_factura_cambios_fecha` (`fecha`),
  CONSTRAINT `FK_factura_cambios_factura` FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.factura_cambios: ~0 rows (aproximadamente)

-- Volcando estructura para tabla hotel.facturas
CREATE TABLE IF NOT EXISTS `facturas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero_factura` varchar(255) NOT NULL,
  `uuid` varchar(255) DEFAULT NULL,
  `id_reserva` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `nombre_cliente` varchar(255) NOT NULL,
  `cedula_cliente` varchar(255) NOT NULL,
  `email_cliente` varchar(255) NOT NULL,
  `id_hotel` int(11) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `porcentaje_iva` decimal(5,2) NOT NULL DEFAULT 19.00,
  `porcentaje_inc` decimal(5,2) DEFAULT NULL,
  `monto_iva` decimal(12,2) NOT NULL,
  `monto_inc` decimal(12,2) NOT NULL DEFAULT 0.00,
  `desglose_impuestos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`desglose_impuestos`)),
  `desglose_monetario` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`desglose_monetario`)),
  `total` decimal(12,2) NOT NULL,
  `estado` varchar(255) NOT NULL DEFAULT 'pendiente',
  `estado_factura` enum('BORRADOR','EDITABLE','EMITIDA','PAGADA','ANULADA') NOT NULL DEFAULT 'BORRADOR',
  `fecha_emision` datetime DEFAULT NULL,
  `fecha_vencimiento` datetime DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `xml_data` longtext DEFAULT NULL,
  `json_data` longtext DEFAULT NULL,
  `cufe` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_0e316c27f9738f9c065b08220b` (`numero_factura`),
  UNIQUE KEY `IDX_f955080f9b27de038fb57af965` (`uuid`),
  KEY `FK_8b3f69e871b3d6c02de6c6d03e5` (`id_reserva`),
  KEY `IDX_facturas_estado_factura` (`estado_factura`),
  CONSTRAINT `FK_8b3f69e871b3d6c02de6c6d03e5` FOREIGN KEY (`id_reserva`) REFERENCES `reservas` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.facturas: ~2 rows (aproximadamente)
INSERT INTO `facturas` (`id`, `numero_factura`, `uuid`, `id_reserva`, `id_cliente`, `nombre_cliente`, `cedula_cliente`, `email_cliente`, `id_hotel`, `subtotal`, `porcentaje_iva`, `porcentaje_inc`, `monto_iva`, `monto_inc`, `desglose_impuestos`, `desglose_monetario`, `total`, `estado`, `estado_factura`, `fecha_emision`, `fecha_vencimiento`, `observaciones`, `xml_data`, `json_data`, `cufe`, `created_at`, `updated_at`, `deleted_at`, `deleted_by`) VALUES
	(2, 'FAC-2026-00001', '5bc6f2c8-8795-49c1-849b-b964fa9f2749', 2, 1, 'Juan', '50919231', 'sena@gmail.com', 1, 80000.00, 19.00, NULL, 15200.00, 0.00, NULL, NULL, 95200.00, 'pendiente', 'BORRADOR', '2026-03-16 18:54:50', NULL, '', '<?xml version="1.0" encoding="UTF-8"?>\n<Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"\n         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"\n         xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">\n  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>\n  <cbc:CustomizationID>05</cbc:CustomizationID>\n  <cbc:UUID>5bc6f2c8-8795-49c1-849b-b964fa9f2749</cbc:UUID>\n  <cbc:IssueDate>2026-03-16</cbc:IssueDate>\n  <cbc:IssueTime>23:54:50</cbc:IssueTime>\n  <cbc:InvoiceTypeCode listID="DIAN 1.0">01</cbc:InvoiceTypeCode>\n  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>\n  <cac:InvoicePeriod>\n    <cbc:StartDate>2026-03-16</cbc:StartDate>\n    <cbc:EndDate>2026-03-16</cbc:EndDate>\n  </cac:InvoicePeriod>\n  <cac:OrderReference>\n    <cbc:ID>FAC-2026-00001</cbc:ID>\n  </cac:OrderReference>\n  <cac:AccountingSupplierParty>\n    <cac:Party>\n      <cbc:Name>HOTEL SENA 2026</cbc:Name>\n      <cac:PartyIdentification>\n        <cbc:ID schemeID="NIT">9001234567-1</cbc:ID>\n      </cac:PartyIdentification>\n      <cac:PostalAddress>\n        <cbc:StreetName>Carrera 5 No. 26-50</cbc:StreetName>\n        <cbc:CityName>Bogotá</cbc:CityName>\n        <cbc:CountrySubentity>Bogotá D.C.</cbc:CountrySubentity>\n        <cac:Country>\n          <cbc:IdentificationCode>CO</cbc:IdentificationCode>\n        </cac:Country>\n      </cac:PostalAddress>\n      <cac:PartyTaxScheme>\n        <cbc:TaxTypeCode>01</cbc:TaxTypeCode>\n        <cac:TaxScheme>\n          <cbc:ID>01</cbc:ID>\n        </cac:TaxScheme>\n      </cac:PartyTaxScheme>\n    </cac:Party>\n  </cac:AccountingSupplierParty>\n  <cac:AccountingCustomerParty>\n    <cac:Party>\n      <cbc:Name>Juan</cbc:Name>\n      <cac:PartyIdentification>\n        <cbc:ID>50919231</cbc:ID>\n      </cac:PartyIdentification>\n      <cac:Contact>\n        <cbc:ElectronicMail>sena@gmail.com</cbc:ElectronicMail>\n      </cac:Contact>\n    </cac:Party>\n  </cac:AccountingCustomerParty>\n  <cac:TaxTotal>\n    <cbc:TaxAmount currencyID="COP">15200.00</cbc:TaxAmount>\n    <cac:TaxSubtotal>\n      <cbc:TaxableAmount currencyID="COP">80000.00</cbc:TaxableAmount>\n      <cbc:TaxAmount currencyID="COP">15200.00</cbc:TaxAmount>\n      <cac:TaxCategory>\n        <cbc:ID>S</cbc:ID>\n        <cbc:Percent>19</cbc:Percent>\n        <cac:TaxScheme>\n          <cbc:ID>01</cbc:ID>\n        </cac:TaxScheme>\n      </cac:TaxCategory>\n    </cac:TaxSubtotal>\n  </cac:TaxTotal>\n  <cac:LegalMonetaryTotal>\n    <cbc:LineExtensionAmount currencyID="COP">80000.00</cbc:LineExtensionAmount>\n    <cbc:TaxExclusiveAmount currencyID="COP">80000.00</cbc:TaxExclusiveAmount>\n    <cbc:TaxInclusiveAmount currencyID="COP">95200.00</cbc:TaxInclusiveAmount>\n    <cbc:PayableAmount currencyID="COP">95200.00</cbc:PayableAmount>\n  </cac:LegalMonetaryTotal>\n  \n    <cac:InvoiceLine>\n      <cbc:ID>1</cbc:ID>\n      <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>\n      <cac:Item>\n        <cbc:Description>Habitación 101 - 1 noche(s) (16/3/2026 al 16/3/2026)</cbc:Description>\n      </cac:Item>\n      <cac:Price>\n        <cbc:PriceAmount currencyID="COP">80000.00</cbc:PriceAmount>\n      </cac:Price>\n      <cac:LineExtensionAmount currencyID="COP">80000.00</cac:LineExtensionAmount>\n    </cac:InvoiceLine>\n  <!-- AVISO: Documento generado electrónicamente -->\n  <!-- Simulación para preparación DIAN - No válido fiscalmente sin firma digital -->\n</Invoice>', '{"numeroFactura":"FAC-2026-00001","uuid":"5bc6f2c8-8795-49c1-849b-b964fa9f2749","cliente":{"nombre":"Juan","cedula":"50919231","email":"sena@gmail.com"},"detalles":[{"tipoConcepto":"habitacion","descripcion":"Habitación 101 - 1 noche(s) (16/3/2026 al 16/3/2026)","cantidad":1,"precioUnitario":80000,"subtotal":80000,"descuento":0,"total":80000,"idReferencia":1}],"montos":{"subtotal":80000,"porcentajeIva":19,"montoIva":15200,"total":95200},"fechaEmision":"2026-03-16T23:54:50.166Z"}', NULL, '2026-03-16 18:54:50.182987', '2026-03-16 18:54:50.182987', NULL, NULL),
	(3, 'FAC-2026-00003', '6ec0759c-f1b2-4806-92eb-deb899282f3a', 3, 1, 'Juan', '50919231', 'sena@gmail.com', 1, 100000.00, 19.00, NULL, 19000.00, 0.00, NULL, NULL, 119000.00, 'pendiente', 'BORRADOR', '2026-03-16 19:12:29', NULL, '', '<?xml version="1.0" encoding="UTF-8"?>\n<Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"\n         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"\n         xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">\n  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>\n  <cbc:CustomizationID>05</cbc:CustomizationID>\n  <cbc:UUID>6ec0759c-f1b2-4806-92eb-deb899282f3a</cbc:UUID>\n  <cbc:IssueDate>2026-03-17</cbc:IssueDate>\n  <cbc:IssueTime>00:12:29</cbc:IssueTime>\n  <cbc:InvoiceTypeCode listID="DIAN 1.0">01</cbc:InvoiceTypeCode>\n  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>\n  <cac:InvoicePeriod>\n    <cbc:StartDate>2026-03-17</cbc:StartDate>\n    <cbc:EndDate>2026-03-17</cbc:EndDate>\n  </cac:InvoicePeriod>\n  <cac:OrderReference>\n    <cbc:ID>FAC-2026-00003</cbc:ID>\n  </cac:OrderReference>\n  <cac:AccountingSupplierParty>\n    <cac:Party>\n      <cbc:Name>HOTEL SENA 2026</cbc:Name>\n      <cac:PartyIdentification>\n        <cbc:ID schemeID="NIT">9001234567-1</cbc:ID>\n      </cac:PartyIdentification>\n      <cac:PostalAddress>\n        <cbc:StreetName>Carrera 5 No. 26-50</cbc:StreetName>\n        <cbc:CityName>Bogotá</cbc:CityName>\n        <cbc:CountrySubentity>Bogotá D.C.</cbc:CountrySubentity>\n        <cac:Country>\n          <cbc:IdentificationCode>CO</cbc:IdentificationCode>\n        </cac:Country>\n      </cac:PostalAddress>\n      <cac:PartyTaxScheme>\n        <cbc:TaxTypeCode>01</cbc:TaxTypeCode>\n        <cac:TaxScheme>\n          <cbc:ID>01</cbc:ID>\n        </cac:TaxScheme>\n      </cac:PartyTaxScheme>\n    </cac:Party>\n  </cac:AccountingSupplierParty>\n  <cac:AccountingCustomerParty>\n    <cac:Party>\n      <cbc:Name>Juan</cbc:Name>\n      <cac:PartyIdentification>\n        <cbc:ID>50919231</cbc:ID>\n      </cac:PartyIdentification>\n      <cac:Contact>\n        <cbc:ElectronicMail>sena@gmail.com</cbc:ElectronicMail>\n      </cac:Contact>\n    </cac:Party>\n  </cac:AccountingCustomerParty>\n  <cac:TaxTotal>\n    <cbc:TaxAmount currencyID="COP">19000.00</cbc:TaxAmount>\n    <cac:TaxSubtotal>\n      <cbc:TaxableAmount currencyID="COP">100000.00</cbc:TaxableAmount>\n      <cbc:TaxAmount currencyID="COP">19000.00</cbc:TaxAmount>\n      <cac:TaxCategory>\n        <cbc:ID>S</cbc:ID>\n        <cbc:Percent>19</cbc:Percent>\n        <cac:TaxScheme>\n          <cbc:ID>01</cbc:ID>\n        </cac:TaxScheme>\n      </cac:TaxCategory>\n    </cac:TaxSubtotal>\n  </cac:TaxTotal>\n  <cac:LegalMonetaryTotal>\n    <cbc:LineExtensionAmount currencyID="COP">100000.00</cbc:LineExtensionAmount>\n    <cbc:TaxExclusiveAmount currencyID="COP">100000.00</cbc:TaxExclusiveAmount>\n    <cbc:TaxInclusiveAmount currencyID="COP">119000.00</cbc:TaxInclusiveAmount>\n    <cbc:PayableAmount currencyID="COP">119000.00</cbc:PayableAmount>\n  </cac:LegalMonetaryTotal>\n  \n    <cac:InvoiceLine>\n      <cbc:ID>1</cbc:ID>\n      <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>\n      <cac:Item>\n        <cbc:Description>Habitación 101 - 1 noche(s) (16/3/2026 al 16/3/2026)</cbc:Description>\n      </cac:Item>\n      <cac:Price>\n        <cbc:PriceAmount currencyID="COP">80000.00</cbc:PriceAmount>\n      </cac:Price>\n      <cac:LineExtensionAmount currencyID="COP">80000.00</cac:LineExtensionAmount>\n    </cac:InvoiceLine>\n\n    <cac:InvoiceLine>\n      <cbc:ID>2</cbc:ID>\n      <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>\n      <cac:Item>\n        <cbc:Description>Agua mineral (16/3/2026)</cbc:Description>\n      </cac:Item>\n      <cac:Price>\n        <cbc:PriceAmount currencyID="COP">5000.00</cbc:PriceAmount>\n      </cac:Price>\n      <cac:LineExtensionAmount currencyID="COP">5000.00</cac:LineExtensionAmount>\n    </cac:InvoiceLine>\n\n    <cac:InvoiceLine>\n      <cbc:ID>3</cbc:ID>\n      <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>\n      <cac:Item>\n        <cbc:Description>Café americano (16/3/2026)</cbc:Description>\n      </cac:Item>\n      <cac:Price>\n        <cbc:PriceAmount currencyID="COP">8000.00</cbc:PriceAmount>\n      </cac:Price>\n      <cac:LineExtensionAmount currencyID="COP">8000.00</cac:LineExtensionAmount>\n    </cac:InvoiceLine>\n\n    <cac:InvoiceLine>\n      <cbc:ID>4</cbc:ID>\n      <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>\n      <cac:Item>\n        <cbc:Description>Té aromático (16/3/2026)</cbc:Description>\n      </cac:Item>\n      <cac:Price>\n        <cbc:PriceAmount currencyID="COP">7000.00</cbc:PriceAmount>\n      </cac:Price>\n      <cac:LineExtensionAmount currencyID="COP">7000.00</cac:LineExtensionAmount>\n    </cac:InvoiceLine>\n  <!-- AVISO: Documento generado electrónicamente -->\n  <!-- Simulación para preparación DIAN - No válido fiscalmente sin firma digital -->\n</Invoice>', '{"numeroFactura":"FAC-2026-00003","uuid":"6ec0759c-f1b2-4806-92eb-deb899282f3a","cliente":{"nombre":"Juan","cedula":"50919231","email":"sena@gmail.com"},"detalles":[{"tipoConcepto":"habitacion","descripcion":"Habitación 101 - 1 noche(s) (16/3/2026 al 16/3/2026)","cantidad":1,"precioUnitario":80000,"subtotal":80000,"descuento":0,"total":80000,"idReferencia":1},{"tipoConcepto":"servicio","descripcion":"Agua mineral (16/3/2026)","cantidad":1,"precioUnitario":5000,"subtotal":5000,"descuento":0,"total":5000,"idReferencia":1},{"tipoConcepto":"servicio","descripcion":"Café americano (16/3/2026)","cantidad":1,"precioUnitario":8000,"subtotal":8000,"descuento":0,"total":8000,"idReferencia":2},{"tipoConcepto":"servicio","descripcion":"Té aromático (16/3/2026)","cantidad":1,"precioUnitario":7000,"subtotal":7000,"descuento":0,"total":7000,"idReferencia":3}],"montos":{"subtotal":100000,"porcentajeIva":19,"montoIva":19000,"total":119000},"fechaEmision":"2026-03-17T00:12:29.453Z"}', NULL, '2026-03-16 19:12:29.456791', '2026-03-16 19:12:29.456791', NULL, NULL),
	(9, 'FAC-2026-00004', '78c614f6-4c87-4737-9006-c468ffb86627', 4, 1, 'Juan', '50919231', 'sena@gmail.com', 1, 115000.00, 19.00, NULL, 21850.00, 0.00, NULL, NULL, 136850.00, 'pendiente', 'BORRADOR', '2026-03-17 18:56:21', NULL, '', '<?xml version="1.0" encoding="UTF-8"?>\n<Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"\n         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"\n         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"\n         xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">\n  <!-- METADATOS DIAN -->\n  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>\n  <cbc:CustomizationID>05</cbc:CustomizationID>\n  <cbc:ProfileID>dian</cbc:ProfileID>\n  <cbc:ID>FV-FAC-2026-00004</cbc:ID>\n  <cbc:UUID>78c614f6-4c87-4737-9006-c468ffb86627</cbc:UUID>\n  <cbc:IssueDate>2026-03-17</cbc:IssueDate>\n  <cbc:IssueTime>23:56:21</cbc:IssueTime>\n  <cbc:InvoiceTypeCode listID="DIAN 1.0">01</cbc:InvoiceTypeCode>\n  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>\n  \n  <!-- PERÍODO -->\n  <cac:InvoicePeriod>\n    <cbc:StartDate>2026-03-17</cbc:StartDate>\n    <cbc:EndDate>2026-03-17</cbc:EndDate>\n  </cac:InvoicePeriod>\n  \n  <!-- REFERENCIA A ORDEN -->\n  <cac:OrderReference>\n    <cbc:ID>FV-FAC-2026-00004</cbc:ID>\n  </cac:OrderReference>\n  \n  <!-- PROVEEDOR (Hotel Sena) -->\n  <cac:AccountingSupplierParty>\n    <cac:Party>\n      <cbc:Name>HOTEL SENA 2026</cbc:Name>\n      <cac:PartyIdentification>\n        <cbc:ID schemeID="NIT">9001234567-1</cbc:ID>\n      </cac:PartyIdentification>\n      <cac:PostalAddress>\n        <cbc:StreetName>Carrera 5 No. 26-50</cbc:StreetName>\n        <cbc:CityName>Bogotá</cbc:CityName>\n        <cbc:CountrySubentity>Bogotá D.C.</cbc:CountrySubentity>\n        <cac:Country>\n          <cbc:IdentificationCode>CO</cbc:IdentificationCode>\n        </cac:Country>\n      </cac:PostalAddress>\n      <cac:PartyTaxScheme>\n        <cbc:RegistrationName>HOTEL SENA 2026</cbc:RegistrationName>\n        <cbc:CompanyID schemeID="NIT">9001234567-1</cbc:CompanyID>\n        <cbc:TaxTypeCode>01</cbc:TaxTypeCode>\n        <cac:TaxScheme>\n          <cbc:ID>01</cbc:ID>\n          <cbc:Name>IVA</cbc:Name>\n        </cac:TaxScheme>\n      </cac:PartyTaxScheme>\n    </cac:Party>\n  </cac:AccountingSupplierParty>\n  \n  <!-- CLIENTE (Huésped) -->\n  <cac:AccountingCustomerParty>\n    <cac:Party>\n      <cbc:Name>Juan</cbc:Name>\n      <cac:PartyIdentification>\n        <cbc:ID schemeID="CC">50919231</cbc:ID>\n      </cac:PartyIdentification>\n      <cac:Contact>\n        <cbc:ElectronicMail>sena@gmail.com</cbc:ElectronicMail>\n      </cac:Contact>\n    </cac:Party>\n  </cac:AccountingCustomerParty>\n  \n  <!-- TOTALES IMPUESTOS -->\n  <cac:TaxTotal>\n    <cbc:TaxAmount currencyID="COP">21850.00</cbc:TaxAmount>\n    <cac:TaxSubtotal>\n      <cbc:TaxableAmount currencyID="COP">115000.00</cbc:TaxableAmount>\n      <cbc:TaxAmount currencyID="COP">21850.00</cbc:TaxAmount>\n      <cbc:CalculationSequenceNumeric>1</cbc:CalculationSequenceNumeric>\n      <cac:TaxCategory>\n        <cbc:ID>S</cbc:ID>\n        <cbc:Name>IVA</cbc:Name>\n        <cbc:Percent>19</cbc:Percent>\n        <cbc:TaxExemptionReasonCode>VAT_EXEMPT</cbc:TaxExemptionReasonCode>\n        <cac:TaxScheme>\n          <cbc:ID>01</cbc:ID>\n          <cbc:Name>IVA</cbc:Name>\n        </cac:TaxScheme>\n      </cac:TaxCategory>\n    </cac:TaxSubtotal>\n  </cac:TaxTotal>\n  \n  <!-- TOTALES MONETARIOS -->\n  <cac:LegalMonetaryTotal>\n    <cbc:LineExtensionAmount currencyID="COP">115000.00</cbc:LineExtensionAmount>\n    <cbc:TaxExclusiveAmount currencyID="COP">115000.00</cbc:TaxExclusiveAmount>\n    <cbc:TaxInclusiveAmount currencyID="COP">136850.00</cbc:TaxInclusiveAmount>\n    <cbc:PrepaidAmount currencyID="COP">0.00</cbc:PrepaidAmount>\n    <cbc:PayableAmount currencyID="COP">136850.00</cbc:PayableAmount>\n  </cac:LegalMonetaryTotal>\n  \n  <!-- LÍNEAS DE FACTURA -->\n  \n    <cac:InvoiceLine>\n      <cbc:ID>1</cbc:ID>\n      <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>\n      <cbc:LineExtensionAmount currencyID="COP">80000.00</cbc:LineExtensionAmount>\n      <cac:Item>\n        <cbc:Description>Habitación 101 - 1 noche(s) (16/3/2026 al 17/3/2026)</cbc:Description>\n      </cac:Item>\n      <cac:Price>\n        <cbc:PriceAmount currencyID="COP">80000.00</cbc:PriceAmount>\n      </cac:Price>\n    </cac:InvoiceLine>\n\n    <cac:InvoiceLine>\n      <cbc:ID>2</cbc:ID>\n      <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>\n      <cbc:LineExtensionAmount currencyID="COP">5000.00</cbc:LineExtensionAmount>\n      <cac:Item>\n        <cbc:Description>Agua mineral (17/3/2026)</cbc:Description>\n      </cac:Item>\n      <cac:Price>\n        <cbc:PriceAmount currencyID="COP">5000.00</cbc:PriceAmount>\n      </cac:Price>\n    </cac:InvoiceLine>\n\n    <cac:InvoiceLine>\n      <cbc:ID>3</cbc:ID>\n      <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>\n      <cbc:LineExtensionAmount currencyID="COP">8000.00</cbc:LineExtensionAmount>\n      <cac:Item>\n        <cbc:Description>Café americano (17/3/2026)</cbc:Description>\n      </cac:Item>\n      <cac:Price>\n        <cbc:PriceAmount currencyID="COP">8000.00</cbc:PriceAmount>\n      </cac:Price>\n    </cac:InvoiceLine>\n\n    <cac:InvoiceLine>\n      <cbc:ID>4</cbc:ID>\n      <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>\n      <cbc:LineExtensionAmount currencyID="COP">12000.00</cbc:LineExtensionAmount>\n      <cac:Item>\n        <cbc:Description>Cappuccino (17/3/2026)</cbc:Description>\n      </cac:Item>\n      <cac:Price>\n        <cbc:PriceAmount currencyID="COP">12000.00</cbc:PriceAmount>\n      </cac:Price>\n    </cac:InvoiceLine>\n\n    <cac:InvoiceLine>\n      <cbc:ID>5</cbc:ID>\n      <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>\n      <cbc:LineExtensionAmount currencyID="COP">10000.00</cbc:LineExtensionAmount>\n      <cac:Item>\n        <cbc:Description>Chocolate caliente (17/3/2026)</cbc:Description>\n      </cac:Item>\n      <cac:Price>\n        <cbc:PriceAmount currencyID="COP">10000.00</cbc:PriceAmount>\n      </cac:Price>\n    </cac:InvoiceLine>\n  \n  <!-- NOTAS -->\n  <cbc:Note>Documento generado electrónicamente según resolución DIAN</cbc:Note>\n  <cbc:Note>⚠️ DOCUMENTO SIMULADO - No es válido fiscalmente sin Firma Digital XMLDSIG y certificado DIAN</cbc:Note>\n</Invoice>', '{"numeroFactura":"FAC-2026-00004","uuid":"78c614f6-4c87-4737-9006-c468ffb86627","cliente":{"nombre":"Juan","cedula":"50919231","email":"sena@gmail.com"},"detalles":[{"tipoConcepto":"habitacion","descripcion":"Habitación 101 - 1 noche(s) (16/3/2026 al 17/3/2026)","cantidad":1,"precioUnitario":80000,"subtotal":80000,"descuento":0,"total":80000,"idReferencia":1},{"tipoConcepto":"servicio","descripcion":"Agua mineral (17/3/2026)","cantidad":1,"precioUnitario":5000,"subtotal":5000,"descuento":0,"total":5000,"montoInc":0,"idReferencia":4},{"tipoConcepto":"servicio","descripcion":"Café americano (17/3/2026)","cantidad":1,"precioUnitario":8000,"subtotal":8000,"descuento":0,"total":8000,"montoInc":0,"idReferencia":5},{"tipoConcepto":"servicio","descripcion":"Cappuccino (17/3/2026)","cantidad":1,"precioUnitario":12000,"subtotal":12000,"descuento":0,"total":12000,"montoInc":0,"idReferencia":6},{"tipoConcepto":"servicio","descripcion":"Chocolate caliente (17/3/2026)","cantidad":1,"precioUnitario":10000,"subtotal":10000,"descuento":0,"total":10000,"montoInc":0,"idReferencia":7}],"montos":{"subtotal":115000,"montoInc":0,"porcentajeIncAplicado":null,"porcentajeIva":19,"montoIva":21850,"total":136850},"fechaEmision":"2026-03-17T23:56:21.017Z"}', NULL, '2026-03-17 18:56:21.033706', '2026-03-17 18:56:21.033706', NULL, NULL);

-- Volcando estructura para tabla hotel.habitaciones
CREATE TABLE IF NOT EXISTS `habitaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_hotel` int(11) NOT NULL,
  `numero_habitacion` varchar(255) NOT NULL,
  `piso` varchar(255) DEFAULT NULL,
  `estado` varchar(255) DEFAULT NULL,
  `id_tipo_habitacion` int(11) NOT NULL,
  `fecha_actualizacion` datetime DEFAULT NULL,
  `imagenes` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `FK_650d02efbfcd318350a416e027c` (`id_tipo_habitacion`),
  CONSTRAINT `FK_650d02efbfcd318350a416e027c` FOREIGN KEY (`id_tipo_habitacion`) REFERENCES `tipos_habitacion` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.habitaciones: ~50 rows (aproximadamente)
INSERT INTO `habitaciones` (`id`, `id_hotel`, `numero_habitacion`, `piso`, `estado`, `id_tipo_habitacion`, `fecha_actualizacion`, `imagenes`, `created_at`, `updated_at`) VALUES
	(1, 1, '101', '1', 'disponible', 1, '2026-03-17 20:22:24', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773796936/imghotel/nlxiteenli5eyr8ezl9d.jpg', '2026-03-16 18:44:25.231468', '2026-03-17 20:22:24.000000'),
	(2, 1, '102', '1', 'disponible', 1, '2026-03-17 20:22:24', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773796936/imghotel/nlxiteenli5eyr8ezl9d.jpg', '2026-03-16 18:44:25.231468', '2026-03-17 20:22:24.000000'),
	(3, 1, '103', '1', 'disponible', 1, '2026-03-17 20:22:24', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773796936/imghotel/nlxiteenli5eyr8ezl9d.jpg', '2026-03-16 18:44:25.231468', '2026-03-17 20:22:24.000000'),
	(4, 1, '104', '1', 'disponible', 1, '2026-03-17 20:22:24', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773796936/imghotel/nlxiteenli5eyr8ezl9d.jpg', '2026-03-16 18:44:25.231468', '2026-03-17 20:22:24.000000'),
	(5, 1, '105', '1', 'disponible', 1, '2026-03-17 20:22:24', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773796936/imghotel/nlxiteenli5eyr8ezl9d.jpg', '2026-03-16 18:44:25.231468', '2026-03-17 20:22:24.000000'),
	(6, 1, '106', '1', 'disponible', 1, '2026-03-17 20:22:24', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773796936/imghotel/nlxiteenli5eyr8ezl9d.jpg', '2026-03-16 18:44:25.231468', '2026-03-17 20:22:24.000000'),
	(7, 1, '107', '1', 'disponible', 1, '2026-03-17 20:22:24', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773796936/imghotel/nlxiteenli5eyr8ezl9d.jpg', '2026-03-16 18:44:25.231468', '2026-03-17 20:22:25.000000'),
	(8, 1, '108', '1', 'disponible', 1, '2026-03-17 20:22:25', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773796936/imghotel/nlxiteenli5eyr8ezl9d.jpg', '2026-03-16 18:44:25.231468', '2026-03-17 20:22:25.000000'),
	(9, 1, '109', '1', 'disponible', 1, '2026-03-17 20:22:25', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773796936/imghotel/nlxiteenli5eyr8ezl9d.jpg', '2026-03-16 18:44:25.231468', '2026-03-17 20:22:25.000000'),
	(10, 1, '110', '1', 'disponible', 1, '2026-03-17 20:22:25', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773796936/imghotel/nlxiteenli5eyr8ezl9d.jpg', '2026-03-16 18:44:25.231468', '2026-03-17 20:22:25.000000'),
	(11, 1, '201', '2', 'disponible', 2, NULL, NULL, '2026-03-16 18:44:25.245088', '2026-03-16 18:44:25.245088'),
	(12, 1, '202', '2', 'disponible', 2, NULL, NULL, '2026-03-16 18:44:25.245088', '2026-03-16 18:44:25.245088'),
	(13, 1, '203', '2', 'disponible', 2, NULL, NULL, '2026-03-16 18:44:25.245088', '2026-03-16 18:44:25.245088'),
	(14, 1, '204', '2', 'disponible', 2, NULL, NULL, '2026-03-16 18:44:25.245088', '2026-03-16 18:44:25.245088'),
	(15, 1, '205', '2', 'disponible', 2, NULL, NULL, '2026-03-16 18:44:25.245088', '2026-03-16 18:44:25.245088'),
	(16, 1, '206', '2', 'disponible', 2, NULL, NULL, '2026-03-16 18:44:25.245088', '2026-03-16 18:44:25.245088'),
	(17, 1, '207', '2', 'disponible', 2, NULL, NULL, '2026-03-16 18:44:25.245088', '2026-03-16 18:44:25.245088'),
	(18, 1, '208', '2', 'disponible', 2, NULL, NULL, '2026-03-16 18:44:25.245088', '2026-03-16 18:44:25.245088'),
	(19, 1, '209', '2', 'disponible', 2, NULL, NULL, '2026-03-16 18:44:25.245088', '2026-03-16 18:44:25.245088'),
	(20, 1, '210', '2', 'disponible', 2, NULL, NULL, '2026-03-16 18:44:25.245088', '2026-03-16 18:44:25.245088'),
	(21, 1, '301', '3', 'disponible', 3, NULL, NULL, '2026-03-16 18:44:25.264803', '2026-03-16 18:44:25.264803'),
	(22, 1, '302', '3', 'disponible', 3, NULL, NULL, '2026-03-16 18:44:25.264803', '2026-03-16 18:44:25.264803'),
	(23, 1, '303', '3', 'disponible', 3, NULL, NULL, '2026-03-16 18:44:25.264803', '2026-03-16 18:44:25.264803'),
	(24, 1, '304', '3', 'disponible', 3, NULL, NULL, '2026-03-16 18:44:25.264803', '2026-03-16 18:44:25.264803'),
	(25, 1, '305', '3', 'disponible', 3, NULL, NULL, '2026-03-16 18:44:25.264803', '2026-03-16 18:44:25.264803'),
	(26, 1, '306', '3', 'disponible', 3, NULL, NULL, '2026-03-16 18:44:25.264803', '2026-03-16 18:44:25.264803'),
	(27, 1, '307', '3', 'disponible', 3, NULL, NULL, '2026-03-16 18:44:25.264803', '2026-03-16 18:44:25.264803'),
	(28, 1, '308', '3', 'disponible', 3, NULL, NULL, '2026-03-16 18:44:25.264803', '2026-03-16 18:44:25.264803'),
	(29, 1, '309', '3', 'disponible', 3, NULL, NULL, '2026-03-16 18:44:25.264803', '2026-03-16 18:44:25.264803'),
	(30, 1, '310', '3', 'disponible', 3, NULL, NULL, '2026-03-16 18:44:25.264803', '2026-03-16 18:44:25.264803'),
	(31, 1, '401', '4', 'disponible', 4, NULL, NULL, '2026-03-16 18:44:25.293308', '2026-03-16 18:44:25.293308'),
	(32, 1, '402', '4', 'disponible', 4, NULL, NULL, '2026-03-16 18:44:25.293308', '2026-03-16 18:44:25.293308'),
	(33, 1, '403', '4', 'disponible', 4, NULL, NULL, '2026-03-16 18:44:25.293308', '2026-03-16 18:44:25.293308'),
	(34, 1, '404', '4', 'disponible', 4, NULL, NULL, '2026-03-16 18:44:25.293308', '2026-03-16 18:44:25.293308'),
	(35, 1, '405', '4', 'disponible', 4, NULL, NULL, '2026-03-16 18:44:25.293308', '2026-03-16 18:44:25.293308'),
	(36, 1, '406', '4', 'disponible', 4, NULL, NULL, '2026-03-16 18:44:25.293308', '2026-03-16 18:44:25.293308'),
	(37, 1, '407', '4', 'disponible', 4, NULL, NULL, '2026-03-16 18:44:25.293308', '2026-03-16 18:44:25.293308'),
	(38, 1, '408', '4', 'disponible', 4, NULL, NULL, '2026-03-16 18:44:25.293308', '2026-03-16 18:44:25.293308'),
	(39, 1, '409', '4', 'disponible', 4, NULL, NULL, '2026-03-16 18:44:25.293308', '2026-03-16 18:44:25.293308'),
	(40, 1, '410', '4', 'disponible', 4, NULL, NULL, '2026-03-16 18:44:25.293308', '2026-03-16 18:44:25.293308'),
	(41, 1, '501', '5', 'disponible', 5, NULL, NULL, '2026-03-16 18:44:25.309093', '2026-03-16 18:44:25.309093'),
	(42, 1, '502', '5', 'disponible', 5, NULL, NULL, '2026-03-16 18:44:25.309093', '2026-03-16 18:44:25.309093'),
	(43, 1, '503', '5', 'disponible', 5, NULL, NULL, '2026-03-16 18:44:25.309093', '2026-03-16 18:44:25.309093'),
	(44, 1, '504', '5', 'disponible', 5, NULL, NULL, '2026-03-16 18:44:25.309093', '2026-03-16 18:44:25.309093'),
	(45, 1, '505', '5', 'disponible', 5, NULL, NULL, '2026-03-16 18:44:25.309093', '2026-03-16 18:44:25.309093'),
	(46, 1, '506', '5', 'disponible', 5, NULL, NULL, '2026-03-16 18:44:25.309093', '2026-03-16 18:44:25.309093'),
	(47, 1, '507', '5', 'disponible', 5, NULL, NULL, '2026-03-16 18:44:25.309093', '2026-03-16 18:44:25.309093'),
	(48, 1, '508', '5', 'disponible', 5, NULL, NULL, '2026-03-16 18:44:25.309093', '2026-03-16 18:44:25.309093'),
	(49, 1, '509', '5', 'disponible', 5, NULL, NULL, '2026-03-16 18:44:25.309093', '2026-03-16 18:44:25.309093'),
	(50, 1, '510', '5', 'disponible', 5, NULL, NULL, '2026-03-16 18:44:25.309093', '2026-03-16 18:44:25.309093');

-- Volcando estructura para tabla hotel.hoteles
CREATE TABLE IF NOT EXISTS `hoteles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `nit` varchar(20) NOT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `pais` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `estrellas` int(11) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_registro` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_8158adae354184821ad5b24c09` (`nit`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.hoteles: ~0 rows (aproximadamente)
INSERT INTO `hoteles` (`id`, `nombre`, `nit`, `direccion`, `ciudad`, `pais`, `telefono`, `email`, `estrellas`, `descripcion`, `fecha_registro`, `createdAt`, `updatedAt`) VALUES
	(1, 'Hotel Valhalla', '123456789', 'Calle 10 No. 5-50', 'Monteria', 'Colombia', '+57 1 1234567', 'info@hotelvalhalla.com', 5, 'Hotel 5 estrellas con servicios premium', '2026-03-14 13:08:09.434758', '2026-03-14 13:08:09.434758', '2026-03-14 13:08:09.434758');

-- Volcando estructura para tabla hotel.medios_pago
CREATE TABLE IF NOT EXISTS `medios_pago` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `activo` tinyint(4) NOT NULL DEFAULT 1,
  `requiere_referencia` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_beeebc04aa15c1104f74d39ed5` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.medios_pago: ~7 rows (aproximadamente)
INSERT INTO `medios_pago` (`id`, `nombre`, `descripcion`, `activo`, `requiere_referencia`, `created_at`) VALUES
	(1, 'efectivo', NULL, 1, 0, '2026-03-16 18:33:33.021174'),
	(2, 'tarjeta_credito', NULL, 1, 1, '2026-03-16 18:33:33.027964'),
	(3, 'tarjeta_debito', NULL, 1, 1, '2026-03-16 18:33:33.031024'),
	(4, 'transferencia_bancaria', NULL, 1, 1, '2026-03-16 18:33:33.032384'),
	(5, 'nequi', NULL, 1, 1, '2026-03-16 18:33:33.033826'),
	(6, 'daviplata', NULL, 1, 1, '2026-03-16 18:33:33.035052'),
	(7, 'pse', NULL, 1, 1, '2026-03-16 18:33:33.037164');

-- Volcando estructura para tabla hotel.pagos
CREATE TABLE IF NOT EXISTS `pagos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_factura` int(11) NOT NULL,
  `id_medio_pago` int(11) NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `monto_recibido` decimal(12,2) DEFAULT NULL,
  `cambio_devuelto` decimal(12,2) NOT NULL DEFAULT 0.00,
  `referencia_pago` varchar(255) DEFAULT NULL,
  `id_empleado_registro` int(11) DEFAULT NULL,
  `estado` varchar(255) NOT NULL DEFAULT 'completado',
  `observaciones` text DEFAULT NULL,
  `fecha_pago` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_a5401e3f720431de8d3ad940713` (`id_factura`),
  KEY `FK_4e18b9822619a42675ee57bce6a` (`id_medio_pago`),
  CONSTRAINT `FK_4e18b9822619a42675ee57bce6a` FOREIGN KEY (`id_medio_pago`) REFERENCES `medios_pago` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_a5401e3f720431de8d3ad940713` FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.pagos: ~0 rows (aproximadamente)

-- Volcando estructura para tabla hotel.pedido_items
CREATE TABLE IF NOT EXISTS `pedido_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_pedido` int(11) NOT NULL,
  `id_servicio` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `precio_unitario_snapshot` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `nombre_servicio_snapshot` varchar(150) NOT NULL,
  `observacion` varchar(300) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `FK_7ba7b59a72913982e3dc3217796` (`id_pedido`),
  KEY `FK_4a06c038d0e1feeaf700c93a916` (`id_servicio`),
  CONSTRAINT `FK_4a06c038d0e1feeaf700c93a916` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id`) ON UPDATE NO ACTION,
  CONSTRAINT `FK_7ba7b59a72913982e3dc3217796` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.pedido_items: ~7 rows (aproximadamente)
INSERT INTO `pedido_items` (`id`, `id_pedido`, `id_servicio`, `cantidad`, `precio_unitario_snapshot`, `subtotal`, `nombre_servicio_snapshot`, `observacion`, `created_at`) VALUES
	(1, 1, 10, 1, 5000.00, 5000.00, 'Agua mineral', NULL, '2026-03-16 19:11:43.978660'),
	(2, 1, 1, 1, 8000.00, 8000.00, 'Café americano', NULL, '2026-03-16 19:11:43.985090'),
	(3, 1, 5, 1, 7000.00, 7000.00, 'Té aromático', NULL, '2026-03-16 19:11:43.993662'),
	(4, 2, 10, 1, 5000.00, 5000.00, 'Agua mineral', NULL, '2026-03-17 18:49:25.083237'),
	(5, 2, 1, 1, 8000.00, 8000.00, 'Café americano', NULL, '2026-03-17 18:49:25.090675'),
	(6, 2, 2, 1, 12000.00, 12000.00, 'Cappuccino', NULL, '2026-03-17 18:49:25.098936'),
	(7, 2, 4, 1, 10000.00, 10000.00, 'Chocolate caliente', NULL, '2026-03-17 18:49:25.103505');

-- Volcando estructura para tabla hotel.pedidos
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_reserva` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_hotel` int(11) NOT NULL,
  `tipo_entrega` enum('delivery','recogida') NOT NULL DEFAULT 'delivery',
  `estado_pedido` enum('pendiente','en_preparacion','listo','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  `categoria` varchar(50) NOT NULL,
  `nota_cliente` text DEFAULT NULL,
  `nota_empleado` text DEFAULT NULL,
  `id_empleado_atiende` int(11) DEFAULT NULL,
  `total_pedido` decimal(12,2) NOT NULL DEFAULT 0.00,
  `fecha_pedido` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `fecha_actualizacion` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_283ef166465066aa1a16c1656f` (`categoria`),
  KEY `IDX_fe4047d5c52db9ed3bf173ff6c` (`estado_pedido`),
  KEY `IDX_913871948e8bdc9b98c3912117` (`id_hotel`),
  KEY `IDX_2cbd06849c6ee82a099e00dd35` (`id_reserva`),
  KEY `FK_084336bed940d710a81fa96e59c` (`id_cliente`),
  CONSTRAINT `FK_084336bed940d710a81fa96e59c` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_2cbd06849c6ee82a099e00dd353` FOREIGN KEY (`id_reserva`) REFERENCES `reservas` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.pedidos: ~2 rows (aproximadamente)
INSERT INTO `pedidos` (`id`, `id_reserva`, `id_cliente`, `id_hotel`, `tipo_entrega`, `estado_pedido`, `categoria`, `nota_cliente`, `nota_empleado`, `id_empleado_atiende`, `total_pedido`, `fecha_pedido`, `fecha_actualizacion`) VALUES
	(1, 3, 1, 1, 'delivery', 'entregado', 'cafeteria', NULL, NULL, 6, 20000.00, '2026-03-16 19:11:43.969659', '2026-03-16 19:12:00.000000'),
	(2, 4, 1, 1, 'delivery', 'entregado', 'cafeteria', NULL, NULL, 6, 35000.00, '2026-03-17 18:49:25.069990', '2026-03-17 18:50:15.000000');

-- Volcando estructura para tabla hotel.refresh_tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(500) NOT NULL,
  `userId` int(11) NOT NULL,
  `userType` varchar(255) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `isRevoked` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_4542dd2f38a61354a040ba9fd5` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.refresh_tokens: ~0 rows (aproximadamente)

-- Volcando estructura para tabla hotel.reservas
CREATE TABLE IF NOT EXISTS `reservas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_cliente` int(11) NOT NULL,
  `id_hotel` int(11) NOT NULL,
  `id_tipo_habitacion` int(11) DEFAULT NULL,
  `id_habitacion` int(11) DEFAULT NULL,
  `checkin_previsto` date NOT NULL,
  `checkout_previsto` date NOT NULL,
  `checkin_real` datetime DEFAULT NULL,
  `checkout_real` datetime DEFAULT NULL,
  `numero_huespedes` smallint(6) NOT NULL,
  `estado_reserva` varchar(255) NOT NULL DEFAULT 'reservada',
  `origen_reserva` varchar(255) NOT NULL DEFAULT 'web',
  `codigo_confirmacion` varchar(255) NOT NULL,
  `precio_noche_snapshot` decimal(12,2) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `cedula_cliente` varchar(255) DEFAULT NULL,
  `nombre_cliente` varchar(255) DEFAULT NULL,
  `email_cliente` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_60979d0c88cb5bbb92b7d4c9c8` (`codigo_confirmacion`),
  KEY `FK_3380e97aa0b9269b7b27a498749` (`id_cliente`),
  KEY `FK_ba8b7873a80b6362ff118da7d24` (`id_habitacion`),
  KEY `FK_ec5e6d36f1a0d2188ec75546617` (`id_tipo_habitacion`),
  CONSTRAINT `FK_3380e97aa0b9269b7b27a498749` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_ba8b7873a80b6362ff118da7d24` FOREIGN KEY (`id_habitacion`) REFERENCES `habitaciones` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_ec5e6d36f1a0d2188ec75546617` FOREIGN KEY (`id_tipo_habitacion`) REFERENCES `tipos_habitacion` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.reservas: ~4 rows (aproximadamente)
INSERT INTO `reservas` (`id`, `id_cliente`, `id_hotel`, `id_tipo_habitacion`, `id_habitacion`, `checkin_previsto`, `checkout_previsto`, `checkin_real`, `checkout_real`, `numero_huespedes`, `estado_reserva`, `origen_reserva`, `codigo_confirmacion`, `precio_noche_snapshot`, `observaciones`, `cedula_cliente`, `nombre_cliente`, `email_cliente`, `created_at`, `updated_at`, `deleted_at`, `deleted_by`) VALUES
	(1, 1, 1, 1, 1, '2026-03-15', '2026-03-21', NULL, NULL, 1, 'cancelada', 'web', 'RES-MMTTZM5O-QW4WPJ', 80000.00, NULL, '50919231', 'Juan', 'sena@gmail.com', '2026-03-16 18:45:11.154089', '2026-03-16 18:50:49.000000', NULL, NULL),
	(2, 1, 1, 1, 1, '2026-03-15', '2026-03-21', '2026-03-16 18:51:24', '2026-03-16 18:54:50', 1, 'completada', 'web', 'RES-MMTU741F-FR6TN6', 80000.00, NULL, '50919231', 'Juan', 'sena@gmail.com', '2026-03-16 18:51:00.920990', '2026-03-16 18:54:50.000000', NULL, NULL),
	(3, 1, 1, 1, 1, '2026-03-16', '2026-03-21', '2026-03-16 19:10:35', '2026-03-16 19:12:29', 1, 'completada', 'web', 'RES-MMTUVQLJ-ROQPOK', 80000.00, NULL, '50919231', 'Juan', 'sena@gmail.com', '2026-03-16 19:10:09.907073', '2026-03-16 19:12:29.000000', NULL, NULL),
	(4, 1, 1, 1, 1, '2026-03-16', '2026-03-21', '2026-03-16 20:07:10', '2026-03-17 18:56:20', 1, 'completada', 'web', 'RES-MMTWWKYB-LA728A', 80000.00, NULL, '50919231', 'Juan', 'sena@gmail.com', '2026-03-16 20:06:48.472746', '2026-03-17 18:56:20.000000', NULL, NULL);

-- Volcando estructura para tabla hotel.room_incidents
CREATE TABLE IF NOT EXISTS `room_incidents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_reserva` int(11) DEFAULT NULL,
  `id_habitacion` int(11) NOT NULL,
  `tipo` enum('daño','mantenimiento','limpieza','cliente_complaint','otros') NOT NULL DEFAULT 'otros',
  `estado` enum('reported','in_progress','resolved','cancelled') NOT NULL DEFAULT 'reported',
  `descripcion` text NOT NULL,
  `tipo_reportador` varchar(255) NOT NULL,
  `id_empleado_atiende` int(11) DEFAULT NULL,
  `nota_resolucion` text DEFAULT NULL,
  `prioridad` enum('baja','media','alta','urgente') NOT NULL DEFAULT 'media',
  `cargo_adicional` decimal(12,2) DEFAULT NULL,
  `descripcion_cargo` varchar(255) DEFAULT NULL,
  `fecha_reporte` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `fecha_resolucion` datetime DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `id_cliente` int(11) DEFAULT NULL,
  `id_empleado_reporta` int(11) NOT NULL,
  `nombre_empleado_reporta` varchar(100) NOT NULL,
  `area_asignada` varchar(50) NOT NULL,
  `nombre_empleado_atiende` varchar(100) DEFAULT NULL,
  `es_responsabilidad_cliente` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `IDX_278d5affdb28e8cf0be586a546` (`tipo`),
  KEY `IDX_79f50bef89d407ad90c0b0a0fb` (`estado`),
  KEY `IDX_55f5140708259d519bc6b2ba04` (`id_habitacion`),
  KEY `IDX_cf3831526f1d77090738dbafaf` (`id_reserva`),
  KEY `IDX_cd9f95a15fbef1ef154471154e` (`area_asignada`),
  KEY `IDX_b3802ffd424d730fc5d5c02677` (`id_cliente`),
  CONSTRAINT `FK_55f5140708259d519bc6b2ba043` FOREIGN KEY (`id_habitacion`) REFERENCES `habitaciones` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_cf3831526f1d77090738dbafafe` FOREIGN KEY (`id_reserva`) REFERENCES `reservas` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.room_incidents: ~0 rows (aproximadamente)

-- Volcando estructura para tabla hotel.servicios
CREATE TABLE IF NOT EXISTS `servicios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_hotel` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `categoria` enum('cafeteria','lavanderia','spa','room_service','minibar','otros') NOT NULL DEFAULT 'otros',
  `categoria_servicios_id` int(11) DEFAULT NULL,
  `es_alcoholico` tinyint(1) NOT NULL DEFAULT 0,
  `precio_unitario` decimal(12,2) NOT NULL,
  `unidad_medida` varchar(50) NOT NULL DEFAULT 'unidad',
  `imagen_url` varchar(500) DEFAULT NULL,
  `activo` tinyint(4) NOT NULL DEFAULT 1,
  `disponible_delivery` tinyint(4) NOT NULL DEFAULT 1,
  `disponible_recogida` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_78f42e31050b44ccf6f2e28e07` (`categoria`),
  KEY `IDX_cd924a156b46a432f6e906edda` (`id_hotel`),
  KEY `IDX_servicios_categoria_servicios` (`categoria_servicios_id`),
  CONSTRAINT `FK_servicios_categoria_servicios` FOREIGN KEY (`categoria_servicios_id`) REFERENCES `categoria_servicios` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.servicios: ~50 rows (aproximadamente)
INSERT INTO `servicios` (`id`, `id_hotel`, `nombre`, `descripcion`, `categoria`, `categoria_servicios_id`, `es_alcoholico`, `precio_unitario`, `unidad_medida`, `imagen_url`, `activo`, `disponible_delivery`, `disponible_recogida`, `created_at`, `updated_at`) VALUES
	(1, 1, 'Café americano', 'Café tradicional', 'cafeteria', 2, 0, 8000.00, 'taza', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.418773'),
	(2, 1, 'Cappuccino', 'Café con leche', 'cafeteria', 2, 0, 12000.00, 'taza', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.418773'),
	(3, 1, 'Latte', 'Café latte', 'cafeteria', 2, 0, 13000.00, 'taza', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.418773'),
	(4, 1, 'Chocolate caliente', 'Bebida caliente', 'cafeteria', 2, 0, 10000.00, 'taza', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.418773'),
	(5, 1, 'Té aromático', 'Infusión natural', 'cafeteria', 2, 0, 7000.00, 'taza', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.418773'),
	(6, 1, 'Jugo natural', 'Jugo de frutas', 'cafeteria', 2, 0, 9000.00, 'vaso', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.418773'),
	(7, 1, 'Sandwich mixto', 'Jamón y queso', 'cafeteria', 2, 0, 15000.00, 'unidad', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.418773'),
	(8, 1, 'Croissant', 'Panadería', 'cafeteria', 2, 0, 6000.00, 'unidad', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.418773'),
	(9, 1, 'Postre del día', 'Postre especial', 'cafeteria', 2, 0, 11000.00, 'unidad', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.418773'),
	(10, 1, 'Agua mineral', 'Agua embotellada', 'cafeteria', 2, 0, 5000.00, 'botella', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.418773'),
	(11, 1, 'Desayuno americano', 'Huevos café pan', 'room_service', 6, 0, 25000.00, 'plato', NULL, 1, 1, 0, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.446415'),
	(12, 1, 'Desayuno continental', 'Pan frutas café', 'room_service', 6, 0, 22000.00, 'plato', NULL, 1, 1, 0, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.446415'),
	(13, 1, 'Almuerzo ejecutivo', 'Menú del día', 'room_service', 6, 0, 35000.00, 'plato', NULL, 1, 1, 0, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.446415'),
	(14, 1, 'Cena gourmet', 'Cena especial', 'room_service', 6, 0, 45000.00, 'plato', NULL, 1, 1, 0, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.446415'),
	(15, 1, 'Hamburguesa', 'Hamburguesa premium', 'room_service', 6, 0, 30000.00, 'plato', NULL, 1, 1, 0, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.446415'),
	(16, 1, 'Pizza personal', 'Pizza individual', 'room_service', 6, 0, 28000.00, 'unidad', NULL, 1, 1, 0, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.446415'),
	(17, 1, 'Ensalada', 'Ensalada saludable', 'room_service', 6, 0, 20000.00, 'plato', NULL, 1, 1, 0, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.446415'),
	(18, 1, 'Sopa del día', 'Sopa caliente', 'room_service', 6, 0, 15000.00, 'plato', NULL, 1, 1, 0, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.446415'),
	(19, 1, 'Fruta fresca', 'Fruta picada', 'room_service', 6, 0, 12000.00, 'plato', NULL, 1, 1, 0, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.446415'),
	(20, 1, 'Bebida gaseosa', 'Refresco', 'room_service', 6, 0, 6000.00, 'unidad', NULL, 1, 1, 0, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.446415'),
	(21, 1, 'Agua minibar', 'Agua pequeña', 'minibar', 3, 0, 5000.00, 'unidad', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.452679'),
	(22, 1, 'Gaseosa', 'Refresco lata', 'minibar', 3, 0, 7000.00, 'unidad', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.452679'),
	(23, 1, 'Cerveza', 'Cerveza nacional', 'minibar', 3, 1, 9000.00, 'unidad', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.452679'),
	(24, 1, 'Chocolate', 'Snack dulce', 'minibar', 3, 0, 6000.00, 'unidad', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.452679'),
	(25, 1, 'Papas fritas', 'Snack salado', 'minibar', 3, 0, 8000.00, 'unidad', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.452679'),
	(26, 1, 'Maní', 'Snack', 'minibar', 3, 0, 5000.00, 'unidad', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.452679'),
	(27, 1, 'Jugo caja', 'Jugo procesado', 'minibar', 3, 0, 6000.00, 'unidad', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.452679'),
	(28, 1, 'Galletas', 'Snack dulce', 'minibar', 3, 0, 7000.00, 'unidad', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.452679'),
	(29, 1, 'Masaje relajante', 'Masaje corporal', 'spa', 5, 0, 90000.00, 'sesion', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.437150'),
	(30, 1, 'Masaje terapéutico', 'Masaje especializado', 'spa', 5, 0, 120000.00, 'sesion', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.437150'),
	(31, 1, 'Sauna', 'Acceso sauna', 'spa', 5, 0, 30000.00, 'sesion', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.437150'),
	(32, 1, 'Jacuzzi spa', 'Jacuzzi relajante', 'spa', 5, 0, 40000.00, 'sesion', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.437150'),
	(33, 1, 'Limpieza facial', 'Tratamiento facial', 'spa', 5, 0, 80000.00, 'sesion', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.437150'),
	(34, 1, 'Manicure', 'Cuidado uñas', 'spa', 5, 0, 35000.00, 'sesion', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.437150'),
	(35, 1, 'Pedicure', 'Cuidado pies', 'spa', 5, 0, 35000.00, 'sesion', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.437150'),
	(36, 1, 'Aromaterapia', 'Relajación', 'spa', 5, 0, 50000.00, 'sesion', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.437150'),
	(37, 1, 'Lavado básico', 'Lavado ropa', 'lavanderia', 4, 0, 25000.00, 'kg', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.430514'),
	(38, 1, 'Lavado express', 'Lavado rápido', 'lavanderia', 4, 0, 40000.00, 'kg', NULL, 1, 1, 0, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.430514'),
	(39, 1, 'Planchado', 'Planchado', 'lavanderia', 4, 0, 10000.00, 'prenda', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.430514'),
	(40, 1, 'Lavado en seco', 'Ropa delicada', 'lavanderia', 4, 0, 30000.00, 'prenda', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.430514'),
	(41, 1, 'Lavado cobijas', 'Cobertores', 'lavanderia', 4, 0, 45000.00, 'unidad', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.430514'),
	(42, 1, 'Reparación ropa', 'Arreglos', 'lavanderia', 4, 0, 20000.00, 'prenda', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.430514'),
	(43, 1, 'Servicio premium', 'Lavado VIP', 'lavanderia', 4, 0, 60000.00, 'kg', NULL, 1, 1, 0, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.430514'),
	(44, 1, 'Servicio taxi', 'Transporte', 'otros', 5, 0, 30000.00, 'viaje', NULL, 1, 1, 0, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.484576'),
	(45, 1, 'Tour ciudad', 'Guía turístico', 'otros', 8, 0, 150000.00, 'dia', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.470128'),
	(46, 1, 'Alquiler bicicleta', 'Bicicleta', 'otros', 5, 0, 25000.00, 'dia', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.484576'),
	(47, 1, 'Traslado aeropuerto', 'Transporte aeropuerto', 'otros', 5, 0, 80000.00, 'viaje', NULL, 1, 1, 0, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.484576'),
	(48, 1, 'Impresiones', 'Documentos', 'otros', 5, 0, 2000.00, 'hoja', NULL, 1, 1, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.484576'),
	(49, 1, 'Sala reuniones', 'Sala empresarial', 'otros', 5, 0, 100000.00, 'hora', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.484576'),
	(50, 1, 'Servicio despertador', 'Wake up call', 'otros', 5, 0, 0.00, 'servicio', NULL, 1, 0, 1, '2026-03-16 19:07:35.873453', '2026-03-19 15:17:47.484576');

-- Volcando estructura para tabla hotel.tax_profile_audit
CREATE TABLE IF NOT EXISTS `tax_profile_audit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entidad` varchar(50) NOT NULL,
  `id_entidad` int(11) NOT NULL,
  `tax_profile_anterior` varchar(50) DEFAULT NULL,
  `tax_profile_nuevo` varchar(50) NOT NULL,
  `razon_cambio` text DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `usuario_email` varchar(255) DEFAULT NULL,
  `fecha` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `ip_address` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_tax_profile_audit_entidad` (`entidad`,`id_entidad`),
  KEY `IDX_tax_profile_audit_usuario` (`usuario_id`),
  KEY `IDX_tax_profile_audit_fecha` (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.tax_profile_audit: ~0 rows (aproximadamente)

-- Volcando estructura para tabla hotel.tax_rates
CREATE TABLE IF NOT EXISTS `tax_rates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_hotel` int(11) NOT NULL,
  `categoria_servicios_id` int(11) NOT NULL,
  `tipo_impuesto` enum('IVA','INC','OTROS') NOT NULL DEFAULT 'IVA',
  `tasa_porcentaje` decimal(5,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `aplica_a_residentes` tinyint(1) NOT NULL DEFAULT 1,
  `aplica_a_extranjeros` tinyint(1) NOT NULL DEFAULT 1,
  `activa` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_vigencia_inicio` date NOT NULL DEFAULT curdate(),
  `fecha_vigencia_fin` date DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_tax_rates_unique` (`id_hotel`,`categoria_servicios_id`,`tipo_impuesto`,`fecha_vigencia_fin`),
  KEY `IDX_tax_rates_hotel` (`id_hotel`),
  KEY `IDX_tax_rates_categoria` (`categoria_servicios_id`),
  KEY `IDX_tax_rates_tipo_impuesto` (`tipo_impuesto`),
  KEY `IDX_tax_rates_activa` (`activa`),
  KEY `IDX_tax_rates_vigencia` (`fecha_vigencia_inicio`,`fecha_vigencia_fin`),
  KEY `IDX_tax_rates_active_by_categoria` (`id_hotel`,`categoria_servicios_id`,`activa`,`fecha_vigencia_inicio`,`fecha_vigencia_fin`),
  KEY `IDX_tax_rates_residencia` (`id_hotel`,`aplica_a_residentes`,`aplica_a_extranjeros`,`activa`),
  CONSTRAINT `FK_tax_rates_categoria` FOREIGN KEY (`categoria_servicios_id`) REFERENCES `categoria_servicios` (`id`) ON UPDATE NO ACTION,
  CONSTRAINT `FK_tax_rates_hotel` FOREIGN KEY (`id_hotel`) REFERENCES `hoteles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.tax_rates: ~13 rows (aproximadamente)
INSERT INTO `tax_rates` (`id`, `id_hotel`, `categoria_servicios_id`, `tipo_impuesto`, `tasa_porcentaje`, `descripcion`, `aplica_a_residentes`, `aplica_a_extranjeros`, `activa`, `fecha_vigencia_inicio`, `fecha_vigencia_fin`, `notas`, `created_at`, `updated_at`, `deleted_at`, `deleted_by`) VALUES
	(1, 1, 1, 'IVA', 19.00, 'IVA Alojamiento - Residentes', 1, 0, 1, '2026-03-19', NULL, NULL, '2026-03-19 15:17:47.351731', '2026-03-19 15:17:47.351731', NULL, NULL),
	(2, 1, 1, 'IVA', 0.00, 'IVA Alojamiento - Extranjeros no residentes', 0, 1, 1, '2026-03-19', NULL, NULL, '2026-03-19 15:17:47.351731', '2026-03-19 15:17:47.351731', NULL, NULL),
	(3, 1, 2, 'INC', 8.00, 'INC Restaurante/Cafetería - Impuesto Nacional al Consumo', 1, 1, 1, '2026-03-19', NULL, NULL, '2026-03-19 15:17:47.361443', '2026-03-19 15:17:47.361443', NULL, NULL),
	(4, 1, 3, 'IVA', 19.00, 'IVA Minibar - Productos normales (19%)', 1, 1, 1, '2026-03-19', NULL, NULL, '2026-03-19 15:17:47.367604', '2026-03-19 15:17:47.367604', NULL, NULL),
	(5, 1, 3, 'IVA', 0.00, 'IVA Minibar - Productos básicos excluidos (0%)', 1, 1, 1, '2026-03-19', NULL, NULL, '2026-03-19 15:17:47.367604', '2026-03-19 15:17:47.367604', NULL, NULL),
	(6, 1, 4, 'IVA', 19.00, 'IVA Lavandería (19%)', 1, 1, 1, '2026-03-19', NULL, NULL, '2026-03-19 15:17:47.375771', '2026-03-19 15:17:47.375771', NULL, NULL),
	(7, 1, 5, 'IVA', 19.00, 'IVA Spa - Servicios de bienestar (19%)', 1, 1, 1, '2026-03-19', NULL, NULL, '2026-03-19 15:17:47.381374', '2026-03-19 15:17:47.381374', NULL, NULL),
	(8, 1, 6, 'IVA', 19.00, 'IVA Room Service - Comidas sólidas (19%)', 1, 1, 1, '2026-03-19', NULL, NULL, '2026-03-19 15:17:47.384580', '2026-03-19 15:17:47.384580', NULL, NULL),
	(9, 1, 6, 'INC', 8.00, 'INC Room Service - Bebidas alcohólicas/no alcohólicas (8%)', 1, 1, 1, '2026-03-19', NULL, NULL, '2026-03-19 15:17:47.384580', '2026-03-19 15:17:47.384580', NULL, NULL),
	(10, 1, 7, 'IVA', 19.00, 'IVA Transporte - Traslados (19%)', 1, 1, 1, '2026-03-19', NULL, NULL, '2026-03-19 15:17:47.389002', '2026-03-19 15:17:47.389002', NULL, NULL),
	(11, 1, 8, 'IVA', 19.00, 'IVA Tours - Excursiones (19%)', 1, 1, 1, '2026-03-19', NULL, NULL, '2026-03-19 15:17:47.396362', '2026-03-19 15:17:47.396362', NULL, NULL),
	(12, 1, 9, 'IVA', 19.00, 'IVA Eventos - Salonería (19%)', 1, 1, 1, '2026-03-19', NULL, NULL, '2026-03-19 15:17:47.404094', '2026-03-19 15:17:47.404094', NULL, NULL),
	(13, 1, 10, 'IVA', 0.00, 'Mantenimiento - Servicio interno (No aplica impuesto)', 1, 1, 1, '2026-03-19', NULL, NULL, '2026-03-19 15:17:47.412333', '2026-03-19 15:17:47.412333', NULL, NULL);

-- Volcando estructura para tabla hotel.tax_rates_audit
CREATE TABLE IF NOT EXISTS `tax_rates_audit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tax_rates_id` int(11) NOT NULL,
  `id_hotel` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `operacion` enum('CREATE','UPDATE','DELETE') NOT NULL,
  `tasa_anterior` decimal(5,2) DEFAULT NULL,
  `tasa_nueva` decimal(5,2) DEFAULT NULL,
  `razon_cambio` text DEFAULT NULL,
  `fecha` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `IDX_tax_rates_audit_hotel` (`id_hotel`),
  KEY `IDX_tax_rates_audit_usuario` (`usuario_id`),
  KEY `IDX_tax_rates_audit_fecha` (`fecha`),
  CONSTRAINT `FK_tax_rates_audit_hotel` FOREIGN KEY (`id_hotel`) REFERENCES `hoteles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.tax_rates_audit: ~0 rows (aproximadamente)

-- Volcando estructura para tabla hotel.tipo_habitacion_amenidades
CREATE TABLE IF NOT EXISTS `tipo_habitacion_amenidades` (
  `id_tipo_habitacion` int(11) NOT NULL,
  `id_amenidad` int(11) NOT NULL,
  PRIMARY KEY (`id_tipo_habitacion`,`id_amenidad`),
  KEY `IDX_1ec4b4184d72ebd1a6d3b34eda` (`id_tipo_habitacion`),
  KEY `IDX_24f59c2181126b984ad06e98c2` (`id_amenidad`),
  CONSTRAINT `FK_1ec4b4184d72ebd1a6d3b34edaf` FOREIGN KEY (`id_tipo_habitacion`) REFERENCES `tipos_habitacion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_24f59c2181126b984ad06e98c2d` FOREIGN KEY (`id_amenidad`) REFERENCES `amenidades` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.tipo_habitacion_amenidades: ~36 rows (aproximadamente)
INSERT INTO `tipo_habitacion_amenidades` (`id_tipo_habitacion`, `id_amenidad`) VALUES
	(1, 1),
	(1, 2),
	(1, 3),
	(1, 4),
	(1, 7),
	(2, 1),
	(2, 2),
	(2, 3),
	(2, 4),
	(2, 5),
	(2, 7),
	(3, 1),
	(3, 2),
	(3, 3),
	(3, 4),
	(3, 5),
	(3, 6),
	(3, 7),
	(4, 1),
	(4, 2),
	(4, 3),
	(4, 4),
	(4, 5),
	(4, 6),
	(4, 7),
	(4, 10),
	(5, 1),
	(5, 2),
	(5, 3),
	(5, 4),
	(5, 5),
	(5, 6),
	(5, 7),
	(5, 8),
	(5, 9),
	(5, 10);

-- Volcando estructura para tabla hotel.tipos_habitacion
CREATE TABLE IF NOT EXISTS `tipos_habitacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_hotel` int(11) NOT NULL,
  `nombre_tipo` varchar(255) NOT NULL,
  `categoria_servicios_id` int(11) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `capacidad_personas` smallint(6) NOT NULL,
  `precio_base` decimal(12,2) DEFAULT NULL,
  `activo` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_079e1ae966fd1fdcc15efa2a35` (`nombre_tipo`),
  KEY `IDX_tipos_habitacion_categoria_servicios` (`categoria_servicios_id`),
  CONSTRAINT `FK_tipos_habitacion_categoria_servicios` FOREIGN KEY (`categoria_servicios_id`) REFERENCES `categoria_servicios` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.tipos_habitacion: ~5 rows (aproximadamente)
INSERT INTO `tipos_habitacion` (`id`, `id_hotel`, `nombre_tipo`, `categoria_servicios_id`, `descripcion`, `capacidad_personas`, `precio_base`, `activo`, `created_at`, `updated_at`) VALUES
	(1, 1, 'Sencilla', 1, 'Habitación estándar para una persona', 1, 80000.00, 1, '2026-03-16 18:44:25.136602', '2026-03-19 15:17:47.493226'),
	(2, 1, 'Doble', 1, 'Habitación para dos personas', 2, 120000.00, 1, '2026-03-16 18:44:25.136602', '2026-03-19 15:17:47.493226'),
	(3, 1, 'Ejecutiva', 1, 'Habitación ejecutiva con escritorio', 2, 180000.00, 1, '2026-03-16 18:44:25.136602', '2026-03-19 15:17:47.493226'),
	(4, 1, 'Suite', 1, 'Suite amplia con sala', 3, 250000.00, 1, '2026-03-16 18:44:25.136602', '2026-03-19 15:17:47.493226'),
	(5, 1, 'Penthouse', 1, 'Habitación de lujo premium', 5, 500000.00, 1, '2026-03-16 18:44:25.136602', '2026-03-19 15:17:47.493226');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
