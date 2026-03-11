CREATE TABLE "roles" (
  "id" integer PRIMARY KEY,
  "nombre" varchar UNIQUE NOT NULL,
  "descripcion" text,
  "nivel_acceso" integer,
  "activo" boolean DEFAULT true,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "permisos" (
  "id" integer PRIMARY KEY,
  "nombre" varchar UNIQUE NOT NULL,
  "descripcion" text,
  "modulo" varchar,
  "id_rol" integer,
  "created_at" timestamp
);

CREATE TABLE "usuarios" (
  "id" integer PRIMARY KEY,
  "email" varchar UNIQUE NOT NULL,
  "password_hash" varchar NOT NULL,
  "id_rol" integer NOT NULL,
  "activo" boolean DEFAULT true,
  "ultimo_login" timestamp,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "logs_auditoria" (
  "id" integer PRIMARY KEY,
  "id_usuario" integer,
  "tabla" varchar NOT NULL,
  "id_registro" integer NOT NULL,
  "accion" varchar,
  "fecha" timestamp NOT NULL,
  "valores_anteriores" jsonb,
  "valores_nuevos" jsonb,
  "ip_origen" varchar,
  "created_at" timestamp
);

CREATE TABLE "hoteles" (
  "id" integer PRIMARY KEY,
  "nombre" varchar NOT NULL,
  "nit" varchar UNIQUE,
  "id_usuario_admin" integer NOT NULL,
  "direccion" varchar,
  "telefono" varchar,
  "email" varchar,
  "estrellas" smallint,
  "activo" boolean DEFAULT true,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "empleados" (
  "id" integer PRIMARY KEY,
  "id_usuario" integer NOT NULL,
  "id_hotel" integer NOT NULL,
  "cedula" varchar UNIQUE NOT NULL,
  "nombre" varchar NOT NULL,
  "apellido" varchar NOT NULL,
  "cargo" varchar,
  "telefono" varchar,
  "email" varchar,
  "salario" numeric(12,2),
  "activo" boolean DEFAULT true,
  "fecha_ingreso" date,
  "fecha_salida" date,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "clientes" (
  "id" integer PRIMARY KEY,
  "id_usuario" integer NOT NULL,
  "tipo_documento" varchar,
  "cedula" varchar UNIQUE NOT NULL,
  "nombre" varchar NOT NULL,
  "apellido" varchar NOT NULL,
  "telefono" varchar,
  "email" varchar,
  "direccion" varchar,
  "pais_nacionalidad" char(2),
  "pais_residencia" char(2),
  "idioma_preferido" varchar,
  "fecha_nacimiento" date,
  "tipo_visa" varchar,
  "numero_visa" varchar,
  "visa_expira" date,
  "fecha_registro" timestamp NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "preferencias_cliente" (
  "id" integer PRIMARY KEY,
  "id_cliente" integer NOT NULL,
  "piso_preferido" varchar,
  "vista_preferida" varchar,
  "notas_alergias" text,
  "numero_acompanantes" smallint,
  "fecha_actualizacion" timestamp,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "tipos_habitacion" (
  "id" integer PRIMARY KEY,
  "id_hotel" integer NOT NULL,
  "nombre_tipo" varchar UNIQUE NOT NULL,
  "descripcion" text,
  "capacidad_personas" smallint NOT NULL,
  "precio_base" numeric(12,2),
  "activo" boolean DEFAULT true,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "amenidades" (
  "id" integer PRIMARY KEY,
  "nombre" varchar UNIQUE NOT NULL,
  "icono" varchar,
  "categoria" varchar,
  "descripcion" text,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "tipo_habitacion_amenidades" (
  "id_tipo_habitacion" integer NOT NULL,
  "id_amenidad" integer NOT NULL,
  "created_at" timestamp,
  PRIMARY KEY ("id_tipo_habitacion", "id_amenidad")
);

CREATE TABLE "habitaciones" (
  "id" integer PRIMARY KEY,
  "id_hotel" integer NOT NULL,
  "numero_habitacion" varchar NOT NULL,
  "piso" varchar,
  "estado" varchar,
  "id_tipo_habitacion" integer NOT NULL,
  "fecha_actualizacion" timestamp,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "tarifas" (
  "id" integer PRIMARY KEY,
  "id_hotel" integer NOT NULL,
  "id_tipo_habitacion" integer NOT NULL,
  "fecha_inicio" date NOT NULL,
  "fecha_fin" date NOT NULL,
  "dias_semana" varchar,
  "precio_noche" numeric(12,2) NOT NULL,
  "temporada" varchar,
  "activo" boolean DEFAULT true,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "reservas" (
  "id" integer PRIMARY KEY,
  "id_cliente" integer NOT NULL,
  "id_tipo_habitacion" integer,
  "id_habitacion" integer,
  "id_empleado_recepcion" integer,
  "id_tarifa_aplicada" integer,
  "checkin_previsto" date NOT NULL,
  "checkout_previsto" date NOT NULL,
  "checkin_real" timestamp,
  "checkout_real" timestamp,
  "numero_huespedes" smallint,
  "estado_reserva" varchar,
  "origen_reserva" varchar,
  "codigo_confirmacion" varchar UNIQUE NOT NULL,
  "precio_noche_snapshot" numeric(12,2),
  "observaciones" text,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "huespedes_reserva" (
  "id" integer PRIMARY KEY,
  "id_reserva" integer NOT NULL,
  "id_cliente" integer NOT NULL,
  "es_titular" boolean DEFAULT false,
  "orden_huesped" smallint,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "servicios" (
  "id" integer PRIMARY KEY,
  "id_hotel" integer NOT NULL,
  "nombre_servicio" varchar NOT NULL,
  "descripcion" text,
  "precio" numeric(12,2),
  "categoria" varchar,
  "requiere_reserva" boolean DEFAULT false,
  "tiempo_servicio_min" integer,
  "activo" boolean DEFAULT true,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "reserva_servicios" (
  "id" integer PRIMARY KEY,
  "id_reserva" integer NOT NULL,
  "id_servicio" integer NOT NULL,
  "id_empleado" integer NOT NULL,
  "cantidad" numeric(10,2) NOT NULL,
  "precio_unitario" numeric(12,2) NOT NULL,
  "subtotal" numeric(12,2) NOT NULL,
  "fecha_servicio" timestamp,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "productos" (
  "id" integer PRIMARY KEY,
  "id_hotel" integer NOT NULL,
  "nombre" varchar NOT NULL,
  "categoria" varchar,
  "unidad" varchar,
  "costo" numeric(12,2),
  "activo" boolean DEFAULT true,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "servicio_productos" (
  "id_servicio" integer NOT NULL,
  "id_producto" integer NOT NULL,
  "cantidad_por_servicio" numeric(10,2),
  "created_at" timestamp,
  PRIMARY KEY ("id_servicio", "id_producto")
);

CREATE TABLE "stock" (
  "id_hotel" integer NOT NULL,
  "id_producto" integer NOT NULL,
  "cantidad_actual" numeric(12,2) NOT NULL,
  "fecha_actualizacion" timestamp,
  PRIMARY KEY ("id_hotel", "id_producto")
);

CREATE TABLE "movimientos_inventario" (
  "id" integer PRIMARY KEY,
  "id_hotel" integer NOT NULL,
  "id_producto" integer NOT NULL,
  "tipo" varchar,
  "cantidad" numeric(12,2) NOT NULL,
  "costo_unitario" numeric(12,2),
  "fecha" timestamp NOT NULL,
  "motivo" varchar,
  "id_reserva_servicio" integer,
  "created_at" timestamp
);

CREATE TABLE "metodos_pago" (
  "id" integer PRIMARY KEY,
  "nombre" varchar UNIQUE NOT NULL,
  "requiere_referencia" boolean DEFAULT false,
  "activo" boolean DEFAULT true,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "facturas" (
  "id" integer PRIMARY KEY,
  "id_reserva" integer NOT NULL,
  "numero_factura" varchar UNIQUE,
  "fecha_factura" timestamp NOT NULL,
  "subtotal_habitacion" numeric(12,2) NOT NULL,
  "subtotal_servicios" numeric(12,2) NOT NULL,
  "impuestos" numeric(12,2),
  "total_general" numeric(12,2) NOT NULL,
  "moneda" char(3),
  "tasa_cambio" numeric(12,6),
  "estado_pago" varchar,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "factura_detalles" (
  "id" integer PRIMARY KEY,
  "id_factura" integer NOT NULL,
  "id_reserva_servicio" integer,
  "concepto" varchar NOT NULL,
  "cantidad" numeric(12,2) NOT NULL,
  "precio_unitario" numeric(12,2) NOT NULL,
  "total" numeric(12,2) NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "pagos" (
  "id" integer PRIMARY KEY,
  "id_factura" integer NOT NULL,
  "id_metodo_pago" integer NOT NULL,
  "fecha" timestamp NOT NULL,
  "valor" numeric(12,2) NOT NULL,
  "referencia" varchar,
  "estado" varchar,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE UNIQUE INDEX ON "habitaciones" ("id_hotel", "numero_habitacion");

COMMENT ON COLUMN "roles"."nivel_acceso" IS '1=SuperAdmin, 2=Admin, 3=Recepcionista, 4=Cliente';

COMMENT ON COLUMN "permisos"."modulo" IS 'Habitaciones, Facturas, Inventario, etc.';

COMMENT ON COLUMN "logs_auditoria"."accion" IS 'INSERT, UPDATE, DELETE';

COMMENT ON COLUMN "hoteles"."id_usuario_admin" IS 'FK a usuarios (rol Admin)';

COMMENT ON COLUMN "empleados"."cargo" IS 'Recepcionista, Housekeeping, etc.';

COMMENT ON COLUMN "clientes"."id_usuario" IS 'FK a usuarios (rol Cliente)';

COMMENT ON COLUMN "clientes"."tipo_documento" IS 'CC, TI, CE, PAS';

COMMENT ON COLUMN "clientes"."pais_nacionalidad" IS 'ISO-3166-1';

COMMENT ON COLUMN "clientes"."idioma_preferido" IS 'ISO 639-1';

COMMENT ON COLUMN "amenidades"."categoria" IS 'Comodidad, Entretenimiento, Seguridad';

COMMENT ON COLUMN "habitaciones"."estado" IS 'Disponible, Ocupada, Limpieza, Mantenimiento';

COMMENT ON COLUMN "tarifas"."dias_semana" IS 'L,Ma,Mi,Ju,Vi,S,D';

COMMENT ON COLUMN "tarifas"."temporada" IS 'Alta, Baja, Normal';

COMMENT ON COLUMN "reservas"."id_tipo_habitacion" IS 'Tipo reservado inicialmente (opcional)';

COMMENT ON COLUMN "reservas"."id_habitacion" IS 'Asignada en check-in';

COMMENT ON COLUMN "reservas"."id_empleado_recepcion" IS 'Recepcionista que atiende';

COMMENT ON COLUMN "reservas"."id_tarifa_aplicada" IS 'Snapshot de tarifa aplicada';

COMMENT ON COLUMN "reservas"."estado_reserva" IS 'Pendiente, Confirmada, CheckIn, CheckOut, Cancelada';

COMMENT ON COLUMN "reservas"."origen_reserva" IS 'Web, Teléfono, Presencial';

COMMENT ON COLUMN "servicios"."categoria" IS 'Alimentos, Wellness, Parqueo, Transporte';

COMMENT ON COLUMN "servicios"."tiempo_servicio_min" IS 'Duración estimada en minutos';

COMMENT ON COLUMN "productos"."categoria" IS 'Bebidas, Alimentos, Artículos de limpieza';

COMMENT ON COLUMN "productos"."unidad" IS 'UND, ML, GR, KG, LT';

COMMENT ON COLUMN "movimientos_inventario"."tipo" IS 'ENTRADA, SALIDA, AJUSTE';

COMMENT ON COLUMN "movimientos_inventario"."id_reserva_servicio" IS 'Trazabilidad hacia consumo';

COMMENT ON COLUMN "facturas"."moneda" IS 'ISO 4217 - COP, USD, EUR';

COMMENT ON COLUMN "facturas"."estado_pago" IS 'Pendiente, Pagada, Parcial, Anulada';

COMMENT ON COLUMN "factura_detalles"."id_reserva_servicio" IS 'Referencia al servicio (opcional)';

COMMENT ON COLUMN "pagos"."referencia" IS 'Comprobante, transacción, etc.';

COMMENT ON COLUMN "pagos"."estado" IS 'Pendiente, Confirmado, Rechazado';

ALTER TABLE "permisos" ADD FOREIGN KEY ("id_rol") REFERENCES "roles" ("id");

ALTER TABLE "usuarios" ADD FOREIGN KEY ("id_rol") REFERENCES "roles" ("id");

ALTER TABLE "logs_auditoria" ADD FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id");

ALTER TABLE "hoteles" ADD FOREIGN KEY ("id_usuario_admin") REFERENCES "usuarios" ("id");

ALTER TABLE "empleados" ADD FOREIGN KEY ("id_hotel") REFERENCES "hoteles" ("id");

ALTER TABLE "empleados" ADD FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id");

ALTER TABLE "clientes" ADD FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id");

ALTER TABLE "preferencias_cliente" ADD FOREIGN KEY ("id_cliente") REFERENCES "clientes" ("id");

ALTER TABLE "huespedes_reserva" ADD FOREIGN KEY ("id_cliente") REFERENCES "clientes" ("id");

ALTER TABLE "tipos_habitacion" ADD FOREIGN KEY ("id_hotel") REFERENCES "hoteles" ("id");

ALTER TABLE "tipo_habitacion_amenidades" ADD FOREIGN KEY ("id_tipo_habitacion") REFERENCES "tipos_habitacion" ("id");

ALTER TABLE "tipo_habitacion_amenidades" ADD FOREIGN KEY ("id_amenidad") REFERENCES "amenidades" ("id");

ALTER TABLE "habitaciones" ADD FOREIGN KEY ("id_hotel") REFERENCES "hoteles" ("id");

ALTER TABLE "habitaciones" ADD FOREIGN KEY ("id_tipo_habitacion") REFERENCES "tipos_habitacion" ("id");

ALTER TABLE "tarifas" ADD FOREIGN KEY ("id_hotel") REFERENCES "hoteles" ("id");

ALTER TABLE "tarifas" ADD FOREIGN KEY ("id_tipo_habitacion") REFERENCES "tipos_habitacion" ("id");

ALTER TABLE "reservas" ADD FOREIGN KEY ("id_cliente") REFERENCES "clientes" ("id");

ALTER TABLE "reservas" ADD FOREIGN KEY ("id_tipo_habitacion") REFERENCES "tipos_habitacion" ("id") ON DELETE SET NULL;

ALTER TABLE "reservas" ADD FOREIGN KEY ("id_habitacion") REFERENCES "habitaciones" ("id") ON DELETE SET NULL;

ALTER TABLE "reservas" ADD FOREIGN KEY ("id_empleado_recepcion") REFERENCES "empleados" ("id");

ALTER TABLE "reservas" ADD FOREIGN KEY ("id_tarifa_aplicada") REFERENCES "tarifas" ("id");

ALTER TABLE "huespedes_reserva" ADD FOREIGN KEY ("id_reserva") REFERENCES "reservas" ("id");

ALTER TABLE "servicios" ADD FOREIGN KEY ("id_hotel") REFERENCES "hoteles" ("id");

ALTER TABLE "reserva_servicios" ADD FOREIGN KEY ("id_reserva") REFERENCES "reservas" ("id");

ALTER TABLE "reserva_servicios" ADD FOREIGN KEY ("id_servicio") REFERENCES "servicios" ("id");

ALTER TABLE "reserva_servicios" ADD FOREIGN KEY ("id_empleado") REFERENCES "empleados" ("id");

ALTER TABLE "productos" ADD FOREIGN KEY ("id_hotel") REFERENCES "hoteles" ("id");

ALTER TABLE "servicio_productos" ADD FOREIGN KEY ("id_servicio") REFERENCES "servicios" ("id");

ALTER TABLE "servicio_productos" ADD FOREIGN KEY ("id_producto") REFERENCES "productos" ("id");

ALTER TABLE "stock" ADD FOREIGN KEY ("id_hotel") REFERENCES "hoteles" ("id");

ALTER TABLE "stock" ADD FOREIGN KEY ("id_producto") REFERENCES "productos" ("id");

ALTER TABLE "movimientos_inventario" ADD FOREIGN KEY ("id_hotel") REFERENCES "hoteles" ("id");

ALTER TABLE "movimientos_inventario" ADD FOREIGN KEY ("id_producto") REFERENCES "productos" ("id");

ALTER TABLE "movimientos_inventario" ADD FOREIGN KEY ("id_reserva_servicio") REFERENCES "reserva_servicios" ("id") ON DELETE SET NULL;

ALTER TABLE "facturas" ADD FOREIGN KEY ("id_reserva") REFERENCES "reservas" ("id");

ALTER TABLE "factura_detalles" ADD FOREIGN KEY ("id_factura") REFERENCES "facturas" ("id");

ALTER TABLE "factura_detalles" ADD FOREIGN KEY ("id_reserva_servicio") REFERENCES "reserva_servicios" ("id") ON DELETE SET NULL;

ALTER TABLE "pagos" ADD FOREIGN KEY ("id_factura") REFERENCES "facturas" ("id");

ALTER TABLE "pagos" ADD FOREIGN KEY ("id_metodo_pago") REFERENCES "metodos_pago" ("id");
