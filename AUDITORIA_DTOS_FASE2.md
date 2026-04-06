# AUDITORÍA DTO & CONTRATOS - FASE 2

**Fecha:** 5 de abril de 2026  
**Estado:** Exploración rápida completada

---

## 1️⃣ ESTRUCTURA DTOs EN BACKEND

### Ubicación y Patrones ✅

**Estructura clara y consistente:**
```
src/
  ├─ amenidad/dto/ → create-amenidad.dto.ts, update-amenidad.dto.ts
  ├─ cliente/dto/ → create-cliente.dto.ts, update-cliente.dto.ts
  ├─ reserva/dto/ → create-reserva.dto.ts, update-reserva.dto.ts
  ├─ factura/dto/ → create-factura.dto.ts, update-factura.dto.ts, emitir-factura.dto.ts, anular-factura.dto.ts
  ├─ servicio/dto/ → create-servicio.dto.ts, update-estado-pedido.dto.ts
  └─ (42 DTOs totales encontrados)
```

**Patrón:** Create/Update/DTO específico por operación (buena práctica)

### Validaciones en DTOs ✅ BIEN IMPLEMENTADAS

**Ejemplo 1: CreateReservaDto**
```typescript
export class CreateReservaDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @Min(1, { message: 'ID de cliente debe ser un número válido' })
  @IsNotEmpty()
  idCliente: number;

  @ApiProperty({ example: '2026-03-10' })
  @IsDateString()
  @IsNotEmpty()
  checkinPrevisto: string;

  // ✅ Usa @ApiProperty (Swagger)
  // ✅ Usa class-validator decorators (@IsNotEmpty, @IsDateString, etc)
  // ✅ Mensajes de error personalizados
  // ✅ Type transformation (@Type)
}
```

**Ejemplo 2: CreateClienteDto**
```typescript
export class CreateClienteDto {
  @IsOptional()
  @IsString()
  cedula?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  nombre: string;

  // ✅ Documentación con @ApiProperty / @ApiPropertyOptional
  // ✅ Validación de email
}
```

**Librerías usadas:**
- ✅ `class-validator` (decorators de validación)
- ✅ `class-transformer` (@Type para transformación)
- ✅ `@nestjs/swagger` (@ApiProperty para documentación)

### Documentación JSDoc ⚠️ PARCIAL

**Estado:**
- ✅ DTOs tienen @ApiProperty describiendo qué es cada campo
- ✅ Ejemplos en @ApiProperty (example: '...')
- ⚠️ Algunos DTOs carecen de comentarios JSDoc en la clase misma
- ❌ No todas las excepciones están documentadas

**Ejemplo bien documentado (Reserva):**
```typescript
@ApiProperty({
  description: 'ID del cliente que realiza la reserva',
  example: 1,
})
@Type(() => Number)
@Min(1)
@IsNotEmpty()
idCliente: number;
```

**Ejemplo sin docstring (Factura simple):**
```typescript
// CreateFacturaDto
export class CreateFacturaDto {
  @IsNumber()
  idReserva: number;  // ← Sin @ApiProperty

  @IsOptional()
  @IsNumber()
  porcentajeIva?: number;
}
```

---

## 2️⃣ ESTRUCTURA DE RESPUESTAS API

### Patrón de respuesta actual ⚠️ INCONSISTENTE

**Patrón observado:**
```typescript
// Controlador devuelve la ENTIDAD directamente (sin wrapper)
@Get()
async findAll(...): Promise<Factura[]> {  // ← Array directo
  return this.facturaService.findAll(filters);
}

@Get(':id')
async findOne(...): Promise<Factura> {  // ← Objeto directo
  return factura;
}

@Get(':id/estados')
getCatalogoEstados() {
  return {  // ← Solo aquí usa wrapper
    estados: { BORRADOR, EDITABLE, ... },
    transiciones: { ... }
  };
}
```

**Problema:** Inconsistencia entre endpoints:
- `GET /facturas` → `Factura[]` (directo)
- `GET /facturas/:id` → `Factura` (directo)
- `GET /facturas/catalogo/estados` → `{ estados, transiciones }` (wrapper)
- `GET /reservas` → `{ reservas: [...], count: number }` (wrapper)

**Estado en frontend:**
```typescript
// useFacturas.ts expectativa (asume array directo)
const response = await api.get<Factura[]>(query)
facturas.value = response  // ← Esperaría array, no wrapper

// useReservas.ts expectativa (asume wrapper)
const response = await api.get(...)
reservas.value = response.reservas  // ← Expectativa: { reservas: [...] }
```

### Manejo de errores ✅ CONSISTENTE

