# ⚡ ACCIONES INMEDIATAS: AUDITORÍA FACTURACIÓN

**Fecha**: 5 de Abril 2026  
**Responsable**: Tech Lead Backend  
**Timeline**: Hoy - 2 Semanas  
**Estado**: Listos para implementar

---

## 🔴 P0 - CRÍTICO (HOY - MAÑANA)

### Issue #1: Tabla `factura_cambios` no existe
**Severidad**: 🔴 CRÍTICA  
**Impacto**: Auditoría de cambios falla silenciosamente  
**Afectados**: emitir(), anular(), marcarComoPagada(), update()  

**Síntomas**:
- Cambios de estado se graban SIN auditoría
- getRepository('FacturaCambios') falla pero se cachea con `.warn()`
- Imposible auditar quién cambió estado y por qué

**Solución**:
```sql
-- scripts/migrations/004_create_factura_cambios.sql
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
) ENGINE=InnoDB CHARSET=UTF8MB4;
```

**Entidad TypeORM**:
```typescript
// src/factura/entities/factura-cambio.entity.ts
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
// src/factura/factura.module.ts - agregar a imports
TypeOrmModule.forFeature([Factura, DetalleFactura, CategoriaServicio, FacturaCambio])
```

**Tests**:
```typescript
// Verificar que auditoría se graba
const factura = await service.emitir(1);
const cambios = await dataSource.getRepository('FacturaCambios').find({
  where: { idFactura: 1 }
});
expect(cambios.length).toBeGreaterThan(0);
expect(cambios[0].tipoCambio).toBe('CAMBIO_ESTADO');
```

**ETA**: 1 hora  
**Owner**: Backend Lead  
**Blocker**: Sí, auditoría no funciona sin esto

---

### Issue #2: Estados desincronizados (estadoFactura vs estado)
**Severidad**: 🔴 CRÍTICA  
**Impacto**: PagoService actualiza `estado` pero no `estadoFactura`  
**Síntomas**:
- `estado = 'pagada'` pero `estadoFactura = 'EMITIDA'` (desincronizado)
- Consultas GET /facturas/:id retornan estado incorrecto
- Máquina de estados quebrada

**Solución**:
```typescript
// src/pago/pago.service.ts - método registrarPago()

// BEFORE (línea ~120):
if (totalPagoNuevo >= totalFactura && factura.estado !== 'pagada') {
  factura.estado = 'pagada';
  await this.facturaService['facturaRepository'].save(factura);
} else if (totalPagoNuevo > 0 && totalPagoNuevo < totalFactura) {
  factura.estado = 'parcialmente_pagada';
  await this.facturaService['facturaRepository'].save(factura);
}

// AFTER - Agregar sincronización:
import { ESTADOS_FACTURA } from '../common/constants/estados.constants';

if (totalPagoNuevo >= totalFactura) {
  // ✅ Actualizar AMBOS campos
  factura.estado = 'pagada';  // Legacy
  factura.estadoFactura = ESTADOS_FACTURA.PAGADA;  // Canónico
  await this.facturaService['facturaRepository'].save(factura);
} else if (totalPagoNuevo > 0 && totalPagoNuevo < totalFactura) {
  // ✅ Nuevo estado para pagos parciales
  factura.estado = 'parcialmente_pagada';
  factura.estadoFactura = 'PAGADA_PARCIALMENTE';  // Nota: no está en ENUM actual
  await this.facturaService['facturaRepository'].save(factura);
}

// ✅ También registrar en auditoría
try {
  const FacturaCambiosRepo = this.dataSource.getRepository('FacturaCambios');
  await FacturaCambiosRepo.save({
    idFactura: dto.idFactura,
    usuarioId: idEmpleado,
    tipoCambio: 'CAMBIO_ESTADO',
    descripcion: `Pago aplicado - Factura pagada. Monto: $${dto.monto}`,
    valorAnterior: JSON.stringify({ estado: 'pendiente' }),
    valorNuevo: JSON.stringify({ estado: 'pagada', estadoFactura: ESTADOS_FACTURA.PAGADA }),
    fecha: new Date(),
  });
} catch (error) {
  console.warn('Error auditoría pago:', error);
}
```

**Posible Issue**: Estado `PAGADA_PARCIALMENTE` no está en ENUM actual  
**Solución**: Agregar a comentarios o usar state flexiblemente

**Tests**:
```typescript
// Verificar sincronización
const pago = await pagoService.registrarPago({ idFactura: 1, monto: total });
const factura = await facturaService.findOne(1);

expect(factura.estado).toBe('pagada');
expect(factura.estadoFactura).toBe('PAGADA');
```

