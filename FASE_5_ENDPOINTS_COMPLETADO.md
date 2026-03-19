# FASE 5: REST API Endpoints para Gestión de Facturas con Estado Machine

## Descripción General

Se han completado los endpoints REST para la gestión de facturas con el nuevo sistema de máquina de estados (estadoFactura). Los endpoints permiten:
- Cambiar estados de facturas (BORRADOR → EDITABLE → EMITIDA → PAGADA/ANULADA)
- Obtener histórico de cambios (auditoría)
- Validaciones de autorización por hotel
- Registro automático de cambios en auditoría

---

## Nuevos Endpoints Creados

### 1. **PATCH /facturas/:id/emitir**
**Descripción:** Emitir factura (cambiar de BORRADOR/EDITABLE a EMITIDA)

**Request:**
```http
PATCH /facturas/42/emitir
Authorization: Bearer <token>
Content-Type: application/json

{
  "usuarioId": 5  // Opcional - si no se proporciona, usa del token
}
```

**Estados Permitidos:** BORRADOR, EDITABLE
**Nuevo Estado:** EMITIDA
**Fechas Generadas:** 
- `fechaEmision`: Fecha actual
- `fechaVencimiento`: Fecha actual + 30 días

**Response (200 OK):**
```json
{
  "id": 42,
  "numeroFactura": "FAC-2026-00001",
  "estadoFactura": "EMITIDA",
  "estado": "emitida",
  "idCliente": 1,
  "nombreCliente": "Juan Pérez",
  "subtotal": 500000,
  "montoIva": 95000,
  "montoInc": 0,
  "total": 595000,
  "desgloseImpuestos": {...},
  "desgloseMonetario": {...},
  "fechaEmision": "2026-03-15T10:30:00Z",
  "fechaVencimiento": "2026-04-14T10:30:00Z"
}
```

**Errores Posibles:**
- `400 Bad Request`: No se puede emitir desde el estado actual
- `403 Forbidden`: No tiene autorización (diferente hotel)
- `404 Not Found`: Factura no encontrada

---

### 2. **PATCH /facturas/:id/anular**
**Descripción:** Anular factura (cambiar a ANULADA)

**Request:**
```http
PATCH /facturas/42/anular
Authorization: Bearer <token>
Content-Type: application/json

{
  "motivo": "Error en el cálculo de impuestos según requerimiento del cliente",
  "usuarioId": 5  // Opcional
}
```

**Estados Permitidos:** BORRADOR, EDITABLE, EMITIDA
**Estados No Permitidos:** PAGADA, ANULADA (finales)

**Validaciones Especiales:**
- No permite anular si tiene pagos completados
- El motivo es obligatorio (mín. 10 caracteres)

**Response (200 OK):**
```json
{
  "id": 42,
  "estadoFactura": "ANULADA",
  "estado": "anulada",
  "observaciones": "ANULADA [15/3/2026 10:30:45]: Error en el cálculo de impuestos según requerimiento del cliente"
}
```

**Errores Posibles:**
- `400 Bad Request`: No se puede anular (estado final) o faltan datos
- `403 Forbidden`: No tiene autorización
- `404 Not Found`: Factura no encontrada

---

### 3. **PATCH /facturas/:id/marcar-pagada**
**Descripción:** Marcar factura como pagada (cambiar de EMITIDA a PAGADA)

**Request:**
```http
PATCH /facturas/42/marcar-pagada
Authorization: Bearer <token>
Content-Type: application/json

{
  "fechaPago": "2026-03-15T15:45:00Z",  // Opcional - si no se proporciona, usa fecha actual
  "usuarioId": 5  // Opcional
}
```

**Estados Permitidos:** EMITIDA (solo)

**Validaciones Especiales:**
- Requiere que exista al menos un pago registrado en tabla `pagos`
- La fecha de pago es opcional

**Response (200 OK):**
```json
{
  "id": 42,
  "estadoFactura": "PAGADA",
  "estado": "pagada",
  "fechaVencimiento": "2026-03-15T15:45:00Z"
}
```

**Errores Posibles:**
- `400 Bad Request`: No se puede marcar como pagada o falta un pago registrado
- `403 Forbidden`: No tiene autorización
- `404 Not Found`: Factura no encontrada

---

### 4. **GET /facturas/:id/historial-cambios**
**Descripción:** Obtener historial completo de cambios (auditoría) de una factura

**Request:**
```http
GET /facturas/42/historial-cambios
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "cambios": [
    {
      "id": 156,
      "idFactura": 42,
      "usuarioId": 5,
      "tipoCambio": "CAMBIO_ESTADO",
      "descripcion": "Factura emitida - Cambio de estado BORRADOR → EMITIDA",
      "valorAnterior": {
        "estadoFactura": "BORRADOR"
      },
      "valorNuevo": {
        "estadoFactura": "EMITIDA",
        "fechaEmision": "2026-03-15T10:30:00Z"
      },
      "fecha": "2026-03-15T10:30:00Z",
      "fechaFormateada": "10:30:00 15/03/2026"
    },
    {
      "id": 155,
      "idFactura": 42,
      "usuarioId": null,
      "tipoCambio": "ACTUALIZACIÓN",
      "descripcion": "Se actualizaron los campos: observaciones, montoIva",
      "valorAnterior": {
        "observaciones": "Factura inicial",
        "montoIva": 90000
      },
      "valorNuevo": {
        "observaciones": "Ajuste por error de cálculo",
        "montoIva": 95000
      },
      "fecha": "2026-03-14T09:15:00Z",
      "fechaFormateada": "09:15:00 14/03/2026"
    }
  ],
  "total": 2,
  "resumen": {
    "estadoActual": "EMITIDA",
    "ultimoCambio": "Factura emitida - Cambio de estado BORRADOR → EMITIDA",
    "ultimaCambioFecha": "2026-03-15T10:30:00Z"
  }
}
```

