import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { FacturaService } from '../factura/factura.service';
import { MedioPagoService } from '../medio-pago/medio-pago.service';

@Injectable()
export class PagoService {
  constructor(
    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,
    private facturaService: FacturaService,
    private medioPagoService: MedioPagoService,
    private dataSource: DataSource,
  ) {}

  /**
   * Registrar un pago para una factura
   * Valida:
   *  - Que la factura exista y no esté anulada
   *  - Que el medio de pago exista
   *  - Que si requiere referencia, sea proporcionada
   *  - Si es efectivo: que montoRecibido >= monto (cambio no negativo)
   *  - Que el monto pagado + pagos anteriores no exceda el total de la factura
   * Recalcula el estado de la factura basado en el total pagado
   */
  async registrarPago(
    dto: CreatePagoDto,
    idEmpleado?: number,
  ): Promise<Pago> {
    // Verificar que la factura exista y no esté anulada
    const factura = await this.facturaService.findOne(dto.idFactura);

    if (factura.estado === 'anulada') {
      throw new BadRequestException('No se puede registrar pago en factura anulada');
    }

    // Verificar que el monto es positivo
    if (dto.montoCobrar <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }

    // Verificar que el medio de pago existe
    const medioPago = await this.medioPagoService.findOne(dto.idMedioPago);

    // Validar que si el medio requiere referencia, sea proporcionada
    if (medioPago.requiereReferencia && !dto.referenciaPago) {
      throw new BadRequestException(
        `El medio de pago "${medioPago.nombre}" requiere número de referencia`,
      );
    }

    // Validar que no se pague más del total de la factura
    const pagosCompletados = await this.pagoRepository.find({
      where: { idFactura: dto.idFactura, estado: 'completado' },
    });

    const totalPagoPrevio = pagosCompletados.reduce(
      (sum, p) => sum + Number(p.monto),
      0,
    );

    const totalPagoNuevo = totalPagoPrevio + dto.montoCobrar;
    const totalFactura = Number(factura.total);

    if (totalPagoNuevo > totalFactura) {
      throw new BadRequestException(
        `El monto especificado ($${dto.montoCobrar}) sumado a pagos previos ($${totalPagoPrevio}) excede el total de la factura ($${totalFactura}). Máximo permitido: $${totalFactura - totalPagoPrevio}`,
      );
    }

    // Validaciones específicas para efectivo
    let cambioDevuelto = 0;
    if (medioPago.nombre === 'efectivo') {
      if (!dto.montoRecibido || dto.montoRecibido < 0) {
        throw new BadRequestException(
          'Para pagos en efectivo, debe especificar el monto recibido',
        );
      }

      if (dto.montoRecibido < dto.montoCobrar) {
        throw new BadRequestException(
          `Efectivo insuficiente. Total: $${dto.montoCobrar}, Recibido: $${dto.montoRecibido}`,
        );
      }

      cambioDevuelto = Number((dto.montoRecibido - dto.montoCobrar).toFixed(2));
    }

    // Crear y guardar el pago
    const pagoBd = await this.pagoRepository.save({
      idFactura: dto.idFactura,
      idMedioPago: dto.idMedioPago,
      monto: dto.montoCobrar,
      montoRecibido: dto.montoRecibido || null,
      cambioDevuelto,
      referenciaPago: dto.referenciaPago || null,
      idEmpleadoRegistro: idEmpleado || null,
      estado: 'completado',
      observaciones: dto.observaciones || null,
    } as any);

    // Recalcular y actualizar estado de la factura según total pagado
    if (totalPagoNuevo >= totalFactura && factura.estado !== 'pagada') {
      const estadoAnterior = factura.estadoFactura || 'EMITIDA';
      // FASE 7: Sincronizar AMBOS campos (legacy + nuevo)
      factura.estado = 'pagada';
      factura.estadoFactura = 'PAGADA';
      await this.facturaService['facturaRepository'].save(factura);

      // FASE 7: Registrar cambio en auditoría
      try {
        const FacturaCambiosRepo = this.dataSource.getRepository('FacturaCambio');
        await FacturaCambiosRepo.save({
          idFactura: dto.idFactura,
          usuarioId: idEmpleado || null,
          tipoCambio: 'CAMBIO_ESTADO',
          descripcion: `Pago aplicado - Factura pagada. Monto: $${dto.montoCobrar}. Total pagado: $${totalPagoNuevo}`,
          valorAnterior: JSON.stringify({ estado: factura.estado, estadoFactura: estadoAnterior }),
          valorNuevo: JSON.stringify({ estado: 'pagada', estadoFactura: 'PAGADA' }),
        });
      } catch (error) {
        console.warn('Error registrando cambio en auditoría:', error.message);
      }
    } else if (totalPagoNuevo > 0 && totalPagoNuevo < totalFactura && factura.estado !== 'parcialmente_pagada') {
      // Nuevo: Estado de pago intermedio cuando hay pago parcial
      const estadoAnterior = factura.estadoFactura || 'EMITIDA';
      factura.estado = 'parcialmente_pagada';
      factura.estadoFactura = 'PAGADA'; // FASE 7: Marcar como PAGADA (parcial) en nuevo enum
      await this.facturaService['facturaRepository'].save(factura);

      // FASE 7: Registrar cambio en auditoría
      try {
        const FacturaCambiosRepo = this.dataSource.getRepository('FacturaCambio');
        await FacturaCambiosRepo.save({
          idFactura: dto.idFactura,
          usuarioId: idEmpleado || null,
          tipoCambio: 'CAMBIO_ESTADO',
          descripcion: `Pago parcial aplicado. Monto: $${dto.montoCobrar}. Total pagado: $${totalPagoNuevo} de $${totalFactura}`,
          valorAnterior: JSON.stringify({ estado: factura.estado, estadoFactura: estadoAnterior }),
          valorNuevo: JSON.stringify({ estado: 'parcialmente_pagada', estadoFactura: 'PAGADA' }),
        });
      } catch (error) {
        console.warn('Error registrando cambio en auditoría:', error.message);
      }
    }

    const pagoGuardado = await this.pagoRepository.findOne({
      where: { id: pagoBd.id },
      relations: ['medioPago', 'factura'],
    });

    if (!pagoGuardado) {
      throw new BadRequestException('Error al guardar el pago');
    }

    return pagoGuardado;
  }

