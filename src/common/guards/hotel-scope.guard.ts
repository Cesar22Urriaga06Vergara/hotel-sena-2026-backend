import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reflector } from '@nestjs/core';

/**
 * Guard para validaciones de permisos por hotel
 * Fase 4: Asegurar que usuarios solo accedan a recursos de su hotel
 * 
 * Uso:
 * @UseGuards(JwtAuthGuard, RolesGuard, HotelScopeGuard)
 * @SetMetadata('resource', 'factura')  // nombre del recurso
 */
@Injectable()
export class HotelScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Superadmin tiene acceso a todos los recursos
    if (user.rol === 'superadmin') {
      return true;
    }

    // Admin y recepcionista deben tener hotel asignado
    if (!user.idHotel) {
      throw new ForbiddenException(
        'Usuario debe estar asignado a un hotel para realizar esta operación',
      );
    }

    // Obtener el nombre del recurso desde metadata
    const resourceType = this.reflector.get<string>('resource', context.getHandler());

    // Si el recurso tiene un idHotel en el body o params, validarlo
    const resourceId = request.params.id;
    const bodyIdHotel = request.body?.idHotel;
    const queryIdHotel = request.query?.idHotel;

    // Validar que si se especifica un idHotel en el request, coincida con el del usuario
    if (bodyIdHotel && Number(bodyIdHotel) !== user.idHotel) {
      throw new ForbiddenException(
        `No tiene permisos para crear/modificar recursos del hotel ${bodyIdHotel}`,
      );
    }

    if (queryIdHotel && Number(queryIdHotel) !== user.idHotel) {
      throw new ForbiddenException(
        `No tiene permisos para consultar recursos del hotel ${queryIdHotel}`,
      );
    }

    return true;
  }
}

/**
 * Decorator para especificar el tipo de recurso
 */
export const ResourceType = (resourceType: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('resource', resourceType, descriptor.value);
    return descriptor;
  };
};
