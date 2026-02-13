
-- ===================================================================
--  ERD MiPymes Hotelería - DDL para MySQL/MariaDB (HeidiSQL)
--  Crea el esquema completo con claves primarias, foráneas, UK e índices.
--  Charset: utf8mb4  |  Motor: InnoDB
-- ===================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS hotel_mipymes;
CREATE DATABASE hotel_mipymes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_mipymes;

-- ================================================================
-- 1) Catálogo raíz
-- ================================================================
CREATE TABLE hotel (
  id_hotel        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(120) NOT NULL,
  nit             VARCHAR(20) NULL,
  direccion       VARCHAR(140) NULL,
  telefono        VARCHAR(20) NULL,
  email           VARCHAR(120) NULL,
  estrellas       SMALLINT UNSIGNED NULL,
  descripcion     TEXT NULL,
  PRIMARY KEY (id_hotel),
  UNIQUE KEY uk_hotel_nit (nit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 2) Personas: empleados y clientes
-- ================================================================
CREATE TABLE empleado (
  id_empleado     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cedula          VARCHAR(20) NOT NULL,
  nombre          VARCHAR(80) NOT NULL,
  apellido        VARCHAR(80) NOT NULL,
  cargo           VARCHAR(60) NULL,
  telefono        VARCHAR(20) NULL,
  email           VARCHAR(120) NULL,
  fecha_ingreso   DATE NULL,
  salario         DECIMAL(12,2) UNSIGNED NULL,
  id_hotel        INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_empleado),
  UNIQUE KEY uk_empleado_cedula (cedula),
  KEY idx_empleado_hotel (id_hotel),
  CONSTRAINT fk_empleado_hotel
    FOREIGN KEY (id_hotel) REFERENCES hotel(id_hotel)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cliente (
  id_cliente        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo_documento    VARCHAR(3) NULL,          -- CC/TI/CE/PAS
  cedula            VARCHAR(20) NOT NULL,
  nombre            VARCHAR(80) NOT NULL,
  apellido          VARCHAR(80) NOT NULL,
  telefono          VARCHAR(20) NULL,
  email             VARCHAR(120) NULL,
  direccion         VARCHAR(140) NULL,
  pais_nacionalidad CHAR(2) NULL,             -- ISO-3166-1
  pais_residencia   CHAR(2) NULL,
  idioma_preferido  VARCHAR(8) NULL,          -- ISO 639-1
  fecha_registro    TIMESTAMP NULL DEFAULT NULL,
  fecha_nacimiento  DATE NULL,
  visa_tipo         VARCHAR(20) NULL,
  visa_numero       VARCHAR(20) NULL,
  visa_expira       DATE NULL,
  PRIMARY KEY (id_cliente),
  UNIQUE KEY uk_cliente_cedula (cedula),
  KEY idx_cliente_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 3) Usuarios del sistema (Autenticación)
-- ================================================================
CREATE TABLE users (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email               VARCHAR(120) NOT NULL,
  password            VARCHAR(255) NOT NULL,
  fullName            VARCHAR(160) NOT NULL,
  role                ENUM('admin','recepcionista','cliente') NOT NULL DEFAULT 'cliente',
  isActive            TINYINT(1) NOT NULL DEFAULT 1,
  id_empleado         INT UNSIGNED NULL,
  id_cliente          INT UNSIGNED NULL,
  createdAt           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastLogin           TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_empleado (id_empleado),
  KEY idx_users_cliente (id_cliente),
  CONSTRAINT fk_users_empleado
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_users_cliente
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE refresh_tokens (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  token               VARCHAR(500) NOT NULL,
  userId              INT UNSIGNED NOT NULL,
  expiresAt           TIMESTAMP NOT NULL,
  createdAt           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  isRevoked           TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_refresh_token (token),
  KEY idx_rt_userId (userId),
  CONSTRAINT fk_rt_user
    FOREIGN KEY (userId) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 4) Tipos de habitación, amenidades y habitaciones
-- ================================================================
CREATE TABLE tipo_habitacion (
  id_tipo_habitacion  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_hotel            INT UNSIGNED NOT NULL,
  nombre_tipo         VARCHAR(60) NOT NULL,
  descripcion         TEXT NULL,
  capacidad_personas  SMALLINT UNSIGNED NULL,
  precio_base         DECIMAL(12,2) UNSIGNED NULL,
  PRIMARY KEY (id_tipo_habitacion),
  UNIQUE KEY uk_tipo_hab_nombre (id_hotel, nombre_tipo),
  KEY idx_tipo_hab_hotel (id_hotel),
  CONSTRAINT fk_tipohab_hotel
    FOREIGN KEY (id_hotel) REFERENCES hotel(id_hotel)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE amenidad (
  id_amenidad     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(60) NOT NULL,
  PRIMARY KEY (id_amenidad),
  UNIQUE KEY uk_amenidad_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tipo_habitacion_amenidad (
  id_tipo_habitacion  INT UNSIGNED NOT NULL,
  id_amenidad         INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_tipo_habitacion, id_amenidad),
  CONSTRAINT fk_tha_tipo
    FOREIGN KEY (id_tipo_habitacion) REFERENCES tipo_habitacion(id_tipo_habitacion)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_tha_amenidad
    FOREIGN KEY (id_amenidad) REFERENCES amenidad(id_amenidad)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE habitacion (
  id_habitacion       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_hotel            INT UNSIGNED NOT NULL,
  numero_habitacion   VARCHAR(10) NOT NULL,
  piso                VARCHAR(10) NULL,
  estado              ENUM('DISPONIBLE','OCUPADA','LIMPIEZA','MANTENIMIENTO') NULL DEFAULT 'DISPONIBLE',
  id_tipo_habitacion  INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_habitacion),
  UNIQUE KEY uk_hab_numero (id_hotel, numero_habitacion),
  KEY idx_hab_hotel (id_hotel),
  KEY idx_hab_tipo (id_tipo_habitacion),
  CONSTRAINT fk_hab_hotel
    FOREIGN KEY (id_hotel) REFERENCES hotel(id_hotel)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_hab_tipo
    FOREIGN KEY (id_tipo_habitacion) REFERENCES tipo_habitacion(id_tipo_habitacion)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 5) Tarifas
-- ================================================================
CREATE TABLE tarifa (
  id_tarifa           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_hotel            INT UNSIGNED NOT NULL,
  id_tipo_habitacion  INT UNSIGNED NOT NULL,
  fecha_inicio        DATE NOT NULL,
  fecha_fin           DATE NOT NULL,
  dias_semana         VARCHAR(14) NULL,
  precio_noche        DECIMAL(12,2) UNSIGNED NOT NULL,
  temporada           VARCHAR(40) NULL,
  PRIMARY KEY (id_tarifa),
  KEY idx_tarifa_hotel (id_hotel),
  KEY idx_tarifa_tipo (id_tipo_habitacion),
  CONSTRAINT fk_tarifa_hotel
    FOREIGN KEY (id_hotel) REFERENCES hotel(id_hotel)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_tarifa_tipo
    FOREIGN KEY (id_tipo_habitacion) REFERENCES tipo_habitacion(id_tipo_habitacion)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CHECK (fecha_fin >= fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 6) Servicios y productos (inventario)
-- ================================================================
CREATE TABLE servicio (
  id_servicio     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_hotel        INT UNSIGNED NOT NULL,
  nombre_servicio VARCHAR(80) NOT NULL,
  descripcion     TEXT NULL,
  precio          DECIMAL(12,2) UNSIGNED NULL,
  categoria       VARCHAR(40) NULL,
  disponible      TINYINT(1) NULL DEFAULT 1,
  PRIMARY KEY (id_servicio),
  KEY idx_servicio_hotel (id_hotel),
  CONSTRAINT fk_servicio_hotel
    FOREIGN KEY (id_hotel) REFERENCES hotel(id_hotel)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE producto (
  id_producto     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_hotel        INT UNSIGNED NOT NULL,
  nombre          VARCHAR(80) NOT NULL,
  categoria       VARCHAR(40) NULL,
  unidad          VARCHAR(10) NULL,
  costo           DECIMAL(12,2) UNSIGNED NULL,
  PRIMARY KEY (id_producto),
  KEY idx_producto_hotel (id_hotel),
  CONSTRAINT fk_producto_hotel
    FOREIGN KEY (id_hotel) REFERENCES hotel(id_hotel)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE servicio_producto (
  id_servicio       INT UNSIGNED NOT NULL,
  id_producto       INT UNSIGNED NOT NULL,
  cant_por_servicio DECIMAL(10,2) UNSIGNED NULL,
  PRIMARY KEY (id_servicio, id_producto),
  CONSTRAINT fk_sp_servicio
    FOREIGN KEY (id_servicio) REFERENCES servicio(id_servicio)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sp_producto
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE stock (
  id_hotel        INT UNSIGNED NOT NULL,
  id_producto     INT UNSIGNED NOT NULL,
  cantidad_actual DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id_hotel, id_producto),
  CONSTRAINT fk_stock_hotel
    FOREIGN KEY (id_hotel) REFERENCES hotel(id_hotel)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_stock_producto
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE mov_inventario (
  id_mov              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_hotel            INT UNSIGNED NOT NULL,
  id_producto         INT UNSIGNED NOT NULL,
  tipo                VARCHAR(10) NOT NULL,  -- ENTRADA/SALIDA/AJUSTE
  cantidad            DECIMAL(12,2) NOT NULL, -- puede ser negativa/positiva
  costo_unitario      DECIMAL(12,2) UNSIGNED NULL,
  fecha               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  motivo              VARCHAR(120) NULL,
  id_reserva_servicio INT UNSIGNED NULL,
  PRIMARY KEY (id_mov),
  KEY idx_mov_hotel (id_hotel),
  KEY idx_mov_producto (id_producto),
  CONSTRAINT fk_mov_hotel
    FOREIGN KEY (id_hotel) REFERENCES hotel(id_hotel)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_mov_producto
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================================
-- 7) Reservas y consumos
-- ================================================================
CREATE TABLE reserva (
  id_reserva          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_cliente          INT UNSIGNED NOT NULL,
  id_tipo_habitacion  INT UNSIGNED NULL,
  id_habitacion       INT UNSIGNED NULL,
  checkin_previsto    DATE NOT NULL,
  checkout_previsto   DATE NOT NULL,
  checkin_real        TIMESTAMP NULL,
  checkout_real       TIMESTAMP NULL,
  numero_huespedes    SMALLINT UNSIGNED NULL,
  estado_reserva      ENUM('PENDIENTE','CONFIRMADA','EN_CURSO','COMPLETADA','CANCELADA') NULL DEFAULT 'PENDIENTE',
  fecha_reserva       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observaciones       TEXT NULL,
  PRIMARY KEY (id_reserva),
  KEY idx_reserva_cliente (id_cliente),
  KEY idx_reserva_tipo (id_tipo_habitacion),
  KEY idx_reserva_habitacion (id_habitacion),
  KEY idx_reserva_disp (id_habitacion, checkin_previsto, checkout_previsto),
  CONSTRAINT fk_reserva_cliente
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reserva_tipo
    FOREIGN KEY (id_tipo_habitacion) REFERENCES tipo_habitacion(id_tipo_habitacion)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_reserva_habitacion
    FOREIGN KEY (id_habitacion) REFERENCES habitacion(id_habitacion)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CHECK (checkout_previsto >= checkin_previsto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reserva_servicio (
  id_reserva_servicio INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_reserva          INT UNSIGNED NOT NULL,
  id_servicio         INT UNSIGNED NOT NULL,
  id_empleado         INT UNSIGNED NOT NULL,
  cantidad            DECIMAL(10,2) UNSIGNED NOT NULL,
  precio_unitario     DECIMAL(12,2) UNSIGNED NOT NULL,
  subtotal            DECIMAL(12,2) UNSIGNED NULL,
  fecha_servicio      TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_reserva_servicio),
  KEY idx_rs_reserva (id_reserva),
  KEY idx_rs_servicio (id_servicio),
  KEY idx_rs_empleado (id_empleado),
  CONSTRAINT fk_rs_reserva
    FOREIGN KEY (id_reserva) REFERENCES reserva(id_reserva)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_rs_servicio
    FOREIGN KEY (id_servicio) REFERENCES servicio(id_servicio)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_rs_empleado
    FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (Relación opcional de mov_inventario hacia reserva_servicio)
ALTER TABLE mov_inventario
  ADD CONSTRAINT fk_mov_reserva_servicio
    FOREIGN KEY (id_reserva_servicio) REFERENCES reserva_servicio(id_reserva_servicio)
    ON UPDATE CASCADE ON DELETE SET NULL;

-- ================================================================
-- 8) Facturación
-- ================================================================
CREATE TABLE factura (
  id_factura          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_reserva          INT UNSIGNED NOT NULL,
  fecha_factura       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal_habitacion DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0,
  subtotal_servicios  DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0,
  impuestos           DECIMAL(12,2) UNSIGNED NULL,
  total_general       DECIMAL(12,2) UNSIGNED NOT NULL,
  moneda              CHAR(3) NULL,
  tasa_cambio         DECIMAL(12,6) UNSIGNED NULL,
  estado_pago         VARCHAR(16) NULL,
  PRIMARY KEY (id_factura),
  KEY idx_factura_reserva (id_reserva),
  CONSTRAINT fk_factura_reserva
    FOREIGN KEY (id_reserva) REFERENCES reserva(id_reserva)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE factura_detalle (
  id_factura_detalle  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_factura          INT UNSIGNED NOT NULL,
  concepto            VARCHAR(120) NOT NULL,
  cantidad            DECIMAL(12,2) UNSIGNED NOT NULL,
  precio_unitario     DECIMAL(12,2) UNSIGNED NOT NULL,
  total               DECIMAL(12,2) UNSIGNED NOT NULL,
  PRIMARY KEY (id_factura_detalle),
  KEY idx_fdet_factura (id_factura),
  CONSTRAINT fk_fdet_factura
    FOREIGN KEY (id_factura) REFERENCES factura(id_factura)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pago (
  id_pago       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_factura    INT UNSIGNED NOT NULL,
  fecha         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metodo        VARCHAR(20) NOT NULL,
  valor         DECIMAL(12,2) UNSIGNED NOT NULL,
  referencia    VARCHAR(30) NULL,
  PRIMARY KEY (id_pago),
  KEY idx_pago_factura (id_factura),
  CONSTRAINT fk_pago_factura
    FOREIGN KEY (id_factura) REFERENCES factura(id_factura)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
--  Fin del script
-- ================================================================
