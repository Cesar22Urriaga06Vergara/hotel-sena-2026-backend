# RESUMEN EJECUTIVO: FASE 9  
**Sincronización Automática mediante Eventos/Listeners (EventEmitter2)**

**Generado:** 5 de abril de 2026  
**Estado:** AUDITORÍA COMPLETA ✅  
**Estimación:** 16 horas

---

## 📋 Visión General

FASE 9 implementa un sistema de **sincronización automática en tiempo real** entre Pedidos, Facturas y Pagos usando patrones de Event-Driven Architecture (EDA). Los cambios de estado se propagan automáticamente sin código acoplado, manteniendo la integridad transaccional.

### Objetivo Principal
✅ Sincronizar cambios entre Pedidos → Facturas → Pagos en tiempo real  
✅ Webhooks para notificación a sistemas externos del cliente  
✅ Prevenir ciclos infinitos y garantizar transacciones seguras  
✅ Retry automático con exponential backoff para robustez

---

## 🎯 Alcance FASE 9

### ✅ Dentro del Alcance
- ✅ EventEmitter2 configurado en AppModule
- ✅ 12 eventos definidos (Pedido + Factura + Pago)
- ✅ 4 listeners síncronos (Pedido → DetalleFactura, Pago → Factura)
- ✅ 1 listener asincrónico (Factura → Webhooks)
- ✅ WebhookService con delivery + retry logic
- ✅ 5 endpoints webhook management API
- ✅ 3 tablas de BD (webhook_subscriptions, webhook_events_log, event_audit_log)
- ✅ Validación de transiciones de estado
- ✅ Prevención de ciclos infinitos
- ✅ Tests E2E completos

### ❌ Fuera del Alcance
- ❌ BullMQ (queue de fondo) - implementado con fetch/promises simple por ahora
- ❌ WebSocket para notificaciones en tiempo real
- ❌ Sistema de webhooks de firma OAuth (HMAC-SHA256 suficiente)
- ❌ UI dashboard para management de webhooks

---

## 📊 Diagrama de Flujos

### Flujo 1: Pedido → Factura

```
┌─────────────────────────────────────────────┐
│ ServicioService.crearPedido()               │
│  ├─ INSERT pedido (estado=pendiente)        │
│  └─ EMIT 'pedido.creado'                    │
└────────────────────┬────────────────────────┘
                     │ SYNC EVENT
                     ▼
┌─────────────────────────────────────────────┐
│ FacturaService.handlePedidoCreado()         │
│  ├─ @OnEvent('pedido.creado')               │
│  ├─ Buscar factura BORRADOR                 │
│  ├─ Si no existe: crear nueva (BORRADOR)    │
│  ├─ INSERT detalle_facturas                 │
│  │  └─ estado = PENDIENTE_ENTREGA           │
│  └─ RECALCULAR totales factura              │
└─────────────────────────────────────────────┘
```

### Flujo 2: Cambio Estado Pedido → Cambio DetalleFactura

```
┌─────────────────────────────────────────────┐
│ ServicioService.actualizarEstadoPedido()    │
│  ├─ UPDATE pedidos (estado=entregado)       │
│  └─ EMIT 'pedido.estado_cambio'             │
└────────────────────┬────────────────────────┘
                     │ SYNC EVENT
                     ▼
┌─────────────────────────────────────────────┐
│ FacturaService.handlePedidoEstadoCambio()   │
│  ├─ @OnEvent('pedido.estado_cambio')        │
│  ├─ UPDATE detalle_facturas.estado          │
│  ├─ SI todos detalles ENTREGADO:            │
│  │  └─ UPDATE factura.estado = PAGADA       │
│  │  └─ EMIT 'factura.pagada'                │
│  └─ RECALCULAR totales si hay cancelados    │
└─────────────────────────────────────────────┘
```

### Flujo 3: Pago → Factura Pagada