**ETA**: 30 minutos  
**Owner**: PagoService Owner  
**Blocker**: Sí, máquina de estados quebrada

---

### Issue #3: FKs débiles en DetalleFactura
**Severidad**: 🟠 ALTA  
**Impacto**: `idReferencia` sin constraint de BD  
**Solución**:

```sql
-- Verificar si FK ya existe
SELECT CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'detalle_facturas'
  AND REFERENCED_TABLE_NAME = 'categoria_servicios';

-- Si no existe, agregar:
ALTER TABLE detalle_facturas
ADD CONSTRAINT fk_detalle_categoria
FOREIGN KEY (categoria_servicios_id)
REFERENCES categoria_servicios(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Nota: NO agregar FK a pedido_items por:
-- 1. Permite detalles manuales sin pedido asociado
-- 2. Flexibilidad para ediciones post-creación
-- 3. Se documenta en comentario de tabla
```

**Documentación en BD**:
```sql
ALTER TABLE detalle_facturas
COMMENT = 'Detalles de líneas de factura. id_referencia apunta lógicamente a pedido_items.id pero sin FK para permitir detalles manuales y ediciones flexibles.';

ALTER TABLE detalle_facturas
MODIFY COLUMN id_referencia INT
COMMENT = 'Referencia lógica a pedido_items.id (sin FK para flexibilidad)';
```

**ETA**: 1 hora (con testing)  
**Owner**: DBA  
**Blocker**: No (mejora integridad)

---

## 🟠 P1 - ALTA (ESTA SEMANA)

### Issue #4: CRUD Detalles (POST/PATCH/DELETE)
**Severidad**: 🟠 ALTA  
**Impacto**: No se pueden editar facturas post-creación  
**Requisitos**:
- Agregar línea a factura en BORRADOR/EDITABLE
- Editar línea existente (cantidad, precio, categoría)
- Eliminar línea
- Recalcular desglose IVA/INC automático

**Nuevos DTOs**:
```typescript
// src/factura/dto/create-detalle-factura.dto.ts
export class CreateDetalleFacturaDto {
  @IsEnum(['habitacion', 'servicio', 'descuento', 'cargo_adicional'])
  tipoConcepto: string;

  @IsString()
  @MinLength(10)
  @MaxLength(200)
  descripcion: string;

  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @IsNumber()
  @Min(1)
  @Max(10)  // 1=Alojamiento, 2=Café, etc
  categoriaServiciosId: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento?: number;

  @IsOptional()
  @IsNumber()
  idReferencia?: number;  // → PedidoItem.id si aplica
}

// src/factura/dto/update-detalle-factura.dto.ts
export class UpdateDetalleFacturaDto {
  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  cantidad?: number;

  @IsOptional()
  @IsNumber()
  precioUnitario?: number;

  @IsOptional()
  @IsNumber()
  descuento?: number;

  @IsOptional()
  @IsNumber()
  categoriaServiciosId?: number;
}
```

**Nuevos Endpoints**:
```typescript
// src/factura/factura.controller.ts

/**
 * POST /facturas/:idFactura/detalles
 * Agregar nueva línea a factura
 */
@Post(':idFactura/detalles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
async agregarDetalle(
  @Param('idFactura', ParseIntPipe) idFactura: number,
  @Body() dto: CreateDetalleFacturaDto,
  @Request() req: any,
): Promise<DetalleFactura> {
  // Validar que factura pertenezca a su hotel si es admin
  if (req.user.rol === 'admin') {
    const factura = await this.facturaService.findOne(idFactura);
    if (factura.idHotel !== req.user.idHotel) {
      throw new ForbiddenException();
    }
  }
  return this.facturaService.agregarDetalle(idFactura, dto);
}

/**
 * PATCH /facturas/:idFactura/detalles/:idDetalle
 * Editar línea existente
 */
@Patch(':idFactura/detalles/:idDetalle')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
async editarDetalle(
  @Param('idFactura', ParseIntPipe) idFactura: number,
  @Param('idDetalle', ParseIntPipe) idDetalle: number,
  @Body() dto: UpdateDetalleFacturaDto,
  @Request() req: any,
): Promise<DetalleFactura> {
  if (req.user.rol === 'admin') {
    const factura = await this.facturaService.findOne(idFactura);
    if (factura.idHotel !== req.user.idHotel) {
      throw new ForbiddenException();
    }
  }
  return this.facturaService.editarDetalle(idFactura, idDetalle, dto);
}

/**
 * DELETE /facturas/:idFactura/detalles/:idDetalle
 * Eliminar línea
 */
@Delete(':idFactura/detalles/:idDetalle')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
async eliminarDetalle(
  @Param('idFactura', ParseIntPipe) idFactura: number,
  @Param('idDetalle', ParseIntPipe) idDetalle: number,
  @Request() req: any,
): Promise<{ success: boolean }> {
  if (req.user.rol === 'admin') {
    const factura = await this.facturaService.findOne(idFactura);
    if (factura.idHotel !== req.user.idHotel) {
      throw new ForbiddenException();
    }
  }
  await this.facturaService.eliminarDetalle(idFactura, idDetalle);
  return { success: true };
}
```

