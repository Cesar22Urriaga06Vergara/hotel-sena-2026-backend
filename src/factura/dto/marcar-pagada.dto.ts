import { IsOptional, IsDate, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para marcar una factura como pagada
 * 
 * Solo requiere el ID de la factura (vía URL).
 * La fecha de pago es opcional; si no se proporciona, se usa la fecha actual.
 */
export class MarcarPagadaDto {
  /**
   * Fecha del pago (opcional). Si no se proporciona, se usa la fecha actual.
   * Formato: ISO 8601 (2026-03-15T10:30:00Z)
   */
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fechaPago?: Date;

  /**
   * ID del usuario que marca la factura como pagada (opcional, se puede obtener del contexto)
   */
  @IsOptional()
  @IsNumber()
  usuarioId?: number;
}
