import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folio, Cargo } from './entities/folio.entity';
import { CreateFolioDto, AgregarCargoDto, CobrarFolioDto } from './dto/folio.dto';
import { v4 as uuidv4 } from 'uuid';
import { Reserva } from '../reserva/entities/reserva.entity';
import { Pedido } from '../servicio/entities/pedido.entity';
import { FacturaService } from '../factura/factura.service';
import { Factura } from '../factura/entities/factura.entity';

const MS_POR_DIA = 1000 * 60 * 60 * 24;

@Injectable()
export class FolioService {
  constructor(
    @InjectRepository(Folio)
    private folioRepository: Repository<Folio>,
    @InjectRepository(Reserva)
    private reservaRepository: Repository<Reserva>,
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @Inject(forwardRef(() => FacturaService))
    private facturaService: FacturaService,
  ) {}

  private normalizarMoneda(valor: unknown): number {
    const numero = Number(valor || 0);
    return Number.isFinite(numero) ? Number(numero.toFixed(2)) : 0;
  }

  private calcularNoches(checkin?: Date | string, checkout?: Date | string): number {
    if (!checkin || !checkout) {
      return 0;
    }

    const fechaCheckin = new Date(checkin);
    const fechaCheckout = new Date(checkout);

    if (
      Number.isNaN(fechaCheckin.getTime()) ||
      Number.isNaN(fechaCheckout.getTime())
    ) {
      return 0;
    }

    return Math.max(
      1,
      Math.ceil(
        (fechaCheckout.getTime() - fechaCheckin.getTime()) / MS_POR_DIA,
      ),
    );
  }

  private firmaCargo(cargo: Cargo): string {
    const fecha = cargo.fechaAñadido
      ? new Date(cargo.fechaAñadido).toISOString()
      : '';

    return [
      cargo.idCargo,
      cargo.descripcion,
      cargo.cantidad,
      this.normalizarMoneda(cargo.precioUnitario),
      this.normalizarMoneda(cargo.monto),
      cargo.categoria,
      cargo.agregadoPor,
      fecha,
      cargo.referencia || '',
      cargo.automatico ? '1' : '0',
    ].join('|');
  }

  private firmaCargos(cargos: Cargo[] = []): string {
    return cargos.map((cargo) => this.firmaCargo(cargo)).join('||');
  }

  private esCargoAutomatico(cargo: Cargo): boolean {
    return Boolean(cargo?.automatico) || String(cargo?.idCargo || '').startsWith('AUTO_');
  }

  private obtenerEtiquetaCategoria(categoria?: string): string {
    const normalizada = String(categoria || '').toLowerCase();

    switch (normalizada) {
      case 'cafeteria':
        return 'Cafetería';
      case 'minibar':
        return 'Minibar';
      case 'lavanderia':
        return 'Lavandería';
      case 'spa':
        return 'Spa';
      case 'room_service':
        return 'Room Service';
      default:
        return 'Servicio';
    }
  }

  private obtenerTipoCargoServicio(categoria?: string): string {
    const normalizada = String(categoria || '').toLowerCase();

    if (normalizada === 'cafeteria' || normalizada === 'minibar') {
      return 'CONSUMO';
    }

    return 'SERVICIO';
  }

  private construirCargoHabitacion(reserva: Reserva): Cargo | null {
    const noches = this.calcularNoches(
      reserva.checkinReal || reserva.checkinPrevisto,
      reserva.checkoutReal || reserva.checkoutPrevisto,
    );
    const precioUnitario = this.normalizarMoneda(
      reserva.precioNocheSnapshot || reserva.tipoHabitacion?.precioBase || 0,
    );

    if (noches <= 0 || precioUnitario <= 0) {
      return null;
    }

    const numeroHabitacion =
      reserva.habitacion?.numeroHabitacion || String(reserva.idHabitacion || 'N/A');

    return {
      idCargo: `AUTO_HAB_${reserva.id}`,
      descripcion: `Alojamiento habitación ${numeroHabitacion}`,
      cantidad: noches,
      precioUnitario,
      monto: this.normalizarMoneda(noches * precioUnitario),
      categoria: 'ALOJAMIENTO',
      fechaAñadido:
        reserva.checkinReal || reserva.checkinPrevisto || reserva.createdAt || new Date(),
      agregadoPor: 'Sistema',
      referencia: reserva.codigoConfirmacion,
      automatico: true,
    };
  }

