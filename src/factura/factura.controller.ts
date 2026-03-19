import {
  Controller,
  Get,
  Post,
  Patch,
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
import { EmitirFacturaDto } from './dto/emitir-factura.dto';
import { AnularFacturaDto } from './dto/anular-factura.dto';
import { MarcarPagadaDto } from './dto/marcar-pagada.dto';
import { HistorialCambiosResponseDto } from './dto/historial-cambios.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Factura } from './entities/factura.entity';

@ApiTags('Facturas')
@Controller('facturas')
export class FacturaController {
  constructor(private readonly facturaService: FacturaService) {}

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
    // En una aplicación real, verificaríamos que la reserva existe
    // Por ahora, asumimos que la lógica del servicio maneja eso
    const reserva = { id: idReserva } as any;
    return this.facturaService.generarDesdeReserva(reserva);
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
  @ApiQuery({ name: 'idCliente', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Facturas obtenidas exitosamente' })
  async findAll(
    @Query('idHotel') idHotel?: string,
    @Query('estado') estado?: string,
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
        idCliente: idCliente ? Number(idCliente) : undefined,
      };
      return this.facturaService.findAll(filters);
    }

    // Superadmin ve todas
    const filters = {
      idHotel: idHotel ? Number(idHotel) : undefined,
      estado,
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
}

