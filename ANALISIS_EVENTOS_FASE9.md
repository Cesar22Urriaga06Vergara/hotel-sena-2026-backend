# ANÁLISIS EXHAUSTIVO: FASE 9 - Eventos/Listeners  
**Sincronización automática mediante EventEmitter2 y Webhooks**

**Fecha de auditoría:** 5 de abril de 2026  
**Estimación:** 16 horas de implementación  
**Sistema:** NestJS + TypeORM + EventEmitter2 + BullMQ

---

## 1. HALLAZGO: Estado Actual del Sistema de Eventos

### 📋 Diagnóstico
- ✅ **App.module.ts:** No importa `EventEmitterModule` de `@nestjs/event-emitter`
- ✅ **Servicios existentes:** FacturaService, ServicioService, PagoService están estructurados para agregar listeners
- ✅ **Entidades críticas:** Pedido (estadoPedido), Factura (estadoFactura), DetalleFactura (estado)
- ❌ **Tablas webhook:** No existen aún `webhook_subscriptions` ni `webhook_events_log`
- ❌ **DTOs para eventos:** No existen clases typed para payload de eventos

### 🔴 Riesgos Identificados

| Riesgo | Impacto | Mitigation |
|--------|---------|-----------|
| Cambios de estado sin sincronización → DetallesFactura quedan desincronizados | **CRÍTICO** | Listeners síncronos en Pedido → DetalleFactura |
| Fallos en webhooks → Cliente no se entera de pagos/entregas | **ALTO** | Queue con retry exponential (BullMQ) |
| Ciclos infinitos de eventos (A→B→A) | **ALTO** | Validación de estado anterior en listeners |
| Pérdida de auditoría de cambios originados por eventos | **MEDIO** | Tabla `event_audit_log` para tracking |

---

## 2. HALLAZGO: Mapeo Completo Eventos → Listeners → Acciones

### 📊 Matriz de Flujos

```
┌─────────────────────────────────────────────────────────────────┐
│                     PEDIDO → FACTURA SYNC                        │
└─────────────────────────────────────────────────────────────────┘

Evento: pedido.creado
  ├─ Emite: ServicioService.crearPedido()
  ├─ Listener: @OnEvent('pedido.creado') en FacturaService
  ├─ Acción: agregarDetalleFacturaDesdeP edido()
  │  └─ Busca factura BORRADOR activa
  │  └─ Si no existe: crear nueva Factura
  │  └─ Insertar DetalleFactura ligado a Pedido
  │  └─ Recalcular totales facturas
  └─ Transacción: SÍNCRONO (rollback si falla)

Evento: pedido.estado_cambio
  ├─ Emite: ServicioService.actualizarEstadoPedido()
  ├─ Payload: { idPedido, estadoAnterior, estadoNuevo, timestamp }
  ├─ Listener: @OnEvent('pedido.estado_cambio') en FacturaService
  ├─ Acciones por estado:
  │  ├─ estadoNuevo = 'entregado'
  │  │  └─ FacturaService.marcarDetalleEntregado(idPedido)
  │  │  └─ Trigger: factura.detalles_entregados_cambio
  │  │  └─ Si todos detalles ENTREGADO → factura.estadoFactura = 'PAGADA'
  │  ├─ estadoNuevo = 'cancelado'
  │  │  └─ FacturaService.marcarDetalleCancelado(idPedido)
  │  │  └─ Recalcular totales con MONTO DESCUENTO
  │  │  └─ Si > cancelados que pendientes → Marcar factura ANULADA
  │  └─ estadoNuevo = 'listo'
  │     └─ Solo log, no afecta factura
  └─ Transacción: SÍNCRONO


┌─────────────────────────────────────────────────────────────────┐
│                          PAGO → FACTURA SYNC                     │
└─────────────────────────────────────────────────────────────────┘

Evento: pago.registrado
  ├─ Emite: PagoService.registrarPago()
  ├─ Listener: @OnEvent('pago.registrado') en FacturaService
  ├─ Acción: actualizarEstadoFacturaDesdeP ago()
  │  ├─ Calcular: totalPagado = SUM(pagos WHERE estado='completado')
  │  ├─ Si totalPagado == total → cambiar a 'PAGADA'
  │  ├─ Si totalPagado > 0 && < total → registrar duda
  │  └─ Emitir evento: factura.estado_cambio (para webhooks)
  └─ Transacción: SÍNCRONO

Evento: pago.devuelto / pago.revertido
  ├─ Emite: PagoService.revertirPago()
  ├─ Listener: @OnEvent('pago.devuelto') en FacturaService
  ├─ Acción: reabrirFacturaParaCobro()
  │  ├─ Si factura.estadoFactura = 'PAGADA' → cambiar a 'EMITIDA'
  │  └─ Emitir webhook: pago.reverso (async)
  └─ Transacción: SÍNCRONO


┌─────────────────────────────────────────────────────────────────┐
│              FACTURA CAMBIOS → WEBHOOKS EXTERNOS (ASYNC)         │
└─────────────────────────────────────────────────────────────────┘

Evento: factura.estado_cambio (INTERNO)
  ├─ Emite: FacturaService.cambiarEstadoFactura()
  ├─ Listener 1: @OnEvent('factura.estado_cambio') en WebhookService
  ├─ Acción: dispatchWebhooks('factura.pagada' SI estado = PAGADA)
  │  ├─ Buscar suscripciones: webhook_subscriptions WHERE evento='factura.pagada'
  │  ├─ Para cada suscripción:
  │  │  ├─ Crear registro en webhook_events_log
  │  │  ├─ Encolar en BullMQ con delay=0
  │  │  └─ STATUS: pending
  │  └─ Transacción: NO BLOQUEA (async)

Evento: factura.emitida, factura.nulificada
  ├─ Similar a factura.estado_cambio
  └─ Webhookear a clientes suscritos
```