  private construirCargosServicios(pedidos: Pedido[]): Cargo[] {
    return pedidos.flatMap((pedido) => {
      const categoriaLabel = this.obtenerEtiquetaCategoria(pedido.categoria);
      const tipoCargo = this.obtenerTipoCargoServicio(pedido.categoria);

      return (pedido.items || []).map((item) => {
        const cantidad = Number(item.cantidad || 1);
        const precioUnitario = this.normalizarMoneda(item.precioUnitarioSnapshot);
        const monto = this.normalizarMoneda(
          item.subtotal || cantidad * precioUnitario,
        );

        return {
          idCargo: `AUTO_PED_${pedido.id}_ITEM_${item.id}`,
          descripcion: `${categoriaLabel} - ${item.nombreServicioSnapshot}`,
          cantidad,
          precioUnitario,
          monto,
          categoria: String(pedido.categoria || '').toUpperCase() || tipoCargo,
          fechaAñadido: item.createdAt || pedido.fechaPedido || new Date(),
          agregadoPor: 'Sistema',
          referencia: pedido.tipoEntrega,
          automatico: true,
        } as Cargo;
      });
    });
  }

  private async obtenerReservaRelacionada(folio: Folio): Promise<Reserva | null> {
    if (folio.idReserva) {
      const reservaPorId = await this.reservaRepository.findOne({
        where: { id: folio.idReserva },
        relations: ['habitacion', 'tipoHabitacion'],
      });

      if (reservaPorId) {
        return reservaPorId;
      }
    }

    const reservasHabitacion = await this.reservaRepository.find({
      where: { idHabitacion: folio.idHabitacion },
      relations: ['habitacion', 'tipoHabitacion'],
      order: { updatedAt: 'DESC' },
    });

    const reservaActiva = reservasHabitacion.find((reserva) => {
      const estado = String(reserva.estadoReserva || '').toLowerCase();

      return (
        !['cancelada', 'rechazada'].includes(estado) &&
        Boolean(reserva.checkinReal) &&
        !reserva.checkoutReal
      );
    });

    const reservaRelacionada =
      reservaActiva ||
      reservasHabitacion.find(
        (reserva) => !['cancelada', 'rechazada'].includes(String(reserva.estadoReserva || '').toLowerCase()),
      ) ||
      null;

    if (reservaRelacionada && !folio.idReserva) {
      folio.idReserva = reservaRelacionada.id;
    }

    return reservaRelacionada;
  }

  private async sincronizarCargosSistema(
    folio: Folio,
  ): Promise<{ folio: Folio; reserva: Reserva | null }> {
    const reserva = await this.obtenerReservaRelacionada(folio);
    const pedidosEntregados = reserva?.id
      ? await this.pedidoRepository.find({
          where: {
            idReserva: reserva.id,
            estadoPedido: 'entregado',
          },
          relations: ['items'],
          order: { fechaPedido: 'ASC' },
        })
      : [];

    const cargoHabitacion = reserva ? this.construirCargoHabitacion(reserva) : null;
    const cargosAutomaticos = [
      ...(cargoHabitacion ? [cargoHabitacion] : []),
      ...this.construirCargosServicios(pedidosEntregados),
    ];
    const cargosManuales = Array.isArray(folio.cargos)
      ? folio.cargos.filter((cargo) => !this.esCargoAutomatico(cargo))
      : [];
    const cargosSincronizados = [...cargosAutomaticos, ...cargosManuales];
    const subtotalCalculado = this.normalizarMoneda(
      cargosSincronizados.reduce(
        (acumulado, cargo) => acumulado + this.normalizarMoneda(cargo.monto),
        0,
      ),
    );
    const firmaAnterior = this.firmaCargos(Array.isArray(folio.cargos) ? folio.cargos : []);
    const firmaNueva = this.firmaCargos(cargosSincronizados);
    const huboCambios =
      firmaAnterior !== firmaNueva ||
      this.normalizarMoneda(folio.subtotal) !== subtotalCalculado ||
      this.normalizarMoneda(folio.total) !== subtotalCalculado ||
      (reserva?.id && folio.idReserva !== reserva.id);

    if (!huboCambios) {
      return { folio, reserva };
    }

    folio.cargos = cargosSincronizados;
    folio.subtotal = subtotalCalculado;
    folio.total = subtotalCalculado;

    if (reserva?.id) {
      folio.idReserva = reserva.id;
    }

    const folioGuardado = await this.folioRepository.save(folio);

    return { folio: folioGuardado, reserva };
  }

