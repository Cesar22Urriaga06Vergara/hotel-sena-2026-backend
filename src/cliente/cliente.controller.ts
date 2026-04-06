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
import { ClienteService } from './cliente.service';
import { HistorialClienteService } from './historial-cliente.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Clientes')
@Controller('clientes')
export class ClienteController {
  constructor(
    private readonly clienteService: ClienteService,
    private readonly historialClienteService: HistorialClienteService,
  ) {}

  /**
   * POST /clientes
   * Crear un nuevo cliente (solo Admin)
   * Para el registro de clientes normales, usar /auth/register
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo cliente (solo admin)' })
  @ApiBody({ type: CreateClienteDto })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para esta acción' })
  async create(@Body() createClienteDto: CreateClienteDto): Promise<Cliente> {
    return await this.clienteService.create(createClienteDto);
  }

  /**
   * GET /clientes/:id
   * Obtener un cliente por ID (protegido)
   * - Clientes solo ven su propio datos
   * - Admin/Recepcionista ven clientes de su hotel
   * - SuperAdmin ve todos
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'recepcionista', 'superadmin', 'cliente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un cliente por ID (protegido)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para ver este cliente' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<Cliente> {
    // Cliente solo puede ver su propia información
    if (req.user.rol === 'cliente' && req.user.idCliente !== id) {
      throw new ForbiddenException('No tienes permiso para ver este cliente');
    }
    
    return await this.clienteService.findOne(id);
  }

  /**
   * GET /clientes
   * Obtener todos los clientes del hotel del usuario (protegido - admin/recepcionista)
   * Admin/Recepcionista solo ven clientes de su hotel
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'recepcionista', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los clientes' })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(@Request() req: any): Promise<Cliente[]> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Superadmin ve todos
    if (userRole === 'superadmin') {
      return await this.clienteService.findAll();
    }

    // Admin/Recepcionista: validar que están asignados a un hotel
    if (!userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Filtrar por hotel del usuario
    return await this.clienteService.findAllByHotel(userIdHotel);
  }

  /**
   * PATCH /clientes/:id
   * Actualizar un cliente (solo Admin/Superadmin)
   * Admin solo puede actualizar clientes de su hotel
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar datos de un cliente' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateClienteDto })
  @ApiResponse({ status: 200, description: 'Cliente actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para esta acción' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClienteDto: UpdateClienteDto,
    @Request() req: any,
  ): Promise<Cliente> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Admin: validar que está asignado a un hotel
    if (userRole === 'admin' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Superadmin puede actualizar cualquier cliente
    if (userRole === 'superadmin') {
      return await this.clienteService.update(id, updateClienteDto);
    }

    return await this.clienteService.update(id, updateClienteDto);
  }

  /**
   * DELETE /clientes/:id
   * Eliminar un cliente (solo Admin/Superadmin)
   * Admin solo puede eliminar clientes de su hotel
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un cliente' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Cliente eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para esta acción' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Admin: validar que está asignado a un hotel
    if (userRole === 'admin' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Superadmin puede eliminar cualquier cliente
    if (userRole === 'superadmin') {
      await this.clienteService.remove(id);
      return { message: 'Cliente eliminado correctamente' };
    }

    await this.clienteService.remove(id);
    return { message: 'Cliente eliminado correctamente' };
  }

  /**
   * GET /clientes/:id/historial
   * Obtener historial completo de un cliente
   * Cliente: solo su propio historial
   * Admin: solo historial de clientes de su hotel
   * Superadmin: cualquier cliente
   */
  @Get(':id/historial')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener historial de cliente' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Historial obtenido' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado para ver este historial' })
  async obtenerHistorial(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Cliente solo su propio historial
    if (userRole === 'cliente' && req.user.idCliente !== id) {
      throw new ForbiddenException('No tienes permiso para ver este historial');
    }

    // Admin: validar que está asignado a un hotel
    if (userRole === 'admin' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Superadmin puede ver cualquier cliente
    // Admin solo ve historial de clientes de su hotel (validación en service)
    return this.historialClienteService.obtenerHistorial(id, userIdHotel, userRole);
  }

  /**
   * GET /clientes/vip
   * Obtener clientes VIP (más gastadores, más reservas)
   * Admin solo ve VIPs de su hotel
   * Superadmin ve todos los VIPs
   */
  @Get('vip')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener clientes VIP' })
  @ApiQuery({ name: 'minReservas', type: Number, required: false })
  @ApiQuery({ name: 'minGasto', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Clientes VIP obtenidos' })
  async obtenerClientesVIP(
    @Query('minReservas', new ParseIntPipe({ optional: true })) minReservas: number = 5,
    @Query('minGasto', new ParseIntPipe({ optional: true })) minGasto: number = 1000000,
    @Request() req: any,
  ) {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Admin: validar que está asignado a un hotel
    if (userRole === 'admin' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Superadmin ve todos, admin solo su hotel
    return this.historialClienteService.obtenerClientesVIP(
      minReservas,
      minGasto,
      userIdHotel,
      userRole,
    );
  }
}


