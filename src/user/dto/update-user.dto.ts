import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

// PartialType hace que todas las propiedades de CreateUserDto sean opcionales
export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Campo opcional para actualizar el estado activo
  @ApiPropertyOptional({
    example: true,
    description: 'Estado activo del usuario',
  })
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  @IsOptional()
  isActive?: boolean;

  // Campo opcional para actualizar el rol
  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.RECEPCIONISTA,
    description: 'Nuevo rol del usuario',
  })
  @IsEnum(UserRole, { message: 'El rol debe ser: admin, recepcionista o cliente' })
  @IsOptional()
  role?: UserRole;
}