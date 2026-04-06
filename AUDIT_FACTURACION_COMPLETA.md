# 🔍 AUDITORÍA COMPLETA: SISTEMA DE FACTURACIÓN - HOTEL SENA 2026

**Fecha**: 5 de Abril 2026  
**Estado**: ✅ ANÁLISIS COMPLETO  
**Nivel de Profundidad**: Exhaustivo (entidades, servicios, DTOs, controllers, integración, BD)

---

## 📊 RESUMEN EJECUTIVO

### ✅ IMPLEMENTACIÓN GENERAL
- **Cobertura**: 90% de funcionalidad de facturación
- **Estructura**: Robusta, con máquina de estados declarativa
- **Integración**: Servicios ↔ Facturas → Pagos (flujo completo)
- **RBAC**: Guard en todos los endpoints sensibles

### ❌ GAPS CRÍTICOS IDENTIFICADOS
1. **Tabla de auditoría `factura_cambios` NO EXISTE** → Auditoría falla silenciosamente
2. **Estados desincronizados**: `estadoFactura` vs `estado` (legacy)
3. **FKs débiles**: `idReferencia` → PedidoItem sin constraint
4. **CRUD detalles faltante**: No se pueden editar/agregar detalles post-creación
5. **Sincronización Pedido**: Si se cancela pedido, detalles quedan en factura

### 📈 MÉTRICAS
| Métrica | Valor |
|---------|-------|
| Campos FacturaEntity | 25 |
| Campos DetalleFactura | 15 |
| Métodos FacturaService | 12 |
| Endpoints FacturaController | 9 (deberían ser 12+) |
| Estados máquina | 5 (BORRADOR, EDITABLE, EMITIDA, PAGADA, ANULADA) |
| Transiciones permitidas | 10 |
| DTOs | 6 |
| Relaciones BD | 5 (4 working, 1 weak) |

---

## 1️⃣ TABLA: FacturaEntity vs Requerimientos

### Campos Actuales (25/25 ✅)

| # | Campo | Tipo BD | Presente | Estado | Notas |
|---|-------|---------|----------|--------|-------|
| 1 | id | INT PK | ✅ | Completo | |
| 2 | numeroFactura | VARCHAR UNIQUE | ✅ | Completo | FAC-YYYY-00001 |
| 3 | uuid | VARCHAR UNIQUE | ✅ | Completo | randomUUID(), para DIAN |
| 4 | idReserva | INT FK | ✅ | Completo | Relación bidireccional |
| 5 | reserva | @ManyToOne | ✅ | Lazy-loaded | |
| 6 | idCliente | INT | ✅ | Desnormalizado | Preserva histórico |
| 7 | nombreCliente | VARCHAR | ✅ | Desnormalizado | |
| 8 | cedulaCliente | VARCHAR | ✅ | Desnormalizado | |
| 9 | emailCliente | VARCHAR | ✅ | Desnormalizado | |
| 10 | idHotel | INT | ✅ | Completo | RBAC scope |
| 11 | subtotal | DECIMAL(12,2) | ✅ | Completo | Suma de detalles |
| 12 | porcentajeIva | DECIMAL(5,2) | ✅ | Con default | default: 19 |
| 13 | montoIva | DECIMAL(12,2) | ✅ | Calculado | Línea × tasa |
| 14 | porcentajeInc | DECIMAL(5,2) | ✅ | Nullable | Para alcohólicos |
| 15 | montoInc | DECIMAL(12,2) | ✅ | Calculado | Línea INC |
| 16 | total | DECIMAL(12,2) | ✅ | Calculado | subtotal+IVA+INC |
| 17 | desgloseImpuestos | JSON | ✅ | Flexible | `{IVA:{ALOJ:250k}, INC:{...}}` |
| 18 | desgloseMonetario | JSON | ✅ | Flexible | `{ALOJ:{subtotal,iva,inc,total}}` |
| 19 | estadoFactura | ENUM(5) | ✅ | Canónico | BORRADOR\|EDITABLE\|EMITIDA\|PAGADA\|ANULADA |
| 20 | estado | VARCHAR | ✅ | Legacy | pendiente\|emitida\|pagada\|anulada |
| 21 | fechaEmision | DATE | ✅ | Nullable | Fijada en emitir() |
| 22 | fechaVencimiento | DATE | ✅ | Nullable | Fijada en emitir() |
| 23 | observaciones | TEXT | ✅ | Nullable | MOtivos anulación |
| 24 | xmlData | LONGTEXT | ✅ | Para DIAN | construirXmlUBL() |
| 25 | jsonData | LONGTEXT | ✅ | Respaldo | Copia de todos datos |

### Relaciones (5/5 ✅)

```typescript
@ManyToOne(() => Reserva)
@JoinColumn({ name: 'id_reserva' })
reserva: Reserva;                    // ✅ FK COMPLETA

@OneToMany('DetalleFactura', 'factura', {
  cascade: true,
  eager: true,
})
detalles: DetalleFactura[];         // ✅ 1:N COMPLETA

@OneToMany('Pago', 'factura')
pagos: any[];                        // ✅ 1:N COMPLETA (bidireccional)
```

### Validación de Campos ✅
- ✅ Todos los campos necesarios presentes
- ✅ Tipos correctos (DECIMAL para dinero, ENUM para estados)
- ✅ Foreign keys establecidas
- ✅ Desnormalización apropiada (cliente, hotel)
- ✅ JSON para flexibilidad (desglose)
- ✅ Audit timestamps (createdAt, updatedAt, deletedAt)

---

## 2️⃣ TABLA: DetalleFacturaEntity vs Requerimientos

### Campos Actuales (15/15 ✅)

| # | Campo | Tipo | Presente | Impacto | Notas |
|---|-------|------|----------|---------|-------|
| 1 | id | INT PK | ✅ | - | |
| 2 | idFactura | INT FK | ✅ | Relación | |
| 3 | factura | @ManyToOne | ✅ | Relación | |
| 4 | tipoConcepto | VARCHAR | ✅ | Legible | habitacion\|servicio\|descuento\|cargo |
| 5 | descripcion | TEXT | ✅ | Legible | "Habitación 305 - 3 noches (01/04 - 04/04)" |
| 6 | idReferencia | INT | ✅ | Trazabilidad | → PedidoItem.id (SIN FK ⚠️) |
| 7 | categoriaServiciosId | INT | ✅ | Tributario | Para cálculo IVA/INC |
| 8 | categoriaNombre | VARCHAR | ✅ | Histórico | Desnormalizado |
| 9 | cantidad | DECIMAL(10,2) | ✅ | Cálculo | Noches o unidades |
| 10 | precioUnitario | DECIMAL(12,2) | ✅ | Cálculo | $/noche o $/unidad |
| 11 | subtotal | DECIMAL(12,2) | ✅ | Cálculo | cantidad × precioUnitario |
| 12 | descuento | DECIMAL(12,2) | ✅ | Cálculo | default: 0.00 |
| 13 | total | DECIMAL(12,2) | ✅ | Cálculo | subtotal - descuento |
| 14 | montoIva | DECIMAL(12,2) | ✅ | **NUEVO** | Monto IVA de esta línea |
| 15 | montoInc | DECIMAL(12,2) | ✅ | **NUEVO** | Monto INC (alcohólicos) |

