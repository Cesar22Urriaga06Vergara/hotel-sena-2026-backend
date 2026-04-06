# PLAN DE ACCIÓN INMEDIATO: SERVICIOS AUXILIARES

**Fecha:** 5 de abril de 2026  
**Criticidad:** 4 items BLOQUEANTES  
**Esfuerzo Total:** ~8 horas  

---

## 🎯 4 FIXES CRÍTICOS (esta semana)

### FIX #1: Agregar `esAlcoholico` a CreateServicioDto ⏱️ 15min

**Problema:** No puedo crear servicios alcohólicos desde la API. El campo existe en BD pero no en DTO.

**Archivos:**
- `src/servicio/dto/create-servicio.dto.ts` (MODIFICAR)

**Código:**

```typescript
// ANTES:
export class CreateServicioDto {
  // ... otros campos ...
  disponibleRecogida?: boolean;
}

// DESPUÉS:
export class CreateServicioDto {
  // ... otros campos ...
  disponibleRecogida?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Indica si es bebida alcohólica' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  esAlcoholico?: boolean;
}
```

**Testing:**
```bash
POST /servicios/catalogo
{
  "idHotel": 1,
  "nombre": "Vino Tinto Premium",
  "categoria": "minibar",
  "precioUnitario": 45000,
  "esAlcoholico": true
}
```

---

### FIX #2: Crear Migration + Entity `PedidoCambios` ⏱️ 2h

**Problema:** No hay auditoría de cambios de estado en BD. Solo logs en aplicación.

**Solución:** Nueva tabla que registra cada cambio de estado.

#### Paso 1: Crear Migration

Archivo: `scripts/migrations/002_create_pedido_cambios.sql`

```sql
-- Crear tabla de auditoría de cambios en pedidos
CREATE TABLE pedido_cambios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido INT NOT NULL,
  estado_anterior ENUM('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado') NOT NULL,
  estado_nuevo ENUM('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado') NOT NULL,
  usuario_id INT,
  razon_cambio TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES empleados(id) ON DELETE SET NULL,
  
  INDEX idx_pedido (id_pedido),
  INDEX idx_timestamp (timestamp),
  INDEX idx_estado (estado_nuevo)
);
```

#### Paso 2: Crear Entity

Archivo: `src/servicio/entities/pedido-cambio.entity.ts`

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

@Entity('pedido_cambios')
@Index(['idPedido'])
@Index(['timestamp'])
export class PedidoCambio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_pedido' })
  idPedido: number;

  @Column({
    name: 'estado_anterior',
    type: 'enum',
    enum: ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'],
  })
  estadoAnterior: string;

  @Column({
    name: 'estado_nuevo',
    type: 'enum',
    enum: ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'],
  })
  estadoNuevo: string;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId: number;

  @Column({ name: 'razon_cambio', type: 'text', nullable: true })
  razonCambio: string;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne('Pedido')
  @JoinColumn({ name: 'id_pedido' })
  pedido: any;

  @ManyToOne('Empleado')
  @JoinColumn({ name: 'usuario_id' })
  usuario: any;
}
```

#### Paso 3: Integrar en Service

Archivo: `src/servicio/servicio.service.ts`

```typescript
// En constructor, agregar:
constructor(
  // ... otros repositories ...
  @InjectRepository(PedidoCambio)
  private pedidoCambioRepository: Repository<PedidoCambio>,
) {}

// En método actualizarEstadoPedido(), después de validaciones:
async actualizarEstadoPedido(
  idPedido: number,
  idEmpleado: number,
  dto: UpdateEstadoPedidoDto,
): Promise<Pedido> {
  const pedido = await this.obtenerPedido(idPedido);
  const estadoActual = pedido.estadoPedido;
  const estadoNuevo = dto.estadoPedido;

  // ... validaciones state machine ...

  // ANTES de guardar el pedido:
  if (estadoActual !== estadoNuevo) {
    await this.pedidoCambioRepository.save({
      idPedido,
      estadoAnterior: estadoActual,
      estadoNuevo: estadoNuevo,
      usuarioId: idEmpleado,
      razonCambio: dto.notaEmpleado || null,
    });
  }

  // DESPUÉS guardar pedido:
  pedido.estadoPedido = estadoNuevo;
  pedido.idEmpleadoAtiende = idEmpleado;
  if (dto.notaEmpleado) {
    pedido.notaEmpleado = dto.notaEmpleado;
  }
  await this.pedidoRepository.save(pedido);
  return await this.obtenerPedido(idPedido);
}
```

#### Paso 4: Actualizar Module

Archivo: `src/servicio/servicio.module.ts`

```typescript
import { PedidoCambio } from './entities/pedido-cambio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Servicio, 
    Pedido, 
    PedidoItem,
    PedidoCambio,  // ← AGREGAR
    Reserva, 
    Cliente
  ])],
  // ...
})
export class ServicioModule {}
```

---

### FIX #3: Agregar Timestamps de Entrega ⏱️ 1h

**Problema:** No sabemos CUÁNDO se entregó un pedido, solo que está en estado "entregado".

#### Paso 1: Alter Table

```sql
-- Migration 003:
ALTER TABLE pedidos
ADD COLUMN fecha_entrega TIMESTAMP NULL,
ADD COLUMN tiempo_estimado_minutos INT NULL,
ADD INDEX idx_fecha_entrega (fecha_entrega);
```

#### Paso 2: Actualizar Entity

Archivo: `src/servicio/entities/pedido.entity.ts`

```typescript
// Agregar al final de la Entity:
@Column({ name: 'fecha_entrega', nullable: true })
fechaEntrega?: Date;

