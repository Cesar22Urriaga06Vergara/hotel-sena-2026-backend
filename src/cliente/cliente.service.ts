import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClienteService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  /**
   * Crear un nuevo cliente
   * El password debe llegar ya hasheado desde AuthService
   * El rol siempre se establece como 'cliente'
   */
  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    // Verificar si el cliente ya existe por email o cédula
    const existingCliente = await this.clienteRepository.findOne({
      where: [
        { email: createClienteDto.email },
        { cedula: createClienteDto.cedula },
      ],
    });

    if (existingCliente) {
      throw new ConflictException(
        'El cliente con este email o cédula ya existe',
      );
    }

    // Asegurar que el rol siempre es 'cliente'
    const cliente = this.clienteRepository.create({
      ...createClienteDto,
      rol: 'cliente',
    });
    return await this.clienteRepository.save(cliente);
  }

  /**
   * Obtener todos los clientes
   */
  async findAll(): Promise<Cliente[]> {
    return await this.clienteRepository.find();
  }

  /**
   * Obtener un cliente por ID
   */
  async findOne(id: number): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { id },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return cliente;
  }

  /**
   * Obtener un cliente por email (incluye password para login)
   * Usado en AuthService.login()
   */
  async findByEmail(email: string): Promise<Cliente | null> {
    return await this.clienteRepository
      .createQueryBuilder('cliente')
      .addSelect('cliente.password')
      .where('cliente.email = :email', { email })
      .getOne();
  }

  /**
   * Obtener un cliente por cédula
   */
  async findByCedula(cedula: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { cedula },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente con cédula ${cedula} no encontrado`);
    }

    return cliente;
  }

  /**
   * Actualizar un cliente
   */
  async update(
    id: number,
    updateClienteDto: UpdateClienteDto,
  ): Promise<Cliente> {
    const cliente = await this.findOne(id);
    
    // Si la contraseña está siendo actualizada, hashearla
    if (updateClienteDto.password) {
      updateClienteDto.password = await bcrypt.hash(updateClienteDto.password, 10);
    }
    
    Object.assign(cliente, updateClienteDto);
    return await this.clienteRepository.save(cliente);
  }

  /**
   * Eliminar un cliente
   */
  async remove(id: number): Promise<void> {
    const cliente = await this.findOne(id);
    await this.clienteRepository.remove(cliente);
  }

  /**
   * Buscar o crear cliente desde Google OAuth
   * Si existe por googleId → retorna
   * Si existe por email → vincula Google a la cuenta existente
   * Si no existe → crea cliente nuevo con authProvider='google'
   */
  async findOrCreateFromGoogle(profile: {
    googleId: string;
    email: string;
    nombre: string;
    apellido: string;
    photoUrl?: string;
  }): Promise<Cliente> {
    // 1. Buscar por googleId
    let cliente = await this.clienteRepository.findOne({
      where: { googleId: profile.googleId },
    });
    if (cliente) return cliente;

    // 2. Buscar por email (puede ser cuenta local existente)
    cliente = await this.clienteRepository.findOne({
      where: { email: profile.email },
    });
    if (cliente) {
      // Vincular Google a la cuenta existente
      cliente.googleId = profile.googleId;
      cliente.photoUrl = profile.photoUrl ?? cliente.photoUrl;
      cliente.authProvider = 'google';
      return await this.clienteRepository.save(cliente);
    }

    // 3. Crear cliente nuevo
    const nuevoCliente = this.clienteRepository.create({
      googleId: profile.googleId,
      nombre: profile.nombre,
      apellido: profile.apellido,
      email: profile.email,
      photoUrl: profile.photoUrl,
      authProvider: 'google',
      rol: 'cliente',
      // cedula NULL inicialmente para clientes de Google
      // password no se setea — Google OAuth no tiene password local
      cedula: `GOOGLE_${profile.googleId}`, // Generar cédula única para cumplir UNIQUE constraint
      password: '', // Password vacío — no se usará
    });
    return await this.clienteRepository.save(nuevoCliente);
  }
}