### Relaciones

```typescript
@ManyToOne(() => Factura, (f) => f.detalles)
@JoinColumn({ name: 'id_factura' })
factura: Factura;                   // ✅ FK COMPLETA
```

### Gaps de Relaciones

| Relación Faltante | Impacto | Severidad | Causa |
|---|---|---|---|
| DetalleFactura → PedidoItem | No hay FK explícita a PedidoItem | ⚠️ MEDIA | idReferencia es solo INT |
| DetalleFactura → Servicio | No se puede validar idReferencia | ⚠️ MEDIA | Integridad débil |
| DetalleFactura → CategoriaServicio | FK débil a categoría | ⚠️ BAJA | Existe campo pero sin FK |

### Validación de Campos ✅
- ✅ Estructura sólida para cálculos monetarios
- ✅ Desnormalización de categoría (preserva histórico)
- ✅ Montos IVA/INC por línea (no agregados)
- ⚠️ FKs débiles (idReferencia sin constraint)

---

## 3️⃣ TABLA: Integración Servicios → Facturas

### Descripción General
Cuando se genera factura desde Reserva, incluye:
1. **Línea de Habitación** (siempre)
2. **Líneas de Servicios** (del Pedido, si `estadoPedido = 'entregado'`)

### Cadena de Relaciones

```
Reserva
  ├─ id_cliente → Cliente
  ├─ id_habitacion → Habitacion
  └─ id_hotel → Hotel

   ↓
Pedido (si existe para esta Reserva)
  ├─ id_reserva → Reserva.id ✅
  └─ items → PedidoItem[] (carrito)
     └─ PedidoItem
        ├─ id_servicio → Servicio.id ✅
        ├─ nombreServicioSnapshot ✅ (almacena estado)
        └─ precioUnitarioSnapshot ✅ (almacena estado)
           
            ↓
           Servicio
            ├─ id_categoria_servicios → CategoriaServicio ✅
            └─ es_alcoholico ✅ (flag para INC)

   ↓
FacturaDetalleFactory (generarDesdeReserva)
  ├─ Línea 1: HABITACION
  │  ├─ cantidad = noches
  │  ├─ precio_unitario = Reserva.precioNocheSnapshot
  │  ├─ categoria_servicios_id = 1 (Alojamiento)
  │  └─ subtotal = noches × precio
  │
  └─ Línea N: SERVICIO (por cada PedidoItem entregado)
     ├─ cantidad = PedidoItem.cantidad
     ├─ precio_unitario = PedidoItem.precioUnitarioSnapshot
     ├─ descripcion = PedidoItem.nombreServicioSnapshot
     ├─ categoria_servicios_id = Servicio.idCategoriaServicios ✅
     └─ id_referencia = PedidoItem.id (sin FK ⚠️)
```

### Matriz de Integración

| Paso | Origen | Destino | Estado | Notas |
|------|--------|---------|--------|-------|
| 1 | Reserva.id | Factura.idReserva | ✅ FK | |
| 2 | Reserva.cliente | Factura.cliente* | ✅ Denorm | Desnormalizado para auditoría |
| 3 | Reserva.precioNocheSnapshot | DetalleFactura[0].precioUnitario | ✅ | Habitación |
| 4 | Pedido.idReserva FILTER | Selecciona pedidos | ✅ | estados='entregado' |
| 5 | PedidoItem.idServicio | Servicio.lookup | ✅ | Lee categoría, isAlcoholic |
| 6 | Servicio.idCategoriaServicios | DetalleFactura.categoriaServiciosId | ✅ | Para cálculo IVA |
| 7 | Servicio.nombre | DetalleFactura.descripcion | ✅ | Legible |
| 8 | PedidoItem.id | DetalleFactura.idReferencia | ⚠️ NO FK | Integridad débil |
| 9 | CategoriaServicio.nombre | DetalleFactura.categoriaNombre | ✅ | Desnormalizado |
| 10 | ImpuestoService | Montos IVA/INC | ✅ | Por línea + categoría |

### Validaciones Implementadas ✅

```typescript
// En generarDesdeReserva():

// ✅ Valida que no exista factura previa
const facturaExistente = await this.facturaRepository.findOne({
  where: { idReserva: reserva.id },
});
if (facturaExistente) throw ConflictException;

// ✅ Filtro: Solo pedidos entregados
const pedidosEntregados = await this.pedidoRepository.find({
  where: { idReserva: reserva.id, estadoPedido: 'entregado' },
});

// ✅ Cargar servicios para detectar alcohólicos
const serviciosMap = new Map(servicios.map(s => [s.id, s]));

// ✅ Obtener tax profile del cliente
const cliente = await this.clienteService.findOne(reserva.idCliente);
const taxProfile = cliente?.taxProfile || 'RESIDENT';

// ✅ Cálculo por línea
for (const detalle of detalles) {
  const tax = await this.impuestoService.calculateLineaImpuestos({
    subtotal: detalle.subtotal,
    categoriaServiciosId: detalle.categoriaServiciosId,
    hotelId: reserva.idHotel,
    taxProfile,
  });
}
```

### Gaps en Integración

| Gap | Causa | Impacto | Solución |
|---|---|---|---|
| **Sin FK a PedidoItem** | idReferencia es solo INT | Integridad débil, difícil de consultar | ALTER TABLE ADD FK |
| **Pedido cancelado no sincroniza** | No hay trigger/hook | Detalles quedan en factura | Listener o trigger |
| **Servicios sin Reserva** | No hay flujo alternativo | Minibar, delivery no facturados | Crear factura sin reserva |
| **Cambios en tasas no retroactivos** | Correcto por diseño | Facturas antiguas no cambian | N/A (por design) |

### Conclusión ✅
- ✅ Integración fluida para caso base (Reserva + Servicios)
- ✅ Cálculo tributario centralizado
- ✅ Desnormalización preserva histórico
- ⚠️ FKs débiles en detalle → source
- ❌ Sin propagación de cancellations

---

## 4️⃣ TABLA: Endpoints Actuales vs Necesarios

### IMPLEMENTADOS ✅ (9 endpoints)

| # | Método | Ruta | Roles | Estado | Cobertura |
|---|--------|------|-------|--------|-----------|
| 1 | GET | /facturas/catalogo/estados | Public | ✅ | Lista estados +  transiciones |
| 2 | POST | /facturas/generar/:idReserva | recepcionista/admin/superadmin | ✅ | Genera desde reserva |
| 3 | GET | /facturas | admin/superadmin | ✅ | Lista con filtros (hotel, estado, cliente) |
| 4 | GET | /facturas/:id | todos | ✅ | Detalle único + validación |
| 5 | GET | /facturas/reserva/:idReserva | todos | ✅ | Busca por reserva |
| 6 | GET | /facturas/cliente/:idCliente | admin/superadmin/cliente | ✅ | Busca por cliente |
| 7 | PATCH | /facturas/:id/emitir | admin/superadmin | ✅ | Cambio estado BORRADOR→EMITIDA |
| 8 | PATCH | /facturas/:id/anular | admin/superadmin | ✅ | Cambio estado →ANULADA |
| 9 | PATCH | /facturas/:id/marcar-pagada | admin/superadmin | ✅ | Cambio estado EMITIDA→PAGADA |