  /**
   * Obtener todos los pagos de una factura
   */
  async findByFactura(idFactura: number): Promise<Pago[]> {
    return this.pagoRepository.find({
      where: { idFactura },
      relations: ['medioPago'],
      order: { fechaPago: 'DESC' },
    });
  }

  /**
   * Obtener todos los pagos con filtros
   */
  async findAll(filters?: {
    idHotel?: number;
    fechaDesde?: Date;
    fechaHasta?: Date;
  }): Promise<Pago[]> {
    let query = this.pagoRepository.createQueryBuilder('p');

    if (filters?.fechaDesde) {
      query = query.andWhere('p.fechaPago >= :fechaDesde', {
        fechaDesde: filters.fechaDesde,
      });
    }

    if (filters?.fechaHasta) {
      query = query.andWhere('p.fechaPago <= :fechaHasta', {
        fechaHasta: filters.fechaHasta,
      });
    }

    query = query
      .leftJoinAndSelect('p.medioPago', 'medioPago')
      .leftJoinAndSelect('p.factura', 'factura')
      .orderBy('p.fechaPago', 'DESC');

    return query.getMany();
  }

  /**
   * Devolver un pago (cambiar estado a 'devuelto')
   * Revertir el estado de la factura si es necesario
   * FASE 5: Validar que no se haya devuelto previamente (solo una devolución por pago)
   */
  async devolverPago(id: number, motivo: string): Promise<Pago> {
    const pago = await this.pagoRepository.findOne({
      where: { id },
      relations: ['factura'],
    });

    if (!pago) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    // FASE 5: Validar que el pago no haya sido devuelto previamente
    if (pago.estado === 'devuelto') {
      throw new BadRequestException(
        `El pago #${id} ya fue devuelto previamente en ${pago.fechaPago?.toLocaleDateString()}. ` +
        `No se puede devolver múltiples veces. Motivo anterior: ${pago.observaciones}`,
      );
    }

    // Cambiar estado del pago
    pago.estado = 'devuelto';
    pago.observaciones = `DEVUELTO: ${motivo}`;

    const pagoDev = await this.pagoRepository.save(pago);

    // Recalcular estado de la factura
    const pagosCompletados = await this.pagoRepository.find({
      where: { idFactura: pago.idFactura, estado: 'completado' },
    });

    const totalPagado = pagosCompletados.reduce(
      (sum, p) => sum + Number(p.monto),
      0,
    );

    // Si el total pagado < factura.total, revertir a 'emitida' o 'pendiente'
    const factura = pago.factura;
    if (totalPagado < Number(factura.total)) {
      factura.estado = factura.estado === 'pagada' ? 'emitida' : factura.estado;
      await this.pagoRepository.manager.save(factura);
    }

    const pagoDevoluto = await this.pagoRepository.findOne({
      where: { id: pagoDev.id },
      relations: ['medioPago', 'factura'],
    });

    if (!pagoDevoluto) {
      throw new BadRequestException('Error al procesar la devolución');
    }

    return pagoDevoluto;
  }
}
