/**
 * Catálogo central de estados por módulo.
 * Fuente única de verdad para estados en toda la aplicación.
 * Importar desde aquí en vez de hardcodear strings.
 */

// ─── Factura ──────────────────────────────────────────────────────────────────

export const ESTADOS_FACTURA = {
  BORRADOR: 'BORRADOR',
  EDITABLE: 'EDITABLE',
  EMITIDA: 'EMITIDA',
  PAGADA: 'PAGADA',
  ANULADA: 'ANULADA',
} as const;

export type EstadoFactura = (typeof ESTADOS_FACTURA)[keyof typeof ESTADOS_FACTURA];

/** Estados legados (campo `estado` anterior a estadoFactura) */
export const ESTADOS_FACTURA_LEGADO = {
  pendiente: 'pendiente',
  emitida: 'emitida',
  pagada: 'pagada',
  anulada: 'anulada',
} as const;

/** Mapa de estado legado → estado canónico */
export const MAPA_ESTADO_LEGADO_A_CANONICO: Record<string, EstadoFactura> = {
  pendiente: 'BORRADOR',
  emitida: 'EMITIDA',
  pagada: 'PAGADA',
  anulada: 'ANULADA',
};

/** Transiciones válidas de estadoFactura */
export const TRANSICIONES_FACTURA: Record<EstadoFactura, EstadoFactura[]> = {
  BORRADOR: ['EDITABLE', 'EMITIDA', 'ANULADA'],
  EDITABLE: ['EMITIDA', 'BORRADOR', 'ANULADA'],
  EMITIDA: ['PAGADA', 'ANULADA'],
  PAGADA: [],
  ANULADA: [],
};

// ─── Pedido de servicio ───────────────────────────────────────────────────────

export const ESTADOS_PEDIDO = {
  PENDIENTE: 'pendiente',
  EN_PREPARACION: 'en_preparacion',
  LISTO: 'listo',
  ENTREGADO: 'entregado',
  CANCELADO: 'cancelado',
} as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[keyof typeof ESTADOS_PEDIDO];

/** Transiciones válidas de pedido */
export const TRANSICIONES_PEDIDO: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente: ['en_preparacion', 'cancelado'],
  en_preparacion: ['listo', 'entregado', 'cancelado'],
  listo: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: [],
};

/** Etiquetas legibles para el frontend */
export const ETIQUETAS_PEDIDO: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  listo: 'Listo para entregar',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

// ─── Incidencia (Room Incident) ───────────────────────────────────────────────

export const ESTADOS_INCIDENCIA = {
  REPORTED: 'reported',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
} as const;

export type EstadoIncidencia = (typeof ESTADOS_INCIDENCIA)[keyof typeof ESTADOS_INCIDENCIA];

/** Transiciones válidas de incidencias */
export const TRANSICIONES_INCIDENCIA: Record<EstadoIncidencia, EstadoIncidencia[]> = {
  reported: ['in_progress', 'cancelled'],
  in_progress: ['resolved', 'cancelled'],
  resolved: [],
  cancelled: [],
};

/** Etiquetas en español para el frontend */
export const ETIQUETAS_INCIDENCIA: Record<EstadoIncidencia, string> = {
  reported: 'Reportada',
  in_progress: 'En atención',
  resolved: 'Resuelta',
  cancelled: 'Cancelada',
};

/** Tipos de incidencia con etiquetas */
export const TIPOS_INCIDENCIA = {
  daño: 'Daño en habitación',
  mantenimiento: 'Mantenimiento',
  limpieza: 'Limpieza',
  cliente_complaint: 'Queja de cliente',
  otros: 'Otros',
} as const;

/** Áreas asignables para atención de incidencias */
export const AREAS_INCIDENCIA = {
  mantenimiento: 'Mantenimiento',
  plomeria: 'Plomería',
  limpieza: 'Limpieza',
  electricidad: 'Electricidad',
  seguridad: 'Seguridad',
  otro: 'Otro',
} as const;

// ─── Reserva ──────────────────────────────────────────────────────────────────

export const ESTADOS_RESERVA = {
  PENDIENTE: 'pendiente',
  CONFIRMADA: 'confirmada',
  CHECKIN: 'checkin',
  CHECKOUT: 'checkout',
  CANCELADA: 'cancelada',
  NO_SHOW: 'no_show',
} as const;

export type EstadoReserva = (typeof ESTADOS_RESERVA)[keyof typeof ESTADOS_RESERVA];

/** Etiquetas en español para el frontend */
export const ETIQUETAS_RESERVA: Record<EstadoReserva, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  checkin: 'Check-in',
  checkout: 'Check-out',
  cancelada: 'Cancelada',
  no_show: 'No se presentó',
};