---

## 3. HALLAZGO: Definición de Payloads para Eventos (DTOs)

### 🎯 Events Tipificados

```typescript
// src/events/pedido.events.ts
export class PedidoCreladoEvent {
  idPedido: number;
  idReserva: number;
  idCliente: number;
  idHotel: number;
  totalPedido: number;
  timestamp: Date;
  usuarioId?: number;
}

export class PedidoEstadoCambioEvent {
  idPedido: number;
  idReserva: number;
  idHotel: number;
  estadoAnterior: string;
  estadoNuevo: string;
  categoria: string;
  totalPedido: number;
  timestamp: Date;
  usuarioId?: number;
}

export class PedidoCanceladoEvent {
  idPedido: number;
  idReserva: number;
  idHotel: number;
  razonCancelacion?: string;
  timestamp: Date;
  usuarioId?: number;
}

// src/events/factura.events.ts
export class FacturaEstadoCambioEvent {
  idFactura: number;
  idReserva: number;
  idCliente: number;
  idHotel: number;
  estadoAnterior: string;
  estadoNuevo: string;
  total: number;
  timestamp: Date;
  usuarioId?: number;
}

export class FacturaPagadaEvent {
  idFactura: number;
  idCliente: number;
  nombreCliente: string;
  emailCliente: string;
  idHotel: number;
  total: number;
  numeroFactura: string;
  timestamp: Date;
  metodoPago?: string;
}

// src/events/pago.events.ts
export class PagoRegistradoEvent {
  idPago: number;
  idFactura: number;
  idCliente: number;
  monto: number;
  idMedioPago: number;
  timestamp: Date;
  usuarioId?: number;
}

export class PagoDevolutoEvent {
  idPago: number;
  idFactura: number;
  monto: number;
  razon: string;
  timestamp: Date;
  usuarioId?: number;
}
```

---

## 4. HALLAZGO: Entidades de BD para Webhooks

### 🗄️ Schema SQL Completo

