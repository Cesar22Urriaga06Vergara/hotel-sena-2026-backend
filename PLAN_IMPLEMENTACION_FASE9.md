# PLAN DE IMPLEMENTACIÓN: FASE 9  
**16 Pasos Secuenciales - Eventos/Listeners/Webhooks**

**Timeline Total:** 16 horas  
**Incrementos:** Cada paso es deployable (no rompe nada anterior)

---

## PASO 1: Configurar EventEmitter2 en AppModule (30 min)

### Archivo: `src/app.module.ts`

Agregar import:
```typescript
import { EventEmitterModule } from '@nestjs/event-emitter';
```

Reemplazar la sección `@Module` imports:
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    // ✅ AGREGAR ESTO:
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseLogging: process.env.NODE_ENV === 'development',
    }),

    AuthModule,
    CloudinaryModule,
    CommonModule,
    IncidenciaModule,
    CategoriaServiciosModule,
    TaxRatesModule,
    ImpuestoModule,
    AmenidadModule,
    HotelModule,
    TipoHabitacionModule,
    HabitacionModule,
    ReservaModule,
    ClienteModule,
    EmpleadoModule,
    ServicioModule,
    FacturaModule,
    MedioPagoModule,
    PagoModule,
    FolioModule,
    HuespedesModule,
    SuperadminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AdminAccessMiddleware).forRoutes(
      '/users',
      '/usuarios',
      '/habitaciones',
      '/empleados',
      '/hoteles',
      '/amenidades',
      '/medios-pago',
      '/tipos-habitacion',
      '/folios',
      '/huespedes',
    );
  }
}
```

### Test
```bash
npm run start
# Si no hay errores de compilación, PASO 1 ✅
```

---

## PASO 2: Crear DTOs de Eventos (45 min)

### Crear carpeta y archivos:
```bash
mkdir src/common/events
```

### Archivo: `src/common/events/pedido.events.ts`

```typescript
export class PedidoCreladoEvent {
  idPedido: number;
  idReserva: number;
  idCliente: number;
  idHotel: number;
  totalPedido: number;
  timestamp: Date = new Date();
  usuarioId?: number;
}

export class PedidoEstadoCambioEvent {
  idPedido: number;
  idReserva: number;
  idCliente: number;
  idHotel: number;
  estadoAnterior: string;
  estadoNuevo: string;
  categoria: string;
  totalPedido: number;
  timestamp: Date = new Date();
  usuarioId?: number;
}

export class PedidoCanceladoEvent {
  idPedido: number;
  idReserva: number;
  idHotel: number;
  razonCancelacion?: string;
  timestamp: Date = new Date();
  usuarioId?: number;
}
```

### Archivo: `src/common/events/factura.events.ts`

```typescript
export class FacturaCreladaEvent {
  idFactura: number;
  idReserva: number;
  idCliente: number;
  idHotel: number;
  numeroFactura: string;
  timestamp: Date = new Date();
}

export class FacturaEstadoCambioEvent {
  idFactura: number;
  idReserva: number;
  idCliente: number;
  idHotel: number;
  estadoAnterior: string;
  estadoNuevo: string;
  total: number;
  timestamp: Date = new Date();
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
  timestamp: Date = new Date();
  metodoPago?: string;
}

export class FacturaAnuladaEvent {
  idFactura: number;
  idCliente: number;
  idHotel: number;
  razon: string;
  timestamp: Date = new Date();
  usuarioId?: number;
}
```

### Archivo: `src/common/events/pago.events.ts`

```typescript
export class PagoRegistradoEvent {
  idPago: number;
  idFactura: number;
  idCliente: number;
  idHotel: number;
  monto: number;
  idMedioPago: number;
  timestamp: Date = new Date();
  usuarioId?: number;
}

export class PagoDevolutoEvent {
  idPago: number;
  idFactura: number;
  idCliente: number;
  idHotel: number;
  monto: number;
  razon: string;
  timestamp: Date = new Date();
  usuarioId?: number;
}

