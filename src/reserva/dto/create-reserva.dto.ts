import { IsNumber, IsDateString, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservaDto {
  @ApiProperty({
    description: 'ID del cliente que realiza la reserva',
    example: 1,
  })
  @Type(() => Number)
  @Min(1, { message: 'ID de cliente debe ser un número válido' })
  @IsNotEmpty()
  idCliente: number;

  @ApiProperty({
    description: 'ID del hotel donde se realiza la reserva',
    example: 1,
  })
  @Type(() => Number)
  @Min(1, { message: 'ID de hotel debe ser un número válido' })
  @IsNotEmpty()
  idHotel: number;

  @ApiProperty({
    description: 'ID del tipo de habitación',
    example: 1,
  })
  @Type(() => Number)
  @Min(1, { message: 'ID de tipo habitación debe ser un número válido' })
  @IsNotEmpty()
  idTipoHabitacion: number;

  @ApiProperty({
    description: 'Fecha de check-in (YYYY-MM-DD)',
    example: '2026-03-10',
  })
  @IsDateString()
  @IsNotEmpty()
  checkinPrevisto: string;

  @ApiProperty({
    description: 'Fecha de check-out (YYYY-MM-DD)',
    example: '2026-03-12',
  })
  @IsDateString()
  @IsNotEmpty()
  checkoutPrevisto: string;

  @ApiProperty({
    description: 'Número de huéspedes',
    example: 2,
  })
  @Type(() => Number)
  @Min(1, { message: 'Debe haber al menos 1 huésped' })
  @IsNotEmpty()
  numeroHuespedes: number;

  @ApiPropertyOptional({
    description: 'Origen de la reserva',
    example: 'web',
    enum: ['web', 'mostrador', 'telefono'],
    default: 'web',
  })
  @IsString()
  @IsOptional()
  origenReserva?: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Quiero vista al mar',
  })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
