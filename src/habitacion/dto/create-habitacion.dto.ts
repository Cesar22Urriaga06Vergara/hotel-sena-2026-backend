import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHabitacionDto {
  @ApiProperty({
    description: 'ID del hotel al que pertenece la habitación',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idHotel: number;

  @ApiProperty({
    description: 'Número de la habitación',
    example: '101',
  })
  @IsString()
  @IsNotEmpty()
  numeroHabitacion: string;

  @ApiPropertyOptional({
    description: 'Piso donde se encuentra la habitación',
    example: '1',
  })
  @IsString()
  @IsOptional()
  piso?: string;

  @ApiPropertyOptional({
    description: 'Estado actual de la habitación',
    example: 'disponible',
    enum: ['disponible', 'ocupada', 'mantenimiento', 'limpieza', 'reservada'],
    default: 'disponible',
  })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiProperty({
    description: 'ID del tipo de habitación',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idTipoHabitacion: number;

  @ApiPropertyOptional({
    description: 'URLs de las imágenes subidas a Cloudinary',
    example: 'https://res.cloudinary.com/.../img1.jpg,https://res.cloudinary.com/.../img2.jpg',
    type: String,
  })
  @IsOptional()
  @IsString()
  imagenes?: string;
}
