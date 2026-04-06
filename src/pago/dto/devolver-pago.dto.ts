import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para DEVOLVER PAGO (REINTEGRO)
 * Revierte un pago registrado en una factura
 * Requisitos:
 * - Factura debe estar en estado PAGADA o PARCIALMENTE_PAGADA
 * - Monto a devolver no puede exceder lo pagado
 * - Requiere motivo documentado para auditoría
 */
export class DevolverPagoDto {
  @ApiProperty({
    description: 'ID del pago a devolver',
    example: 5,
    type: Number,
  })
  @Type(() => Number)
  @IsNotEmpty({ message: 'ID de pago es requerido' })
  @IsNumber({}, { message: 'ID debe ser número' })
  @IsPositive({ message: 'ID debe ser positivo' })
  idPago: number;

  @ApiProperty({
    description: 'Monto a devolver (no puede exceder monto original del pago)',
    example: 50000,
    type: Number,
  })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Monto a devolver es requerido' })
  @IsNumber({}, { message: 'Monto debe ser número' })
  @IsPositive({ message: 'Monto debe ser positivo' })
  montoDevolver: number;

  @ApiProperty({
    description: 'Motivo de la devolución (auditoría)',
    example: 'Cobro duplicado - cliente nos informó',
    minLength: 10,
    maxLength: 500,
  })
  @IsNotEmpty({ message: 'Motivo es requerido' })
  @IsString({ message: 'Motivo debe ser texto' })
  @MinLength(10, { message: 'Motivo debe tener mín 10 caracteres' })
  @MaxLength(500, { message: 'Motivo no puede exceder 500 caracteres' })
  motivo: string;

  @ApiPropertyOptional({
    description: 'Referencia de devolución (número de reintegro, transferencia, etc)',
    example: 'REV-2026-04-05-001',
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Referencia debe ser texto' })
  @MinLength(3, { message: 'Referencia debe tener mín 3 caracteres' })
  @MaxLength(50, { message: 'Referencia no puede exceder 50 caracteres' })
  referenciaDevolucion?: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    maxLength: 300,
  })
  @IsOptional()
  @IsString({ message: 'Observaciones debe ser texto' })
  @MaxLength(300, { message: 'Observaciones no puede exceder 300 caracteres' })
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Usuario que autoriza la devolución',
    example: 'gerente@hotel.com',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Autorizado por debe ser texto' })
  @MaxLength(100, { message: 'Autorizado por no puede exceder 100 caracteres' })
  autorizadoPor?: string;
}
