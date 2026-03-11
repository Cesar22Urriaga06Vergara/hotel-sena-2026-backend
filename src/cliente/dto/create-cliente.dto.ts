import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiPropertyOptional({ example: '1003001750', description: 'Cédula única del cliente' })
  @IsOptional()
  @IsString()
  cedula?: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del cliente' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del cliente' })
  @IsString()
  @IsNotEmpty()
  apellido: string;

  @ApiProperty({ example: 'juan@example.com', description: 'Email único del cliente' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'hashedPassword123',
    description: 'Contraseña hasheada (generada internamente por AuthService)',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: '+57 300 1234567', description: 'Teléfono del cliente' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({
    example: 'CC',
    description: 'Tipo de documento (CC, TI, PEP, etc.)',
  })
  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @ApiPropertyOptional({
    example: 'cliente',
    description: 'Rol del usuario (por defecto "cliente")',
  })
  @IsOptional()
  @IsString()
  rol?: string;

  @ApiPropertyOptional({ description: 'Dirección' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ description: 'País de nacionalidad' })
  @IsOptional()
  @IsString()
  paisNacionalidad?: string;

  @ApiPropertyOptional({ description: 'País de residencia' })
  @IsOptional()
  @IsString()
  paisResidencia?: string;

  @ApiPropertyOptional({ description: 'Idioma preferido' })
  @IsOptional()
  @IsString()
  idiomaPreferido?: string;

  @ApiPropertyOptional({ description: 'Fecha de nacimiento (formato ISO)' })
  @IsOptional()
  @IsString()
  fechaNacimiento?: string;

  @ApiPropertyOptional({ description: 'Tipo de visa' })
  @IsOptional()
  @IsString()
  tipoVisa?: string;

  @ApiPropertyOptional({ description: 'Número de visa' })
  @IsOptional()
  @IsString()
  numeroVisa?: string;

  @ApiPropertyOptional({ description: 'Fecha de expiración de visa (formato ISO)' })
  @IsOptional()
  @IsString()
  visaExpira?: string;
}