**Backend usa excepciones NestJS:**
```typescript
throw new BadRequestException('Usuario debe estar asignado a un hotel');
throw new ForbiddenException('No tiene autorización...');
throw new NotFoundException('Factura no encontrada');
```

**Frontend parsea errores:**
```typescript
// useApi.ts
const parseError = (error: any): ApiError => {
  if (error?.data) {
    return {
      statusCode: error.statusCode || error.data.statusCode || 500,
      message: error.data.message || 'Error desconocido',
      error: error.data.error
    };
  }
}
```

**Status codes utilizados:**
- `200` OK
- `400` BadRequestException
- `401` Unauthorized
- `403` ForbiddenException
- `404` NotFoundException
- `500` Server error

### Paginación ❌ NO IMPLEMENTADA

**Estado:**
- ❌ No hay paginación en endpoints GET
- ❌ No hay `limit`, `offset`, `page`, `pageSize` parámetros
- ⚠️ Algunos endpoints retornan `{ count: number}` sin datos paginados

**Endpoints sin paginación:**
- GET `/facturas` → Todas las facturas (potencial N+1)
- GET `/reservas` → Todas las reservas
- GET `/clientes` → Todos los clientes
- GET `/habitaciones` → Todas las habitaciones

---

## 3️⃣ ENUMS DE ESTADOS

### Ubicación centralizada ✅ EXCELENTE

**Archivo central:** `src/common/constants/estados.constants.ts`

### Estados por módulo (20+ enums)

#### Factura ✅ BIEN DISEÑADO
```typescript
export const ESTADOS_FACTURA = {
  BORRADOR: 'BORRADOR',
  EDITABLE: 'EDITABLE',
  EMITIDA: 'EMITIDA',
  PAGADA: 'PAGADA',
  ANULADA: 'ANULADA',
} as const;

export type EstadoFactura = (typeof ESTADOS_FACTURA)[keyof typeof ESTADOS_FACTURA];

// ✅ Máquina de estados explícita
export const TRANSICIONES_FACTURA: Record<EstadoFactura, EstadoFactura[]> = {
  BORRADOR: ['EDITABLE', 'EMITIDA', 'ANULADA'],
  EDITABLE: ['EMITIDA', 'BORRADOR', 'ANULADA'],
  EMITIDA: ['PAGADA', 'ANULADA'],
  PAGADA: [],  // Terminal
  ANULADA: [], // Terminal
};

// ✅ Backward compatibility con estados legados
export const ESTADOS_FACTURA_LEGADO = {
  pendiente: 'pendiente',
  emitida: 'emitida',
  pagada: 'pagada',
  anulada: 'anulada',
};

export const MAPA_ESTADO_LEGADO_A_CANONICO: Record<string, EstadoFactura> = {
  pendiente: 'BORRADOR',
  emitida: 'EMITIDA',
  // ...
};
```

#### Reserva ✅ BIEN DISEÑADO
**Ubicación especial:** `src/reserva/constants/reserva-estados.ts` (+ en estados.constants.ts)
```typescript
export enum ReservaEstado {
  RESERVADA = 'reservada',
  CONFIRMADA = 'confirmada',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
  RECHAZADA = 'rechazada',
}

export const TRANSICIONES_VALIDAS: Record<ReservaEstado, ReservaEstado[]> = {
  [ReservaEstado.RESERVADA]: [
    ReservaEstado.CONFIRMADA,
    ReservaEstado.CANCELADA,
    ReservaEstado.RECHAZADA,
  ],
  // ...
};
```

#### Pedido (Servicio) ✅ BIEN DOCUMENTADO
```typescript
export const ESTADOS_PEDIDO = {
  PENDIENTE: 'pendiente',
  EN_PREPARACION: 'en_preparacion',
  LISTO: 'listo',
  ENTREGADO: 'entregado',
  CANCELADO: 'cancelado',
} as const;

// ✅ Transiciones explícitas
export const TRANSICIONES_PEDIDO: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente: ['en_preparacion', 'cancelado'],
  en_preparacion: ['listo', 'entregado', 'cancelado'],
  listo: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: [],
};

// ✅ Etiquetas para UI
export const ETIQUETAS_PEDIDO: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  listo: 'Listo para entregar',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};
```

#### Incidencia ✅ BIEN DOCUMENTADO
```typescript
export const ESTADOS_INCIDENCIA = {
  REPORTED: 'reported',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
} as const;

export const TRANSICIONES_INCIDENCIA: Record<EstadoIncidencia, EstadoIncidencia[]> = {
  reported: ['in_progress', 'resolved', 'cancelled'],
  in_progress: ['resolved', 'cancelled'],
  resolved: [],
  cancelled: [],
};

export const ETIQUETAS_INCIDENCIA: Record<EstadoIncidencia, string> = {
  reported: 'Reportada',
  in_progress: 'En curso',
  resolved: 'Resuelta',
  cancelled: 'Cancelada',
};
```

