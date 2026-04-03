import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Empleado } from './entities/empleado.entity';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';

@Injectable()
export class EmpleadoService {
  constructor(
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
  ) {}

  async create(createEmpleadoDto: CreateEmpleadoDto): Promise<Empleado> {
    // Verificar si el empleado ya existe por email o cédula
    const existingEmpleado = await this.empleadoRepository.findOne({
      where: [
        { email: createEmpleadoDto.email },
        { cedula: createEmpleadoDto.cedula },
      ],
    });

    if (existingEmpleado) {
      throw new ConflictException(
        'El empleado con este email o cédula ya existe',
      );
    }

    // Hashear la contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(createEmpleadoDto.password, 10);
    const empleado = this.empleadoRepository.create({
      ...createEmpleadoDto,
      password: hashedPassword,
    });
    return await this.empleadoRepository.save(empleado);
  }

  async findAll(): Promise<Empleado[]> {
    return await this.empleadoRepository.find();
  }

  async findAllByHotel(idHotel: number): Promise<Empleado[]> {
    return await this.empleadoRepository.find({
      where: { id_hotel: idHotel },
      order: { nombre: 'ASC', apellido: 'ASC' },
    });
  }

  async findById(id: number): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findOne({
      where: { id },
    });

    if (!empleado) {
      throw new NotFoundException(`Empleado con id ${id} no encontrado`);
    }

    return empleado;
  }

  async findByEmail(email: string): Promise<Empleado | null> {
    return await this.empleadoRepository
      .createQueryBuilder('empleado')
      .addSelect('empleado.password')
      .where('empleado.email = :email', { email })
      .getOne();
  }

  async findByCedula(cedula: string): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findOne({
      where: { cedula },
    });

    if (!empleado) {
      throw new NotFoundException(
        `Empleado con cédula ${cedula} no encontrado`,
      );
    }

    return empleado;
  }

  async update(
    id: number,
    updateEmpleadoDto: UpdateEmpleadoDto,
  ): Promise<Empleado> {
    const empleado = await this.findById(id);

    // Si la contraseña está siendo actualizada, hashearla
    if (updateEmpleadoDto.password) {
      updateEmpleadoDto.password = await bcrypt.hash(updateEmpleadoDto.password, 10);
    }

    Object.assign(empleado, updateEmpleadoDto);
    return await this.empleadoRepository.save(empleado);
  }

  async remove(id: number): Promise<void> {
    const empleado = await this.findById(id);
    await this.empleadoRepository.remove(empleado);
  }
}
