import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear una nueva factura
 *
 * Una factura surge de una RESERVA + SERVICIOS ADICIONALES
 * Cálculo automático:
 * - Subtotal = suma de servicios + room rate
 * - IVA = subtotal * (porcentajeIva / 100)
 * - Total = subtotal + IVA - descuentos
 *
 * Estado inicial: BORRADOR (permite ediciones)
 */
export class CreateFacturaDto {
  @ApiProperty({
    description: 'ID de la reserva base',
    example: 5,
    type: Number,
  })
  @Type(() => Number)
  @IsNotEmpty({ message: 'ID de reserva es obligatorio' })
  @IsNumber({}, { message: 'ID de reserva debe ser un número' })
  @Min(1, { message: 'ID de reserva debe ser >= 1' })
  idReserva: number;

  @ApiPropertyOptional({
    description: 'IVA aplicable a esta factura (%)',
    example: 19,
    type: Number,
    default: 19,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({}, { message: 'IVA debe ser un número' })
  @Min(0, { message: 'IVA no puede ser negativo' })
  @Max(100, { message: 'IVA no puede exceder 100%' })
  porcentajeIva?: number;

  @ApiPropertyOptional({
    description: 'Descuento a aplicar (monto en $, no %)',
    example: 5000,
    type: Number,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({}, { message: 'Descuento debe ser un número' })
  @Min(0, { message: 'Descuento no puede ser negativo' })
  descuentoMonto?: number;

  @ApiPropertyOptional({
    description: 'Motivo del descuento',
    example: 'Cortesía por inconvenientes',
    minLength: 5,
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: 'Motivo debe ser texto' })
  @MinLength(5, { message: 'Motivo debe tener min 5 caracteres' })
  @MaxLength(200, { message: 'Motivo no puede exceder 200 caracteres' })
  motivoDescuento?: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales de la factura',
    example: 'Factura por cortesía del gerente',
    minLength: 0,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Observaciones debe ser texto' })
  @MaxLength(500, { message: 'Observaciones no puede exceder 500 caracteres' })
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Notas internas (solo admin ven esto)',
    example: 'Cliente VIP - seguimiento personalizado',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Notas internas debe ser texto' })
  @MaxLength(500, { message: 'Notas no puede exceder 500 caracteres' })
  notasInternas?: string;
}
