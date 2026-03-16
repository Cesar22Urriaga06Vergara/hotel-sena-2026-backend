import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard que verifica si el usuario tiene uno de los roles permitidos
 * Se usa junto con el decorador @Roles('admin', 'recepcionista')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    
    // Si no hay roles definidos, permitir acceso
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Verificar si el usuario existe y tiene uno de los roles requeridos
    if (!user || !user.rol) {
      throw new ForbiddenException('Usuario no autenticado o no tiene rol');
    }

    const hasRole = requiredRoles.includes(user.rol);
    
    if (!hasRole) {
      throw new ForbiddenException(
        `Este recurso requiere uno de los siguientes roles: ${requiredRoles.join(', ')}. Tu rol es: ${user.rol}`,
      );
    }

    return true;
  }
}
