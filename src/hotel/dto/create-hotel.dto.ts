import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHotelDto {
  @ApiProperty({
    example: 'Hotel Sena 2026',
    description: 'Nombre del hotel',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    example: '123456789',
    description: 'NIT único del hotel',
  })
  @IsString()
  @IsNotEmpty()
  nit: string;

  @ApiPropertyOptional({
    example: 'Calle 10 No. 5-50',
    description: 'Dirección del hotel',
  })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({
    example: 'Bogotá',
    description: 'Ciudad donde está ubicado el hotel',
  })
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional({
    example: 'Colombia',
    description: 'País donde está ubicado el hotel',
  })
  @IsOptional()
  @IsString()
  pais?: string;

  @ApiPropertyOptional({
    example: '+57 1 1234567',
    description: 'Teléfono de contacto del hotel',
  })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({
    example: 'info@hotelsena.com',
    description: 'Email de contacto del hotel',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Calificación en estrellas (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  estrellas?: number;

  @ApiPropertyOptional({
    example: 'Hotel 5 estrellas con servicios premium',
    description: 'Descripción del hotel',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
