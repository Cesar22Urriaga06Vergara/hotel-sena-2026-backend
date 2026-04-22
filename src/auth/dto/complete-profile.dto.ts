import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO para completar perfil de cliente (Paso 2)
 * Los clientes pueden completar sus datos adicionales después del registro
 * O al hacer su primera reserva
 *
 * VALIDACIONES:
 * - Cédula: mín 4 dígitos, máx 20, solo números y guiones
 * - Teléfono: formato internacional (+57) o local (10+ dígitos)
 * - Tipo de documento: CC, TI, CE, PEP, etc
 */
export class CompleteProfileDto {
  @ApiProperty({
    example: '1003001750',
    description: 'Cédula del cliente (mín 4 dígitos, sin espacios)',
    minLength: 4,
    maxLength: 20,
  })
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  @MinLength(4, { message: 'La cédula debe tener mínimo 4 caracteres' })
  @Matches(/^[\d\-]+$/, {
    message: 'La cédula solo puede contener dígitos y guiones, sin espacios',
  })
  @Transform(({ value }) => value?.trim().replace(/\s+/g, ''))
  cedula: string;

  @ApiPropertyOptional({
    example: 'CC',
    description:
      'Tipo de documento (CC=Cédula, TI=TI, CE=Extranjería, PEP=Pasaporte, LI=Licencia)',
    default: 'CC',
    enum: ['CC', 'TI', 'CE', 'PEP', 'LI'],
  })
  @IsOptional()
  @IsString({ message: 'El tipo de documento debe ser una cadena de texto' })
  @Matches(/^(CC|TI|CE|PEP|LI)$/, {
    message: 'Tipo de documento inválido. Use: CC, TI, CE, PEP, LI',
  })
  tipoDocumento?: string;

  @ApiPropertyOptional({
    example: '3001234567',
    description: 'Teléfono del cliente (10+ dígitos o formato +57)',
    minLength: 10,
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @ValidateIf((o) => o.telefono !== undefined && o.telefono !== null && o.telefono !== '')
  @Matches(/^(\+\d{1,3})?[\d\s\-()]{9,}$/, {
    message:
      'El teléfono debe tener formato válido (10+ dígitos, puede incluir +código país)',
  })
  @Transform(({ value }) => value?.trim().replace(/\s+/g, ''))
  telefono?: string;

  @ApiPropertyOptional({
    example: 'Calle 10 #5-50',
    description: 'Dirección del cliente',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser texto' })
  direccion?: string;

  @ApiPropertyOptional({
    example: 'CO',
    description: 'País de residencia (código ISO 2 letras)',
    maxLength: 2,
  })
  @IsOptional()
  @IsString({ message: 'El país debe ser texto' })
  @Matches(/^[A-Z]{2}$/, {
    message: 'El país debe ser un código ISO de 2 letras (ej: CO, US, ES)',
  })
  paisResidencia?: string;

  @ApiPropertyOptional({
    example: 'Español',
    description: 'Idioma preferido',
  })
  @IsOptional()
  @IsString({ message: 'El idioma debe ser texto' })
  idiomaPreferido?: string;
}