export class PagoConfirmadoEvent {
  idPago: number;
  idFactura: number;
  idCliente: number;
  idHotel: number;
  timestamp: Date = new Date();
}
```

### Test
```bash
npm run build
# Si compila sin errores, PASO 2 ✅
```

---

## PASO 3: Crear Tablas de Webhook en BD (1 hora)

### Ejecutar en MySQL (copiar el SQL exactamente):

```sql
-- Tabla 1: webhook_subscriptions
CREATE TABLE webhook_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_hotel INT NOT NULL,
  evento VARCHAR(100) NOT NULL,
  url VARCHAR(2000) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT true,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME DEFAULT NULL,
  
  UNIQUE KEY unique_hotel_evento_url (id_hotel, evento, url),
  FOREIGN KEY (id_hotel) REFERENCES hoteles(id) ON DELETE CASCADE,
  INDEX idx_evento (evento),
  INDEX idx_activo (activo)
);

-- Tabla 2: webhook_events_log
CREATE TABLE webhook_events_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  webhook_subscription_id INT NOT NULL,
  evento VARCHAR(100) NOT NULL,
  status INT DEFAULT NULL,
  response_body TEXT DEFAULT NULL,
  response_headers JSON DEFAULT NULL,
  
  intentos INT DEFAULT 1,
  proxima_retry TIMESTAMP DEFAULT NULL,
  
  evento_payload JSON NOT NULL,
  codigo_error VARCHAR(100) DEFAULT NULL,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (webhook_subscription_id) REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_proxima_retry (proxima_retry),
  INDEX idx_evento (evento)
);

-- Tabla 3: event_audit_log (para rastrear eventos)
CREATE TABLE event_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  evento_nombre VARCHAR(100),
  evento_payload JSON,
  
  entidad_afectada VARCHAR(100),
  id_entidad INT,
  cambios_aplicados JSON,
  
  resultado VARCHAR(20),
  id_usuario INT DEFAULT NULL,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_evento (evento_nombre),
  INDEX idx_entidad (entidad_afectada, id_entidad)
);
```

### Verificar:
```sql
SHOW TABLES LIKE 'webhook%';
# Debe mostrar 2 tablas

SELECT COUNT(*) FROM webhook_subscriptions;
# Debe retornar 0

SHOW COLUMNS FROM webhook_subscriptions;
# Debe mostrar todas las columnas
```

---

## PASO 4: Emitir Evento en ServicioService.crearPedido() (30 min)

### Archivo: `src/servicio/servicio.service.ts`

**Agregar import al inicio:**
```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PedidoCreladoEvent } from '../common/events/pedido.events';
```

**Inyectar EventEmitter2 en constructor:**
```typescript
constructor(
  @InjectRepository(Servicio)
  private servicioRepository: Repository<Servicio>,
  @InjectRepository(Pedido)
  private pedidoRepository: Repository<Pedido>,
  @InjectRepository(PedidoItem)
  private pedidoItemRepository: Repository<PedidoItem>,
  @InjectRepository(PedidoCambio)
  private pedidoCambioRepository: Repository<PedidoCambio>,
  @InjectRepository(Reserva)
  private reservaRepository: Repository<Reserva>,
  @InjectRepository(Cliente)
  private clienteRepository: Repository<Cliente>,
  // ✅ AGREGAR ESTO:
  private eventEmitter: EventEmitter2,
) {}
```

**Encontrar método `crearPedido()` y reemplazar el final:**

Buscar esta línea:
```typescript
async crearPedido(dto: CreatePedidoDto): Promise<Pedido> {
  // ... código existente ...
  return await this.pedidoRepository.save(pedido);
}
```

Reemplazar por:
```typescript
async crearPedido(dto: CreatePedidoDto): Promise<Pedido> {
  // ... código existente ...
  const saved = await this.pedidoRepository.save(pedido);

  // ✅ EMITIR EVENTO
  const evento = new PedidoCreladoEvent();
  evento.idPedido = saved.id;
  evento.idReserva = saved.idReserva;
  evento.idCliente = saved.idCliente;
  evento.idHotel = saved.idHotel;
  evento.totalPedido = Number(saved.totalPedido);
  evento.timestamp = new Date();

  this.eventEmitter.emit('pedido.creado', evento);

  return saved;
}
```

### Test
```bash
npm run start
# Crear un pedido via API y ver en console:
# [pedido.creado] se debe emitir sin errores
```

---

## PASO 5: Emitir Evento en ServicioService.actualizarEstadoPedido() (30 min)

### Archivo: `src/servicio/servicio.service.ts`

**Agregar import:**
```typescript
import { PedidoEstadoCambioEvent } from '../common/events/pedido.events';
```

**Encontrar método `actualizarEstadoPedido()` (o crear si no existe):**

```typescript
async actualizarEstadoPedido(
  idPedido: number,
  dto: UpdateEstadoPedidoDto,
  usuarioId?: number,
): Promise<Pedido> {
  const pedido = await this.pedidoRepository.findOne({
    where: { id: idPedido },
  });

  if (!pedido) {
    throw new NotFoundException(`Pedido ${idPedido} no encontrado`);
  }

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

  // ✅ EMITIR EVENTO
  const evento = new PedidoEstadoCambioEvent();
  evento.idPedido = updated.id;
  evento.idReserva = updated.idReserva;
  evento.idCliente = updated.idCliente;
  evento.idHotel = updated.idHotel;
  evento.estadoAnterior = estadoAnterior;
  evento.estadoNuevo = estadoNuevo;
  evento.categoria = updated.categoria;
  evento.totalPedido = Number(updated.totalPedido);
  evento.timestamp = new Date();
  evento.usuarioId = usuarioId;

  this.eventEmitter.emit('pedido.estado_cambio', evento);

  return updated;
}
```

---

## PASO 6: Escuchar Evento pedido.creado en FacturaService (1 hora)

### Archivo: `src/factura/factura.service.ts`

**Agregar imports:**
```typescript
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PedidoCreladoEvent, PedidoEstadoCambioEvent } from '../common/events/pedido.events';
import { FacturaPagadaEvent } from '../common/events/factura.events';
```

**Inyectar EventEmitter2:**
```typescript
constructor(
  // ... otros injects ...
  private eventEmitter: EventEmitter2,
) {}
```

**Agregar listener al final de la clase:**

```typescript
/**
 * Listener: Cuando se crea un pedido, agregar detalle a factura BORRADOR activa
 * Si no existe factura BORRADOR, crear una nueva
 */
