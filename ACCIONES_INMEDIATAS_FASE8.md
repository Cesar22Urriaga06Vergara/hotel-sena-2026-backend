# PLAN DE IMPLEMENTACIÓN: Integración Servicios/Pedidos-Facturación - FASE 8

**Preparado:** 5 de abril de 2026  
**Prioridad:** CRÍTICA  
**Esfuerzo Estimado:** 80 horas (2 semanas)  
**Equipo:** 1-2 backend engineers  

---

## ESTRUCTURA DEL PLAN

```
100%
├─ P0 (BLOQUEANTE): 45%
│  ├─ MySQL Migrations (10%)
│  ├─ Entity Updates (15%)
│  └─ Core Services (20%)
│
├─ P1 (IMPORTANTE): 40%
│  ├─ API Endpoints (15%)
│  ├─ DTOs & Validación (10%)
│  └─ Tests & Docs (15%)
│
└─ P2 (DESEABLE): 15%
   ├─ Frontend Integration (10%)
   └─ Performance (5%)
```

---

## FASE 8.1: PREPARACIÓN (2 horas)

### 8.1.1 Crear branch de desarrollo

```bash
git checkout -b feature/fase8-integracion-servicios-facturacion
git pull origin main

# Crear entorno de staging
docker-compose -f docker-compose.dev.yml up
```

### 8.1.2 Backup de base de datos actual

```bash
# Backup completo antes de migrations
mysqldump -u root -p Hotel_Sena_2026 > backups/pre-fase8.sql

# Crear rama de DB
mysql -u root -p Hotel_Sena_2026 < backups/pre-fase8.sql RENAME_TO Hotel_Sena_2026_BACKUP
```

### 8.1.3 Habilitar logging detallado

```typescript
// env.development
LOG_LEVEL=debug
ENABLE_QUERY_LOG=true
ENABLE_TYPEORM_LOG=true
AUDIT_DETAILS=verbose
```

---

## FASE 8.2: MIGRACIONES SQL (P0) - 8 horas

### 8.2.1 Migration: Agregar FK explícita a Pedido

**Archivo:** `scripts/migrations/YYYY-MM-DD-fase8-1-add-pedido-fk.sql`

```sql
-- =====================================================
-- FASE 8.1: Agregar FK a Pedido en DetalleFactura
-- =====================================================

-- Step 1: Agregar columnas nuevas (nullable primero)
ALTER TABLE detalle_facturas 
ADD COLUMN id_pedido INT NULL,
ADD COLUMN tipo_referencia VARCHAR(50) DEFAULT 'CARGO_MANUAL';

-- Step 2: Migrar datos existentes: identificar pedido del idReferencia
-- idReferencia apunta a PedidoItem.id, así que:
UPDATE detalle_facturas df
SET id_pedido = (
  SELECT pi.id_pedido 
  FROM pedido_items pi 
  WHERE pi.id = df.id_referencia 
  AND df.tipo_concepto = 'servicio'
)
WHERE df.tipo_concepto = 'servicio' AND df.id_referencia IS NOT NULL;

-- Step 3: Marcar existentes como PEDIDO_ITEM
UPDATE detalle_facturas 
SET tipo_referencia = 'PEDIDO_ITEM' 
WHERE tipo_concepto = 'servicio' AND id_referencia IS NOT NULL;

UPDATE detalle_facturas 
SET tipo_referencia = 'HABITACION' 
WHERE tipo_concepto = 'habitacion';

UPDATE detalle_facturas 
SET tipo_referencia = 'DESCUENTO' 
WHERE tipo_concepto = 'descuento';

-- Step 4: Agregar constraint after validating data
ALTER TABLE detalle_facturas 
ADD CONSTRAINT fk_detalle_pedido 
FOREIGN KEY (id_pedido) 
REFERENCES pedidos(id) 
ON DELETE RESTRICT;

-- Step 5: Agregar índice para búsquedas frecuentes
CREATE INDEX idx_detalle_pedido ON detalle_facturas(id_pedido);
CREATE INDEX idx_detalle_tipo_ref ON detalle_facturas(tipo_referencia);

-- Validación
SELECT COUNT(*) total, COUNT(id_pedido) con_pedido 
FROM detalle_facturas 
WHERE tipo_referencia = 'PEDIDO_ITEM';
-- Ambos deben ser iguales
```

**Prueba en dev:**
```bash
mysql -u root -p Hotel_Sena_2026_DEV < scripts/migrations/YYYY-MM-DD-fase8-1-add-pedido-fk.sql

# Validar
mysql -u root -p -e "
  SELECT COUNT(*) as total, COUNT(id_pedido) as con_pedido 
  FROM Hotel_Sena_2026_DEV.detalle_facturas 
  WHERE tipo_referencia = 'PEDIDO_ITEM';
"
```

### 8.2.2 Migration: Agregar estado y auditoría a DetalleFactura

**Archivo:** `scripts/migrations/YYYY-MM-DD-fase8-2-add-estado-auditoria.sql`

