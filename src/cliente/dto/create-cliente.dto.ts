import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateClienteDto {
  @ApiPropertyOptional({
    example: '1003001750',
    description: 'Cédula única del cliente (mín 4 dígitos, máx 20, sin espacios)',
    minLength: 4,
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'La cédula debe ser texto' })
  @MinLength(4, { message: 'La cédula debe tener mínimo 4 caracteres' })
  @MaxLength(20, { message: 'La cédula no puede exceder 20 caracteres' })
  @Matches(/^[\d\-]+$/, {
    message: 'La cédula solo puede contener dígitos y guiones',
  })
  @Transform(({ value }) => value?.trim().replace(/\s+/g, ''))
  cedula?: string;

  @ApiProperty({
    example: 'Juan',
    description: 'Nombre del cliente',
    minLength: 2,
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener mínimo 2 caracteres' })
  nombre: string;

  @ApiProperty({
    example: 'Pérez',
    description: 'Apellido del cliente',
    minLength: 2,
  })
  @IsString({ message: 'El apellido debe ser texto' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @MinLength(2, { message: 'El apellido debe tener mínimo 2 caracteres' })
  apellido: string;

  @ApiProperty({
    example: 'juan@example.com',
    description: 'Email único del cliente',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    example: 'hashedPassword123',
    description: 'Contraseña hasheada (generada internamente por AuthService)',
    minLength: 8,
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  password: string;

  @ApiPropertyOptional({
    example: '3001234567',
    description: 'Teléfono del cliente (10+ dígitos o +código país)',
    minLength: 10,
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @ValidateIf((o) => o.telefono !== undefined && o.telefono !== null && o.telefono !== '')
  @Matches(/^(\+\d{1,3})?[\d\s\-()]{9,}$/, {
    message:
      'El teléfono debe tener formato válido (10+ dígitos o +código país)',
  })
  @Transform(({ value }) => value?.trim().replace(/\s+/g, ''))
  telefono?: string;

  @ApiPropertyOptional({
    example: 'CC',
    description: 'Tipo de documento (CC, TI, PE, CE, LI)',
    enum: ['CC', 'TI', 'PE', 'CE', 'LI'],
  })
  @IsOptional()
  @IsString({ message: 'El tipo de documento debe ser texto' })
  @Matches(/^(CC|TI|PE|CE|LI)$/, {
    message: 'Tipo de documento inválido. Use: CC, TI, PE, CE, LI',
  })
  tipoDocumento?: string;

  @ApiPropertyOptional({
    example: 'cliente',
    description: 'Rol del usuario (por defecto "cliente")',
  })
  @IsOptional()
  @IsString({ message: 'El rol debe ser texto' })
  rol?: string;

  @ApiPropertyOptional({
    example: 'Calle 10 #5-50',
    description: 'Dirección del cliente',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser texto' })
  @MaxLength(255, { message: 'La dirección no puede exceder 255 caracteres' })
  direccion?: string;

  @ApiPropertyOptional({
    example: 'CO',
    description: 'País de nacionalidad (código ISO 2 letras)',
  })
  @IsOptional()
  @IsString({ message: 'El país de nacionalidad debe ser texto' })
  @Matches(/^[A-Z]{2}$/, {
    message: 'El país debe ser código ISO de 2 letras (ej: CO, US, ES)',
  })
  paisNacionalidad?: string;

  @ApiPropertyOptional({
    example: 'CO',
    description: 'País de residencia (código ISO 2 letras)',
  })
  @IsOptional()
  @IsString({ message: 'El país de residencia debe ser texto' })
  @Matches(/^[A-Z]{2}$/, {
    message: 'El país debe ser código ISO de 2 letras (ej: CO, US, ES)',
  })
  paisResidencia?: string;

  @ApiPropertyOptional({
    example: 'Español',
    description: 'Idioma preferido',
  })
  @IsOptional()
  @IsString({ message: 'El idioma debe ser texto' })
  idiomaPreferido?: string;

  @ApiPropertyOptional({
    example: '1990-01-15',
    description: 'Fecha de nacimiento (formato YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString({ message: 'La fecha de nacimiento debe ser texto' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe estar en formato YYYY-MM-DD',
  })
  fechaNacimiento?: string;

  @ApiPropertyOptional({
    example: 'V',
    description: 'Tipo de visa',
  })
  @IsOptional()
  @IsString({ message: 'El tipo de visa debe ser texto' })
  tipoVisa?: string;

  @ApiPropertyOptional({
    example: 'AB123456',
    description: 'Número de visa',
  })
  @IsOptional()
  @IsString({ message: 'El número de visa debe ser texto' })
  numeroVisa?: string;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description: 'Fecha de expiración de visa (formato YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString({ message: 'La fecha de visa debe ser texto' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe estar en formato YYYY-MM-DD',
  })
  visaExpira?: string;
}