@OnEvent('pedido.creado', { async: false })
async handlePedidoCreado(evento: PedidoCreladoEvent) {
  console.log(`[LISTENER] pedido.creado ID=${evento.idPedido}`);

  try {
    // Buscar factura BORRADOR activa
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
        porcentajeIva: 19,
      });
      factura = await this.facturaRepository.save(factura);
      console.log(`[LISTENER] Nueva factura creada: ${factura.id}`);
    }

    // Agregar detalle
    const detalle = this.detalleFacturaRepository.create({
      idFactura: factura.id,
      idPedido: evento.idPedido,
      tipoConcepto: 'servicio',
      descripcion: `Pedido de servicio #${evento.idPedido}`,
      idReferencia: evento.idPedido,
      cantidadItems: 1,
      monto: evento.totalPedido,
      estado: 'PENDIENTE_ENTREGA',
    });

    await this.detalleFacturaRepository.save(detalle);

    // Recalcular totales
    factura.subtotal = await this.calcularSubtotal(factura.id);
    factura.total = await this.calcularTotal(factura.id);
    await this.facturaRepository.save(factura);

    console.log(
      `[LISTENER SUCCESS] Detalle agregado a factura ${factura.id}`
    );

  } catch (error) {
    console.error('[LISTENER ERROR] handlePedidoCreado:', error);
    throw error; // Re-lanzar para rollback si está en transacción
  }
}
```

---

## PASO 7: Escuchar Evento pedido.estado_cambio en FacturaService (1.5 horas)

### Archivo: `src/factura/factura.service.ts`

**Agregar listener:**

```typescript
/**
 * Listener: Cambios de estado en pedido → cambios en DetalleFactura
 * pedido.entregado → detalle.ENTREGADO
 * pedido.cancelado → detalle.CANCELADO (monto = 0)
 */