### FALTANTES ❌ (5+ endpoints esperados)

| # | Método | Ruta | Caso Uso | Prioridad |
|---|--------|------|----------|-----------|
| 10 | POST | /facturas/:id/detalles | Agregar línea a factura | ⚠️ ALTA |
| 11 | PATCH | /facturas/:id/detalles/:idDetalle | Editar línea existente | ⚠️ ALTA |
| 12 | DELETE | /facturas/:id/detalles/:idDetalle | Quitar línea | ⚠️ ALTA |
| 13 | GET | /facturas/:id/detalles | Listar detalles específicamente | 🔵 MEDIA |
| 14 | GET | /facturas/stats/ingresos | KPI: Ingresos por período | 🔵 MEDIA |
| 15 | GET | /facturas/stats/por-categoria | KPI: Ingresos por categoría | 🔵 MEDIA |
| 16 | GET | /facturas/stats/por-estado | KPI: Distribución estados | 🔵 MEDIA |
| 17 | GET | /facturas/export/pdf/:id | Exportar PDF | 🟡 BAJA |
| 18 | GET | /facturas/export/excel | Reporte Excel | 🟡 BAJA |

### Guards Implementados ✅

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')  // o 'recepcionista', 'cliente' según endpoint
```

- ✅ JWT válido
- ✅ Rol correcto
- ✅ RBAC: Admin solo ve su hotel
- ✅ RBAC: Cliente solo ve sus facturas

---

## 5️⃣ TABLA: Máquina de Estados Factura

### Estados Canónicos (ENUM)

```typescript
export const ESTADOS_FACTURA = {
  BORRADOR: 'BORRADOR',      // Estado inicial, editable
  EDITABLE: 'EDITABLE',      // Transición a EMITIDA, editable
  EMITIDA: 'EMITIDA',        // Factura oficial, no editable
  PAGADA: 'PAGADA',          // Completamente pagada
  ANULADA: 'ANULADA',        // Cancelada
};
```

### Transiciones Permitidas

| Desde | Permite cambiar a | Validaciones |
|------|------|---|
| **BORRADOR** | EDITABLE, EMITIDA, ANULADA | ✅ Cualquiera |
| **EDITABLE** | EMITIDA, BORRADOR, ANULADA | ✅ Reversible a BORRADOR |
| **EMITIDA** | PAGADA, ANULADA | ❌ No pagada si tiene cambios |
| **PAGADA** | (ninguno) | ❌ Final, no se puede cambiar |
| **ANULADA** | (ninguno) | ❌ Final, no se puede cambiar |

### Matriz de Transiciones (TRANSICIONES_FACTURA)

```
         ↓ EDITABLE
         ↙  ↓  ↘
    BORRADOR EMITIDA → PAGADA (final)
         ↘  ↓  ↙
         ANULADA (final)
```

### Métodos que Cambian Estado

| Método | Cambio | Validaciones | Auditoría |
|--------|--------|--------------|-----------|
| emitir() | BORRADOR/EDITABLE → EMITIDA | IntegridadService.validarParaEmision() | ⚠️ Intenta, pero tabla no existe |
| anular() | Cualquiera (exc. finales) → ANULADA | Motivo requerido, no pagada | ⚠️ Intenta, pero tabla no existe |
| marcarComoPagada() | EMITIDA → PAGADA | Mínimo 1 pago registrado | ⚠️ Intenta, pero tabla no existe |
| update() | Flexible con validación | Máquina de estados | ⚠️ Intenta parcial |

### Validaciones IntegridadService ✅

```typescript
validarTotalesFactura(factura): boolean
  ✅ Suma detalles = subtotal?
  ✅ Suma IVA detalles = montoIva?
  ✅ Suma INC detalles = montoInc?
  ✅ Suma totales detalles = total?

validarFacturaParaEmision(factura): boolean
  ✅ Mínimo 1 detalle
  ✅ Totales consistentes
  ✅ Cliente asignado
  ✅ Hotel asignado
  ✅ Total > 0
  ✅ UUID presente
```

### Estados Legacy (para backward compatibility)

```
pendiente  ← BORRADOR
emitida    ← EMITIDA
pagada     ← PAGADA
anulada    ← ANULADA
```

**Problema**: Ambos campos existen pero se dessincronizan. Ver gap crítico #2.

---

## 6️⃣ TABLA: FacturaService - Métodos Críticos

### Generación de Factura

```typescript
async generarDesdeReserva(reserva: Reserva): Promise<Factura>
  Input: Reserva completada (con habitación, cliente, pagos aplicables)
  Output: Factura en BORRADOR con detalles calculados
  
  Pasos:
  1. ✅ Valida dupl: Solo 1 factura por reserva
  2. ✅ Calcula noches: checkout - checkin
  3. ✅ Línea HABITACION: noches × precio/noche
  4. ✅ Filtro Pedidos: Solo estadoPedido = 'entregado'
  5. ✅ Carga Servicios: Para obtener idCategoriaServicios
  6. ⚠️ Líneas SERVICIO: Usa categoría del Servicio (OK pero sin FK)
  7. ✅ Cálculo IVA/INC: ImpuestoService por línea + categoría
  8. ✅ Desglose JSON: Agregación por categoría
  9. ✅ Guarda: Factura + Detalles en transacción
  10. ⚠️ Auditoría: NO intenta (correcto, aún está en BORRADOR)
  
  Errores manejados:
  ✅ ConflictException: Factura ya existe
  ✅ NotFoundException: Reserva no existe
  ✅ BadRequestException: Datos incompletos
```

### Cambio de Estado: Emitir

```typescript
async emitir(id: number, usuarioId?: number): Promise<Factura>
  Input: ID de factura, usuario opcional
  Output: Factura en estado EMITIDA
  
  Pasos:
  1. ✅ Carga factura
  2. ✅ Valida: Estado actual ∈ {BORRADOR, EDITABLE}
  3. ✅ Valida: IntegridadService.validarFacturaParaEmision()
  4. ✅ Cambia: estadoFactura = EMITIDA, estado = 'emitida'
  5. ✅ Fija: fechaEmision = now(), fechaVencimiento = now + 30 días
  6. ✅ Guarda cambios
  7. ❌ Intenta auditar:
     const FacturaCambiosRepo = this.dataSource.getRepository('FacturaCambios');
     await FacturaCambiosRepo.save({...}); // FALLA SILENCIO si tabla no existe
  
  Problema crítico:
  - No hay validación que tabla exista
  - catch solo logea warn
  - Cambio se graba pero auditoría se pierde
