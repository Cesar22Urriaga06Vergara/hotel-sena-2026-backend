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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.amenidades: ~8 rows (aproximadamente)
INSERT INTO `amenidades` (`id`, `nombre`, `icono`, `categoria`, `descripcion`, `created_at`, `updated_at`) VALUES
	(1, 'WiFi', 'mdi-wifi', 'Conectividad', 'Internet de alta velocidad en toda la habitación', '2026-03-14 13:19:27.458456', '2026-03-14 13:19:27.458456'),
	(2, 'Aire acondicionado', 'mdi-air-conditioner', 'Clima', 'Sistema de aire acondicionado individual', '2026-03-14 13:19:27.458456', '2026-03-14 13:19:27.458456'),
	(3, 'Televisor Smart TV', 'mdi-television', 'Entretenimiento', 'Smart TV de 40 pulgadas con acceso a streaming', '2026-03-14 13:19:27.458456', '2026-03-14 13:19:27.458456'),
	(4, 'Minibar', 'mdi-bottle-wine', 'Bebidas', 'Minibar con bebidas y snacks', '2026-03-14 13:19:27.458456', '2026-03-14 13:19:27.458456'),
	(5, 'Baño privado', 'mdi-shower', 'Baño', 'Baño privado con ducha y bañera', '2026-03-14 13:19:27.458456', '2026-03-14 13:19:27.458456'),
	(6, 'Caja de seguridad', 'mdi-lock', 'Seguridad', 'Caja fuerte para documentos y objetos de valor', '2026-03-14 13:19:27.458456', '2026-03-14 13:19:27.458456'),
	(7, 'Escritorio de trabajo', 'mdi-desk', 'Trabajo', 'Área de trabajo con escritorio y silla ergonómica', '2026-03-14 13:19:27.458456', '2026-03-14 13:19:27.458456'),
	(8, 'Desayuno incluido', 'mdi-coffee', 'Alimentos', 'Desayuno buffet diario incluido', '2026-03-14 13:19:27.458456', '2026-03-14 13:19:27.458456');

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
  `fecha_registro` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `googleId` varchar(255) DEFAULT NULL,
  `photoUrl` varchar(255) DEFAULT NULL,
  `authProvider` varchar(255) NOT NULL DEFAULT 'local',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_28fa93cdc380ac510988890cce` (`cedula`),
  UNIQUE KEY `IDX_3cd5652ab34ca1a0a2c7a25531` (`email`),
  UNIQUE KEY `IDX_180e285c672066d3cca2ce1a8d` (`googleId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.clientes: ~0 rows (aproximadamente)
