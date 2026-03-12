import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsBoolean, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const CATEGORIAS_SERVICIO = ['cafeteria', 'lavanderia', 'spa', 'room_service', 'minibar', 'otros'];

export class CreateServicioDto {
  @ApiProperty({ example: 1, description: 'ID del hotel' })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idHotel: number;

  @ApiProperty({ example: 'Café Expreso', description: 'Nombre del servicio' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ example: 'Café expreso de alta calidad', description: 'Descripción' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    example: 'cafeteria',
    enum: CATEGORIAS_SERVICIO,
    description: 'Categoría del servicio',
  })
  @IsEnum(CATEGORIAS_SERVICIO, {
    message: `Categoría debe ser una de: ${CATEGORIAS_SERVICIO.join(', ')}`,
  })
  @IsNotEmpty()
  categoria: string;

  @ApiProperty({ example: 15000, description: 'Precio unitario en pesos' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  precioUnitario: number;

  @ApiPropertyOptional({ example: 'taza', description: 'Unidad de medida' })
  @IsString()
  @IsOptional()
  unidadMedida?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cafe.jpg', description: 'URL de imagen' })
  @IsString()
  @IsOptional()
  imagenUrl?: string;

  @ApiPropertyOptional({ example: true, description: 'Servicio activo', default: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Disponible para delivery', default: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  disponibleDelivery?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Disponible para recogida', default: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  disponibleRecogida?: boolean;
}
