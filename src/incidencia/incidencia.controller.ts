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
  Request,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RoomIncidentService } from './incidencia.service';
import { CreateRoomIncidentDto } from './dto/create-room-incident.dto';
import { UpdateRoomIncidentDto } from './dto/update-room-incident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoomIncident } from './entities/room-incident.entity';
import {
  ESTADOS_INCIDENCIA,
  ETIQUETAS_INCIDENCIA,
  TIPOS_INCIDENCIA,
  AREAS_INCIDENCIA,
  TRANSICIONES_INCIDENCIA,
} from '../common/constants/estados.constants';

@ApiTags('Incidencias (Room Incidents)')
@Controller('incidencias')
export class IncidenciaController {
  constructor(private readonly incidenciaService: RoomIncidentService) {}

  private filtrarIncidenciasPorHotel(incidencias: RoomIncident[], req: any): RoomIncident[] {
    const userRole = req?.user?.rol;

    if (userRole === 'superadmin') {
      return incidencias;
    }

    const userIdHotel = req?.user?.idHotel;
    if (!userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    return incidencias.filter((incidencia) => incidencia.habitacion?.idHotel === userIdHotel);
  }

  /**
   * GET /incidencias/catalogo/estados
   * Catálogo público de estados, tipos y áreas — sin autenticación para uso en formularios
   */
  @Get('catalogo/estados')
  @ApiOperation({ summary: 'Catálogo de estados, tipos y áreas de incidencias' })
  @ApiResponse({ status: 200, description: 'Catálogo obtenido' })
  getCatalogoEstados() {
    const estados = Object.entries(ESTADOS_INCIDENCIA).map(([, valor]) => ({
      valor,
      etiqueta: ETIQUETAS_INCIDENCIA[valor],
      transicionesPermitidas: TRANSICIONES_INCIDENCIA[valor],
    }));

    const tipos = Object.entries(TIPOS_INCIDENCIA).map(([valor, etiqueta]) => ({
      valor,
      etiqueta,
    }));

    const areas = Object.entries(AREAS_INCIDENCIA).map(([valor, etiqueta]) => ({
      valor,
      etiqueta,
    }));

    return { estados, tipos, areas };
  }

  /**
   * POST /incidencias
   * Crear nueva incidencia en una habitación
   * Roles: recepcionista (crea), admin, superadmin
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nueva incidencia' })
  @ApiResponse({ status: 201, description: 'Incidencia creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async crearIncidencia(
    @Body() dto: CreateRoomIncidentDto,
    @Request() req: any,
  ): Promise<RoomIncident> {
    return this.incidenciaService.crearIncidencia(
      dto,
      req.user.id,
      req.user.fullName || req.user.nombre,
    );
  }

  /**
   * GET /incidencias/reserva/:idReserva
   * Obtener todas las incidencias de una reserva
   */
  @Get('reserva/:idReserva')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente', 'recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener incidencias de una reserva' })
  @ApiParam({ name: 'idReserva', type: Number })
  @ApiResponse({ status: 200, description: 'Incidencias obtenidas' })
  async obtenerPorReserva(
    @Param('idReserva', ParseIntPipe) idReserva: number,
  ): Promise<RoomIncident[]> {
    return this.incidenciaService.obtenerPorReserva(idReserva);
  }

  /**
   * GET /incidencias/habitacion/:idHabitacion
   * Obtener todas las incidencias de una habitación
   */
  @Get('habitacion/:idHabitacion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener incidencias de una habitación' })
  @ApiParam({ name: 'idHabitacion', type: Number })
  @ApiResponse({ status: 200, description: 'Incidencias obtenidas' })
  async obtenerPorHabitacion(
    @Param('idHabitacion', ParseIntPipe) idHabitacion: number,
  ): Promise<RoomIncident[]> {
    return this.incidenciaService.obtenerPorHabitacion(idHabitacion);
  }

