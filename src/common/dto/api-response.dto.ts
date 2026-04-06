/**
 * RESPUESTA ESTÁNDAR DE API
 * Todas las respuestas deben usar este formato para consistencia
 *
 * Uso en Controllers:
 * @Get(':id')
 * async findOne(@Param('id') id: number): Promise<ApiResponse<Reserva>> {
 *   const reserva = await this.reservaService.findOne(id);
 *   return this.apiResponse.success(reserva, 'Reserva obtenida exitosamente');
 * }
 *
 * Uso en Frontend (Nuxt):
 * const { data } = await useApi().$get('/reservas/1');
 * if (data.success) {
 *   const reserva = data.data; // Tipado
 *   showMessage(data.message);
 * } else {
 *   showError(data.error);
 * }
 */

export class ApiResponse<T = any> {
  /**
   * true si operación fue exitosa, false si falló
   */
  success: boolean;

  /**
   * Datos retornados en caso de éxito
   * null si error
   */
  data: T | null;

  /**
   * Mensaje descriptivo de la operación
   * Para éxito: "Recurso obtenido"
   * Para error: "No encontrado" o descripción del problema
   */
  message: string;

  /**
   * Código de error (solo presente si success=false)
   * Valores: VALIDATION_ERROR, NOT_FOUND, FORBIDDEN, CONFLICT, etc.
   */
  error?: string;

  /**
   * Timestamp de la respuesta (ISO 8601)
   */
  timestamp: string;

  /**
   * Path del endpoint solicitado (para debugging)
   */
  path?: string;

  /**
   * Para respuestas paginadas: metadatos
   */
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  constructor(
    success: boolean,
    data: T | null,
    message: string,
    error?: string,
    pagination?: any,
  ) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
    if (pagination) {
      this.pagination = pagination;
    }
  }
}

/**
 * DTO para respuesta de lista/paginada
 * Uso: Promise<ApiResponse<T[]>> pero con pagination
 */
export class ApiListResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  constructor(
    data: T[],
    message: string,
    page: number,
    limit: number,
    total: number,
  ) {
    const totalPages = Math.ceil(total / limit);
    super(true, data, message, undefined, {
      page,
      limit,
      total,
      totalPages,
    });
    this.pagination = {
      page,
      limit,
      total,
      totalPages,
    };
  }
}

/**
 * Builder para respuestas de éxito
 */
export class ApiSuccessResponse<T = any> extends ApiResponse<T> {
  constructor(data: T, message: string = 'Operación exitosa') {
    super(true, data, message, undefined);
  }
}

/**
 * Builder para respuestas de error
 */
export class ApiErrorResponse extends ApiResponse<null> {
  constructor(message: string, error: string = 'ERROR') {
    super(false, null, message, error);
  }
}

/**
 * Estados de error estándar para usar en error field
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
} as const;
