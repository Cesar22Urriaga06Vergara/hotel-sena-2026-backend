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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TipoHabitacionService } from './tipo-habitacion.service';
import { CreateTipoHabitacionDto } from './dto/create-tipo-habitacion.dto';
import { UpdateTipoHabitacionDto } from './dto/update-tipo-habitacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Tipos de Habitación')
@Controller('tipos-habitacion')
export class TipoHabitacionController {
  constructor(private readonly tipoHabitacionService: TipoHabitacionService) {}

  /**
   * POST /tipos-habitacion
   * Crear un nuevo tipo de habitación
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo tipo de habitación' })
  @ApiBody({ type: CreateTipoHabitacionDto })
  @ApiResponse({ status: 201, description: 'Tipo de habitación creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  create(@Body() createTipoHabitacionDto: CreateTipoHabitacionDto) {
    return this.tipoHabitacionService.create(createTipoHabitacionDto);
  }

  /**
   * GET /tipos-habitacion
   * Obtener todos los tipos de habitación (PÚBLICO)
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todos los tipos de habitación' })
  @ApiQuery({ name: 'idHotel', required: false, type: Number, description: 'Filtrar por ID del hotel' })
  @ApiResponse({ status: 200, description: 'Tipos de habitación obtenidos exitosamente' })
  findAll(@Query('idHotel') idHotel?: string) {
    if (idHotel) {
      return this.tipoHabitacionService.findByHotel(parseInt(idHotel));
    }
    return this.tipoHabitacionService.findAll();
  }

  /**
   * GET /tipos-habitacion/:id
   * Obtener un tipo de habitación por ID (PÚBLICO)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de habitación por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del tipo de habitación' })
  @ApiResponse({ status: 200, description: 'Tipo de habitación obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Tipo de habitación no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoHabitacionService.findOne(id);
  }

  /**
   * PATCH /tipos-habitacion/:id
   * Actualizar un tipo de habitación
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un tipo de habitación' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del tipo de habitación' })
  @ApiBody({ type: UpdateTipoHabitacionDto })
  @ApiResponse({ status: 200, description: 'Tipo de habitación actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Tipo de habitación no encontrado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTipoHabitacionDto: UpdateTipoHabitacionDto,
  ) {
    return this.tipoHabitacionService.update(id, updateTipoHabitacionDto);
  }

  /**
   * DELETE /tipos-habitacion/:id
   * Eliminar un tipo de habitación
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un tipo de habitación' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del tipo de habitación' })
  @ApiResponse({ status: 200, description: 'Tipo de habitación eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Tipo de habitación no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoHabitacionService.remove(id);
  }
}