```sql
-- Tabla: webhook_subscriptions
-- Propósito: Registrar dónde webhookear eventos del hotel
CREATE TABLE webhook_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_hotel INT NOT NULL,
  evento VARCHAR(100) NOT NULL COMMENT 'factura.pagada, pedido.entregado, pago.confirmado',
  url VARCHAR(2000) NOT NULL COMMENT 'URL callback del cliente',
  secret VARCHAR(255) NOT NULL COMMENT 'Clave para HMAC-SHA256',
  activo BOOLEAN DEFAULT true,
  retentos_restantes INT DEFAULT 5,
  proxima_retry DATETIME DEFAULT NULL,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME DEFAULT NULL,
  
  UNIQUE KEY unique_hotel_evento_url (id_hotel, evento, url),
  FOREIGN KEY (id_hotel) REFERENCES hoteles(id) ON DELETE CASCADE,
  INDEX idx_evento (evento),
  INDEX idx_activo (activo),
  INDEX idx_proxima_retry (proxima_retry)
);

-- Tabla: webhook_events_log
-- Propósito: Audit trail de intentos de entrega
CREATE TABLE webhook_events_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  webhook_subscription_id INT NOT NULL,
  evento VARCHAR(100) NOT NULL,
  status INT COMMENT 'HTTP status: 200, 500, timeout, etc',
  response_body TEXT COMMENT 'Respuesta del servidor cliente',
  response_headers JSON COMMENT 'Headers de respuesta',
  
  intentos INT DEFAULT 1,
  proxima_retry TIMESTAMP DEFAULT NULL COMMENT 'Cuándo reintentar (exponential backoff)',
  
  evento_payload JSON NOT NULL COMMENT 'Payload original del evento',
  codigo_error VARCHAR(100) COMMENT 'timeout, connection_refused, etc',
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (webhook_subscription_id) REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_proxima_retry (proxima_retry),
  INDEX idx_evento (evento),
  INDEX idx_intentos (intentos)
);

-- Tabla: event_audit_log
-- Propósito: Rastrear qué evento causó qué cambio
CREATE TABLE event_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  evento_nombre VARCHAR(100),
  evento_payload JSON,
  
  entidad_afectada VARCHAR(100) COMMENT 'factura, detalle_factura, pedido',
  id_entidad INT,
  cambios_aplicados JSON COMMENT '{ campo: valor_anterior → valor_nuevo }',
  
  resultado VARCHAR(20) COMMENT 'success, error (con mensaje)',
  id_usuario INT,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_evento (evento_nombre),
  INDEX idx_entidad (entidad_afectada, id_entidad),
  INDEX idx_usuario (id_usuario)
);
```

---

## 5. HALLAZGO: Patrón EventEmitter2 en NestJS

### 🏗️ Arquitectura de Implementación

```typescript
// ✅ PATRÓN 1: Configurar EventEmitter en app.module.ts
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    // ... otros imports
    EventEmitterModule.forRoot({
      wildcard: false,         // No permitir patrones tipo 'pedido.*'
      delimiter: '.',          // Usar '.' para separador
      newListener: false,      // No emitir evento al agregar listener
      removeListener: false,   // No emitir evento al remover listener
      maxListeners: 10,        // Max listeners por evento
      verboseLogging: true,    // Logs detallados en dev
    }),
  ],
  // ...
})
export class AppModule {}
```

### 🎯 PATRÓN 2: Emitir Eventos (En ServicioService)

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PedidoCreladoEvent } from '../events/pedido.events';

@Injectable()
export class ServicioService {
  constructor(
    private eventEmitter: EventEmitter2,
    // ... otros injects
  ) {}

  async crearPedido(dto: CreatePedidoDto): Promise<Pedido> {
    const pedido = this.pedidoRepository.create({
      ...dto,
      estadoPedido: 'pendiente',
      fechaPedido: new Date(),
    });

    const saved = await this.pedidoRepository.save(pedido);

    // ✅ EMITIR EVENTO SÍNCRONO (executa listeners antes de retornar)
    const evento = new PedidoCreladoEvent();
    evento.idPedido = saved.id;
    evento.idReserva = saved.idReserva;
    evento.totalPedido = saved.totalPedido;
    evento.timestamp = new Date();

    this.eventEmitter.emit('pedido.creado', evento);

    return saved;
  }