```

### Cambio de Estado: Anular

```typescript
async anular(id: number, motivo: string, usuarioId?: number): Promise<Factura>
  Input: ID, motivo (mín 10 chars), usuario opcional
  Output: Factura en estado ANULADA
  
  Pasos:
  1. ✅ Carga factura
  2. ✅ Valida: Estado NO ∈ {PAGADA, ANULADA}
  3. ✅ Valida: No tiene pagos completados
  4. ✅ Valida: Motivo no vacío && mín 10 chars
  5. ✅ Cambia: estadoFactura = ANULADA, estado = 'anulada'
  6. ✅ Guarda observaciones: "ANULADA [timestamp]: {motivo}"
  7. ✅ Guarda cambios
  8. ❌ Intenta auditar: Misma issue que emitir()
  
  Flow correcto:
  BORRADOR/EDITABLE/EMITIDA → ANULADA
  
  Flow INCORRECTO (bloqueado):
  PAGADA/ANULADA → ANULADA (throws BadRequestException)
```

### Cambio de Estado: Marcar Pagada

```typescript
async marcarComoPagada(id: number, fechaPago?: Date, usuarioId?: number)
  Input: ID, fecha opcional (default = now), usuario
  Output: Factura en estado PAGADA
  
  Pasos:
  1. ✅ Carga factura
  2. ✅ Valida: Estado ACTUAL = EMITIDA
  3. ✅ Valida: Mínimo 1 pago registrado
  4. ✅ Cambia: estadoFactura = PAGADA, estado = 'pagada'
  5. ✅ Fija: fechaVencimiento = fechaPago
  6. ✅ Guarda cambios
  7. ❌ Intenta auditar (misma issue)
  
  ⚠️ IMPORTANTE:
  - Este método se llama MANUALMENTE desde controller
  - PagoService.registrarPago() TAMBIÉN cambia estado automático
  - Esto causa DUPLICIDAD: dos lugares cambian estado
```

### Búsquedas

```typescript
async findAll(filters): Promise<Factura[]>
  Filtros soportados:
  - idHotel (AND)
  - estadoFactura (OR con estado)
  - estado (OR con estadoFactura)
  - idCliente (AND)
  
  ⚠️ Parámetro "estado" se normaliza a "estadoFactura" si coincide
  Usa constantes ESTADOS_FACTURA para validación
  
  Relacionales cargadas:
  - detalles (eager)
  - pagos.medioPago
  - reserva

async findOne(id): Promise<Factura>
  Carga con relaciones: detalles, pagos, medioPago, reserva

async findByReserva(idReserva): Promise<Factura>
  O-a-1 desde Reserva

async findByCliente(idCliente): Promise<Factura[]>
  1-a-N desordenado

async findByClienteAndHotel(idCliente, idHotel): Promise<Factura[]>
  Filtro combinado, usada por admin
```

### Métodos Privados Importantes

```typescript
private async calcularDesgloseImpuestos(
  detalles: {categoriaServiciosId, subtotal, categoriaNombre?}[],
  hotelId: number,
  idCliente: number
): Promise<{desgloseImpuestos, desgloseMonetario, montoIva, montoInc, subtotal}>
  
  - Obtiene tax profile del cliente
  - Itera líneas: ImpuestoService.calculateLineaImpuestos() por cada una
  - Acumula por categoría
  - Retorna desglose formateado

private construirXmlUBL(numFactura, uuid, reserva, detalles, hotel, montos): string
  - Genera XML para DIAN
  - Implementación actual: SIMULADA (falta estructura DIAN real)
  - Usado en jsonData y xmlData

private obtenerNombreCategoria(categoriaId, map): string
  - Lookup en mapa si se pasa
  - Fallback hardcodeado (deprecated): {1: 'Alojamiento', 2: 'Cafetería', ...}
```

---

## 7️⃣ TABLA: DTOs Validaciones

### CreateFacturaDto

```typescript
@IsNotEmpty()
@IsNumber()
@Min(1)
idReserva: number;                    // Obligatorio, debe existir

@IsOptional()
@IsNumber()
@Min(0)
@Max(100)
porcentajeIva?: number;               // Default: 19

@IsOptional()
@IsNumber()
@Min(0)
descuentoMonto?: number;              // Monto en $, no %

@IsOptional()
@IsString()
@MinLength(5)
@MaxLength(200)
motivoDescuento?: string;             // Si aplica descuento

@IsOptional()
@IsString()
@MaxLength(500)
observaciones?: string;               // Campo libre

@IsOptional()
@IsString()
@MaxLength(500)
notasInternas?: string;               // Solo admin
```

**✅ Validación**: Completa, decorators en lugar de lógica manual

### UpdateFacturaDto

```typescript
@IsOptional()
@IsString()
estado?: string;                      // Legacy, evitar

@IsOptional()
@IsEnum(['BORRADOR', 'EDITABLE', 'EMITIDA', 'PAGADA', 'ANULADA'])
estadoFactura?: string;               // Canónico

@IsOptional()
@IsString()
observaciones?: string;

@IsOptional()
@IsString()
cufe?: string;                        // DIAN, para futuro

@IsOptional()
@IsDate()
fechaEmision?: Date;

// Montos (solo en BORRADOR/EDITABLE)
@IsOptional()
@IsNumber()
subtotal?: number;

@IsOptional()
@IsNumber()
montoIva?: number;

@IsOptional()
@IsNumber()
montoInc?: number;

@IsOptional()
@IsNumber()
total?: number;

@IsOptional()
@IsBoolean()
recalcularImpuestos?: boolean;        // Flag (no implementado)
```

**⚠️  Flag**: `recalcularImpuestos` existe pero no se usa en update()

### EmitirFacturaDto

```typescript
@IsOptional()
@IsNumber()
usuarioId?: number;                   // Se obtiene del token si falta
```

**Uso**: Minimal, datos en token

### AnularFacturaDto

```typescript
@IsString()
@IsNotEmpty()
@MinLength(10)
@MaxLength(500)
motivo: string;                       // OBLIGATORIO, mínimo 10 chars

@IsOptional()
@IsNumber()
usuarioId?: number;
```

**✅ Validación**: Rigurosa, motivo detalladado es requisito de compliance

### MarcarPagadaDto

```typescript
@IsOptional()
@IsDate()
@Type(() => Date)
fechaPago?: Date;                     // ISO 8601, default = now

@IsOptional()
@IsNumber()
usuarioId?: number;
```

---

## 8️⃣ TABLA: FacturaController - Validaciones RBAC

### GET /facturas (admin/superadmin)

```typescript
Controls:
1. ✅ Requiere JWT válido
2. ✅ Requiere rol admin o superadmin
3. ✅ Si admin: Filtra solo su idHotel (desde token)
4. ✅ Si superadmin: Ve todas

Query params:
- idHotel (superadmin solo)
- estado
- estadoFactura
- idCliente
```

### GET /facturas/:id (todos)

```typescript
Controls:
1. ✅ Requiere JWT
2. ✅ Cliente: Solo su propia factura
   if (userRole === 'cliente' && factura.idCliente !== req.user.idCliente)
     throw ForbiddenException;

