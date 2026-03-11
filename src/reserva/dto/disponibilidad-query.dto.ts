import { IsDateString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DisponibilidadQueryDto {
  @ApiProperty({
    description: 'ID del hotel',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idHotel: number;

  @ApiProperty({
    description: 'Fecha de check-in (YYYY-MM-DD)',
    example: '2026-03-10',
  })
  @IsDateString()
  @IsNotEmpty()
  checkinFecha: string;

  @ApiProperty({
    description: 'Fecha de check-out (YYYY-MM-DD)',
    example: '2026-03-12',
  })
  @IsDateString()
  @IsNotEmpty()
  checkoutFecha: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de habitación específico',
    example: 1,
  })  @Type(() => Number)  @IsNumber()
  @IsOptional()
  idTipoHabitacion?: number;
}
