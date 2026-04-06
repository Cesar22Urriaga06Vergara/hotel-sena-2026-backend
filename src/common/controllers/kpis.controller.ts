import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { KpisService } from '../services/kpis.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ApiResponseService } from '../services/api-response.service';

@ApiTags('KPIs - Dashboards')
@Controller('kpis')
export class KpisController {
  constructor(
    private readonly kpisService: KpisService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  /**
   * GET /kpis/recepcionista/flujo-dia
   * Flujo del día: check-ins pendientes, check-outs pendientes, realizados
   * RECEPCIONISTA
   */
  @Get('recepcionista/flujo-dia')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Flujo del día (check-ins, check-outs)' })
  @ApiResponse({ status: 200, description: 'Flujo del día obtenido' })
  async getFlujoDiaRecepcionista(@Request() req: any) {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    if ((userRole === 'recepcionista' || userRole === 'admin') && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    const idHotel = userRole === 'superadmin' ? (req.query?.idHotel || 1) : userIdHotel;

    const data = await this.kpisService.getFlujoDiaRecepcionista(idHotel);
    return this.apiResponseService.success(data, 'Flujo del día obtenido');
  }

  /**
   * GET /kpis/recepcionista/caja
   * Movimientos de caja del día
   * RECEPCIONISTA
   */
  @Get('recepcionista/caja')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Caja del día (ingresos, egresos, saldo)' })
  @ApiResponse({ status: 200, description: 'Caja obtenida' })
  async getCajaDiaRecepcionista(@Request() req: any) {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    if ((userRole === 'recepcionista' || userRole === 'admin') && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    const idHotel = userRole === 'superadmin' ? (req.query?.idHotel || 1) : userIdHotel;

    const data = await this.kpisService.getCajaDiaRecepcionista(idHotel);
    return this.apiResponseService.success(data, 'Caja del día obtenida');
  }

  /**
   * GET /kpis/admin/hotel
   * Estado general del hotel: ocupación, reservas próximas, ingresos
   * ADMIN
   */
  @Get('admin/hotel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estado del hotel (ocupación, reservas, ingresos)' })
  @ApiResponse({ status: 200, description: 'Estado del hotel obtenido' })
  async getEstadoHotel(@Request() req: any) {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    if (userRole === 'admin' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    const idHotel = userRole === 'superadmin' ? (req.query?.idHotel || 1) : userIdHotel;

    const data = await this.kpisService.getEstadoHotel(idHotel);
    return this.apiResponseService.success(data, 'Estado del hotel obtenido');
  }

  /**
   * GET /kpis/superadmin/plataforma
   * Métricas de plataforma: hoteles, usuarios, ingresos SaaS
   * SUPERADMIN
   */
  @Get('superadmin/plataforma')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Métricas generales de plataforma' })
  @ApiResponse({ status: 200, description: 'Métricas de plataforma obtenidas' })
  async getMetricasPlataforma() {
    const data = await this.kpisService.getMetricasPlataforma();
    return this.apiResponseService.success(data, 'Métricas de plataforma obtenidas');
  }

  /**
   * GET /kpis/superadmin/crecimiento
   * Crecimiento de plataforma: hoteles nuevos, usuarios nuevos, tendencias
   * SUPERADMIN
   *
   * Query: periodo=mes|trimestre|año (default: mes)
   */
  @Get('superadmin/crecimiento')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crecimiento de plataforma por período' })
  @ApiQuery({
    name: 'periodo',
    enum: ['mes', 'trimestre', 'año'],
    required: false,
    description: 'Período de análisis (default: mes)',
  })
  @ApiResponse({ status: 200, description: 'Crecimiento obtenido' })
  async getCrecimientoPlataforma(
    @Query('periodo') periodo?: 'mes' | 'trimestre' | 'año',
  ) {
    const data = await this.kpisService.getCrecimientoPlataforma(periodo || 'mes');
    return this.apiResponseService.success(data, 'Crecimiento de plataforma obtenido');
  }
}