**Métodos en Service**:
```typescript
/**
 * Agregar detalle a factura
 * Valida: Factura en BORRADOR/EDITABLE
 * Recalcula: Impuestos automáticos
 */
async agregarDetalle(
  idFactura: number,
  dto: CreateDetalleFacturaDto,
): Promise<DetalleFactura> {
  const factura = await this.findOne(idFactura);

  // Validar estado
  if (![ESTADOS_FACTURA.BORRADOR, ESTADOS_FACTURA.EDITABLE].includes(
    factura.estadoFactura as EstadoFactura
  )) {
    throw new BadRequestException(
      `No se pueden agregar detalles en estado ${factura.estadoFactura}`
    );
  }

  // Calcular impuestos para la línea
  const tax = await this.impuestoService.calculateLineaImpuestos({
    subtotal: dto.cantidad * dto.precioUnitario,
    categoriaServiciosId: dto.categoriaServiciosId,
    hotelId: factura.idHotel,
    taxProfile: (await this.clienteService.findOne(factura.idCliente)).taxProfile,
  });

  // Crear detalle
  const detalle = new DetalleFactura();
  detalle.idFactura = idFactura;
  detalle.tipoConcepto = dto.tipoConcepto;
  detalle.descripcion = dto.descripcion;
  detalle.cantidad = dto.cantidad;
  detalle.precioUnitario = dto.precioUnitario;
  detalle.subtotal = dto.cantidad * dto.precioUnitario;
  detalle.descuento = dto.descuento || 0;
  detalle.total = detalle.subtotal - detalle.descuento;
  detalle.categoriaServiciosId = dto.categoriaServiciosId;
  detalle.montoIva = tax.iva;
  detalle.montoInc = tax.inc;
  detalle.idReferencia = dto.idReferencia;

  const detalleGuardado = await this.detalleFacturaRepository.save(detalle);

  // Recalcular desglose de factura
  await this.recalcularDesgloseFactura(idFactura);

  return detalleGuardado;
}

/**
 * Editar detalle existente
 */
async editarDetalle(
  idFactura: number,
  idDetalle: number,
  dto: UpdateDetalleFacturaDto,
): Promise<DetalleFactura> {
  const factura = await this.findOne(idFactura);
  const detalle = await this.detalleFacturaRepository.findOne({
    where: { id: idDetalle, idFactura },
  });

  if (!detalle) {
    throw new NotFoundException(`Detalle ${idDetalle} no encontrado`);
  }

  // Validar estado
  if (![ESTADOS_FACTURA.BORRADOR, ESTADOS_FACTURA.EDITABLE].includes(
    factura.estadoFactura as EstadoFactura
  )) {
    throw new BadRequestException();
  }

  // Actualizar campos
  if (dto.descripcion) detalle.descripcion = dto.descripcion;
  if (dto.cantidad) {
    detalle.cantidad = dto.cantidad;
    detalle.subtotal = detalle.cantidad * detalle.precioUnitario;
  }
  if (dto.precioUnitario) {
    detalle.precioUnitario = dto.precioUnitario;
    detalle.subtotal = detalle.cantidad * detalle.precioUnitario;
  }
  if (dto.descuento !== undefined) detalle.descuento = dto.descuento;

  // Recalcular totales y impuestos si cambió cantidad/precio
  if (dto.cantidad || dto.precioUnitario) {
    detalle.total = detalle.subtotal - detalle.descuento;
    const tax = await this.impuestoService.calculateLineaImpuestos({
      subtotal: detalle.subtotal,
      categoriaServiciosId: detalle.categoriaServiciosId || 1,
      hotelId: factura.idHotel,
      taxProfile: (await this.clienteService.findOne(factura.idCliente)).taxProfile,
    });
    detalle.montoIva = tax.iva;
    detalle.montoInc = tax.inc;
  }

  const detalleActualizado = await this.detalleFacturaRepository.save(detalle);

  // Recalcular factura
  await this.recalcularDesgloseFactura(idFactura);

  return detalleActualizado;
}

/**
 * Eliminar detalle
 */
async eliminarDetalle(idFactura: number, idDetalle: number): Promise<void> {
  const factura = await this.findOne(idFactura);

  // Validar estado
  if ([ESTADOS_FACTURA.PAGADA, ESTADOS_FACTURA.ANULADA].includes(
    factura.estadoFactura as EstadoFactura
  )) {
    throw new BadRequestException(
      `No se pueden eliminar detalles de factura en estado ${factura.estadoFactura}`
    );
  }

  await this.detalleFacturaRepository.delete(idDetalle);

  // Recalcular
  await this.recalcularDesgloseFactura(idFactura);
}

/**
 * Recalcular desglose de impuestos de factura completa
 */
async recalcularDesgloseFactura(idFactura: number): Promise<void> {
  const factura = await this.facturaRepository.findOne({
    where: { id: idFactura },
    relations: ['detalles'],
  });

  if (!factura) return;

  // Recalcular totales
  const subtotal = factura.detalles.reduce((s, d) => s + (d.subtotal || 0), 0);
  const montoIva = factura.detalles.reduce((s, d) => s + ((d as any).montoIva || 0), 0);
  const montoInc = factura.detalles.reduce((s, d) => s + (d.montoInc || 0), 0);
  const total = subtotal + montoIva + montoInc;

  factura.subtotal = subtotal;
  factura.montoIva = montoIva;
  factura.montoInc = montoInc;
  factura.total = total;

  // Recalcular desglose por categoría
  const desgloseMonetario: Record<string, any> = {};
  for (const detalle of factura.detalles) {
    const cat = detalle.categoriaNombre || `Categoría ${detalle.categoriaServiciosId}`;
    if (!desgloseMonetario[cat]) {
      desgloseMonetario[cat] = {
        subtotal: 0,
        iva: 0,
        inc: 0,
        total: 0,
      };
    }
    desgloseMonetario[cat].subtotal += detalle.subtotal || 0;
    desgloseMonetario[cat].iva += (detalle as any).montoIva || 0;
    desgloseMonetario[cat].inc += detalle.montoInc || 0;
    desgloseMonetario[cat].total += detalle.total || 0;
  }

  factura.desgloseMonetario = desgloseMonetario;
  factura.desgloseImpuestos = desgloseMonetario;

  await this.facturaRepository.save(factura);
}
```