  async actualizarEstadoPedido(
    idPedido: number,
    dto: UpdateEstadoPedidoDto,
  ): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({ where: { id: idPedido } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    const estadoAnterior = pedido.estadoPedido;
    const estadoNuevo = dto.estadoPedido;

    // Validar transición
    const TRANSICIONES_VALIDAS: Record<string, string[]> = {
      pendiente: ['en_preparacion', 'cancelado'],
      en_preparacion: ['listo', 'entregado', 'cancelado'],
      listo: ['entregado', 'cancelado'],
      entregado: [],
      cancelado: [],
    };

    if (!TRANSICIONES_VALIDAS[estadoAnterior]?.includes(estadoNuevo)) {
      throw new BadRequestException(
        `No se puede pasar de ${estadoAnterior} a ${estadoNuevo}`
      );
    }

    pedido.estadoPedido = estadoNuevo;
    pedido.fechaActualizacion = new Date();

    if (estadoNuevo === 'entregado') {
      pedido.fechaEntrega = new Date();
    }

    const updated = await this.pedidoRepository.save(pedido);

    // ✅ EMITIR EVENTO CON CONTEXTO HISTÓRICO
    const evento = new PedidoEstadoCambioEvent();
    evento.idPedido = updated.id;
    evento.estadoAnterior = estadoAnterior;
    evento.estadoNuevo = estadoNuevo;
    evento.timestamp = new Date();

    this.eventEmitter.emit('pedido.estado_cambio', evento);

    return updated;
  }
}
```

### 👂 PATRÓN 3: Escuchar Eventos (En FacturaService)

```typescript
import { OnEvent } from '@nestjs/event-emitter';
import { PedidoCreladoEvent, PedidoEstadoCambioEvent } from '../events/pedido.events';

@Injectable()
export class FacturaService {
  constructor(
    @InjectRepository(Factura) private facturaRepository: Repository<Factura>,
    @InjectRepository(DetalleFactura) private detalleRepository: Repository<DetalleFactura>,
    @InjectRepository(Pedido) private pedidoRepository: Repository<Pedido>,
    private eventEmitter: EventEmitter2,
  ) {}

  // ✅ Listener SÍNCRONO: Se ejecuta en la misma transacción
  @OnEvent('pedido.creado', { async: false })
  async handlePedidoCreado(evento: PedidoCreladoEvent) {
    console.log(`[PEDIDO CREADO EVENT] ID=${evento.idPedido}`);

    try {
      // Buscar factura activa BORRADOR
      let factura = await this.facturaRepository.findOne({
        where: {
          idReserva: evento.idReserva,
          estadoFactura: 'BORRADOR',
        },
      });

      // Si no existe, crear nueva
      if (!factura) {
        factura = this.facturaRepository.create({
          idReserva: evento.idReserva,
          idCliente: evento.idCliente,
          idHotel: evento.idHotel,
          numeroFactura: await this.generarNumeroFactura(),
          estadoFactura: 'BORRADOR',
          subtotal: 0,
          total: 0,
        });
        factura = await this.facturaRepository.save(factura);
      }

      // Agregar detalle
      const detalle = this.detalleRepository.create({
        idFactura: factura.id,
        idPedido: evento.idPedido,
        descripcion: `Pedido #${evento.idPedido}`,
        monto: evento.totalPedido,
        estado: 'PENDIENTE_ENTREGA',
      });

      await this.detalleRepository.save(detalle);

      // Recalcular totales de factura
      factura.subtotal = await this.calcularSubtotal(factura.id);
      factura.total = await this.calcularTotal(factura.id);
      await this.facturaRepository.save(factura);

    } catch (error) {
      console.error('[ERROR] handlePedidoCreado:', error);
      throw error; // Re-lanzar para rollback si está en transacción
    }
  }

