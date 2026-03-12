import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { EmpleadoService } from './empleado.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { Empleado } from './entities/empleado.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('empleados')
@Controller('empleados')
export class EmpleadoController {
  constructor(private empleadoService: EmpleadoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo empleado (solo superadmin o admin)' })
  @ApiResponse({ status: 201, description: 'Empleado creado exitosamente' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para esta acción' })
  create(@Body() createEmpleadoDto: CreateEmpleadoDto): Promise<Empleado> {
    return this.empleadoService.create(createEmpleadoDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'recepcionista')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los empleados' })
  @ApiResponse({ status: 200, description: 'Lista de empleados' })
  findAll(): Promise<Empleado[]> {
    return this.empleadoService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin', 'recepcionista')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener empleado por ID' })
  @ApiResponse({ status: 200, description: 'Empleado encontrado' })
  findById(@Param('id', ParseIntPipe) id: number): Promise<Empleado> {
    return this.empleadoService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar empleado' })
  @ApiResponse({ status: 200, description: 'Empleado actualizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmpleadoDto: UpdateEmpleadoDto,
  ): Promise<Empleado> {
    return this.empleadoService.update(id, updateEmpleadoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar empleado' })
  @ApiResponse({ status: 200, description: 'Empleado eliminado' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.empleadoService.remove(id);
  }
}


