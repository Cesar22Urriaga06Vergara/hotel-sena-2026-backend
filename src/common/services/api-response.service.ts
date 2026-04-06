import { Injectable } from '@nestjs/common';
import {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiListResponse,
  ERROR_CODES,
} from '../dto/api-response.dto';

/**
 * SERVICIO DE RESPUESTAS ESTÁNDAR
 *
 * Proporciona métodos consistentes para construir respuestas en toda la API.
 * Todos los controllers deben inyectar este servicio y usarlo.
 *
 * Uso:
 * constructor(private apiResponseService: ApiResponseService) {}
 *
 * async findOne(@Param('id') id: number) {
 *   const data = await this.service.findOne(id);
 *   return this.apiResponseService.success(data, 'Datos obtenidos');
 * }
 */
@Injectable()
export class ApiResponseService {
  /**
   * Respuesta exitosa con datos
   * @param data Datos a retornar
   * @param message Mensaje descriptivo (default: "Operación exitosa")
   * @returns ApiResponse<T>
   *
   * @example
   * return this.apiResponseService.success(reserva, 'Reserva obtenida');
   */
  success<T>(data: T, message: string = 'Operación exitosa'): ApiResponse<T> {
    return new ApiSuccessResponse(data, message);
  }

  /**
   * Respuesta de lista con paginación
   * @param items Array de items
   * @param total Total de registros
   * @param page Página actual (default: 1)
   * @param limit Items por página (default: 10)
   * @param message Mensaje (default: "Lista obtenida")
   * @returns ApiListResponse<T>
   *
   * @example
   * const [items, total] = await Promise.all([
   *   this.service.find(page, limit),
   *   this.service.count()
   * ]);
   * return this.apiResponseService.list(items, total, page, limit);
   */
  list<T>(
    items: T[],
    total: number,
    page: number = 1,
    limit: number = 10,
    message: string = 'Lista obtenida exitosamente',
  ): ApiListResponse<T> {
    return new ApiListResponse(items, message, page, limit, total);
  }

  /**
   * Respuesta de error
   * @param message Mensaje de error
   * @param errorCode Código de error (usar ERROR_CODES)
   * @returns ApiResponse<null>
   *
   * @example
   * throw this.apiResponseService.error(
   *   'Reserva no encontrada',
   *   ERROR_CODES.NOT_FOUND
   * );
   */
  error(
    message: string,
    errorCode: string = ERROR_CODES.INTERNAL_ERROR,
  ): ApiResponse<null> {
    return new ApiErrorResponse(message, errorCode);
  }

  /**
   * Crear respuesta manualmente (para casos especiales)
   */
  custom<T>(data: T | null, success: boolean, message: string): ApiResponse<T> {
    return new ApiResponse(success, data, message, success ? undefined : 'ERROR');
  }
}