  @OnEvent('pedido.estado_cambio', { async: false })
  async handlePedidoEstadoCambio(evento: PedidoEstadoCambioEvent) {
    console.log(
      `[PEDIDO ESTADO CAMBIO] ${evento.estadoAnterior} → ${evento.estadoNuevo}`
    );

    try {
      // Buscar detalle factura vinculado al pedido
      const detalle = await this.detalleRepository.findOne({
        where: { idPedido: evento.idPedido },
      });

      if (!detalle) {
        console.warn(`[WARN] No hay detalle para pedido ${evento.idPedido}`);
        return;
      }

      const estadoAnterior = detalle.estado;

      // Actualizar estado del detalle según estado del pedido
      if (evento.estadoNuevo === 'entregado') {
        detalle.estado = 'ENTREGADO';
      } else if (evento.estadoNuevo === 'cancelado') {
        detalle.estado = 'CANCELADO';
        detalle.monto = 0; // Descuento por cancelación
      } else if (evento.estadoNuevo === 'listo') {
        detalle.estado = 'LISTO';
      }
      // pendiente y en_preparación no afectan factura

      await this.detalleRepository.save(detalle);

      // Verificar si todos los detalles están entregados
      if (evento.estadoNuevo === 'entregado') {
        const factura = await this.facturaRepository.findOne({
          where: { id: detalle.idFactura },
          relations: ['detalles'],
        });

        const todosEntregados = factura.detalles.every(
          (d) => d.estado === 'ENTREGADO' || d.estado === 'CANCELADO'
        );

        if (todosEntregados && factura.estadoFactura === 'EMITIDA') {
          factura.estadoFactura = 'PAGADA';
          await this.facturaRepository.save(factura);

          // ✅ EMITIR NUEVO EVENTO (factura pagada por entregas)
          const nuevoEvento = new FacturaPagadaEvent();
          nuevoEvento.idFactura = factura.id;
          nuevoEvento.idCliente = factura.idCliente;
          nuevoEvento.total = factura.total;
          nuevoEvento.timestamp = new Date();

          this.eventEmitter.emit('factura.pagada', nuevoEvento);
        }
      }

      // Registrar en auditoría
      console.log(`[AUDIT] Detalle ${detalle.id}: ${estadoAnterior} → ${detalle.estado}`);

    } catch (error) {
      console.error('[ERROR] handlePedidoEstadoCambio:', error);
      throw error;
    }
  }
}
```

---

## 6. HALLAZGO: WebhookService - Lógica de Delivery Async

### 🚀 Implementación de Webhooks con BullMQ

```typescript
// src/webhook/webhook.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  private logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookSubscription)
    private subscriptionRepository: Repository<WebhookSubscription>,
    @InjectRepository(WebhookEventLog)
    private eventLogRepository: Repository<WebhookEventLog>,

