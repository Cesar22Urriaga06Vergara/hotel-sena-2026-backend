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
 * DTO para CONFIRMAR CHECK-IN
 * Convierte una reserva CONFIRMADA a estado CHECK-IN
 * Crea o actualiza el folio de caja
 */
export class ConfirmarCheckInDto {
  @ApiProperty({
    description: 'ID de la reserva a hacer check-in',
    example: 42,
    type: Number,
  })
  @Type(() => Number)
  @IsNotEmpty({ message: 'ID de reserva es requerido' })
  @IsNumber({}, { message: 'ID de reserva debe ser número' })
  @IsPositive({ message: 'ID de reserva debe ser positivo' })
  idReserva: number;

  @ApiPropertyOptional({
    description: 'Número de huéspedes personalizados (default: de reserva)',
    example: 2,
    type: Number,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({}, { message: 'Número de huéspedes debe ser número' })
  @IsPositive({ message: 'Número de huéspedes debe ser positivo' })
  numeroHuespedesActual?: number;

  @ApiPropertyOptional({
    description: 'Observaciones del check-in',
    example: 'Cliente solicita piso alto, vistas al mar',
    minLength: 0,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Observaciones debe ser texto' })
  @MaxLength(500, { message: 'Observaciones no puede exceder 500 caracteres' })
  observacionesCheckin?: string;

  @ApiPropertyOptional({
    description: 'Documento de identificación del huésped principal',
    example: '1234567890',
    minLength: 5,
    maxLength: 30,
  })
  @IsOptional()
  @IsString({ message: 'Documento debe ser texto' })
  @MinLength(5, { message: 'Documento debe tener mín 5 caracteres' })
  @MaxLength(30, { message: 'Documento no puede exceder 30 caracteres' })
  documentoHuespedPrincipal?: string;
}
