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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AmenidadService } from './amenidad.service';
import { CreateAmenidadDto } from './dto/create-amenidad.dto';
import { UpdateAmenidadDto } from './dto/update-amenidad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Amenidades')
@ApiBearerAuth()
@Controller('amenidades')
@UseGuards(JwtAuthGuard)
export class AmenidadController {
  constructor(private readonly amenidadService: AmenidadService) {}

  /**
   * POST /amenidades
   * Crear una nueva amenidad (solo admin/superadmin)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Crear una nueva amenidad (solo admin/superadmin)' })
  @ApiBody({ type: CreateAmenidadDto })
  @ApiResponse({ status: 201, description: 'Amenidad creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Solo admin/superadmin pueden crear amenidades' })
  create(@Body() createAmenidadDto: CreateAmenidadDto) {
    return this.amenidadService.create(createAmenidadDto);
  }

  /**
   * GET /amenidades
   * Obtener todas las amenidades
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todas las amenidades' })
  @ApiResponse({ status: 200, description: 'Amenidades obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll() {
    return this.amenidadService.findAll();
  }

  /**
   * GET /amenidades/:id
   * Obtener una amenidad por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una amenidad por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la amenidad' })
  @ApiResponse({ status: 200, description: 'Amenidad obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Amenidad no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.amenidadService.findOne(id);
  }

  /**
   * PATCH /amenidades/:id
   * Actualizar una amenidad
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una amenidad' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la amenidad' })
  @ApiBody({ type: UpdateAmenidadDto })
  @ApiResponse({ status: 200, description: 'Amenidad actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Amenidad no encontrada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAmenidadDto: UpdateAmenidadDto,
  ) {
    return this.amenidadService.update(id, updateAmenidadDto);
  }

  /**
   * DELETE /amenidades/:id
   * Eliminar una amenidad
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una amenidad' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la amenidad' })
  @ApiResponse({ status: 200, description: 'Amenidad eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Amenidad no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.amenidadService.remove(id);
  }
}