    @InjectQueue('webhooks')
    private webhookQueue: Queue,
  ) {}

  /**
   * Listener ASYNC: Se ejecuta en background, no bloquea request
   */
  @OnEvent('factura.pagada', { async: true })
  async handleFacturaPagada(evento: FacturaPagadaEvent) {
    this.logger.log(`[WEBHOOK] Factura pagada: ${evento.idFactura}`);

    // Buscar suscripciones activas para este evento en este hotel
    const suscripciones = await this.subscriptionRepository.find({
      where: {
        idHotel: evento.idHotel,
        evento: 'factura.pagada',
        activo: true,
      },
    });

    if (suscripciones.length === 0) {
      this.logger.warn(`No hay suscripciones para factura.pagada en hotel ${evento.idHotel}`);
      return;
    }

    // Para cada suscripción, encolar job de delivery
    for (const sub of suscripciones) {
      const log = await this.eventLogRepository.create({
        webhookSubscriptionId: sub.id,
        evento: 'factura.pagada',
        eventoPayload: evento,
        status: null,
        intentos: 0,
      });

      await this.eventLogRepository.save(log);

      // Encolar con prioridad alta
      await this.webhookQueue.add(
        'deliver',
        {
          logId: log.id,
          subscriptionId: sub.id,
          evento: evento,
          secret: sub.secret,
          url: sub.url,
        },
        {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000, // 2 segundos inicial
          },
          removeOnComplete: true,
        }
      );

      this.logger.log(
        `[WEBHOOK QUEUED] Log=${log.id}, URL=${sub.url}, Attempts=5`
      );
    }
  }

  /**
   * Procesar job de delivery en worker
   */
  async deliverWebhook(logId: number, secret: string, url: string, evento: any) {
    const log = await this.eventLogRepository.findOne({ where: { id: logId } });

    try {
      // 1. Crear firma HMAC-SHA256
      const payload = JSON.stringify(evento);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      // 2. Hacer POST request con timeout
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'factura.pagada',
          'X-Retry-Count': String(log.intentos),
        },
        body: payload,
        signal: AbortSignal.timeout(30000), // 30 segundos timeout
      });

      // 3. Actualizar log con respuesta
      log.status = response.status;
      log.responseBody = await response.text();
      log.responseHeaders = JSON.stringify(Object.fromEntries(response.headers));

      if (response.ok) {
        this.logger.log(`[WEBHOOK SUCCESS] Log=${logId}, Status=${response.status}`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

      await this.eventLogRepository.save(log);

    } catch (error) {
      log.status = error.name === 'AbortError' ? 408 : 500;
      log.codigoError = error.message;
      log.intentos = (log.intentos || 0) + 1;

      // Calcular próximo retry con exponential backoff
      if (log.intentos < 5) {
        const delayMs = Math.min(
          1000 * Math.pow(2, log.intentos), // 2^n segundos
          86400000 // máximo 24 horas
        );
        log.proximaRetry = new Date(Date.now() + delayMs);
      }

      await this.eventLogRepository.save(log);

      this.logger.error(
        `[WEBHOOK ERROR] Log=${logId}, Attempt=${log.intentos}, Error=${error.message}`
      );

      // Si no es última intentos, relanzar para que BullMQ reintente
      if (log.intentos < 5) {
        throw error;
      }
    }
  }

  /**
   * API: Crear suscripción de webhook
   */
  async crearSuscripcion(hotelId: number, dto: CreateWebhookDto) {
    const suscripcion = await this.subscriptionRepository.create({
      idHotel: hotelId,
      evento: dto.evento,
      url: dto.url,
      secret: crypto.randomBytes(32).toString('hex'),
      activo: true,
    });

    return await this.subscriptionRepository.save(suscripcion);
  }

  /**
   * API: Listar suscripciones de un hotel
   */
  async listarSuscripciones(hotelId: number) {
    return await this.subscriptionRepository.find({
      where: { idHotel: hotelId, deletedAt: null },
      select: ['id', 'evento', 'url', 'activo', 'createdAt'],
    });
  }

  /**
   * API: Obtener log de eventos de una suscripción
   */
  async obtenerEventLog(subscriptionId: number, limit = 50) {
    return await this.eventLogRepository.find({
      where: { webhookSubscriptionId: subscriptionId },
      order: { createdAt: 'DESC' },
      take: limit,
      select: ['id', 'evento', 'status', 'intentos', 'proximaRetry', 'createdAt'],
    });
  }

  /**
   * API: Reintentar delivery manualmente
   */
  async retryDelivery(logId: number) {
    const log = await this.eventLogRepository.findOne({ where: { id: logId } });
    const sub = await this.subscriptionRepository.findOne({
      where: { id: log.webhookSubscriptionId },
    });

    log.intentos = 0;
    log.proximaRetry = null;
    await this.eventLogRepository.save(log);

    await this.webhookQueue.add(
      'deliver',
      {
        logId,
        subscriptionId: sub.id,
        evento: log.eventoPayload,
        secret: sub.secret,
        url: sub.url,
      },
      { attempts: 1 }
    );

    return { message: 'Reintento encolado' };
  }
}
```

---

## 7. HALLAZGO: Transaction Safety - ¿Qué pasa si un Listener Falla?

### ⚠️ Matriz de Manejo de Errores

```
LISTENERS SÍNCRONOS (async: false):
├─ Si listener falla → BadRequestException
├─ Transacción principal → ROLLBACK
├─ Uso: Cambios en detalles factura (críticos)
└─ Ejemplo: pedido.creado → agregarDetalle()

LISTENERS ASINCRONOS (async: true):
├─ Si listener falla → Log error, continuar
├─ Transacción principal → COMMIT (NO AFECTADO)
├─ Retry automático en background
├─ Uso: Webhooks, notificaciones (no-críticas)
└─ Ejemplo: factura.pagada → deliverWebhook()
```

### 🛡️ Implementación Segura

```typescript
// En FacturaService: SÍNCRONO, debe rollback si falla
@OnEvent('pedido.estado_cambio', { async: false })
async handlePedidoEstadoCambio(evento: PedidoEstadoCambioEvent) {
  // Si esto falla, toda la transacción del pedido se rollback
  // ERROR = BadRequest al cliente
  throw new Error('Error crítico');
}

// En WebhookService: ASINCRONCO, nunca bloquea
@OnEvent('factura.pagada', { async: true })
async handleFacturaPagada(evento: FacturaPagadaEvent) {
  // Si esto falla, no afecta la factura.pagada
  // ERROR = Log de error, reintento en background
  await this.webhookQueue.add(...);
}

