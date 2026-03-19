/**
 * DTO para respuesta del historial de cambios de una factura
 * 
 * Contiene la información de un cambio en auditoría, con valores anteriores y nuevos.
 */
export class FacturaCambioResponseDto {
  /**
   * ID del registro de cambio
   */
  id: number;

  /**
   * ID de la factura modificada
   */
  idFactura: number;

  /**
   * ID del usuario que realizó el cambio
   */
  usuarioId?: number;

  /**
   * Tipo de cambio: 'ACTUALIZACIÓN', 'CAMBIO_ESTADO', 'CREACIÓN'
   */
  tipoCambio: string;

  /**
   * Descripción legible del cambio
   * 
   * @example "Se actualizaron los campos: observaciones, montoIva"
   * @example "Factura emitida - Cambio de estado BORRADOR → EMITIDA"
   */
  descripcion: string;

  /**
   * Valor anterior de los campos modificados (JSON)
   * 
   * @example { "estadoFactura": "BORRADOR" }
   */
  valorAnterior?: any;

  /**
   * Valor nuevo de los campos modificados (JSON)
   * 
   * @example { "estadoFactura": "EMITIDA", "fechaEmision": "2026-03-15T10:30:00Z" }
   */
  valorNuevo?: any;

  /**
   * Fecha y hora del cambio (ISO 8601)
   */
  fecha: Date;

  /**
   * Fecha y hora formateada en formato colombiano (HH:MM:SS DD/MM/YYYY)
   */
  fechaFormateada: string;
}

/**
 * DTO para respuesta de historial completo de cambios
 */
export class HistorialCambiosResponseDto {
  /**
   * Historial ordenado por fecha descendente (más recientes primero)
   */
  cambios: FacturaCambioResponseDto[];

  /**
   * Total de cambios registrados
   */
  total: number;

  /**
   * Resumen del estado actual y último cambio
   */
  resumen?: {
    estadoActual: string;
    ultimoCambio?: string;
    ultimaCambioFecha?: Date;
  };
}
