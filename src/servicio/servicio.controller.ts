import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ServicioService } from './servicio.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdateEstadoPedidoDto } from './dto/update-estado-pedido.dto';

@ApiTags('Servicios')
@Controller('servicios')
export class ServicioController {
  constructor(private readonly servicioService: ServicioService) {}

  // ── ENDPOINTS DEL CATÁLOGO DE SERVICIOS ──

  @Post('catalogo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo servicio (Admin)' })
  @ApiResponse({ status: 201, description: 'Servicio creado' })
  async crearServicio(@Body() dto: CreateServicioDto) {
    return await this.servicioService.crearServicio(dto);
  }

  @Get('catalogo/:idHotel')
  @ApiOperation({ summary: 'Obtener catálogo de servicios activos del hotel' })
  @ApiResponse({ status: 200, description: 'Catálogo de servicios' })
  async obtenerCatalogo(
    @Param('idHotel') idHotel: number,
    @Query('categoria') categoria?: string,
  ) {
    return await this.servicioService.obtenerServiciosPorHotel(idHotel, categoria);
  }

  @Get('catalogo-agrupado/:idHotel')
  @ApiOperation({ summary: 'Obtener servicios agrupados por categoría' })
  @ApiResponse({ status: 200, description: 'Servicios agrupados' })
  async obtenerCatalogoAgrupado(@Param('idHotel') idHotel: number) {
    return await this.servicioService.obtenerServiciosPorCategoria(idHotel);
  }

  @Patch('catalogo/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar servicio (Admin)' })
  @ApiResponse({ status: 200, description: 'Servicio actualizado' })
  async actualizarServicio(
    @Param('id') id: number,
    @Body() dto: UpdateServicioDto,
  ) {
    return await this.servicioService.actualizarServicio(id, dto);
  }

  @Delete('catalogo/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar servicio (Admin)' })
  @ApiResponse({ status: 200, description: 'Servicio desactivado' })
  @HttpCode(HttpStatus.OK)
  async desactivarServicio(@Param('id') id: number) {
    return await this.servicioService.desactivarServicio(id);
  }

  // ── ENDPOINTS DE PEDIDOS CLIENTE ──

  @Post('pedidos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo pedido (Cliente)' })
  @ApiResponse({ status: 201, description: 'Pedido creado' })
  async crearPedido(@Body() dto: CreatePedidoDto, @Req() req: any) {
    const idCliente = req.user.idCliente;
    return await this.servicioService.crearPedido(idCliente, dto);
  }

  @Get('pedidos/mis-pedidos/:idReserva')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis pedidos (Cliente)' })
  @ApiResponse({ status: 200, description: 'Pedidos del cliente' })
  async obtenerMisPedidos(
    @Param('idReserva') idReserva: number,
    @Req() req: any,
  ) {
    const idCliente = req.user.idCliente;
    return await this.servicioService.obtenerPedidosCliente(idCliente, idReserva);
  }

  @Delete('pedidos/:id/cancelar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cliente')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar pedido (Cliente)' })
  @ApiResponse({ status: 200, description: 'Pedido cancelado' })
  @HttpCode(HttpStatus.OK)
  async cancelarPedido(@Param('id') id: number, @Req() req: any) {
    const idCliente = req.user.idCliente;
    return await this.servicioService.cancelarPedidoCliente(id, idCliente);
  }

  // ── ENDPOINTS DE PEDIDOS EMPLEADOS DE ÁREA ──

  @Get('pedidos/area/:idHotel/:categoria')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cafeteria', 'lavanderia', 'spa', 'room_service', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener pedidos del área (Empleado de área)' })
  @ApiResponse({ status: 200, description: 'Pedidos del área' })
  async obtenerPedidosArea(
    @Param('idHotel') idHotel: number,
    @Param('categoria') categoria: string,
    @Query('estado') estado?: string,
  ) {
    return await this.servicioService.obtenerPedidosPorCategoria(
      idHotel,
      categoria,
      estado,
    );
  }

  @Get('pedidos/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalle de pedido' })
  @ApiResponse({ status: 200, description: 'Detalle del pedido' })
  async obtenerPedido(@Param('id') id: number) {
    return await this.servicioService.obtenerPedido(id);
  }

  @Patch('pedidos/:id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cafeteria', 'lavanderia', 'spa', 'room_service', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado del pedido (Empleado)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  async actualizarEstadoPedido(
    @Param('id') id: number,
    @Body() dto: UpdateEstadoPedidoDto,
    @Req() req: any,
  ) {
    const idEmpleado = req.user.idEmpleado;
    return await this.servicioService.actualizarEstadoPedido(id, idEmpleado, dto);
  }

  // ── ENDPOINT DE CUENTA ──

  @Get('cuenta/:idReserva')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener cuenta de la reserva' })
  @ApiResponse({ status: 200, description: 'Cuenta de la reserva' })
  async obtenerCuentaReserva(@Param('idReserva') idReserva: number) {
    return await this.servicioService.obtenerCuentaReserva(idReserva);
  }
}


