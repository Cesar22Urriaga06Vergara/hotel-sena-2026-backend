import { IsOptional, IsNumber } from 'class-validator';

/**
 * DTO para emitir una factura (cambiar estado a EMITIDA)
 * 
 * Solo requiere el ID de la factura (vía URL).
 * El usuarioId es opcional y se puede obtener del token de autenticación.
 */
export class EmitirFacturaDto {
  /**
   * ID del usuario que emite la factura (opcional, se puede obtener del contexto)
   */
  @IsOptional()
  @IsNumber()
  usuarioId?: number;
}
