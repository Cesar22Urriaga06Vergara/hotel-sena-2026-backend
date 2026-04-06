import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Query,
  BadRequestException,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FacturaService } from './factura.service';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { UpdateFacturaDto } from './dto/update-factura.dto';
import { CreateDetalleFacturaDto } from './dto/create-detalle-factura.dto';
import { UpdateDetalleFacturaDto } from './dto/update-detalle-factura.dto';
import { EmitirFacturaDto } from './dto/emitir-factura.dto';
import { AnularFacturaDto } from './dto/anular-factura.dto';
import { MarcarPagadaDto } from './dto/marcar-pagada.dto';
import { HistorialCambiosResponseDto } from './dto/historial-cambios.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Factura } from './entities/factura.entity';
import {
  ESTADOS_FACTURA,
  TRANSICIONES_FACTURA,
  MAPA_ESTADO_LEGADO_A_CANONICO,
} from '../common/constants/estados.constants';

@ApiTags('Facturas')
@Controller('facturas')
export class FacturaController {
  constructor(private readonly facturaService: FacturaService) {}

  /**
   * GET /facturas/catalogo/estados
   * Catálogo de estados de factura con transiciones permitidas
   */
  @Get('catalogo/estados')
  @ApiOperation({ summary: 'Catálogo de estados canónicos de factura con transiciones' })
  @ApiResponse({ status: 200, description: 'Catálogo obtenido' })
  getCatalogoEstados() {
    const etiquetas: Record<string, string> = {
      BORRADOR: 'Borrador',
      EDITABLE: 'Editable',
      EMITIDA: 'Emitida',
      PAGADA: 'Pagada',
      ANULADA: 'Anulada',
    };

    const estados = Object.values(ESTADOS_FACTURA).map((valor) => ({
      valor,
      etiqueta: etiquetas[valor] ?? valor,
      transicionesPermitidas: TRANSICIONES_FACTURA[valor],
    }));

    return {
      estados,
      mapaLegado: MAPA_ESTADO_LEGADO_A_CANONICO,
      campoCanónico: 'estadoFactura',
      campoLegado: 'estado',
    };
  }

  /**
   * POST /facturas/generar/:idReserva
   * Generar factura desde una reserva
   */
  @Post('generar/:idReserva')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar factura desde una reserva' })
  @ApiParam({ name: 'idReserva', type: Number, description: 'ID de la reserva' })
  @ApiResponse({ status: 201, description: 'Factura generada exitosamente' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 409, description: 'Ya existe factura para esta reserva' })
  async generarDesdeReserva(
    @Param('idReserva', ParseIntPipe) idReserva: number,
  ): Promise<Factura> {
    return this.facturaService.generarDesdeReservaId(idReserva);
  }

