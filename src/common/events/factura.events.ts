/**
 * FASE 9: Event DTOs para comunicación entre servicios
 * Define la estructura de eventos que se emiten en el sistema
 */

/**
 * Evento: pedido.creado
 * Se emite cuando se crea un nuevo pedido
 * Listener: FacturaService.handlePedidoCreado()
 */
export class PedidoCreiadoEvent {
  idPedido: number;
  idReserva: number;
  idCliente: number;
  idHotel: number;
  categoria: string;
  total: number;
  items: Array<{
    id: number;
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
  createdAt: Date;
  usuarioId?: number;
}

/**
 * Evento: pedido.estado_cambio
 * Se emite cuando cambia el estado de un pedido
 * Listener: FacturaService.handlePedidoEstadoCambio()
 */
export class PedidoEstadoCambioEvent {
  idPedido: number;
  idReserva: number;
  estadoAnterior: string;
  estadoNuevo: string; // pendiente, en_preparacion, listo, entregado, cancelado
  timestamp: Date;
  usuarioId?: number;
}

/**
 * Evento: pago.registrado
 * Se emite cuando se registra un pago para una factura
 * Listener: FacturaService.handlePagoRegistrado()
 */
export class PagoRegistradoEvent {
  idPago: number;
  idFactura: number;
  monto: number;
  medioPago: string;
  estado: string; // confirmar, rechazar, devolver
  totalPagado: number; // suma acumulada de pagos
  timestamp: Date;
  usuarioId?: number;
}

/**
 * Evento: factura.pagada
 * Se emite cuando una factura pasa a estado PAGADA
 * Listener: WebhookService.handleFacturaPagada()
 */
export class FacturaPagadaEvent {
  idFactura: number;
  numeroFactura: string;
  idCliente: number;
  idHotel: number;
  total: number;
  fechaPago: Date;
  referencia?: string;
  cliente: {
    id: number;
    nombre: string;
    email?: string;
    telefono?: string;
  };
  hotel: {
    id: number;
    nombre: string;
    nit?: string;
  };
  timestamp: Date;
}

/**
 * Evento: factura.nulificada
 * Se emite cuando se anula una factura
 * Listener: WebhookService.handleFacturaNulificada()
 */
export class FacturaNulificadaEvent {
  idFactura: number;
  numeroFactura: string;
  idHotel: number;
  motivo: string;
  totalAnulado: number;
  timestamp: Date;
  usuarioId?: number;
}
