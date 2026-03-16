import { IsString, IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ROLES_EMPLEADO, type RolEmpleado } from '../../empleado/dto/create-empleado.dto';

/**
 * DTO para que admin/superadmin creen usuarios del sistema
 * Permite crear usuarios con diferentes roles
 */
export class CreateUserAdminDto {
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @ApiProperty({
    example: 'usuario@hotel.com',
    description: 'Email único del usuario',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @ApiProperty({
    example: 'password123',
    minLength: 6,
    description: 'Contraseña (mínimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;

  @ApiProperty({
    example: 'admin',
    enum: ROLES_EMPLEADO,
    description: 'Rol del usuario',
  })
  @IsEnum(ROLES_EMPLEADO, {
    message: `El rol debe ser uno de: ${ROLES_EMPLEADO.join(', ')}`,
  })
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  role: RolEmpleado;

  @ApiProperty({
    example: '1003001750',
    description: 'Cédula del usuario (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  cedula?: string;

  @ApiProperty({
    example: true,
    description: 'Si el usuario está activo',
    required: false,
  })
  @IsOptional()
  isActive?: boolean;
}
