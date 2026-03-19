import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { ReservaService } from './reserva.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { DisponibilidadQueryDto } from './dto/disponibilidad-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Reserva } from './entities/reserva.entity';

@ApiTags('Reservas')
@Controller('reservas')
export class ReservaController {
  constructor(private readonly reservaService: ReservaService) {}

  /**
   * GET /reservas
   * Obtener todas las reservas (recepcionista/admin solo su hotel, superadmin todas)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las reservas del sistema' })
  @ApiResponse({ status: 200, description: 'Reservas obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async findAll(@Request() req): Promise<{ reservas: Reserva[]; count: number }> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Admin/Recepcionista solo ven sus hoteles
    if ((userRole === 'admin' || userRole === 'recepcionista') && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    let reservas: Reserva[];
    if (userRole === 'superadmin') {
      reservas = await this.reservaService.findAll();
    } else {
      reservas = await this.reservaService.findByHotel(userIdHotel);
    }

    return {
      reservas,
      count: reservas.length,
    };
  }

  /**
   * GET /reservas/disponibilidad
   * Consultar habitaciones disponibles para un rango de fechas (PÚBLICO)
   */
  @Get('disponibilidad')
  @ApiOperation({
    summary: 'Consultar disponibilidad de habitaciones',
    description:
      'Obtiene las habitaciones disponibles para un rango de fechas específico',
  })
  @ApiQuery({ name: 'idHotel', type: Number, required: true })
  @ApiQuery({ name: 'checkinFecha', type: String, required: true })
  @ApiQuery({ name: 'checkoutFecha', type: String, required: true })
  @ApiQuery({ name: 'idTipoHabitacion', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Disponibilidad consultada exitosamente' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  async consultarDisponibilidad(@Query() query: any) {
    // Convertir strings a números
    const disponibilidadQuery: DisponibilidadQueryDto = {
      idHotel: Number(query.idHotel),
      checkinFecha: query.checkinFecha,
      checkoutFecha: query.checkoutFecha,
      idTipoHabitacion: query.idTipoHabitacion ? Number(query.idTipoHabitacion) : undefined,
    };

    // Validaciones
    if (!disponibilidadQuery.idHotel || !disponibilidadQuery.checkinFecha || !disponibilidadQuery.checkoutFecha) {
      throw new BadRequestException('idHotel, checkinFecha y checkoutFecha son requeridos');
    }

    return await this.reservaService.consultarDisponibilidad(disponibilidadQuery);
  }

  /**
   * POST /reservas
   * Crear una nueva reserva (PROTEGIDA - clientes y staff pueden crear)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente', 'recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva reserva' })
  @ApiBody({ type: CreateReservaDto })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'No hay disponibilidad' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async create(@Body() createReservaDto: CreateReservaDto, @Request() req): Promise<Reserva> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Validar que admin/recepcionista estén asignados a un hotel
    if ((userRole === 'admin' || userRole === 'recepcionista') && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Validar que admin/recepcionista creen reservas solo en su hotel
    if ((userRole === 'admin' || userRole === 'recepcionista') && createReservaDto.idHotel !== userIdHotel) {
      throw new ForbiddenException(
        `No tienes permiso para crear reservas en el hotel ${createReservaDto.idHotel}. Solo en tu hotel ${userIdHotel}`,
      );
    }

    // Obtener el idCliente del usuario autenticado (del JWT)
    createReservaDto.idCliente = req.user.idCliente;
    return await this.reservaService.create(createReservaDto);
  }

  /**
   * GET /reservas/codigo/:codigo
   * Obtener una reserva por código de confirmación (PÚBLICA)
   */
  @Get('codigo/:codigoConfirmacion')
  @ApiOperation({ summary: 'Obtener reserva por código de confirmación' })
  @ApiParam({ name: 'codigoConfirmacion', type: String })
  @ApiResponse({ status: 200, description: 'Reserva encontrada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  async findByCodigoConfirmacion(
    @Param('codigoConfirmacion') codigoConfirmacion: string,
  ): Promise<Reserva> {
    return await this.reservaService.findByCodigoConfirmacion(codigoConfirmacion);
  }

  /**
   * GET /reservas/cliente/:idCliente
   * Obtener todas las reservas de un cliente (PROTEGIDA)
   * - Cliente solo puede ver sus propias reservas
   * - Recepcionista puede ver reservas de clientes de su hotel
   * - Admin/Superadmin puede ver todas
   */
  @Get('activa/:idCliente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente', 'recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener reserva activa de un cliente' })
  @ApiParam({ name: 'idCliente', type: Number })
  @ApiResponse({ status: 200, description: 'Reserva activa encontrada' })
  @ApiResponse({ status: 404, description: 'Sin reserva activa' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async findReservaActiva(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Request() req,
  ): Promise<Reserva | null> {
    const userRole = req.user.rol;
    const userIdCliente = req.user.idCliente;

    // Validar permisos — solo el cliente puede acceder
    if (userRole === 'cliente' && userIdCliente !== idCliente) {
      throw new ForbiddenException('No puedes ver las reservas de otros clientes');
    }

    return await this.reservaService.findReservaActivaByCliente(idCliente);
  }

  /**
   * GET /reservas/cliente/:idCliente
   * Obtener todas las reservas de un cliente (PROTEGIDA)
   * - Cliente solo puede ver sus propias reservas
   * - Recepcionista puede ver reservas de clientes de su hotel
   * - Admin/Superadmin puede ver todas
   */
  @Get('cliente/:idCliente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente', 'recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener reservas de un cliente' })
  @ApiParam({ name: 'idCliente', type: Number })
  @ApiResponse({ status: 200, description: 'Reservas encontradas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async findByCliente(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Request() req,
  ): Promise<Reserva[]> {
    const userRole = req.user.rol;
    const userIdCliente = req.user.idCliente;
    const userIdHotel = req.user.idHotel;

    // Validar permisos
    if (userRole === 'cliente' && userIdCliente !== idCliente) {
      throw new ForbiddenException('No puedes ver las reservas de otros clientes');
    }

    // Recepcionista/Admin solo sus hoteles
    if ((userRole === 'recepcionista' || userRole === 'admin') && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    return await this.reservaService.findByClienteWithHotel(idCliente, userIdHotel, userRole);
  }

  /**
   * GET /reservas/hotel/:idHotel
   * Obtener todas las reservas de un hotel (PROTEGIDA)
   * - Recepcionista/Admin solo de su hotel
   * - Superadmin puede ver cualquier hotel
   */
  @Get('hotel/:idHotel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener reservas de un hotel' })
  @ApiParam({ name: 'idHotel', type: Number })
  @ApiResponse({ status: 200, description: 'Reservas encontradas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - no es personal del hotel' })
  async findByHotel(
    @Param('idHotel', ParseIntPipe) idHotel: number,
    @Request() req,
  ): Promise<{ reservas: Reserva[]; count: number }> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Validar que admin/recepcionista sea del hotel solicitado
    if (
      (userRole === 'recepcionista' || userRole === 'admin') &&
      userIdHotel !== idHotel
    ) {
      throw new ForbiddenException(
        `No tengo acceso a reservas del hotel ${idHotel}. Solo mi hotel ${userIdHotel}`,
      );
    }

    const reservas = await this.reservaService.findByHotel(idHotel);
    return {
      reservas,
      count: reservas.length,
    };
  }

  /**
   * GET /reservas/cedula/:cedula/:idHotel
   * Buscar reservas por cédula del cliente en un hotel (PROTEGIDA)
   * - Recepcionista/Admin solo de su hotel
   * - Superadmin puede buscar en cualquier hotel
   */
  @Get('cedula/:cedula/:idHotel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar reservas por cédula del cliente' })
  @ApiParam({ name: 'cedula', type: String, description: 'Cédula del cliente' })
  @ApiParam({ name: 'idHotel', type: Number, description: 'ID del hotel' })
  @ApiResponse({ status: 200, description: 'Reservas encontradas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async findByCedula(
    @Param('cedula') cedula: string,
    @Param('idHotel', ParseIntPipe) idHotel: number,
    @Request() req,
  ): Promise<{ reservas: Reserva[]; count: number }> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Validar permisos
    if (
      (userRole === 'recepcionista' || userRole === 'admin') &&
      userIdHotel !== idHotel
    ) {
      throw new ForbiddenException(
        `No tengo acceso al hotel ${idHotel}. Solo puedo buscar en mi hotel ${userIdHotel}`,
      );
    }

    const reservas = await this.reservaService.findByCedula(cedula, idHotel);
    return {
      reservas,
      count: reservas.length,
    };
  }

  /**
   * GET /reservas/:id
   * Obtener una reserva por ID (PROTEGIDA)
   * - Cliente solo la suya
   * - Recepcionista/Admin de su hotel
   * - Superadmin cualquiera
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalle de una reserva' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Reserva encontrada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<Reserva> {
    const reserva = await this.reservaService.findOne(id);
    if (!reserva) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    const userRole = req.user.rol;
    const userIdCliente = req.user.idCliente;
    const userIdHotel = req.user.idHotel;

    // Validar permisos
    if (userRole === 'cliente' && reserva.idCliente !== userIdCliente) {
      throw new ForbiddenException('No puedes ver esta reserva');
    }

    if (
      (userRole === 'recepcionista' || userRole === 'admin') &&
      reserva.idHotel !== userIdHotel
    ) {
      throw new ForbiddenException(
        'No tienes acceso a reservas de otros hoteles',
      );
    }

    return reserva;
  }

  /**
   * PATCH /reservas/:id
   * Actualizar una reserva (PROTEGIDA)
   * - Cliente solo la suya (solo observaciones)
   * - Recepcionista/Admin de su hotel (cualquier campo)
   * - Superadmin cualquiera
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente', 'recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una reserva' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateReservaDto })
  @ApiResponse({ status: 200, description: 'Reserva actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReservaDto: UpdateReservaDto,
    @Request() req,
  ): Promise<Reserva> {
    const reserva = await this.reservaService.findOne(id);
    if (!reserva) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    const userRole = req.user.rol;
    const userIdCliente = req.user.idCliente;
    const userIdHotel = req.user.idHotel;

    // Validar permisos
    if (userRole === 'cliente') {
      if (reserva.idCliente !== userIdCliente) {
        throw new ForbiddenException('No puedes actualizar esta reserva');
      }
      // Los clientes solo pueden actualizar observaciones
      if (
        Object.keys(updateReservaDto).some(
          (key) => key !== 'observaciones',
        )
      ) {
        throw new ForbiddenException(
          'Los clientes solo pueden actualizar observaciones',
        );
      }
    }

    if (
      (userRole === 'recepcionista' || userRole === 'admin') &&
      reserva.idHotel !== userIdHotel
    ) {
      throw new ForbiddenException(
        'No tienes acceso a reservas de otros hoteles',
      );
    }

    return await this.reservaService.update(id, updateReservaDto);
  }

  /**
   * POST /reservas/:id/cancelar
   * Cancelar una reserva (PROTEGIDA)
   * - Cliente la suya
   * - Recepcionista/Admin de su hotel
   * - Superadmin cualquiera
   */
  @Post(':id/cancelar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar una reserva' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ schema: { type: 'object', properties: { motivo: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Reserva cancelada exitosamente' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async cancelar(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req,
  ): Promise<Reserva> {
    const reserva = await this.reservaService.findOne(id);
    if (!reserva) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    const userRole = req.user.rol;
    const userIdCliente = req.user.idCliente;
    const userIdHotel = req.user.idHotel;

    // Validar permisos
    if (userRole === 'cliente' && reserva.idCliente !== userIdCliente) {
      throw new ForbiddenException('No puedes cancelar esta reserva');
    }

    if (
      (userRole === 'recepcionista' || userRole === 'admin') &&
      reserva.idHotel !== userIdHotel
    ) {
      throw new ForbiddenException(
        'No tienes acceso a reservas de otros hoteles',
      );
    }

    return await this.reservaService.cancelar(id, motivo);
  }

  /**
   * POST /reservas/:id/confirmar
   * Confirmar reserva (recepcionista confirma que es válida)
   * Cambia estado de 'reservada' a 'confirmada'
   * - Solo Recepcionista/Admin/Superadmin
   */
  @Post(':id/confirmar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar reserva (cambiar estado a confirmada)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Reserva confirmada exitosamente' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 400, description: 'Reserva no está en estado reservada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async confirmarReserva(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<Reserva> {
    const reserva = await this.reservaService.findOne(id);
    if (!reserva) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Validar que sea del hotel
    if (
      (userRole === 'recepcionista' || userRole === 'admin') &&
      reserva.idHotel !== userIdHotel
    ) {
      throw new ForbiddenException(
        'No tienes acceso a reservas de otros hoteles',
      );
    }

    return await this.reservaService.confirmarReserva(id);
  }

  /**
   * POST /reservas/:id/checkin
   * Confirmar check-in (PROTEGIDA)
   * - Solo Recepcionista
   */
  @Post(':id/checkin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar check-in' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Check-in confirmado exitosamente' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async confirmarCheckin(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<Reserva> {
    const reserva = await this.reservaService.findOne(id);
    if (!reserva) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Validar que sea del hotel
    if (
      (userRole === 'recepcionista' || userRole === 'admin') &&
      reserva.idHotel !== userIdHotel
    ) {
      throw new ForbiddenException(
        'No tienes acceso a reservas de otros hoteles',
      );
    }

    return await this.reservaService.confirmarCheckin(id);
  }

  /**
   * POST /reservas/:id/checkout
   * Confirmar check-out (PROTEGIDA)
   * - Solo Recepcionista
   */
  @Post(':id/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar check-out' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Check-out confirmado exitosamente' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async confirmarCheckout(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<{ reserva: Reserva; factura?: any }> {
    const reserva = await this.reservaService.findOne(id);
    if (!reserva) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Validar que sea del hotel
    if (
      (userRole === 'recepcionista' || userRole === 'admin') &&
      reserva.idHotel !== userIdHotel
    ) {
      throw new ForbiddenException(
        'No tienes acceso a reservas de otros hoteles',
      );
    }

    return await this.reservaService.confirmarCheckout(id);
  }

  /**
   * POST /reservas/:id/completar
   * Completar una reserva (Check-out)
   * Cambia estado de 'confirmada' a 'completada'
   * - Solo Recepcionista/Admin/Superadmin
   */
  @Post(':id/completar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Completar reserva (Check-out)',
    description: 'Cliente se va del hotel. Cambia de "confirmada" a "completada"'
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Reserva completada exitosamente' })
  @ApiResponse({ status: 400, description: 'Estado inválido' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async completarReserva(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<Reserva> {
    const reserva = await this.reservaService.findOne(id);
    if (!reserva) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Validar que sea del hotel
    if (
      (userRole === 'recepcionista' || userRole === 'admin') &&
      reserva.idHotel !== userIdHotel
    ) {
      throw new ForbiddenException(
        'No tienes acceso a reservas de otros hoteles',
      );
    }

    return await this.reservaService.completarReserva(id);
  }

  /**
   * DELETE /reservas/:id
   * Eliminar una reserva (solo si no tiene check-in) (PROTEGIDA)
   * - Solo Recepcionista/Admin/Superadmin
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una reserva' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Reserva eliminada exitosamente' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar la reserva' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<{ message: string }> {
    const reserva = await this.reservaService.findOne(id);
    if (!reserva) {
      throw new NotFoundException(`Reserva ${id} no encontrada`);
    }

    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Validar que sea del hotel
    if (
      (userRole === 'recepcionista' || userRole === 'admin') &&
      reserva.idHotel !== userIdHotel
    ) {
      throw new ForbiddenException(
        'No tienes acceso a reservas de otros hoteles',
      );
    }

    await this.reservaService.remove(id);
    return { message: 'Reserva eliminada correctamente' };
  }

  /**
   * GET /reservas/stats/:idHotel
   * Obtener estadísticas de reservas de un hotel (PROTEGIDA)
   * - Recepcionista/Admin solo de su hotel
   * - Superadmin puede consultarsobre cualquier hotel
   */
  @Get('stats/:idHotel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estadísticas de reservas del hotel' })
  @ApiParam({ name: 'idHotel', type: Number })
  @ApiQuery({ name: 'periodo', enum: ['mes_actual', 'trimestre_actual', 'anio_actual'], required: false })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async getEstadisticas(
    @Param('idHotel', ParseIntPipe) idHotel: number,
    @Query('periodo') periodo?: 'mes_actual' | 'trimestre_actual' | 'anio_actual',
    @Request() req?: any,
  ): Promise<any> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Validar permisos
    if (
      (userRole === 'recepcionista' || userRole === 'admin') &&
      userIdHotel !== idHotel
    ) {
      throw new ForbiddenException(
        `No tienes acceso a estadísticas del hotel ${idHotel}. Solo puedo acceder al hotel ${userIdHotel}`,
      );
    }

    return await this.reservaService.getEstadisticas(idHotel, periodo);
  }
}
