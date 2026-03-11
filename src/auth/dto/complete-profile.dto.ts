import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para completar perfil de cliente (Paso 2)
 * Los clientes pueden completar sus datos adicionales después del registro
 * O al hacer su primera reserva
 */
export class CompleteProfileDto {
  @ApiProperty({
    example: '1003001750',
    description: 'Cédula del cliente',
  })
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  cedula: string;

  @ApiPropertyOptional({
    example: 'CC',
    description: 'Tipo de documento (CC, TI, CE, etc)',
    default: 'CC',
  })
  @IsOptional()
  @IsString({ message: 'El tipo de documento debe ser una cadena de texto' })
  tipoDocumento?: string;

  @ApiPropertyOptional({
    example: '3001234567',
    description: 'Teléfono del cliente',
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  telefono?: string;
}