```
┌─────────────────────────────────────────────┐
│ PagoService.registrarPago()                 │
│  ├─ INSERT pago                             │
│  └─ EMIT 'pago.registrado'                  │
└────────────────────┬────────────────────────┘
                     │ SYNC EVENT
                     ▼
┌─────────────────────────────────────────────┐
│ FacturaService.handlePagoRegistrado()       │
│  ├─ @OnEvent('pago.registrado')             │
│  ├─ Calcular: totalPagado = SUM(pagos)      │
│  ├─ SI totalPagado >= total factura:        │
│  │  └─ UPDATE factura.estado = PAGADA       │
│  │  └─ EMIT 'factura.pagada'                │
│  └─ RECALCULAR saldo pendiente              │
└─────────────────────────────────────────────┘
```

### Flujo 4: Factura Pagada → Webhooks Externos (ASYNC)

```
┌─────────────────────────────────────────────┐
│           'factura.pagada' emitted           │
│      (desde handlePedidoEstadoCambio         │
│       o handlePagoRegistrado)                │
└────────────────────┬────────────────────────┘
                     │ ASYNC EVENT
                     ▼
┌─────────────────────────────────────────────┐
│ WebhookService.handleFacturaPagada()        │
│  ├─ @OnEvent('factura.pagada', async: true) │
│  ├─ Buscar suscripciones WHERE evento=...   │
│  ├─ Para cada suscripción:                  │
│  │  ├─ INSERT webhook_events_log (pending)  │
│  │  └─ deliverWebhook() async               │
│  └─ No bloquea request                      │
└────────────────────┬────────────────────────┘
                     │ ASYNC DELIVERY
                     ▼
        ┌────────────────────────┐
        │ Fetch POST a cliente    │
        │ + HMAC-SHA256 signature │
        │ + Retry con backoff     │
        └────────────────────────┘
```

---

## 🏗️ Arquitectura de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        APP.MODULE                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ EventEmitterModule.forRoot()                           │  │
│  │  └─ wildcard: false (eventos específicos)              │  │
│  │  └─ maxListeners: 10                                  │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ ServicioMod  │    │ FacturaMod   │    │ PagoMod      │
├──────────────┤    ├──────────────┤    ├──────────────┤
│ - Emitir:    │    │ - Listeners: │    │ - Emitir:    │
│  pedido.     │    │  pedido.     │    │  pago.       │
│  creado      │    │  creado      │    │  registrado  │
│  pedido.     │    │  pedido.est. │    │              │
│  estado_     │    │  cambio      │    │              │
│  cambio      │    │  pago.reg.   │    │              │
│              │    │              │    │              │
│              │    │ - Emitir:    │    │              │
│              │    │  factura.    │    │              │
│              │    │  pagada      │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ WebhookMod   │
                    ├──────────────┤
                    │ - Listener:  │
                    │  factura.    │
                    │  pagada      │
                    │              │
                    │ - Delivery:  │
                    │  POST cliente │
                    │  + Signature  │
                    │  + Retry     │
                    └──────────────┘
```

---

## 📈 Eventos Implementados (12 Total)

### Categoría: PEDIDO (3 eventos)

| Evento | Emite | Listener | Acción |
|--------|-------|----------|--------|
| `pedido.creado` | ServicioService.crearPedido() | FacturaService | Crear DetalleFactura |
| `pedido.estado_cambio` | ServicioService.actualizarEstadoPedido() | FacturaService | Actualizar DetalleFactura.estado |
| `pedido.cancelado` | ServicioService.cancelarPedido() | FacturaService | Marcar detalle CANCELADO |

### Categoría: FACTURA (4 eventos)

| Evento | Emite | Listener | Acción |
|--------|-------|----------|--------|
| `factura.creada` | FacturaService.crearFactura() | (audit log) | Registrar creación |
| `factura.estado_cambio` | FacturaService.cambiarEstado() | WebhookService | Delivery webhook |
| `factura.pagada` | FacturaService.cambiarEstado() | WebhookService | Notificar cliente |
| `factura.anulada` | FacturaService.anularFactura() | WebhookService | Notificar anulación |

### Categoría: PAGO (3 eventos)

| Evento | Emite | Listener | Acción |
|--------|-------|----------|--------|
| `pago.registrado` | PagoService.registrarPago() | FacturaService | Actualizar factura.estado |
| `pago.confirmado` | PagoService.confirmarPago() | WebhookService | Delivery webhook |
| `pago.devuelto` | PagoService.devolverPago() | FacturaService | Reabrir factura |

### Categoría: WEBHOOK (2 eventos)

| Evento | Emite | Acción |
|--------|-------|--------|
| `webhook.delivery_success` | WebhookService | Log exitoso |
| `webhook.delivery_failed` | WebhookService | Log fallido + retry |

---

## 🔐 Seguridad y Validaciones

### ✅ Firmado de Webhooks

```
Header: X-Webhook-Signature: HMAC-SHA256(secret, body)

