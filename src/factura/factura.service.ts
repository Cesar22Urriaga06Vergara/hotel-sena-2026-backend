import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { EventEmitter2, OnEvent as OnEventDecorator } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { randomUUID } from 'crypto';
import { Factura } from './entities/factura.entity';
import { DetalleFactura } from './entities/detalle-factura.entity';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { UpdateFacturaDto } from './dto/update-factura.dto';
import { ReservaService } from '../reserva/reserva.service';
import { Reserva } from '../reserva/entities/reserva.entity';
import { Pedido } from '../servicio/entities/pedido.entity';
import { PedidoItem } from '../servicio/entities/pedido-item.entity';
import { Servicio } from '../servicio/entities/servicio.entity';
import { ImpuestoService } from '../impuesto/impuesto.service';
import { ClienteService } from '../cliente/cliente.service';
import { HotelService } from '../hotel/hotel.service';
import { Hotel } from '../hotel/entities/hotel.entity';
import { CategoriaServicio } from '../categoria-servicios/entities/categoria-servicio.entity';
import { IntegridadService } from './integridad.service';
import { ESTADOS_FACTURA, TRANSICIONES_FACTURA, EstadoFactura } from '../common/constants/estados.constants';
import {
  PedidoCreiadoEvent,
  PedidoEstadoCambioEvent,
  PagoRegistradoEvent,
  FacturaPagadaEvent,
  FacturaNulificadaEvent,
} from '../common/events/factura.events';