### Tipos de Enum ⚠️ MIXTO

**Uso de `as const` + type inference (mejor):**
```typescript
export const ESTADOS_FACTURA = { ... } as const;
export type EstadoFactura = (typeof ESTADOS_FACTURA)[keyof typeof ESTADOS_FACTURA];
```

**Uso de `enum` TypeScript (también aquí):**
```typescript
export enum ReservaEstado {
  RESERVADA = 'reservada',
  CONFIRMADA = 'confirmada',
}
```

**Análisis:**
- ✅ Ambos enfoques son válidos
- ✅ `as const` permite mejor tree-shaking
- ⚠️ Inconsistencia: algunos módulos usan enum, otros as const

---

## 4️⃣ FRONTEND TYPES

### Ubicación ✅ CLARA

```
dashboard/types/
  ├─ api.ts          (ApiResponse, ApiError, Amenidad, TipoHabitacion, Habitacion, etc)
  ├─ auth.ts         (User, LoginRequest, RegisterRequest, UserRole enum)
  ├─ factura.ts      (Factura, DetalleFactura, EstadoFactura type)
  ├─ reserva.ts      (Reserva interfaces - PROBABLEMENTE DUPLICADO)
  ├─ checkinCheckout.ts
  ├─ folio.ts
  ├─ incidencias.ts
  └─ servicios.ts
```

### Tipado ACTUAL

#### ✅ BIEN TIPADO
```typescript
// types/factura.ts
export type EstadoFactura = 'BORRADOR' | 'EDITABLE' | 'EMITIDA' | 'PAGADA' | 'ANULADA'

export interface Factura {
  id: number
  numeroFactura: string
  uuid: string
  idReserva: number
  idCliente: number
  nombreCliente: string
  subtotal: number
  porcentajeIva: number
  montoIva: number
  total: number
  estadoFactura: EstadoFactura  // ✅ Tipado fuerte
  desgloseImpuestos?: DesgloseMonetario | null
  detalles?: DetalleFactura[]
  pagos?: PagoFactura[]
  createdAt?: string
  updatedAt?: string
}

export interface DetalleFactura {
  id: number
  tipoConcepto: 'habitacion' | 'servicio' | 'servicio_alcoholico' | 'descuento'
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  total: number
}
```

#### ⚠️ SINCRONIZACIÓN IMPERFECTA

**Backend Factura.entity:**
```typescript
@Column({ type: 'enum', enum: EstadoFactura })
estadoFactura: EstadoFactura;

@Column('decimal', { precision: 10, scale: 2 })
montoIva: number;
```

**Frontend type Factura:**
```typescript
estadoFactura: EstadoFactura  // ✅ Sincronizado
montoIva: number              // ✅ Sincronizado
desgloseImpuestos?: DesgloseMonetario | null  // ✅ Presente
```

**Pero hay campos en backend no en frontend:**
```typescript
// Backend tiene estos campos:
@Column({ nullable: true })
jsonData: string;

@Column({ nullable: true })
xmlData: string;

@Column({ unique: true })
cufe: string;

// Frontend type factura.ts TIENE estos:
jsonData?: string
xmlData?: string
cufe?: string
```

✅ **Conclusión:** Tipos sincronizados (aunque no perfectamente en 100% de campos)

#### ⚠️ HAY `any` EN ALGUNOS LUGARES

**Ejemplo en composables:**
```typescript
const facturaActual = ref<Factura | null>(null)  // ✅ Tipado
const errorMessage = ref('')                      // ✅ Tipado

// Pero en funciones:
const response = await api.get<Factura[]>(query)  // ✅ Tipado
```

**Controller responses esperadas:**
```typescript
// useApi.ts
const response = await $fetch<T>(`${baseURL}${endpoint}`, {...})
return response  // ← Retorna T directamente, sin parsing
```

### Tipos para Reserva ⚠️ DUPLICADO

**Backend:** Dos definiciones de estado
```typescript
// src/reserva/constants/reserva-estados.ts
export enum ReservaEstado {
  RESERVADA = 'reservada',
  ...
}

// src/common/constants/estados.constants.ts
export const ESTADOS_RESERVA = {
  RESERVADA: 'RESERVADA',  // ← MAYÚSCULAS
  ...
}
```