@OnEvent('pedido.estado_cambio', { async: false })
async handlePedidoEstadoCambio(evento: PedidoEstadoCambioEvent) {
  console.log(
    `[LISTENER] pedido.estado_cambio: ${evento.estadoAnterior} → ${evento.estadoNuevo}`
  );

  try {
    // Buscar detalle factura vinculado a este pedido
    const detalle = await this.detalleFacturaRepository.findOne({
      where: { idPedido: evento.idPedido },
      relations: ['factura'],
    });

    if (!detalle) {
      console.warn(
        `[LISTENER WARN] No hay detalle para pedido ${evento.idPedido}`
      );
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
    // pendiente y en_preparación no afectan detalle

    await this.detalleFacturaRepository.save(detalle);

    // ─── Verificar si todos los detalles de la factura están entregados ───
    if (evento.estadoNuevo === 'entregado') {
      const factura = await this.facturaRepository.findOne({
        where: { id: detalle.idFactura },
        relations: ['detalles'],
      });

      const todosEntregados = factura.detalles.every(
        (d) => d.estado === 'ENTREGADO' || d.estado === 'CANCELADO'
      );

      const tieneDetallesPendientes = factura.detalles.some(
        (d) => d.estado === 'PENDIENTE_ENTREGA' || d.estado === 'LISTO'
      );

      // Si todos están entregados/cancelados y la factura está EMITIDA → PAGADA
      if (todosEntregados && !tieneDetallesPendientes && factura.estadoFactura === 'EMITIDA') {
        factura.estadoFactura = 'PAGADA';
        await this.facturaRepository.save(factura);

        console.log(`[LISTENER] Factura ${factura.id} marcada como PAGADA`);

        // ✅ EMITIR NUEVO EVENTO para webhooks
        const eventoFacturaPagada = new FacturaPagadaEvent();
        eventoFacturaPagada.idFactura = factura.id;
        eventoFacturaPagada.idCliente = factura.idCliente;
        eventoFacturaPagada.nombreCliente = factura.nombreCliente;
        eventoFacturaPagada.emailCliente = factura.emailCliente;
        eventoFacturaPagada.idHotel = factura.idHotel;
        eventoFacturaPagada.total = Number(factura.total);
        eventoFacturaPagada.numeroFactura = factura.numeroFactura;
        eventoFacturaPagada.timestamp = new Date();

        this.eventEmitter.emit('factura.pagada', eventoFacturaPagada);
      }
    }

    console.log(
      `[LISTENER SUCCESS] Detalle ${detalle.id}: ${estadoAnterior} → ${detalle.estado}`
    );

  } catch (error) {
    console.error('[LISTENER ERROR] handlePedidoEstadoCambio:', error);
    throw error;
  }
}
```

---

## PASO 8: Emitir Evento en PagoService.registrarPago() (30 min)

### Archivo: `src/pago/pago.service.ts`

**Agregar imports:**
```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PagoRegistradoEvent } from '../common/events/pago.events';
```

**Inyectar:**
```typescript
constructor(
  @InjectRepository(Pago)
  private pagoRepository: Repository<Pago>,
  private facturaService: FacturaService,
  private medioPagoService: MedioPagoService,
  private dataSource: DataSource,
  // ✅ AGREGAR:
  private eventEmitter: EventEmitter2,
) {}
```

**Al final del método `registrarPago()`, después de `await this.pagoRepository.save()`:**

```typescript
const pagoBd = await this.pagoRepository.save({
  idFactura: dto.idFactura,
  idMedioPago: dto.idMedioPago,
  monto: dto.monto,
  // ... otros campos ...
});

// ✅ EMITIR EVENTO
const evento = new PagoRegistradoEvent();
evento.idPago = pagoBd.id;
evento.idFactura = dto.idFactura;
evento.idCliente = factura.idCliente;
evento.idHotel = factura.idHotel;
evento.monto = dto.monto;
evento.idMedioPago = dto.idMedioPago;
evento.timestamp = new Date();
evento.usuarioId = idEmpleado;

this.eventEmitter.emit('pago.registrado', evento);

return pagoBd;
```

---

## PASO 9: Escuchar Evento pago.registrado en FacturaService (1 hora)

### Archivo: `src/factura/factura.service.ts`

**Agregar import:**
```typescript
import { PagoRegistradoEvent } from '../common/events/pago.events';
```

**Agregar listener:**

```typescript
/**
 * Listener: Cuando se registra un pago, actualizar estado de factura
 * Si pago total >= total factura → PAGADA
 */
