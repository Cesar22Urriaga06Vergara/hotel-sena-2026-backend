# Plan de Implementación - Fases 6, 7, 8

## Estado Actual del Proyecto

### ✅ COMPLETADO (Fases 1-5)
1. **FASE 1:** Análisis y planificación arquitectónica
2. **FASE 2:** Migración de base de datos (5 archivos SQL)
3. **FASE 3:** Entidades NestJS (4 nuevas + 4 actualizadas)
4. **FASE 4:** Servicios (ImpuestoService + FacturaService refactorizado)
5. **FASE 5:** REST API endpoints (4 nuevos + 2 mejorados)

### 🔄 EN PROGRESO
- FASE 5.5: Documentación de endpoints (COMPLETADA)

### ⏳ PRÓXIMAS FASES
6. Frontend components para visualización
7. RBAC y permisos
8. Testing (unitarios + E2E)

---

## FASE 6: Frontend Components y Visualización

### Objetivo
Crear componentes Vue.js para que usuarios vean y gestionen cambios de estado de facturas, desglose de impuestos y auditoría.

### Componentes a Crear

#### 1. **FacturaDesglose.vue** (350 líneas)
Visualiza desglose de impuestos por categoría

**Props:**
- `factura: Factura` - Factura completa con desgloseImpuestos/desgloseMonetario
- `soloLectura?: boolean` - Modo lectura (default true)

**Estructura:**
```vue
<template>
  <div class="desglose-container">
    <!-- Tabla 1: Desglose por categoría -->
    <v-table class="mt-4">
      <thead>
        <tr>
          <th>Categoría</th>
          <th>Subtotal</th>
          <th>IVA 19%</th>
          <th>INC 8%</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <!-- Iterar factura.desgloseMonetario -->
      </tbody>
    </v-table>

    <!-- Resumen totales -->
    <v-card class="mt-4">
      <v-card-text>
        <div class="text-h6">Subtotal: ${{ subtotal }}</div>
        <div class="text-h6">IVA (19%): ${{ montoIva }}</div>
        <div class="text-h6">INC (8%): ${{ montoInc }}</div>
        <div class="text-h6 font-weight-bold">TOTAL: ${{ total }}</div>
      </v-card-text>
    </v-card>

    <!-- Gráfico opcional: Pie chart de distribución -->
    <v-chart v-if="!soloLectura" :option="chartOption" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Factura } from '~/types/api'

interface Props {
  factura: Factura
  soloLectura?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  soloLectura: true
})

// Computar totales desde desgloseMonetario
const subtotal = computed(() => {
  // Sumar todas las categorías
})

const montoIva = computed(() => {
  // Sumar IVA de todas las categorías
})

const montoInc = computed(() => {
  // Sumar INC
})

const total = computed(() => subtotal.value + montoIva.value + montoInc.value)

// Gráfico pie
const chartOption = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie',
    data: [
      { value: subtotal.value, name: 'Subtotal' },
      { value: montoIva.value, name: 'IVA 19%' },
      { value: montoInc.value, name: 'INC 8%' }
    ]
  }]
}))
</script>

<style scoped>
.desglose-container {
  padding: 24px;
}
</style>
```

**Archivos a Crear:**
- `components/facturas/FacturaDesglose.vue`

---

#### 2. **EstadoFacturaBadge.vue** (80 líneas)
Badge visual que muestra estado actual y transiciones permitidas

**Props:**
- `estadoActual: string` - BORRADOR|EDITABLE|EMITIDA|PAGADA|ANULADA
- `permiteTransiciones?: boolean` - Mostrar botones de transición

**Estado → Color:**
| Estado | Color | Icon |
|--------|-------|------|
| BORRADOR | Orange | create |
| EDITABLE | Blue | edit |
| EMITIDA | Green | check_circle |
| PAGADA | Dark Green | verification |
| ANULADA | Red | cancel |

**Archivos a Crear:**
- `components/facturas/EstadoFacturaBadge.vue`

---

#### 3. **HistorialCambios.vue** (250 líneas)
Timeline de cambios/auditoría

**Props:**
- `idFactura: number` - ID para cargar cambios
- `autoRefresh?: boolean` - Actualizar cada 30s (default false)