```sql
-- =====================================================
-- FASE 8.2: Agregar estado y campos de auditoría
-- =====================================================

ALTER TABLE detalle_facturas 
ADD COLUMN estado ENUM(
  'PENDIENTE',
  'ENTREGADO', 
  'CANCELADO',
  'AJUSTADO'
) DEFAULT 'PENDIENTE',
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
  ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN created_by INT NULL,
ADD COLUMN cancelled_at DATETIME NULL,
ADD COLUMN cancelled_by INT NULL,
ADD COLUMN cancel_reason TEXT NULL;

-- Crear tabla de auditoría de detalles
CREATE TABLE detalle_factura_cambios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_detalle_factura INT NOT NULL,
  operacion ENUM('CREADO', 'ACTUALIZADO', 'ELIMINADO') NOT NULL,
  cambios JSON,
  usuario_id INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_detalle_factura) 
    REFERENCES detalle_facturas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) 
    REFERENCES empleados(id) ON DELETE SET NULL,
    
  KEY idx_detalle (id_detalle_factura),
  KEY idx_usuario (usuario_id),
  KEY idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Migrations: Establecer created_by con usuario actual si no existe
-- En producción, esto debe ser manual o automático según auditoría existente

-- Validación
DESCRIBE detalle_facturas;
SHOW CREATE TABLE detalle_factura_cambios;
```

### 8.2.3 Test de migrations

```bash
# Crear DB de test
mysql -u root -p -e "CREATE DATABASE Hotel_Sena_2026_TEST;"

# Restaurar de backup pre-fase8
mysql -u root -p Hotel_Sena_2026_TEST < backups/pre-fase8.sql

# Aplicar nuevas migrations
mysql -u root -p Hotel_Sena_2026_TEST < scripts/migrations/YYYY-MM-DD-fase8-1-add-pedido-fk.sql
mysql -u root -p Hotel_Sena_2026_TEST < scripts/migrations/YYYY-MM-DD-fase8-2-add-estado-auditoria.sql

# Validar integridad
mysql -u root -p -e "
  SELECT 
    COUNT(*) as total_detalles,
    COUNT(DISTINCT id_factura) as facturas,
    SUM(CASE WHEN id_pedido IS NOT NULL THEN 1 ELSE 0 END) as con_pedido
  FROM Hotel_Sena_2026_TEST.detalle_facturas;
"

# Esperado: todos con id_pedido si tipo_referencia = PEDIDO_ITEM
```

---

## FASE 8.3: ACTUALIZACIÓN DE ENTIDADES (P0) - 8 horas

### 8.3.1 Actualizar DetalleFactura.entity.ts

**Archivo:** `src/factura/entities/detalle-factura.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Factura } from './factura.entity';
import { Pedido } from '../servicio/entities/pedido.entity';  // ✅ NUEVO

@Entity('detalle_facturas')
@Index(['idFactura'])
@Index(['idPedido'])  // ✅ NUEVO
@Index(['tipoReferencia'])  // ✅ NUEVO
@Index(['estado'])  // ✅ NUEVO
export class DetalleFactura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_factura' })
  idFactura: number;

  @ManyToOne(() => Factura, (f) => f.detalles)
  @JoinColumn({ name: 'id_factura' })
  factura: Factura;

  @Column({ name: 'id_pedido', nullable: true })  // ✅ NUEVO
  idPedido?: number;

  @ManyToOne(() => Pedido, { onDelete: 'RESTRICT' })  // ✅ NUEVO
  @JoinColumn({ name: 'id_pedido' })
  pedido?: Pedido;

  @Column({
    name: 'tipo_referencia',
    type: 'enum',
    enum: ['PEDIDO_ITEM', 'HABITACION', 'CARGO_MANUAL', 'DESCUENTO', 'AJUSTE'],
    default: 'CARGO_MANUAL',
  })  // ✅ NUEVO
  tipoReferencia: string;

  @Column({ name: 'tipo_concepto' })
  tipoConcepto: string;

  @Column()
  descripcion: string;

  @Column({ name: 'id_referencia', nullable: true })
  idReferencia: number;

  @Column({ name: 'categoria_servicios_id', nullable: true })
  categoriaServiciosId?: number;

  @Column({ name: 'categoria_nombre', nullable: true })
  categoriaNombre?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 12, scale: 2 })
  precioUnitario: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ name: 'monto_iva', type: 'decimal', precision: 12, scale: 2, default: 0 })
  montoIva: number;

  @Column({ name: 'porcentaje_inc', type: 'decimal', precision: 5, scale: 2, nullable: true })
  porcentajeInc?: number;

  @Column({ name: 'monto_inc', type: 'decimal', precision: 12, scale: 2, default: 0 })
  montoInc: number;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ['PENDIENTE', 'ENTREGADO', 'CANCELADO', 'AJUSTADO'],
    default: 'PENDIENTE',
  })  // ✅ NUEVO
  estado: string;

  @CreateDateColumn({ name: 'created_at' })  // ✅ NUEVO
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })  // ✅ NUEVO
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })  // ✅ NUEVO
  createdBy?: number;

  @Column({ name: 'cancelled_at', nullable: true })  // ✅ NUEVO
  cancelledAt?: Date;

  @Column({ name: 'cancelled_by', nullable: true })  // ✅ NUEVO
  cancelledBy?: number;

  @Column({ name: 'cancel_reason', nullable: true, type: 'text' })  // ✅ NUEVO
  cancelReason?: string;
}
```

### 8.3.2 Crear entidad DetalleFacturaCambio (auditoría)

