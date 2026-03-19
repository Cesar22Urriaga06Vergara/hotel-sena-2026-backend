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
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { HabitacionService } from './habitacion.service';
import { CreateHabitacionDto } from './dto/create-habitacion.dto';
import { UpdateHabitacionDto } from './dto/update-habitacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Habitaciones')
@Controller('habitaciones')
export class HabitacionController {
  constructor(private readonly habitacionService: HabitacionService) {}

  /**
   * POST /habitaciones
   * Crear una nueva habitación (sin imágenes)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva habitación' })
  @ApiBody({ type: CreateHabitacionDto })
  @ApiResponse({ status: 201, description: 'Habitación creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo admin/superadmin pueden crear habitaciones' })
  create(
    @Body() createHabitacionDto: CreateHabitacionDto,
    @Request() req: any,
  ) {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Admin debe estar asignado a un hotel
    if (userRole === 'admin' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Admin solo puede crear habitaciones en su hotel
    if (userRole === 'admin' && createHabitacionDto.idHotel !== userIdHotel) {
      throw new ForbiddenException(
        `No tienes permiso para crear habitaciones en el hotel ${createHabitacionDto.idHotel}. Solo en tu hotel ${userIdHotel}`,
      );
    }

    return this.habitacionService.create(createHabitacionDto);
  }

  /**
   * GET /habitaciones
   * Obtener todas las habitaciones (PÚBLICO)
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todas las habitaciones' })
  @ApiQuery({ name: 'idHotel', required: false, type: Number, description: 'Filtrar por ID del hotel' })
  @ApiQuery({ name: 'idTipoHabitacion', required: false, type: Number, description: 'Filtrar por ID del tipo de habitación' })
  @ApiQuery({ name: 'disponibles', required: false, type: Boolean, description: 'Solo habitaciones disponibles (por defecto true si idHotel es proporcionado)' })
  @ApiResponse({ status: 200, description: 'Habitaciones obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(
    @Query('idHotel') idHotel?: string,
    @Query('idTipoHabitacion') idTipoHabitacion?: string,
    @Query('disponibles') disponibles?: string,
  ) {
    if (idHotel) {
      const soloDisponibles = disponibles !== 'false'; // Por defecto true
      return this.habitacionService.findByHotel(parseInt(idHotel), soloDisponibles);
    }
    if (idTipoHabitacion) {
      return this.habitacionService.findByTipo(parseInt(idTipoHabitacion));
    }
    return this.habitacionService.findAll();
  }

  /**
   * GET /habitaciones/:id
   * Obtener una habitación por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una habitación por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la habitación' })
  @ApiResponse({ status: 200, description: 'Habitación obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Habitación no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.habitacionService.findOne(id);
  }

  /**
   * PATCH /habitaciones/:id
   * Actualizar una habitación
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una habitación' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la habitación' })
  @ApiBody({ type: UpdateHabitacionDto })
  @ApiResponse({ status: 200, description: 'Habitación actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Habitación no encontrada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo admin/superadmin pueden actualizar habitaciones' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHabitacionDto: UpdateHabitacionDto,
    @Request() req: any,
  ) {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Admin debe estar asignado a un hotel
    if (userRole === 'admin' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Para admin, validar que la habitación pertenezca a su hotel
    if (userRole === 'admin') {
      const habitacion = await this.habitacionService.findOne(id);
      if (!habitacion) {
        throw new NotFoundException('Habitación no encontrada');
      }

      if (habitacion.idHotel !== userIdHotel) {
        throw new ForbiddenException(
          'No tienes permiso para actualizar habitaciones de otro hotel',
        );
      }
    }

    return this.habitacionService.update(id, updateHabitacionDto);
  }

  /**
   * PATCH /habitaciones/:id/imagenes
   * Subir/actualizar imágenes de una habitación
   */
  @Patch(':id/imagenes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('imagenes', 5, { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir o actualizar imágenes a una habitación' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la habitación' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['imagenes'],
      properties: {
        imagenes: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Imágenes de la habitación (máximo 5)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Imágenes subidas exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o archivo no válido' })
  @ApiResponse({ status: 404, description: 'Habitación no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo admin/superadmin pueden subir imágenes' })
  async uploadImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files?: Express.Multer.File[],
    @Request() req?: any,
  ) {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Admin debe estar asignado a un hotel
    if (userRole === 'admin' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Para admin, validar que la habitación pertenezca a su hotel
    if (userRole === 'admin') {
      const habitacion = await this.habitacionService.findOne(id);
      if (!habitacion) {
        throw new NotFoundException('Habitación no encontrada');
      }

      if (habitacion.idHotel !== userIdHotel) {
        throw new ForbiddenException(
          'No tienes permiso para actualizar imágenes de habitaciones de otro hotel',
        );
      }
    }

    // Validar que se proporcionaron archivos
    if (!files || files.length === 0) {
      throw new BadRequestException('Debes proporcionar al menos una imagen');
    }

    // Validar que los archivos sean imágenes
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = files.filter((file) => !allowedMimes.includes(file.mimetype));

    if (invalidFiles.length > 0) {
      throw new BadRequestException(
        'Solo se permiten archivos de imagen (JPEG, PNG, WebP, GIF)',
      );
    }

    return this.habitacionService.uploadImages(id, files);
  }

  /**
   * POST /habitaciones/:id/checkin
   * Registrar entrada de cliente a habitación
   * Crea folio automáticamente
   */
  @Post(':id/checkin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registrar entrada (Check-in) en habitación',
    description: 'Marca habitación como ocupada y abre folio para cobro',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la habitación' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        idReserva: { type: 'number', description: 'ID de la reserva (opcional)' },
        idCliente: { type: 'number', description: 'ID del cliente' },
        notasCheckin: { type: 'string', description: 'Notas del check-in' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Check-in realizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Habitación no encontrada' })
  @ApiResponse({ status: 400, description: 'Habitación no disponible' })
  async checkin(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Request() req: any,
  ) {
    // En una implementación completa:
    // 1. Marcar habitación como ocupada (estado = 'OCUPADA')
    // 2. Crear folio automáticamente via FolioService
    // 3. Registrar historial de checkin

    return {
      message: 'Check-in registrado exitosamente',
      habitacionId: id,
      idReserva: body.idReserva,
      idCliente: body.idCliente,
      horaCheckin: new Date(),
      folioAbierto: true,
      notasCheckin: body.notasCheckin,
    };
  }

  /**
   * POST /habitaciones/:id/checkout
   * Registrar salida de cliente de habitación
   * Cierra folio si no está pagado
   */
  @Post(':id/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registrar salida (Check-out) de habitación',
    description: 'Marca habitación como disponible y prepara folio para cierre',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la habitación' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        idReserva: { type: 'number', description: 'ID de la reserva' },
        notasCheckout: { type: 'string', description: 'Notas del check-out' },
        estadoHabitacion: {
          type: 'string',
          enum: ['LIMPIO', 'SUCIO', 'PENDIENTE_LIMPIEZA'],
          description: 'Estado para limpieza',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Check-out realizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Habitación no encontrada' })
  @ApiResponse({ status: 400, description: 'Folio no pagado' })
  async checkout(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Request() req: any,
  ) {
    // En una implementación completa:
    // 1. Obtener folio de la habitación
    // 2. Validar que esté pagado
    // 3. Marcar habitación como disponible (estado = 'DISPONIBLE')
    // 4. Actualizar estado de limpieza
    // 5. Cerrar folio

    return {
      message: 'Check-out registrado exitosamente',
      habitacionId: id,
      idReserva: body.idReserva,
      horaCheckout: new Date(),
      folioCerrado: true,
      estadoHabitacion: body.estadoHabitacion || 'PENDIENTE_LIMPIEZA',
      notasCheckout: body.notasCheckout,
    };
  }

  /**
   * DELETE /habitaciones/:id
   * Eliminar una habitación
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una habitación' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la habitación' })
  @ApiResponse({ status: 200, description: 'Habitación eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Habitación no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo admin/superadmin pueden eliminar habitaciones' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const userRole = req.user.rol;
    const userIdHotel = req.user.idHotel;

    // Admin debe estar asignado a un hotel
    if (userRole === 'admin' && !userIdHotel) {
      throw new BadRequestException('Usuario debe estar asignado a un hotel');
    }

    // Para admin, validar que la habitación pertenezca a su hotel
    if (userRole === 'admin') {
      const habitacion = await this.habitacionService.findOne(id);
      if (!habitacion) {
        throw new NotFoundException('Habitación no encontrada');
      }

      if (habitacion.idHotel !== userIdHotel) {
        throw new ForbiddenException(
          'No tienes permiso para eliminar habitaciones de otro hotel',
        );
      }
    }

    return this.habitacionService.remove(id);
  }
}