**Funcionalidad:**
```vue
<!-- Timeline vertical -->
<v-timeline align="start">
  <v-timeline-item
    v-for="cambio in cambios"
    :key="cambio.id"
    :color="colorPorTipo(cambio.tipoCambio)"
    small
  >
    <template #opposite>
      {{ cambio.fechaFormateada }}
    </template>
    
    <v-card>
      <v-card-title>{{ cambio.descripcion }}</v-card-title>
      <v-card-text>
        <p v-if="cambio.valorAnterior">
          <strong>Antes:</strong> {{ JSON.stringify(cambio.valorAnterior) }}
        </p>
        <p v-if="cambio.valorNuevo">
          <strong>Después:</strong> {{ JSON.stringify(cambio.valorNuevo) }}
        </p>
        <p v-if="cambio.usuarioId">
          <small>Usuario: {{ cambio.usuarioId }}</small>
        </p>
      </v-card-text>
    </v-card>
  </v-timeline-item>
</v-timeline>
```

**Archivos a Crear:**
- `components/facturas/HistorialCambios.vue`
- `composables/useHistorialCambios.ts` - Hook para cargar cambios

---

#### 4. **DialogCambiarEstado.vue** (200 líneas)
Dialog para cambiar estado de factura con confirmación

**Props:**
- `facturaId: number`
- `estadoActual: string`
- `nuevoEstado: string`
- `modelValue: boolean` - Control del dialog

**Flujo:**
1. Mostrar confirmación
2. Si es anulación, pedir motivo
3. Llamar API correspondiente
4. Mostrar resultado
5. Refrescar factura

**Estados:**
```typescript
const estadosPermitidos: Record<string, string[]> = {
  BORRADOR: ['EDITABLE', 'EMITIDA', 'ANULADA'],
  EDITABLE: ['EMITIDA', 'BORRADOR', 'ANULADA'],
  EMITIDA: ['PAGADA', 'ANULADA'],
  PAGADA: [],
  ANULADA: []
}
```

**Archivos a Crear:**
- `components/facturas/DialogCambiarEstado.vue`

---

#### 5. **FacturaDetailView.vue** (400 líneas)
Vista completa de una factura con todos los componentes

**Estructura:**
```vue
<template>
  <v-container>
    <!-- Header con datos básicos -->
    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Factura {{ factura.numeroFactura }}</v-card-title>
          <v-card-text>
            <!-- Datos cliente, fechas, etc -->
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <!-- EstadoFacturaBadge -->
        <EstadoFacturaBadge 
          :estado-actual="factura.estadoFactura"
          @cambiar-estado="abrirDialogCambio"
        />
      </v-col>
    </v-row>

    <!-- Desglose de impuestos -->
    <v-row class="mt-4">
      <v-col cols="12">
        <FacturaDesglose :factura="factura" />
      </v-col>
    </v-row>

    <!-- Detalles de productos/servicios -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>Detalles</v-card-title>
          <v-table>
            <!-- Lista de detalles_facturascon categoría y subtotal -->
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Historial de cambios (tab) -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-tabs>
          <v-tab>Historial</v-tab>
          <v-tab-window>
            <v-tab-window-item>
              <HistorialCambios :id-factura="facturaId" />
            </v-tab-window-item>
          </v-tab-window>
        </v-tabs>
      </v-col>
    </v-row>

    <!-- Dialog para cambios -->
    <DialogCambiarEstado
      v-model="dialogAbiertoAsyncio"
      :factura-id="facturaId"
      :estado-actual="factura.estadoFactura"
      :nuevo-estado="estadoAmbicioso"
    />
  </v-container>
</template>
```

**Archivos a Crear:**
- `pages/dashboard/facturas/[id]/detail.vue` o actualizar existente

---

### Composables a Crear/Actualizar