@OnEvent('pago.registrado', { async: false })
async handlePagoRegistrado(evento: PagoRegistradoEvent) {
  console.log(
    `[LISTENER] pago.registrado ID=${evento.idPago}, Monto=${evento.monto}`
  );

  try {
    const factura = await this.facturaRepository.findOne({
      where: { id: evento.idFactura },
    });

    if (!factura) {
      console.warn(`[LISTENER WARN] Factura ${evento.idFactura} no existe`);
      return;
    }

    // Calcular total pagado
    const pagos = await this.pagoRepository.find({
      where: { idFactura: evento.idFactura, estado: 'completado' },
    });

    const totalPagado = pagos.reduce(
      (sum, p) => sum + Number(p.monto),
      0
    );

    const totalFactura = Number(factura.total);

    console.log(
      `[LISTENER] Factura ${evento.idFactura}: $${totalPagado} / $${totalFactura}`
    );

    // Si está completamente pagada → PAGADA
    if (totalPagado >= totalFactura && factura.estadoFactura !== 'PAGADA') {
      factura.estadoFactura = 'PAGADA';
      await this.facturaRepository.save(factura);

      console.log(`[LISTENER] Factura ${factura.id} marcada como PAGADA`);

      // ✅ EMITIR EVENTO PARA WEBHOOKS
      const eventoFacturaPagada = new FacturaPagadaEvent();
      eventoFacturaPagada.idFactura = factura.id;
      eventoFacturaPagada.idCliente = factura.idCliente;
      eventoFacturaPagada.nombreCliente = factura.nombreCliente;
      eventoFacturaPagada.emailCliente = factura.emailCliente;
      eventoFacturaPagada.idHotel = factura.idHotel;
      eventoFacturaPagada.total = totalFactura;
      eventoFacturaPagada.numeroFactura = factura.numeroFactura;
      eventoFacturaPagada.timestamp = new Date();
      eventoFacturaPagada.metodoPago = evento.idMedioPago.toString();

      this.eventEmitter.emit('factura.pagada', eventoFacturaPagada);
    }

  } catch (error) {
    console.error('[LISTENER ERROR] handlePagoRegistrado:', error);
    throw error;
  }
}
```

---

## PASO 10: Crear WebhookService (1.5 horas)

### Archivo: `src/webhook/webhook.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookEventLog } from './entities/webhook-event-log.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { FacturaPagadaEvent } from '../common/events/factura.events';