Algoritmo:
  1. secret = suscripción.secret (64 chars hex)
  2. payload = JSON.stringify(evento)
  3. signature = HMAC-SHA256(secret, payload).toHex()
  4. Enviar en header X-Webhook-Signature

Cliente valida:
  let sig = HMAC-SHA256(su_secret, body_recibido)
  assert(sig === header['X-Webhook-Signature'])
```

### ✅ Ciclos Infinitos Prevenidos

```typescript
// En listener, SIEMPRE validar estado anterior
@OnEvent('pedido.estado_cambio')
async handle(evento: PedidoEstadoCambioEvent) {
  // ❌ MAL: no verifica estado anterior
  this.eventEmitter.emit('pedido.estado_cambio', evento);

  // ✅ BIEN: verifica que no es el mismo estado
  if (evento.estadoAnterior === evento.estadoNuevo) {
    return; // No emitir evento
  }
}
```

### ✅ Transaction Safety

```
LISTENERS SÍNCRONOS:
├─ Ejecutan en MISMA transacción que SaveChanges
├─ Si fallan → Rollback todo
├─ Garantizan consistencia ACID
└─ Uso: async: false (por defecto)

LISTENERS ASINCRONOS:
├─ Se ejecutan DESPUÉS de commit
├─ No pueden rollback el negocio
├─ Fallos no afectan request
└─ Uso: async: true
```

---

## 📊 Estado vs Transiciones

### Factura: State Machine

```
┌──────────┐
│ BORRADOR │ ← Creada, sin confirmar
└────┬─────┘
     │ confirmar()
     ▼
┌──────────┐
│ EDITABLE │ ← Puede modificarse
└────┬─────┘
     │ emitir()
     ▼
┌──────────┐
│ EMITIDA  │ ← Oficial, enviada a cliente
└────┬─────┘
     │ pagar() O entregas completas
     ▼
┌──────────┐
│ PAGADA   │ ← Terminal (no más cambios)
└──────────┘

┌──────────┐
│ ANULADA  │ ← Terminal (no más cambios)
└──────────┘
```

### Pedido: State Machine

```
┌──────────┐
│ PENDIENTE│ ← Orden recibida
└────┬─────┘
     │
  ┌──┴──┐
  ▼     ▼
EN_PREP CANCELADO
  │       ▲
  │       │ (desde cualquier estado no terminal)
  ▼
LISTO
  │
  ▼
ENTREGADO ← Terminal
```

---

## 🔄 Retry Logic

### Exponential Backoff

```
Intento 1: 2 segundos
Intento 2: 4 segundos
Intento 3: 8 segundos
Intento 4: 16 segundos
Intento 5: 32 segundos
Max: 86400 segundos (24 horas)

Fórmula: delay = min(2^n segundos, 24h)
```

### Tabla webhook_events_log

```
┌────────┬────────────────────────┬──────────┐
│ id     │ evento_payload         │ status   │
├────────┼────────────────────────┼──────────┤
│ 1      │ {factura.pagada...}    │ null     │ ← Pendiente
│ 2      │ {factura.pagada...}    │ 200      │ ← Success
│ 3      │ {factura.pagada...}    │ 500      │ ← Server error
│ 4      │ {factura.pagada...}    │ 408      │ ← Timeout
└────────┴────────────────────────┴──────────┘