#### `useFacturas.ts` 
```typescript
// En src/composables/useFacturas.ts
export const useFacturas = () => {
  // Métodos existentes...
  
  // Nuevos métodos para FASE 5
  const emitirFactura = async (idFactura: number, usuarioId?: number) => {
    // PATCH /facturas/:id/emitir
  }
  
  const anularFactura = async (idFactura: number, motivo: string, usuarioId?: number) => {
    // PATCH /facturas/:id/anular
  }
  
  const marcarComoPagada = async (idFactura: number, fechaPago?: Date, usuarioId?: number) => {
    // PATCH /facturas/:id/marcar-pagada
  }
  
  const obtenerHistorial = async (idFactura: number) => {
    // GET /facturas/:id/historial-cambios
  }
  
  return {
    // ...existentes,
    emitirFactura,
    anularFactura,
    marcarComoPagada,
    obtenerHistorial
  }
}
```

---

### Tipos a Crear/Actualizar

#### `types/factura.ts`
```typescript
export interface Factura {
  // ... campos existentes
  
  // Nuevos campos FASE 5
  estadoFactura: 'BORRADOR' | 'EDITABLE' | 'EMITIDA' | 'PAGADA' | 'ANULADA'
  desgloseImpuestos?: Record<string, any>
  desgloseMonetario?: Record<string, any>
}

export interface FacturaCambio {
  id: number
  idFactura: number
  usuarioId?: number
  tipoCambio: string
  descripcion: string
  valorAnterior?: any
  valorNuevo?: any
  fecha: Date
  fechaFormateada: string
}

export interface HistorialCambiosResponse {
  cambios: FacturaCambio[]
  total: number
  resumen?: {
    estadoActual: string
    ultimoCambio?: string
    ultimaCambioFecha?: Date
  }
}
```

---

## FASE 7: RBAC y Permisos

### Objetivo
Garantizar que solo usuarios autorizados puedan realizar cambios de estado según su rol.

### Cambios Requeridos

#### 1. Actualizar `usePermissions.ts`
```typescript
// Nueva función
export const canCambiarEstadoFactura = (rol: string, estadoActual: string, estadoNuevo: string): boolean => {
  // Solo admin/superadmin pueden cambiar estados
  if (!['admin', 'superadmin'].includes(rol)) {
    return false
  }
  
  // Validar transición permitida
  const transiciones = {
    BORRADOR: ['EDITABLE', 'EMITIDA', 'ANULADA'],
    EDITABLE: ['EMITIDA', 'BORRADOR', 'ANULADA'],
    EMITIDA: ['PAGADA', 'ANULADA'],
    PAGADA: [],
    ANULADA: []
  }
  
  return transiciones[estadoActual]?.includes(estadoNuevo) ?? false
}
```

#### 2. Agregar Permisos en Auth
```typescript
// Nueva entrada en tabla de permisos
const PERMISOS = {
  // ... existentes
  'factura:cambiar-estado': {
    descripcion: 'Cambiar estado de facturas',
    roles: ['admin', 'superadmin']
  },
  'factura:ver-historial': {
    descripcion: 'Ver historial de cambios',
    roles: ['recepcionista', 'admin', 'superadmin', 'cliente']
  },
  'factura:emitir': {
    descripcion: 'Emitir facturas (BORRADOR → EMITIDA)',
    roles: ['admin', 'superadmin']
  },
  'factura:anular': {
    descripcion: 'Anular facturas',
    roles: ['superadmin'] // Más restrictivo que emitir
  }
}
```

#### 3. Validaciones Frontend
Deshabilitar botones si usuario no tiene permiso:
```vue
<v-btn
  @click="emitir"
  :disabled="!canCambiarEstadoFactura(userRole, factura.estadoFactura, 'EMITIDA')"
>
  Emitir
</v-btn>
```

---

## FASE 8: Testing

### Unit Tests (FacturaService)

#### `src/factura/factura.service.spec.ts` (300+ líneas)