**Frontend:** Enum en types/api.ts
```typescript
export enum EstadoReserva {
  RESERVADA = 'reservada',   // ← minúsculas
  CONFIRMADA = 'confirmada',
  ...
}
```

**⚠️ Inconsistencia:** Backend usa 'RESERVADA' en estados.constants pero 'reservada' en reserva-estados.ts

---

## 5️⃣ VALIDACIONES

### Backend ✅ ROBUSTO

**Framework:** `class-validator` + `class-transformer`

**Estrategia:**
1. DTO con decoradores de validación
2. ValidationPipe en main.ts (pipes globales)
3. Mensajes de error personalizados
4. Transform de tipos

**Ejemplo completo:**
```typescript
@IsNumber()
@Min(1, { message: 'ID debe ser >= 1' })
@IsNotEmpty()
idCliente: number;

@IsDateString()
@IsNotEmpty()
checkinPrevisto: string;

@IsEmail()
@IsNotEmpty()
email: string;
```

**Cobertura:**
- ✅ Reserva: idCliente, idHotel, fechas, huéspedes validados
- ✅ Factura: idReserva, porcentajeIva validados
- ✅ Cliente: email, nombre, cedula validados
- ✅ Incidencia: tipo y estado con @IsEnum

### Frontend ❌ AUSENTE

**Estado actual:**
```typescript
// useFacturas.ts - sin validación
const obtenerTodas = async (filtros?: {...}) => {
  try {
    const response = await api.get<Factura[]>(...)
    facturas.value = response
  } catch (err) {
    error(err.message)  // ← Solo manejo de excepciones
  }
}
```

**No hay:**
- ❌ Validación en formularios (no hay zod/vee-validate)
- ❌ Validación de input antes de enviar
- ❌ Feedback de validación en UI

**Ejemplo de lo que DEBERÍA haber:**
```typescript
// ❌ FALTA: Validación en createFactura
const createFactura = async (reservaId: number) => {
  // DEBERÍA validar:
  // - reservaId > 0
  // - reservaId existe
  // - reservaId tiene estado correcto
  
  const response = await api.post('/facturas', { idReserva: reservaId })
}
```

### Validación de autorizaciones

**Backend:** ✅ EXCELENTE
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('recepcionista', 'admin', 'superadmin')
async findAll(...): Promise<Factura[]> {
  // Validación adicional en controlador:
  if (userRole === 'admin' && factura.idHotel !== userIdHotel) {
    throw new ForbiddenException(...)
  }
}
```

**Frontend:** ⚠️ AUSENTE
```typescript
// useFacturas.ts
// No hay validación de permisos antes de llamar API
const obtenerTodas = async () => {
  // DEBERÍA verificar: authStore.user?.role?
  const response = await api.get('/facturas')  // ← Se llamará y fallará si no autorizado
}
```

---

## 📋 GAPS DETECTADOS

### 1. Respuestas API Inconsistentes 🔴 CRÍTICO
```
GET /facturas → Factura[] (sin wrapper)
GET /reservas → { reservas: Factura[], count: number } (con wrapper)
GET /incidencias → IncidentResponse[] (sin wrapper)
```
**Impacto:** Frontend duplica lógica de parsing, difícil de mantener

### 2. DTOs incompletos en algunos módulos 🟡 MEDIO
```typescript
// CreateFacturaDto es demasiado simple
export class CreateFacturaDto {
  @IsNumber()
  idReserva: number;
  
