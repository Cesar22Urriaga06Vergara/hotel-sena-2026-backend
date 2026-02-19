import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { UserRole } from '../../user/entities/user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'usuario@correo.com',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @ApiProperty({
    example: 'password123',
    minLength: 6,
    description: 'Contraseña del usuario',
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario',
  })
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  fullName: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.CLIENTE,
    description: 'Rol del usuario',
  })
  @IsEnum(UserRole, { message: 'El rol debe ser: admin, recepcionista o cliente' })
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    example: 10,
    description: 'ID del empleado asociado (si aplica)',
  })
  @IsNumber({}, { message: 'El ID de empleado debe ser un número' })
  @IsOptional()
  idEmpleado?: number;

  @ApiPropertyOptional({
    example: 25,
    description: 'ID del cliente asociado (si aplica)',
  })
  @IsNumber({}, { message: 'El ID de cliente debe ser un número' })
  @IsOptional()
  idCliente?: number;
}