**Archivo:** `src/factura/entities/detalle-factura-cambio.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DetalleFactura } from './detalle-factura.entity';

/**
 * FASE 8: Auditoría de cambios en detalles de factura
 * Registra cada operación: CREADO, ACTUALIZADO, ELIMINADO
 */
@Entity('detalle_factura_cambios')
@Index(['idDetalleFactura'])
@Index(['timestamp'])
@Index(['usuarioId'])
@Index('idx_detalle_timestamp', ['idDetalleFactura', 'timestamp'])
export class DetalleFacturaCambio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_detalle_factura' })
  idDetalleFactura: number;

  @ManyToOne(() => DetalleFactura, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'id_detalle_factura' })
  detalle?: DetalleFactura;

  @Column({
    name: 'operacion',
    type: 'enum',
    enum: ['CREADO', 'ACTUALIZADO', 'ELIMINADO'],
  })
  operacion: string;

  @Column({ name: 'cambios', type: 'json', nullable: true })
  cambios: Record<string, any>;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: number;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;
}
```

**Agregar a `src/factura/entities/index.ts`:**
```typescript
export { DetalleFactura } from './detalle-factura.entity';
export { DetalleFacturaCambio } from './detalle-factura-cambio.entity';  // ✅ NUEVO
export { Factura } from './factura.entity';
export { FacturaCambio } from './factura-cambio.entity';
```

---

## FASE 8.4: ACTUALIZAR SERVICIOS (P0) - 15 horas

### 8.4.1 Extender FacturaService

**Archivo:** `src/factura/factura.service.ts`

Agregar métodos CRUD para detalles:

```typescript
@Injectable()
export class FacturaService {
  // ... constructor existente ...

  //════════════════════════════════════════════════════════
  // NUEVOS MÉTODOS: Gestión de Detalles (FASE 8)
  //════════════════════════════════════════════════════════

  /**
   * Listar detalles de una factura
   * GET /facturas/:id/detalles
   */
  async listarDetalles(idFactura: number): Promise<DetalleFactura[]> {
    const factura = await this.findOne(idFactura);
    if (!factura) {
      throw new NotFoundException(`Factura ${idFactura} no encontrada`);
    }

    return await this.detalleFacturaRepository.find({
      where: { idFactura },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Agregar detalle a factura existente
   * POST /facturas/:id/detalles
   *
   * Solo permitido en estados BORRADOR y EDITABLE
   * Recalcula automáticamente totales e impuestos
   */
  async agregarDetalle(
    idFactura: number,
    dto: CreateDetalleFacturaDto,
    usuarioId?: number,
  ): Promise<DetalleFactura> {
    const factura = await this.findOne(idFactura);

    // Validar estado
    const estadosEditables = [ESTADOS_FACTURA.BORRADOR, ESTADOS_FACTURA.EDITABLE];
    if (!estadosEditables.includes(factura.estadoFactura as any)) {
      throw new BadRequestException(
        `No se pueden agregar detalles a factura en estado ${factura.estadoFactura}`,
      );
    }

    // Crear detalle
    const detalle = this.detalleFacturaRepository.create({
      idFactura,
      tipoConcepto: dto.tipoConcepto,
      tipoReferencia: dto.tipoReferencia || 'CARGO_MANUAL',
      descripcion: dto.descripcion,
      idReferencia: dto.idReferencia,
      categoriaServiciosId: dto.categoriaServiciosId,
      categoriaNombre: dto.categoriaNombre,
      cantidad: dto.cantidad,
      precioUnitario: dto.precioUnitario,
      subtotal: dto.cantidad * dto.precioUnitario,
      descuento: dto.descuento || 0,
      createdBy: usuarioId,
    });

    // Calcular impuestos si categoría especificada
    if (dto.categoriaServiciosId) {
      const tax = await this.impuestoService.calculateLineaImpuestos({
        subtotal: detalle.subtotal,
        categoriaServiciosId: dto.categoriaServiciosId,
        hotelId: factura.idHotel,
        taxProfile: 'RESIDENT', // TODO: obtener del cliente
      });
      detalle.montoIva = tax.iva;
      detalle.montoInc = tax.inc;
      detalle.porcentajeInc = tax.appliedTaxes
        .find((t) => t.tipoImpuesto === 'INC')
        ?.tasaPorcentaje;
    }

    detalle.total = detalle.subtotal + detalle.montoIva + detalle.montoInc;

    const detalleGuardado = await this.detalleFacturaRepository.save(detalle);

    // Registrar en auditoría
    try {
      await this.registrarCambioDetalle(
        detalleGuardado.id,
        'CREADO',
        { descripcion: detalleGuardado.descripcion, subtotal: detalleGuardado.subtotal },
        usuarioId,
      );
    } catch (error) {
      console.warn('Error registrando auditoría de detalle:', error);
    }

    // Recalcular factura
    await this.recalcularImpuestos(idFactura);

    return detalleGuardado;
  }

  /**
   * Actualizar detalle existente
   * PUT /facturas/:id/detalles/:detalleId
   *
   * Solo permitido en BORRADOR y EDITABLE
   * Recalcula impuestos automáticamente
   */
  async actualizarDetalle(
    idDetalleFactura: number,
    dto: UpdateDetalleFacturaDto,
    usuarioId?: number,
  ): Promise<DetalleFactura> {
    const detalle = await this.detalleFacturaRepository.findOne({
      where: { id: idDetalleFactura },
      relations: ['factura'],
    });

    if (!detalle) {
      throw new NotFoundException(`Detalle ${idDetalleFactura} no encontrado`);
    }

    // Validar estado de factura
    const factura = detalle.factura;
    const estadosEditables = [ESTADOS_FACTURA.BORRADOR, ESTADOS_FACTURA.EDITABLE];
    if (!estadosEditables.includes(factura.estadoFactura as any)) {
      throw new BadRequestException(
        `No se pueden editar detalles de factura ${factura.estadoFactura}`,
      );
    }

    // Registrar cambios anterior
    const cambiosRegistrados: any = {};
    const estadoAnterior = { ...detalle };

    // Permitir actualizar cantidad, precio, descripción
    if (dto.cantidad !== undefined && dto.cantidad !== detalle.cantidad) {
      cambiosRegistrados.cantidad = { anterior: detalle.cantidad, nuevo: dto.cantidad };
      detalle.cantidad = dto.cantidad;
    }

    if (
      dto.precioUnitario !== undefined &&
      dto.precioUnitario !== detalle.precioUnitario
    ) {
      cambiosRegistrados.precioUnitario = {
        anterior: detalle.precioUnitario,
        nuevo: dto.precioUnitario,
      };
      detalle.precioUnitario = dto.precioUnitario;
    }

    if (dto.descripcion !== undefined && dto.descripcion !== detalle.descripcion) {
      cambiosRegistrados.descripcion = {
        anterior: detalle.descripcion,
        nuevo: dto.descripcion,
      };
      detalle.descripcion = dto.descripcion;
    }

    // Recalcular subtotal y totales
    detalle.subtotal = detalle.cantidad * detalle.precioUnitario;
    if (dto.descuento !== undefined) {
      cambiosRegistrados.descuento = {
        anterior: detalle.descuento,
        nuevo: dto.descuento,
      };
      detalle.descuento = dto.descuento;
    }

    // Recalcular impuestos
    if (detalle.categoriaServiciosId) {
      const tax = await this.impuestoService.calculateLineaImpuestos({
        subtotal: detalle.subtotal,
        categoriaServiciosId: detalle.categoriaServiciosId,
        hotelId: factura.idHotel,
        taxProfile: 'RESIDENT',
      });
      detalle.montoIva = tax.iva;
      detalle.montoInc = tax.inc;
    }

    detalle.total = detalle.subtotal + detalle.montoIva + detalle.montoInc;
    detalle.estado = 'AJUSTADO';

    const detalleActualizado = await this.detalleFacturaRepository.save(detalle);

    // Auditoría
    if (Object.keys(cambiosRegistrados).length > 0) {
      try {
        await this.registrarCambioDetalle(
          idDetalleFactura,
          'ACTUALIZADO',
          cambiosRegistrados,
          usuarioId,
        );
      } catch (error) {
        console.warn('Error registrando auditoría:', error);
      }

      // Recalcular factura
      await this.recalcularImpuestos(factura.id);
    }

    return detalleActualizado;
  }

  /**
   * Eliminar detalle de factura
   * DELETE /facturas/:id/detalles/:detalleId
   */
  async eliminarDetalle(
    idDetalleFactura: number,
    motivo?: string,
    usuarioId?: number,
  ): Promise<void> {
    const detalle = await this.detalleFacturaRepository.findOne({
      where: { id: idDetalleFactura },
      relations: ['factura'],
    });

    if (!detalle) {
      throw new NotFoundException(`Detalle ${idDetalleFactura} no encontrado`);
    }

    const factura = detalle.factura;

    // Validar estado
    const estadosEditables = [ESTADOS_FACTURA.BORRADOR, ESTADOS_FACTURA.EDITABLE];
    if (!estadosEditables.includes(factura.estadoFactura as any)) {
      throw new BadRequestException(
        `No se pueden eliminar detalles de factura ${factura.estadoFactura}`,
      );
    }

    // Soft delete
    detalle.estado = 'CANCELADO';
    detalle.cancelledAt = new Date();
    detalle.cancelledBy = usuarioId;
    detalle.cancelReason = motivo;

    await this.detalleFacturaRepository.save(detalle);

    // Auditoría
    try {
      await this.registrarCambioDetalle(
        idDetalleFactura,
        'ELIMINADO',
        { motivo, cancelledBy: usuarioId },
        usuarioId,
      );
    } catch (error) {
      console.warn('Error en auditoría:', error);
    }

    // Recalcular
    await this.recalcularImpuestos(factura.id);
  }

  /**
   * Registrar cambio en DetalleFacturaCambio
   * Método privado para auditoría
   */
  private async registrarCambioDetalle(
    idDetalleFactura: number,
    operacion: 'CREADO' | 'ACTUALIZADO' | 'ELIMINADO',
    cambios: any,
    usuarioId?: number,
  ): Promise<void> {
    try {
      const DetalleFacturaCambioRepo = this.dataSource.getRepository(
        'DetalleFacturaCambio',
      );
      await DetalleFacturaCambioRepo.save({
        idDetalleFactura,
        operacion,
        cambios: JSON.stringify(cambios),
        usuarioId,
        timestamp: new Date(),
      });
    } catch (error) {
      console.warn('Error registrando cambio:', error);
      // No bloquea operación
    }
  }

  /**
   * Recalcular impuestos y totales de factura
   * Se invoca automáticamente después de agregar/editar/eliminar detalles
   */
  private async recalcularImpuestos(idFactura: number): Promise<void> {
    const factura = await this.findOne(idFactura);
    if (!factura) return;

    const detalles = await this.detalleFacturaRepository.find({
      where: { idFactura, estado: 'PENDIENTE' },  // Excluir cancelados
    });

    let subtotalNuevo = 0;
    let montoIvaNuevo = 0;
    let montoIncNuevo = 0;
    const nuevoDesglose: Record<string, any> = {};

    for (const detalle of detalles) {
      subtotalNuevo += Number(detalle.subtotal || 0);
      montoIvaNuevo += Number(detalle.montoIva || 0);
      montoIncNuevo += Number(detalle.montoInc || 0);

      const nombreCat = detalle.categoriaNombre || `Categoría ${detalle.categoriaServiciosId}`;
      if (!nuevoDesglose[nombreCat]) {
        nuevoDesglose[nombreCat] = { subtotal: 0, iva: 0, inc: 0, total: 0 };
      }
      nuevoDesglose[nombreCat].subtotal += Number(detalle.subtotal || 0);
      nuevoDesglose[nombreCat].iva += Number(detalle.montoIva || 0);
      nuevoDesglose[nombreCat].inc += Number(detalle.montoInc || 0);
      nuevoDesglose[nombreCat].total =
        nuevoDesglose[nombreCat].subtotal +
        nuevoDesglose[nombreCat].iva +
        nuevoDesglose[nombreCat].inc;
    }

    factura.subtotal = subtotalNuevo;
    factura.montoIva = montoIvaNuevo;
    factura.montoInc = montoIncNuevo;
    factura.total = subtotalNuevo + montoIvaNuevo + montoIncNuevo;
    factura.desgloseMonetario = nuevoDesglose;

    await this.facturaRepository.save(factura);
  }

  // ... resto de métodos existentes ...
}
```