  /**
   * GET /incidencias/activas
   * Obtener incidencias pendientes o en progreso
   */
  @Get('listado/activas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener incidencias activas' })
  @ApiResponse({ status: 200, description: 'Incidencias activas obtenidas' })
  async obtenerActivas(@Request() req: any): Promise<RoomIncident[]> {
    const incidencias = await this.incidenciaService.obtenerActivas();
    return this.filtrarIncidenciasPorHotel(incidencias, req);
  }

  /**
   * GET /incidencias/area/:areaAsignada
   * Obtener incidencias de un área específica
   */
  @Get('area/:areaAsignada')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener incidencias de un área' })
  @ApiParam({ name: 'areaAsignada', type: String })
  @ApiQuery({ name: 'estado', type: String, required: false })
  @ApiQuery({ name: 'prioridad', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Incidencias obtenidas' })
  async obtenerPorArea(
    @Param('areaAsignada') areaAsignada: string,
    @Query('estado') estado?: string,
    @Query('prioridad') prioridad?: string,
    @Request() req?: any,
  ): Promise<RoomIncident[]> {
    const incidencias = await this.incidenciaService.obtenerPorAreaYHotel(areaAsignada, {
      estado,
      prioridad,
    });

    return this.filtrarIncidenciasPorHotel(incidencias, req);
  }

  /**
   * GET /incidencias/stats
   * Obtener estadísticas de incidencias
   */
  @Get('stats/general')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estadísticas de incidencias' })
  @ApiQuery({ name: 'desde', type: String, required: false })
  @ApiQuery({ name: 'hasta', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas' })
  async obtenerEstadisticas(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.incidenciaService.obtenerEstadisticas(
      desde ? new Date(desde) : undefined,
      hasta ? new Date(hasta) : undefined,
    );
  }

  /**
   * GET /incidencias
   * Obtener todas las incidencias con filtros opcionales
   */
  @Get('listado/todas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las incidencias' })
  @ApiQuery({ name: 'estado', type: String, required: false })
  @ApiQuery({ name: 'tipo', type: String, required: false })
  @ApiQuery({ name: 'prioridad', type: String, required: false })
  @ApiQuery({ name: 'areaAsignada', type: String, required: false })
  @ApiQuery({ name: 'esResponsabilidadCliente', type: Boolean, required: false })
  @ApiResponse({ status: 200, description: 'Incidencias obtenidas' })
  async obtenerTodas(
    @Query('estado') estado?: string,
    @Query('tipo') tipo?: string,
    @Query('prioridad') prioridad?: string,
    @Query('areaAsignada') areaAsignada?: string,
    @Query('esResponsabilidadCliente') esResponsabilidadCliente?: string,
    @Request() req?: any,
  ): Promise<RoomIncident[]> {
    const incidencias = await this.incidenciaService.obtenerTodas({
      estado,
      tipo,
      prioridad,
      areaAsignada,
      esResponsabilidadCliente: esResponsabilidadCliente === 'true',
    });

    return this.filtrarIncidenciasPorHotel(incidencias, req);
  }

  /**
   * GET /incidencias/:id
   * Obtener una incidencia por ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente', 'recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener incidencia por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Incidencia obtenida' })
  @ApiResponse({ status: 404, description: 'Incidencia no encontrada' })
  async obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RoomIncident> {
    return this.incidenciaService.obtenerPorId(id);
  }

  /**
   * PATCH /incidencias/:id
   * Actualizar una incidencia (estado, asignar empleado, resolver, etc.)
   * Solo recepcionista, admin y superadmin
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar incidencia' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Incidencia actualizada' })
  @ApiResponse({ status: 404, description: 'Incidencia no encontrada' })
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoomIncidentDto,
  ): Promise<RoomIncident> {
    return this.incidenciaService.actualizar(id, dto);
  }

  /**
   * DELETE /incidencias/:id/cancelar
   * Cancelar una incidencia
   */
  @Post(':id/cancelar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar incidencia' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Incidencia cancelada' })
  @ApiResponse({ status: 404, description: 'Incidencia no encontrada' })
  async cancelar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { razon?: string },
  ): Promise<RoomIncident> {
    return this.incidenciaService.cancelar(id, body.razon);
  }
}
