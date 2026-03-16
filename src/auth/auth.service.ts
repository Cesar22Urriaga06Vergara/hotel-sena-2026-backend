import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ClienteService } from '../cliente/cliente.service';
import { EmpleadoService } from '../empleado/empleado.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateSuperadminDto } from './dto/create-superadmin.dto';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly clienteService: ClienteService,
    private readonly empleadoService: EmpleadoService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registrar un nuevo cliente
   * RESTRICCIÓN: Este endpoint SOLO crea clientes
   * - El rol siempre es 'cliente'
   * - Los empleados se crean únicamente por el admin mediante POST /empleados
   */
  async register(registerDto: RegisterDto) {
    try {
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const cliente = await this.clienteService.create({
        nombre: registerDto.nombre,
        apellido: registerDto.apellido,
        email: registerDto.email,
        password: hashedPassword,
        rol: 'cliente', // Asegurar que el rol siempre es 'cliente'
      });

      const token = this.generateToken(cliente.id, cliente.email, 'cliente', 1, cliente.id);

      return {
        message: 'Registro exitoso como cliente',
        user: {
          id: cliente.id,
          fullName: `${cliente.nombre} ${cliente.apellido}`,
          email: cliente.email,
          role: 'cliente',
          isActive: true,
        },
        token,
        refreshToken: null,
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('El email o cédula ya está registrado');
      }
      throw error;
    }
  }

  /**
   * Login de usuario
   * Busca primero en Cliente, luego en Empleado
   * Retorna token JWT diferenciado por rol
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Intenta buscar en Cliente
    let cliente = await this.clienteService.findByEmail(email);
    if (cliente) {
      const isPasswordValid = await bcrypt.compare(password, cliente.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const token = this.generateToken(cliente.id, cliente.email, 'cliente', 1, cliente.id);
      return {
        user: {
          id: cliente.id,
          fullName: `${cliente.nombre} ${cliente.apellido}`,
          email: cliente.email,
          role: 'cliente',
          isActive: true,
          idCliente: cliente.id,
          idHotel: 1,
        },
        token,
        refreshToken: null,
      };
    }

    // Intenta buscar en Empleado
    let empleado = await this.empleadoService.findByEmail(email);
    if (empleado) {
      const isPasswordValid = await bcrypt.compare(password, empleado.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // El rol del empleado: 'recepcionista', 'admin', etc.
      const token = this.generateToken(
        empleado.id,
        empleado.email,
        empleado.rol,
        empleado.id_hotel,
        undefined,
        empleado.id,
      );
      return {
        user: {
          id: empleado.id,
          fullName: `${empleado.nombre} ${empleado.apellido}`,
          email: empleado.email,
          role: empleado.rol.toLowerCase(),
          isActive: true,
          idEmpleado: empleado.id,
          idHotel: empleado.id_hotel,
        },
        token,
        refreshToken: null,
      };
    }

    // Si no se encuentra en ninguna tabla
    throw new UnauthorizedException('Credenciales inválidas');
  }

  /**
   * Generar token JWT
   * Crea un token con el payload especificado
   */
  private generateToken(
    userId: number,
    email: string,
    rol: string,
    idHotel?: number,
    idCliente?: number,
    idEmpleado?: number,
  ): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
      rol,
    };

    if (idHotel !== undefined) {
      payload.idHotel = idHotel;
    }
    if (idCliente !== undefined) {
      payload.idCliente = idCliente;
    }
    if (idEmpleado !== undefined) {
      payload.idEmpleado = idEmpleado;
    }

    return this.jwtService.sign(payload);
  }

  /**
   * Validar token y retornar información del payload
   */
  async validateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  /**
   * Actualizar perfil del usuario autenticado
   */
  async updateProfile(userId: number, rol: string, fullName: string) {
    // Dividir el nombre en nombre y apellido
    const parts = fullName.trim().split(' ');
    const nombre = parts[0];
    const apellido = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];

    if (rol.toLowerCase() === 'cliente') {
      // Actualizar cliente
      return await this.clienteService.update(userId, {
        nombre,
        apellido,
      });
    } else {
      // Actualizar empleado (recepcionista, admin, superadmin)
      return await this.empleadoService.update(userId, {
        nombre,
        apellido,
      });
    }
  }

  /**
   * Completar perfil del cliente (datos adicionales)
   * Agrega cédula, teléfono, tipo de documento al cliente
   */
  async completeClientProfile(
    clienteId: number,
    cedula: string,
    tipoDocumento?: string,
    telefono?: string,
  ) {
    return await this.clienteService.update(clienteId, {
      cedula,
      tipoDocumento: tipoDocumento || 'CC',
      telefono,
    });
  }

  /**
   * Registrar el PRIMER SuperAdmin (Bootstrap - sin autenticación)
   * Este método solo funciona si NO existen superadmins en el sistema
   * Una vez creado el primero, todos los demás empleados se crean mediante POST /empleados
   */
  async registerFirstSuperadmin(createSuperadminDto: CreateSuperadminDto) {
    try {
      // Verificar que no exista ningún superadmin
      const superadmins = await this.empleadoService.findAll();
      const existeSuperadmin = superadmins.some(emp => emp.rol === 'superadmin');

      if (existeSuperadmin) {
        throw new BadRequestException(
          'Ya existe un SuperAdmin en el sistema. Use POST /empleados (autenticado) para crear más empleados.'
        );
      }

      // Verificar que la cédula y email no existan
      const empleadoExistente = await this.empleadoService.findByEmail(createSuperadminDto.email);
      if (empleadoExistente) {
        throw new ConflictException('El email ya está registrado');
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(createSuperadminDto.password, 10);

      // Crear el superadmin (sin id_hotel)
      const superadmin = await this.empleadoService.create({
        cedula: createSuperadminDto.cedula,
        nombre: createSuperadminDto.nombre,
        apellido: createSuperadminDto.apellido,
        email: createSuperadminDto.email,
        password: hashedPassword,
        rol: 'superadmin',
        id_hotel: undefined, // SuperAdmin no pertenece a un hotel específico
        estado: 'activo',
      });

      // Generar token JWT
      const token = this.generateToken(
        superadmin.id,
        superadmin.email,
        'superadmin',
        undefined,
        undefined,
        superadmin.id
      );

      return {
        message: 'SuperAdmin creado exitosamente. ¡Bienvenido al sistema!',
        user: {
          id: superadmin.id,
          fullName: `${superadmin.nombre} ${superadmin.apellido}`,
          email: superadmin.email,
          role: 'superadmin',
          isActive: true,
          idEmpleado: superadmin.id,
          idHotel: null,
        },
        token,
        refreshToken: null,
      };
    } catch (error) {
      // Re-lanzar errores específicos
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      // Manejo de errores de duplicado
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('El email o cédula ya está registrado');
      }
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios del sistema
   * Combina clientes y empleados
   */
  async getAllUsers() {
    const clientes = await this.clienteService.findAll();
    const empleados = await this.empleadoService.findAll();

    // Mapear clientes a formato User
    const clientesFormateados = clientes.map(cliente => ({
      _id: cliente.id.toString(),
      id: cliente.id,
      name: `${cliente.nombre} ${cliente.apellido}`,
      fullName: `${cliente.nombre} ${cliente.apellido}`,
      email: cliente.email,
      role: cliente.rol.toLowerCase(),
      isActive: true,
      idCliente: cliente.id,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
    }));

    // Mapear empleados a formato User
    const empleadosFormateados = empleados.map(empleado => ({
      _id: empleado.id.toString(),
      id: empleado.id,
      name: `${empleado.nombre} ${empleado.apellido}`,
      fullName: `${empleado.nombre} ${empleado.apellido}`,
      email: empleado.email,
      role: empleado.rol.toLowerCase(),
      isActive: empleado.estado === 'activo',
      idEmpleado: empleado.id,
      idHotel: empleado.id_hotel,
      createdAt: empleado.createdAt,
      updatedAt: empleado.updatedAt,
    }));

    // Combinar y ordenar por fecha de creación descendente
    const todosLosUsuarios = [...clientesFormateados, ...empleadosFormateados].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      users: todosLosUsuarios,
      count: todosLosUsuarios.length,
    };
  }

  /**
   * Desactivar un usuario (empleado)
   * Los clientes no pueden ser desactivados de esta forma
   */
  async deactivateUser(userId: number) {
    const empleado = await this.empleadoService.findById(userId);
    const updated = await this.empleadoService.update(userId, {
      estado: 'inactivo',
    });

    return {
      _id: updated.id.toString(),
      id: updated.id,
      name: `${updated.nombre} ${updated.apellido}`,
      fullName: `${updated.nombre} ${updated.apellido}`,
      email: updated.email,
      role: updated.rol.toLowerCase(),
      isActive: updated.estado === 'activo',
      idEmpleado: updated.id,
      idHotel: updated.id_hotel,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Reactivar un usuario (empleado)
   */
  async reactivateUser(userId: number) {
    const empleado = await this.empleadoService.findById(userId);
    const updated = await this.empleadoService.update(userId, {
      estado: 'activo',
    });

    return {
      _id: updated.id.toString(),
      id: updated.id,
      name: `${updated.nombre} ${updated.apellido}`,
      fullName: `${updated.nombre} ${updated.apellido}`,
      email: updated.email,
      role: updated.rol.toLowerCase(),
      isActive: updated.estado === 'activo',
      idEmpleado: updated.id,
      idHotel: updated.id_hotel,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Login via Google OAuth
   * Recibe el cliente ya creado/encontrado por GoogleStrategy validate()
   * Genera el mismo JWT que el login normal
   */
  async googleLogin(cliente: any) {
    const token = this.generateToken(
      cliente.id,
      cliente.email,
      'cliente',
      1, // idHotel default
      cliente.id, // idCliente
    );

    return {
      user: {
        id: cliente.id,
        fullName: `${cliente.nombre} ${cliente.apellido}`,
        email: cliente.email,
        role: 'cliente',
        isActive: true,
        photoUrl: cliente.photoUrl,
        idCliente: cliente.id,
        idHotel: 1,
      },
      token,
      refreshToken: null,
    };
  }
}
