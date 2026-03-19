import { IsString, IsNotEmpty, IsOptional, IsNumber, MinLength, MaxLength } from 'class-validator';

/**
 * DTO para anular una factura
 * 
 * Requiere un motivo obigatorio para mantener auditoría de por qué se anuló la factura.
 */
export class AnularFacturaDto {
  /**
   * Motivo de la anulación (obligatorio, mínimo 10 caracteres)
   * 
   * @example "Error en el cálculo de IVA según cliente"
   */
  @IsString()
  @IsNotEmpty({ message: 'El motivo es obligatorio' })
  @MinLength(10, { message: 'El motivo debe tener al menos 10 caracteres' })
  @MaxLength(500, { message: 'El motivo no puede exceder 500 caracteres' })
  motivo: string;

  /**
   * ID del usuario que anula la factura (opcional, se puede obtener del contexto)
   */
  @IsOptional()
  @IsNumber()
  usuarioId?: number;
}