INSERT INTO `clientes` (`id`, `cedula`, `nombre`, `apellido`, `email`, `password`, `telefono`, `tipoDocumento`, `rol`, `direccion`, `paisNacionalidad`, `paisResidencia`, `idiomaPreferido`, `fechaNacimiento`, `tipoVisa`, `numeroVisa`, `visaExpira`, `fecha_registro`, `createdAt`, `updatedAt`, `googleId`, `photoUrl`, `authProvider`) VALUES
	(1, '50919231', 'Juan', 'Sena', 'sena@gmail.com', '$2b$10$ImXMdOFf2..dji8vwaLq3./yeVrFmg5nE82Puqdc8IxlFNR7TBk76', '', 'CC', 'cliente', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-14 13:15:17.154991', '2026-03-14 13:15:17.154991', '2026-03-15 15:34:49.000000', NULL, NULL, 'local');

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
  PRIMARY KEY (`id`),
  KEY `FK_8c0face38acb83d9b55adb0e807` (`id_factura`),
  CONSTRAINT `FK_8c0face38acb83d9b55adb0e807` FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.detalle_facturas: ~0 rows (aproximadamente)

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
  `estado` varchar(255) NOT NULL DEFAULT 'activo',
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_531b62206ec48fc3ba88593af3` (`cedula`),
  UNIQUE KEY `IDX_a5c9113abdd7c58a2290208119` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.empleados: ~4 rows (aproximadamente)
INSERT INTO `empleados` (`id`, `id_hotel`, `cedula`, `nombre`, `apellido`, `email`, `password`, `rol`, `estado`, `createdAt`, `updatedAt`) VALUES
	(1, NULL, '1003001750', 'Cesar', 'Urriaga', 'urriagac44@gmail.com', '$2b$10$OJ1eEny.HEuGrLI.bsDZUOVcOF9aqR/LYjyqRMBwWNuLldjfV3Msy', 'superadmin', 'activo', '2026-03-14 12:52:05.423254', '2026-03-14 13:02:41.926290'),
	(2, 1, '123456789', 'Juan', 'Sena', 'recepcionista@gmail.com', '$2b$10$wXPhbqO8u3obk4/2iKbGYO.YbCMw3bPZlUaBEcKMoBOJiz0YvTCFy', 'recepcionista', 'activo', '2026-03-14 13:13:37.300321', '2026-03-14 13:13:37.300321'),
	(3, 1, '1003001751', 'Cesar', 'Urriaga', 'admin@gmail.com', '$2b$10$2RQOr05vUfP4ikrygcpAgem0VHaeEoQtnvcHjaio/RjZgatQ0Emg2', 'admin', 'activo', '2026-03-15 11:41:23.766228', '2026-03-15 11:41:23.766228'),
	(6, 1, '234567890', 'Camilo Torres', '', 'camilo@gmail.com', '$2b$10$gR9wLTArbnDn97I4Pud5k.e9BXQL6B5k3Xm8zanMXd4.6l1R2ak96', 'cafeteria', 'activo', '2026-03-15 20:14:42.287163', '2026-03-15 20:14:42.287163');

-- Volcando estructura para tabla hotel.facturas
CREATE TABLE IF NOT EXISTS `facturas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero_factura` varchar(255) NOT NULL,
  `id_reserva` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `nombre_cliente` varchar(255) NOT NULL,
  `cedula_cliente` varchar(255) NOT NULL,
  `email_cliente` varchar(255) NOT NULL,
  `id_hotel` int(11) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `porcentaje_iva` decimal(5,2) NOT NULL DEFAULT 19.00,
  `monto_iva` decimal(12,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `estado` varchar(255) NOT NULL DEFAULT 'pendiente',
  `fecha_emision` datetime DEFAULT NULL,
  `fecha_vencimiento` datetime DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `cufe` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `uuid` varchar(255) DEFAULT NULL,
  `xml_data` longtext DEFAULT NULL,
  `json_data` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_0e316c27f9738f9c065b08220b` (`numero_factura`),
  UNIQUE KEY `IDX_f955080f9b27de038fb57af965` (`uuid`),
  KEY `FK_8b3f69e871b3d6c02de6c6d03e5` (`id_reserva`),
  CONSTRAINT `FK_8b3f69e871b3d6c02de6c6d03e5` FOREIGN KEY (`id_reserva`) REFERENCES `reservas` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.facturas: ~0 rows (aproximadamente)

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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.habitaciones: ~15 rows (aproximadamente)
INSERT INTO `habitaciones` (`id`, `id_hotel`, `numero_habitacion`, `piso`, `estado`, `id_tipo_habitacion`, `fecha_actualizacion`, `imagenes`, `created_at`, `updated_at`) VALUES
	(1, 1, '101', '1', 'disponible', 1, '2026-03-15 12:00:29', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773593997/imghotel/b3jd6iboscpm5elecn0z.jpg,https://res.cloudinary.com/dlgsmttw4/image/upload/v1773594019/imghotel/mrn4vbhzlmd7b4lwjuvb.jpg', '2026-03-14 13:20:53.533222', '2026-03-15 12:00:29.000000'),
	(2, 1, '201', '2', 'disponible', 1, '2026-03-15 12:00:29', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773593997/imghotel/b3jd6iboscpm5elecn0z.jpg,https://res.cloudinary.com/dlgsmttw4/image/upload/v1773594019/imghotel/mrn4vbhzlmd7b4lwjuvb.jpg', '2026-03-14 13:20:53.533222', '2026-03-15 12:00:29.000000'),
	(3, 1, '301', '3', 'disponible', 1, '2026-03-15 12:00:29', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773593997/imghotel/b3jd6iboscpm5elecn0z.jpg,https://res.cloudinary.com/dlgsmttw4/image/upload/v1773594019/imghotel/mrn4vbhzlmd7b4lwjuvb.jpg', '2026-03-14 13:20:53.533222', '2026-03-15 12:00:29.000000'),
	(4, 1, '401', '4', 'disponible', 1, '2026-03-15 12:00:29', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773593997/imghotel/b3jd6iboscpm5elecn0z.jpg,https://res.cloudinary.com/dlgsmttw4/image/upload/v1773594019/imghotel/mrn4vbhzlmd7b4lwjuvb.jpg', '2026-03-14 13:20:53.533222', '2026-03-15 12:00:29.000000'),
	(5, 1, '501', '5', 'disponible', 1, '2026-03-15 12:00:29', 'https://res.cloudinary.com/dlgsmttw4/image/upload/v1773593997/imghotel/b3jd6iboscpm5elecn0z.jpg,https://res.cloudinary.com/dlgsmttw4/image/upload/v1773594019/imghotel/mrn4vbhzlmd7b4lwjuvb.jpg', '2026-03-14 13:20:53.533222', '2026-03-15 12:00:29.000000'),
	(6, 1, '102', '1', 'disponible', 2, NULL, NULL, '2026-03-14 13:20:53.551536', '2026-03-14 13:20:53.551536'),
	(7, 1, '202', '2', 'disponible', 2, NULL, NULL, '2026-03-14 13:20:53.551536', '2026-03-14 13:20:53.551536'),
	(8, 1, '302', '3', 'disponible', 2, NULL, NULL, '2026-03-14 13:20:53.551536', '2026-03-14 13:20:53.551536'),
	(9, 1, '402', '4', 'disponible', 2, NULL, NULL, '2026-03-14 13:20:53.551536', '2026-03-14 13:20:53.551536'),
	(10, 1, '502', '5', 'disponible', 2, NULL, NULL, '2026-03-14 13:20:53.551536', '2026-03-14 13:20:53.551536'),
	(11, 1, '103', '1', 'disponible', 3, NULL, NULL, '2026-03-14 13:20:53.571734', '2026-03-14 13:20:53.571734'),
	(12, 1, '203', '2', 'disponible', 3, NULL, NULL, '2026-03-14 13:20:53.571734', '2026-03-14 13:20:53.571734'),
	(13, 1, '303', '3', 'disponible', 3, NULL, NULL, '2026-03-14 13:20:53.571734', '2026-03-14 13:20:53.571734'),
	(14, 1, '403', '4', 'disponible', 3, NULL, NULL, '2026-03-14 13:20:53.571734', '2026-03-14 13:20:53.571734'),
	(15, 1, '503', '5', 'disponible', 3, NULL, NULL, '2026-03-14 13:20:53.571734', '2026-03-14 13:20:53.571734');

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
	(1, 'efectivo', NULL, 1, 0, '2026-03-16 12:56:25.475130'),
	(2, 'tarjeta_credito', NULL, 1, 1, '2026-03-16 12:56:25.482205'),
	(3, 'tarjeta_debito', NULL, 1, 1, '2026-03-16 12:56:25.483940'),
	(4, 'transferencia_bancaria', NULL, 1, 1, '2026-03-16 12:56:25.486847'),
	(5, 'nequi', NULL, 1, 1, '2026-03-16 12:56:25.488405'),
	(6, 'daviplata', NULL, 1, 1, '2026-03-16 12:56:25.490413'),
	(7, 'pse', NULL, 1, 1, '2026-03-16 12:56:25.492617');

-- Volcando estructura para tabla hotel.pagos
CREATE TABLE IF NOT EXISTS `pagos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_factura` int(11) NOT NULL,
  `id_medio_pago` int(11) NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `referencia_pago` varchar(255) DEFAULT NULL,
  `id_empleado_registro` int(11) DEFAULT NULL,
  `estado` varchar(255) NOT NULL DEFAULT 'completado',
  `observaciones` text DEFAULT NULL,
  `fecha_pago` datetime(6) NOT NULL DEFAULT current_timestamp(6),
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.pedido_items: ~5 rows (aproximadamente)
INSERT INTO `pedido_items` (`id`, `id_pedido`, `id_servicio`, `cantidad`, `precio_unitario_snapshot`, `subtotal`, `nombre_servicio_snapshot`, `observacion`, `created_at`) VALUES
	(1, 1, 10, 2, 5000.00, 10000.00, 'Agua Mineral', NULL, '2026-03-15 17:25:17.081704'),
	(2, 2, 1, 1, 15000.00, 15000.00, 'Café Expreso', NULL, '2026-03-15 19:52:59.608866'),
	(3, 2, 10, 1, 5000.00, 5000.00, 'Agua Mineral', NULL, '2026-03-15 19:52:59.612948'),
	(4, 2, 2, 1, 18000.00, 18000.00, 'Cappuccino', NULL, '2026-03-15 19:52:59.619637'),
	(5, 2, 5, 1, 35000.00, 35000.00, 'Desayuno Continental', NULL, '2026-03-15 19:52:59.623940');

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
	(1, 1, 1, 1, 'recogida', 'cancelado', 'cafeteria', NULL, NULL, NULL, 10000.00, '2026-03-15 17:25:17.066342', '2026-03-15 17:25:42.000000'),
	(2, 1, 1, 1, 'delivery', 'entregado', 'cafeteria', NULL, NULL, 6, 73000.00, '2026-03-15 19:52:59.593460', '2026-03-15 20:14:57.000000');

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_60979d0c88cb5bbb92b7d4c9c8` (`codigo_confirmacion`),
  KEY `FK_3380e97aa0b9269b7b27a498749` (`id_cliente`),
  KEY `FK_ba8b7873a80b6362ff118da7d24` (`id_habitacion`),
  KEY `FK_ec5e6d36f1a0d2188ec75546617` (`id_tipo_habitacion`),
  CONSTRAINT `FK_3380e97aa0b9269b7b27a498749` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_ba8b7873a80b6362ff118da7d24` FOREIGN KEY (`id_habitacion`) REFERENCES `habitaciones` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_ec5e6d36f1a0d2188ec75546617` FOREIGN KEY (`id_tipo_habitacion`) REFERENCES `tipos_habitacion` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.reservas: ~3 rows (aproximadamente)
INSERT INTO `reservas` (`id`, `id_cliente`, `id_hotel`, `id_tipo_habitacion`, `id_habitacion`, `checkin_previsto`, `checkout_previsto`, `checkin_real`, `checkout_real`, `numero_huespedes`, `estado_reserva`, `origen_reserva`, `codigo_confirmacion`, `precio_noche_snapshot`, `observaciones`, `cedula_cliente`, `nombre_cliente`, `email_cliente`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, 1, 1, '2026-03-14', '2026-03-17', '2026-03-15 17:21:07', '2026-03-16 12:58:58', 1, 'completada', 'web', 'RES-MMS9YREZ-WWP6EP', 150.00, NULL, '50919231', 'Juan', 'sena@gmail.com', '2026-03-15 16:36:52.827072', '2026-03-16 12:58:58.000000'),
	(2, 1, 1, 1, 1, '2026-03-15', '2026-03-21', '2026-03-16 13:00:25', '2026-03-16 13:03:41', 1, 'completada', 'web', 'RES-MMTHNNYF-TVE8Q8', 20000.00, NULL, '50919231', 'Juan', 'sena@gmail.com', '2026-03-16 12:59:58.220438', '2026-03-16 13:03:41.000000'),
	(3, 1, 1, 1, 1, '2026-03-15', '2026-03-21', '2026-03-16 13:32:59', '2026-03-16 13:37:09', 1, 'completada', 'web', 'RES-MMTITKEU-K8EA87', 20000.00, NULL, '50919231', 'Juan', 'sena@gmail.com', '2026-03-16 13:32:33.183885', '2026-03-16 13:37:09.000000');

-- Volcando estructura para tabla hotel.servicios
CREATE TABLE IF NOT EXISTS `servicios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_hotel` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `categoria` enum('cafeteria','lavanderia','spa','room_service','minibar','otros') NOT NULL DEFAULT 'otros',
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
  KEY `IDX_cd924a156b46a432f6e906edda` (`id_hotel`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.servicios: ~60 rows (aproximadamente)
INSERT INTO `servicios` (`id`, `id_hotel`, `nombre`, `descripcion`, `categoria`, `precio_unitario`, `unidad_medida`, `imagen_url`, `activo`, `disponible_delivery`, `disponible_recogida`, `created_at`, `updated_at`) VALUES
	(1, 1, 'Café Expreso', 'Café expreso de alta calidad', 'cafeteria', 15000.00, 'taza', NULL, 1, 1, 1, '2026-03-15 12:07:36.654158', '2026-03-15 12:07:36.654158'),
	(2, 1, 'Cappuccino', 'Cappuccino cremoso con leche', 'cafeteria', 18000.00, 'taza', NULL, 1, 1, 1, '2026-03-15 12:07:36.654158', '2026-03-15 12:07:36.654158'),
	(3, 1, 'Latte', 'Café con leche suave', 'cafeteria', 16000.00, 'taza', NULL, 1, 1, 1, '2026-03-15 12:07:36.654158', '2026-03-15 12:07:36.654158'),
	(4, 1, 'Té Caliente', 'Variado de tés premium', 'cafeteria', 12000.00, 'taza', NULL, 1, 1, 1, '2026-03-15 12:07:36.654158', '2026-03-15 12:07:36.654158'),
	(5, 1, 'Desayuno Continental', 'Pan, frutas y queso', 'cafeteria', 35000.00, 'porción', NULL, 1, 1, 0, '2026-03-15 12:07:36.654158', '2026-03-15 12:07:36.654158'),
	(6, 1, 'Jugo Natural', 'Jugos frescos de frutas', 'cafeteria', 14000.00, 'vaso', NULL, 1, 1, 1, '2026-03-15 12:07:36.654158', '2026-03-15 12:07:36.654158'),
	(7, 1, 'Pastel de Chocolate', 'Postre de chocolate casero', 'cafeteria', 12000.00, 'porción', NULL, 1, 1, 1, '2026-03-15 12:07:36.654158', '2026-03-15 12:07:36.654158'),
	(8, 1, 'Sandwich Premium', 'Sandwich con carnes y vegetales', 'cafeteria', 28000.00, 'unidad', NULL, 1, 1, 1, '2026-03-15 12:07:36.654158', '2026-03-15 12:07:36.654158'),
	(9, 1, 'Ensalada Fresca', 'Mezcla de verduras del día', 'cafeteria', 22000.00, 'porción', NULL, 1, 1, 1, '2026-03-15 12:07:36.654158', '2026-03-15 12:07:36.654158'),
	(10, 1, 'Agua Mineral', 'Agua embotellada premium', 'cafeteria', 5000.00, 'botella', NULL, 1, 1, 1, '2026-03-15 12:07:36.654158', '2026-03-15 12:07:36.654158'),
	(11, 1, 'Lavado y Planchado Estándar', 'Lavado y secado de ropa', 'lavanderia', 50000.00, 'kg', NULL, 1, 1, 1, '2026-03-15 12:07:36.687776', '2026-03-15 12:07:36.687776'),
	(12, 1, 'Servicio Express (4 horas)', 'Lavado rápido garantizado', 'lavanderia', 75000.00, 'kg', NULL, 1, 1, 0, '2026-03-15 12:07:36.687776', '2026-03-15 12:07:36.687776'),
	(13, 1, 'Limpieza de Trajes', 'Servicio especializado', 'lavanderia', 40000.00, 'prenda', NULL, 1, 0, 1, '2026-03-15 12:07:36.687776', '2026-03-15 12:07:36.687776'),
	(14, 1, 'Planchado de Camisas', 'Planchado impecable de camisas', 'lavanderia', 8000.00, 'prenda', NULL, 1, 1, 1, '2026-03-15 12:07:36.687776', '2026-03-15 12:07:36.687776'),
	(15, 1, 'Limpieza en Seco', 'Limpieza de prendas delicadas', 'lavanderia', 35000.00, 'prenda', NULL, 1, 0, 1, '2026-03-15 12:07:36.687776', '2026-03-15 12:07:36.687776'),
	(16, 1, 'Servicio Premium (2 horas)', 'Lavado super rápido', 'lavanderia', 120000.00, 'kg', NULL, 1, 1, 0, '2026-03-15 12:07:36.687776', '2026-03-15 12:07:36.687776'),
	(17, 1, 'Planchado de Pantalones', 'Planchado profesional', 'lavanderia', 6000.00, 'prenda', NULL, 1, 1, 1, '2026-03-15 12:07:36.687776', '2026-03-15 12:07:36.687776'),
	(18, 1, 'Lavado de Edredones', 'Limpieza profunda de cobertores', 'lavanderia', 80000.00, 'unidad', NULL, 1, 0, 1, '2026-03-15 12:07:36.687776', '2026-03-15 12:07:36.687776'),
	(19, 1, 'Impermeabilización', 'Tratamiento protector', 'lavanderia', 45000.00, 'prenda', NULL, 1, 0, 1, '2026-03-15 12:07:36.687776', '2026-03-15 12:07:36.687776'),
	(20, 1, 'Reparación de Prendas', 'Ajustes y reparaciones menores', 'lavanderia', 20000.00, 'prenda', NULL, 1, 0, 1, '2026-03-15 12:07:36.687776', '2026-03-15 12:07:36.687776'),
	(21, 1, 'Masaje Relajante', 'Masaje corporal de 60 minutos', 'spa', 120000.00, 'sesión', NULL, 1, 0, 1, '2026-03-15 12:07:36.721379', '2026-03-15 12:07:36.721379'),
	(22, 1, 'Facial Rejuvenecedor', 'Tratamiento facial premium', 'spa', 100000.00, 'sesión', NULL, 1, 0, 1, '2026-03-15 12:07:36.721379', '2026-03-15 12:07:36.721379'),
	(23, 1, 'Sauna', 'Acceso a sauna privada (30 min)', 'spa', 30000.00, 'sesión', NULL, 1, 0, 1, '2026-03-15 12:07:36.721379', '2026-03-15 12:07:36.721379'),
	(24, 1, 'Masaje Descontracturante', 'Masaje terapéutico (90 min)', 'spa', 160000.00, 'sesión', NULL, 1, 0, 1, '2026-03-15 12:07:36.721379', '2026-03-15 12:07:36.721379'),
	(25, 1, 'Pedicura Completa', 'Limpieza y decoración de uñas', 'spa', 45000.00, 'sesión', NULL, 1, 0, 1, '2026-03-15 12:07:36.721379', '2026-03-15 12:07:36.721379'),
	(26, 1, 'Manicura Profesional', 'Cuidado de manos y uñas', 'spa', 40000.00, 'sesión', NULL, 1, 0, 1, '2026-03-15 12:07:36.721379', '2026-03-15 12:07:36.721379'),
	(27, 1, 'Tratamiento Corporal', 'Exfoliación e hidratación', 'spa', 85000.00, 'sesión', NULL, 1, 0, 1, '2026-03-15 12:07:36.721379', '2026-03-15 12:07:36.721379'),
	(28, 1, 'Jacuzzi Privado', 'Baño en agua caliente con burbujas', 'spa', 50000.00, 'sesión', NULL, 1, 0, 1, '2026-03-15 12:07:36.721379', '2026-03-15 12:07:36.721379'),
	(29, 1, 'Aromaterapia', 'Sesión relajante con aromas', 'spa', 35000.00, 'sesión', NULL, 1, 0, 1, '2026-03-15 12:07:36.721379', '2026-03-15 12:07:36.721379'),
	(30, 1, 'Piedras Calientes', 'Masaje con piedras volcánicas', 'spa', 110000.00, 'sesión', NULL, 1, 0, 1, '2026-03-15 12:07:36.721379', '2026-03-15 12:07:36.721379'),
	(31, 1, 'Almuerzo Ejecutivo', 'Menú del día con bebida', 'room_service', 45000.00, 'bandeja', NULL, 1, 1, 0, '2026-03-15 12:07:36.753496', '2026-03-15 12:07:36.753496'),
	(32, 1, 'Cena Especial', 'Plato principal a elegir', 'room_service', 60000.00, 'bandeja', NULL, 1, 1, 0, '2026-03-15 12:07:36.753496', '2026-03-15 12:07:36.753496'),
	(33, 1, 'Bebidas Variadas', 'Refrescos, jugos y bebidas', 'room_service', 8000.00, 'unidad', NULL, 1, 1, 0, '2026-03-15 12:07:36.753496', '2026-03-15 12:07:36.753496'),
	(34, 1, 'Desayuno en Habitación', 'Opciones variadas', 'room_service', 40000.00, 'bandeja', NULL, 1, 1, 0, '2026-03-15 12:07:36.753496', '2026-03-15 12:07:36.753496'),
	(35, 1, 'Fruta Fresca', 'Frutas de temporada', 'room_service', 20000.00, 'cesta', NULL, 1, 1, 0, '2026-03-15 12:07:36.753496', '2026-03-15 12:07:36.753496'),
	(36, 1, 'Tabla de Quesos y Jamón', 'Tabla gourmet variada', 'room_service', 55000.00, 'unidad', NULL, 1, 1, 0, '2026-03-15 12:07:36.753496', '2026-03-15 12:07:36.753496'),
	(37, 1, 'Postre del Chef', 'Selección de postres especiales', 'room_service', 18000.00, 'porción', NULL, 1, 1, 0, '2026-03-15 12:07:36.753496', '2026-03-15 12:07:36.753496'),
	(38, 1, 'Sopa Caliente', 'Variedad de sopas del día', 'room_service', 15000.00, 'tazón', NULL, 1, 1, 0, '2026-03-15 12:07:36.753496', '2026-03-15 12:07:36.753496'),
	(39, 1, 'Ensalada Gourmet', 'Mezclas frescas premium', 'room_service', 32000.00, 'porción', NULL, 1, 1, 0, '2026-03-15 12:07:36.753496', '2026-03-15 12:07:36.753496'),
	(40, 1, 'Chocolate Caliente', 'Bebida caliente con malvaviscos', 'room_service', 12000.00, 'taza', NULL, 1, 1, 0, '2026-03-15 12:07:36.753496', '2026-03-15 12:07:36.753496'),
	(41, 1, 'Cerveza Premium', 'Cerveza importada 350ml', 'minibar', 18000.00, 'unidad', NULL, 1, 1, 1, '2026-03-15 12:07:36.786176', '2026-03-15 12:07:36.786176'),
	(42, 1, 'Vino Tinto', 'Copa de vino tinto seleccionado', 'minibar', 25000.00, 'unidad', NULL, 1, 1, 0, '2026-03-15 12:07:36.786176', '2026-03-15 12:07:36.786176'),
	(43, 1, 'Refresco Cola', 'Bebida gaseosa 330ml', 'minibar', 8000.00, 'unidad', NULL, 1, 1, 1, '2026-03-15 12:07:36.786176', '2026-03-15 12:07:36.786176'),
	(44, 1, 'Agua Mineral', 'Botella de agua 500ml', 'minibar', 5000.00, 'unidad', NULL, 1, 1, 1, '2026-03-15 12:07:36.786176', '2026-03-15 12:07:36.786176'),
	(45, 1, 'Whisky Premium', 'Trago de whisky single malt', 'minibar', 45000.00, 'unidad', NULL, 1, 1, 0, '2026-03-15 12:07:36.786176', '2026-03-15 12:07:36.786176'),
	(46, 1, 'Jugo Natural', 'Jugo recién exprimido', 'minibar', 10000.00, 'unidad', NULL, 1, 1, 1, '2026-03-15 12:07:36.786176', '2026-03-15 12:07:36.786176'),
	(47, 1, 'Licor Digestivo', 'Licor después de comida', 'minibar', 20000.00, 'unidad', NULL, 1, 1, 0, '2026-03-15 12:07:36.786176', '2026-03-15 12:07:36.786176'),
	(48, 1, 'Agua Tónica', 'Bebida refrescante 250ml', 'minibar', 6000.00, 'unidad', NULL, 1, 1, 1, '2026-03-15 12:07:36.786176', '2026-03-15 12:07:36.786176'),
	(49, 1, 'Champaña', 'Champaña brut por copa', 'minibar', 35000.00, 'unidad', NULL, 1, 1, 0, '2026-03-15 12:07:36.786176', '2026-03-15 12:07:36.786176'),
	(50, 1, 'Té Frío', 'Bebida fría de té premium', 'minibar', 9000.00, 'unidad', NULL, 1, 1, 1, '2026-03-15 12:07:36.786176', '2026-03-15 12:07:36.786176'),
	(51, 1, 'Personal Shopper', 'Acompañamiento en compras', 'otros', 80000.00, 'hora', NULL, 1, 0, 1, '2026-03-15 12:07:36.818723', '2026-03-15 12:07:36.818723'),
	(52, 1, 'Servicio de Taxi', 'Transporte privado dentro de la ciudad', 'otros', 50000.00, 'viaje', NULL, 1, 1, 0, '2026-03-15 12:07:36.818723', '2026-03-15 12:07:36.818723'),
	(53, 1, 'Guía Turístico', 'Tours por la ciudad', 'otros', 120000.00, 'día', NULL, 1, 0, 1, '2026-03-15 12:07:36.818723', '2026-03-15 12:07:36.818723'),
	(54, 1, 'Servicio de Secretaria', 'Apoyo administrativo', 'otros', 60000.00, 'hora', NULL, 1, 1, 1, '2026-03-15 12:07:36.818723', '2026-03-15 12:07:36.818723'),
	(55, 1, 'Entrega de Flores', 'Arreglo floral especial', 'otros', 70000.00, 'unidad', NULL, 1, 1, 0, '2026-03-15 12:07:36.818723', '2026-03-15 12:07:36.818723'),
	(56, 1, 'Reparación de Equipos', 'Servicio técnico urgente', 'otros', 40000.00, 'hora', NULL, 1, 1, 1, '2026-03-15 12:07:36.818723', '2026-03-15 12:07:36.818723'),
	(57, 1, 'Alquiler de Bicicletas', 'Bicicletas para explorar', 'otros', 35000.00, 'día', NULL, 1, 0, 1, '2026-03-15 12:07:36.818723', '2026-03-15 12:07:36.818723'),
	(58, 1, 'Consultoría Empresarial', 'Asesoría de negocios', 'otros', 150000.00, 'hora', NULL, 1, 1, 1, '2026-03-15 12:07:36.818723', '2026-03-15 12:07:36.818723'),
	(59, 1, 'Servicio de Traducción', 'Traductor disponible', 'otros', 50000.00, 'hora', NULL, 1, 1, 1, '2026-03-15 12:07:36.818723', '2026-03-15 12:07:36.818723'),
	(60, 1, 'Servicio de Fotógrafo', 'Sesión fotográfica profesional', 'otros', 200000.00, 'sesión', NULL, 1, 0, 1, '2026-03-15 12:07:36.818723', '2026-03-15 12:07:36.818723');

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

-- Volcando datos para la tabla hotel.tipo_habitacion_amenidades: ~21 rows (aproximadamente)
INSERT INTO `tipo_habitacion_amenidades` (`id_tipo_habitacion`, `id_amenidad`) VALUES
	(1, 1),
	(1, 2),
	(1, 3),
	(1, 5),
	(1, 6),
	(1, 7),
	(2, 1),
	(2, 2),
	(2, 3),
	(2, 4),
	(2, 5),
	(2, 6),
	(2, 7),
	(3, 1),
	(3, 2),
	(3, 3),
	(3, 4),
	(3, 5),
	(3, 6),
	(3, 7),
	(3, 8);

-- Volcando estructura para tabla hotel.tipos_habitacion
CREATE TABLE IF NOT EXISTS `tipos_habitacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_hotel` int(11) NOT NULL,
  `nombre_tipo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `capacidad_personas` smallint(6) NOT NULL,
  `precio_base` decimal(12,2) DEFAULT NULL,
  `activo` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_079e1ae966fd1fdcc15efa2a35` (`nombre_tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla hotel.tipos_habitacion: ~3 rows (aproximadamente)
INSERT INTO `tipos_habitacion` (`id`, `id_hotel`, `nombre_tipo`, `descripcion`, `capacidad_personas`, `precio_base`, `activo`, `created_at`, `updated_at`) VALUES
	(1, 1, 'Suite Estándar', 'Habitación elegante con cama queen size y comodidades básicas', 2, 20000.00, 1, '2026-03-14 13:20:17.212591', '2026-03-15 20:20:09.235134'),
	(2, 1, 'Suite Doble', 'Habitación espaciosa con dos camas dobles y vistas parciales', 4, 30000.00, 1, '2026-03-14 13:20:17.212591', '2026-03-15 20:21:04.411031'),
	(3, 1, 'Suite Premium', 'Habitación de lujo con cama king size, jacuzzi y minibar', 2, 40000.00, 1, '2026-03-14 13:20:17.212591', '2026-03-15 20:21:39.321630');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
