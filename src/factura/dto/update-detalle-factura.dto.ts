import {
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para actualizar un detalle de factura
 *
 * Todos los campos son opcionales
 * Permite actualizar cantidad, precio, descripción y estado
 * Estado tiene máquina de estados: PENDIENTE → ENTREGADO/CANCELADO → inmutable
 */
export class UpdateDetalleFacturaDto {
  @ApiPropertyOptional({
    description: 'Nueva cantidad del concepto',
    example: 2,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Cantidad debe ser un número' })
  @Min(0.01, { message: 'Cantidad debe ser mayor a 0' })
  cantidad?: number;

  @ApiPropertyOptional({
    description: 'Nuevo precio unitario ($)',
    example: 180000,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Precio unitario debe ser un número' })
  @Min(0, { message: 'Precio unitario no puede ser negativo' })
  precioUnitario?: number;

  @ApiPropertyOptional({
    description: 'Nueva descripción del concepto',
    example: 'Servicio Spa Premium mejorado',
    minLength: 5,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Descripción debe ser texto' })
  @MinLength(5, { message: 'Descripción debe tener mín 5 caracteres' })
  @MaxLength(500, { message: 'Descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Nuevo estado del detalle (máquina de estados: PENDIENTE→ENTREGADO/CANCELADO)',
    example: 'ENTREGADO',
    enum: ['PENDIENTE', 'ENTREGADO', 'CANCELADO'],
  })
  @IsOptional()
  @IsEnum(['PENDIENTE', 'ENTREGADO', 'CANCELADO'], {
    message: 'Estado debe ser: PENDIENTE, ENTREGADO, CANCELADO',
  })
  estado?: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO';
}