  /**
   * GET /facturas
   * Obtener todas las facturas con filtros
   * Admin solo ve facturas de su hotel
   * Superadmin ve todas
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las facturas' })
  @ApiQuery({ name: 'idHotel', type: Number, required: false })
  @ApiQuery({ name: 'estado', type: String, required: false })
  @ApiQuery({ name: 'estadoFactura', type: String, required: false })
  @ApiQuery({ name: 'idCliente', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Facturas obtenidas exitosamente' })
  async findAll(
    @Query('idHotel') idHotel?: string,
    @Query('estado') estado?: string,
    @Query('estadoFactura') estadoFactura?: string,
    @Query('idCliente') idCliente?: string,
    @Request() req?: any,
  ): Promise<Factura[]> {
    const userRole = req?.user?.rol;
    const userIdHotel = req?.user?.idHotel;

    // Validación para admin
    if (userRole === 'admin') {
      if (!userIdHotel) {
        throw new BadRequestException('Usuario debe estar asignado a un hotel');
      }
      // Admin solo ve su hotel
      const filters = {
        idHotel: userIdHotel,
        estado,
        estadoFactura,
        idCliente: idCliente ? Number(idCliente) : undefined,
      };
      return this.facturaService.findAll(filters);
    }

    // Superadmin ve todas
    const filters = {
      idHotel: idHotel ? Number(idHotel) : undefined,
      estado,
      estadoFactura,
      idCliente: idCliente ? Number(idCliente) : undefined,
    };

    return this.facturaService.findAll(filters);
  }

  /**
   * GET /facturas/:id
   * Obtener una factura por ID
   * 
   * Validación: 
   * - Clientes solo pueden ver sus propias facturas
   * - Admin solo puede ver facturas de su hotel
   * - Superadmin puede ver cualquier factura
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin', 'cliente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener una factura por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Factura obtenida exitosamente' })
  @ApiResponse({ status: 403, description: 'No tiene autorización para acceder a esta factura' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<Factura> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    const factura = await this.facturaService.findOne(id);

    // Cliente: solo su propia factura
    if (userRole === 'cliente' && factura.idCliente !== req.user.idCliente) {
      throw new ForbiddenException('No tiene autorización para acceder a esta factura');
    }

    // Admin: validar que está asignado a un hotel
    if (userRole === 'admin' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Admin: solo facturas de su hotel
    if (userRole === 'admin' && factura.idHotel !== userIdHotel) {
      throw new ForbiddenException('No tiene autorización para acceder a esta factura');
    }

    // Recepcionista: validar que está asignado a un hotel
    if (userRole === 'recepcionista' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Recepcionista: solo facturas de su hotel
    if (userRole === 'recepcionista' && factura.idHotel !== userIdHotel) {
      throw new ForbiddenException('No tiene autorización para acceder a esta factura');
    }

    return factura;
  }

  /**
   * GET /facturas/reserva/:idReserva
   * Obtener factura por ID de reserva
   * 
   * Validación: 
   * - Clientes solo pueden ver facturas de sus propias reservas
   * - Admin solo puede ver facturas de reservas de su hotel
   * - Superadmin puede ver cualquier factura
   */
  @Get('reserva/:idReserva')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin', 'cliente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener factura por ID de reserva' })
  @ApiParam({ name: 'idReserva', type: Number })
  @ApiResponse({ status: 200, description: 'Factura obtenida exitosamente' })
  @ApiResponse({ status: 403, description: 'No tiene autorización para acceder a esta factura' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async findByReserva(
    @Param('idReserva', ParseIntPipe) idReserva: number,
    @Request() req: any,
  ): Promise<Factura> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    const factura = await this.facturaService.findByReserva(idReserva);

    // Cliente: solo facturas de sus propias reservas
    if (userRole === 'cliente' && factura.idCliente !== req.user.idCliente) {
      throw new ForbiddenException('No tiene autorización para acceder a esta factura');
    }

    // Admin: validar que está asignado a un hotel
    if (userRole === 'admin' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Admin: solo facturas de su hotel
    if (userRole === 'admin' && factura.idHotel !== userIdHotel) {
      throw new ForbiddenException('No tiene autorización para acceder a esta factura');
    }

    // Recepcionista: validar que está asignado a un hotel
    if (userRole === 'recepcionista' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Recepcionista: solo facturas de su hotel
    if (userRole === 'recepcionista' && factura.idHotel !== userIdHotel) {
      throw new ForbiddenException('No tiene autorización para acceder a esta factura');
    }

    return factura;
  }

  /**
   * GET /facturas/cliente/:idCliente
   * Obtener todas las facturas de un cliente
   * 
   * Validación: 
   * - Clientes solo pueden ver sus propias facturas
   * - Admin solo puede ver facturas de clientes de su hotel
   * - Superadmin puede ver cualquier factura de cliente
   */
  @Get('cliente/:idCliente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin', 'cliente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener facturas de un cliente' })
  @ApiParam({ name: 'idCliente', type: Number })
  @ApiResponse({ status: 200, description: 'Facturas obtenidas exitosamente' })
  @ApiResponse({ status: 403, description: 'No tiene autorización para acceder a estas facturas' })
  async findByCliente(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Request() req: any,
  ): Promise<Factura[]> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Cliente: solo sus propias facturas
    if (userRole === 'cliente' && idCliente !== req.user.idCliente) {
      throw new ForbiddenException(
        'No tiene autorización para acceder a las facturas de otro cliente',
      );
    }

    // Admin: validar que está asignado a un hotel
    if (userRole === 'admin' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Superadmin: acceso a todas las facturas del cliente
    if (userRole === 'superadmin') {
      return this.facturaService.findByCliente(idCliente);
    }

    // Admin: solo facturas de su hotel (filtrado en service)
    return this.facturaService.findByClienteAndHotel(idCliente, userIdHotel);
  }

  /**
   * PATCH /facturas/:id/emitir
   * Emitir factura (cambiar estado de BORRADOR/EDITABLE a EMITIDA)
   */
  @Patch(':id/emitir')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Emitir factura y marcarla como EMITIDA' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Factura emitida exitosamente', type: Factura })
  @ApiResponse({ status: 400, description: 'No se puede emitir la factura en su estado actual' })
  @ApiResponse({ status: 403, description: 'No tiene autorización para emitir esta factura' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async emitir(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EmitirFacturaDto,
    @Request() req: any,
  ): Promise<Factura> {
    // Admin debe estar asignado a un hotel
    if (req.user.rol === 'admin' && !req.user.idHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Para admins, validar que la factura pertenezca a su hotel
    if (req.user.rol === 'admin') {
      const factura = await this.facturaService.findOne(id);
      if (!factura) {
        throw new NotFoundException('Factura no encontrada');
      }
      if (factura.idHotel !== req.user.idHotel) {
        throw new ForbiddenException(
          'No tiene autorización para emitir facturas de otro hotel',
        );
      }
    }

    // Usar usuarioId del DTO si se proporciona, de lo contrario usar del token
    const usuarioId = dto.usuarioId || req.user.id;
    return this.facturaService.emitir(id, usuarioId);
  }


  /**
   * PATCH /facturas/:id/anular
   * Anular factura (cambiar estado a ANULADA)
   * Requiere motivo de anulación para mantener auditoría
   */
  @Patch(':id/anular')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Anular factura (cambiar estado a ANULADA)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Factura anulada exitosamente', type: Factura })
  @ApiResponse({ status: 400, description: 'No se puede anular la factura o falta el motivo' })
  @ApiResponse({ status: 403, description: 'No tiene autorización para anular esta factura' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async anular(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnularFacturaDto,
    @Request() req: any,
  ): Promise<Factura> {
    // Admin debe estar asignado a un hotel
    if (req.user.rol === 'admin' && !req.user.idHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Para admins, validar que la factura pertenezca a su hotel
    if (req.user.rol === 'admin') {
      const factura = await this.facturaService.findOne(id);
      if (!factura) {
        throw new NotFoundException('Factura no encontrada');
      }
      if (factura.idHotel !== req.user.idHotel) {
        throw new ForbiddenException(
          'No tiene autorización para anular facturas de otro hotel',
        );
      }
    }

    // Usar usuarioId del DTO si se proporciona, de lo contrario usar del token
    const usuarioId = dto.usuarioId || req.user.id;
    return this.facturaService.anular(id, dto.motivo, usuarioId);
  }

  /**
   * PATCH /facturas/:id/marcar-pagada
   * Marcar factura como pagada (cambiar estado a PAGADA)
   * Solo disponible para facturas en estado EMITIDA
   */
  @Patch(':id/marcar-pagada')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar factura como pagada' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Factura pagada registrada exitosamente', type: Factura })
  @ApiResponse({ status: 400, description: 'No se puede marcar como pagada o falta un pago registrado' })
  @ApiResponse({ status: 403, description: 'No tiene autorización para marcar esta factura como pagada' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async marcarComoPagada(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarcarPagadaDto,
    @Request() req: any,
  ): Promise<Factura> {
    // Admin debe estar asignado a un hotel
    if (req.user.rol === 'admin' && !req.user.idHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Para admins, validar que la factura pertenezca a su hotel
    if (req.user.rol === 'admin') {
      const factura = await this.facturaService.findOne(id);
      if (!factura) {
        throw new NotFoundException('Factura no encontrada');
      }
      if (factura.idHotel !== req.user.idHotel) {
        throw new ForbiddenException(
          'No tiene autorización para marcar facturas de otro hotel como pagadas',
        );
      }
    }

    // Usar usuarioId del DTO si se proporciona, de lo contrario usar del token
    const usuarioId = dto.usuarioId || req.user.id;
    return this.facturaService.marcarComoPagada(id, dto.fechaPago, usuarioId);
  }

  /**
   * GET /facturas/:id/historial-cambios
   * Obtener historial de cambios de una factura
   * Muestra todos los cambios registrados en auditoría
   */
  @Get(':id/historial-cambios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin', 'cliente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener historial de cambios de una factura' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Historial de cambios obtenido exitosamente', type: HistorialCambiosResponseDto })
  @ApiResponse({ status: 403, description: 'No tiene autorización para acceder al historial' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async obtenerHistorialCambios(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<HistorialCambiosResponseDto> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Validar que la factura exista y el usuario tenga acceso a ella
    const factura = await this.facturaService.findOne(id);

    // Cliente: solo su propia factura
    if (userRole === 'cliente' && factura.idCliente !== req.user.idCliente) {
      throw new ForbiddenException('No tiene autorización para acceder al historial de esta factura');
    }

    // Admin: solo facturas de su hotel
    if (userRole === 'admin' && factura.idHotel !== userIdHotel) {
      throw new ForbiddenException('No tiene autorización para acceder al historial de esta factura');
    }

    // Recepcionista: solo facturas de su hotel
    if (userRole === 'recepcionista' && factura.idHotel !== userIdHotel) {
      throw new ForbiddenException('No tiene autorización para acceder al historial de esta factura');
    }

    // Obtener cambios
    const cambios = await this.facturaService.obtenerHistorialCambios(id);

    // Construir respuesta completa
    return {
      cambios,
      total: cambios.length,
      resumen: {
        estadoActual: factura.estadoFactura,
        ultimoCambio: cambios.length > 0 ? cambios[0].descripcion : 'Sin cambios registrados',
        ultimaCambioFecha: cambios.length > 0 ? cambios[0].fecha : null,
      },
    };
  }

  /**
   * GET /facturas/:id/detalles
   * Obtener todos los detalles de una factura
   * 
   * Validación: 
   * - Usuario debe tener acceso a la factura
   * - Retorna array de detalles
   */
  @Get(':id/detalles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin', 'cliente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalles de una factura' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la factura' })
  @ApiResponse({ status: 200, description: 'Detalles obtenidos exitosamente' })
  @ApiResponse({ status: 403, description: 'No tiene autorización para acceder a esta factura' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async obtenerDetalles(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<any[]> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Validar acceso a la factura primero
    const factura = await this.facturaService.findOne(id);

    // Cliente: solo su propia factura
    if (userRole === 'cliente' && factura.idCliente !== req.user.idCliente) {
      throw new ForbiddenException('No tiene autorización para acceder a esta factura');
    }

    // Admin: solo facturas de su hotel
    if (userRole === 'admin' && factura.idHotel !== userIdHotel) {
      throw new ForbiddenException('No tiene autorización para acceder a esta factura');
    }

    // Recepcionista: solo facturas de su hotel
    if (userRole === 'recepcionista' && factura.idHotel !== userIdHotel) {
      throw new ForbiddenException('No tiene autorización para acceder a esta factura');
    }

    return this.facturaService.obtenerDetalles(id);
  }

  /**
   * POST /facturas/:id/detalles
   * Agregar nuevo detalle a una factura
   * 
   * Validaciones:
   * - Factura debe estar en BORRADOR/EDITABLE
   * - Cantidad > 0, Precio >= 0
   * - Retorna HTTP 201
   */
  @Post(':id/detalles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar detalle a una factura' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la factura' })
  @ApiResponse({ status: 201, description: 'Detalle creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o factura no editable' })
  @ApiResponse({ status: 403, description: 'No tiene autorización' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async agregarDetalle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateDetalleFacturaDto,
    @Request() req: any,
  ): Promise<any> {
    // Admin debe estar asignado a un hotel
    if (req.user.rol === 'admin' && !req.user.idHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Para admins, validar que la factura pertenezca a su hotel
    if (req.user.rol === 'admin') {
      const factura = await this.facturaService.findOne(id);
      if (!factura) {
        throw new NotFoundException('Factura no encontrada');
      }
      if (factura.idHotel !== req.user.idHotel) {
        throw new ForbiddenException(
          'No tiene autorización para modificar facturas de otro hotel',
        );
      }
    }

    const usuarioId = req.user.id;
    return this.facturaService.agregarDetalle(
      id,
      dto.tipoConcepto,
      dto.descripcion,
      dto.cantidad,
      dto.precioUnitario,
      dto.idPedido,
      dto.idReferencia,
      dto.categoriaServiciosId,
      usuarioId,
    );
  }

  /**
   * PATCH /facturas/:id/detalles/:detalleId
   * Actualizar detalle de una factura
   * 
   * Validaciones:
   * - Detalle debe estar en PENDIENTE
   * - No permite actualizar detalles ENTREGADOS o CANCELADOS
   */
  @Patch(':id/detalles/:detalleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar detalle de una factura' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la factura' })
  @ApiParam({ name: 'detalleId', type: Number, description: 'ID del detalle' })
  @ApiResponse({ status: 200, description: 'Detalle actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Detalle no se puede actualizar o datos inválidos' })
  @ApiResponse({ status: 403, description: 'No tiene autorización' })
  @ApiResponse({ status: 404, description: 'Factura o detalle no encontrado' })
  async actualizarDetalle(
    @Param('id', ParseIntPipe) id: number,
    @Param('detalleId', ParseIntPipe) detalleId: number,
    @Body() dto: UpdateDetalleFacturaDto,
    @Request() req: any,
  ): Promise<any> {
    // Admin debe estar asignado a un hotel
    if (req.user.rol === 'admin' && !req.user.idHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Para admins, validar que la factura pertenezca a su hotel
    if (req.user.rol === 'admin') {
      const factura = await this.facturaService.findOne(id);
      if (!factura) {
        throw new NotFoundException('Factura no encontrada');
      }
      if (factura.idHotel !== req.user.idHotel) {
        throw new ForbiddenException(
          'No tiene autorización para modificar facturas de otro hotel',
        );
      }
    }

    const usuarioId = req.user.id;
    return this.facturaService.actualizarDetalle(detalleId, dto, usuarioId);
  }

  /**
   * DELETE /facturas/:id/detalles/:detalleId
   * Eliminar (cancelar) un detalle de una factura
   * 
   * Validaciones:
   * - Marca el detalle como CANCELADO (no elimina de BD)
   * - No permite cancelar detalles ya cancelados
   * Query param 'motivo' es opcional
   */
  @Delete(':id/detalles/:detalleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar detalle de una factura' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la factura' })
  @ApiParam({ name: 'detalleId', type: Number, description: 'ID del detalle a cancelar' })
  @ApiQuery({ name: 'motivo', type: String, required: false, description: 'Motivo de la cancelación' })
  @ApiResponse({ status: 200, description: 'Detalle cancelado exitosamente' })
  @ApiResponse({ status: 400, description: 'No se puede cancelar el detalle' })
  @ApiResponse({ status: 403, description: 'No tiene autorización' })
  @ApiResponse({ status: 404, description: 'Factura o detalle no encontrado' })
  async eliminarDetalle(
    @Param('id', ParseIntPipe) id: number,
    @Param('detalleId', ParseIntPipe) detalleId: number,
    @Request() req: any,
    @Query('motivo') motivo?: string,
  ): Promise<any> {
    // Admin debe estar asignado a un hotel
    if (req.user.rol === 'admin' && !req.user.idHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Para admins, validar que la factura pertenezca a su hotel
    if (req.user.rol === 'admin') {
      const factura = await this.facturaService.findOne(id);
      if (!factura) {
        throw new NotFoundException('Factura no encontrada');
      }
      if (factura.idHotel !== req.user.idHotel) {
        throw new ForbiddenException(
          'No tiene autorización para modificar facturas de otro hotel',
        );
      }
    }

    const usuarioId = req.user.id;
    return this.facturaService.eliminarDetalle(detalleId, motivo, usuarioId);
  }

  /**
   * GET /facturas/kpis/admin
   * KPIs de facturación para Admin
   * Métricas: facturas, ingresos, pendientes, morosidad, top clientes
   */
  @Get('kpis/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener KPIs de facturación (Admin)' })
  @ApiQuery({ name: 'inicio', type: String, required: false, description: 'Fecha inicio (ISO)' })
  @ApiQuery({ name: 'fin', type: String, required: false, description: 'Fecha fin (ISO)' })
  @ApiResponse({ status: 200, description: 'KPIs obtenidos exitosamente' })
  @ApiResponse({ status: 403, description: 'No tiene autorización' })
  async obtenerKpisAdmin(
    @Request() req: any,
    @Query('inicio') inicio?: string,
    @Query('fin') fin?: string,
  ): Promise<any> {
    // Admin debe estar asignado a un hotel
    if (req.user.rol === 'admin' && !req.user.idHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    const hotelId = req.user.idHotel; // Para admin, su hotel. Para superadmin, se ignora
    const periodo = inicio && fin ? { inicio: new Date(inicio), fin: new Date(fin) } : undefined;

    return this.facturaService.obtenerKpisAdmin(hotelId, periodo);
  }

  /**
   * GET /facturas/kpis/recepcionista
   * KPIs para Recepcionista (métricas del día)
   */
  @Get('kpis/recepcionista')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener KPIs de recepción (día actual)' })
  @ApiQuery({ name: 'fecha', type: String, required: false, description: 'Fecha específica (ISO)' })
  @ApiResponse({ status: 200, description: 'KPIs obtenidos exitosamente' })
  @ApiResponse({ status: 403, description: 'No tiene autorización' })
  async obtenerKpisRecepcionista(
    @Request() req: any,
    @Query('fecha') fecha?: string,
  ): Promise<any> {
    // Para admin, validar su hotel
    if (req.user.rol === 'admin' && !req.user.idHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    const hotelId = req.user.rol === 'admin' ? req.user.idHotel : req.user.idHotel;
    const fechaConsulta = fecha ? new Date(fecha) : undefined;

    return this.facturaService.obtenerKpisRecepcionista(hotelId, fechaConsulta);
  }

  /**
   * GET /facturas/reportes/ingresos
   * Reporte de ingresos por categoría, día, semana o mes
   */
  @Get('reportes/ingresos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener reporte de ingresos' })
  @ApiQuery({ name: 'groupBy', type: String, enum: ['categoria', 'dia', 'semana', 'mes'], default: 'categoria' })
  @ApiQuery({ name: 'inicio', type: String, required: false })
  @ApiQuery({ name: 'fin', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Reporte obtenido exitosamente' })
  async obtenerReporteIngresos(
    @Request() req: any,
    @Query('groupBy') groupBy: 'categoria' | 'dia' | 'semana' | 'mes' = 'categoria',
    @Query('inicio') inicio?: string,
    @Query('fin') fin?: string,
  ): Promise<any> {
    if (req.user.rol === 'admin' && !req.user.idHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    const hotelId = req.user.idHotel;
    const periodo = inicio && fin ? { inicio: new Date(inicio), fin: new Date(fin) } : undefined;

    return this.facturaService.obtenerReporteIngresos(hotelId, groupBy, periodo);
  }

  /**
   * GET /facturas/reportes/morosidad
   * Análisis de facturas vencidas, pendientes, etc.
   */
  @Get('reportes/morosidad')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener análisis de morosidad' })
  @ApiQuery({ name: 'diasAtrasados', type: Number, default: 30 })
  @ApiResponse({ status: 200, description: 'Análisis obtenido exitosamente' })
  async obtenerAnalisisMorosidad(
    @Request() req: any,
    @Query('diasAtrasados') diasAtrasados: number = 30,
  ): Promise<any> {
    if (req.user.rol === 'admin' && !req.user.idHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    const hotelId = req.user.idHotel;
    return this.facturaService.obtenerAnalisisMorosidad(hotelId, diasAtrasados);
  }
}

