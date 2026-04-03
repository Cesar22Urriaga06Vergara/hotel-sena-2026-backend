import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Hotel } from '../hotel/entities/hotel.entity';
import { Empleado } from '../empleado/entities/empleado.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';
import { Servicio } from '../servicio/entities/servicio.entity';
import { Reserva } from '../reserva/entities/reserva.entity';
import { CategoriaServicio } from '../categoria-servicios/entities/categoria-servicio.entity';
import { HotelService } from '../hotel/hotel.service';

@Injectable()
export class SuperadminService {
  constructor(
    @InjectRepository(Hotel)
    private hotelRepository: Repository<Hotel>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(Habitacion)
    private habitacionRepository: Repository<Habitacion>,
    @InjectRepository(Servicio)
    private servicioRepository: Repository<Servicio>,
    @InjectRepository(Reserva)
    private reservaRepository: Repository<Reserva>,
    @InjectRepository(CategoriaServicio)
    private categoriaRepository: Repository<CategoriaServicio>,
    private readonly hotelService: HotelService,
  ) {}

  private async enrichHotel(hotel: Hotel) {
    const [empleadosActivos, habitacionesTotal] = await Promise.all([
      this.empleadoRepository.count({
        where: { id_hotel: hotel.id, estado: 'activo' },
      }),
      this.habitacionRepository.count({
        where: { idHotel: hotel.id },
      }),
    ]);
    return {
      ...hotel,
      empleadosActivos,
      habitacionesTotal,
    };
  }

  async getHoteles() {
    const hoteles = await this.hotelRepository.find({
      order: { fechaRegistro: 'DESC' },
    });
    return Promise.all(hoteles.map((h) => this.enrichHotel(h)));
  }

  async getHotel(id: number) {
    const hotel = await this.hotelService.findOne(id);
    return this.enrichHotel(hotel);
  }

  async crearHotel(data: {
    nombre: string;
    nit: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    pais?: string;
    estrellas?: number;
    descripcion?: string;
  }) {
    return this.hotelService.create(data);
  }

  async actualizarHotel(
    id: number,
    data: {
      nombre?: string;
      nit?: string;
      email?: string;
      telefono?: string;
      direccion?: string;
      ciudad?: string;
      pais?: string;
      estrellas?: number;
      descripcion?: string;
      estado?: 'activo' | 'suspendido';
    },
  ) {
    const hotel = await this.hotelService.update(id, data);
    return this.enrichHotel(hotel);
  }

  async suspenderHotel(id: number, razon: string) {
    const hotel = await this.hotelService.update(id, { estado: 'suspendido' } as any);
    return this.enrichHotel(hotel);
  }

  async reactivarHotel(id: number) {
    const hotel = await this.hotelService.update(id, { estado: 'activo' } as any);
    return this.enrichHotel(hotel);
  }

  async eliminarHotel(id: number) {
    return this.hotelService.remove(id);
  }

  async getMetricasPlataforma() {
    const [hotelesActivos, totalEmpleados, totalClientes, serviciosActivos, hoteles] =
      await Promise.all([
        this.hotelRepository.count({ where: { estado: 'activo' } }),
        this.empleadoRepository.count({ where: { estado: 'activo' } }),
        this.clienteRepository.count(),
        this.servicioRepository.count({ where: { activo: true } }),
        this.hotelRepository.find({ order: { fechaRegistro: 'DESC' } }),
      ]);

    const hotelGeneralData = await Promise.all(
      hoteles.map(async (hotel) => {
        const usuarios = await this.empleadoRepository.count({
          where: { id_hotel: hotel.id, estado: 'activo' },
        });
        return {
          nombre: hotel.nombre,
          usuarios,
          suscripcion: {
            plan: 'Standard',
            vencimiento: null,
          },
          estado: hotel.estado,
        };
      }),
    );

    return {
      hotelesActivos,
      usuariosTotales: totalEmpleados + totalClientes,
      serviciosActivos,
      ingresosSaaS: 0,
      hotelGeneral: hotelGeneralData,
    };
  }

  async getMetricasCrecimiento(periodo: 'mes' | 'trimestre' | 'año' = 'mes') {
    const ahora = new Date();
    let fechaInicio: Date;

    if (periodo === 'mes') {
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    } else if (periodo === 'trimestre') {
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth() - 3, 1);
    } else {
      fechaInicio = new Date(ahora.getFullYear(), 0, 1);
    }

    const [hotelesNuevos, empleadosNuevos, clientesNuevos, reservasPeriodo] = await Promise.all([
      this.hotelRepository.count({
        where: { createdAt: Between(fechaInicio, ahora) },
      }),
      this.empleadoRepository.count({
        where: { createdAt: Between(fechaInicio, ahora) },
      }),
      this.clienteRepository.count({
        where: { createdAt: Between(fechaInicio, ahora) },
      }),
      this.reservaRepository.count({
        where: { createdAt: Between(fechaInicio, ahora) },
      }),
    ]);

    const usuariosNuevos = empleadosNuevos + clientesNuevos;

    const totalHoteles = await this.hotelRepository.count();
    const tasaCrecimiento =
      totalHoteles > 0 ? Math.round((hotelesNuevos / totalHoteles) * 100) : 0;

    return {
      periodo,
      hotelesNuevos,
      usuariosNuevos,
      tasaCrecimiento,
      ingresoPromedio: 0,
      reservasPeriodo,
      datos: [],
    };
  }

  async getCategorias(idHotel?: number) {
    const where: any = {};
    if (idHotel) where.idHotel = idHotel;
    return this.categoriaRepository.find({ where, order: { nombre: 'ASC' } });
  }

  async crearCategoria(data: {
    idHotel: number;
    nombre: string;
    descripcion?: string;
    codigo: string;
    activa?: boolean;
  }) {
    const categoria = this.categoriaRepository.create({
      ...data,
      activa: data.activa ?? true,
    });
    return this.categoriaRepository.save(categoria);
  }

  async actualizarCategoria(
    id: number,
    data: { nombre?: string; descripcion?: string; activa?: boolean },
  ) {
    const categoria = await this.categoriaRepository.findOne({ where: { id } });
    if (!categoria) throw new NotFoundException(`Categoría ${id} no encontrada`);
    Object.assign(categoria, data);
    return this.categoriaRepository.save(categoria);
  }

  async eliminarCategoria(id: number) {
    const categoria = await this.categoriaRepository.findOne({ where: { id } });
    if (!categoria) throw new NotFoundException(`Categoría ${id} no encontrada`);
    await this.categoriaRepository.remove(categoria);
    return { message: 'Categoría eliminada' };
  }
}
