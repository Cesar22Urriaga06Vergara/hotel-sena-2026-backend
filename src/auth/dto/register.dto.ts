import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { UserRole } from '../../user/entities/user.entity';

export class RegisterDto {
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;

  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  fullName: string;

  @IsEnum(UserRole, { message: 'El rol debe ser: admin, recepcionista o cliente' })
  @IsOptional()
  role?: UserRole;

  @IsNumber({}, { message: 'El ID de empleado debe ser un número' })
  @IsOptional()
  idEmpleado?: number;

  @IsNumber({}, { message: 'El ID de cliente debe ser un número' })
  @IsOptional()
  idCliente?: number;
}