**ETA**: 4-6 horas  
**Owner**: FacturaService Owner

---

### Issue #5: Sincronizar Pedido Cancelado → Factura
**Severidad**: 🟠 ALTA  
**Impacto**: Si se cancela pedido, detalles quedan en factura  
**Solución**: Listener EventEmitter

```typescript
// src/servicio/services/pedido.service.ts - al cancelar:
async cancelarPedido(idPedido: number, motivo: string): Promise<Pedido> {
  const pedido = await this.pedidoRepository.findOne({ where: { id: idPedido } });
  
  // ... validaciones ...
  
  pedido.estadoPedido = 'cancelado';
  const pedidoCancelado = await this.pedidoRepository.save(pedido);
  
  // Emitir evento
  this.eventEmitter.emit('pedido.cancelado', { 
    pedidoId: idPedido, 
    motivo 
  });
  
  return pedidoCancelado;
}

// src/factura/listeners/pedido-cancelado.listener.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FacturaService } from '../factura.service';
import { DetalleFacturaRepository } from '../repositories/detalle-factura.repository';
import { ESTADOS_FACTURA } from '../../common/constants/estados.constants';

@Injectable()
export class PedidoCanceladoListener {
  constructor(
    private facturaService: FacturaService,
    private detalleRepo: DetalleFacturaRepository,
  ) {}

  @OnEvent('pedido.cancelado')
  async handlePedidoCancelado(payload: {
    pedidoId: number;
    motivo: string;
  }) {
    // 1. Buscar DetalleFactura que referencian este pedido
    const detalles = await this.detalleRepo.find({
      where: { idReferencia: payload.pedidoId },
    });

    if (detalles.length === 0) return;

    // 2. Para cada detalle, verificar estado de factura
    for (const detalle of detalles) {
      const factura = await this.facturaService.findOne(detalle.idFactura);

      // 3. Si factura está en BORRADOR/EDITABLE: remover detalle
      if (
        [ESTADOS_FACTURA.BORRADOR, ESTADOS_FACTURA.EDITABLE].includes(
          factura.estadoFactura as EstadoFactura
        )
      ) {
        await this.detalleRepo.delete(detalle.id);
        await this.facturaService.recalcularDesgloseFactura(detalle.idFactura);
      } else {
        // 4. Si factura está EMITIDA+: Log warning (no modificar histórico)
        console.warn(
          `Pedido ${payload.pedidoId} cancelado pero Factura ${detalle.idFactura} ` +
          `está en estado ${factura.estadoFactura}. No se modificó.`
        );
      }
    }
  }
}
```