// EN TRANSACCIÓN: Wrappear listeners síncronos
async actualizarEstadoFactura(id: number, dto: UpdateEstadoFacturaDto) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const factura = await queryRunner.manager.findOne(Factura, { where: { id } });
    factura.estadoFactura = dto.estadoFactura;

    // Listeners síncronos se ejecutan DENTRO de la transacción
    await queryRunner.manager.save(factura);

    // ✅ Emitir evento SÍNCRONO aquí
    this.eventEmitter.emit('factura.estado_cambio', {
      idFactura: factura.id,
      estadoNuevo: dto.estadoFactura,
      // ...
    });

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

## 8. HALLAZGO: Prevención de Ciclos Infinitos

### 🔄 Problema: A Emite → B Escucha y Emite → A Escucha (Infinito)

```
ESCENARIO MALO:
┌─────────────────────────────────────┐
│ FacturaService.cambiarEstado()      │
│  ├─ factura: EMITIDA → PAGADA       │
│  └─ emit('factura.estado_cambio')   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ @OnEvent('factura.estado_cambio')   │
│  ├─ if (estadoNuevo === 'PAGADA')   │
│  ├─ emit('pago.confirmado')         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ @OnEvent('pago.confirmado')         │
│  ├─ cambiarEstado('PAGADA')         │  ❌ YA ES PAGADA
│  └─ emit('factura.estado_cambio')   │  ❌ LOOP
└─────────────────────────────────────┘
```

### ✅ Solución: Validar Estado Anterior

```typescript
@OnEvent('factura.estado_cambio')
async handleFacturaPagada(evento: FacturaEstadoCambioEvent) {
  // ✅ CRÍTICO: Verificar que el evento fue causado por pago
  // NO por otra cosa (ej: ajuste manual)
  
  if (evento.estadoNuevo !== 'PAGADA') {
    return; // No hacer nada si no es pagada
  }

  // ✅ Verificar que estado anterior NO era PAGADA
  if (evento.estadoAnterior === 'PAGADA') {
    this.logger.warn(
      `[WARN] Intento de emitir evento de factura pagada cuando ya estaba en PAGADA`
    );
    return; // Evitar ciclo
  }

  // Solo aquí emitir webhook
  this.eventEmitter.emit('webhook.factura.pagada', evento);
}
```

---

## 9. HALLAZGO: DTOs y Validación de Entrada para Webhooks

### 📨 DTOs Webhook Management

```typescript
// src/webhook/dto/create-webhook.dto.ts
import { IsString, IsUrl, IsEnum } from 'class-validator';

export class CreateWebhookDto {
  @IsEnum(['factura.pagada', 'pedido.entregado', 'pago.confirmado'])
  evento: string;

  @IsUrl({ require_protocol: true })
  url: string;

  @IsString()
  @MinLength(32)
  secret?: string; // Si no provee, generar en backend
}

// src/webhook/dto/webhook-subscription.dto.ts
export class WebhookSubscriptionDto {
  id: number;
  evento: string;
  url: string;
  activo: boolean;
  createdAt: Date;
}

// src/webhook/entities/webhook-subscription.entity.ts
@Entity('webhook_subscriptions')
export class WebhookSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_hotel' })
  idHotel: number;

  @Column()
  evento: string;

  @Column()
  url: string;

  @Column()
  secret: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, type: 'datetime' })
  deletedAt?: Date;
}

// src/webhook/entities/webhook-event-log.entity.ts
@Entity('webhook_events_log')
export class WebhookEventLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'webhook_subscription_id' })
  webhookSubscriptionId: number;

  @ManyToOne(() => WebhookSubscription)
  @JoinColumn({ name: 'webhook_subscription_id' })
  subscription: WebhookSubscription;

  @Column()
  evento: string;

  @Column({ type: 'int', nullable: true })
  status: number;

  @Column({ type: 'text', nullable: true })
  responseBody: string;

  @Column({ type: 'json', nullable: true })
  responseHeaders: any;

  @Column({ type: 'json' })
  eventoPayload: any;

  @Column({ default: 0 })
  intentos: number;

  @Column({ type: 'datetime', nullable: true })
  proximaRetry: Date;

  @Column({ nullable: true })
  codigoError: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 10. HALLAZGO: Endpoints Webhook Management API

### 🔌 REST API Completa

```typescript
// src/webhook/webhook.controller.ts
@Controller('hoteles/:hotelId/webhooks')
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  /**
   * POST /hoteles/1/webhooks
   * Crear nueva suscripción de webhook
   */
  @Post()
  @UseGuards(AuthGuard())
  async crear(
    @Param('hotelId') hotelId: number,
    @Body() dto: CreateWebhookDto,
  ) {
    return await this.webhookService.crearSuscripcion(hotelId, dto);
  }

  /**
   * GET /hoteles/1/webhooks
   * Listar todas las suscripciones
   */
  @Get()
  @UseGuards(AuthGuard())
  async listar(@Param('hotelId') hotelId: number) {
    return await this.webhookService.listarSuscripciones(hotelId);
  }

  /**
   * GET /hoteles/1/webhooks/1/events
   * Ver log de eventos de una suscripción
   */
  @Get(':webhookId/events')
  @UseGuards(AuthGuard())
  async verEventLog(
    @Param('hotelId') hotelId: number,
    @Param('webhookId') webhookId: number,
    @Query('limit') limit = 50,
  ) {
    return await this.webhookService.obtenerEventLog(webhookId, limit);
  }

  /**
   * POST /hoteles/1/webhooks/1/retry/:eventLogId
   * Reintentar delivery manualmente
   */
  @Post(':webhookId/retry/:eventLogId')
  @UseGuards(AuthGuard())
  async retryDelivery(
    @Param('hotelId') hotelId: number,
    @Param('eventLogId') eventLogId: number,
  ) {
    return await this.webhookService.retryDelivery(eventLogId);
  }

  /**
   * DELETE /hoteles/1/webhooks/1
   * Desactivar suscripción
   */
  @Delete(':webhookId')
  @UseGuards(AuthGuard())
  async desactivar(
    @Param('hotelId') hotelId: number,
    @Param('webhookId') webhookId: number,
  ) {
    return await this.webhookService.desactivarSuscripcion(webhookId);
  }
}

