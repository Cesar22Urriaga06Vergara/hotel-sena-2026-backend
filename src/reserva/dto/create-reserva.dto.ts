import { IsNumber, IsDateString, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservaDto {
  @ApiProperty({
    description: 'ID del cliente que realiza la reserva',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idCliente: number;

  @ApiProperty({
    description: 'ID del hotel donde se realiza la reserva',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idHotel: number;

  @ApiProperty({
    description: 'ID del tipo de habitación',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
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
  @IsNumber()
  @Min(1)
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
