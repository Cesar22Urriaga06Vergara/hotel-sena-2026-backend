import {
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo detalle de factura
 *
 * Permite agregar líneas a una factura en estado BORRADOR/EDITABLE
 * Calcula automáticamente totales e impuestos según categoría
 *
 * Ejemplos de tipoConcepto: 'habitacion', 'servicio', 'descuento', 'cargo_adicional'
 */
export class CreateDetalleFacturaDto {
  @ApiProperty({
    description: 'Tipo de concepto a facturar',
    example: 'servicio',
    enum: ['habitacion', 'servicio', 'descuento', 'cargo_adicional'],
  })
  @IsNotEmpty({ message: 'Tipo de concepto es obligatorio' })
  @IsEnum(['habitacion', 'servicio', 'descuento', 'cargo_adicional'], {
    message: 'Tipo de concepto debe ser: habitacion, servicio, descuento, cargo_adicional',
  })
  tipoConcepto: string;

  @ApiProperty({
    description: 'Descripción legible del concepto en la factura',
    example: 'Servicio Spa Premium (2026-04-01)',
    minLength: 5,
    maxLength: 500,
  })
  @IsNotEmpty({ message: 'Descripción es obligatoria' })
  @IsString({ message: 'Descripción debe ser texto' })
  @MinLength(5, { message: 'Descripción debe tener mín 5 caracteres' })
  @MaxLength(500, { message: 'Descripción no puede exceder 500 caracteres' })
  descripcion: string;

  @ApiProperty({
    description: 'Cantidad del concepto (puede ser decimal para servicios)',
    example: 1.5,
    type: Number,
  })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Cantidad es obligatoria' })
  @IsNumber({}, { message: 'Cantidad debe ser un número' })
  @Min(0.01, { message: 'Cantidad debe ser mayor a 0' })
  cantidad: number;

  @ApiProperty({
    description: 'Precio unitario del concepto ($)',
    example: 150000,
    type: Number,
  })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Precio unitario es obligatorio' })
  @IsNumber({}, { message: 'Precio unitario debe ser un número' })
  @Min(0, { message: 'Precio unitario no puede ser negativo' })
  precioUnitario: number;

  @ApiPropertyOptional({
    description: 'ID de la categoría de servicio (para cálculo de impuestos)',
    example: 5,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'ID de categoría debe ser un número' })
  @Min(1, { message: 'ID de categoría debe ser >= 1' })
  categoriaServiciosId?: number;

  @ApiPropertyOptional({
    description: 'ID del pedido asociado (si viene de un pedido)',
    example: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'ID de pedido debe ser un número' })
  @Min(1, { message: 'ID de pedido debe ser >= 1' })
  idPedido?: number;

  @ApiPropertyOptional({
    description: 'ID de referencia (idServicio, etc.) para trazabilidad',
    example: 25,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'ID de referencia debe ser un número' })
  @Min(1, { message: 'ID de referencia debe ser >= 1' })
  idReferencia?: number;
}