  private serializarFolio(folio: Folio, reserva?: Reserva | null) {
    const reservaRelacionada = reserva || folio.reserva || null;
    const total = this.normalizarMoneda(folio.total);

    return {
      id: folio.id,
      idHabitacion: folio.idHabitacion,
      numeroHabitacion:
        folio.habitacion?.numeroHabitacion ||
        reservaRelacionada?.habitacion?.numeroHabitacion ||
        String(folio.idHabitacion),
      idReserva: folio.idReserva || reservaRelacionada?.id || undefined,
      idCliente: reservaRelacionada?.idCliente,
      nombreCliente: reservaRelacionada?.nombreCliente || undefined,
      estadoPago: folio.estadoPago,
      estado: folio.estadoPago,
      cargos: (Array.isArray(folio.cargos) ? folio.cargos : []).map((cargo) => ({
        ...cargo,
        cantidad: Number(cargo.cantidad || 1),
        precioUnitario: this.normalizarMoneda(cargo.precioUnitario),
        monto: this.normalizarMoneda(cargo.monto),
        automatico: Boolean(cargo.automatico),
      })),
      subtotal: this.normalizarMoneda(folio.subtotal),
      montoIva: 0,
      montoInc: 0,
      total,
      saldo: folio.estadoPago === 'PAGADO' ? 0 : total,
      cantidadCargos: Array.isArray(folio.cargos) ? folio.cargos.length : 0,
      pagado: folio.estadoPago === 'PAGADO',
      fechaApertura: folio.fechaApertura,
      fechaCierre: folio.fechaCierre,
      createdAt: folio.fechaApertura,
      updatedAt: folio.updatedAt,
    };
  }

  /**
   * Obtener historial de folios
   * Permite filtrar por hotel, estado y rango de fechas
   */
  async obtenerHistorial(filtros?: {
    idHotel?: number;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    limit?: number;
  }): Promise<any[]> {
    const query = this.folioRepository
      .createQueryBuilder('folio')
      .leftJoinAndSelect('folio.habitacion', 'habitacion')
      .leftJoinAndSelect('folio.reserva', 'reserva')
      .orderBy('folio.fechaApertura', 'DESC')
      .take(Math.min(filtros?.limit || 100, 300));

    if (filtros?.idHotel) {
      query.andWhere('habitacion.idHotel = :idHotel', {
        idHotel: filtros.idHotel,
      });
    }

    if (filtros?.estado) {
      query.andWhere('folio.estadoPago = :estado', {
        estado: filtros.estado.toUpperCase(),
      });
    }

    if (filtros?.fechaDesde) {
      query.andWhere('folio.fechaApertura >= :fechaDesde', {
        fechaDesde: new Date(filtros.fechaDesde),
      });
    }

    if (filtros?.fechaHasta) {
      query.andWhere('folio.fechaApertura <= :fechaHasta', {
        fechaHasta: new Date(filtros.fechaHasta),
      });
    }

    const folios = await query.getMany();
    const foliosSincronizados = await Promise.all(
      folios.map((folio) => this.sincronizarCargosSistema(folio)),
    );

    return foliosSincronizados.map(({ folio, reserva }) =>
      this.serializarFolio(folio, reserva),
    );
  }

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

    const folioGuardado = await this.folioRepository.save(folio);
    const { folio: folioSincronizado } = await this.sincronizarCargosSistema(folioGuardado);

    return folioSincronizado;
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
    let folio = await this.obtenerFolio(idHabitacion);
    ({ folio } = await this.sincronizarCargosSistema(folio));

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
      automatico: false,
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
    let folio = await this.obtenerFolio(idHabitacion);
    ({ folio } = await this.sincronizarCargosSistema(folio));

    if (folio.estadoPago === 'PAGADO') {
      throw new ForbiddenException('No se puede eliminar cargos de un folio pagado');
    }

    const cargoAEliminar = folio.cargos.find((cargo) => cargo.idCargo === idCargo);

    if (!cargoAEliminar) {
      throw new NotFoundException(`No existe el cargo ${idCargo} en el folio`);
    }

