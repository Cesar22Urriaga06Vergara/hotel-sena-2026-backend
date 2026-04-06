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
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ClienteService } from "../cliente/cliente.service";
import { HistorialClienteService } from '../cliente/historial-cliente.service';
import { CreateClienteDto } from '../cliente/dto/create-cliente.dto';
import { UpdateClienteDto } from '../cliente/dto/update-cliente.dto';
import { Cliente } from '../cliente/entities/cliente.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Controlador HUÉSPEDES
 * Alias del controlador CLIENTES
 * Proporciona mejor UX para RECEPCIONISTA (terminar "huéspedes" en lugar de "clientes")
 */
@ApiTags('Huéspedes')
@Controller('huespedes')
export class HuespedesController {
  constructor(
    private readonly clienteService: ClienteService,
    private readonly historialClienteService: HistorialClienteService,
  ) {}

  /**
   * POST /huespedes
   * Registrar un nuevo huésped (en contexto de check-in)
   * Alias de POST /clientes
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar nuevo huésped en check-in' })
  @ApiBody({ type: CreateClienteDto })
  @ApiResponse({ status: 201, description: 'Huésped registrado exitosamente' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para esta acción' })
  async registrarHuesped(@Body() createClienteDto: CreateClienteDto): Promise<Cliente> {
    return await this.clienteService.create(createClienteDto);
  }

  /**
   * GET /huespedes/:id
   * Obtener datos de un huésped (protegido)
   * Alias de GET /clientes/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'recepcionista', 'superadmin', 'cliente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener datos de un huésped (protegido)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Huésped encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para ver este huésped' })
  @ApiResponse({ status: 404, description: 'Huésped no encontrado' })
  async obtenerHuesped(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<Cliente> {
    // Cliente solo puede ver su propia información
    if (req.user.rol === 'cliente' && req.user.idCliente !== id) {
      throw new ForbiddenException('No tienes permiso para ver este huésped');
    }
    
    return await this.clienteService.findOne(id);
  }

  /**
   * GET /huespedes
   * Obtener lista de huéspedes (clientes del hotel)
   * Alias de GET /clientes
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener lista de huéspedes del hotel' })
  @ApiResponse({ status: 200, description: 'Lista de huéspedes' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async obtenerHuespedes(@Request() req: any): Promise<Cliente[]> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Superadmin ve todos
    if (userRole === 'superadmin') {
      return await this.clienteService.findAll();
    }

    // Recepcionista/Admin: validar que están asignados a un hotel
    if (!userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Filtrar por hotel del usuario
    return await this.clienteService.findAllByHotel(userIdHotel);
  }

  /**
   * PATCH /huespedes/:id
   * Actualizar datos de un huésped
   * Alias de PATCH /clientes/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar datos de un huésped' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateClienteDto })
  @ApiResponse({ status: 200, description: 'Huésped actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Huésped no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para esta acción' })
  async actualizarHuesped(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClienteDto: UpdateClienteDto,
    @Request() req: any,
  ): Promise<Cliente> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Recepcionista puede actualizar clientes de su hotel
    if (userRole === 'recepcionista' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Superadmin puede actualizar cualquiera
    if (userRole === 'superadmin') {
      return await this.clienteService.update(id, updateClienteDto);
    }

    return await this.clienteService.update(id, updateClienteDto);
  }

  /**
   * GET /huespedes/:id/historial
   * Obtener historial completo de un huésped
   * Alias de GET /clientes/:id/historial
   */
  @Get(':id/historial')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener historial de estancias del huésped' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Historial obtenido' })
  @ApiResponse({ status: 404, description: 'Huésped no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async obtenerHistorialHuesped(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Validar permisos de recepcionista
    if (userRole === 'recepcionista' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Delegarlógica al servicio de historial
    return await this.historialClienteService.obtenerHistorial(id);
  }
}