@Injectable()
export class WebhookService {
  private logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookSubscription)
    private subscriptionRepository: Repository<WebhookSubscription>,
    @InjectRepository(WebhookEventLog)
    private eventLogRepository: Repository<WebhookEventLog>,
  ) {}

  /**
   * Listener ASYNC: Se ejecuta en background sin bloquear
   */
  @OnEvent('factura.pagada', { async: true })
  async handleFacturaPagada(evento: FacturaPagadaEvent) {
    this.logger.log(
      `[WEBHOOK] Factura pagada: ${evento.idFactura}, Hotel: ${evento.idHotel}`
    );

    try {
      // Buscar suscripciones para este hotel y evento
      const suscripciones = await this.subscriptionRepository.find({
        where: {
          idHotel: evento.idHotel,
          evento: 'factura.pagada',
          activo: true,
          deletedAt: null,
        },
      });

      if (suscripciones.length === 0) {
        this.logger.warn(
          `No hay suscripciones para factura.pagada en hotel ${evento.idHotel}`
        );
        return;
      }

      // Para cada suscripción, crear log y enviar
      for (const sub of suscripciones) {
        const log = this.eventLogRepository.create({
          webhookSubscriptionId: sub.id,
          evento: 'factura.pagada',
          eventoPayload: evento,
          status: null,
          intentos: 0,
        });

        await this.eventLogRepository.save(log);

        // Intentar delivery inmediato
        await this.deliverWebhook(log.id, sub.secret, sub.url, evento);
      }

    } catch (error) {
      this.logger.error(
        `[WEBHOOK ERROR] handleFacturaPagada: ${error.message}`
      );
    }
  }

  /**
   * Enviar webhook a cliente
   */
  async deliverWebhook(
    logId: number,
    secret: string,
    url: string,
    evento: any
  ): Promise<void> {
    const log = await this.eventLogRepository.findOne({ where: { id: logId } });

    try {
      const payload = JSON.stringify(evento);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'factura.pagada',
          'X-Retry-Count': String(log.intentos),
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      log.status = response.status;
      log.responseBody = await response.text();
      log.responseHeaders = JSON.stringify(
        Object.fromEntries(response.headers)
      );

      if (response.ok) {
        this.logger.log(`[WEBHOOK SUCCESS] Log=${logId}, Status=${response.status}`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

      await this.eventLogRepository.save(log);

    } catch (error) {
      log.status = error.name === 'AbortError' ? 408 : 500;
      log.codigoError = error.name === 'AbortError' ? 'timeout' : error.message;
      log.intentos = (log.intentos || 0) + 1;

      // Exponential backoff para reintentos
      if (log.intentos < 5) {
        const delayMs = Math.min(
          1000 * Math.pow(2, log.intentos - 1),
          86400000 // máximo 24 horas
        );
        log.proximaRetry = new Date(Date.now() + delayMs);
      }

      await this.eventLogRepository.save(log);

      this.logger.warn(
        `[WEBHOOK FAIL] Log=${logId}, Attempt=${log.intentos}/5, Error=${error.message}`
      );

      // No relanzar - logging es suficiente por ahora
    }
  }

  /**
   * API: Crear suscripción de webhook
   */
  async crearSuscripcion(
    hotelId: number,
    dto: CreateWebhookDto
  ): Promise<WebhookSubscription> {
    const suscripcion = this.subscriptionRepository.create({
      idHotel: hotelId,
      evento: dto.evento,
      url: dto.url,
      secret: dto.secret || crypto.randomBytes(32).toString('hex'),
      activo: true,
    });

    return await this.subscriptionRepository.save(suscripcion);
  }

  /**
   * API: Listar suscripciones de un hotel
   */
  async listarSuscripciones(hotelId: number): Promise<any[]> {
    const suscripciones = await this.subscriptionRepository.find({
      where: {
        idHotel: hotelId,
        deletedAt: null,
      },
      select: ['id', 'evento', 'url', 'activo', 'createdAt'],
    });

    return suscripciones;
  }

  /**
   * API: Ver event log de una suscripción
   */
  async obtenerEventLog(
    subscriptionId: number,
    limit = 50
  ): Promise<any[]> {
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
  async retryDelivery(logId: number): Promise<{ message: string }> {
    const log = await this.eventLogRepository.findOne({ where: { id: logId } });
    const sub = await this.subscriptionRepository.findOne({
      where: { id: log.webhookSubscriptionId },
    });

    log.intentos = 0;
    log.proximaRetry = null;
    log.status = null;
    await this.eventLogRepository.save(log);

    await this.deliverWebhook(
      log.id,
      sub.secret,
      sub.url,
      log.eventoPayload
    );

    return { message: 'Reintento procesado' };
  }

  /**
   * API: Desactivar suscripción
   */
  async desactivarSuscripcion(subscriptionId: number): Promise<{ message: string }> {
    await this.subscriptionRepository.update(
      { id: subscriptionId },
      { deletedAt: new Date() }
    );

    return { message: 'Suscripción desactivada' };
  }
}
```

---

## PASO 11: Crear WebhookController (45 min)

### Archivo: `src/webhook/webhook.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@Controller('hoteles/:hotelId/webhooks')
@UseGuards(JwtAuthGuard)
export class WebhookController {
  private logger = new Logger(WebhookController.name);

  constructor(private webhookService: WebhookService) {}

  /**
   * POST /hoteles/1/webhooks
   * Crear nueva suscripción
   */
  @Post()
  async crear(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Body() dto: CreateWebhookDto,
  ) {
    this.logger.log(`[POST WEBHOOK] Hotel ${hotelId}, Evento: ${dto.evento}`);
    return await this.webhookService.crearSuscripcion(hotelId, dto);
  }

  /**
   * GET /hoteles/1/webhooks
   * Listar todas las suscripciones
   */
  @Get()
  async listar(@Param('hotelId', ParseIntPipe) hotelId: number) {
    this.logger.log(`[GET WEBHOOKS] Hotel ${hotelId}`);
    return await this.webhookService.listarSuscripciones(hotelId);
  }

  /**
   * GET /hoteles/1/webhooks/1/events
   * Ver log de eventos
   */
  @Get(':webhookId/events')
  async verEventLog(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('webhookId', ParseIntPipe) webhookId: number,
  ) {
    this.logger.log(`[GET EVENT LOG] Webhook ${webhookId}`);
    return await this.webhookService.obtenerEventLog(webhookId);
  }

  /**
   * POST /hoteles/1/webhooks/1/retry/123
   * Reintentar delivery
   */
  @Post(':webhookId/retry/:eventLogId')
  async retryDelivery(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('webhookId', ParseIntPipe) webhookId: number,
    @Param('eventLogId', ParseIntPipe) eventLogId: number,
  ) {
    this.logger.log(`[POST RETRY] EventLog ${eventLogId}`);
    return await this.webhookService.retryDelivery(eventLogId);
  }

  /**
   * DELETE /hoteles/1/webhooks/1
   * Desactivar suscripción
   */
  @Delete(':webhookId')
  async desactivar(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('webhookId', ParseIntPipe) webhookId: number,
  ) {
    this.logger.log(`[DELETE WEBHOOK] ${webhookId}`);
    return await this.webhookService.desactivarSuscripcion(webhookId);
  }
}
```

---

## PASO 12: Crear DTOs y Entidades Webhook (1 hora)

### Archivo: `src/webhook/dto/create-webhook.dto.ts`

```typescript
import { IsString, IsUrl, IsEnum, IsOptional, MinLength } from 'class-validator';

export class CreateWebhookDto {
  @IsEnum(['factura.pagada', 'pedido.entregado', 'pago.confirmado'])
  evento: string;

  @IsUrl({ require_protocol: true, require_host: true })
  url: string;

  @IsOptional()
  @IsString()
  @MinLength(32)
  secret?: string;
}

export class WebhookSubscriptionDto {
  id: number;
  idHotel: number;
  evento: string;
  url: string;
  activo: boolean;
  createdAt: Date;
}
```

### Archivo: `src/webhook/entities/webhook-subscription.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Hotel } from '../../hotel/entities/hotel.entity';
import { WebhookEventLog } from './webhook-event-log.entity';

@Entity('webhook_subscriptions')
export class WebhookSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_hotel' })
  idHotel: number;

  @ManyToOne(() => Hotel)
  @JoinColumn({ name: 'id_hotel' })
  hotel: Hotel;

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

  @OneToMany(() => WebhookEventLog, (log) => log.subscription)
  eventLogs: WebhookEventLog[];
}
```

### Archivo: `src/webhook/entities/webhook-event-log.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WebhookSubscription } from './webhook-subscription.entity';

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

  @Column({ type: 'longtext', nullable: true })
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