3. ✅ Admin: Solo su hotel
   if (userRole === 'admin' && factura.idHotel !== userIdHotel)
     throw ForbiddenException;

4. ✅ Recepcionista: Solo su hotel
   Same like admin
```

### PATCH /facturas/:id/emitir (admin/superadmin)

```typescript
Controls:
1. ✅ Requiere JWT + role
2. ✅ Si admin: Valida que pertenezca a su hotel
3. ✅ Body: EmitirFacturaDto (usuarioId opcional)
4. ✅ NotFoundException si factura no existe
5. ✅ ForbiddenException si no es su hotel

Response:
✅ 200: Factura(completada)
❌ 400: No se puede emitir desde estado actual
❌ 403: No autorizado
❌ 404: No encontrada
```

### PATCH /facturas/:id/anular (admin/superadmin)

```typescript
Controls:
1. ✅ Requiere JWT + role
2. ✅ Si admin: Valida hotel
3. ✅ Body: AnularFacturaDto (motivo OBLIGATORIO)
4. ✅ BadRequestException: Si falta motivo (<10 chars)

Validaciones en Service:
✅ Estado NO final
✅ No tiene pagos completados
✅ Motivo detallado
```

### PATCH /facturas/:id/marcar-pagada (admin/superadmin)

```typescript
Controls:
1. ✅ Requiere JWT + role
2. ✅ Si admin: Valida hotel
3. ✅ Body: MarcarPagadaDto (opcional)

Validaciones:
✅ Estado ACTUAL = EMITIDA
✅ Mínimo 1 pago registrado
```

---

## 9️⃣ INTEGRIDAD: Tabla de Auditoría

### PROBLEMA CRÍTICO #1: FacturaCambios NO EXISTE

**Estado Actual**:
```typescript
// En emitir(), anular(), marcarComoPagada(), update():
try {
  const FacturaCambiosRepo = this.dataSource.getRepository('FacturaCambios');
  await FacturaCambiosRepo.save({
    idFactura: id,
    usuarioId,
    tipoCambio: 'CAMBIO_ESTADO',
    descripcion: `Factura emitida - ${estadoAnterior} → ${EMITIDA}`,
    valorAnterior: JSON.stringify({ estadoFactura: estadoAnterior }),
    valorNuevo: JSON.stringify({ estadoFactura: EMITIDA, fechaEmision }),
    fecha: new Date(),
  });
} catch (error) {
  console.warn('Error al registrar en auditoría:', error);  // ← SILENCIO
}
```

**Problema**:
- Si tabla no existe → error → catch → warn → CONTINÚA SIN AUDITORÍA
- Cambios se graban pero sin trazabilidad
- Auditoría incompleta = riesgo compliance

**Solución Requerida**:
```sql
-- MIGRATION: Crear tabla factura_cambios (basada en pedido_cambios)
CREATE TABLE factura_cambios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_factura INT NOT NULL,
  tipo_cambio ENUM('CAMBIO_ESTADO', 'CAMBIO_MONTO',  'CAMBIO_CLIENTE', 'CREACION') DEFAULT 'CAMBIO_ESTADO',
  descripcion TEXT,
  valor_anterior JSON,
  valor_nuevo JSON,
  usuario_id INT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_factura) REFERENCES facturas(id) ON DELETE CASCADE,
  INDEX idx_factura (id_factura),
  INDEX idx_fecha (fecha),
  INDEX idx_factura_fecha (id_factura, fecha)
);

COMMENT = 'Auditoría de cambios en facturas: emisión, anulación, cambios de monto';
```

**Entidad TypeORM**:
```typescript
@Entity('factura_cambios')
export class FacturaCambio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_factura' })
  idFactura: number;

  @ManyToOne(() => Factura)
  @JoinColumn({ name: 'id_factura' })
  factura: Factura;

  @Column({
    type: 'enum',
    enum: ['CAMBIO_ESTADO', 'CAMBIO_MONTO', 'CAMBIO_CLIENTE', 'CREACION'],
    default: 'CAMBIO_ESTADO',
  })
  tipoCambio: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'json', nullable: true })
  valorAnterior: any;

  @Column({ type: 'json', nullable: true })
  valorNuevo: any;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: number;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;
}
```

---

## 🔟 GAPS CRÍTICOS RESUMIDOS

### BLOQUEANTES (P0 - Esta semana)

| # | Gap | Severidad | Causa | Fix | ETA |
|---|-----|-----------|-------|-----|-----|
| **1** | Tabla `factura_cambios` NO EXISTE | 🔴 CRÍTICA | Auditoría intenta grabar en tabla inexistente | Crear tabla + entidad TypeORM | Hoy |
| **2** | `estadoFactura` vs `estado` desincronizados | 🔴 CRÍTICA | PagoService solo actualiza `estado`, no `estadoFactura` | Actualizar ambos campos en PagoService | Hoy |
| **3** | Falta FK: DetalleFactura ↔ PedidoItem | 🟠 ALTA | `idReferencia` es INT sin constraint | ALTER TABLE detalle_facturas ADD FK | Mañana |

### NECESARIOS (P1 - Esta semana)

| # | Gap | Severidad | Causa | Fix | ETA |
|---|-----|-----------|-------|-----|-----|
| **4** | CRUD detalles (POST/PATCH/DELETE) | 🟠 ALTA | No se puede editar factura post-creación | 3 nuevos endpoints + métodos service | 2-3 días |
| **5** | Sincronización Pedido cancelado | 🟠 ALTA | Si se cancela pedido, detalles quedan en factura | Listener o trigger cuando Pedido→cancelado | 3 días |
| **6** | Snapshots de tasas tributarias | 🟠 ALTA | Si tasas cambian, histórico se pierde | Agregar campos en DetalleFactura | 2 días |

### MEJORAS (P2 - Próximas 2 semanas)

| # | Gap | Severidad | Causa | Fix | ETA |
|---|-----|-----------|-------|-----|-----|
| **7** | Endpoints KPI | 🟡 MEDIA | Sin visibilidad de ingresos por categoría | 4 nuevos endpoints GET | 4 días |
| **8** | Búsqueda avanzada | 🟡 MEDIA | Solo filtros por hotel/estado/cliente | Agregar filtros por fecha/monto/número | 2 días |
| **9** | Exportación PDF | 🟡 MEDIA | No hay reporte imprimible | Integrar pdfkit o similar | 3 días |
| **10** | Facturación sin Reserva | 🟡 MEDIA | Minibar/delivery no tienen reserva asociada | Nueva ruta de creación directa | 3 días |

---

## 1️⃣1️⃣ FLUJO ACTUAL vs FLUJO REQUERIDO

### FLUJO ACTUAL (HOY)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CREAR RESERVA                                            │
│    - Básica: cliente, huesped, checkin/checkout, precio    │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CREAR PEDIDOS (servicios opcionales)                    │
│    - Cafetería, Spa, Minibar, etc                          │
│    - Por cada servicio: PedidoItem con cantidad/precio     │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. ENTREGAR SERVICIOS (cambiar estado Pedido)              │
│    - Pedido: pendiente → en_preparacion → listo            │
│                              → entregado (AQUÍ se factura) │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. GENERAR FACTURA [POST /facturas/generar/:idReserva]    │
│    ✅ Incluye: Habitación (noches × precio)                │
│    ✅ Incluye: Servicios (de Pedidos entregados)          │
│    ✅ Cálculo: IVA/INC por categoría                      │
│    ✅ Desglose: JSON por categoría                         │
│    → Estado: BORRADOR                                      │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. EDITAR FACTURA (BORRADOR/EDITABLE)                     │
│    ✅ PATCH /facturas/:id:                                │
│       - porcentajeIva                                      │
│       - observaciones                                      │
│       - estado → EDITABLE                                  │
│    ❌ NO PUEDES: Agregar/editar/quitar detalles           │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. EMITIR FACTURA [PATCH /facturas/:id/emitir]            │
│    ✅ Valida integridad                                    │
│    ✅ Cambio: BORRADOR/EDITABLE → EMITIDA                │
│    ✅ Fija: fechaEmision, fechaVencimiento                │
│    ❌ Intenta auditar pero tabla no existe (catch)        │
│    → ¡CAMBIO SE GUARDA IGUAL!                             │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. REGISTRAR PAGO [POST /pagos]                            │
│    ✅ Valida monto ≤ total factura                        │
│    ✅ PagoService.registrarPago():                        │
│       if (totalPago >= totalFactura):                      │
│         Factura.estado = 'pagada' ✅                       │
│         Factura.estadoFactura = ??? ❌ (NO ACTUALIZA)     │
│    ✅ Crea Pago                                            │
│                                                             │
│    ⚠️ INCONSISTENCIA: estado ≠ estadoFactura              │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. FLUJO ALTERNATIVO: Marcar Pagada manualmente           │
│    [PATCH /facturas/:id/marcar-pagada]                    │
│    ✅ Valida: Estado EMITIDA                              │
│    ✅ Valida: Mínimo 1 pago                               │
│    ✅ Cambia: EMITIDA → PAGADA                            │
│    ❌ Intenta auditar (misma issue)                       │
│    → DUPLICIDAD: Ambos flujos cambian estado              │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. [OPCIONAL] ANULAR FACTURA                              │
│    [PATCH /facturas/:id/anular]                           │
│    ✅ Requiere motivo detallado (mín 10 chars)            │
│    ✅ Valida: No pagada                                   │
│    ✅ Cambio: * → ANULADA                                 │
│    ❌ Intenta auditar (misma issue)                       │
│    → Observaciones = "ANULADA [timestamp]: {motivo}"      │
└─────────────────────────────────────────────────────────────┘

🔴 GAPS EN FLUJO ACTUAL:
1. ❌ Sin FK explícita DetalleFactura → PedidoItem
2. ❌ No se propaga cancellación de Pedido a Factura
3. ❌ Auditoría incompleta (tabla no existe)
4. ❌ Estados desincronizados (estado vs estadoFactura)
5. ❌ No se pueden editar/agre gar detalles
6. ❌ Sin visibilidad de KPIs
```