@Column({ name: 'tiempo_estimado_minutos', nullable: true, type: 'int' })
tiempoEstimadoMinutos?: number;
```

#### Paso 3: Actualizar Service

```typescript
async actualizarEstadoPedido(
  idPedido: number,
  idEmpleado: number,
  dto: UpdateEstadoPedidoDto,
): Promise<Pedido> {
  // ... código existente ...

  // NUEVO: Registrar cuando se entrega
  if (estadoNuevo === 'entregado' && estadoActual !== 'entregado') {
    pedido.fechaEntrega = new Date();
    pedido.tiempoEstimadoMinutos = Math.round(
      (pedido.fechaEntrega.getTime() - pedido.fechaPedido.getTime()) / 60000
    );
  }

  // Guardar cambios
  await this.pedidoRepository.save(pedido);
  return await this.obtenerPedido(idPedido);
}
```

---

### FIX #4: Foreign Key en `idEmpleadoAtiende` ⏱️ 30min

**Problema:** Si se borra un empleado, quedan pedidos huérfanos sin validación.

#### Solución: Migration

```sql
-- Migration 004:
ALTER TABLE pedidos
ADD CONSTRAINT fk_pedidos_empleado_atiende
FOREIGN KEY (id_empleado_atiende)
REFERENCES empleados(id)
ON DELETE SET NULL;
```

**Resultado:** Si se borra el empleado, el campo se pone NULL pero el pedido sigue existiendo.

---

## 🔄 FLUJO DE IMPLEMENTACIÓN RECOMENDADO

```
DÍA 1 (Lunes):
├─ FIX #1: esAlcoholico en DTO (15min) ✅ Deploy
├─ Testing endpoints POST catalogo
└─ Commit: "feat: add esAlcoholico field to CreateServicioDto"

DÍA 2 (Martes):
├─ FIX #2: PedidoCambios Entity + Migration (2h)
├─ Testing GET cambios por pedido
├─ Deploy migration
└─ Commit: "feat: add audit table pedido_cambios"

DÍA 3 (Miércoles):
├─ FIX #3: Timestamps de entrega (1h)
├─ Testing reporte tiempos de entrega
├─ Deploy migration
└─ Commit: "feat: add fecha_entrega and tiempo_estimado_minutos"

DÍA 4-5 (Jueves-Viernes):
├─ FIX #4: FK constraint (30min)
├─ Testing integridad referencial
├─ Deploy migration
└─ Commit: "feat: add foreign key constraint on id_empleado_atiende"

VIERNES (Tarde):
└─ Code review + QA de los 4 fixes
```

---

## 📊 TIMELINE ESTIMADO POR FIX

| Fix | Código | Testing | Review | Deploy | Total |
|-----|--------|---------|--------|--------|-------|
| #1: esAlcoholico | 15min | 10min | 5min | 5min | **35min** |
| #2: PedidoCambios | 90min | 30min | 10min | 10min | **2h 20min** |
| #3: Timestamps | 30min | 20min | 5min | 5min | **1h** |
| #4: FK Constraint | 10min | 10min | 5min | 5min | **30min** |
| **TOTAL** | | | | | **~4h 15min** |

---

## 🧪 TESTING POR FIX

### Test FIX #1: esAlcoholico

```bash
# 1. Crear servicio alcohólico
curl -X POST http://localhost:3000/servicios/catalogo \
  -H "Authorization: Bearer $JWT_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "idHotel": 1,
    "nombre": "Whisky 18 años",
    "categoria": "minibar",
    "precioUnitario": 85000,
    "esAlcoholico": true
  }'

# 2. Verificar en BD
SELECT id, nombre, es_alcoholico FROM servicios 
WHERE nombre = "Whisky 18 años";