    if (this.esCargoAutomatico(cargoAEliminar)) {
      throw new ForbiddenException(
        'Los cargos generados desde reserva o servicios entregados no se pueden eliminar manualmente',
      );
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
   * Se usa en CHECKOUT para preparar folio sin cobrar
   * El pago ocurre después en CAJA
   */
  async cerrarFolio(idHabitacion: number): Promise<Folio> {
    let folio = await this.obtenerFolio(idHabitacion);
    ({ folio } = await this.sincronizarCargosSistema(folio));

    if (folio.estadoPago === 'PAGADO') {
      throw new ForbiddenException('El folio ya fue pagado');
    }

    // CAMBIO IMPORTANTE: Marcar como CERRADO, no PAGADO
    // El pago se registra en Caja, no en Checkout
    folio.estadoPago = 'CERRADO';
    folio.fechaCierre = new Date();

    return await this.folioRepository.save(folio);
  }

  /**
   * Cobrar folio (registro de pago)
   * Marca como PAGADO y genera FACTURA automáticamente
   * Solo se puede cobrar un folio en estado CERRADO o ACTIVO
   */
  async cobrarFolio(
    idHabitacion: number,
    pagoDto: CobrarFolioDto,
  ): Promise<{ folio: any; pago: any; factura?: any }> {
    let folio = await this.obtenerFolio(idHabitacion);
    const { folio: folioSincronizado, reserva } = await this.sincronizarCargosSistema(folio);
    folio = folioSincronizado;

    // Validar estados permitidos: ACTIVO o CERRADO
    if (folio.estadoPago === 'PAGADO') {
      throw new ForbiddenException(
        `El folio ya fue pagado en fecha ${folio.fechaCierre?.toLocaleDateString('es-CO')}`,
      );
    }

    // FASE 5: Validar que el monto sea suficiente (usando montoCobrar del nuevo DTO)
    if (pagoDto.montoCobrar < folio.total) {
      throw new BadRequestException(
        `Monto insuficiente. Total: $${folio.total.toLocaleString('es-CO')}, Recibido: $${pagoDto.montoCobrar.toLocaleString('es-CO')}`,
      );
    }

    // Marcar folio como PAGADO
    folio.estadoPago = 'PAGADO';
    folio.fechaCierre = new Date();

    // FASE 5: Persistir información del pago en el folio para trazabilidad
    folio.idMedioPago = pagoDto.idMedioPago;
    folio.referenciaPago = pagoDto.referenciaPago;
    if (!folio.historicosPagos) {
      folio.historicosPagos = [];
    }
    folio.historicosPagos.push({
      idMedioPago: pagoDto.idMedioPago,
      monto: pagoDto.montoCobrar,
      referencia: pagoDto.referenciaPago,
      fecha: new Date(),
      cobrador: pagoDto.cobrador,
    });

    const folioActualizado = await this.folioRepository.save(folio);

    // Registrar información del pago (FASE 5: actualizado para nuevo DTO)
    const pago = {
      idFolio: folio.id,
      monto: pagoDto.montoCobrar,
      vuelto: pagoDto.montoCobrar - folio.total,
      concepto: pagoDto.observacionesCobro || 'Pago de folio',
      medioPagoId: pagoDto.idMedioPago,
      referencia: pagoDto.referenciaPago,
      cobrador: pagoDto.cobrador,
      fecha: new Date(),
    };

    // IMPORTANTE: Generar FACTURA automáticamente al pagar
    let factura: Factura | null = null
    try {
      if (reserva?.id) {
        factura = await this.facturaService.generarDesdeReserva(reserva)
      }
    } catch (error) {
      // Si hay error en factura, no bloquea el pago
      console.warn('Advertencia: No se pudo generar factura:', error.message)
    }

    return {
      folio: this.serializarFolio(folioActualizado, reserva),
      pago,
      factura: factura || undefined,
    }
  }

  /**
   * Obtener resumen de folio (para mostrar en vista)
   */
  async obtenerResumenFolio(idHabitacion: number) {
    const folio = await this.obtenerFolio(idHabitacion);
    const { folio: folioSincronizado, reserva } = await this.sincronizarCargosSistema(
      folio,
    );

    return this.serializarFolio(folioSincronizado, reserva);
  }
}