intentos: 0-5
proxima_retry: timestamp
codigo_error: 'timeout', 'connection_refused', etc.
response_body: respuesta del servidor cliente
```

---

## 📋 Tabla de Requisitos de FASE 8 → FASE 9

| Requisito | FASE 8 | FASE 9 | Integración |
|-----------|--------|--------|-------------|
| CRUD Facturas | ✅ | Usa | Emite eventos |
| CRUD DetallesFactura | ✅ | Usa | Escucha eventos |
| CRUD Pedidos | ✅ | Usa | Emite eventos |
| CRUD Pagos | ✅ | Usa | Emite eventos |
| KPIs | ✅ | Lectura | Vista actualizada |
| Reportes | ✅ | Lectura | Datos en tiempo real |
| RBAC | ✅ | Usa | Auth en webhooks |

---

## ⏱️ Timeline Detallado: 16 Horas

| Paso | Tarea | Duración | Cumulative |
|------|-------|----------|-----------|
| 1 | Configurar EventEmitter2 en AppModule | 0.5h | 0.5h |
| 2 | Crear DTOs de eventos (12 clases) | 0.75h | 1.25h |
| 3 | Crear tablas en BD (SQL) | 1h | 2.25h |
| 4 | Emitir pedido.creado | 0.5h | 2.75h |
| 5 | Emitir pedido.estado_cambio | 0.5h | 3.25h |
| 6 | Listener handlePedidoCreado | 1h | 4.25h |
| 7 | Listener handlePedidoEstadoCambio | 1.5h | 5.75h |
| 8 | Emitir pago.registrado | 0.5h | 6.25h |
| 9 | Listener handlePagoRegistrado | 1h | 7.25h |
| 10 | Crear WebhookService | 1.5h | 8.75h |
| 11 | Crear WebhookController | 0.75h | 9.5h |
| 12 | Crear DTOs + Entities webhook | 1h | 10.5h |
| 13 | Crear WebhookModule | 0.5h | 11h |
| 14 | Registrar WebhookModule en AppModule | 0.25h | 11.25h |
| 15 | Tests E2E completos | 2h | 13.25h |
| 16 | Deploy y validación final | 1h | 14.25h |
| **BUFFER** | **Troubleshooting + dokumentación** | **1.75h** | **16h** |

---

## 🎯 Hitos Intermedios (Deployables)

```
DESPUÉS DEL PASO 5:
✅ EventEmitter configurado
✅ DTOs definidos
✅ Pedidos emiten eventos
→ Estado: Pre-Listeners (sin riesgos)

DESPUÉS DEL PASO 7:
✅ Listeners de pedido implementados
✅ DetallesFactura se sincronizan
→ Estado: Sincronización Pedido-Factura LIVE

DESPUÉS DEL PASO 9:
✅ Listeners de pago implementados
✅ Facturas se marcan como PAGADAS
→ Estado: Sincronización Completa LIVE

