import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTipoHabitacionDto {
  @ApiProperty({
    description: 'ID del hotel al que pertenece el tipo de habitación',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idHotel: number;

  @ApiProperty({
    description: 'Nombre del tipo de habitación',
    example: 'Habitación Doble',
  })
  @IsString()
  @IsNotEmpty()
  nombreTipo: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del tipo de habitación',
    example: 'Habitación espaciosa con dos camas individuales',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'Capacidad máxima de personas',
    example: 2,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  capacidadPersonas: number;

  @ApiPropertyOptional({
    description: 'Precio base por noche',
    example: 120000,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  precioBase?: number;

  @ApiPropertyOptional({
    description: 'Indica si el tipo de habitación está activo',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Lista de IDs de amenidades asociadas',
    example: [1, 2, 3],
    type: [Number],
  })
  @Type(() => Number)
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  amenidadesIds?: number[];
}