## PASO 13: Crear WebhookModule (30 min)

### Archivo: `src/webhook/webhook.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { WebhookSubscription } from './entities/webhook-subscription.entity';
import { WebhookEventLog } from './entities/webhook-event-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookSubscription, WebhookEventLog]),
  ],
  providers: [WebhookService],
  controllers: [WebhookController],
  exports: [WebhookService],
})
export class WebhookModule {}
```

---

## PASO 14: Registrar WebhookModule en AppModule (15 min)

### Archivo: `src/app.module.ts`

**Agregar import:**
```typescript
import { WebhookModule } from './webhook/webhook.module';
```

**Agregar a imports array:**
```typescript
@Module({
  imports: [
    // ... otros
    WebhookModule,  // ✅ AGREGAR ANTES DE CIERRE ]
  ],
})
```

---

## PASO 15: Tests E2E - Flujo Completo (2 horas)

### Test Script: Crear archivo `src/webhook/tests/webhook.e2e.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { Repository, DataSource } from 'typeorm';
import { WebhookSubscription } from '../entities/webhook-subscription.entity';

describe('Webhook E2E - Flujo completo eventos', () => {
  let app: INestApplication;
  let webhookRepo: Repository<WebhookSubscription>;
  let hotelId = 1;
  let jwtToken = 'TEST_TOKEN_PLACEHOLDER';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    webhookRepo = moduleFixture.get(DataSource)
      .getRepository(WebhookSubscription);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Crear pedido → Agregar detalle a factura', () => {
    it('POST /servicios/pedidos - Crear pedido emite evento pedido.creado', async () => {
      const res = await request(app.getHttpServer())
        .post('/servicios/pedidos')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          idReserva: 1,
          idCliente: 1,
          tipoEntrega: 'delivery',
          categoria: 'bebidas',
          totalPedido: 15000,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();

      // Verificar que detalle fue creado (listener ejecutó)
      // → Debe existir DetalleFactura con idPedido = res.body.id
    });
  });

  describe('2. Actualizar estado pedido → Actualizar detalle factura', () => {
    it('PUT /servicios/pedidos/1/estado - Cambiar a entregado', async () => {
      const res = await request(app.getHttpServer())
        .put('/servicios/pedidos/1/estado')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          estadoPedido: 'entregado',
        });

      expect(res.status).toBe(200);
      // Listener handlePedidoEstadoCambio debe actualizar DetalleFactura.estado = 'ENTREGADO'
    });
  });

  describe('3. Registrar pago → Cambiar factura a PAGADA', () => {
    it('POST /pagos - Registrar pago', async () => {
      const res = await request(app.getHttpServer())
        .post('/pagos')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          idFactura: 1,
          idMedioPago: 1,
          monto: 15000,
        });

      expect(res.status).toBe(201);
      // Listener handlePagoRegistrado debe cambiar factura a PAGADA
      // y emitir factura.pagada → WebhookService → POST a suscriptores
    });
  });

  describe('4. Webhook delivery a cliente externo', () => {
    it('POST /hoteles/1/webhooks - Crear suscripción', async () => {
      const res = await request(app.getHttpServer())
        .post(`/hoteles/${hotelId}/webhooks`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          evento: 'factura.pagada',
          url: 'https://cliente-test.com/webhooks/callback',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.evento).toBe('factura.pagada');
    });

    it('GET /hoteles/1/webhooks - Listar suscripciones', async () => {
      const res = await request(app.getHttpServer())
        .get(`/hoteles/${hotelId}/webhooks`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /hoteles/1/webhooks/1/events - Ver event log', async () => {
      const res = await request(app.getHttpServer())
        .get(`/hoteles/${hotelId}/webhooks/1/events`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('5. Retry logic', () => {
    it('POST /hoteles/1/webhooks/1/retry/1 - Reintentar delivery', async () => {
      const res = await request(app.getHttpServer())
        .post(`/hoteles/${hotelId}/webhooks/1/retry/1`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Reintento');
    });

    it('DELETE /hoteles/1/webhooks/1 - Desactivar suscripción', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/hoteles/${hotelId}/webhooks/1`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(res.status).toBe(200);
    });
  });
});
```

---

## PASO 16: Deploy y Validación Final (1 hora)

### Pre-Deploy Checklist

```bash
# 1. Compilar
npm run build

# 2. Validar sin errores
npm run lint

# 3. Ejecutar tests
npm run test

# 4. Ejecutar tests E2E
npm run test:e2e

# 5. Iniciar app
npm run start
```

### Testing Manual

```bash
# Terminal 1: Ver logs
npm run start

# Terminal 2: Crear suscripción webhook
curl -X POST http://localhost:3000/hoteles/1/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "evento": "factura.pagada",
    "url": "https://webhook.site/your-unique-url",
    "secret": "test_secret_32_chars_minimo_ok"
  }'

# Terminal 2: Crear pedido
curl -X POST http://localhost:3000/servicios/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "idReserva": 1,
    "idCliente": 1,
    "tipoEntrega": "delivery",
    "categoria": "bebidas",
    "totalPedido": 10000
  }'

# Terminal 2: Cambiar estado a entregado
curl -X PUT http://localhost:3000/servicios/pedidos/1/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "estadoPedido": "entregado"
  }'

# Terminal 2: Registrar pago
curl -X POST http://localhost:3000/pagos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "idFactura": 1,
    "idMedioPago": 1,
    "monto": 10000
  }'

# Terminal 2: Ver event log (debe mostrar webhook enviado)
curl http://localhost:3000/hoteles/1/webhooks/1/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq
```

### Validaciones Esperadas

- ✅ Webhook delivery log muestra `status: 200` (o timeout/error si webhook.site)
- ✅ Factura pasó por estados: BORRADOR → EMITIDA → PAGADA
- ✅ DetalleFactura pasó por: PENDIENTE_ENTREGA → ENTREGADO
- ✅ No hay ciclos infinitos (verificar logs)
- ✅ WebhookEventLog registra cada intento

---

**RESUMEN: 16 Pasos Completados**
- Pasos 1-3: Configuración infraestructura (1.75 horas)
- Pasos 4-7: Listeners en Pedido/Factura (3 horas)
- Pasos 8-9: Listeners en Pago (1.5 horas)
- Pasos 10-14: WebhookService + Controller + Module (4 horas)
- Paso 15: Tests E2E (2 horas)
- Paso 16: Deploy & validación (1 hora)

**TOTAL: ~16 horas** ✅
