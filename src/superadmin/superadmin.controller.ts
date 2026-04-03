import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotImplementedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SuperadminService } from './superadmin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Superadmin')
@Controller('superadmin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
@ApiBearerAuth()
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  // ─── Hoteles ─────────────────────────────────────────────────────────────────

  @Get('hoteles')
  @ApiOperation({ summary: 'Listar todos los hoteles con métricas' })
  async getHoteles() {
    return this.superadminService.getHoteles();
  }

  @Post('hoteles')
  @ApiOperation({ summary: 'Crear un nuevo hotel' })
  async crearHotel(@Body() body: any) {
    return this.superadminService.crearHotel(body);
  }

  @Get('hoteles/:id')
  @ApiOperation({ summary: 'Obtener un hotel por ID' })
  async getHotel(@Param('id', ParseIntPipe) id: number) {
    return this.superadminService.getHotel(id);
  }

  @Patch('hoteles/:id')
  @ApiOperation({ summary: 'Actualizar un hotel' })
  async actualizarHotel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.superadminService.actualizarHotel(id, body);
  }

  @Delete('hoteles/:id')
  @ApiOperation({ summary: 'Eliminar un hotel' })
  async eliminarHotel(@Param('id', ParseIntPipe) id: number) {
    return this.superadminService.eliminarHotel(id);
  }

  @Post('hoteles/:id/suspender')
  @ApiOperation({ summary: 'Suspender un hotel' })
  async suspenderHotel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { razon: string },
  ) {
    return this.superadminService.suspenderHotel(id, body.razon);
  }

  @Post('hoteles/:id/reactivar')
  @ApiOperation({ summary: 'Reactivar un hotel suspendido' })
  async reactivarHotel(@Param('id', ParseIntPipe) id: number) {
    return this.superadminService.reactivarHotel(id);
  }

  // ─── Métricas ─────────────────────────────────────────────────────────────────

  @Get('metricas/plataforma')
  @ApiOperation({ summary: 'Métricas globales de la plataforma' })
  async getMetricasPlataforma() {
    return this.superadminService.getMetricasPlataforma();
  }

  @Get('metricas/crecimiento')
  @ApiOperation({ summary: 'Métricas de crecimiento por período' })
  @ApiQuery({ name: 'periodo', enum: ['mes', 'trimestre', 'año'], required: false })
  async getMetricasCrecimiento(@Query('periodo') periodo?: 'mes' | 'trimestre' | 'año') {
    return this.superadminService.getMetricasCrecimiento(periodo || 'mes');
  }

  // ─── Categorías ───────────────────────────────────────────────────────────────

  @Get('categorias-servicios')
  @ApiOperation({ summary: 'Listar categorías de servicios' })
  @ApiQuery({ name: 'idHotel', required: false, type: Number })
  async getCategorias(@Query('idHotel') idHotel?: string) {
    return this.superadminService.getCategorias(idHotel ? +idHotel : undefined);
  }

  @Post('categorias-servicios')
  @ApiOperation({ summary: 'Crear categoría de servicio' })
  async crearCategoria(@Body() body: any) {
    return this.superadminService.crearCategoria(body);
  }

  @Patch('categorias-servicios/:id')
  @ApiOperation({ summary: 'Actualizar categoría de servicio' })
  async actualizarCategoria(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.superadminService.actualizarCategoria(id, body);
  }

  @Delete('categorias-servicios/:id')
  @ApiOperation({ summary: 'Eliminar categoría de servicio' })
  async eliminarCategoria(@Param('id', ParseIntPipe) id: number) {
    return this.superadminService.eliminarCategoria(id);
  }

  // ─── Planes (stub — módulo no implementado) ───────────────────────────────────

  @Get('planes')
  @ApiOperation({ summary: '[Stub] Listar planes SaaS — módulo pendiente' })
  getPlanes() {
    return [];
  }

  @Post('planes')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: '[Stub] Crear plan SaaS — módulo pendiente' })
  crearPlan() {
    throw new NotImplementedException('Módulo de planes SaaS no implementado aún');
  }

  @Patch('planes/:id')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: '[Stub] Actualizar plan SaaS — módulo pendiente' })
  actualizarPlan() {
    throw new NotImplementedException('Módulo de planes SaaS no implementado aún');
  }

  // ─── Configuración global (stub) ──────────────────────────────────────────────

  @Get('config/features-flags')
  @ApiOperation({ summary: '[Stub] Listar feature flags — módulo pendiente' })
  getFeatureFlags() {
    return [];
  }

  @Post('config/features-flags')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: '[Stub] Crear feature flag — módulo pendiente' })
  crearFeatureFlag() {
    throw new NotImplementedException('Módulo de feature flags no implementado aún');
  }

  @Patch('config/features-flags/:id')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: '[Stub] Actualizar feature flag — módulo pendiente' })
  actualizarFeatureFlag() {
    throw new NotImplementedException('Módulo de feature flags no implementado aún');
  }

  @Get('config/parametros-globales')
  @ApiOperation({ summary: '[Stub] Listar parámetros globales — módulo pendiente' })
  getParametrosGlobales() {
    return [];
  }

  @Patch('config/parametros-globales/:clave')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: '[Stub] Actualizar parámetro global — módulo pendiente' })
  actualizarParametroGlobal() {
    throw new NotImplementedException('Módulo de parámetros globales no implementado aún');
  }

  // ─── Soporte / Impersonación (stub) ───────────────────────────────────────────

  @Get('soporte/impersonaciones-activas')
  @ApiOperation({ summary: '[Stub] Listar impersonaciones activas — módulo pendiente' })
  getImpersonacionesActivas() {
    return [];
  }

  @Post('soporte/impersonar')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: '[Stub] Iniciar impersonación — módulo pendiente' })
  impersonar() {
    throw new NotImplementedException('Módulo de impersonación no implementado aún');
  }

  @Post('soporte/terminar-impersonacion')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: '[Stub] Terminar impersonación — módulo pendiente' })
  terminarImpersonacion() {
    throw new NotImplementedException('Módulo de impersonación no implementado aún');
  }

  @Get('soporte/logs')
  @ApiOperation({ summary: '[Stub] Listar logs del sistema — módulo pendiente' })
  @ApiQuery({ name: 'formato', required: false })
  getLogs() {
    return [];
  }

  @Get('soporte/logs/hotel/:hotelId')
  @ApiOperation({ summary: '[Stub] Logs por hotel — módulo pendiente' })
  getLogsPorHotel() {
    return [];
  }

  @Get('soporte/logs/usuario/:usuarioId')
  @ApiOperation({ summary: '[Stub] Logs por usuario — módulo pendiente' })
  getLogsPorUsuario() {
    return [];
  }

  @Get('soporte/logs/exportar')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: '[Stub] Exportar logs — módulo pendiente' })
  exportarLogs() {
    throw new NotImplementedException('Exportación de logs no implementada aún');
  }
}