**Roles Autorizados:** recepcionista, admin, superadmin, cliente
- Clientes solo ven sus propias facturas
- Admins/recepcionistas solo ven facturas de su hotel

**Errores Posibles:**
- `403 Forbidden`: No tiene autorización
- `404 Not Found`: Factura no encontrada

---

## Máquina de Estados

```
BORRADOR (inicial)
    ├─→ EDITABLE
    ├─→ EMITIDA
    └─→ ANULADA ✗

EDITABLE
    ├─→ EMITIDA
    ├─→ BORRADOR
    └─→ ANULADA ✗

EMITIDA
    ├─→ PAGADA
    └─→ ANULADA

PAGADA ✗ (final - no se puede cambiar)

ANULADA ✗ (final - no se puede cambiar)

Leyenda:
✗ = No se puede cambiar desde este estado
→ = Transición permitida
```

---

## DTOs Creados

### EmitirFacturaDto
```typescript
{
  usuarioId?: number  // Opcional
}
```

### AnularFacturaDto
```typescript
{
  motivo: string     // Obligatorio, 10-500 caracteres
  usuarioId?: number // Opcional
}
```

### MarcarPagadaDto
```typescript
{
  fechaPago?: Date   // Opcional (ISO 8601)
  usuarioId?: number // Opcional
}
```

### FacturaCambioResponseDto / HistorialCambiosResponseDto
Ver endpoint #4 arriba para estructura JSON

---

## Mejoras Implementadas en FacturaService

### Método `emitir(id, usuarioId?)`
- Valida que la factura esté en BORRADOR o EDITABLE
- Registra cambio en tabla `factura_cambios`
- Mantiene campo `estado` para compatibilidad

### Método `anular(id, motivo, usuarioId?)`
- Valida que no esté en estado final (PAGADA, ANULADA)
- Valida que no tenga pagos completados
- Requiere motivo obligatorio
- Registra cambio en auditoría

### Método `marcarComoPagada(id, fechaPago?, usuarioId?)`
- Solo permite desde estado EMITIDA
- Requiere al menos un pago registrado
- Registra cambio en auditoría

### Método `obtenerHistorialCambios(idFactura)`
- Retorna array de cambios ordenados por fecha DESC
- Parsea JSON automaticamente
- Formatea fechas a es-CO

---

## Flujo de Autorización

Todos los endpoints validan:

1. **Autenticación:** Requieren JWT válido (JwtAuthGuard)
2. **Autorización de Rol:** Requieren rol específico (RolesGuard + @Roles)
3. **Pertenencia a Hotel:** 
   - Admins solo pueden operar facturas de su hotel
   - Recepcionistas solo de su hotel
   - Clientes solo ven sus propias facturas
   - Superadmins pueden ver todas

---

## Auditoría Automática

Cada cambio de estado se registra automáticamente en tabla `factura_cambios`:
- Campo `tipoCambio`: 'CAMBIO_ESTADO' para transiciones, 'ACTUALIZACIÓN' para cambios
- Campo `descripción`: Descripción legible del cambio
- Campo `valorAnterior` y `valorNuevo`: JSON con valores antes/después
- Campo `fecha`: Timestamp automático
- Campo `usuarioId`: ID de quién hizo el cambio

---

## Ejemplos de Uso

### Emitir una factura
```bash
curl -X PATCH http://localhost:3000/facturas/42/emitir \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"usuarioId": 5}'
```

### Anular una factura
```bash
curl -X PATCH http://localhost:3000/facturas/42/anular \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"motivo": "Error en cálculo de IVA según cliente"}'
```

### Obtener historial
```bash
curl -X GET http://localhost:3000/facturas/42/historial-cambios \
  -H "Authorization: Bearer <token>"
```

---

## Notas Importantes

1. **Compatibilidad:** Los campos `estado` (string) se mantienen actualizados junto con `estadoFactura` (enum) para retrocompatibilidad
2. **Auditoría Resiliente:** Si la auditoría falla, el cambio se persiste de todas formas (no lanza excepción)
3. **Recalculación:** El DTO `UpdateFacturaDto` incluye `recalcularImpuestos` pero aún no se implementa en el servicio
4. **Validación Lado Servidor:** Todas las validaciones se hacen en el servicio; los DTOs solo validan tipos

---

## Métricas de Completitud

✅ **FASE 5 COMPLETADA EN 90%**

Completado:
- ✅ Endpoints de cambio de estado (emitir, anular, marcar pagada)
- ✅ Endpoint de historial de cambios
- ✅ DTOs de entrada con validación
- ✅ DTOs de respuesta documentados
- ✅ Autorización por rol y hotel
- ✅ Auditoría automática
- ✅ Backward compatibility con `estado`

Pendiente:
- ⏳ Implementar `recalcularImpuestos` en método `update()`
- ⏳ Crear componentes frontend para UI de cambios de estado
- ⏳ Crear vista de historial en frontend
- ⏳ E2E testing de flujos completos

---

Fecha de completitud de FASE 5: 15/03/2026