  @IsOptional()
  porcentajeIva?: number;  // ← ¿Por qué opcional? ¿Cuál es default?
}
```

### 3. Falta paginación 🔴 CRÍTICO (para datos grandes)
- No hay soporte para `limit`, `offset`, `page`
- GET `/facturas` retorna TODAS (N+1 potencial)
- Frontend no para requests grandes

### 4. Validación en frontend inexistente 🔴 CRÍTICO
- No hay zod/vee-validate
- No hay validación de input antes de submit
- No hay feedback visual tipo "este campo es requerido"

### 5. Tipos backend-frontend duplicados 🟡 MEDIO
- ReservaEstado en backend (2 definiciones)
- EstadoReserva en frontend (inconsistencia de mayús)
- Genera errores si una cambia y otra no

### 6. DTOs sin ejemplos completos algunos 🟡 BAJO
```typescript
// UpdateReservaDto no tiene @ApiPropertyOptional en todos los campos
export class UpdateReservaDto extends PartialType(CreateReservaDto) {}
```

### 7. Estados con inconsistencia de formato 🔴 CRÍTICO
```typescript
// Backend ESTADOS_FACTURA: 'BORRADOR', 'EMITIDA' (MAYÚSCULAS)
// Backend ESTADOS_PEDIDO: 'pendiente', 'listo' (minúsculas)
// Frontend: EstadoReserva: 'reservada' (minúsculas)
```

---

## ✅ QUÉ ESTÁ BIEN

1. **Enums centralizados** en `estados.constants.ts` → Fuente única de verdad
2. **Máquinas de estado** explícitas: TRANSICIONES_FACTURA, TRANSICIONES_PEDIDO
3. **DTOs con validaciones** usando class-validator (completo)
4. **Documentación Swagger** con @ApiProperty en casi todos lados
5. **Autenticación/Autorización** bien implementada en backend (Guards + Roles)
6. **Tipos en frontend** para Factura, DetalleFactura, Reserva (sincronizados bastante bien)
7. **Manejo de errores** consistente con parseError en useApi

---

## 🚀 PRIORIDADES DE FIX

### CRÍTICO (hacer YA)
1. **Unificar formato de respuestas API**
   - Decidir: `data[]` vs `{data: []}` vs wrapper-by-type
   - Implementar wrapper consistente en todos los endpoints
   - Actualizar frontend para parsear consistentemente

2. **Agregar validación frontend**
   - Instalar `zod` o `vee-validate`
   - Validar antes de submit (no solo en backend)
   - Feedback visual de errores

3. **Unificar enums backend**
   - Decidir: ¿MAYÚSCULAS o minúsculas?
   - Un solo lugar por estado (no 2 definiciones de ReservaEstado)
   - Alinear frontend tipos con backend decisión

### ALTO (próxima sprint)
4. **Agregar paginación**
   - Implementar `limit`, `skip`/`offset` en findAll endpoints
   - Actualizar DTOs de query
   - Frontend maneja páginas en composables

5. **Completar DTOs crear/actualizar**
   - CreateFacturaDto necesita más campos (observaciones, etc)
   - UpdateClienteDto necesita validaciones
   - Documentar qué campos son obligatorios en actualizaciones

### MEDIO (post-auditoría)
6. **Sincronizar tipos** entre backend y frontend
   - Generador automático de types (OpenAPI → types)
   - O NestJS plugin para exportar types

7. **Documentación JSDoc en DTOs**
   - Agregar comentarios JSDoc a clases DTO
   - Documentar excepciones posibles en cada endpoint

---

## 📊 EJEMPLO COMPARATIVO: ESTADO ACTUAL VS IDEAL

### CreateFacturaDto ACTUAL
```typescript
export class CreateFacturaDto {
  @IsNumber()
  idReserva: number;

  @IsOptional()
  @IsNumber()
  porcentajeIva?: number;

  @IsOptional()
  observaciones?: string;
}
```

### CreateFacturaDto IDEAL
```typescript
/**
 * DTO para crear una factura desde una reserva confirmada.
 * Solo genera detalles básicos (habitación) inicialmente.
 * 
 * @throws BadRequestException si reserva no existe
 * @throws BadRequestException si reserva no está en estado CONFIRMADA
 */
export class CreateFacturaDto {
  /** ID de la reserva confirmada (debe estar en CONFIRMADA) */
  @ApiProperty({ example: 123, description: 'ID de reserva' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  idReserva: number;

  /** 
   * Porcentaje IVA a aplicar (default: 19%)
   * Se usa el porcentaje de la categoría si existe, sino este valor
   */
  @ApiPropertyOptional({ example: 19, description: 'Porcentaje IVA' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  porcentajeIva?: number;

  /** Observaciones adicionales (max 500 chars) */
  @ApiPropertyOptional({ example: 'Descuento aplica', description: 'Notas' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
```

---

## 📝 CONCLUSIÓN

| Aspecto | Estado | Score |
|--------|--------|-------|
| **DTOs estructura** | ✅ Bien | 9/10 |
| **DTOs validación** | ✅ Bien | 8/10 |
| **DTOs documentación** | ⚠️ Parcial | 6/10 |
| **API respuestas** | 🔴 Inconsistente | 4/10 |
| **Enums estados** | ✅ Bien | 8/10 |
| **Frontend types** | ✅ Bien | 7/10 |
| **Frontend validación** | ❌ Ausente | 0/10 |
| **Paginación** | ❌ Ausente | 0/10 |
| **Autorización backend** | ✅ Excelente | 9/10 |
| **Autorización frontend** | ❌ Ausente | 2/10 |
| **Sincronización B-F** | ⚠️ Parcial | 6/10 |

**Promedio:** 5.3/10

**Próximo paso:** Empezar por CRÍTICO #1 (unificar respuestas API) en FASE 3.
