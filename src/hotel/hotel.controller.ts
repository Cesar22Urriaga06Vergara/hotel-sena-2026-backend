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
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HotelService } from './hotel.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { Hotel } from './entities/hotel.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Hoteles')
@Controller('hoteles')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  /**
   * POST /hoteles
   * Crear un nuevo hotel (solo superadmin)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo hotel (solo superadmin)' })
  @ApiBody({ type: CreateHotelDto })
  @ApiResponse({ status: 201, description: 'Hotel creado exitosamente' })
  @ApiResponse({ status: 400, description: 'NIT duplicado o datos inválidos' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para esta acción' })
  async create(@Body() createHotelDto: CreateHotelDto): Promise<Hotel> {
    return await this.hotelService.create(createHotelDto);
  }

  /**
   * GET /hoteles
   * Obtener todos los hoteles (superadmin y admin)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los hoteles' })
  @ApiResponse({ status: 200, description: 'Lista de hoteles' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para esta acción' })
  async findAll(): Promise<Hotel[]> {
    return await this.hotelService.findAll();
  }

  /**
   * GET /hoteles/:id
   * Obtener un hotel por ID (público)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un hotel por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Hotel encontrado' })
  @ApiResponse({ status: 404, description: 'Hotel no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Hotel> {
    return await this.hotelService.findOne(id);
  }

  /**
   * PATCH /hoteles/:id
   * Actualizar un hotel (solo superadmin)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un hotel (solo superadmin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateHotelDto })
  @ApiResponse({ status: 200, description: 'Hotel actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Hotel no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para esta acción' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHotelDto: UpdateHotelDto,
  ): Promise<Hotel> {
    return await this.hotelService.update(id, updateHotelDto);
  }

  /**
   * DELETE /hoteles/:id
   * Eliminar un hotel (solo superadmin)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un hotel (solo superadmin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Hotel eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Hotel no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para esta acción' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.hotelService.remove(id);
    return { message: 'Hotel eliminado correctamente' };
  }
}


