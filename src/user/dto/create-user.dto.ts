import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  // Validación de email con formato correcto
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  // Validación de contraseña con mínimo 6 caracteres
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;

  // Validación de nombre completo
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  fullName: string;

  // Validación de rol usando enum
  @IsEnum(UserRole, { message: 'El rol debe ser: admin, recepcionista o cliente' })
  @IsOptional()
  role?: UserRole;

  // ID de empleado (opcional, solo para admin y recepcionista)
  @IsNumber({}, { message: 'El ID de empleado debe ser un número' })
  @IsOptional()
  idEmpleado?: number;

  // ID de cliente (opcional, solo para rol cliente)
  @IsNumber({}, { message: 'El ID de cliente debe ser un número' })
  @IsOptional()
  idCliente?: number;
}