# 3. Crear pedido como cliente menor de edad
# → Debe fallar con "Debes ser mayor de 21 años"
```

### Test FIX #2: PedidoCambios

```bash
# 1. Crear pedido
# 2. Cambiar estado: pendiente → en_preparacion
# 3. Verificar tabla pedido_cambios
SELECT * FROM pedido_cambios 
WHERE id_pedido = 123
ORDER BY timestamp DESC;

# 4. Verificar auditoría completa
SELECT 
  pc.id,
  pc.estado_anterior,
  pc.estado_nuevo,
  pc.usuario_id,
  pc.razon_cambio,
  pc.timestamp,
  e.nombre as empleado
FROM pedido_cambios pc
LEFT JOIN empleados e ON pc.usuario_id = e.id
WHERE pc.id_pedido = 123;
```

### Test FIX #3: Timestamps

```bash
# 1. Crear pedido (registra fechaPedido)
# 2. Cambiar a en_preparacion
# 3. Cambiar a entregado (debe registrar fechaEntrega y tiempoEstimadoMinutos)
# 4. Verificar:
SELECT 
  id,
  fecha_pedido,
  fecha_entrega,
  tiempo_estimado_minutos,
  ROUND(TIMESTAMPDIFF(MINUTE, fecha_pedido, fecha_entrega), 0) as calc_minutos
FROM pedidos
WHERE id = 123;
```

### Test FIX #4: FK Constraint

```sql
-- 1. Verificar constraint existe
SHOW CREATE TABLE pedidos\G

-- 2. Intentar insertar idEmpleadoAtiende inválido (debe fallar)
INSERT INTO pedidos 
  (id_reserva, id_cliente, id_hotel, estado_pedido, categoria, id_empleado_atiende)
VALUES 
  (1, 1, 1, 'pendiente', 'cafeteria', 99999);
-- → Error: Foreign key constraint failed

-- 3. Borrar empleado (debe poner NULL)
DELETE FROM empleados WHERE id = 5;
SELECT id_empleado_atiende FROM pedidos WHERE id_empleado_atiende = 5;
-- → NULL (constraint funcionando)
```

---

## ✅ CHECKLIST DE DEPLOYMENT

- [ ] 4 Fixes implementados localmente
- [ ] Tests unitarios pasan ✅
- [ ] Tests de integración pasan ✅
- [ ] Code review aprobado
- [ ] Migration scripts probados en DB dev
- [ ] Documentación actualizada
- [ ] Changelog actualizado
- [ ] Merge a `develop` branch
- [ ] Deploy a staging
- [ ] Smoke tests en staging ✅
- [ ] Deploy a PROD
- [ ] Monitoreo de alertas por 2h

---

## 📝 COMANDOS GIT

```bash
# Feature branch
git checkout -b fix/servicios-audit-fixes

# Commits
git commit -m "fix: add esAlcoholico to CreateServicioDto"
git commit -m "feat: add PedidoCambios auditable entity"
git commit -m "feat: add fecha_entrega and tiempo timestamps"
git commit -m "feat: add FK constraint on id_empleado_atiende"

# Push
git push origin fix/servicios-audit-fixes

# Crear PR
# → Title: "Fix: Critical gaps in Servicios module - Auditing + FK + Timestamps"
# → Description: Ver documento "PLAN DE ACCIÓN.md"
```

---

## 🎯 IMPACTO POR FIX

| Fix | Impacto | Usuarios | Criticidad |
|-----|---------|----------|-----------|
| #1 | Ahora se pueden crear servicios alcohólicos | Admin | 🔴 BLOQUEANTE |
| #2 | Auditoría completa de cambios de estado | Admin/Auditor | 🔴 BLOCKEDANTE |
| #3 | Métricas de tiempo de servicio | Análisis | 🟠 ALTO |
| #4 | Integridad referencial garantizada | DB | 🔴 CRÍTICO |

---

## 💡 NOTAS IMPORTANTES

1. **Cada migration debe ser idempotente** (se puede aplicar 2 veces sin error)
2. **Test en dev primero**, luego staging, luego PROD
3. **Backups automáticos** antes de cada deploy
4. **Rollback plan:** Las migrations tienen `.js` y `.rollback` o versión `-undo.sql`
5. **Documentar en CHANGELOG.md** cada cambio

---

## 📞 SOPORTE

Si hay problemas durante implementación:
- [ ] Revisar logs: `npm run dev 2>&1 | grep -i error`
- [ ] Verificar DB: `mysql -u root -p hotel_sena < debug.sql`
- [ ] Rollback: `npm run migration:revert`