@Injectable()
export class FacturaService {
  constructor(
    @InjectRepository(Factura)
    private facturaRepository: Repository<Factura>,
    @InjectRepository(DetalleFactura)
    private detalleFacturaRepository: Repository<DetalleFactura>,
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(PedidoItem)
    private pedidoItemRepository: Repository<PedidoItem>,
    @InjectRepository(Servicio)
    private servicioRepository: Repository<Servicio>,
    @InjectRepository(CategoriaServicio)
    private categoriaServicioRepository: Repository<CategoriaServicio>,
    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => ReservaService))
    private reservaService: ReservaService,
    private impuestoService: ImpuestoService,
    @Inject(forwardRef(() => ClienteService))
    private clienteService: ClienteService,
    private hotelService: HotelService,
    private integridadService: IntegridadService,
  ) {}

  /**
   * Generar número de factura secuencial
   * Formato: FAC-{AÑO}-{SECUENCIA_5_DÍGITOS}
   * Ejemplo: FAC-2026-00001
   */
  private async generarNumeroFactura(): Promise<string> {
    const año = new Date().getFullYear();

    // Buscar la última factura creada usando find() en lugar de findOne()
    const facturasUltimas = await this.facturaRepository.find({
      order: { id: 'DESC' },
      take: 1,
    });

    const ultimaFactura = facturasUltimas[0];
    const siguiente = (ultimaFactura?.id ?? 0) + 1;
    return `FAC-${año}-${String(siguiente).padStart(5, '0')}`;
  }

  /**
   * Calcular desglose de impuestos por categoría de servicio
   * @param detalles Detalles de la factura con categoría_servicios_id
   * @param hotelId ID del hotel
   * @param idCliente ID del cliente para obtener su tax_profile
   * @returns { desgloseImpuestos, desgloseMonetario, montoIvaTotal, montoIncTotal, subtotal }
   */
  private async calcularDesgloseImpuestos(
    detalles: Array<{
      categoriaServiciosId: number;
      subtotal: number;
      categoriaNombre?: string;
    }>,
    hotelId: number,
    idCliente: number,
  ): Promise<{
    desgloseImpuestos: any;
    desgloseMonetario: any;
    montoIvaTotal: number;
    montoIncTotal: number;
    subtotalTotal: number;
  }> {
    // FIX: sin fallback 19%, cálculo por línea y agregación posterior
    const cliente = await this.clienteService.findOne(idCliente);
    const taxProfile = cliente.taxProfile || 'RESIDENT';

    const subtotalTotal = detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0);
    let montoIvaTotal = 0;
    let montoIncTotal = 0;
    const desgloseMonetario: Record<string, { subtotal: number; iva: number; inc: number; total: number }> = {};

    for (const detalle of detalles) {
      const categoriaNombre =
        detalle.categoriaNombre || `Categoría ${detalle.categoriaServiciosId}`;

      const tax = await this.impuestoService.calculateLineaImpuestos({
        subtotal: Number(detalle.subtotal || 0),
        categoriaServiciosId: detalle.categoriaServiciosId,
        hotelId,
        taxProfile,
      });

      if (!desgloseMonetario[categoriaNombre]) {
        desgloseMonetario[categoriaNombre] = {
          subtotal: 0,
          iva: 0,
          inc: 0,
          total: 0,
        };
      }

      desgloseMonetario[categoriaNombre].subtotal = parseFloat(
        (desgloseMonetario[categoriaNombre].subtotal + Number(detalle.subtotal || 0)).toFixed(2),
      );
      desgloseMonetario[categoriaNombre].iva = parseFloat(
        (desgloseMonetario[categoriaNombre].iva + tax.iva).toFixed(2),
      );
      desgloseMonetario[categoriaNombre].inc = parseFloat(
        (desgloseMonetario[categoriaNombre].inc + tax.inc).toFixed(2),
      );
      desgloseMonetario[categoriaNombre].total = parseFloat(
        (
          desgloseMonetario[categoriaNombre].subtotal +
          desgloseMonetario[categoriaNombre].iva +
          desgloseMonetario[categoriaNombre].inc
        ).toFixed(2),
      );

      montoIvaTotal = parseFloat((montoIvaTotal + tax.iva).toFixed(2));
      montoIncTotal = parseFloat((montoIncTotal + tax.inc).toFixed(2));
    }

    return {
      desgloseImpuestos: desgloseMonetario,
      desgloseMonetario,
      montoIvaTotal,
      montoIncTotal,
      subtotalTotal,
    };
  }

  /**
   * Generar factura desde una reserva completada
   * Calcula:
   *  - Línea de habitación (noches * precio/noche)
   *  - Líneas de servicios entregados (items de pedidos entregados)
   * Retorna la factura con detalles y cálculos de IVA
   * 
   * @param reserva - Reserva completada
   * @param existingQueryRunner - QueryRunner existente para evitar transacciones anidadas (opcional)
   */
  async generarDesdeReserva(reserva: Reserva, existingQueryRunner?: any): Promise<Factura> {
    // Validar que no exista ya una factura para esta reserva
    const facturaExistente = await this.facturaRepository.findOne({
      where: { idReserva: reserva.id },
    });

    if (facturaExistente) {
      throw new ConflictException(
        `Ya existe una factura para la reserva ${reserva.id}`,
      );
    }

    // Usar queryRunner existente o crear uno nuevo
    const queryRunner = existingQueryRunner || this.dataSource.createQueryRunner();
    const debeIniciarTransaccion = !existingQueryRunner; // Solo iniciar si es nuestro queryRunner

    if (debeIniciarTransaccion) {
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }

    try {
      // Generar número de factura dentro de la transacción
      const numeroFactura = await this.generarNumeroFactura();

      // Calcular número de noches
      const checkin = reserva.checkinReal || reserva.checkinPrevisto;
      const checkout = reserva.checkoutReal || reserva.checkoutPrevisto;
      const numeroNoches = Math.ceil(
        (new Date(checkout).getTime() - new Date(checkin).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Preparar arreglo de detalles
      const detalles: Partial<DetalleFactura>[] = [];

      // 1. Línea por habitación
      const subtotalHabitacion =
        numeroNoches * Number(reserva.precioNocheSnapshot);
      const formatCheckin = new Date(checkin).toLocaleDateString('es-CO');
      const formatCheckout = new Date(checkout).toLocaleDateString('es-CO');

      detalles.push({
        tipoConcepto: 'habitacion',
        descripcion: `Habitación ${reserva.habitacion?.numeroHabitacion || 'N/A'} - ${numeroNoches} noche(s) (${formatCheckin} al ${formatCheckout})`,
        cantidad: numeroNoches,
        precioUnitario: Number(reserva.precioNocheSnapshot),
        subtotal: subtotalHabitacion,
        descuento: 0,
        total: subtotalHabitacion,
        idReferencia: reserva.idHabitacion,
        categoriaServiciosId: 1, // Alojamiento = categoría 1
      });

      // 2. Líneas por servicios entregados (con INC para alcohólicos)
      const pedidosEntregados = await this.pedidoRepository.find({
        where: {
          idReserva: reserva.id,
          estadoPedido: 'entregado',
        },
        relations: ['items'],
      });

      // Cargar información de servicios para detectar alcohólicos
      const idsServicios = new Set<number>();
      for (const pedido of pedidosEntregados) {
        for (const item of pedido.items) {
          idsServicios.add(item.idServicio);
        }
      }

      const serviciosMap = new Map<number, Servicio>();
      if (idsServicios.size > 0) {
        const servicios = await this.servicioRepository.findBy({ id: In(Array.from(idsServicios)) });
        servicios.forEach(s => serviciosMap.set(s.id, s));
      }

      // Procesar items usando categoría fiscal persistida en servicio
      for (const pedido of pedidosEntregados) {
        for (const item of pedido.items) {
          const subtotalServicio =
            Number(item.cantidad) * Number(item.precioUnitarioSnapshot);

          // FIX: evitar lógica basada en strings; usar idCategoriaServicios del servicio
          let categoriaServiciosId = 2;
          const servicio = serviciosMap.get(item.idServicio);
          if (servicio?.idCategoriaServicios) {
            categoriaServiciosId = Number(servicio.idCategoriaServicios);
          }

          detalles.push({
            tipoConcepto: 'servicio',
            descripcion: `${item.nombreServicioSnapshot} (${new Date(pedido.fechaPedido).toLocaleDateString('es-CO')})`,
            cantidad: item.cantidad,
            precioUnitario: Number(item.precioUnitarioSnapshot),
            subtotal: subtotalServicio,
            descuento: 0,
            total: subtotalServicio,
            idReferencia: item.id,
            categoriaServiciosId,
          });
        }
      }

      // Obtener tax profile del cliente
      const cliente = await this.clienteService.findOne(reserva.idCliente);
      const taxProfile = cliente?.taxProfile || 'RESIDENT';

      // Cargar nombres de categorías desde la base de datos
      const categoriasIds = [...new Set(detalles.map(d => Number(d.categoriaServiciosId || 1)))];
      const categoriasEntities = await this.categoriaServicioRepository.findBy({ id: In(categoriasIds) });
      const categoriasMap = new Map<number, string>();
      categoriasEntities.forEach(cat => categoriasMap.set(cat.id, cat.nombre));

      // FIX: cálculo tributario por cada línea
      let montoIvaTotal = 0;
      let montoIncTotal = 0;
      let porcentajeIvaAplicado: number | undefined;
      let porcentajeIncAplicado: number | undefined;
      const desgloseFormateado: Record<string, any> = {};

      for (const detalle of detalles) {
        const tax = await this.impuestoService.calculateLineaImpuestos({
          subtotal: Number(detalle.subtotal || 0),
          categoriaServiciosId: Number(detalle.categoriaServiciosId || 1),
          hotelId: reserva.idHotel,
          taxProfile,
        });

        const ivaRate = tax.appliedTaxes.find((t) => t.tipoImpuesto === 'IVA');
        const incRate = tax.appliedTaxes.find((t) => t.tipoImpuesto === 'INC');

        if (ivaRate && porcentajeIvaAplicado === undefined) {
          porcentajeIvaAplicado = Number(ivaRate.tasaPorcentaje);
        }

        if (incRate && porcentajeIncAplicado === undefined) {
          porcentajeIncAplicado = Number(incRate.tasaPorcentaje);
        }

        // FIX: reflejar impuestos reales de la línea
        (detalle as any).montoIva = tax.iva;
        detalle.montoInc = tax.inc;
        detalle.porcentajeInc = incRate ? Number(incRate.tasaPorcentaje) : undefined;
        detalle.total = tax.total;

        montoIvaTotal = parseFloat((montoIvaTotal + tax.iva).toFixed(2));
        montoIncTotal = parseFloat((montoIncTotal + tax.inc).toFixed(2));

        const categoria = this.obtenerNombreCategoria(Number(detalle.categoriaServiciosId || 1), categoriasMap);
        if (!desgloseFormateado[categoria]) {
          desgloseFormateado[categoria] = {
            subtotal: 0,
            iva: 0,
            inc: 0,
            total: 0,
          };
        }

        // Guardar nombre de categoría en el detalle para persistencia
        (detalle as any).categoriaNombre = categoria;

        desgloseFormateado[categoria].subtotal = parseFloat(
          (desgloseFormateado[categoria].subtotal + Number(detalle.subtotal || 0)).toFixed(2),
        );
        desgloseFormateado[categoria].iva = parseFloat(
          (desgloseFormateado[categoria].iva + tax.iva).toFixed(2),
        );
        desgloseFormateado[categoria].inc = parseFloat(
          (desgloseFormateado[categoria].inc + tax.inc).toFixed(2),
        );
        desgloseFormateado[categoria].total = parseFloat(
          (
            desgloseFormateado[categoria].subtotal +
            desgloseFormateado[categoria].iva +
            desgloseFormateado[categoria].inc
          ).toFixed(2),
        );
      }

      const subtotalTotal = detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0);
      const total = parseFloat((subtotalTotal + montoIvaTotal + montoIncTotal).toFixed(2));

      // Crear factura con valores calculados correctamente
      const factura = new Factura();
      factura.numeroFactura = numeroFactura;
      factura.uuid = randomUUID();
      factura.idReserva = reserva.id;
      factura.idCliente = reserva.idCliente;
      factura.nombreCliente = reserva.nombreCliente;
      factura.cedulaCliente = reserva.cedulaCliente;
      factura.emailCliente = reserva.emailCliente;
      factura.idHotel = reserva.idHotel;
      factura.subtotal = subtotalTotal;
      factura.montoIva = montoIvaTotal;
      factura.porcentajeIva = porcentajeIvaAplicado ?? 0;
      factura.montoInc = montoIncTotal;
      factura.porcentajeInc = porcentajeIncAplicado;
      factura.total = total;
      factura.estadoFactura = ESTADOS_FACTURA.BORRADOR; // Usar constante
      factura.estado = 'pendiente'; // Campo legacy en minúsculas
      factura.observaciones = '';
      factura.fechaEmision = new Date();
      
      factura.desgloseImpuestos = desgloseFormateado;
      factura.desgloseMonetario = desgloseFormateado;
      
      // JSON para almacenamiento
      factura.jsonData = JSON.stringify({
        numeroFactura,
        uuid: factura.uuid,
        cliente: {
          nombre: reserva.nombreCliente,
          cedula: reserva.cedulaCliente,
          email: reserva.emailCliente,
          taxProfile,
        },
        detalles: detalles.map(d => ({
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          subtotal: d.subtotal,
          iva: (d as any).montoIva || 0,
          inc: d.montoInc || 0,
          total: d.total,
          categoria: this.obtenerNombreCategoria(d.categoriaServiciosId || 1, categoriasMap),
        })),
        montos: {
          subtotal: subtotalTotal,
          iva: montoIvaTotal,
          porcentajeIva: factura.porcentajeIva,
          inc: montoIncTotal,
          porcentajeInc: factura.porcentajeInc || null,
          total,
        },
        desgloseImpuestos: desgloseFormateado,
        fechaEmision: new Date().toISOString(),
      });
      
      // Obtener datos del hotel desde la base de datos
      const hotel = await this.hotelService.findOne(reserva.idHotel);
      if (!hotel) {
        throw new NotFoundException(`Hotel con ID ${reserva.idHotel} no encontrado`);
      }
      
      // Preparar datos XML (simulado para preparación DIAN)
      factura.xmlData = this.construirXmlUBL(numeroFactura, factura.uuid, reserva, detalles, hotel, { 
        subtotal: subtotalTotal,
        porcentajeIva: factura.porcentajeIva || 0,
        montoIva: montoIvaTotal,
        total,
      });

      // 5. Guardar factura y detalles
      const facturaGuardada = await queryRunner.manager.save(factura);

      const detallesConFactura = detalles.map((d) => ({
        ...d,
        idFactura: facturaGuardada.id,
      }));

      await queryRunner.manager.save(DetalleFactura, detallesConFactura);

      // Recargar factura con detalles
      const facturaCompleta = await queryRunner.manager.findOne(Factura, {
        where: { id: facturaGuardada.id },
        relations: ['detalles'],
      });

      // Solo hacer commit si fue nuestra transacción
      if (debeIniciarTransaccion) {
        await queryRunner.commitTransaction();
      }

      return facturaCompleta || new Factura();
    } catch (error) {
      // Solo hacer rollback si fue nuestra transacción
      if (debeIniciarTransaccion) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      // Solo liberar si fue nuestro queryRunner
      if (debeIniciarTransaccion) {
        await queryRunner.release();
      }
    }
  }

  /**
   * Generar factura a partir del ID de reserva
   * Carga la reserva completa antes de delegar el cálculo
   */
  async generarDesdeReservaId(idReserva: number): Promise<Factura> {
    const reserva = await this.reservaService.findOne(idReserva);
    return this.generarDesdeReserva(reserva);
  }

  /**
   * Obtener todas las facturas con filtros opcionales
   */
  async findAll(filters?: {
    idHotel?: number;
    estado?: string;
    estadoFactura?: string;
    idCliente?: number;
  }): Promise<Factura[]> {
    let query = this.facturaRepository.createQueryBuilder('f');

    if (filters?.idHotel) {
      query = query.where('f.idHotel = :idHotel', { idHotel: filters.idHotel });
    }

    // Usar constantes para validación de estados
    const estadosFacturaValidos = Object.values(ESTADOS_FACTURA);

    if (filters?.estadoFactura) {
      const estadoFacturaUpper = String(filters.estadoFactura).toUpperCase();
      if (estadosFacturaValidos.includes(estadoFacturaUpper as EstadoFactura)) {
        if (filters?.idHotel) {
          query = query.andWhere('f.estadoFactura = :estadoFactura', { estadoFactura: estadoFacturaUpper });
        } else {
          query = query.where('f.estadoFactura = :estadoFactura', { estadoFactura: estadoFacturaUpper });
        }
      }
    }

    if (filters?.estado) {
      const estadoInput = String(filters.estado);
      const estadoUpper = estadoInput.toUpperCase();

      if (estadosFacturaValidos.includes(estadoUpper as EstadoFactura)) {
        if (filters?.idHotel || filters?.estadoFactura) {
          query = query.andWhere('f.estadoFactura = :estadoFacturaAlias', { estadoFacturaAlias: estadoUpper });
        } else {
          query = query.where('f.estadoFactura = :estadoFacturaAlias', { estadoFacturaAlias: estadoUpper });
        }
      } else {
        if (filters?.idHotel || filters?.estadoFactura) {
          query = query.andWhere('f.estado = :estado', { estado: estadoInput });
        } else {
          query = query.where('f.estado = :estado', { estado: estadoInput });
        }
      }
    }

    if (filters?.idCliente) {
      if (filters?.idHotel || filters?.estado) {
        query = query.andWhere('f.idCliente = :idCliente', { idCliente: filters.idCliente });
      } else {
        query = query.where('f.idCliente = :idCliente', { idCliente: filters.idCliente });
      }
    }

    query = query.leftJoinAndSelect('f.detalles', 'detalles');
    query = query.leftJoinAndSelect('f.pagos', 'pagos');
    query = query.leftJoinAndSelect('pagos.medioPago', 'medioPago');
    query = query.leftJoinAndSelect('f.reserva', 'reserva');
    query = query.orderBy('f.createdAt', 'DESC');

    return query.getMany();
  }

  /**
   * Obtener una factura por ID
   */
  async findOne(id: number): Promise<Factura> {
    const factura = await this.facturaRepository.findOne({
      where: { id },
      relations: ['detalles', 'pagos', 'pagos.medioPago', 'reserva'],
    });

    if (!factura) {
      throw new NotFoundException(`Factura con ID ${id} no encontrada`);
    }

    return factura;
  }

  /**
   * Obtener factura por ID de reserva
   */
  async findByReserva(idReserva: number): Promise<Factura> {
    const factura = await this.facturaRepository.findOne({
      where: { idReserva },
      relations: ['detalles', 'pagos', 'pagos.medioPago', 'reserva'],
    });

    if (!factura) {
      throw new NotFoundException(
        `No se encontró factura para la reserva ${idReserva}`,
      );
    }

    return factura;
  }

  /**
   * Obtener nombre de categoría por ID
   * Si se provee un map, lo usa; sino usa fallback hardcoded para compatibilidad
   */
  private obtenerNombreCategoria(categoriaId: number, categoriasMap?: Map<number, string>): string {
    if (categoriasMap && categoriasMap.has(categoriaId)) {
      return categoriasMap.get(categoriaId)!;
    }
    
    // Fallback para compatibilidad (deprecated)
    const categorias: Record<number, string> = {
      1: 'Alojamiento',
      2: 'Cafetería',
      3: 'Minibar',
      4: 'Lavandería',
      5: 'Spa',
      6: 'Room Service',
    };
    return categorias[categoriaId] || `Categoría ${categoriaId}`;
  }

  /**
   * Obtener todas las facturas de un cliente
   */
  async findByCliente(idCliente: number): Promise<Factura[]> {
    return this.facturaRepository.find({
      where: { idCliente },
      relations: ['detalles', 'pagos', 'reserva'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener todas las facturas de un cliente filtradas por hotel
   */
  async findByClienteAndHotel(
    idCliente: number,
    idHotel: number,
  ): Promise<Factura[]> {
    return this.facturaRepository.find({
      where: { idCliente, idHotel },
      relations: ['detalles', 'pagos', 'reserva'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Emitir factura: Cambiar estado de BORRADOR/EDITABLE a EMITIDA
   * Valida que la factura esté en estado permitido y registra el cambio en auditoría
   */
  async emitir(id: number, usuarioId?: number): Promise<Factura> {
    const factura = await this.findOne(id);

    // Validar estado actual permitido para emisión usando constantes
    const estadosPermitidosParaEmitir: EstadoFactura[] = [ESTADOS_FACTURA.BORRADOR, ESTADOS_FACTURA.EDITABLE];
    
    if (!estadosPermitidosParaEmitir.includes(factura.estadoFactura as EstadoFactura)) {
      throw new BadRequestException(
        `No se puede emitir una factura en estado ${factura.estadoFactura}. ` +
        `Estados permitidos: ${estadosPermitidosParaEmitir.join(', ')}`,
      );
    }

    // Validar integridad de datos antes de emitir
    const validacionIntegridad = this.integridadService.validarFacturaParaEmision(factura);
    if (!validacionIntegridad.valida) {
      throw new BadRequestException(
        `La factura no puede ser emitida debido a errores de integridad: ${validacionIntegridad.errores.join(', ')}`,
      );
    }

    // Registrar cambio anterior
    const estadoAnterior = factura.estadoFactura;
    
    // Cambiar estado y establecer fechas
    // Cambiar estado usando constantes
    factura.estadoFactura = ESTADOS_FACTURA.EMITIDA;
    factura.estado = 'emitida'; // Mantener compatibilidad con campo antiguo
    factura.fechaEmision = new Date();
    factura.fechaVencimiento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

    // Guardar cambios
    const facturaActualizada = await this.facturaRepository.save(factura);

    // Registrar en auditoría
    try {
      const FacturaCambiosRepo = this.dataSource.getRepository('FacturaCambios');
      await FacturaCambiosRepo.save({
        idFactura: id,
        usuarioId,
        tipoCambio: 'CAMBIO_ESTADO',
        descripcion: `Factura emitida - Cambio de estado ${estadoAnterior} → ${ESTADOS_FACTURA.EMITIDA}`,
        valorAnterior: JSON.stringify({ estadoFactura: estadoAnterior }),
        valorNuevo: JSON.stringify({ estadoFactura: ESTADOS_FACTURA.EMITIDA, fechaEmision: factura.fechaEmision }),
        fecha: new Date(),
      });
    } catch (error) {
      console.warn('Error al registrar emisión en auditoría:', error);
    }

    return facturaActualizada;
  }

  /**
   * Anular factura: Cambiar estado a ANULADA
   * Solo permite anular desde estados BORRADOR, EDITABLE, o EMITIDA
   * No se puede anular si ya tiene pagos completados
   */
  async anular(id: number, motivo: string, usuarioId?: number): Promise<Factura> {
    const factura = await this.findOne(id);

    // No se puede anular desde estados finales usando constantes
    const estadosFinales: EstadoFactura[] = [ESTADOS_FACTURA.PAGADA, ESTADOS_FACTURA.ANULADA];
    if (estadosFinales.includes(factura.estadoFactura as EstadoFactura)) {
      throw new BadRequestException(
        `No se puede anular una factura en estado final: ${factura.estadoFactura}`,
      );
    }

    // No se puede anular si ya tiene pagos completados
    const pagosCompletados = factura.pagos?.filter(
      (p) => p.estado === 'completado',
    );

    if (pagosCompletados && pagosCompletados.length > 0) {
      throw new BadRequestException(
        'No se puede anular una factura que ya tiene pagos registrados',
      );
    }

    // Validar que el motivo no esté vacío
    if (!motivo || motivo.trim() === '') {
      throw new BadRequestException(
        'Debe proporcionar un motivo para anular la factura',
      );
    }

    // Registrar estado anterior
    const estadoAnterior = factura.estadoFactura;

    // Cambiar estado usando constantes
    factura.estadoFactura = ESTADOS_FACTURA.ANULADA;
    factura.estado = 'anulada'; // Mantener compatibilidad con campo antiguo
    factura.observaciones = `ANULADA [${new Date().toLocaleString('es-CO')}]: ${motivo}`;

    // Guardar cambios
    const facturaActualizada = await this.facturaRepository.save(factura);

    // Registrar en auditoría
    try {
      const FacturaCambiosRepo = this.dataSource.getRepository('FacturaCambios');
      await FacturaCambiosRepo.save({
        idFactura: id,
        usuarioId,
        tipoCambio: 'CAMBIO_ESTADO',
        descripcion: `Factura anulada - Cambio de estado ${estadoAnterior} → ${ESTADOS_FACTURA.ANULADA}. Motivo: ${motivo}`,
        valorAnterior: JSON.stringify({ estadoFactura: estadoAnterior }),
        valorNuevo: JSON.stringify({ 
          estadoFactura: ESTADOS_FACTURA.ANULADA, 
          observaciones: factura.observaciones 
        }),
        fecha: new Date(),
      });
    } catch (error) {
      console.warn('Error al registrar anulación en auditoría:', error);
    }

    return facturaActualizada;
  }

  /**
   * Marcar factura como pagada: Cambiar estado a PAGADA
   * Solo se puede marcar como pagada desde estado EMITIDA
   */
  async marcarComoPagada(id: number, fechaPago?: Date, usuarioId?: number): Promise<Factura> {
    const factura = await this.findOne(id);

    // Validar que esté en estado EMITIDA usando constantes
    if (factura.estadoFactura !== ESTADOS_FACTURA.EMITIDA) {
      throw new BadRequestException(
        `No se puede marcar como pagada una factura en estado ${factura.estadoFactura}. ` +
        `Solo se pueden pagar facturas en estado ${ESTADOS_FACTURA.EMITIDA}`,
      );
    }

    // Verificar que tenga al menos un pago registrado
    const poseePageos = factura.pagos && factura.pagos.length > 0;
    if (!poseePageos) {
      throw new BadRequestException(
        'Debe registrar al menos un pago antes de marcar la factura como pagada',
      );
    }

    // Registrar estado anterior
    const estadoAnterior = factura.estadoFactura;
    const fechaPagoReal = fechaPago || new Date();

    // Cambiar estado usando constantes
    factura.estadoFactura = ESTADOS_FACTURA.PAGADA;
    factura.estado = 'pagada'; // Mantener compatibilidad con campo antiguo
    factura.fechaVencimiento = fechaPagoReal;

    // Guardar cambios
    const facturaActualizada = await this.facturaRepository.save(factura);

    // Registrar en auditoría
    try {
      const FacturaCambiosRepo = this.dataSource.getRepository('FacturaCambios');
      await FacturaCambiosRepo.save({
        idFactura: id,
        usuarioId,
        tipoCambio: 'CAMBIO_ESTADO',
        descripcion: `Factura marcada como pagada - Cambio de estado ${estadoAnterior} → ${ESTADOS_FACTURA.PAGADA}`,
        valorAnterior: JSON.stringify({ estadoFactura: estadoAnterior }),
        valorNuevo: JSON.stringify({ 
          estadoFactura: ESTADOS_FACTURA.PAGADA,
          fechaPago: fechaPagoReal,
        }),
        fecha: new Date(),
      });
    } catch (error) {
      console.warn('Error al registrar pago en auditoría:', error);
    }

    return facturaActualizada;
  }

  /**
   * Actualizar factura con validaciones de estado y auditoría
   * 
   * Máquina de estados:
   * BORRADOR -> EDITABLE | EMITIDA | ANULADA
   * EDITABLE -> EMITIDA | BORRADOR | ANULADA
   * EMITIDA -> PAGADA | ANULADA
   * PAGADA -> (final, no se puede cambiar)
   * ANULADA -> (final, no se puede cambiar)
   * 
   * @param id ID de la factura
   * @param dto UpdateFacturaDto con campos a actualizar
   * @param usuarioId (opcional) ID del usuario que hace la actualización (para auditoría)
   * @returns Factura actualizada
   */
  async update(
    id: number,
    dto: UpdateFacturaDto,
    usuarioId?: number,
  ): Promise<Factura> {
    const factura = await this.findOne(id);

    // Validar transiciones de estado permitidas según máquina de estados usando constantes
    if (dto.estadoFactura) {
      const estadoActual = factura.estadoFactura as EstadoFactura;
      const estadoNuevo = dto.estadoFactura as EstadoFactura;

      const transicionesPermitidas = TRANSICIONES_FACTURA[estadoActual] || [];

      if (!transicionesPermitidas.includes(estadoNuevo)) {
        throw new BadRequestException(
          `No se puede cambiar de estado ${estadoActual} a ${estadoNuevo}. ` +
          `Transiciones permitidas: ${transicionesPermitidas.join(', ') || 'ninguna'}`,
        );
      }
    }

    // Solo permitir cambios de montos en estados BORRADOR y EDITABLE usando constantes
    const estadosEditables: EstadoFactura[] = [ESTADOS_FACTURA.BORRADOR, ESTADOS_FACTURA.EDITABLE];
    if (
      (dto.montoIva !== undefined ||
        dto.montoInc !== undefined ||
        dto.subtotal !== undefined) &&
      !estadosEditables.includes(factura.estadoFactura as EstadoFactura)
    ) {
      throw new BadRequestException(
        `No se pueden actualizar montos en estado ${factura.estadoFactura}. ` +
        `Solo está permitido en ${estadosEditables.join(' o ')}.`,
      );
    }

    // Validar que no se edite factura pagada o anulada usando constantes
    const estadosFinales: EstadoFactura[] = [ESTADOS_FACTURA.PAGADA, ESTADOS_FACTURA.ANULADA];
    if (estadosFinales.includes(factura.estadoFactura as EstadoFactura)) {
      throw new BadRequestException(
        `No se puede editar una factura en estado ${factura.estadoFactura}`,
      );
    }

    // Grabar valores antiguos para auditoría
    const cambios: Array<{
      campo: string;
      valorAnterior: any;
      valorNuevo: any;
    }> = [];

    // Actualizar campos permitidos y registrar cambios
    if (dto.estado !== undefined && dto.estado !== factura.estado) {
      cambios.push({
        campo: 'estado',
        valorAnterior: factura.estado,
        valorNuevo: dto.estado,
      });
      factura.estado = dto.estado;
    }

    if (dto.estadoFactura !== undefined && dto.estadoFactura !== factura.estadoFactura) {
      cambios.push({
        campo: 'estadoFactura',
        valorAnterior: factura.estadoFactura,
        valorNuevo: dto.estadoFactura,
      });
      factura.estadoFactura = dto.estadoFactura;
    }

    if (dto.observaciones !== undefined && dto.observaciones !== factura.observaciones) {
      cambios.push({
        campo: 'observaciones',
        valorAnterior: factura.observaciones,
        valorNuevo: dto.observaciones,
      });
      factura.observaciones = dto.observaciones;
    }

    if (dto.cufe !== undefined && dto.cufe !== factura.cufe) {
      cambios.push({
        campo: 'cufe',
        valorAnterior: factura.cufe,
        valorNuevo: dto.cufe,
      });
      factura.cufe = dto.cufe;
    }

    // Si se actualiza montos específicamente, registrar cambios
    if (dto.subtotal !== undefined && dto.subtotal !== factura.subtotal) {
      cambios.push({
        campo: 'subtotal',
        valorAnterior: factura.subtotal,
        valorNuevo: dto.subtotal,
      });
      factura.subtotal = dto.subtotal;
    }

    if (dto.montoIva !== undefined && dto.montoIva !== factura.montoIva) {
      cambios.push({
        campo: 'montoIva',
        valorAnterior: factura.montoIva,
        valorNuevo: dto.montoIva,
      });
      factura.montoIva = dto.montoIva;
    }

    if (dto.montoInc !== undefined && dto.montoInc !== factura.montoInc) {
      cambios.push({
        campo: 'montoInc',
        valorAnterior: factura.montoInc,
        valorNuevo: dto.montoInc,
      });
      factura.montoInc = dto.montoInc;
    }

    // Si hay cambios en detalles (via DTO), marcar para recálculo
    if (dto.recalcularImpuestos === true) {
      // Necesita se implementado refetch de detalles y recálculo vía ImpuestoService
      // Por ahora, solo marcar que se pide recálculo
      cambios.push({
        campo: 'recalcularImpuestos',
        valorAnterior: false,
        valorNuevo: true,
      });
    }

    // Guardar factura actualizada
    const facturaActualizada = await this.facturaRepository.save(factura);

    // Registrar cambios en auditoría (si hay cambios y tenemos repositorio FacturaCambios)
    if (cambios.length > 0) {
      try {
        const FacturaCambiosRepo = this.dataSource.getRepository('FacturaCambios');
        await FacturaCambiosRepo.save({
          idFactura: id,
          usuarioId,
          usuarioEmail: null, // Se puede enriquecer si se pasa usuario objeto completo
          tipoCambio: 'ACTUALIZACIÓN',
          descripcion: `Se actualizaron los campos: ${cambios.map((c) => c.campo).join(', ')}`,
          valorAnterior: JSON.stringify(
            cambios.reduce((acc, c) => {
              acc[c.campo] = c.valorAnterior;
              return acc;
            }, {}),
          ),
          valorNuevo: JSON.stringify(
            cambios.reduce((acc, c) => {
              acc[c.campo] = c.valorNuevo;
              return acc;
            }, {}),
          ),
          fecha: new Date(),
        });
      } catch (error) {
        // Log pero no fallar si hay error en auditoría
        console.warn('Error al registrar cambios en auditoría:', error);
      }
    }

    return facturaActualizada;
  }

  /**
   * Obtener el historial de cambios (auditoría) de una factura
   * Retorna todos los cambios registrados en la tabla FacturaCambios
   * Ordenados por fecha descendente (más recientes primero)
   */
  async obtenerHistorialCambios(idFactura: number): Promise<any[]> {
    try {
      const FacturaCambiosRepo = this.dataSource.getRepository('FacturaCambios');
      
      const cambios = await FacturaCambiosRepo.find({
        where: { idFactura },
        order: { fecha: 'DESC' },
      });

      // Enriquecer cambios con información legible
      return cambios.map((cambio) => ({
        id: cambio.id,
        idFactura: cambio.idFactura,
        usuarioId: cambio.usuarioId,
        tipoCambio: cambio.tipoCambio,
        descripcion: cambio.descripcion,
        valorAnterior: cambio.valorAnterior ? JSON.parse(cambio.valorAnterior) : null,
        valorNuevo: cambio.valorNuevo ? JSON.parse(cambio.valorNuevo) : null,
        fecha: cambio.fecha,
        fechaFormateada: new Date(cambio.fecha).toLocaleString('es-CO'),
      }));
    } catch (error) {
      console.warn('Error al obtener historial de cambios:', error);
      return [];
    }
  }

  /**
   * FASE 8: Agregar detalle a una factura existente
   * Permite agregar servicios, cargos manuales o descuentos después de crear la factura
   * Validaciones:
   * - Factura debe estar en estado BORRADOR o EDITABLE
   * - Cantidad > 0, Precio >= 0
   * - Si tiene idPedido, validar que la reserva es la misma
   */
  async agregarDetalle(
    idFactura: number,
    tipoConcepto: string,
    descripcion: string,
    cantidad: number,
    precioUnitario: number,
    idPedido?: number,
    idReferencia?: number,
    categoriaServiciosId?: number,
    usuarioId?: number,
  ): Promise<DetalleFactura> {
    // Validaciones básicas
    if (cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }
    if (precioUnitario < 0) {
      throw new BadRequestException('El precio unitario no puede ser negativo');
    }

    // Obtener factura
    const factura = await this.findOne(idFactura);
    if (factura.estadoFactura !== 'BORRADOR' && factura.estadoFactura !== 'EDITABLE') {
      throw new BadRequestException(
        `No se pueden agregar detalles a una factura en estado ${factura.estadoFactura}`,
      );
    }

    // Si hay idPedido, validar que existe y pertenece a misma reserva
    let pedido: Pedido | null = null;
    if (idPedido) {
      pedido = await this.pedidoRepository.findOne({
        where: { id: idPedido },
      });
      if (!pedido) {
        throw new NotFoundException(`Pedido ${idPedido} no encontrado`);
      }
      if (pedido.idReserva !== factura.idReserva) {
        throw new BadRequestException(
          'El pedido no pertenece a la misma reserva que la factura',
        );
      }
    }

    // Calcular subtotal y totales
    const subtotal = cantidad * precioUnitario;
    const descuento = 0; // Inicializar con 0, se puede actualizar luego
    
    // Calcular impuestos
    let montoIva = 0;
    let montoInc = 0;
    let porcentajeInc: number | undefined = undefined;

    if (categoriaServiciosId) {
      const cliente = await this.clienteService.findOne(factura.idCliente);
      const taxProfile = cliente?.taxProfile || 'RESIDENT';

      const tax = await this.impuestoService.calculateLineaImpuestos({
        subtotal,
        categoriaServiciosId,
        hotelId: factura.idHotel,
        taxProfile,
      });

      const ivaRate = tax.appliedTaxes.find((t) => t.tipoImpuesto === 'IVA');
      const incRate = tax.appliedTaxes.find((t) => t.tipoImpuesto === 'INC');

      if (ivaRate) {
        montoIva = (subtotal * Number(ivaRate.tasaPorcentaje)) / 100;
      }
      if (incRate) {
        porcentajeInc = Number(incRate.tasaPorcentaje);
        montoInc = (subtotal * porcentajeInc) / 100;
      }
    }

    const total = subtotal + montoIva + montoInc - descuento;

    // Crear nuevo detalle
    const detalle = this.detalleFacturaRepository.create({
      idFactura,
      idPedido,
      tipoConcepto,
      descripcion,
      cantidad,
      precioUnitario,
      subtotal,
      descuento,
      total,
      montoIva,
      porcentajeInc,
      montoInc,
      idReferencia,
      categoriaServiciosId,
      estado: 'PENDIENTE',
    });

    await this.detalleFacturaRepository.save(detalle);

    // Registrar cambio en auditoría
    try {
      const DetalleFacturaCambiosRepo = this.dataSource.getRepository('DetalleFacturaCambio');
      await DetalleFacturaCambiosRepo.save({
        idDetalle: detalle.id,
        usuarioId,
        tipoCambio: 'CREACION',
        descripcion: `Detalle creado: ${descripcion}. Cantidad: ${cantidad}, Precio: $${precioUnitario}`,
        valorNuevo: JSON.stringify({
          tipoConcepto,
          descripcion,
          cantidad,
          precioUnitario,
          total,
          estado: 'PENDIENTE',
        }),
      });
    } catch (error) {
      console.warn('Error registrando detalle en auditoría:', (error as Error).message);
    }

    // Actualizar total de factura
    await this.recalcularTotalFactura(idFactura);

    return detalle;
  }

  /**
   * FASE 8: Actualizar detalle de factura
   * Permite modificar cantidad, precio, estado
   * Validaciones de máquina de estados:
   * - PENDIENTE → ENTREGADO | CANCELADO
   * - ENTREGADO → no permite cambios
   * - CANCELADO → no permite cambios
   */
  async actualizarDetalle(
    idDetalle: number,
    actualizaciones: {
      cantidad?: number;
      precioUnitario?: number;
      estado?: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO';
      descripcion?: string;
    },
    usuarioId?: number,
  ): Promise<DetalleFactura> {
    const detalle = await this.detalleFacturaRepository.findOne({
      where: { id: idDetalle },
      relations: ['factura'],
    });

    if (!detalle) {
      throw new NotFoundException(`Detalle ${idDetalle} no encontrado`);
    }

    // Validar estado actual
    if (detalle.estado === 'ENTREGADO' || detalle.estado === 'CANCELADO') {
      throw new BadRequestException(
        `No se puede actualizar un detalle en estado ${detalle.estado}`,
      );
    }

    const valorAnterior = {
      cantidad: detalle.cantidad,
      precioUnitario: detalle.precioUnitario,
      estado: detalle.estado,
      total: detalle.total,
    };

    // Validar nuevos valores
    if (actualizaciones.cantidad !== undefined && actualizaciones.cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }
    if (actualizaciones.precioUnitario !== undefined && actualizaciones.precioUnitario < 0) {
      throw new BadRequestException('El precio unitario no puede ser negativo');
    }

    // Aplicar cambios
    if (actualizaciones.cantidad !== undefined) detalle.cantidad = actualizaciones.cantidad;
    if (actualizaciones.precioUnitario !== undefined) detalle.precioUnitario = actualizaciones.precioUnitario;
    if (actualizaciones.descripcion !== undefined) detalle.descripcion = actualizaciones.descripcion;

    // Recalcular subtotal y totales
    const subtotal = detalle.cantidad * detalle.precioUnitario;
    detalle.subtotal = subtotal;
    detalle.total = subtotal + detalle.montoIva + detalle.montoInc - detalle.descuento;

    // Actualizar estado si se proporciona
    if (actualizaciones.estado) {
      detalle.estado = actualizaciones.estado;
    }

    await this.detalleFacturaRepository.save(detalle);

    // Registrar cambio en auditoría
    try {
      const DetalleFacturaCambiosRepo = this.dataSource.getRepository('DetalleFacturaCambio');
      let tipoCambio = 'CAMBIO_MONTO';
      if (actualizaciones.estado) tipoCambio = 'CAMBIO_ESTADO';
      if (actualizaciones.cantidad) tipoCambio = 'CAMBIO_CANTIDAD';

      await DetalleFacturaCambiosRepo.save({
        idDetalle,
        usuarioId,
        tipoCambio,
        descripcion: `Detalle actualizado: ${detalle.descripcion}. Nuevos valores: Cantidad=${detalle.cantidad}, Precio=$${detalle.precioUnitario}, Estado=${detalle.estado}`,
        valorAnterior: JSON.stringify(valorAnterior),
        valorNuevo: JSON.stringify({
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          estado: detalle.estado,
          total: detalle.total,
        }),
      });
    } catch (error) {
      console.warn('Error registrando cambio en auditoría:', (error as Error).message);
    }

    // Actualizar total de factura
    if (detalle.idFactura) {
      await this.recalcularTotalFactura(detalle.idFactura);
    }

    return detalle;
  }

  /**
   * FASE 8: Eliminar detalle de factura (soft delete)
   * Marca el detalle como CANCELADO en lugar de eliminarlo
   * Mantiene auditoría completa de eliminaciones
   */
  async eliminarDetalle(idDetalle: number, motivo?: string, usuarioId?: number): Promise<DetalleFactura> {
    const detalle = await this.detalleFacturaRepository.findOne({
      where: { id: idDetalle },
    });

    if (!detalle) {
      throw new NotFoundException(`Detalle ${idDetalle} no encontrado`);
    }

    // No permitir eliminar detalles ya cancelados
    if (detalle.estado === 'CANCELADO') {
      throw new BadRequestException('El detalle ya había sido cancelado');
    }

    const estadoAnterior = detalle.estado;
    detalle.estado = 'CANCELADO';

    await this.detalleFacturaRepository.save(detalle);

    // Registrar eliminación en auditoría
    try {
      const DetalleFacturaCambiosRepo = this.dataSource.getRepository('DetalleFacturaCambio');
      await DetalleFacturaCambiosRepo.save({
        idDetalle,
        usuarioId,
        tipoCambio: 'ELIMINACION',
        descripcion: `Detalle cancelado: ${detalle.descripcion}. Motivo: ${motivo || 'No especificado'}`,
        valorAnterior: JSON.stringify({
          estado: estadoAnterior,
          total: detalle.total,
        }),
        valorNuevo: JSON.stringify({
          estado: 'CANCELADO',
          total: 0,
        }),
      });
    } catch (error) {
      console.warn('Error registrando eliminación en auditoría:', (error as Error).message);
    }

    // Actualizar total de factura
    if (detalle.idFactura) {
      await this.recalcularTotalFactura(detalle.idFactura);
    }

    return detalle;
  }

  /**
   * FASE 8: Recalcular total de una factura
   * Se llama automáticamente al agregar, actualizar o eliminar detalles
   * Recalcula subtotal, IVA e INC globales
   */
  private async recalcularTotalFactura(idFactura: number): Promise<void> {
    try {
      const factura = await this.findOne(idFactura);
      const detalles = await this.detalleFacturaRepository.find({
        where: { idFactura },
      });

      // Sumar detalles activos (no cancelados)
      let subtotal = 0;
      let montoIvaTotal = 0;
      let montoIncTotal = 0;

      for (const detalle of detalles) {
        if (detalle.estado !== 'CANCELADO') {
          subtotal += Number(detalle.subtotal);
          montoIvaTotal += Number(detalle.montoIva || 0);
          montoIncTotal += Number(detalle.montoInc || 0);
        }
      }

      // Actualizar totales en factura
      factura.subtotal = subtotal;
      factura.montoIva = montoIvaTotal;
      factura.montoInc = montoIncTotal;
      factura.total = subtotal + montoIvaTotal + montoIncTotal;

      await this.facturaRepository.save(factura);
    } catch (error) {
      console.warn('Error recalculando total de factura:', (error as Error).message);
    }
  }

  /**
   * FASE 8: Obtener todos los detalles de una factura
   * Retorna array de detalles con relaciones cargadas
   * Útil para endpoint GET /facturas/:id/detalles
   */
  async obtenerDetalles(idFactura: number): Promise<DetalleFactura[]> {
    const factura = await this.findOne(idFactura);
    if (!factura) {
      throw new NotFoundException(`Factura ${idFactura} no encontrada`);
    }

    const detalles = await this.detalleFacturaRepository.find({
      where: { idFactura },
      order: { id: 'ASC' },
    });

    return detalles;
  }

  /**
   * FASE 8 P2: Obtener KPIs de facturación para Admin
   * Retorna métricas: total facturas, ingresos, pendientes, morosidad
   */
  async obtenerKpisAdmin(
    hotelId: number,
    periodo?: { inicio: Date; fin: Date },
  ): Promise<any> {
    const inicio = periodo?.inicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fin = periodo?.fin || new Date();

    // Query 1: Totales generales
    const totales = await this.facturaRepository
      .createQueryBuilder('f')
      .select('COUNT(*)', 'totalFacturas')
      .addSelect('SUM(f.total)', 'montoTotal')
      .where('f.idHotel = :hotelId', { hotelId })
      .andWhere('f.createdAt >= :inicio AND f.createdAt <= :fin', { inicio, fin })
      .getRawOne();

    // Query 2: Facturas por estado
    const porEstado = await this.facturaRepository
      .createQueryBuilder('f')
      .select('f.estadoFactura', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .addSelect('COALESCE(SUM(f.total), 0)', 'monto')
      .where('f.idHotel = :hotelId', { hotelId })
      .andWhere('f.createdAt >= :inicio AND f.createdAt <= :fin', { inicio, fin })
      .groupBy('f.estadoFactura')
      .getRawMany();

    // Query 3: Facturas vencidas (atrasadas > 30 días)
    const facturasVencidas = await this.facturaRepository
      .createQueryBuilder('f')
      .select('COUNT(*)', 'cantidad')
      .addSelect('COALESCE(SUM(f.total), 0)', 'monto')
      .where('f.idHotel = :hotelId', { hotelId })
      .andWhere('f.estadoFactura IN (:...estados)', { estados: ['EMITIDA', 'PAGADA'] })
      .andWhere('f.fechaVencimiento < :ahora', { ahora: new Date() })
      .getRawOne();

    // Query 4: Ingresos por categoría de servicio
    const ingresosPorCategoria = await this.dataSource.query(`
      SELECT 
        cs.nombre,
        SUM(df.total) as total,
        COUNT(*) as cantidad
      FROM detalle_facturas df
      LEFT JOIN categoria_servicios cs ON df.categoria_servicios_id = cs.id
      WHERE df.id_factura IN (
        SELECT id FROM facturas 
        WHERE id_hotel = ? AND estadoFactura = 'PAGADA'
        AND createdAt BETWEEN ? AND ?
      )
      GROUP BY cs.nombre
      ORDER BY total DESC
    `, [hotelId, inicio, fin]);

    // Query 5: Top 10 clientes por monto
    const topClientes = await this.facturaRepository
      .createQueryBuilder('f')
      .select('f.idCliente', 'idCliente')
      .addSelect('c.nombre', 'nombre')
      .addSelect('SUM(f.total)', 'totalGastado')
      .addSelect('COUNT(*)', 'cantidadFacturas')
      .leftJoin('f.cliente', 'c')
      .where('f.idHotel = :hotelId', { hotelId })
      .andWhere('f.createdAt >= :inicio AND f.createdAt <= :fin', { inicio, fin })
      .andWhere('f.estadoFactura = :estado', { estado: 'PAGADA' })
      .groupBy('f.idCliente, c.nombre')
      .orderBy('totalGastado', 'DESC')
      .limit(10)
      .getRawMany();

    // Calcular tasa de morosidad
    const totalPendiente = porEstado.find((e) => e.estado === 'EMITIDA')?.cantidad || 0;
    const tasaMorosidad = totales.totalFacturas > 0 ? 
      ((totalPendiente + (facturasVencidas.cantidad || 0)) / totales.totalFacturas) * 100 
      : 0;

    return {
      periodo: { inicio, fin },
      kpis: {
        totalFacturas: parseInt(totales.totalFacturas || '0'),
        montoTotal: parseFloat(totales.montoTotal || '0'),
        porEstado: porEstado.map((e) => ({
          estado: e.estado,
          cantidad: parseInt(e.cantidad || '0'),
          monto: parseFloat(e.monto || '0'),
        })),
        tasaMorosidad: parseFloat(tasaMorosidad.toFixed(2)),
        facturasVencidas: {
          cantidad: parseInt(facturasVencidas.cantidad || '0'),
          monto: parseFloat(facturasVencidas.monto || '0'),
        },
        ingresosPorCategoria,
        topClientes: topClientes.map((c) => ({
          idCliente: c.idCliente,
          nombre: c.nombre || 'Cliente desconocido',
          totalGastado: parseFloat(c.totalGastado || '0'),
          cantidadFacturas: parseInt(c.cantidadFacturas || '0'),
        })),
      },
      resumen: {
        generadoEn: new Date(),
        hotelId,
      },
    };
  }

  /**
   * FASE 8 P2: Obtener KPIs para Recepcionista
   * Métricas del día: facturas, dinero recibido, pendientes
   */
  async obtenerKpisRecepcionista(hotelId: number, fecha?: Date): Promise<any> {
    const hoy = fecha || new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000);

    // Facturas creadas hoy
    const facturasHoy = await this.facturaRepository
      .createQueryBuilder('f')
      .select('COUNT(*)', 'cantidad')
      .addSelect('SUM(f.total)', 'monto')
      .where('f.idHotel = :hotelId', { hotelId })
      .andWhere('f.createdAt >= :inicio AND f.createdAt < :fin', { inicio: inicioHoy, fin: finHoy })
      .getRawOne();

    // Dinero recibido hoy
    const pagoHoy = await this.dataSource.query(`
      SELECT 
        COUNT(*) as cantidad,
        SUM(monto) as total
      FROM pagos
      WHERE id_factura IN (
        SELECT id FROM facturas WHERE id_hotel = ?
      )
      AND DATE(fecha_pago) = DATE(?)
    `, [hotelId, hoy]);

    // Facturas pendientes de pago
    const pendientes = await this.facturaRepository
      .createQueryBuilder('f')
      .select('COUNT(*)', 'cantidad')
      .addSelect('SUM(f.total)', 'monto')
      .where('f.idHotel = :hotelId', { hotelId })
      .andWhere('f.estadoFactura IN (:...estados)', { estados: ['EMITIDA', 'PAGADA'] })
      .getRawOne();

    // Huéspedes sin facturar (reservas activas sin factura)
    const sinfacturar = await this.dataSource.query(`
      SELECT 
        r.id,
        r.nombreCliente,
        r.cedulaCliente,
        DATEDIFF(CURDATE(), r.fechaIngreso) as diasHotel
      FROM reservas r
      LEFT JOIN facturas f ON r.id = f.id_reserva
      WHERE r.id_hotel = ? 
        AND r.estado NOT IN ('cancelada', 'completada')
        AND f.id IS NULL
      LIMIT 20
    `, [hotelId]);

    return {
      fecha: hoy,
      kpis: {
        facturasHoy: {
          cantidad: parseInt(facturasHoy.cantidad || '0'),
          monto: parseFloat(facturasHoy.monto || '0'),
        },
        dineroRecibidoHoy: {
          cantidad: parseInt(pagoHoy[0]?.cantidad || '0'),
          total: parseFloat(pagoHoy[0]?.total || '0'),
        },
        pendientes: {
          cantidad: parseInt(pendientes.cantidad || '0'),
          monto: parseFloat(pendientes.monto || '0'),
        },
        huespedesSinFacturar: sinfacturar,
      },
      resumen: {
        generadoEn: new Date(),
        hotelId,
      },
    };
  }

  /**
   * FASE 8 P2: Obtener reporte de ingresos agreados por categoría
   * Permite agrupar por: categoría, día, semana, mes
   */
  async obtenerReporteIngresos(
    hotelId: number,
    groupBy: 'categoria' | 'dia' | 'semana' | 'mes' = 'categoria',
    periodo?: { inicio: Date; fin: Date },
  ): Promise<any> {
    const inicio = periodo?.inicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fin = periodo?.fin || new Date();

    let groupByClause = 'cs.nombre';
    let groupByLabel = 'categoria';

    if (groupBy === 'dia') {
      groupByClause = 'DATE(f.createdAt)';
      groupByLabel = 'dia';
    } else if (groupBy === 'semana') {
      groupByClause = 'YEARWEEK(f.createdAt)';
      groupByLabel = 'semana';
    } else if (groupBy === 'mes') {
      groupByClause = 'DATE_FORMAT(f.createdAt, "%Y-%m")';
      groupByLabel = 'mes';
    }

    const ingresos = await this.dataSource.query(`
      SELECT 
        ${groupByClause} as ${groupByLabel},
        COALESCE(cs.nombre, 'Sin categoría') as categoria,
        SUM(df.total) as ingreso,
        COUNT(DISTINCT df.id_factura) as facturas,
        SUM(df.monto_iva) as montoIva,
        SUM(df.monto_inc) as montoInc
      FROM detalle_facturas df
      LEFT JOIN categoria_servicios cs ON df.categoria_servicios_id = cs.id
      WHERE df.id_factura IN (
        SELECT id FROM facturas 
        WHERE id_hotel = ? AND estadoFactura = 'PAGADA'
        AND createdAt BETWEEN ? AND ?
      )
      GROUP BY ${groupByClause}
      ORDER BY ingreso DESC
    `, [hotelId, inicio, fin]);

    return {
      periodo: { inicio, fin },
      groupBy,
      datos: ingresos.map((d) => ({
        ...d,
        ingreso: parseFloat(d.ingreso || '0'),
        montoIva: parseFloat(d.montoIva || '0'),
        montoInc: parseFloat(d.montoInc || '0'),
      })),
      resumen: {
        totalIngresos: ingresos.reduce((sum, d) => sum + parseFloat(d.ingreso || '0'), 0),
        totalIva: ingresos.reduce((sum, d) => sum + parseFloat(d.montoIva || '0'), 0),
        totalInc: ingresos.reduce((sum, d) => sum + parseFloat(d.montoInc || '0'), 0),
      },
    };
  }

  /**
   * FASE 8 P2: Obtener análisis de morosidad
   * Facturas rechazadas, atrasadas, por vencer
   */
  async obtenerAnalisisMorosidad(hotelId: number, diasAtrasados: number = 30): Promise<any> {
    const ahora = new Date();
    const fechaLimite = new Date(ahora.getTime() - diasAtrasados * 24 * 60 * 60 * 1000);

    const morosidad = await this.facturaRepository
      .createQueryBuilder('f')
      .select(`CASE 
        WHEN f.fechaVencimiento < CURDATE() AND f.estadoFactura = 'EMITIDA' THEN 'VENCIDA'
        WHEN f.fechaVencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'POR_VENCER'
        WHEN f.estadoFactura = 'PAGADA' THEN 'PAGADA'
        ELSE 'OTRO'
      `, 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .addSelect('SUM(f.total)', 'monto')
      .where('f.idHotel = :hotelId', { hotelId })
      .where('f.estadoFactura IN (:...estados)', { estados: ['EMITIDA', 'PAGADA'] })
      .groupBy('estado')
      .getRawMany();

    return {
      analisis: morosidad.map((m) => ({
        estado: m.estado,
        cantidad: parseInt(m.cantidad || '0'),
        monto: parseFloat(m.monto || '0'),
      })),
      resumen: {
        generadoEn: new Date(),
        hotelId,
        diasAtrasados,
      },
    };
  }

  /**
   * FASE 9: Listener para evento pedido.creado
   * Cuando se crea un pedido, agregar automáticamente como DetalleFactura
   */
  @OnEventDecorator('pedido.creado')
  async handlePedidoCreado(payload: PedidoCreiadoEvent) {
    try {
      // Obtener o crear factura en estado BORRADOR para esta reserva
      let factura = await this.facturaRepository.findOne({
        where: { idReserva: payload.idReserva, estadoFactura: 'BORRADOR' },
      });

      if (!factura) {
        // Si no existe, crearla
        const numeroFactura = await this.generarNumeroFactura();
        factura = this.facturaRepository.create({
          numeroFactura,
          idReserva: payload.idReserva,
          idCliente: payload.idCliente,
          idHotel: payload.idHotel,
          estadoFactura: 'BORRADOR',
          estado: 'borrador',
          subtotal: 0,
          total: 0,
        });
        await this.facturaRepository.save(factura);
      }

      // Agregar detalle para este pedido
      const detalles = payload.items || [];
      let subtotal = 0;
      let totalIva = 0;

      for (const item of detalles) {
        const itemSubtotal = item.cantidad * item.precio;
        subtotal += itemSubtotal;

        // Crear detalle
        const detalle = this.detalleFacturaRepository.create({
          idFactura: factura.id,
          idPedido: payload.idPedido,
          tipoConcepto: 'servicio',
          descripcion: `${item.nombre} (${new Date(payload.createdAt).toLocaleDateString('es-CO')})`,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          subtotal: itemSubtotal,
          total: itemSubtotal,
          estado: 'PENDIENTE',
        });
        await this.detalleFacturaRepository.save(detalle);
      }

      // Actualizar totales de la factura
      await this.recalcularTotalFactura(factura.id);
    } catch (error) {
      console.warn('Error en handlePedidoCreado:', (error as Error).message);
    }
  }

  /**
   * FASE 9: Listener para evento pedido.estado_cambio
   * Cuando cambia estado de pedido, actualizar DetalleFactura
   */
  @OnEventDecorator('pedido.estado_cambio')
  async handlePedidoEstadoCambio(payload: PedidoEstadoCambioEvent) {
    try {
      // Si el pedido fue entregado, marcar detalles como ENTREGADO
      if (payload.estadoNuevo === 'entregado' && payload.estadoAnterior !== 'entregado') {
        const detalles = await this.detalleFacturaRepository.find({
          where: { idPedido: payload.idPedido },
        });

        for (const detalle of detalles) {
          if (detalle.estado !== 'CANCELADO') {
            detalle.estado = 'ENTREGADO';
            await this.detalleFacturaRepository.save(detalle);

            // Registrar cambio en auditoría
            try {
              const DetalleFacturaCambiosRepo = this.dataSource.getRepository('DetalleFacturaCambio');
              await DetalleFacturaCambiosRepo.save({
                idDetalle: detalle.id,
                tipoCambio: 'CAMBIO_ESTADO',
                descripcion: `Estado actualizado por evento: Pedido entregado`,
                valorAnterior: JSON.stringify({ estado: payload.estadoAnterior }),
                valorNuevo: JSON.stringify({ estado: 'ENTREGADO' }),
                usuarioId: payload.usuarioId,
              });
            } catch (e) {
              console.warn('Error registrando cambio detalle:', (e as Error).message);
            }
          }
        }

        // Recalcular totales de la factura
        const factura = await this.facturaRepository.findOne({
          where: { idReserva: payload.idReserva },
        });
        if (factura) {
          await this.recalcularTotalFactura(factura.id);
        }
      }

      // Si pedido fue cancelado, marcar detalles como CANCELADO
      if (payload.estadoNuevo === 'cancelado' && payload.estadoAnterior !== 'cancelado') {
        const detalles = await this.detalleFacturaRepository.find({
          where: { idPedido: payload.idPedido },
        });

        for (const detalle of detalles) {
          detalle.estado = 'CANCELADO';
          await this.detalleFacturaRepository.save(detalle);

          // Registrar cambio
          try {
            const DetalleFacturaCambiosRepo = this.dataSource.getRepository('DetalleFacturaCambio');
            await DetalleFacturaCambiosRepo.save({
              idDetalle: detalle.id,
              tipoCambio: 'CAMBIO_ESTADO',
              descripcion: `Estado actualizado por evento: Pedido cancelado`,
              valorAnterior: JSON.stringify({ estado: payload.estadoAnterior }),
              valorNuevo: JSON.stringify({ estado: 'CANCELADO' }),
              usuarioId: payload.usuarioId,
            });
          } catch (e) {
            console.warn('Error registrando cambio detalle:', (e as Error).message);
          }
        }

        // Recalcular totales
        const factura = await this.facturaRepository.findOne({
          where: { idReserva: payload.idReserva },
        });
        if (factura) {
          await this.recalcularTotalFactura(factura.id);
        }
      }
    } catch (error) {
      console.warn('Error en handlePedidoEstadoCambio:', (error as Error).message);
    }
  }

  /**
   * FASE 9: Listener para evento pago.registrado
   * Cuando se registra un pago, actualizar estado de factura a PAGADA
   */
  @OnEventDecorator('pago.registrado')
  async handlePagoRegistrado(payload: PagoRegistradoEvent) {
    try {
      const factura = await this.facturaRepository.findOne({
        where: { id: payload.idFactura },
      });

      if (!factura) {
        console.warn(`Factura ${payload.idFactura} no encontrada para pago`);
        return;
      }

      // Si totalPagado >= total, marcar como PAGADA
      if (payload.totalPagado >= factura.total) {
        const estadoAnterior = factura.estadoFactura;

        factura.estadoFactura = 'PAGADA';
        factura.estado = 'pagada';
        await this.facturaRepository.save(factura);

        // Registrar cambio en auditoría
        try {
          const FacturaCambiosRepo = this.dataSource.getRepository('FacturaCambios');
          await FacturaCambiosRepo.save({
            idFactura: factura.id,
            tipoCambio: 'CAMBIO_ESTADO',
            descripcion: `Factura pagada por evento: Pago de $${payload.monto} registrado`,
            valorAnterior: JSON.stringify({ estado: estadoAnterior }),
            valorNuevo: JSON.stringify({ estadoFactura: 'PAGADA', estado: 'pagada' }),
            usuarioId: payload.usuarioId,
          });
        } catch (e) {
          console.warn('Error registrando factura cambio:', (e as Error).message);
        }

        // Emitir evento factura.pagada para webhooks y notificaciones
        const cliente = await this.clienteService.findOne(factura.idCliente);
        const hotel = await this.hotelService.findOne(factura.idHotel);

        this.eventEmitter.emit('factura.pagada', {
          idFactura: factura.id,
          numeroFactura: factura.numeroFactura,
          idCliente: factura.idCliente,
          idHotel: factura.idHotel,
          total: factura.total,
          fechaPago: new Date(),
          cliente: {
            id: cliente.id,
            nombre: cliente.nombre || cliente.apellido || 'Cliente',
            email: cliente.email,
          },
          hotel: {
            id: hotel.id,
            nombre: hotel.nombre,
          },
          timestamp: new Date(),
        } as FacturaPagadaEvent);
      }
    } catch (error) {
      console.warn('Error en handlePagoRegistrado:', (error as Error).message);
    }
  }

  /**
   * Construir XML en formato UBL 2.1 (simulado para preparación DIAN)
   * Nota: Esta es una simulación. La DIAN requiere firma digital y validación específica.
   */
  private construirXmlUBL(
    numeroFactura: string,
    uuid: string,
    reserva: Reserva,
    detalles: Partial<any>[],
    hotel: Hotel,
    montos: { subtotal: number; porcentajeIva: number; montoIva: number; total: number },
  ): string {
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toISOString().split('T')[1].split('.')[0];

    // Formatear número de factura con serie
    const seriePrefix = 'FV'; // FV = Factura de Venta
    const numeroFormateado = `${seriePrefix}-${String(numeroFactura).padStart(8, '0')}`;

    const detallesXml = detalles
      .map(
        (d, idx) => `
    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="EA">${d.cantidad}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="COP">${Number(d.total).toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Description>${d.descripcion || 'Servicio de hospedaje'}</cbc:Description>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="COP">${Number(d.precioUnitario).toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
         xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <!-- METADATOS DIAN -->
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>05</cbc:CustomizationID>
  <cbc:ProfileID>dian</cbc:ProfileID>
  <cbc:ID>${numeroFormateado}</cbc:ID>
  <cbc:UUID>${uuid}</cbc:UUID>
  <cbc:IssueDate>${fecha}</cbc:IssueDate>
  <cbc:IssueTime>${hora}</cbc:IssueTime>
  <cbc:InvoiceTypeCode listID="DIAN 1.0">01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  
  <!-- PERÍODO -->
  <cac:InvoicePeriod>
    <cbc:StartDate>${fecha}</cbc:StartDate>
    <cbc:EndDate>${fecha}</cbc:EndDate>
  </cac:InvoicePeriod>
  
  <!-- REFERENCIA A ORDEN -->
  <cac:OrderReference>
    <cbc:ID>${numeroFormateado}</cbc:ID>
  </cac:OrderReference>
  
  <!-- PROVEEDOR (Hotel) -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:Name>${hotel.nombre}</cbc:Name>
      <cac:PartyIdentification>
        <cbc:ID schemeID="NIT">${hotel.nit}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${hotel.direccion || 'N/A'}</cbc:StreetName>
        <cbc:CityName>${hotel.ciudad || 'N/A'}</cbc:CityName>
        <cbc:CountrySubentity>${hotel.ciudad || 'N/A'}</cbc:CountrySubentity>
        <cac:Country>
          <cbc:IdentificationCode>${hotel.pais || 'CO'}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>${hotel.nombre}</cbc:RegistrationName>
        <cbc:CompanyID schemeID="NIT">${hotel.nit}</cbc:CompanyID>
        <cbc:TaxTypeCode>01</cbc:TaxTypeCode>
        <cac:TaxScheme>
          <cbc:ID>01</cbc:ID>
          <cbc:Name>IVA</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <!-- CLIENTE (Huésped) -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cbc:Name>${reserva.nombreCliente}</cbc:Name>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CC">${reserva.cedulaCliente}</cbc:ID>
      </cac:PartyIdentification>
      <cac:Contact>
        <cbc:ElectronicMail>${reserva.emailCliente}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <!-- TOTALES IMPUESTOS -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="COP">${Number(montos.montoIva).toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="COP">${Number(montos.subtotal).toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="COP">${Number(montos.montoIva).toFixed(2)}</cbc:TaxAmount>
      <cbc:CalculationSequenceNumeric>1</cbc:CalculationSequenceNumeric>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Name>IVA</cbc:Name>
        <cbc:Percent>${montos.porcentajeIva}</cbc:Percent>
        <cbc:TaxExemptionReasonCode>VAT_EXEMPT</cbc:TaxExemptionReasonCode>
        <cac:TaxScheme>
          <cbc:ID>01</cbc:ID>
          <cbc:Name>IVA</cbc:Name>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  
  <!-- TOTALES MONETARIOS -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">${Number(montos.subtotal).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">${Number(montos.subtotal).toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="COP">${Number(montos.total).toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PrepaidAmount currencyID="COP">0.00</cbc:PrepaidAmount>
    <cbc:PayableAmount currencyID="COP">${Number(montos.total).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
  <!-- LÍNEAS DE FACTURA -->
  ${detallesXml}
  
  <!-- NOTAS -->
  <cbc:Note>Documento generado electrónicamente según resolución DIAN</cbc:Note>
  <cbc:Note>⚠️ DOCUMENTO SIMULADO - No es válido fiscalmente sin Firma Digital XMLDSIG y certificado DIAN</cbc:Note>
</Invoice>`;
  }
}