// ─── CURL EXAMPLES ───────────────────────────────────
/*
# Crear suscripción
curl -X POST http://localhost:3000/hoteles/1/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "evento": "factura.pagada",
    "url": "https://cliente.com/webhooks/callback",
    "secret": "tu_clave_secreta_32_caracteres"
  }'

# Listar suscripciones
curl http://localhost:3000/hoteles/1/webhooks \
  -H "Authorization: Bearer TOKEN"

# Ver event log
curl http://localhost:3000/hoteles/1/webhooks/1/events \
  -H "Authorization: Bearer TOKEN"

# Reintentar una entrega
curl -X POST http://localhost:3000/hoteles/1/webhooks/1/retry/123 \
  -H "Authorization: Bearer TOKEN"

# Desactivar suscripción
curl -X DELETE http://localhost:3000/hoteles/1/webhooks/1 \
  -H "Authorization: Bearer TOKEN"
*/
```

---

## RESUMEN EJECUTIVO: 10 Hallazgos

| # | Hallazgo | Estado | Acción |
|----|----------|--------|--------|
| 1 | EventEmitter2 no configurado en AppModule | ❌ **CRÍTICO** | Agregar en app.module.ts |
| 2 | Eventos sin tipos (DTOs) | ❌ **CRÍTICO** | Crear carpeta `events/` con clases |
| 3 | BD sin tablas webhook | ❌ **CRÍTICO** | Ejecutar migration SQL |
| 4 | Listeners síncronos en FacturaService faltantes | ❌ **ALTO** | Implementar 4 listeners |
| 5 | WebhookService no existe | ❌ **ALTO** | Crear services + controller |
| 6 | BullMQ no configurado | ❌ **ALTO** | Agregar ConfigModule RTSQueue |
| 7 | Sin prevención de ciclos infinitos | ⚠️ **MEDIO** | Validación de estado anterior |
| 8 | Sin auditoría de eventos | ⚠️ **MEDIO** | event_audit_log implementar |
| 9 | DTOs webhook incompletos | ⚠️ **BAJO** | CreateWebhookDto, WebhookSubscriptionDto |
| 10 | Endpoints webhook management faltantes | ⚠️ **BAJO** | 5 endpoints REST |

---

**PRÓXIMO PASO:** Ver PLAN_IMPLEMENTACION_FASE9.md para los 16 pasos de implementación secuencial.