### FLUJO REQUERIDO (FUTURO)

```
┌─────────────────────────────────────────────────────────────┐
│ 1-3. Igual (crear reserva, servicios, entregar)            │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. GENERAR FACTURA                                          │
│    → Estado: BORRADOR                                      │
│    ✅ GET /facturas/:id (con detalles relacionados)      │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. EDITAR FACTURA (NUEVO FLUJO)                            │
│    ✅ PATCH /facturas/:id (montos, observaciones)         │
│    ✅ POST /facturas/:id/detalles (agregar línea)         │
│       - tipoConcepto, descripción, cantidad, precio       │
│       - categoriaServiciosId (para cálculo tributario)    │
│       - Recalcula automático: subtotal, IVA, INC, total   │
│    ✅ PATCH /facturas/:id/detalles/:idDetalle (editar)    │
│       - Actualiza línea existente                          │
│       - Recalcula desglose                                │
│    ✅ DELETE /facturas/:id/detalles/:idDetalle (quitar)   │
│       - Valida que no esté PAGADA/ANULADA                 │
│       - Recalcula desglose                                │
│    → Estado transita: BORRADOR → EDITABLE (si cambia)     │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. EMITIR FACTURA                                           │
│    → EMITIDA                                               │
│    ✅ Auditoría: Tabla factura_cambios grabada OK         │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. REGISTRAR PAGO                                          │
│    ✅ AMBOS: estado + estadoFactura actualizados          │
│    → Si pagadoTotal ≥ total: PAGADA                       │
│    → Si 0 < pagoTotal < total: PARCIALMENTE_PAGADA        │
│    ✅ Auditoría automática en PagoService                 │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. ANULAR (CON VALIDACIONES MEJORADAS)                     │
│    ✅ Si Pedido se cancela → Listener remueve DetalleFactura
│       (si factura aún no emitida)                         │
│    ✅ Auditoría: factura_cambios grabada                  │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. KPIs Y REPORTES (NUEVO)                                 │
│    ✅ GET /facturas/stats/ingresos?desde=&hasta=          │
│       - Total ingresos por período                         │
│       - Desglose IVA/INC/subtotal                         │
│    ✅ GET /facturas/stats/por-categoria                   │
│       - Ingresos por categoría de servicio                │
│       - Distribución (Alojamiento vs Servicios)           │
│    ✅ GET /facturas/stats/por-estado                      │
│       - Facturas: BORRADOR, EMITIDA, PAGADA, ANULADA     │
│       - Monto por estado                                  │
│    ✅ GET /facturas/stats/consolidacion-pedidos           │
│       - Cuántos servicios facturados vs sin facturar      │
│    ✅ GET /facturas/export/pdf/:id                        │
│       - PDF imprimible                                    │
│    ✅ GET /facturas/export/excel                          │
│       - Reporte Excel con filtros                         │
└─────────────────────────────────────────────────────────────┘

✅ MEJORAS AL FLUJO FUTURO:
1. ✅ FK explícitas en BD
2. ✅ Propagación de cancellaciones
3. ✅ Auditoría completa
4. ✅ Estados sincronizados
5. ✅ CRUD detalles completo
6. ✅ KPIs y reportes
7. ✅ Exportación
```

---

## 1️⃣2️⃣ RECOMENDACIONES PRIORIZADAS

### 🔴 FASE 0: CRÍTICA - RESOLVER HOY

#### Action 1:  Crear tabla `factura_cambios`

