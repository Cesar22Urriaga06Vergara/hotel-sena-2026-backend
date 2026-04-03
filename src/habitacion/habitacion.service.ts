import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habitacion } from './entities/habitacion.entity';
import { CreateHabitacionDto } from './dto/create-habitacion.dto';
import { UpdateHabitacionDto } from './dto/update-habitacion.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class HabitacionService {
  constructor(
    @InjectRepository(Habitacion)
    private habitacionRepository: Repository<Habitacion>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private normalizarImagenes(habitacion: Habitacion): Habitacion {
    const imagenesUrls = (habitacion.imagenes || '')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    (habitacion as Habitacion & { imagenesUrls: string[] }).imagenesUrls = imagenesUrls;
    return habitacion;
  }

  private normalizarImagenesLista(habitaciones: Habitacion[]): Habitacion[] {
    return habitaciones.map((habitacion) => this.normalizarImagenes(habitacion));
  }

  async create(
    createHabitacionDto: CreateHabitacionDto,
  ): Promise<Habitacion> {
    const habitacion = this.habitacionRepository.create({
      ...createHabitacionDto,
      estado: createHabitacionDto.estado || 'disponible',
    });
    const creada = await this.habitacionRepository.save(habitacion);
    return this.normalizarImagenes(creada);
  }

  async findAll(): Promise<Habitacion[]> {
    const habitaciones = await this.habitacionRepository.find({
      relations: ['tipoHabitacion', 'tipoHabitacion.amenidades'],
      order: { numeroHabitacion: 'ASC' },
    });

    return this.normalizarImagenesLista(habitaciones);
  }

  async findByHotel(idHotel: number, soloDisponibles: boolean = false): Promise<Habitacion[]> {
    const whereCondition: any = { idHotel };
    if (soloDisponibles) {
      whereCondition.estado = 'disponible';
    }
    const habitaciones = await this.habitacionRepository.find({
      where: whereCondition,
      relations: ['tipoHabitacion', 'tipoHabitacion.amenidades'],
      order: { numeroHabitacion: 'ASC' },
    });

    return this.normalizarImagenesLista(habitaciones);
  }

  async findByTipo(idTipoHabitacion: number): Promise<Habitacion[]> {
    const habitaciones = await this.habitacionRepository.find({
      where: { idTipoHabitacion },
      relations: ['tipoHabitacion', 'tipoHabitacion.amenidades'],
      order: { numeroHabitacion: 'ASC' },
    });

    return this.normalizarImagenesLista(habitaciones);
  }

  async findOne(id: number): Promise<Habitacion> {
    const habitacion = await this.habitacionRepository.findOne({
      where: { id },
      relations: ['tipoHabitacion', 'tipoHabitacion.amenidades'],
    });
    
    if (!habitacion) {
      throw new NotFoundException(`Habitación con ID ${id} no encontrada`);
    }
    
    return this.normalizarImagenes(habitacion);
  }

  async update(id: number, updateHabitacionDto: UpdateHabitacionDto): Promise<Habitacion> {
    const habitacion = await this.findOne(id);
    Object.assign(habitacion, updateHabitacionDto);
    habitacion.fechaActualizacion = new Date();
    const actualizada = await this.habitacionRepository.save(habitacion);
    return this.normalizarImagenes(actualizada);
  }

  async remove(id: number): Promise<void> {
    const habitacion = await this.findOne(id);
    await this.habitacionRepository.remove(habitacion);
  }

  /**
   * Subir o actualizar imágenes de una habitación existente
   * Las imágenes se aplican a TODAS las habitaciones del mismo tipo
   */
  async uploadImages(
    id: number,
    files: Express.Multer.File[],
  ): Promise<Habitacion> {
    // Verificar que la habitación existe
    const habitacion = await this.findOne(id);

    if (!files || files.length === 0) {
      throw new BadRequestException('Debes proporcionar al menos una imagen');
    }

    try {
      // Subir imágenes a Cloudinary
      const imageUrls = await this.cloudinaryService.uploadMultipleImages(
        files,
      );

      // Obtener todas las habitaciones del mismo tipo
      const habitacionesDelTipo = await this.findByTipo(habitacion.idTipoHabitacion);

      // Actualizar TODAS las habitaciones del mismo tipo con las nuevas imágenes
      for (const hab of habitacionesDelTipo) {
        // Si ya hay imágenes, agregarlas (si no, solo guardar las nuevas)
        const existingImages = hab.imagenes ? hab.imagenes.split(',').filter(url => url.trim()) : [];
        const allImages = [...existingImages, ...imageUrls];
        
        // Actualizar habitación con las URLs
        hab.imagenes = allImages.join(',');
        hab.fechaActualizacion = new Date();
        await this.habitacionRepository.save(hab);
      }

      // Retornar la habitación original actualizada
      return await this.findOne(id);
    } catch (error) {
      throw new BadRequestException(
        `Error al subir imágenes: ${error.message}`,
      );
    }
  }
}
