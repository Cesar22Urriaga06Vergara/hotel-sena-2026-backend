import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folio, Cargo } from './entities/folio.entity';
import { CreateFolioDto, AgregarCargoDto, CobrarFolioDto } from './dto/folio.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FolioService {
  constructor(
    @InjectRepository(Folio)
    private folioRepository: Repository<Folio>,
  ) {}

  /**
   * Crear un nuevo folio para una habitación
   * Se abre automáticamente en checkin
   */
  async crearFolio(idHabitacion: number, idReserva?: number, registradoPor?: number): Promise<Folio> {
    // Verificar si ya existe un folio activo
    const folioExistente = await this.folioRepository.findOne({
      where: {
        idHabitacion,
        estadoPago: 'ACTIVO',
      },
    });

    if (folioExistente) {
      throw new BadRequestException(
        `Ya existe un folio activo para la habitación ${idHabitacion}`,
      );
    }

    const folio = this.folioRepository.create({
      idHabitacion,
      idReserva,
      registradoPor,
      estadoPago: 'ACTIVO',
      cargos: [],
      subtotal: 0,
      total: 0,
    });

    return await this.folioRepository.save(folio);
  }

  /**
   * Obtener folio activo o cerrado de una habitación
   */
  async obtenerFolio(idHabitacion: number): Promise<Folio> {
    const folio = await this.folioRepository.findOne({
      where: {
        idHabitacion,
      },
      order: {
        fechaApertura: 'DESC',
      },
    });

    if (!folio) {
      throw new NotFoundException(`No existe folio para la habitación ${idHabitacion}`);
    }

    return folio;
  }

  /**
   * Agregar un cargo al folio
   */
  async agregarCargo(
    idHabitacion: number,
    cargoDto: AgregarCargoDto,
    agregadoPor: string,
  ): Promise<Folio> {
    const folio = await this.obtenerFolio(idHabitacion);

    if (folio.estadoPago === 'PAGADO') {
      throw new ForbiddenException('No se puede agregar cargos a un folio pagado');
    }

    // Crear cargo con UUID único
    const nuevoCargo: Cargo = {
      idCargo: uuidv4(),
      descripcion: cargoDto.descripcion,
      cantidad: cargoDto.cantidad,
      precioUnitario: cargoDto.precioUnitario,
      monto: cargoDto.cantidad * cargoDto.precioUnitario,
      categoria: cargoDto.categoria,
      fechaAñadido: new Date(),
      agregadoPor,
    };

    // Agregar cargo al array
    folio.cargos.push(nuevoCargo);

    // Recalcular subtotal
    folio.subtotal = folio.cargos.reduce((sum, cargo) => sum + cargo.monto, 0);
    folio.total = folio.subtotal; // En versión simple, sin impuestos adicionales

    return await this.folioRepository.save(folio);
  }

  /**
   * Eliminar un cargo del folio
   */
  async eliminarCargo(idHabitacion: number, idCargo: string): Promise<Folio> {
    const folio = await this.obtenerFolio(idHabitacion);

    if (folio.estadoPago === 'PAGADO') {
      throw new ForbiddenException('No se puede eliminar cargos de un folio pagado');
    }

    // Filtrar el cargo eliminado
    folio.cargos = folio.cargos.filter((c) => c.idCargo !== idCargo);

    // Recalcular subtotal
    folio.subtotal = folio.cargos.reduce((sum, cargo) => sum + cargo.monto, 0);
    folio.total = folio.subtotal;

    return await this.folioRepository.save(folio);
  }

  /**
   * Cerrar folio (prepare for checkout)
   * Marca como CERRADO pero no pagado aún
   */
  async cerrarFolio(idHabitacion: number): Promise<Folio> {
    const folio = await this.obtenerFolio(idHabitacion);

    if (folio.estadoPago === 'PAGADO') {
      throw new ForbiddenException('El folio ya fue pagado');
    }

    folio.estadoPago = 'CERRADO';
    folio.fechaCierre = new Date();

    return await this.folioRepository.save(folio);
  }

  /**
   * Cobrar folio (registro de pago)
   * Marca como PAGADO
   */
  async cobrarFolio(
    idHabitacion: number,
    pagoDto: CobrarFolioDto,
  ): Promise<{ folio: Folio; pago: any }> {
    const folio = await this.obtenerFolio(idHabitacion);

    if (folio.estadoPago === 'PAGADO') {
      throw new ForbiddenException('El folio ya fue pagado');
    }

    // Validar que el monto sea suficiente
    if (pagoDto.monto < folio.total) {
      throw new BadRequestException(
        `Monto insuficiente. Total: ${folio.total}, Recibido: ${pagoDto.monto}`,
      );
    }

    folio.estadoPago = 'PAGADO';
    folio.fechaCierre = new Date();

    const folioActualizado = await this.folioRepository.save(folio);

    // En una versión completa, esto registraría en tabla pagos
    const pago = {
      idFolio: folio.id,
      monto: pagoDto.monto,
      vuelto: pagoDto.monto - folio.total,
      concepto: pagoDto.concepto || 'Pago de folio',
      referencia: pagoDto.referencia,
      fecha: new Date(),
    };

    return {
      folio: folioActualizado,
      pago,
    };
  }

  /**
   * Obtener resumen de folio (para mostrar en vista)
   */
  async obtenerResumenFolio(idHabitacion: number) {
    const folio = await this.obtenerFolio(idHabitacion);

    return {
      id: folio.id,
      idHabitacion: folio.idHabitacion,
      estadoPago: folio.estadoPago,
      cargos: folio.cargos.map((c) => ({
        idCargo: c.idCargo,
        descripcion: c.descripcion,
        monto: c.monto,
        categoria: c.categoria,
      })),
      subtotal: folio.subtotal,
      total: folio.total,
      fechaApertura: folio.fechaApertura,
      fechaCierre: folio.fechaCierre,
    };
  }
}
