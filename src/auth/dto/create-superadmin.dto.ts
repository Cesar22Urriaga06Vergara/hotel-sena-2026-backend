import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear el primer SuperAdmin (BOOTSTRAP ONLY)
 * Este endpoint es público pero solo funciona si no existe ningún superadmin en el sistema
 * 
 * Después de crear el primer superadmin, todos los demás empleados
 * deben ser creados mediante POST /empleados (ruta protegida)
 */
export class CreateSuperadminDto {
  @ApiProperty({
    example: '1003001750',
    description: 'Cédula única del superadmin',
  })
  @IsString()
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  cedula: string;

  @ApiProperty({
    example: 'Admin',
    description: 'Nombre del superadmin',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @ApiProperty({
    example: 'Sistema',
    description: 'Apellido del superadmin',
  })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  apellido: string;

  @ApiProperty({
    example: 'admin@hotel.com',
    description: 'Email único del superadmin',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @ApiProperty({
    example: 'Admin123!',
    minLength: 6,
    description: 'Contraseña (mínimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}
