import { IsString, IsEmail, IsNotEmpty, IsNumber, MinLength, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmpleadoDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'ID del hotel al que pertenece el empleado (NULL para superadmin)',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  id_hotel?: number;

  @ApiProperty({ example: '1003001750', description: 'Cédula única del empleado' })
  @IsString()
  @IsNotEmpty()
  cedula: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del empleado' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del empleado' })
  @IsString()
  @IsNotEmpty()
  apellido: string;

  @ApiProperty({ example: 'juan@example.com', description: 'Email único del empleado' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Contraseña (mínimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'recepcionista',
    description: 'Rol del empleado (recepcionista, admin, superadmin)',
  })
  @IsString()
  @IsNotEmpty()
  rol: string;

  @ApiPropertyOptional({
    example: 'activo',
    description: 'Estado del empleado (activo, inactivo)',
  })
  @IsString()
  @IsOptional()
  estado?: string;
}