DESPUÉS DEL PASO 14:
✅ Webhooks configurados
✅ Notificaciones a clientes externos
→ Estado: FASE 9 COMPLETA
```

---

## ⚠️ Riesgos Principales

### CRÍTICO: Ciclos Infinitos (Mitigation: Validar estado anterior)

```
Riesgo: A emite → B escucha y emite → A escucha (infinito)
Severidad: CRÍTICO - Crash del app
Mitigation: @OnEvent valida estadoAnterior !== estadoNuevo
Test: Unit test de ciclos
```

### ALTO: Fallo de Listener Síncrono (Mitigation: Try-catch + logging)

```
Riesgo: Listener síncrono falla → Rollback del pedido/pago
Severidad: ALTO - Operación fallida
Mitigation: Try-catch en listener, re-lanzar para rollback controlado
Test: Esperamos que listener falle y se rollback
```

### ALTO: Webhook No Entregado (Mitigation: Retry + audit log)

```
Riesgo: Cliente no se entera del pago
Severidad: ALTO - Cliente reclama
Mitigation: Retry exponencial + dashboard de event log
Test: E2E con webhook.site
```

### MEDIO: Duplicación de Eventos

```
Riesgo: Emit two veces por error
Severidad: MEDIO - Duplicados innecesarios
Mitigation: Validación de idFactura único en webhook_events_log
Test: Verificar num eventos = num intentos
```

---

## 🔍 Validación y Testing

### Unit Tests Requeridos

```typescript
describe('Eventos FASE 9', () => {
  expect('pedido.creado').toEmitCreateDetailFactura();
  expect('pedido.estado_cambio').toUpdateDetailFacturaStatus();
  expect('pago.registrado').toUpdateFacturaState();
  expect('factura.pagada').toTriggerWebhookDelivery();
  expect('ciclo infinito').toNotOccur(); // Validar estado anterior
});
```

### E2E Tests Requeridos

```typescript
describe('FASE 9 E2E', () => {
  it('Flujo pedido → entrega → pago → factura pagada', () => {
    1. crearPedido() → verificar detalle creado
    2. actualizarEstadoPedido(entregado) → verificar detalle.estado
    3. registrarPago() → verificar factura.PAGADA
    4. buscarWebhookLog() → verificar delivery encolado
  });

  it('Webhook retry on failure', () => {
    1. Mock servidor cliente retorna 500
    2. Verificar webhook_events_log.status = 500
    3. Verificar webhook_events_log.proxima_retry != null
    4. POST retry endpoint
    5. Verificar nueva entrega
  });
});
```

---

## 📞 Endpoints Webhook API

### Crear Suscripción
```
POST /hoteles/1/webhooks
{
  "evento": "factura.pagada",
  "url": "https://cliente.com/webhook",
  "secret": "optional_32_char_key"
}
```

### Listar Suscripciones
```
GET /hoteles/1/webhooks
→ [ { id, evento, url, activo, createdAt } ]
```

### Ver Event Log
```
GET /hoteles/1/webhooks/1/events?limit=50
→ [ { id, evento, status, intentos, proxima_retry } ]
```

### Reintentar Delivery
```
POST /hoteles/1/webhooks/1/retry/123
→ { message: "Reintento procesado" }
```

### Desactivar Suscripción
```
DELETE /hoteles/1/webhooks/1
→ { message: "Suscripción desactivada" }
```

---

## 📚 Documentación Generada

| Documento | Archivo | Propósito |
|-----------|---------|-----------|
| **Análisis Detallado** | ANALISIS_EVENTOS_FASE9.md | 10 hallazgos + arquitectura |
| **Plan Secuencial** | PLAN_IMPLEMENTACION_FASE9.md | 16 pasos código ready-to-copy |
| **Resumen Ejecutivo** | RESUMEN_EVENTOS_FASE9.md | Este documento |

---

## ✅ Éxito: Criterios de Aceptación

### Funcionales
- ✅ Crear pedido → DetalleFactura creado automáticamente
- ✅ Cambiar pedido a entregado → DetalleFactura.estado = ENTREGADO
- ✅ Registrar pago completo → Factura.estado = PAGADA
- ✅ Factura.pagada triggers webhook delivery
- ✅ Webhook delivery con retry exponencial (5 intentos)

### No-Funcionales
- ✅ Latencia <100ms para listeners síncronos
- ✅ Webhook delivery async (no bloquea request)
- ✅ Tests E2E pass 100%
- ✅ Logs detallados en event_audit_log
- ✅ Prevención de ciclos infinitos validada

### Operacionales
- ✅ Dashboard para ver webhook_events_log
- ✅ Manual retry de webhooks fallidos
- ✅ Audit trail completo en event_audit_log
- ✅ Alertas para failures (opcional)

---

## 🚀 Post-FASE 9 (Futuro)

### FASE 10: Webhook Dashboard UI
- ✅ Panel admin para crear/listar webhooks
- ✅ Gráficos de delivery success rate
- ✅ Search en event log

### FASE 11: Notificaciones en Tiempo Real (WebSocket)
- ✅ Cliente recibe 'factura.pagada' vía WebSocket
- ✅ Notifications badge en UI
- ✅ Chat en vivo para soporte

### FASE 12: Queue de Fondo (BullMQ)
- ✅ Migrar webhook delivery a BullMQ
- ✅ Worker processes separados
- ✅ Escalabilidad horizontal

---

## 📞 Contacto Audit

**Auditoría realizada por:** GitHub Copilot  
**Fecha:** 5 de abril de 2026  
**Sistema:** NestJS + TypeORM + EventEmitter2  
**Líneas de código estimadas:** 2500-3000  
**Puntos potenciales de falla:** 3 (ciclos, transacciones, webhooks)

---

**FASE 9 LISTA PARA IMPLEMENTACIÓN** ✅

Proceder con PLAN_IMPLEMENTACION_FASE9.md (16 pasos)