```typescript
describe('FacturaService', () => {
  let service: FacturaService
  
  describe('emitir()', () => {
    it('debe cambiar estado de BORRADOR a EMITIDA', async () => {
      // arrange
      const factura = new Factura()
      factura.id = 1
      factura.estadoFactura = 'BORRADOR'
      
      // act
      const resultado = await service.emitir(1)
      
      // assert
      expect(resultado.estadoFactura).toBe('EMITIDA')
      expect(resultado.fechaEmision).toBeDefined()
    })
    
    it('debe throw si intenta emitir factura PAGADA', async () => {
      // arrange
      const factura = new Factura()
      factura.estadoFactura = 'PAGADA'
      
      // act & assert
      await expect(service.emitir(1)).rejects.toThrow(BadRequestException)
    })
  })
  
  describe('anular()', () => {
    it('debe anular factura con motivo', async () => {
      // ...
    })
    
    it('debe throw si factura tiene pagos completados', async () => {
      // ...
    })
  })
  
  describe('marcarComoPagada()', () => {
    it('solo permite desde EMITIDA', async () => {
      // ...
    })
  })
  
  describe('obtenerHistorialCambios()', () => {
    it('debe retornar cambios ordenados descendente', async () => {
      // ...
    })
  })
})
```

### E2E Tests

#### `test/factura-flow.e2e-spec.ts` (400+ líneas)

Flujos a testear:
1. **Flujo Normal:** Crear → Editar → Emitir → Pagar
2. **Flujo Anulación:** Crear → Emitir → Anular
3. **Validaciones:** Intentos de transiciones inválidas
4. **Auditoría:** Verificar registros en `factura_cambios`
5. **Autorización:** Validar RBAC por rol/hotel

```typescript
describe('Factura E2E Flow', () => {
  let app: INestApplication
  let facturaService: FacturaService
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()
    
    app = moduleRef.createNestApplication()
    await app.init()
    facturaService = moduleRef.get<FacturaService>(FacturaService)
  })
  
  describe('POST /facturas/generar/:idReserva', () => {
    it('debe generar factura en estado BORRADOR', () => {
      // request POST
      // verify status 201
      // verify estadoFactura = 'BORRADOR'
    })
  })
  
  describe('PATCH /facturas/:id/emitir', () => {
    it('debe emitir factura BORRADOR', () => {
      // request PATCH /facturas/1/emitir
      // verify estadoFactura = 'EMITIDA'
      // verify factura_cambios updated
    })
  })
  
  describe('Validaciones Estado Machine', () => {
    it('debe rechazar emitir desde PAGADA', async () => {
      // Create factura PAGADA
      // Try PATCH /emitir
      // expect 400
    })
  })
  
  describe('Auditoría', () => {
    it('debe registrar todos los cambios', async () => {
      // Perform multiple state changes
      // GET /historial-cambios
      // Verify todos los cambios están registrados
    })
  })
})
```

---

## Resumen de Artefactos por Fase

### FASE 6: Frontend (11 archivos)
```
components/
  facturas/
    FacturaDesglose.vue          (350 líneas)
    EstadoFacturaBadge.vue       (80 líneas)
    HistorialCambios.vue         (250 líneas)
    DialogCambiarEstado.vue      (200 líneas)

pages/
  dashboard/
    facturas/
      [id]/
        detail.vue               (400 líneas) - UPDATE

composables/
  useFacturas.ts                 (UPGRADE +100 líneas)
  useHistorialCambios.ts         (150 líneas) - NEW

types/
  factura.ts                     (UPGRADE +50 líneas)
```

### FASE 7: Permisos (3 archivos)
```
composables/
  usePermissions.ts              (UPGRADE +50 líneas)

src/
  auth/
    constants/
      permisos.ts                (UPGRADE +20 líneas)
```

### FASE 8: Testing (2 archivos)
```
src/
  factura/
    factura.service.spec.ts      (300+ líneas) - NEW

test/
  factura-flow.e2e-spec.ts       (400+ líneas) - NEW
```

---

## Estimación de Tiempo

| Fase | Tarea | Horas |
|------|-------|-------|
| 6 | Components | 8 |
| 6 | Composables | 2 |
| 6 | Types | 1 |
| 7 | Permisos | 1 |
| 8 | Unit Tests | 4 |
| 8 | E2E Tests | 4 |
| **Total** | | **20 horas** |

---

## Siguiente Acción

**Elegir:**
1. Empezar FASE 6 (frontend components) - Mejor UX
2. Empezar FASE 8 (testing) - Mejor QA
3. Empezar FASE 7 (permisos) - Mejor seguridad

**Recomendación:** FASE 6 primero para validar API endpoints funciona correctamente
