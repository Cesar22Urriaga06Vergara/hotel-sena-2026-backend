import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from './entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';

@Injectable()
export class HotelService {
  constructor(
    @InjectRepository(Hotel)
    private hotelRepository: Repository<Hotel>,
  ) {}

  /**
   * Crear un nuevo hotel
   */
  async create(createHotelDto: CreateHotelDto): Promise<Hotel> {
    // Verificar si el hotel ya existe por NIT
    const existingHotel = await this.hotelRepository.findOne({
      where: { nit: createHotelDto.nit },
    });

    if (existingHotel) {
      throw new ConflictException('Ya existe un hotel con este NIT');
    }

    const hotel = this.hotelRepository.create(createHotelDto);
    return await this.hotelRepository.save(hotel);
  }

  /**
   * Obtener todos los hoteles
   */
  async findAll(): Promise<Hotel[]> {
    return await this.hotelRepository.find({
      order: { fechaRegistro: 'DESC' },
    });
  }

  /**
   * Obtener un hotel por ID
   */
  async findOne(id: number): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({
      where: { id },
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel con ID ${id} no encontrado`);
    }

    return hotel;
  }

  /**
   * Obtener un hotel por NIT
   */
  async findByNit(nit: string): Promise<Hotel | null> {
    return await this.hotelRepository.findOne({
      where: { nit },
    });
  }

  /**
   * Actualizar un hotel
   */
  async update(id: number, updateHotelDto: UpdateHotelDto): Promise<Hotel> {
    const hotel = await this.findOne(id);

    // Verificar si otro hotel tiene el mismo NIT
    if (updateHotelDto.nit && updateHotelDto.nit !== hotel.nit) {
      const existingHotel = await this.hotelRepository.findOne({
        where: { nit: updateHotelDto.nit },
      });
      if (existingHotel) {
        throw new ConflictException('Ya existe otro hotel con este NIT');
      }
    }

    Object.assign(hotel, updateHotelDto);
    return await this.hotelRepository.save(hotel);
  }

  /**
   * Eliminar un hotel
   */
  async remove(id: number): Promise<void> {
    const hotel = await this.findOne(id);
    await this.hotelRepository.remove(hotel);
  }
}
