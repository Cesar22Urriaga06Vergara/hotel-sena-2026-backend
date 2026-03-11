import { Controller, Get, UseGuards, Delete, Post, Param, ParseIntPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard, Roles } from './guards/roles.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Usuarios')
@Controller('users')
export class UsuariosController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /users
   * Obtener todos los usuarios del sistema
   * Requiere autenticación JWT y rol admin
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['admin', 'superadmin'])
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los usuarios (Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para esta acción' })
  async getUsers() {
    const result = await this.authService.getAllUsers();
    return {
      message: 'Usuarios obtenidos exitosamente',
      users: result.users,
      count: result.count,
    };
  }

  /**
   * DELETE /users/:id
   * Desactivar un usuario
   * Requiere autenticación JWT y rol admin
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['admin', 'superadmin'])
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    const result = await this.authService.deactivateUser(id);
    return {
      message: 'Usuario desactivado exitosamente',
      user: result,
    };
  }

  /**
   * POST /users/:id/reactivate
   * Reactivar un usuario desactivado
   * Requiere autenticación JWT y rol admin
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['admin', 'superadmin'])
  @Post(':id/reactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario reactivado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async reactivateUser(@Param('id', ParseIntPipe) id: number) {
    const result = await this.authService.reactivateUser(id);
    return {
      message: 'Usuario reactivado exitosamente',
      user: result,
    };
  }
}