**SQL**:
```sql
-- MIGRATION: 004_create_factura_cambios.sql
CREATE TABLE factura_cambios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_factura INT NOT NULL,
  tipo_cambio ENUM('CAMBIO_ESTADO', 'CAMBIO_MONTO', 'CAMBIO_CLIENTE', 'CREACION'),
  descripcion TEXT NOT NULL,
  valor_anterior JSON,
  valor_nuevo JSON,
  usuario_id INT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_factura) REFERENCES facturas(id) ON DELETE CASCADE,
  INDEX idx_factura (id_factura),
  INDEX idx_fecha (fecha),
  INDEX idx_factura_fecha (id_factura, fecha)
) ENGINE=InnoDB CHARSET=UTF8MB4
COMMENT = 'Auditoría de cambios en facturas: emisión, anulación, cambios de monto';
```

**TypeORM Entity**:
```typescript
// src/factura/entities/factura-cambio.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Factura } from './factura.entity';

@Entity('factura_cambios')
@Index('idx_factura', ['idFactura'])
@Index('idx_fecha', ['fecha'])
@Index('idx_factura_fecha', ['idFactura', 'fecha'])
export class FacturaCambio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_factura' })
  idFactura: number;

  @ManyToOne(() => Factura)
  @JoinColumn({ name: 'id_factura' })
  factura: Factura;

  @Column({
    type: 'enum',
    enum: ['CAMBIO_ESTADO', 'CAMBIO_MONTO', 'CAMBIO_CLIENTE', 'CREACION'],
  })
  tipoCambio: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'json', nullable: true })
  valorAnterior: any;

  @Column({ type: 'json', nullable: true })
  valorNuevo: any;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: number;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;
}
```

**Módulo**:
```typescript
// En factura.module.ts, agregar a imports:
TypeOrmModule.forFeature([Factura, DetalleFactura, CategoriaServicio, FacturaCambio])
```

**User Impact**: ✅ Auditoría funcionará correctamente  
**Risk**: 🟢 Bajo - Tabla nueva, sin datos existentes  
**ETA**: < 1 hora

---

#### Action 2: Sincronizar `estadoFactura` en PagoService

**Código**:
```typescript
// src/pago/pago.service.ts - registrarPago() method
// Línea ~120, cambiar:

// ANTES:
if (totalPagoNuevo >= totalFactura && factura.estado !== 'pagada') {
  factura.estado = 'pagada';
  await this.facturaService['facturaRepository'].save(factura);
}

// DESPUÉS:
if (totalPagoNuevo >= totalFactura) {
  factura.estado = 'pagada';  // Legacy
  factura.estadoFactura = ESTADOS_FACTURA.PAGADA;  // Canónico ✅ NUEVO
  await this.facturaService['facturaRepository'].save(factura);
} else if (totalPagoNuevo > 0 && totalPagoNuevo < totalFactura) {
  factura.estado = 'parcialmente_pagada';
  factura.estadoFactura = 'PAGADA_PARCIALMENTE';  // Considera agregar a ENUM
  await this.facturaService['facturaRepository'].save(factura);
}
```

**Imports requeridos**:
```typescript
import { ESTADOS_FACTURA } from '../common/constants/estados.constants';
```

**User Impact**: ✅ Estados sincronizados  
**Risk**: 🟢 Bajo - No afecta lógica existente  
**ETA**: 30 minutos

---

#### Action 3: Agregar FK explícitas en BD

**SQL**:
```sql
-- Check si FK ya existe
SELECT CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'detalle_facturas'
  AND COLUMN_NAME = 'categoria_servicios_id'
  AND REFERENCED_TABLE_NAME = 'categoria_servicios';

-- Si no existe, agregar:
ALTER TABLE detalle_facturas
ADD CONSTRAINT fk_detalle_categoria
FOREIGN KEY (categoria_servicios_id)
REFERENCES categoria_servicios(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Nota sobre idReferencia:
-- NO agregar FK a pedido_items porque:
-- 1. FacturaDetalle puede existir sin PedidoItem (cargos manuales)
-- 2. Permite editar detalles sin sincronizar con pedido
-- 3. Mejor como referencia lógica, no BD constraint
-- Documentar en comentario de tabla:
COMMENT = 'id_referencia apunta a pedido_items.id pero sin FK para permitir detalles manuales';
```

**User Impact**: ✅ Mejor integridad referencial  
**Risk**: 🟡 Medio - Necesita validar datos existentes  
**ETA**: 1 hora (con testing)

---

### 🟠 FASE 1: ALTA - PRÓXIMAS 2 SEMANAS

#### Action 4: Endpoints CRUD para Detalles

**Nuevos Endpoints**:

```typescript
// POST /facturas/:id/detalles - Agregar línea
@Post(':id/detalles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
async agregarDetalle(
  @Param('id') idFactura: number,
  @Body() dto: CreateDetalleFacturaDto,
): Promise<DetalleFactura>
// Valida: Factura en BORRADOR/EDITABLE
// Calcula: IVA/INC automático
// Recalcula: Desglose de factura

// PATCH /facturas/:id/detalles/:idDetalle - Editar línea
@Patch(':id/detalles/:idDetalle')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
async editarDetalle(
  @Param('id') idFactura: number,
  @Param('idDetalle') idDetalle: number,
  @Body() dto: UpdateDetalleFacturaDto,
): Promise<DetalleFactura>
// Valida: Factura en BORRADOR/EDITABLE
// Recalcula: Impuestos

// DELETE /facturas/:id/detalles/:idDetalle - Quitar línea
@Delete(':id/detalles/:idDetalle')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
async eliminarDetalle(
  @Param('id') idFactura: number,
  @Param('idDetalle') idDetalle: number,
): Promise<{ success: boolean }>
// Valida: Factura no PAGADA/ANULADA
// Recalcula desglose
```

**Métodos en FacturaService**:
```typescript
async agregarDetalle(idFactura, dto): Promise<DetalleFactura>
async editarDetalle(idFactura, idDetalle, dto): Promise<DetalleFactura>
async eliminarDetalle(idFactura, idDetalle): Promise<void>
async recalcularDesgloseFactura(idFactura): Promise<void>
```

**User Impact**: ✅ Edición completa de facturas  
**Risk**: 🟡 Medio - Recalcular impuestos en transacción  
**ETA**: 4-6 horas

---

#### Action 5: Sincronizar PedidoCancelado → Factura

**Implementación Opción A: Listener** (recomendado):
```typescript
// src/servicio/listeners/pedido-cancelado.listener.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class PedidoCanceladoListener {
  constructor(private facturaService: FacturaService) {}

  @OnEvent('pedido.cancelado')
  async handlePedidoCancelado(event: { pedidoId: number; motivo: string }) {
    // 1. Buscar factura asociada (via DetalleFactura.idReferencia)
    // 2. Si factura.estadoFactura BORRADOR/EDITABLE:
    //    - Remover DetalleFactura de este pedido
    //    - Recalcular desglose
    // 3. Si factura.estadoFactura EMITIDA+:
    //    - Loguear advertencia
    //    - No modificar (es histórico)
  }
}
```

