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
}
