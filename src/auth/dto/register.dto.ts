import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para registro de clientes (Paso 1 - Básico)
 * RESTRICCIÓN: Este DTO es SOLO para clientes
 * - NO tiene campo 'rol' ni 'idEmpleado'
 * - El rol 'cliente' se asigna automáticamente
 * - Los empleados se crean por el admin mediante POST /empleados
 * 
 * Datos adicionales (cédula, teléfono, tipo documento) se completan después
 * al hacer la primera reserva o desde el perfil del usuario
 */
export class RegisterDto {
  @ApiProperty({
    example: 'Juan',
    description: 'Nombre del cliente',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @ApiProperty({
    example: 'Pérez',
    description: 'Apellido del cliente',
  })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  apellido: string;

  @ApiProperty({
    example: 'usuario@correo.com',
    description: 'Correo electrónico del cliente',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @ApiProperty({
    example: 'password123',
    minLength: 6,
    description: 'Contraseña del cliente',
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}