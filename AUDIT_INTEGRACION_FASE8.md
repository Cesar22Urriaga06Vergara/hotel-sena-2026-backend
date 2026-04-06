# AUDITORÍA EXHAUSTIVA: Integración Servicios/Pedidos con Facturación - FASE 8

**Fecha Auditoría:** 5 de abril de 2026  
**Herramienta:** Code Review + TypeORM Analysis  
**Scope:** src/servicio/*, src/factura/*, entidades relacionadas  
**Períodos Anteriores:** FASE 1-7 (Facturación básica, RBAC, validaciones)  

---

## 1. ANÁLISIS DE ENTIDADES

### A. Servicio (`src/servicio/entities/servicio.entity.ts`)

```typescript
@Entity('servicios')
export class Servicio {
  id: number
  idHotel: number              // FK a Hotel
  idCategoriaServicios: number // FK a CategoriaServicio (nullable)
  nombre: string
  descripcion: string
  categoria: ENUM[cafeteria|lavanderia|spa|room_service|minibar|otros]
  precioUnitario: DECIMAL(12,2)
  unidadMedida: VARCHAR(50) = 'unidad'
  imagenUrl: VARCHAR(500)
  activo: BOOLEAN = true
  disponibleDelivery: BOOLEAN = true  // ✅ NUEVO: controla si se puede entregar
  disponibleRecogida: BOOLEAN = true   // ✅ NUEVO: controla si se puede recoger
  esAlcoholico: BOOLEAN = false        // ✅ NUEVO: requiere validación de edad >= 21
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
  
  @OneToMany(() => PedidoItem, item => item.servicio)
  items: PedidoItem[]
}
```

**Hallazgos:**
- ✅ Relación con `PedidoItem` correctamente definida
- ✅ Campos de auditoría (createdAt, updatedAt)
- ❌ **CRÍTICO**: No hay trazabilidad de cambios de precio/disponibilidad (FALTA EntityAudit)
- ✅ Controles de entrega bien implementados
- ✅ Restricción de edad para alcohólicos presente

---

### B. Pedido (`src/servicio/entities/pedido.entity.ts`)

```typescript
@Entity('pedidos')
@Index(['idReserva', 'idHotel', 'estadoPedido', 'categoria'])
export class Pedido {
  id: number
  idReserva: number           // FK a Reserva
  idCliente: number           // FK a Cliente
  idHotel: number             // FK a Hotel
  tipoEntrega: ENUM[delivery|recogida]
  estadoPedido: ENUM[pendiente|en_preparacion|listo|entregado|cancelado] = 'pendiente'
  categoria: VARCHAR(50)      // Redundante: puede obtenerse de items[0].servicio.categoria
  notaCliente: TEXT
  notaEmpleado: TEXT
  idEmpleadoAtiende: INT
  fechaEntrega: DATETIME      // Registra fecha real de entrega
  totalPedido: DECIMAL(12,2) = 0
  fechaPedido: TIMESTAMP      // createdAt
  fechaActualizacion: TIMESTAMP // updatedAt
  
  @ManyToOne(() => Reserva)
  reserva: Reserva
  
  @OneToMany(() => PedidoItem, item => item.pedido, { cascade: true })
  items: PedidoItem[]
  
  @OneToMany(() => PedidoCambio, cambio => cambio.pedido, { cascade: true })
  cambios: PedidoCambio[]
}
```

**Máquina de Estados:**
```
pendiente
  ├─→ en_preparacion ✅
  ├─→ cancelado ✅
  │
en_preparacion
  ├─→ listo ✅
  ├─→ entregado ✅
  ├─→ cancelado ✅
  │
listo
  ├─→ entregado ✅
  ├─→ cancelado ✅
  │
entregado → [FINAL]
cancelado → [FINAL]
```

**Auditoría:** `PedidoCambio` registra cada transición
```typescript
@Entity('pedido_cambios')
export class PedidoCambio {
  id: number
  idPedido: number
  estadoAnterior: ENUM[...]
  estadoNuevo: ENUM[...]
  usuarioId: INT
  razonCambio: TEXT
  timestamp: TIMESTAMP ✅ AUTO
}
```

**Hallazgos:**
- ✅ Máquina de estados codificada en `servicio.service.ts:297-307`
- ✅ Auditoría automática en `registrarCambioPedido()`
- ❌ **CRÍTICO**: No hay listener que actualice Factura cuando Pedido→ENTREGADO
- ❌ Campo `categoria` es redundante (podría denormalizarse en items)
- ❌ No hay FK constraintexplícito a Reserva/Cliente (solo validación en aplicación)

---

### C. PedidoItem (`src/servicio/entities/pedido-item.entity.ts`)

```typescript
@Entity('pedido_items')
export class PedidoItem {
  id: number
  idPedido: number           // FK → Pedido
  idServicio: number         // FK → Servicio
  cantidad: INT = 1
  precioUnitarioSnapshot: DECIMAL(12,2) ✅ SNAPSHOT
  subtotal: DECIMAL(12,2)
  nombreServicioSnapshot: VARCHAR(150) ✅ SNAPSHOT
  observacion: VARCHAR(300)
  createdAt: TIMESTAMP
  
  @ManyToOne(() => Pedido, p => p.items, { onDelete: 'CASCADE' })
  pedido: Pedido
  
  @ManyToOne(() => Servicio, s => s.items, { onDelete: 'RESTRICT' })
  servicio: Servicio
}
```

**Hallazgos:**
- ✅ **EXCELENTE**: Snapshot de precio y nombre protege contra cambios retroactivos
- ❌ No hay auditoría si cantidad es modificada post-creación
- ❌ No hay relación con DetalleFactura (gap de integración)

---

### D. FacturaDetalle (`src/factura/entities/detalle-factura.entity.ts`)

```typescript
@Entity('detalle_facturas')
export class DetalleFactura {
  id: number
  idFactura: number                  // FK → Factura ✅ CONSTRAINED
  tipoConcepto: STRING[habitacion|servicio|descuento|cargo_adicional]
  descripcion: VARCHAR              // Texto legible en factura
  idReferencia: INT (NULLABLE)      // ❌ **CRÍTICO**: Sin constraint, puede apuntar a nada
  categoriaServiciosId: INT         // Opcional: para cálculo de impuestos
  categoriaNombre: VARCHAR          // Desnormalizado: histórico de categoría
  cantidad: DECIMAL(10,2)
  precioUnitario: DECIMAL(12,2)
  subtotal: DECIMAL(12,2)
  descuento: DECIMAL(12,2) = 0
  total: DECIMAL(12,2)
  montoIva: DECIMAL(12,2) = 0       // ✅ **NUEVO**: Impuesto por línea
  porcentajeInc: DECIMAL(5,2)       // ✅ **NUEVO**: INC para alcohólicos
  montoInc: DECIMAL(12,2) = 0       // ✅ **NUEVO**: Monto INC por línea
}
```

**Hallazgos:**
- ✅ Campos de impuesto por línea bien estructurados
- ✅ Desnormalización de categoría protege historicidad
- ❌ **CRÍTICO**: `idReferencia` sin constraint FK
  - Podría apuntar a Servicio, PedidoItem, Descuento, etc.
  - No hay columna explícita `tipo_referencia` para saber qué es
  - Permite crear detalles "fantasma" sin origen
- ❌ **MUY CRÍTICO**: No hay FK declarada a Pedido o PedidoItem
  - Impide auditoría del ciclo: Pedido→Entregado→FacturaDetalle
  - Impide validar integridad referencial
- ❌ No hay estado en detalle (ej: PENDIENTE, ENTREGADO, CANCELADO)
- ❌ No hay fecha de creación/actualización

---

### E. Factura (`src/factura/entities/factura.entity.ts`)

```typescript
@Entity('facturas')
export class Factura {
  id: number
  numeroFactura: UNIQUE VARCHAR ✅ FAC-2026-00001
  uuid: UNIQUE VARCHAR (para electrónica)
  idReserva: number
  idCliente: number
  nombreCliente: VARCHAR     // Desnormalizado
  cedulaCliente: VARCHAR
  emailCliente: VARCHAR
  idHotel: number
  
  // Montos
  subtotal: DECIMAL(12,2)
  porcentajeIva: DECIMAL(5,2) = 19
  montoIva: DECIMAL(12,2)
  porcentajeInc: DECIMAL(5,2) (nullable)
  montoInc: DECIMAL(12,2) = 0
  total: DECIMAL(12,2)
  
  // ✅ **NUEVO FASE 7**: Desglose flexible
  desgloseImpuestos: JSON { { tipoImpuesto: { categoria: monto } } }
  desgloseMonetario: JSON { { categoria: { subtotal, iva, inc, total } } }
  
  // ✅ **NUEVO FASE 7**: Estados canónicos
  estadoFactura: ENUM[BORRADOR|EDITABLE|EMITIDA|PAGADA|ANULADA]
  estado: VARCHAR (legacy)
  
  fechaEmision: DATETIME
  fechaVencimiento: DATETIME (30 días)
  observaciones: TEXT
  xmlData: LONGTEXT (para DIAN)
  jsonData: LONGTEXT (respaldo)
  cufe: VARCHAR (código DIAN)
  
  @OneToMany(() => DetalleFactura, d => d.factura, { cascade: true, eager: true })
  detalles: DetalleFactura[]
  
  @OneToMany(() => Pago, p => p.factura)
  pagos: Pago[]
  
  @OneToMany(() => FacturaCambio, c => c.factura, { eager: false })
  cambios: FacturaCambio[]
  
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
  deletedAt: DATETIME (soft delete)
  deletedBy: INT
}
```

**Máquina de Estados:**
```
BORRADOR
  ├─→ EDITABLE ✅
  ├─→ EMITIDA ✅
  ├─→ ANULADA ✅
  │
EDITABLE
  ├─→ EMITIDA ✅
  ├─→ BORRADOR ✅
  └─→ ANULADA ✅
  │
EMITIDA
  ├─→ PAGADA ✅
  └─→ ANULADA ✅
  │
PAGADA → [FINAL]
ANULADA → [FINAL]
```

**Auditoría:** `FacturaCambios` registra cambios (tabla no mostrada pero se referencia)

**Hallazgos:**
- ✅ Máquina de estados bien definida
- ✅ Desglose de impuestos por categoría
- ✅ Detalles cargados eagerly para integridad
- ❌ **CRÍTICO**: Detalles se calculan UNA SOLA VEZ en `generarDesdeReserva()`
  - No se pueden agregar/editar detalles después de creada factura
  - No hay API para POST/PUT/DELETE detalles

---

## 2. ANÁLISIS DE SERVICIOS Y MÉTODOS

### A. ServicioService (`src/servicio/servicio.service.ts`)

**Métodos principales:**

| Método | Existe | Auditoría | Integración Factura |
|--------|--------|-----------|---------------------|
| `crearServicio()` | ✅ | ❌ No | ❌ No |
| `obtenerServicio()` | ✅ | ✅ (logs) | - |
| `crearPedido()` | ✅ | ❌ (logs) | ❌ **CRÍTICO** |
| `actualizarEstadoPedido()` | ✅ | ✅ via PedidoCambio | ❌ **CRÍTICO** |
| `registrarCambioPedido()` | ✅ Private | ✅ | - |
| `cancelarPedidoCliente()` | ✅ | ❌ No audita | ❌ No afecta factura |

**Método crítico: `crearPedido()` (línea 121-247)**
```typescript
async crearPedido(idCliente: number, dto: CreatePedidoDto) {
  // 1. Valida reserva existe y cliente tiene acceso
  // 2. ✅ Valida que reserva está en check-in
  // 3. ✅ Valida edad para bebidas alcohólicas
  // 4. ✅ Valida servicios misma categoría
  // 5. ✅ Snapshot de precios
  // 6. Crea Pedido + PedidoItems
  // 7. ❌ **NO HACE**: Actualizar/crear factura asociada
  // 8. ❌ **NO HACE**: Registrar auditoría en FacturaCambio
}
```

**Método crítico: `actualizarEstadoPedido()` (línea 275-342)**
```typescript
async actualizarEstadoPedido(
  idPedido: number, 
  idEmpleado: number, 
  dto: UpdateEstadoPedidoDto
) {
  // 1. Obtiene pedido
  // 2. Valida transiciones (máquina de estados OK)
  // 3. Actualiza estadoPedido
  // 4. Si estadoNuevo === 'entregado':
  //    - Registra `pedido.fechaEntrega = new Date()`
  //    - ❌ **NO HACE**: Buscar factura de esta reserva
  //    - ❌ **NO HACE**: Agregar/actualizar DetalleFactura
  //    - ❌ **NO HACE**: Recalcular totales factura
  // 5. ✅ Registra cambio en PedidoCambios
}
```

**Hallazgo crítico:** No hay listener/hook que:
1. Cuando Pedido creado → agregar a DetalleFactura si factura existe
2. Cuando Pedido→ENTREGADO → marcar detalle como ENTREGADO
3. Cuando Pedido→CANCELADO → eliminar/desactivar detalle

---

### B. FacturaService (`src/factura/factura.service.ts`)

**Métodos principales:**

| Método | Existe | CRUD Detalles | Integración Pedido |
|--------|--------|---------------|--------------------|
| `generarDesdeReserva()` | ✅ | CREATE (1x) | ✅ Lee pedidos:ENTREGADO |
| `findOne()` | ✅ | READ | - |
| `findAll()` | ✅ | - | - |
| `emitir()` | ✅ | - | ❌ No valida pedidos |
| `anular()` | ✅ | - | ❌ No afecta pedidos |
| `marcarComoPagada()` | ✅ | - | - |
| `agregarDetalle()` | ❌ **FALTA** | CREATE | - |
| `actualizarDetalle()` | ❌ **FALTA** | UPDATE | - |
| `eliminarDetalle()` | ❌ **FALTA** | DELETE | - |
| `listarDetalles()` | ❌ **FALTA** | READ | - |

**Método: `generarDesdeReserva()` (línea 164-445)**
```typescript
async generarDesdeReserva(reserva: Reserva) {
  // A. Validación
  // - No permite generar 2 veces para misma reserva ✅
  
  // B. Detalles de Habitación (línea 204-216)
  const subtotalHabitacion = noches * precioNoche
  detalles.push({
    tipoConcepto: 'habitacion',
    categoriaServiciosId: 1, // Hardcoded!
    ...
  })
  
  // C. Detalles de Servicios (línea 219-254)
  const pedidosEntregados = await pedidoRepository.find({
    where: { idReserva, estadoPedido: 'entregado' }
  })
  
  for (const pedido of pedidosEntregados) {
    for (const item of pedido.items) {
      detalles.push({
        tipoConcepto: 'servicio',
        idReferencia: item.id,  // ❌ Apunta a PedidoItem
        categoriaServiciosId: servicio.idCategoriaServicios,
        ...
      })
    }
  }
  
  // ❌ **PROBLEMA**: Qué pasa si Pedido cambia a CANCELADO después?
  //    - La factura NO se actualiza
  //    - DetalleFactura queda "huérfano"
  
  // ✅ D. Cálculo de impuestos por línea
  const tax = await impuestoService.calculateLineaImpuestos({
    subtotal, categoriaServiciosId, hotelId, taxProfile
  })
  
  // E. Guardar detalles en transacción
  await queryRunner.manager.save(DetalleFactura, detallesConFactura)
}
```

**Hallazgos:**
- ✅ Integración con `impuestoService` para cálculos correctos
- ✅ Transacción ACID protege consistencia
- ❌ **CRÍTICO**: Snapshot de detalles ocurre una sola vez
- ❌ **CRÍTICO**: Pedido es "consumido" en factura (no hay relación bidireccional)
- ❌ Hardcoded `categoriaServiciosId: 1` para habitación (debería ser configurable)

---

## 3. ANÁLISIS DE ENDPOINTS Y DTOs

### A. En Servicio (`GET|POST|PATCH|DELETE /servicio/*`)

**Endpoints de Catálogo Servicios:**
- ✅ `POST /servicio/catalogo` - Crear servicio
- ✅ `GET /servicio/catalogo/:idHotel` - Listar servicios
- ✅ `GET /servicio/catalogo-agrupado/:idHotel` - Agrupar por categoría
- ✅ `PATCH /servicio/catalogo/:id` - Actaulizar servicio
- ✅ `DELETE /servicio/catalogo/:id` - Desactivar

**Endpoints de Pedidos:**
- ✅ `POST /servicio/pedidos` - Crear (via CreatePedidoDto)
- ✅ `GET /servicio/pedidos/mis-pedidos/:idReserva` - Obtener del cliente
- ✅ `DELETE /servicio/pedidos/:id/cancelar` - Cancelar (solo estado PENDING)
- ✅ `GET /servicio/pedidos/:id` - Obtener detalle
- ✅ `PATCH /servicio/pedidos/:id/estado` - Cambiar estado (via UpdateEstadoPedidoDto)
- ✅ `GET /servicio/pedidos/area/:idHotel/:categoria` - Listar por área
- ❌ **FALTA**: `POST /servicio/pedidos/:id/facturar` - Agregar a factura existente

**DTOs de Pedidos:**
- ✅ `CreatePedidoDto` - Crear pedido
- ✅ `UpdateEstadoPedidoDto` - Cambiar estado
- ❌ **FALTA**: `AgregarPedidoAFacturaDto` - Vincular post-creación

---

### B. En Factura (`GET|POST|PATCH|DELETE /facturas/*`)

**Endpoints de Facturas:**
- ✅ `POST /facturas/generar/:idReserva` - Generar desde reserva
- ✅ `GET /facturas` - Listar con filtros
- ✅ `GET /facturas/:id` - Obtener una
- ✅ `GET /facturas/reserva/:idReserva` - Por reserva
- ✅ `GET /facturas/cliente/:idCliente` - Por cliente
- ✅ `PATCH /facturas/:id/emitir` - Cambiar estado→EMITIDA
- ✅ `PATCH /facturas/:id/anular` - Cambiar estado→ANULADA
- ✅ `PATCH /facturas/:id/marcar-pagada` - Cambiar estado→PAGADA
- ✅ `GET /facturas/:id/historial-cambios` - Auditoría

**Endpoints para Detalles (FALTA TODO):**
- ❌ `GET /facturas/:id/detalles` - Listar detalles
- ❌ `POST /facturas/:id/detalles` - Agregar detalle manual
- ❌ `PUT /facturas/:id/detalles/:detalleId` - Editar detalle
- ❌ `DELETE /facturas/:id/detalles/:detalleId` - Remover detalle
- ❌ `GET /facturas/:id/detalles/:detalleId` - Obtener un detalle

**DTOs de Facturas:**
- ✅ `CreateFacturaDto` - Crear (legacy, no usado)
- ✅ `UpdateFacturaDto` - Actualizar montos/estado
- ✅ `EmitirFacturaDto` - Emitir
- ✅ `AnularFacturaDto` - Anular (con motivo)
- ✅ `MarcarPagadaDto` - Marcar pagada
- ❌ **FALTA**: `CreateDetalleFacturaDto` - Crear detalle
- ❌ **FALTA**: `UpdateDetalleFacturaDto` - Actualizar detalle
- ❌ **FALTA**: `AgregarPedidoAFacturaDto` - Vincular pedido completo

---

## 4. GAPS CRÍTICOS PARA INTEGRACIÓN (P0)

### 4.1 FK Débil en DetalleFactura

**Problema:**
```sql
-- Actual:
ALTER TABLE detalle_facturas 
ADD COLUMN id_referencia INT NULL;  -- Sin constraint

-- Dificultades:
-- ¿Qué es idReferencia? ¿PedidoItem? ¿Servicio? ¿Cualquiera?
-- Permite crear detalles erróneos sin validación
```

**Impacto:**
- No se puede auditar trazabilidad Pedido→DetalleFactura
- No se puede rechazar factura si Pedido es eliminado
- No se puede validar integridad referencial SQL-level

### 4.2 No hay Relación Pedido↔Factura

**Problema:**
```typescript
// En DetalleFactura: No existe
@ManyToOne(() => Pedido)
@JoinColumn({ name: 'id_pedido' })
pedido: Pedido

// En DetalleFactura: Solo existe
@Column({ name: 'id_referencia', nullable: true })
idReferencia: number  // ¿A qué apunta?
```

**Impacto:**
- ✅ Creación de factura aislada es segura (copia datos)
- ❌ No se puede actualizar factura si Pedido cambia post-emisión
- ❌ No se puede sincronizar estados
- ❌ Modelo de auditoría incompleto

### 4.3 No hay Listener para Actualizamiento Automático

**Problema:**
```typescript
// En servicio.service.ts:
async actualizarEstadoPedido(idPedido: number, ...: UpdateEstadoPedidoDto) {
  const pedido = await this.obtenerPedido(idPedido);
  pedido.estadoPedido = dto.estadoPedido;
  
  if (estadoNuevo === 'entregado') {
    pedido.fechaEntrega = new Date();
  }
  
  // ✅ Registra en PedidoCambios
  // ❌ NO HACE: 
  //    - Buscar DetalleFactura con idReferencia = pedido.items[*].id
  //    - Actualizar detalle.estado o campo similar
  //    - Recalcular totales factura
}
```

**Impacto:**
- Factura queda desincronizada con Pedido
- Si Pedido se cancela, factura sigue con monto incluido
- No hay trazabilidad de cambios en realtime

### 4.4 No hay API para Gestión Manual de Detalles

**Problema:**
Después de emitir una factura, no se puede:
1. Agregar nuevo servicio entregado que se olvidó
2. Remover servicio si fue error
3. Ajustar cantidad/precio para correcciones
4. El cliente está bloqueado: debe anular y regenerar

**Impacto:**
- Operacionalmente inflexible
- Requiere anulación y regeneración frecuente
- Auditoría incompleta

### 4.5 No hay Validación de Integridad en Emisión

**Problema:**
```typescript
// En factura.service.ts:327-332
async emitir(id: number, usuarioId?: number) {
  const factura = await this.findOne(id);
  
  const validacionIntegridad = this.integridadService
    .validarFacturaParaEmision(factura);  // ✅ Existe
  
  if (!validacionIntegridad.valida) {
    // ✅ Valida que detalles sean consistentes
    // ❌ NO VALIDA: ¿Los pedidos asociados siguen siendo válidos?
    // ❌ NO VALIDA: ¿Algún pedido fue cancelado después?
  }
}
```

**Impacto:**
- Se pueden emitir facturas con detalles de Pedidos cancelados/modificados

---

## 5. GAPS ALTOS (P1)

### 5.1 Sin Historicidad de Detalles

Cuando `DetalleFactura` se crea, no hay `createdAt`, `updatedAt`, `createdBy`:
```typescript
@Entity('detalle_facturas')
export class DetalleFactura {
  // FALTA:
  @CreateDateColumn()
  createdAt: Date  // ¿Cuándo se agregó?
  
  @UpdateDateColumn()
  updatedAt: Date  // ¿Cuándo fue la última modificación?
  
  @Column()
  createdBy: number  // ¿Quién creó?
}
```

### 5.2 Sin Estado en DetalleFactura

No se puede rastrear si un detalle está:
- PENDIENTE (esperando entrega)
- ENTREGADO (ya se hizo entrega)
- CANCELADO (pedido fue cancelado)
- AJUSTADO (se modificó post-creación)

```typescript
@Entity('detalle_facturas')
export class DetalleFactura {
  // FALTA:
  @Column({
    type: 'enum',
    enum: ['PENDIENTE', 'ENTREGADO', 'CANCELADO', 'AJUSTADO'],
    default: 'PENDIENTE'
  })
  estado: string
}
```

### 5.3 Sin Auditoría en DetalleFactura

Cambios a detalles (agregación, eliminación, edición) no se registran:
```typescript
// FALTA tabla:
@Entity('detalle_factura_cambios')
export class DetalleFacturaCambio {
  id: number
  idDetalleFactura: number
  operacion: ENUM[CREADO|ACTUALIZADO|ELIMINADO]
  cambios: JSON
  usuarioId: number
  timestamp: TIMESTAMP
}
```

### 5.4 Sin Control de Cambios Retroactivos

Si `PedidoItem.cantidad` se modifica después de crear `DetalleFactura`:
```typescript
// Escenario: Pedido entregado con 1 service, después ajustan a 2
const pedidoItem = await this.pedidoItemRepository.findOne(id)
pedidoItem.cantidad = 2  // Cambio POST-facturación
await save()  // ¿Quién avisa a Factura?
```

**Impacto:**
- Factura tiene monto incorrecto
- No hay auditoría del cambio
- No se puede revertir

### 5.5 Sin Recalculación de Impuestos

Cuando se agrega un detalle nuevo (futuro), no recalcula:
- Desglose de impuestos por categoría
- Montos totales
- JSON de auditoría

```typescript
// Falta en FacturaService:
private async recalcularImpuestos(factura: Factura) {
  const nuevoDesglose = {}
  for (const detalle of factura.detalles) {
    const tax = await this.impuestoService.calculateLineaImpuestos(...)
    // Aggregar...
  }
  factura.desgloseImpuestos = nuevoDesglose
  factura.montoIva = ...
  factura.montoInc = ...
  factura.total = ...
}
```

---

## 6. MATRIZ DE INTEGRACIÓN ACTUAL

| Acción | Pedido | DetalleFactura | Factura | Auditado |
|--------|--------|---|---------|----------|
| Crear Pedido | ✅ Creado | ❌ No se crea automáticamente | ❌ No se actualiza | ✅ PedidoCambio |
| Pedido:ENTREGADO | ✅ Estado OK | ❌ No se actualiza (si existe) | ❌ No se recalcula | ✅ PedidoCambio |
| Pedido:CANCELADO | ✅ Estado OK | ❌ Queda incluido en factura | ❌ No se recalcula | ✅ PedidoCambio |
| **Generar Factura** | ✅ Se consulta | ✅ Se crea (1x) | ✅ Se genera | ❌ Parcial |
| Agregar Detalle Manual | ❌ No hay API | ❌ FALTA | ❌ NO SOPORTADO | ❌ No |
| Editar Detalle | ❌ N/A | ❌ FALTA | ❌ NO SOPORTADO | ❌ No |
| Eliminar Detalle | ❌ N/A | ❌ FALTA | ❌ NO SOPORTADO | ❌ No |
| Emitir Factura | ❌ No se valida | ✅ Se preserva | ✅ Estado EMITIDA | ✅ FacturaCambio |
| Anular Factura | ❌ No se revierte | ❌ No se revierte | ✅ Estado ANULADA | ✅ FacturaCambio |

---

## 7. SCORE DE INTEGRACIÓN

**Escala:** 0-10

```
Criterio                        Puntaje  Observación
──────────────────────────────────────────────────────
1. FK Integridad                 2/10     Sin constraints débiles
2. Máquina de estados            8/10     Ambas definidas, sin sincronización
3. Trazabilidad (Auditoría)      5/10     Cada tabla por su cuenta, sin relación
4. API Completa                  3/10     Falta CRUD detalles
5. Listeners/Eventos             0/10     Ninguno implementado
6. Validaciones                  6/10     Creación OK, actualización débil
7. Recalculación Automática      0/10     Nunca recalcula post-creación
8. Historicidad                  4/10     Falta en DetalleFactura
9. Documentación                 5/10     DTOs documentados, flows no
10. Tests                         0/10     No hay tests específicos fase 8

═══════════════════════════════════════════════════════
SCORE TOTAL: 3.3/10  ⚠️ CRÍTICO - REQUIERE REFACTORIZACIÓN
═══════════════════════════════════════════════════════
```

---

## 8. DIAGRAMA DE FLUJOS ACTUAL vs DESEADO

### FLUJO ACTUAL (SINCRÓNICO, DESCONECTADO)

```
1. Cliente crea Pedido
   [Servicio:servicio.service.ts:crearPedido]
   ├─ Valida Reserva ✅
   ├─ Valida Servicios ✅
   ├─ Snapshot PedidoItem ✅
   ├─ Registra PedidoCambio ✅
   └─ ❌ No notifica a Factura

2. Empleado actualiza Pedido:entregado
   [Servicio:servicio.service.ts:actualizarEstadoPedido]
   ├─ Valida transición ✅
   ├─ Registra PedidoCambio ✅
   ├─ fechaEntrega = now() ✅
   └─ ❌ No busca DetalleFactura

3. Recepcionista genera Factura
   [Factura:factura.service.ts:generarDesdeReserva]
   ├─ Busca pedidos:entregado ✅
   ├─ Crea DetalleFactura (snapshot) ✅
   ├─ Cálculo impuestos ✅
   └─ Queda BLOQUEADA: no se puede modificar

4. Descubrimiento tardío: Pedido 5 se canceló
   └─ ❌ DetalleFactura sigue incluida en monto
   └─ ❌ Sin opción de editar detalle
   └─ ❌ Requiere anular y regenerar factura
```

### FLUJO DESEADO (ASINCRÓNICO, INTEGRADO)

```
1. Cliente crea Pedido
   └─ EVENT: PedidoCreado
      ├─ Si existe Factura:BORRADOR|EDITABLE
      └─ POST /facturas/:id/detalles + pedido.items

2. Empleado: Pedido:entregado
   └─ EVENT: PedidoEntregado
      ├─ Busca DetalleFactura.idReferencia en items
      ├─ Actualiza estado:ENTREGADO
      ├─ Factura:BORRADOR → Se agregó detalle
      ├─ Factura:EDITABLE → Se actualizó detalle
      └─ Factura:EMITIDA → SE BLOQUEA (NO se modifica)

3. Empleado: Pedido:cancelado
   └─ EVENT: PedidoCancelado
      ├─ Busca DetalleFactura con idPedido
      ├─ Si Factura:BORRADOR|EDITABLE → DELETE detalle
      ├─ Si Factura:EMITIDA → Se bloquea (requiere anular)
      └─ Recalcula impuestos/totales

4. Recepcionista genera Factura
   ├─ GET /facturas/:id/detalles (listar actuales)
   ├─ POST /facturas/:id/detalles (agregar manual si falta)
   ├─ PUT /facturas/:id/detalles/:id (ajustar cantidad)
   ├─ DELETE /facturas/:id/detalles/:id (remover error)
   └─ PATCH /facturas/:id/emitir (cuando confirme) ✅

5. Descubrimiento: Se agregó servicio no reflejado
   ├─ POST /facturas/:123/detalles (actualiza factura)
   ├─ Recalcula impuestos ✅
   ├─ Audita evento ✅
   └─ Cliente ve nuevo monto ✅
```

---

## 9. EJEMPLO SQL: INTEGRIDAD REFERENCIAL PROPUESTA

```sql
-- FASE 8: Agregar FK explícita a Pedido
ALTER TABLE detalle_facturas 
ADD COLUMN id_pedido INT NULL,
ADD CONSTRAINT fk_detalle_pedido 
  FOREIGN KEY (id_pedido) REFERENCES pedidos(id) 
  ON DELETE RESTRICT;  -- Protege si se elimina pedido

-- FASE 8: Categorizar el origen del detalle
ALTER TABLE detalle_facturas 
ADD COLUMN tipo_referencia ENUM[
  'PEDIDO_ITEM',      -- Proviene de Servicio/Pedido
  'HABITACION',       -- Alojamiento
  'CARGO_MANUAL',     -- Agregado manualmente
  'DESCUENTO',        -- Descuento aplicado
  'AJUSTE'            -- Ajuste post-hecho
] DEFAULT 'CARGO_MANUAL';

-- FASE 8: Agregar estado y auditoría
ALTER TABLE detalle_facturas 
ADD COLUMN estado ENUM[
  'PENDIENTE',        -- Esperando entrega
  'ENTREGADO',        -- Servicio ya entregado
  'CANCELADO',        -- Pedido cancelado
  'AJUSTADO'          -- Se modificó post-creación
] DEFAULT 'PENDIENTE',
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN created_by INT,
ADD CONSTRAINT fk_detalle_usuario_creador 
  FOREIGN KEY (created_by) REFERENCES empleados(id);

-- FASE 8: Nueva tabla de auditoría
CREATE TABLE detalle_factura_cambios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_detalle_factura INT NOT NULL,
  operacion ENUM['CREADO', 'ACTUALIZADO', 'ELIMINADO'],
  cambios JSON,
  usuario_id INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_detalle_factura) REFERENCES detalle_facturas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

---

## 10. EJEMPLO: FLUJO CORRECTO CON LOGS

```typescript
// ESCENARIO: Pedido creado, luego entregado, luego cancelado
// Fecha: 2026-04-05

// T1: 10:00 - Crear Pedido (pizza + cerveza)
POST /servicio/pedidos
{
  idReserva: 42,
  tipoEntrega: "delivery",
  items: [
    { idServicio: 5, cantidad: 1 },  // Pizza (COP 45000)
    { idServicio: 8, cantidad: 1 }   // Cerveza (COP 15000, alcohólica)
  ]
}

RESULTADO:
└─ Pedido ID 100 creado (estado:PENDIENTE, total: 60000)
   ├─ PedidoItem[1]: servicio_id:5, cantidad:1, precio_snap:45000
   ├─ PedidoItem[2]: servicio_id:8, cantidad:1, precio_snap:15000
   └─ PedidoCambios[1]: null→PENDIENTE (T1:10:00, usuario:null)

// T2: 10:00 - Generar Factura (solo si había pedidos:entregado ANTES)
// En este caso NO HAY TODAVÍA PEDIDOS ENTREGADOS
// → Se espera a que cliente reciba pedidos

// T3: 10:15 - Empleado: Pedido→listo
PATCH /servicio/pedidos/100/estado
{
  estadoPedido: "listo",
  notaEmpleado: "Lista para entrega"
}

RESULTADO:
└─ Pedido ID 100: estadoPedido = LISTO
   └─ PedidoCambios[2]: PENDIENTE→LISTO (T3:10:15, usuario:3)

// T4: 10:25 - Empleado: Pedido→entregado
PATCH /servicio/pedidos/100/estado
{
  estadoPedido: "entregado",
  notaEmpleado: "Entregado a cliente"
}

RESULTADO:
└─ Pedido ID 100: estadoPedido = ENTREGADO, fechaEntrega = 2026-04-05 10:25
   └─ PedidoCambios[3]: LISTO→ENTREGADO (T4:10:25, usuario:3)
   
// 🔍 TODAVÍA NO ESTÁ INTEGRADO: Factura NO se actualiza automáticamente

// T5: 11:00 - Recepcionista: Generar Factura
POST /facturas/generar/42
{
  idReserva: 42
}

RESULTADO:
└─ Factura ID 501 (FAC-2026-00501):
   ├─ Estado: BORRADOR
   ├─ Detalles:
   │  ├─ DetalleFactura[1]: habitacion (SUITE, 2 noches × 250000 = 500000)
   │  │  ├─ idReferencia: null (tipo: HABITACION)
   │  │  ├─ categoriaServiciosId: 1
   │  │  ├─ montoIva: 95000
   │  │  └─ montoInc: 0
   │  │
   │  ├─ DetalleFactura[2]: servicio (Pizza, del Pedido 100)
   │  │  ├─ idReferencia: 200  (id PedidoItem)
   │  │  ├─ categoriaServiciosId: 5 (ALIMENTOS)
   │  │  ├─ subtotal: 45000
   │  │  ├─ montoIva: 8550
   │  │  └─ montoInc: 0
   │  │
   │  └─ DetalleFactura[3]: servicio (Cerveza, del Pedido 100)
   │     ├─ idReferencia: 201  (id PedidoItem)
   │     ├─ categoriaServiciosId: 16 (BEBIDAS_ALCOHOLICAS)
   │     ├─ subtotal: 15000
   │     ├─ montoIva: 2850
   │     └─ montoInc: 7500  ✅ INC para bebidas
   │
   ├─ Totales:
   │  ├─ subtotal: 560000
   │  ├─ montoIva: 106400
   │  ├─ montoInc: 7500
   │  └─ total: 673900
   │
   └─ FacturaCambios[1]: null→BORRADOR (T5:11:00, usuario:2)

// T6: 11:30 - PROBLEMA: Empleado se da cuenta que entregó cantidad INCORRECTA
// (Fueron 2 pizzas, no 1)

// ❌ ACTUAL: No hay forma de editar DetalleFactura
// ❌ ACTUAL: Debe anular y regenerar factura

// ✅ FUTURO (FASE 8): Actualizar detalle
PUT /facturas/501/detalles/102
{
  cantidad: 2
}

RESULTADO:
└─ DetalleFactura[2] ACTUALIZADO:
   ├─ cantidad: 1 → 2
   ├─ subtotal: 45000 → 90000
   ├─ montoIva: 8550 → 17100
   ├─ estado: PENDIENTE → AJUSTADO
   │
   └─ DetalleFacturaCambios[1]: ACTUALIZADO
      ├─ cantidad: {anterior: 1, nuevo: 2}
      ├─ subtotal: {anterior: 45000, nuevo: 90000}
      ├─ usuario: 3
      └─ timestamp: 2026-04-05 11:30

// Factura recalcula automáticamente:
├─ subtotal: 560000 → 605000
├─ montoIva: 106400 → 115050
├─ total: 673900 → 722550
│
└─ FacturaCambios[2]: RECALCULADO
   ├─ descripción: "Detalle modificado, recalculados impuestos"
   ├─ usuario: 3
   └─ timestamp: 2026-04-05 11:30

// T7: 11:45 - Recepcionista emite factura
PATCH /facturas/501/emitir
{}

RESULTADO:
└─ Factura:501 estado BORRADOR → EMITIDA
   ├─ fechaEmision: 2026-04-05 11:45
   ├─ FacturaCambios[3]: emit (usuario:2)
   └─ FacturaCambios histórico preservado ✅

// T8: 12:00 - Cliente ve error: "Pedí 1 pizza, dice 2"
// ❌ ACTUAL: Debe anular factura completamente
// ✅ FUTURO: Solo revertir el detalle
DELETE /facturas/501/detalles/102
{ motivo: "Error de cantidad, cliente pide solo 1 pizza" }

RESULTADO:
└─ DetalleFactura[2] ELIMINADO (soft-delete):
   ├─ estado: PENDIENTE → CANCELADO
   ├─ cancelledAt: 2026-04-05 12:00
   ├─ cancelledBy: 2
   ├─ cancelledReason: "Error de cantidad, cliente pide solo 1 pizza"
   │
   └─ DetalleFacturaCambios[2]: ELIMINADO
      ├─ usuario: 2
      └─ timestamp: 2026-04-05 12:00

// Factura se actualiza:
├─ subtotal: 605000 → 560000
├─ montoIva: 115050 → 106400  
├─ total: 722550 → 673900
│
├─ Estado: PUEDE REVERTIR A BORRADOR si aún no fue pagada
└─ FacturaCambios[4]: RECALCULADO

// FIN: Auditoría completa preservada en:
// - PedidoCambios[1-3]: Historial de estados de Pedido
// - DetalleFacturaCambios[1-2]: Historial de cambios en detalle
// - FacturaCambios[1-4]: Historial de cambios en factura
```

---

## 11. CONCLUSIÓN

**Estado Actual:** Integración fragmentada sin sincronización en tiempo real
- Cada entidad (Pedido, Factura) funciona independientemente
- Auditoría aislada por tabla
- No hay validación cruzada
- Operaciones manuales requieren anulación/regeneración

**Requerimientos FASE 8:**
1. FK explícita Pedido↔DetalleFactura
2. API CRUD completa para detalles
3. Listeners para sincronización automática
4. Validaciones de integridad antes de emitir
5. Historicidad completa en cada operación

**Impacto Operacional:**
- 🔴 **CRÍTICO:** Inconsistencias silenciosas entre Pedido y Factura
- 🟠 **ALTO:** Inflexibilidad operacional (requiere anulación frecuente)
- 🟡 **MEDIO:** Gaps en auditoría (no se registra quién modificó qué)

---
