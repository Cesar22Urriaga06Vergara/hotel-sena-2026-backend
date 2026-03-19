import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
    private dataSource: DataSource,
    @Inject(forwardRef(() => ReservaService))
    private reservaService: ReservaService,
    private impuestoService: ImpuestoService,
    @Inject(forwardRef(() => ClienteService))
    private clienteService: ClienteService,
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
    try {
      // Obtener cliente para su tax_profile
      const cliente = await this.clienteService.findOne(idCliente);
      const taxProfile = cliente.taxProfile || 'RESIDENT';

      // Usar ImpuestoService para calcular desglose
      const calculo = await this.impuestoService.calculateFacturaDesglose(
        detalles,
        hotelId,
        taxProfile,
      );

      return {
        desgloseImpuestos: calculo.subtotalPorCategoria || null,
        desgloseMonetario: calculo.subtotalPorCategoria || null,
        montoIvaTotal: calculo.totales.ivaTotal,
        montoIncTotal: calculo.totales.incTotal,
        subtotalTotal: detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0),
      };
    } catch (error) {
      // Si hay error en ImpuestoService, usar cálculo fallback simple
      const subtotalTotal = detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0);
      const montoIvaTotal = subtotalTotal * 0.19;
      const montoIncTotal = 0;

      return {
        desgloseImpuestos: null,
        desgloseMonetario: null,
        montoIvaTotal,
        montoIncTotal,
        subtotalTotal,
      };
    }
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
        const servicios = await this.servicioRepository.findByIds(Array.from(idsServicios));
        servicios.forEach(s => serviciosMap.set(s.id, s));
      }

      // Procesar items con detección de INC
      for (const pedido of pedidosEntregados) {
        for (const item of pedido.items) {
          const subtotalServicio =
            Number(item.cantidad) * Number(item.precioUnitarioSnapshot);
          
          const servicio = serviciosMap.get(item.idServicio);
          const esAlcoholico = servicio?.esAlcoholico || false;
          
          // Mapear categoría según tipo de servicio
          let categoriaServiciosId = 6; // Room Service por defecto
          
          if (servicio?.categoria === 'cafeteria') {
            categoriaServiciosId = 2; // Restaurante/Cafetería
          } else if (servicio?.categoria === 'minibar') {
            categoriaServiciosId = 3; // Minibar
          } else if (servicio?.categoria === 'lavanderia') {
            categoriaServiciosId = 4; // Lavandería
          } else if (servicio?.categoria === 'spa') {
            categoriaServiciosId = 5; // Spa
          }

          const porcentajeInc = esAlcoholico ? 8 : undefined; // INC 8% solo para alcohólicos
          const montoInc = esAlcoholico ? (subtotalServicio * 0.08) : 0;

          detalles.push({
            tipoConcepto: esAlcoholico ? 'servicio_alcoholico' : 'servicio',
            descripcion: `${item.nombreServicioSnapshot} (${new Date(pedido.fechaPedido).toLocaleDateString('es-CO')})`,
            cantidad: item.cantidad,
            precioUnitario: Number(item.precioUnitarioSnapshot),
            subtotal: subtotalServicio,
            descuento: 0,
            total: subtotalServicio,
            porcentajeInc,
            montoInc,
            idReferencia: item.id,
            categoriaServiciosId,
          });
        }
      }

      // 3. Calcular desglose de impuestos usando ImpuestoService
      // Preparar datos para cálculo (solo los campos necesarios)
      const detallesParaCalculo = detalles.map(d => ({
        categoriaServiciosId: d.categoriaServiciosId || 1,
        subtotal: d.subtotal || 0,
      }));

      const { desgloseImpuestos, desgloseMonetario, montoIvaTotal, montoIncTotal, subtotalTotal } =
        await this.calcularDesgloseImpuestos(
          detallesParaCalculo,
          reserva.idHotel,
          reserva.idCliente,
        );

      const total = subtotalTotal + montoIvaTotal + montoIncTotal;

      // 4. Crear factura
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
      factura.montoInc = montoIncTotal;
      factura.porcentajeInc = montoIncTotal > 0 ? 8 : undefined;
      factura.porcentajeIva = 19;
      factura.montoIva = montoIvaTotal;
      factura.total = total;
      
      // NUEVO: Desglose de impuestos y monetario
      factura.desgloseImpuestos = desgloseImpuestos;
      factura.desgloseMonetario = desgloseMonetario;
      
      // NUEVO: Estado de factura (BORRADOR para nuevas facturas)
      factura.estadoFactura = 'BORRADOR';
      factura.estado = 'pendiente';
      factura.observaciones = '';
      factura.fechaEmision = new Date();
      
      // Preparar datos JSON (simulado)
      factura.jsonData = JSON.stringify({
        numeroFactura,
        uuid: factura.uuid,
        cliente: {
          nombre: reserva.nombreCliente,
          cedula: reserva.cedulaCliente,
          email: reserva.emailCliente,
        },
        detalles,
        montos: { 
          subtotal: subtotalTotal,
          montoInc: montoIncTotal,
          porcentajeIncAplicado: montoIncTotal > 0 ? 8 : null,
          porcentajeIva: 19,
          montoIva: montoIvaTotal,
          total,
        },
        desgloseImpuestos,
        desgloseMonetario,
        fechaEmision: new Date().toISOString(),
      });
      
      // Preparar datos XML (simulado para preparación DIAN)
      factura.xmlData = this.construirXmlUBL(numeroFactura, factura.uuid, reserva, detalles, { 
        subtotal: subtotalTotal,
        porcentajeIva: 19,
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
   * Obtener todas las facturas con filtros opcionales
   */
  async findAll(filters?: {
    idHotel?: number;
    estado?: string;
    idCliente?: number;
  }): Promise<Factura[]> {
    let query = this.facturaRepository.createQueryBuilder('f');

    if (filters?.idHotel) {
      query = query.where('f.idHotel = :idHotel', { idHotel: filters.idHotel });
    }

    if (filters?.estado) {
      if (filters?.idHotel) {
        query = query.andWhere('f.estado = :estado', { estado: filters.estado });
      } else {
        query = query.where('f.estado = :estado', { estado: filters.estado });
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
      relations: ['detalles', 'pagos', 'reserva'],
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
      relations: ['detalles', 'pagos', 'reserva'],
    });

    if (!factura) {
      throw new NotFoundException(
        `No se encontró factura para la reserva ${idReserva}`,
      );
    }

    return factura;
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

    // Validar estado actual permitido para emisión
    const estadosPermitidosParaEmitir = ['BORRADOR', 'EDITABLE'];
    
    if (!estadosPermitidosParaEmitir.includes(factura.estadoFactura)) {
      throw new BadRequestException(
        `No se puede emitir una factura en estado ${factura.estadoFactura}. ` +
        `Estados permitidos: ${estadosPermitidosParaEmitir.join(', ')}`,
      );
    }

    // Registrar cambio anterior
    const estadoAnterior = factura.estadoFactura;
    
    // Cambiar estado y establecer fechas
    factura.estadoFactura = 'EMITIDA';
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
        descripcion: `Factura emitida - Cambio de estado ${estadoAnterior} → EMITIDA`,
        valorAnterior: JSON.stringify({ estadoFactura: estadoAnterior }),
        valorNuevo: JSON.stringify({ estadoFactura: 'EMITIDA', fechaEmision: factura.fechaEmision }),
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

    // No se puede anular desde estados finales
    const estadosFinales = ['PAGADA', 'ANULADA'];
    if (estadosFinales.includes(factura.estadoFactura)) {
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

    // Cambiar estado
    factura.estadoFactura = 'ANULADA';
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
        descripcion: `Factura anulada - Cambio de estado ${estadoAnterior} → ANULADA. Motivo: ${motivo}`,
        valorAnterior: JSON.stringify({ estadoFactura: estadoAnterior }),
        valorNuevo: JSON.stringify({ 
          estadoFactura: 'ANULADA', 
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

    // Validar que esté en estado EMITIDA
    if (factura.estadoFactura !== 'EMITIDA') {
      throw new BadRequestException(
        `No se puede marcar como pagada una factura en estado ${factura.estadoFactura}. ` +
        `Solo se pueden pagar facturas en estado EMITIDA`,
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

    // Cambiar estado
    factura.estadoFactura = 'PAGADA';
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
        descripcion: `Factura marcada como pagada - Cambio de estado ${estadoAnterior} → PAGADA`,
        valorAnterior: JSON.stringify({ estadoFactura: estadoAnterior }),
        valorNuevo: JSON.stringify({ 
          estadoFactura: 'PAGADA',
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

    // Validar transiciones de estado permitidas según máquina de estados
    if (dto.estadoFactura) {
      const estadoActual = factura.estadoFactura;
      const estadoNuevo = dto.estadoFactura;

      const transicionesPermitidas: {
        [key: string]: string[];
      } = {
        BORRADOR: ['EDITABLE', 'EMITIDA', 'ANULADA'],
        EDITABLE: ['EMITIDA', 'BORRADOR', 'ANULADA'],
        EMITIDA: ['PAGADA', 'ANULADA'],
        PAGADA: [], // Estado final
        ANULADA: [], // Estado final
      };

      if (
        !transicionesPermitidas[estadoActual]?.includes(estadoNuevo)
      ) {
        throw new BadRequestException(
          `No se puede cambiar de estado ${estadoActual} a ${estadoNuevo}. ` +
          `Transiciones permitidas: ${transicionesPermitidas[estadoActual]?.join(', ') || 'ninguna'}`,
        );
      }

      // Solo permitir cambios de montos en estados BORRADOR y EDITABLE
      if (
        (dto.montoIva !== undefined ||
          dto.montoInc !== undefined ||
          dto.subtotal !== undefined) &&
        !['BORRADOR', 'EDITABLE'].includes(estadoActual)
      ) {
        throw new BadRequestException(
          `No se pueden actualizar montos en estado ${estadoActual}. ` +
          `Solo está permitido en BORRADOR o EDITABLE.`,
        );
      }
    }

    // Validar que no se edite factura pagada o anulada
    if (['PAGADA', 'ANULADA'].includes(factura.estadoFactura)) {
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
   * Construir XML en formato UBL 2.1 (simulado para preparación DIAN)
   * Nota: Esta es una simulación. La DIAN requiere firma digital y validación específica.
   */
  private construirXmlUBL(
    numeroFactura: string,
    uuid: string,
    reserva: Reserva,
    detalles: Partial<any>[],
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
  
  <!-- PROVEEDOR (Hotel Sena) -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:Name>HOTEL SENA 2026</cbc:Name>
      <cac:PartyIdentification>
        <cbc:ID schemeID="NIT">9001234567-1</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>Carrera 5 No. 26-50</cbc:StreetName>
        <cbc:CityName>Bogotá</cbc:CityName>
        <cbc:CountrySubentity>Bogotá D.C.</cbc:CountrySubentity>
        <cac:Country>
          <cbc:IdentificationCode>CO</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>HOTEL SENA 2026</cbc:RegistrationName>
        <cbc:CompanyID schemeID="NIT">9001234567-1</cbc:CompanyID>
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