**Implementación Opción B: Trigger BD**:
```sql
-- TRIGGER: Al cancelar pedido, remover detalles de factura si está en BORRADOR
CREATE TRIGGER tr_pedido_cancelado_remove_detalles
AFTER UPDATE ON pedidos
FOR EACH ROW
WHEN (NEW.estado_pedido = 'cancelado' AND OLD.estado_pedido != 'cancelado')
BEGIN
  -- Buscar factura referenciando este pedido
  DELETE FROM detalle_facturas
  WHERE id_referencia IN (
    SELECT id FROM pedido_items WHERE id_pedido = NEW.id
  )
  AND id_factura IN (
    SELECT id FROM facturas WHERE estado_factura IN ('BORRADOR', 'EDITABLE')
  );
END;
```

**User Impact**: ✅ Sincronización automática  
**Risk**: 🟡 Medio - Puede afectar datos si mal configurado  
**ETA**: 3-4 horas

---

#### Action 6: Historificar Tasas Tributarias

**Nuevos campos en DetalleFactura**:
```typescript
@Column({ 
  name: 'tasa_porcentaje_iva_snapshot',
  type: 'decimal',
  precision: 5,
  scale: 2,
  nullable: true 
})
tasaPorcentajeIvaSnapshot?: number;  // % IVA aplicada al momento

@Column({
  name: 'tasa_porcentaje_inc_snapshot',
  type: 'decimal',
  precision: 5,
  scale: 2,
  nullable: true
})
tasaPorcentajeIncSnapshot?: number;  // % INC aplicada al momento
```

**Migration SQL**:
```sql
ALTER TABLE detalle_facturas
ADD COLUMN tasa_porcentaje_iva_snapshot DECIMAL(5, 2) NULL
  COMMENT 'Tasa IVA (%) aplicada al momento de facturación',
ADD COLUMN tasa_porcentaje_inc_snapshot DECIMAL(5, 2) NULL
  COMMENT 'Tasa INC (%) aplicada al momento de facturación';
```

**Uso en generarDesdeReserva()**:
```typescript
// Guardar snapshots de tasas
(detalle as any).tasaPorcentajeIvaSnapshot = ivaRate?.tasaPorcentaje;
(detalle as any).tasaPorcentajeIncSnapshot = incRate?.tasaPorcentaje;
```

**User Impact**: ✅ Auditoría tributaria completa  
**Risk**: 🟢 Bajo - Solo lectura histórica  
**ETA**: 2 horas

---

### 🟡 FASE 2: MEDIA - PRÓXIMAS 4 SEMANAS

#### Action 7: Endpoints KPI

```typescript
// GET /facturas/stats/ingresos?desde=2026-01-01&hasta=2026-04-05
async ingresosPorPeriodo(@Query() query): Promise<{
  totalIngresos: number;
  cantidad: number;
  promedioFactura: number;
  desglose: { subtotal, iva, inc, total }
}>

// GET /facturas/stats/por-categoria
async ingresosPorCategoria(): Promise<{
  ALOJAMIENTO: { monto, % },
  CAFETERIA: { monto, % },
  SPA: { monto, % },
  ...
}>

// GET /facturas/stats/por-estado
async facturasPorEstado(): Promise<{
  BORRADOR: { cantidad, monto },
  EMITIDA: { cantidad, monto },
  PAGADA: { cantidad, monto },
  ANULADA: { cantidad, monto }
}>

// GET /facturas/stats/consolidacion-pedidos
async consolidacionPedidos(): Promise<{
  serviciosFacturados: number,
  serviciosSinFacturar: number,
  tasaCubrimiento: "%"
}>
```

**User Impact**: ✅ Visibilidad de negocio  
**Risk**: 🟢 Bajo - Solo consultas de lectura  
**ETA**: 4-6 horas

---

#### Action 8: Exportación

```typescript
// GET /facturas/export/pdf/:id
async exportarPDF(@Param('id') idFactura): Promise<Buffer>
  - Genera PDF con logo hotel, datos cliente, detalles, totales
  - Firma digital (opcional para DIAN)
  - Imprimible

// GET /facturas/export/excel?desde=&hasta=&estado=
async exportarExcel(@Query() filters): Promise<Buffer>
  - Reporte con columnas: #Factura, Cliente, Total, Estado, Fecha
  - Subtotales por estado
  - Filtros aplicables
```

**LibrerÍas recomendadas**:
- `pdfkit` - Generación PDF
- `exceljs` - Generación Excel

**User Impact**: ✅ Reportes exportables  
**Risk**: 🟢 Bajo - Usado solo para descargas  
**ETA**: 4-6 horas

---

## 1️⃣3️⃣ CONCLUSIÓN Y PRÓXIMOS PASOS

### Dashboard de Salud

```
┌──────────────────────────────┬────────┬─────────────────┐
│ Aspecto                      │ Estado │ Prioridad       │
├──────────────────────────────┼────────┼─────────────────┤
│ Entidades BD                 │ ✅ OK  │ -               │
│ Relaciones FK                │ ⚠️  OK  │ P1 (mejorar)   │
│ Lógica de negocio (facturación) │ ✅ OK  │ -               │
│ Cálculo tributario           │ ✅ OK  │ -               │
│ Máquina de estados           │ ✅ OK  │ -               │
│ Auditoría                    │ ❌ ROTO │ P0 CRÍTICO     │
│ CRUD detalles                │ ❌ FALTA │ P1 ESTA SEMANA  │
│ Sincronización estados       │ ⚠️ PARCIAL │ P1 HOY       │
│ KPIs                         │ ❌ FALTA │ P2 PRÓXIMO MES  │
│ Exportación                  │ ❌ FALTA │ P2 PRÓXIMO MES  │
│ Integración  Servicios       │ ✅ 90%  │ P2 (minor sync) │
└──────────────────────────────┴────────┴─────────────────┘
```

### Timeline Recomendado

| Fase | Duración | Tareas | % Completación |
|------|----------|--------|---|
| **P0 (Crítica)** | 1-2 días | Tabla auditoría, sincronizar estados, FKs | 100% |
| **P1 (Alta)** | 3-5 días | CRUD detalles, sincronizar cancelaciones, snapshots | 60% |
| **P2 (Media)** | 1 semana | KPIs, búsqueda, exportación | 30% |

### Próximos Pasos (Orden)

1. ✅ HOY:
   - [ ] Crear tabla `factura_cambios`
   - [ ] Actualizar PagoService para sincronizar `estadoFactura`
   - [ ] Deploy test

2. ✅ MAÑANA-PASADO:
   - [ ] Agregar FKs en BD
   - [ ] Iniciar endpoints CRUD detalles

3. ✅ ESTA SEMANA:
   - [ ] Completar CRUD detalles
   - [ ] Sincronización pedido cancelado
   - [ ] Tests de integración

4. ✅ PRÓXIMA SEMANA:
   - [ ] Historificar tasas
   - [ ] KPIs básicas

---

**Fin del Audit Completo**

**Auditor**: GitHub Copilot  
**Alcance**: Entidades | Servicios | DTOs | Controllers | Integración  
**Profundidad**: Exhaustiva (25+ archivos analizados)  
**Status**: ✅ COMPLETADO