**Registrar Listener en Module**:
```typescript
// src/factura/factura.module.ts
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    // ... otros
  ],
  providers: [FacturaService, IntegridadService, PedidoCanceladoListener],
})
export class FacturaModule {}
```

**ETA**: 3 horas  
**Owner**: FacturaService/ServicioService

---

### Issue #6: Historificar Tasas Tributarias
**Severidad**: 🟠 ALTA  
**Impacto**: Si tasas cambian, histórico se pierde  
**Solución**: Agregar snapshots en DetalleFactura

```sql
-- Migration
ALTER TABLE detalle_facturas
ADD COLUMN tasa_porcentaje_iva_snapshot DECIMAL(5, 2) NULL
  COMMENT 'Tasa IVA (%) aplicada al momento',
ADD COLUMN tasa_porcentaje_inc_snapshot DECIMAL(5, 2) NULL
  COMMENT 'Tasa INC (%) aplicada al momento';
```

```typescript
// En generarDesdeReserva():
for (const detalle of detalles) {
  const tax = await this.impuestoService.calculateLineaImpuestos({...});
  
  (detalle as any).montoIva = tax.iva;
  detalle.montoInc = tax.inc;
  
  // ✅ NUEVO: Guardar snapshots
  const ivaRate = tax.appliedTaxes.find((t) => t.tipoImpuesto === 'IVA');
  const incRate = tax.appliedTaxes.find((t) => t.tipoImpuesto === 'INC');
  
  (detalle as any).tasaPorcentajeIvaSnapshot = ivaRate?.tasaPorcentaje;
  (detalle as any).tasaPorcentajeIncSnapshot = incRate?.tasaPorcentaje;
  
  // ... resto del código
}
```

**ETA**: 2 horas  
**Owner**: FacturaService

---

## 🟡 P2 - MEDIA (PRÓXIMAS 4 SEMANAS)

### Issue #7-10: KPIs, Búsqueda, Exportación
**Ver archivo principal AUDIT_FACTURACION_COMPLETA.md secciones P2**

---

## 📋 Checklist de Implementación

### P0 - HOY
- [ ] Crear tabla `factura_cambios` (1h)
- [ ] Entidad TypeORM FacturaCambio (30m)
- [ ] Sincronizar PagoService (30m)
- [ ] Deploy y testing (1h)
- [ ] **Subtotal: 3 horas**

### P1 - Esta Semana
- [ ] CRUD detalles endpoints + DTOs (4-6h)
- [ ] PedidoCancelado listener (3h)
- [ ] Snapshots de tasas (2h)
- [ ] Tests integración (2h)
- [ ] **Subtotal: 11-13 horas**

### P2 - Próximas Semanas
- [ ] KPIs endpoints (4-6h)
- [ ] Búsqueda avanzada (2h)
- [ ] Exportación PDF/Excel (4h)
- [ ] **Subtotal: 10-12 horas**

---

## 🎯 Owner/Responsables

| Tarea | Owner | Duración |
|-------|-------|----------|
| Tabla + Auditoría | Backend Lead | 3h |
| CRUD detalles | FacturaService Dev | 6h |
| Listener cancelación | Arquitecto + Dev | 3h |
| KPIs | Report/Analytics Dev | 6h |

---

## ✅ Criteria de Éxito

**P0 Completado**:
- [ ] Tabla creada y migrada
- [ ] Tests pasan: auditoría graba cambios
- [ ] Tests pasan: estadoFactura sincronizado
- [ ] Cero errores en logs

**P1 Completado**:
- [ ] POST /facturas/:id/detalles funciona
- [ ] PATCH /facturas/:id/detalles/:id funciona
- [ ] DELETE /facturas/:id/detalles/:id funciona
- [ ] Pedidos cancelados remueven detalles en BORRADOR/EDITABLE
- [ ] Tests integración pasan

**P2 Completado**:
- [ ] KPI endpoints retornan datos correctos
- [ ] Exportación PDF genera documentos válidos
- [ ] Búsqueda avanzada filtra correctamente

---

**Documento preparado para ejecución inmediata**

Version: 1.0  
Última actualización: 5 Apr 2026 UTC
