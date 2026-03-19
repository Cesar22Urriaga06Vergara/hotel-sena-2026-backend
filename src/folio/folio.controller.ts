import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { FolioService } from './folio.service';
import { CreateFolioDto, AgregarCargoDto, CobrarFolioDto, EliminarCargoDto } from './dto/folio.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Folio } from './entities/folio.entity';

@ApiTags('Folios / Caja')
@Controller('folios')
export class FolioController {
  constructor(private readonly folioService: FolioService) {}

  /**
   * POST /folios
   * Crear un nuevo folio para una habitación (abre en checkin)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo folio de habitación' })
  @ApiResponse({ status: 201, description: 'Folio creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Ya existe un folio activo para esta habitación' })
  async crearFolio(
    @Body() dto: CreateFolioDto,
    @Request() req: any,
  ): Promise<Folio> {
    return await this.folioService.crearFolio(
      dto.idHabitacion,
      dto.idReserva,
      req.user?.id,
    );
  }

  /**
   * GET /folios/:idHabitacion
   * Obtener folio actual de una habitación
   */
  @Get(':idHabitacion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener folio de habitación' })
  @ApiParam({ name: 'idHabitacion', type: Number })
  @ApiResponse({ status: 200, description: 'Folio obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Folio no encontrado' })
  async obtenerFolio(
    @Param('idHabitacion', ParseIntPipe) idHabitacion: number,
  ): Promise<any> {
    return await this.folioService.obtenerResumenFolio(idHabitacion);
  }

  /**
   * POST /folios/:idHabitacion/cargos
   * Agregar un cargo al folio
   */
  @Post(':idHabitacion/cargos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin', 'cafeteria', 'lavanderia', 'spa', 'room_service')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar cargo al folio (servicio, adicional, etc.)' })
  @ApiParam({ name: 'idHabitacion', type: Number })
  @ApiResponse({ status: 200, description: 'Cargo agregado exitosamente' })
  @ApiResponse({ status: 404, description: 'Folio no encontrado' })
  async agregarCargo(
    @Param('idHabitacion', ParseIntPipe) idHabitacion: number,
    @Body() dto: AgregarCargoDto,
    @Request() req: any,
  ): Promise<Folio> {
    return await this.folioService.agregarCargo(
      idHabitacion,
      dto,
      req.user?.fullName || req.user?.nombre || 'Sistema',
    );
  }

  /**
   * DELETE /folios/:idHabitacion/cargos/:idCargo
   * Eliminar un cargo del folio
   */
  @Delete(':idHabitacion/cargos/:idCargo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar cargo del folio' })
  @ApiParam({ name: 'idHabitacion', type: Number })
  @ApiParam({ name: 'idCargo', type: String })
  @ApiResponse({ status: 200, description: 'Cargo eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Folio o cargo no encontrado' })
  async eliminarCargo(
    @Param('idHabitacion', ParseIntPipe) idHabitacion: number,
    @Param('idCargo') idCargo: string,
  ): Promise<Folio> {
    return await this.folioService.eliminarCargo(idHabitacion, idCargo);
  }

  /**
   * PUT /folios/:idHabitacion/cerrar
   * Cerrar folio (preparar para checkout)
   */
  @Put(':idHabitacion/cerrar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar folio (antes de cobrar)' })
  @ApiParam({ name: 'idHabitacion', type: Number })
  @ApiResponse({ status: 200, description: 'Folio cerrado exitosamente' })
  @ApiResponse({ status: 404, description: 'Folio no encontrado' })
  async cerrarFolio(
    @Param('idHabitacion', ParseIntPipe) idHabitacion: number,
  ): Promise<Folio> {
    return await this.folioService.cerrarFolio(idHabitacion);
  }

  /**
   * POST /folios/:idHabitacion/cobrar
   * Cobrar y cerrar folio (registra pago)
   */
  @Post(':idHabitacion/cobrar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cobrar folio (registra pago y marca como PAGADO)',
    description:
      'IMPORTANTE: Solo RECEPCIONISTA y SUPERADMIN pueden cobrar (segregación de funciones)',
  })
  @ApiParam({ name: 'idHabitacion', type: Number })
  @ApiResponse({ status: 200, description: 'Folio cobrado y cerrado exitosamente' })
  @ApiResponse({ status: 404, description: 'Folio no encontrado' })
  @ApiResponse({ status: 400, description: 'Monto insuficiente o folio ya pagado' })
  async cobrarFolio(
    @Param('idHabitacion', ParseIntPipe) idHabitacion: number,
    @Body() dto: CobrarFolioDto,
  ): Promise<{ folio: Folio; pago: any }> {
    return await this.folioService.cobrarFolio(idHabitacion, dto);
  }
}