### 8.4.2 Extender ServicioService: Listener de Cambios de Pedido

**Archivo:** `src/servicio/servicio.service.ts`

Agregar `agregarPedidoAFacturaExistente()` para integración:

```typescript
@Injectable()
export class ServicioService {
  // ... constructor ...

  /**
   * Agregar pedido completo a una factura existente
   * Se invoca cuando se detecta que un Pedido se entregó
   * y la factura correspondiente existe
   */
  async agregarPedidoAFacturaExistente(
    pedido: Pedido,
    factura: any,  // FacturaService
    usuarioId?: number,
  ): Promise<void> {
    try {
      // Para cada item del pedido, agregar como detalle
      for (const item of pedido.items) {
        const servicio = await this.servicioRepository.findOne({
          where: { id: item.idServicio },
        });

        if (!servicio) continue;

        await factura.agregarDetalle(
          factura.id,
          {
            tipoConcepto: 'servicio',
            tipoReferencia: 'PEDIDO_ITEM',
            descripcion: `${item.nombreServicioSnapshot} (Pedido #${pedido.id})`,
            idReferencia: item.id,
            categoriaServiciosId: servicio.idCategoriaServicios,
            categoriaNombre: servicio.categoria,
            cantidad: item.cantidad,
            precioUnitario: Number(item.precioUnitarioSnapshot),
            descuento: 0,
          },
          usuarioId,
        );
      }

      console.log(`[PEDIDO] Agregados ${pedido.items.length} items a Factura #${factura.id}`);
    } catch (error) {
      console.error(`[PEDIDO] Error al agregar pedido a factura:`, error);
      // No bloquea cambio de estado
    }
  }
}
```

---

## FASE 8.5: DTOs Y VALIDACIÓN (P1) - 6 horas

### 8.5.1 Crear CreateDetalleFacturaDto

**Archivo:** `src/factura/dto/create-detalle-factura.dto.ts`

```typescript
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDetalleFacturaDto {
  @ApiProperty({
    example: 'servicio',
    enum: ['habitacion', 'servicio', 'descuento', 'cargo_adicional'],
    description: 'Tipo de concepto para la factura',
  })
  @IsEnum(['habitacion', 'servicio', 'descuento', 'cargo_adicional'])
  @IsNotEmpty()
  tipoConcepto: string;

  @ApiPropertyOptional({
    example: 'PEDIDO_ITEM',
    enum: ['PEDIDO_ITEM', 'HABITACION', 'CARGO_MANUAL', 'DESCUENTO', 'AJUSTE'],
    description: 'Clasificación de la referencia',
    default: 'CARGO_MANUAL',
  })
  @IsEnum(['PEDIDO_ITEM', 'HABITACION', 'CARGO_MANUAL', 'DESCUENTO', 'AJUSTE'])
  @IsOptional()
  tipoReferencia?: string;

  @ApiProperty({
    example: 'Café Americano',
    description: 'Descripción legible del detalle',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  descripcion: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'ID del recurso de origen (PedidoItem, Servicio, etc.)',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  idReferencia?: number;

  @ApiPropertyOptional({
    example: 7,
    description: 'ID de la categoría de servicio (para cálculo de impuestos)',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  categoriaServiciosId?: number;

  @ApiPropertyOptional({
    example: 'BEBIDAS',
    description: 'Nombre de la categoría (desnormalizado para histórico)',
  })
  @IsString()
  @IsOptional()
  categoriaNombre?: string;

  @ApiProperty({
    example: 2,
    description: 'Cantidad del item',
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  cantidad: number;

  @ApiProperty({
    example: 15000,
    description: 'Precio unitario',
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  precioUnitario: number;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Descuento a aplicar',
    default: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  descuento?: number;
}
```

### 8.5.2 Crear UpdateDetalleFacturaDto

**Archivo:** `src/factura/dto/update-detalle-factura.dto.ts`

```typescript
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDetalleFacturaDto {
  @ApiPropertyOptional({
    example: 'Café Americano (ajustado)',
    description: 'Nueva descripción',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Nueva cantidad',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  cantidad?: number;

  @ApiPropertyOptional({
    example: 20000,
    description: 'Nuevo precio unitario',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  precioUnitario?: number;

  @ApiPropertyOptional({
    example: 10000,
    description: 'Nuevo descuento',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  descuento?: number;
}
```

---

## FASE 8.6: AGREGAR ENDPOINTS (P1) - 10 horas

### 8.6.1 Extender FacturaController

**Archivo:** `src/factura/factura.controller.ts`

```typescript
// Agregar al final de la clase:

/**
 * GET /facturas/:id/detalles
 * Listar todos los detalles de una factura
 */
@Get(':id/detalles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('recepcionista', 'admin', 'superadmin', 'cliente')
@ApiBearerAuth()
@ApiOperation({ summary: 'Listar detalles de una factura' })
@ApiParam({ name: 'id', type: Number })
@ApiResponse({ status: 200, description: 'Detalles obtenidos', type: [DetalleFactura] })
@ApiResponse({ status: 404, description: 'Factura no encontrada' })
async listarDetalles(
  @Param('id', ParseIntPipe) id: number,
  @Request() req: any,
): Promise<DetalleFactura[]> {
  const factura = await this.facturaService.findOne(id);

  // Validar acceso (cliente solo su factura)
  if (req.user.rol === 'cliente' && factura.idCliente !== req.user.idCliente) {
    throw new ForbiddenException('No tiene autorización');
  }

  return await this.facturaService.listarDetalles(id);
}

/**
 * POST /facturas/:id/detalles
 * Agregar detalle a factura existente (BORRADOR|EDITABLE)
 */
@Post(':id/detalles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Agregar detalle a factura' })
@ApiParam({ name: 'id', type: Number })
@ApiResponse({ status: 201, description: 'Detalle agregado', type: DetalleFactura })
@ApiResponse({ status: 400, description: 'Estado de factura no permite edición' })
@ApiResponse({ status: 404, description: 'Factura no encontrada' })
async agregarDetalle(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: CreateDetalleFacturaDto,
  @Request() req: any,
): Promise<DetalleFactura> {
  return await this.facturaService.agregarDetalle(id, dto, req.user.id);
}

/**
 * PUT /facturas/:id/detalles/:detalleId
 * Actualizar detalle existente
 */
@Put(':id/detalles/:detalleId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Actualizar detalle de factura' })
@ApiParam({ name: 'id', type: Number })
@ApiParam({ name: 'detalleId', type: Number })
@ApiResponse({ status: 200, description: 'Detalle actualizado' })
@ApiResponse({ status: 400, description: 'No se puede editar este estado' })
@ApiResponse({ status: 404, description: 'Detalle no encontrado' })
async actualizarDetalle(
  @Param('id', ParseIntPipe) id: number,
  @Param('detalleId', ParseIntPipe) detalleId: number,
  @Body() dto: UpdateDetalleFacturaDto,
  @Request() req: any,
): Promise<DetalleFactura> {
  return await this.facturaService.actualizarDetalle(detalleId, dto, req.user.id);
}

/**
 * DELETE /facturas/:id/detalles/:detalleId
 * Eliminar (soft-delete) detalle de factura
 */
@Delete(':id/detalles/:detalleId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Eliminar detalle de factura' })
@ApiParam({ name: 'id', type: Number })
@ApiParam({ name: 'detalleId', type: Number })
@ApiResponse({ status: 204, description: 'Detalle eliminado' })
@ApiResponse({ status: 400, description: 'No se puede eliminar este detalle' })
@ApiResponse({ status: 404, description: 'Detalle no encontrado' })
async eliminarDetalle(
  @Param('id', ParseIntPipe) id: number,
  @Param('detalleId', ParseIntPipe) detalleId: number,
  @Body() body: { motivo?: string },
  @Request() req: any,
): Promise<{ mensaje: string }> {
  await this.facturaService.eliminarDetalle(detalleId, body.motivo, req.user.id);
  return { mensaje: 'Detalle eliminado correctamente' };
}
```

---

## FASE 8.7: TESTS (P1) - 12 horas

### 8.7.1 Test: CreateDetalleFacturaDto

**Archivo:** `src/factura/dto/create-detalle-factura.dto.spec.ts`

```typescript
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateDetalleFacturaDto } from './create-detalle-factura.dto';

describe('CreateDetalleFacturaDto', () => {
  it('debe validar DTO correcto', async () => {
    const dto = plainToClass(CreateDetalleFacturaDto, {
      tipoConcepto: 'servicio',
      tipoReferencia: 'PEDIDO_ITEM',
      descripcion: 'Café Americano',
      cantidad: 2,
      precioUnitario: 15000,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('debe rechazar cantidad negativa', async () => {
    const dto = plainToClass(CreateDetalleFacturaDto, {
      tipoConcepto: 'servicio',
      descripcion: 'Café',
      cantidad: -1,
      precioUnitario: 15000,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('cantidad');
  });

  it('debe rechazar descripción corta', async () => {
    const dto = plainToClass(CreateDetalleFacturaDto, {
      tipoConcepto: 'servicio',
      descripcion: 'XY',  // < 3 caracteres
      cantidad: 1,
      precioUnitario: 15000,
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'descripcion')).toBe(true);
  });
});
```

### 8.7.2 Test: FacturaService.agregarDetalle()

**Archivo:** `src/factura/factura.service.spec.ts`

```typescript
describe('FacturaService - Detalles (FASE 8)', () => {
  let service: FacturaService;
  let detalleRepository: Repository<DetalleFactura>;

  beforeEach(async () => {
    // Setup...
  });

  describe('agregarDetalle', () => {
    it('debe agregar detalle a factura BORRADOR', async () => {
      const factura = await crearFacturaBorrador();
      const dto = new CreateDetalleFacturaDto();
      dto.tipoConcepto = 'servicio';
      dto.descripcion = 'Café';
      dto.cantidad = 1;
      dto.precioUnitario = 15000;

      const detalle = await service.agregarDetalle(factura.id, dto, 1);

      expect(detalle.id).toBeDefined();
      expect(detalle.idFactura).toBe(factura.id);
      expect(detalle.estado).toBe('PENDIENTE');
    });

    it('debe rechazar agregar a factura EMITIDA', async () => {
      const factura = await crearFacturaEmitida();
      const dto = new CreateDetalleFacturaDto();
      // ...

      await expect(service.agregarDetalle(factura.id, dto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe recalcular impuestos', async () => {
      // ...
      // Verificar que factura.montoIva se actualiza
      // Verificar que desgloseMonetario se actualiza
    });
  });

  describe('actualizarDetalle', () => {
    it('debe actualizar cantidad en BORRADOR', async () => {
      // ...
      const actualizado = await service.actualizarDetalle(detalle.id, {
        cantidad: 2,
      }, 1);

      expect(actualizado.cantidad).toBe(2);
      expect(actualizado.subtotal).toBe(30000);  // 2 × 15000
      expect(actualizado.estado).toBe('AJUSTADO');
    });

    it('debe marcar como AJUSTADO', async () => {
      // ...
      const dto = new UpdateDetalleFacturaDto();
      dto.cantidad = 5;

      const resultado = await service.actualizarDetalle(detalle.id, dto, 1);
      expect(resultado.estado).toBe('AJUSTADO');
    });
  });

  describe('eliminarDetalle', () => {
    it('debe soft-delete detalle', async () => {
      // ...
      await service.eliminarDetalle(detalle.id, 'Pedido cancelado', 1);

      const eliminado = await detalleRepository.findOne({ where: { id: detalle.id } });
      expect(eliminado.estado).toBe('CANCELADO');
      expect(eliminado.cancelledAt).toBeDefined();
    });

    it('debe recalcular totales al eliminar', async () => {
      // Suma inicial: 100000
      // Elimina detalle de 30000
      // Nuevo total: 70000 + impuestos
    });
  });

  describe('recalcularImpuestos', () => {
    it('debe sumar solo detalles PENDIENTE', async () => {
      // Agregar 3 detalles
      // Eliminar (CANCELAR) 1
      // Verificar que total = solo los 2 pendientes
    });
  });
});
```

---

## FASE 8.8: DOCUMENTACIÓN (P1) - 5 horas

### 8.8.1 Actualizar README.md

Agregar sección:

```markdown
## FASE 8: Integración Servicios/Pedidos-Facturación

### Nuevas Capacidades

1. **Gestión flexible de detalles a posteriori**
   - Agregar servicio olvidado después de emitir (si está en BORRADOR|EDITABLE)
   - Editar cantidad/precio para correcciones
   - Eliminar detalle si fue error

2. **API CRUD completa para DetalleFactura**
   - `GET /facturas/:id/detalles` - Listar
   - `POST /facturas/:id/detalles` - Crear
   - `PUT /facturas/:id/detalles/:detalleId` - Actualizar
   - `DELETE /facturas/:id/detalles/:detalleId` - Eliminar

3. **Auditoría automática de cambios**
   - Tabla `detalle_factura_cambios` registra cada operación
   - Cálculo automático de impuestos por línea
   - Recalculación de totales factura

### Flujo de Uso

```typescript
// 1. Generar factura desde reserva (existente)
POST /facturas/generar/42
// Crea factura con detalles de habitación + pedidos:entregado

// 2. Si se olvidó un servicio, agregarlo
POST /facturas/501/detalles
{
  "tipoConcepto": "servicio",
  "descripcion": "Té verde (Pedido faltante)",
  "cantidad": 1,
  "precioUnitario": 8000,
  "categoriaServiciosId": 5
}
// Factura recalculada automáticamente

// 3. Si hay error, eliminar o editar
PUT /facturas/501/detalles/102
{ "cantidad": 2 }

DELETE /facturas/501/detalles/102
{ "motivo": "Cliente especificó otra cantidad" }

// 4. Emitir cuando todo está correcto
PATCH /facturas/501/emitir
// Estado pasa a EMITIDA, detalles se bloquean
```

### Validaciones

- Solo BORRADOR y EDITABLE permiten cambios
- EMITIDA bloquea ediciones (requiere anular y regenerar)
  
### Tamaños de Transacción

- Cada operación es una transacción ACID
- Recalculación de impuestos es atómica
- Fallos no dejan datos inconsistentes
```

### 8.8.2 Crear guía de troubleshooting

**Archivo:** `docs/FASE8_TROUBLESHOOTING.md`

```markdown
# Troubleshooting - FASE 8

## Problema: "No se puede agregar detalle a factura EMITIDA"

**Causa:** La factura ya fue emitida, estado = EMITIDA

**Solución:**
1. Si es error, debe anular factura con `PATCH /facturas/:id/anular`
2. Regenerar con `POST /facturas/generar/:idReserva`
3. Editar detalles antes de emitir

## Problema: "Montos no coinciden después de agregar detalle"

**Causa:** Detalles CANCELADOS o PENDIENTE se computan diferente

**Validación:**
```sql
SELECT 
  SUM(subtotal) as subtotal_detalles,
  SUM(monto_iva) as iva_detalles
FROM detalle_facturas
WHERE id_factura = 501
AND estado = 'PENDIENTE';

SELECT 
  subtotal, monto_iva, total
FROM facturas
WHERE id = 501;
-- Deben coincidir
```

## Problema: "Error al recalcular impuestos"

**Causa:** Servicio sin categoría definida

**Solución:**
```sql
-- Verificar que categoriaServiciosId está en Servicios
SELECT id, nombre, id_categoria_servicios
FROM servicios
WHERE id_categoria_servicios IS NULL;

-- Si falta, setear categoría por defecto (Otros = 7)
UPDATE servicios 
SET id_categoria_servicios = 7 
WHERE id_categoria_servicios IS NULL;
```
```

---

## FASE 8.9: VALIDACIÓN Y DEPLOYMENT (P2) - 10 horas

### 8.9.1 Checklist pre-producción

```
✅ SCHEMA:
 └─ [ ] Migrations aplicadas en staging
 └─ [ ] Integridad referencial validada
 └─ [ ] Índices creados
 └─ [ ] Backups de datos antes de ALTER

✅ CÓDIGO:
 └─ [ ] Compilación sin errores (npm run build)
 └─ [ ] Linting pasa (npm run lint)
 └─ [ ] Tests unitarios pasan (npm run test)
 └─ [ ] Tests E2E pasan

✅ API:
 └─ [ ] Nuevos endpoints responden 200
 └─ [ ] Validaciones de DTO funcionan
 └─ [ ] Auditoría se registra en BD
 └─ [ ] Recalcualación de impuestos es correcta

✅ DATOS:
 └─ [ ] Migramos datos existentes sin pérdida
 └─ [ ] FK se poblaron correctamente
 └─ [ ] Estados iniciales son PENDIENTE
 └─ [ ] Tipo referencia asignado correctamente

✅ PERFORMANCE:
 └─ [ ] Consultas recalculación < 200ms
 └─ [ ] Índices no causacan lentitud en inserts
 └─ [ ] Carga en horario pico OK
```

### 8.9.2 Rollback plan

Si hay error post-deploy:

```bash
# 1. Revertir código
git revert <commit-fase8>
npm run build
docker-compose restart api

# 2. Si hay cambios en BD (CRÍTICO)
mysql -u root -p Hotel_Sena_2026 < backups/pre-fase8.sql

# 3. Validar integridad
npm run test:e2e -- --suite factura

# 4. Monitoreo
tail -f logs/app.log | grep "ERROR\|WARN"
```

---

## ESTIMACIÓN DE TIEMPO

```
Subtarea                     Horas  Acum.
────────────────────────────────────────
8.1 Preparación               2     2
8.2 Migraciones SQL           8     10
8.3 Entidades                 8     18
8.4 Servicios                 15    33
8.5 DTOs                      6     39
8.6 Endpoints                 10    49
8.7 Tests                     12    61
8.8 Documentación             5     66
8.9 Validación/Deploy         10    76

CONTINGENCIA (10%)            8     84

TOTAL: 84 horas (~2 semanas, 1 FTE)
```

---

## DEPENDENCIAS ABIERTAS

1. **¿Integración con EventEmitter?**
   - Listener cuando Pedido→ENTREGADO agrega a Factura
   - Requiere arquitectura de eventos (FASE 9 posible)

2. **¿Validación cruzada Pedido↔Factura?**
   - Si Pedido se elimina, ¿qué pasa con DetalleFactura?
   - ON DELETE RESTRICT previene, pero bloquea

3. **¿Cálculo de INC completamente integrado?**
   - Actualmente usa taxProfile='RESIDENT' hardcoded
   - Debería obtener del cliente.taxProfile

---
