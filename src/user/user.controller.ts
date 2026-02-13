import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * POST /users
   * Crear un nuevo usuario
   */
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  /**
   * GET /users
   * Obtener todos los usuarios
   */
  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    return {
      message: 'Usuarios obtenidos exitosamente',
      users,
      count: users.length,
    };
  }

  /**
   * GET /users/:id
   * Obtener un usuario por ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findOne(id);
    return {
      message: 'Usuario obtenido exitosamente',
      user,
    };
  }

  /**
   * PATCH /users/:id
   * Actualizar un usuario
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.userService.update(id, updateUserDto);
    return {
      message: 'Usuario actualizado exitosamente',
      user,
    };
  }

  /**
   * DELETE /users/:id
   * Eliminar un usuario
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.userService.remove(id);
    return {
      message: 'Usuario eliminado exitosamente',
    };
  }
}