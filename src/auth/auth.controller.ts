import { Controller, Post, Body, Get, UseGuards, Request, Put, ForbiddenException, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateSuperadminDto } from './dto/create-superadmin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Registrar un nuevo cliente (RUTA PÚBLICA)
   * 
   * RESTRICCIÓN IMPORTANTE:
   * - Este endpoint es SOLO para registro de clientes
   * - El rol se asigna automáticamente como 'cliente'
   * - Los empleados (admin, recepcionista) son creados por el administrador
   *   mediante POST /empleados (ruta protegida)
   * - Cualquier campo 'rol' en el body es ignorado
   */
  @Post('register')
  @ApiOperation({ 
    summary: 'Registro de clientes',
    description: 'Ruta pública para registro de nuevos clientes. Quien se registre aquí obtendrá rol de cliente automáticamente. Los empleados son creados únicamente por el administrador.' 
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Cliente registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Email o cédula ya registrados, o datos inválidos' })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  /**
   * POST /auth/login
   * Iniciar sesión
   */
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  /**
   * POST /auth/register-superadmin
   * Crear el PRIMER SuperAdmin (BOOTSTRAP - sin autenticación)
   * 
   * IMPORTANTE:
   * - Este endpoint es PÚBLICO pero solo funciona si NO existen superadmins
   * - Se usa una única vez para crear el primer usuario administrador del sistema
   * - Después de esto, todos los demás empleados se crean mediante POST /empleados (autenticado, protegido)
   * - Una vez creado el primer superadmin, este endpoint rechazará intentos posteriores
   */
  @Post('register-superadmin')
  @ApiOperation({
    summary: 'Crear el primer SuperAdmin (BOOTSTRAP)',
    description: 'Endpoint público para bootstrap inicial. Solo funciona si no existen SuperAdmins en el sistema.'
  })
  @ApiBody({ type: CreateSuperadminDto })
  @ApiResponse({ status: 201, description: 'SuperAdmin creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Ya existe un SuperAdmin en el sistema' })
  @ApiResponse({ status: 409, description: 'Email o cédula ya registrados' })
  async registerFirstSuperadmin(@Body() createSuperadminDto: CreateSuperadminDto) {
    return await this.authService.registerFirstSuperadmin(createSuperadminDto);
  }

  /**
   * GET /auth/profile
   * Obtener perfil del usuario autenticado
   * Ruta protegida con JWT
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getProfile(@Request() req) {
    // req.user contiene la información del usuario autenticado
    return {
      message: 'Perfil obtenido exitosamente',
      user: req.user,
    };
  }

  /**
   * PUT /auth/me
   * Actualizar perfil del usuario autenticado
   * Ruta protegida con JWT
   */
  @UseGuards(JwtAuthGuard)
  @Put('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar el perfil del usuario autenticado' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const userId = req.user.sub;
    const rol = req.user.rol;

    const updated = await this.authService.updateProfile(userId, rol, updateProfileDto.name);

    return {
      message: 'Perfil actualizado exitosamente',
      user: {
        id: updated.id,
        fullName: updated.nombre && updated.apellido 
          ? `${updated.nombre} ${updated.apellido}` 
          : updated.nombre,
        email: updated.email,
        role: rol.toLowerCase(),
        isActive: true,
      },
    };
  }

  /**
   * PUT /auth/me/complete-profile
   * Completar perfil del cliente con datos adicionales
   * Ruta protegida con JWT - Solo para clientes
   */
  @UseGuards(JwtAuthGuard)
  @Put('me/complete-profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Completar perfil del cliente con datos adicionales' })
  @ApiBody({ type: CompleteProfileDto })
  @ApiResponse({ status: 200, description: 'Perfil completado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Solo clientes pueden completar el perfil' })
  async completeProfile(
    @Request() req,
    @Body() completeProfileDto: CompleteProfileDto,
  ) {
    const userId = req.user.sub;
    const rol = req.user.rol;

    // Solo clientes pueden completar su perfil
    if (rol.toLowerCase() !== 'cliente') {
      throw new ForbiddenException('Solo los clientes pueden completar su perfil con datos adicionales');
    }

    const updated = await this.authService.completeClientProfile(
      userId,
      completeProfileDto.cedula,
      completeProfileDto.tipoDocumento,
      completeProfileDto.telefono,
    );

    return {
      message: 'Perfil completado exitosamente',
      user: {
        id: updated.id,
        fullName: `${updated.nombre} ${updated.apellido}`,
        email: updated.email,
        cedula: updated.cedula,
        tipoDocumento: updated.tipoDocumento,
        telefono: updated.telefono,
        role: 'cliente',
        isActive: true,
      },
    };
  }

  /**
   * POST /auth/logout
   * Cerrar sesión del usuario
   * Ruta protegida con JWT
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión del usuario' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  logout(@Request() req) {
    // En JWT stateless, el logout se maneja en el cliente eliminando el token
    return {
      message: 'Sesión cerrada exitosamente',
      user: req.user.email,
    };
  }

  /**
   * GET /auth/google
   * Iniciar flujo OAuth con Google
   * Redirige al consentimiento de Google
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Iniciar login con Google (redirige a Google)' })
  async googleAuth() {
    // Passport redirige automáticamente a Google
    // Este handler nunca se ejecuta directamente
  }

  /**
   * GET /auth/google/callback
   * Google redirige aquí tras el consentimiento del usuario
   * Recupera el cliente encontrado/creado por GoogleStrategy
   * Genera JWT y redirige al frontend con el token
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Callback de Google OAuth' })
  async googleAuthCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);

    // Redirigir al frontend con el token como query param
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${result.token}`;

    return res.redirect(redirectUrl);
  }
}