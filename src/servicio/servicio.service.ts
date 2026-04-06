import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Servicio } from './entities/servicio.entity';
import { Pedido } from './entities/pedido.entity';
import { PedidoItem } from './entities/pedido-item.entity';
import { PedidoCambio } from './entities/pedido-cambio.entity';
import { Reserva } from '../reserva/entities/reserva.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdateEstadoPedidoDto } from './dto/update-estado-pedido.dto';
import { PedidoAreaResponseDto } from './dto/pedido-area-response.dto';
import { PedidoAreaReporteDto, AreaReportsResumenDto } from './dto/pedido-area-reporte.dto';
import {
  HotelReportConsolidadoDto,
  HotelKpisDto,
  AreaResumenDto,
  TopAreaDto,
  EstadisticasEntregaConsolidadoDto,
} from './dto/hotel-reporte-consolidado.dto';

@Injectable()
export class ServicioService {
  constructor(
    @InjectRepository(Servicio)
    private servicioRepository: Repository<Servicio>,
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(PedidoItem)
    private pedidoItemRepository: Repository<PedidoItem>,
    @InjectRepository(PedidoCambio)
    private pedidoCambioRepository: Repository<PedidoCambio>,
    @InjectRepository(Reserva)
    private reservaRepository: Repository<Reserva>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  /**
   * Calcular la edad de un cliente basado en fecha de nacimiento
   * Task 2.1: Validación de edad para bebidas alcohólicas
   */
  private calcularEdad(fechaNacimiento: Date): number {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mesDiferencia = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mesDiferencia < 0 || (mesDiferencia === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  // ── MÉTODOS DE SERVICIO (Catálogo) ──

  async crearServicio(dto: CreateServicioDto): Promise<Servicio> {
    const servicio = this.servicioRepository.create(dto);
    return await this.servicioRepository.save(servicio);
  }

  async obtenerServiciosPorHotel(idHotel: number, categoria?: string): Promise<Servicio[]> {
    const query = this.servicioRepository
      .createQueryBuilder('s')
      .where('s.idHotel = :idHotel', { idHotel })
      .andWhere('s.activo = true');

    if (categoria) {
      query.andWhere('s.categoria = :categoria', { categoria });
    }

    return await query.orderBy('s.nombre', 'ASC').getMany();
  }

  async obtenerServiciosPorCategoria(idHotel: number): Promise<Record<string, Servicio[]>> {
    const servicios = await this.obtenerServiciosPorHotel(idHotel);
    const agrupados: Record<string, Servicio[]> = {};

    for (const servicio of servicios) {
      if (!agrupados[servicio.categoria]) {
        agrupados[servicio.categoria] = [];
      }
      agrupados[servicio.categoria].push(servicio);
    }

    return agrupados;
  }

  async obtenerServicio(id: number): Promise<Servicio> {
    const servicio = await this.servicioRepository.findOne({
      where: { id },
    });

    if (!servicio) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }

    return servicio;
  }

  async actualizarServicio(id: number, dto: UpdateServicioDto): Promise<Servicio> {
    await this.obtenerServicio(id); // Validar que existe

    await this.servicioRepository.update(id, dto);
    return await this.obtenerServicio(id);
  }

  async desactivarServicio(id: number): Promise<Servicio> {
    await this.obtenerServicio(id);

    await this.servicioRepository.update(id, { activo: false });
    return await this.obtenerServicio(id);
  }

  // ── MÉTODOS DE PEDIDO ──

  async crearPedido(idCliente: number, dto: CreatePedidoDto): Promise<Pedido> {
    // Validar que la reserva existe y pertenece al cliente
    const reserva = await this.reservaRepository.findOne({
      where: { id: dto.idReserva, idCliente },
    });

    if (!reserva) {
      throw new BadRequestException('Reserva no encontrada o no pertenece al cliente');
    }

    // Log detallado para debugging
    console.log(`[PEDIDO] Validando reserva ${reserva.id}:`, {
      estado: reserva.estadoReserva,
      checkinReal: reserva.checkinReal,
      checkoutReal: reserva.checkoutReal,
    });

    // Validar que la reserva no está completada o cancelada
    if (['completada', 'cancelada'].includes(reserva.estadoReserva?.toLowerCase())) {
      throw new BadRequestException(
        `No se pueden crear pedidos en una reserva ${reserva.estadoReserva}. ` +
        `Solo se permiten pedidos en reservas confirmadas después del check-in.`
      );
    }

    // Validar que el cliente ya hizo check-in
    if (!reserva.checkinReal) {
      throw new BadRequestException(
        'No puedes pedir servicios antes de hacer check-in. ' +
        'Por favor, comunícate con recepción para registrar tu entrada al hotel.'
      );
    }

    // Obtener todos los servicios del pedido
    const idsServicios = dto.items.map((item) => item.idServicio);
    const servicios = await this.servicioRepository.findBy({ id: In(idsServicios) });

    if (servicios.length !== idsServicios.length) {
      throw new BadRequestException('Uno o más servicios no existen');
    }

    // ════════════════════════════════════════════════════════════
    // TASK 2.1: VALIDACIÓN DE EDAD PARA BEBIDAS ALCOHÓLICAS
    // ════════════════════════════════════════════════════════════
    const tieneAlcoholicos = servicios.some((s) => s.esAlcoholico === true);
    if (tieneAlcoholicos) {
      const cliente = await this.clienteRepository.findOne({
        where: { id: idCliente },
      });

      if (!cliente) {
        throw new NotFoundException('Cliente no encontrado');
      }

      // Validar que tiene fecha de nacimiento registrada
      if (!cliente.fechaNacimiento) {
        throw new BadRequestException(
          'No puedes pedir bebidas alcohólicas sin datos de edad verificada. ' +
          'Por favor completa tu perfil en "Mi Cuenta".'
        );
      }

      // Calcular edad y validar >= 21
      const edadCliente = this.calcularEdad(cliente.fechaNacimiento);
      if (edadCliente < 21) {
        throw new BadRequestException(
          `⚠️ Restricción de Edad: Debes ser mayor de 21 años para pedir bebidas alcohólicas. ` +
          `Tu edad actual: ${edadCliente} años.`
        );
      }

      console.log(`[PEDIDO] ✅ Validación de edad OK: Cliente ${idCliente} (${edadCliente} años) puede pedir bebidas alcohólicas`);
    }

    // Validar que todos los servicios son del mismo hotel y categoría
    const primerServicio = servicios[0];
    if (servicios.some((s) => s.idHotel !== reserva.idHotel)) {
      throw new BadRequestException('Todos los servicios deben ser del mismo hotel');
    }

    const categoria = primerServicio.categoria;
    if (servicios.some((s) => s.categoria !== categoria)) {
      throw new BadRequestException('Todos los servicios del pedido deben ser de la misma categoría');
    }

    // Validar disponibilidad de tipo de entrega
    for (const servicio of servicios) {
      if (dto.tipoEntrega === 'delivery' && !servicio.disponibleDelivery) {
        throw new BadRequestException(`${servicio.nombre} no está disponible para delivery`);
      }
      if (dto.tipoEntrega === 'recogida' && !servicio.disponibleRecogida) {
        throw new BadRequestException(`${servicio.nombre} no está disponible para recogida`);
      }
    }

    // Crear el pedido
    let totalPedido = 0;
    const pedido = this.pedidoRepository.create({
      idReserva: dto.idReserva,
      idCliente,
      idHotel: reserva.idHotel,
      tipoEntrega: dto.tipoEntrega,
      estadoPedido: 'pendiente',
      categoria,
      notaCliente: dto.notaCliente,
    });

    const pedidoGuardado = await this.pedidoRepository.save(pedido);

    // Crear items del pedido con snapshot de precios
    const items: PedidoItem[] = [];
    for (const itemDto of dto.items) {
      const servicio = servicios.find((s) => s.id === itemDto.idServicio);
      if (!servicio) {
        throw new BadRequestException(`Servicio con ID ${itemDto.idServicio} no encontrado`);
      }

      const subtotal = servicio.precioUnitario * itemDto.cantidad;
      totalPedido += subtotal;

      const item = this.pedidoItemRepository.create({
        idPedido: pedidoGuardado.id,
        idServicio: itemDto.idServicio,
        cantidad: itemDto.cantidad,
        precioUnitarioSnapshot: servicio.precioUnitario,
        subtotal,
        nombreServicioSnapshot: servicio.nombre,
        observacion: itemDto.observacion,
      });

      items.push(await this.pedidoItemRepository.save(item));
    }

    // Actualizar total del pedido
    pedidoGuardado.totalPedido = totalPedido;
    pedidoGuardado.items = items;
    await this.pedidoRepository.save(pedidoGuardado);

    return await this.obtenerPedido(pedidoGuardado.id);
  }

  async obtenerPedido(id: number): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id },
      relations: ['items', 'items.servicio'],
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    return pedido;
  }

  async actualizarEstadoPedido(
    idPedido: number,
    idEmpleado: number,
    dto: UpdateEstadoPedidoDto,
  ): Promise<Pedido> {
    const pedido = await this.obtenerPedido(idPedido);

    // Validar transiciones de estado aceptadas
    const estadoActual = pedido.estadoPedido;
    const estadoNuevo = dto.estadoPedido;

    const transicionesValidas: Record<string, string[]> = {
      pendiente: ['en_preparacion', 'cancelado'],
      en_preparacion: ['listo', 'entregado', 'cancelado'],
      listo: ['entregado', 'cancelado'],
      entregado: [], // No puede cambiar
      cancelado: [], // No puede cambiar
    };

    if (!transicionesValidas[estadoActual]?.includes(estadoNuevo)) {
      throw new BadRequestException(
        `No se puede pasar de ${estadoActual} a ${estadoNuevo}`,
      );
    }

    // Actualizar el pedido
    pedido.estadoPedido = estadoNuevo;
    pedido.idEmpleadoAtiende = idEmpleado;
    if (dto.notaEmpleado) {
      pedido.notaEmpleado = dto.notaEmpleado;
    }

    // FASE 6: Registrar entrega si estado es 'entregado'
    if (estadoNuevo === 'entregado') {
      pedido.fechaEntrega = new Date();
    }

    await this.pedidoRepository.save(pedido);

    // FASE 6: Registrar cambio de estado en auditoría
    try {
      await this.registrarCambioPedido(
        idPedido,
        estadoActual,
        estadoNuevo,
        idEmpleado,
        dto.notaEmpleado,
      );
    } catch (error) {
      console.warn('Error registrando cambio en auditoría:', error.message);
      // No bloquear operación principal si falla auditoría
    }

    return await this.obtenerPedido(idPedido);
  }

  /**
   * FASE 6: Registrar cambio de estado en tabla pedido_cambios
   * Proporciona auditoría completa de transiciones
   */
  private async registrarCambioPedido(
    idPedido: number,
    estadoAnterior: string,
    estadoNuevo: string,
    usuarioId: number,
    razonCambio?: string,
  ): Promise<void> {
    try {
      const cambio = this.pedidoCambioRepository.create({
        idPedido,
        estadoAnterior,
        estadoNuevo,
        usuarioId,
        razonCambio,
      });
      await this.pedidoCambioRepository.save(cambio);
    } catch (error) {
      // Log solo, no bloquear
      console.warn(`Error al registrar cambio de pedido #${idPedido}:`, error);
    }
  }

  async obtenerPedidosPorCategoria(
    idHotel: number,
    categoria: string,
    estado?: string,
  ): Promise<Pedido[]> {
    const query = this.pedidoRepository
      .createQueryBuilder('p')
      .where('p.idHotel = :idHotel', { idHotel })
      .andWhere('p.categoria = :categoria', { categoria })
      .leftJoinAndSelect('p.items', 'items')
      .leftJoinAndSelect('items.servicio', 'servicio')
      .orderBy('p.fechaPedido', 'DESC');

    // Si no se especifica estado, excluir entregado y cancelado por defecto
    if (!estado || estado === 'activos') {
      query.andWhere('p.estadoPedido NOT IN (:...estados)', {
        estados: ['entregado', 'cancelado'],
      });
    } else if (estado !== 'todos') {
      query.andWhere('p.estadoPedido = :estado', { estado });
    } else {
      // estado=todos: no aplicar filtro adicional
    }

    return await query.getMany();
  }

  async obtenerPedidosCliente(idCliente: number, idReserva: number): Promise<Pedido[]> {
    return await this.pedidoRepository.find({
      where: { idCliente, idReserva },
      relations: ['items', 'items.servicio'],
      order: { fechaPedido: 'DESC' },
    });
  }

  async cancelarPedidoCliente(idPedido: number, idCliente: number): Promise<Pedido> {
    const pedido = await this.obtenerPedido(idPedido);

    if (pedido.idCliente !== idCliente) {
      throw new BadRequestException('Este pedido no te pertenece');
    }

    if (pedido.estadoPedido !== 'pendiente') {
      throw new BadRequestException('Solo puedes cancelar pedidos en estado pendiente');
    }

    pedido.estadoPedido = 'cancelado';
    await this.pedidoRepository.save(pedido);
    return await this.obtenerPedido(idPedido);
  }

  /**
   * Obtener la cuenta de una reserva clientes
   * Suma noches (usando checkinReal o checkinPrevisto) × precio
   * Suma servicios entregados agrupados por categoría
   */
  async obtenerCuentaReserva(idReserva: number): Promise<any> {
    const reserva = await this.reservaRepository.findOne({
      where: { id: idReserva },
      relations: ['tipoHabitacion'],
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${idReserva} no encontrada`);
    }

    // Calcular noches
    const checkin = reserva.checkinReal || reserva.checkinPrevisto;
    const checkout = reserva.checkoutReal || reserva.checkoutPrevisto;

    if (!checkin || !checkout) {
      throw new BadRequestException('La reserva no tiene fechas de check-in y check-out definidas');
    }

    const fechaCheckin = new Date(checkin);
    const fechaCheckout = new Date(checkout);
    const noches = Math.ceil(
      (fechaCheckout.getTime() - fechaCheckin.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (noches <= 0) {
      throw new BadRequestException('Las fechas de check-out deben ser posteriores a check-in');
    }

    // Asegurar que precioNoche es un número (cast decimal a number)
    const precioNoche = parseFloat(String(reserva.precioNocheSnapshot || 0));
    const subtotalHabitacion = noches * precioNoche;

    // Obtener pedidos entregados
    const pedidosEntregados = await this.pedidoRepository.find({
      where: { idReserva, estadoPedido: 'entregado' },
      relations: ['items'],
    });

    let subtotalServicios = 0;
    const resumenPorCategoria: Record<string, number> = {};

    for (const pedido of pedidosEntregados) {
      // Asegurar que totalPedido es un número (cast decimal a number)
      const totalPedido = parseFloat(String(pedido.totalPedido || 0));
      subtotalServicios += totalPedido;

      if (!resumenPorCategoria[pedido.categoria]) {
        resumenPorCategoria[pedido.categoria] = 0;
      }
      resumenPorCategoria[pedido.categoria] += totalPedido;
    }

    // Asegurar que el total es un número
    const totalGeneral = parseFloat((subtotalHabitacion + subtotalServicios).toFixed(2));

    return {
      reserva: {
        id: reserva.id,
        codigoConfirmacion: reserva.codigoConfirmacion,
        checkin: fechaCheckin,
        checkout: fechaCheckout,
        noches,
        idHabitacion: reserva.idHabitacion || 0,
      },
      subtotalHabitacion: parseFloat(subtotalHabitacion.toFixed(2)),
      noches,
      precioNoche,
      pedidos: pedidosEntregados,
      subtotalServicios: parseFloat(subtotalServicios.toFixed(2)),
      totalGeneral,
      resumenPorCategoria,
    };
  }

  /**
   * Obtener estadísticas de servicios/pedidos para un hotel
   * Retorna: total, entregados, pendientes, ingresos brutos por categoría
   */
  async getEstadisticasPedidos(idHotel: number, periodo?: 'mes_actual' | 'trimestre_actual' | 'anio_actual'): Promise<any> {
    const query = this.pedidoRepository
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.items', 'items')
      .where('pedido.id_hotel = :idHotel', { idHotel });

    // Filtrar por período si es especificado
    if (periodo) {
      const ahora = new Date();
      let fechaInicio = new Date();

      if (periodo === 'mes_actual') {
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      } else if (periodo === 'trimestre_actual') {
        const trimestre = Math.floor(ahora.getMonth() / 3);
        fechaInicio = new Date(ahora.getFullYear(), trimestre * 3, 1);
      } else if (periodo === 'anio_actual') {
        fechaInicio = new Date(ahora.getFullYear(), 0, 1);
      }

      query.andWhere('pedido.fechaPedido >= :fechaInicio', { fechaInicio });
    }

    const pedidos = await query.getMany();

    // Calcular estadísticas
    const total = pedidos.length;
    const entregados = pedidos.filter(p => p.estadoPedido === 'entregado').length;
    const pendientes = pedidos.filter(p => p.estadoPedido === 'pendiente').length;
    const en_preparacion = pedidos.filter(p => p.estadoPedido === 'en_preparacion').length;
    const cancelados = pedidos.filter(p => p.estadoPedido === 'cancelado').length;

    // Calcular ingresos brutos y distribuir por categoría
    const ingresoBrutoPorCategoria: Record<string, number> = {};
    let ingresosBrutos = 0;

    for (const pedido of pedidos) {
      if (['entregado', 'en_preparacion'].includes(pedido.estadoPedido)) {
        const totalPedido = pedido.totalPedido || 0;
        ingresosBrutos += totalPedido;

        const categoria = pedido.categoria || 'sin_categoría';
        if (!ingresoBrutoPorCategoria[categoria]) {
          ingresoBrutoPorCategoria[categoria] = 0;
        }
        ingresoBrutoPorCategoria[categoria] += totalPedido;
      }
    }

    // Ticket promedio
    const ticketPromedio = entregados > 0 ? ingresosBrutos / entregados : 0;

    // Tasa de entrega
    const tasaEntrega = total > 0 ? (entregados / total * 100).toFixed(2) : '0.00';

    return {
      idHotel,
      periodo: periodo || 'todos',
      totalPedidos: total,
      pedidosEntregados: entregados,
      pedidosPendientes: pendientes,
      pedidosEnPreparacion: en_preparacion,
      pedidosCancelados: cancelados,
      ingresosBrutos: parseFloat(ingresosBrutos.toFixed(2)),
      ingresoBrutoPorCategoria: Object.fromEntries(
        Object.entries(ingresoBrutoPorCategoria).map(([k, v]) => [k, parseFloat(v.toFixed(2))])
      ),
      ticketPromedio: parseFloat(ticketPromedio.toFixed(2)),
      tasaEntrega: parseFloat(tasaEntrega),
    };
  }

  // ──────────────────────────────────────────────────────────────
  // ── MÉTODOS SAAS - SEGREGACIÓN DE VISTAS PARA ÁREAS ──
  // ──────────────────────────────────────────────────────────────

  /**
   * Mapea Pedidos al DTO operacional (SIN datos financieros)
   * ✅ Seguro para: tableros operacionales, listas de pedidos
   * ❌ Excluye: totalPedido, idCliente, precios unitarios
   */
  private mapPedidosParaArea(pedidos: Pedido[]): PedidoAreaResponseDto[] {
    return pedidos.map((p) => ({
      id: p.id,
      idReserva: p.idReserva,
      tipoEntrega: p.tipoEntrega as 'delivery' | 'recogida',
      estadoPedido: p.estadoPedido as any,
      categoria: p.categoria,
      notaCliente: p.notaCliente,
      notaEmpleado: p.notaEmpleado,
      fechaPedido: p.fechaPedido,
      items: (p.items || []).map((i) => ({
        id: i.id,
        idServicio: i.idServicio,
        nombreServicioSnapshot: i.nombreServicioSnapshot,
        cantidad: i.cantidad,
        observacion: i.observacion,
        // ❌ NO incluir: precioUnitarioSnapshot, subtotal
      })),
      // ❌ NO incluir: totalPedido, idCliente
    }));
  }

  /**
   * Mapea Pedidos al DTO de reporte (CON datos financieros)
   * ⚠️ Sensible: rigged for reports/auditing
   * ✅ Incluye: totalPedido, desglose de precios para análisis
   * ❌ Aún excluye: idCliente (dato personal)
   */
  private mapPedidosParaReporte(pedidos: Pedido[]): PedidoAreaReporteDto[] {
    return pedidos.map((p) => ({
      id: p.id,
      idReserva: p.idReserva,
      tipoEntrega: p.tipoEntrega as 'delivery' | 'recogida',
      estadoPedido: p.estadoPedido as any,
      categoria: p.categoria,
      notaCliente: p.notaCliente,
      notaEmpleado: p.notaEmpleado,
      fechaPedido: p.fechaPedido,
      totalPedido: parseFloat(String(p.totalPedido || 0)),
      items: (p.items || []).map((i) => ({
        id: i.id,
        idServicio: i.idServicio,
        nombreServicioSnapshot: i.nombreServicioSnapshot,
        cantidad: i.cantidad,
        precioUnitarioSnapshot: parseFloat(String(i.precioUnitarioSnapshot || 0)),
        subtotal: parseFloat(String(i.subtotal || 0)),
        observacion: i.observacion,
      })),
      // ❌ NO incluir: idCliente (es dato personal)
    }));
  }

  /**
   * Obtener pedidos para operación del área (SIN datos financieros)
   * Reemplaza obtenerPedidosPorCategoria() en el endpoint operacional
   */
  async obtenerPedidosAreaOperacional(
    idHotel: number,
    categoria: string,
    estado?: string,
  ): Promise<PedidoAreaResponseDto[]> {
    const query = this.pedidoRepository
      .createQueryBuilder('p')
      .where('p.idHotel = :idHotel', { idHotel })
      .andWhere('p.categoria = :categoria', { categoria })
      .leftJoinAndSelect('p.items', 'items')
      .leftJoinAndSelect('items.servicio', 'servicio')
      .orderBy('p.fechaPedido', 'DESC');

    // Si no se especifica estado, excluir entregado y cancelado por defecto
    if (!estado || estado === 'activos') {
      query.andWhere('p.estadoPedido NOT IN (:...estados)', {
        estados: ['entregado', 'cancelado'],
      });
    } else if (estado !== 'todos') {
      query.andWhere('p.estadoPedido = :estado', { estado });
    } else {
      // estado=todos: no aplicar filtro adicional
    }

    const pedidos = await query.getMany();

    // Mapear al DTO seguro (sin datos financieros)
    return this.mapPedidosParaArea(pedidos);
  }

  /**
   * Obtener reporte financiero de área (CON datos auditados)
   * Endpoint segregado: /servicios/reportes/area/:idHotel/:categoria
   * Requiere: @UseInterceptors(AreaAuditInterceptor)
   *
   * Retorna:
   * - Listado de pedidos con precios (PedidoAreaReporteDto[])
   * - Resumen agregado (AreaReportsResumenDto)
   */
  async obtenerReporteArea(
    idHotel: number,
    categoria: string,
    fechaDesde?: Date,
    fechaHasta?: Date,
  ): Promise<{
    detalle: PedidoAreaReporteDto[];
    resumen: AreaReportsResumenDto;
  }> {
    // Valores por defecto: últimos 30 días
    const hasta = fechaHasta || new Date();
    const desde = fechaDesde || new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Obtener todos los pedidos en el rango
    const query = this.pedidoRepository
      .createQueryBuilder('p')
      .where('p.idHotel = :idHotel', { idHotel })
      .andWhere('p.categoria = :categoria', { categoria })
      .andWhere('p.fechaPedido BETWEEN :desde AND :hasta', {
        desde,
        hasta,
      })
      .leftJoinAndSelect('p.items', 'items')
      .orderBy('p.fechaPedido', 'DESC');

    const todosLosPedidos = await query.getMany();

    // Mapear al DTO de reporte
    const detalle = this.mapPedidosParaReporte(todosLosPedidos);

    // Calcular resumen
    const pendientes = todosLosPedidos.filter((p) => p.estadoPedido === 'pendiente');
    const enPreparacion = todosLosPedidos.filter((p) => p.estadoPedido === 'en_preparacion');
    const listos = todosLosPedidos.filter((p) => p.estadoPedido === 'listo');
    const entregados = todosLosPedidos.filter((p) => p.estadoPedido === 'entregado');
    const cancelados = todosLosPedidos.filter((p) => p.estadoPedido === 'cancelado');

    // Sumas financieras
    const ingresoTotal = todosLosPedidos.reduce(
      (sum, p) => sum + parseFloat(String(p.totalPedido || 0)),
      0,
    );

    const ingresoPendiente = [...pendientes, ...enPreparacion, ...listos].reduce(
      (sum, p) => sum + parseFloat(String(p.totalPedido || 0)),
      0,
    );

    const ingresoEntregado = entregados.reduce(
      (sum, p) => sum + parseFloat(String(p.totalPedido || 0)),
      0,
    );

    // Top productos
    const productosMap = new Map<
      number,
      { nombre: string; cantidad: number; ingresos: number }
    >();
    for (const pedido of todosLosPedidos) {
      for (const item of pedido.items || []) {
        if (!productosMap.has(item.idServicio)) {
          productosMap.set(item.idServicio, {
            nombre: item.nombreServicioSnapshot,
            cantidad: 0,
            ingresos: 0,
          });
        }
        const prod = productosMap.get(item.idServicio);
        if (prod) {
          prod.cantidad += item.cantidad;
          prod.ingresos += parseFloat(String(item.subtotal || 0));
        }
      }
    }

    const topProductos = Array.from(productosMap.entries())
      .map(([idServicio, data]) => ({
        idServicio,
        nombre: data.nombre,
        cantidadVendida: data.cantidad,
        ingresoGenerado: parseFloat(data.ingresos.toFixed(2)),
      }))
      .sort((a, b) => b.ingresoGenerado - a.ingresoGenerado)
      .slice(0, 10);

    // Desglose por tipo de entrega
    const delivery = todosLosPedidos.filter((p) => p.tipoEntrega === 'delivery');
    const recogida = todosLosPedidos.filter((p) => p.tipoEntrega === 'recogida');

    const ingresoDelivery = delivery.reduce(
      (sum, p) => sum + parseFloat(String(p.totalPedido || 0)),
      0,
    );

    const ingresoRecogida = recogida.reduce(
      (sum, p) => sum + parseFloat(String(p.totalPedido || 0)),
      0,
    );

    // Construir resumen
    const resumen: AreaReportsResumenDto = {
      categoria,
      periodo: {
        desde,
        hasta,
      },
      contadores: {
        total: todosLosPedidos.length,
        pendiente: pendientes.length,
        en_preparacion: enPreparacion.length,
        listo: listos.length,
        entregado: entregados.length,
        cancelado: cancelados.length,
      },
      financiero: {
        ingresoTotal: parseFloat(ingresoTotal.toFixed(2)),
        ingresoPendiente: parseFloat(ingresoPendiente.toFixed(2)),
        ingresoEntregado: parseFloat(ingresoEntregado.toFixed(2)),
        promedioPorPedido:
          todosLosPedidos.length > 0
            ? parseFloat((ingresoTotal / todosLosPedidos.length).toFixed(2))
            : 0,
        ticketPromedio:
          entregados.length > 0
            ? parseFloat((ingresoEntregado / entregados.length).toFixed(2))
            : 0,
      },
      topProductos,
      estadisticasEntrega: {
        delivery: {
          cantidad: delivery.length,
          ingresos: parseFloat(ingresoDelivery.toFixed(2)),
        },
        recogida: {
          cantidad: recogida.length,
          ingresos: parseFloat(ingresoRecogida.toFixed(2)),
        },
      },
      consultadoEn: new Date(),
      consultadoPor: {
        rol: 'area-employee', // sera sobrescrito por el controlador
      },
    };

    return { detalle, resumen };
  }

  /**
   * Obtener reporte CONSOLIDADO a nivel HOTEL
   * ✅ Seguro para: Admin, SuperAdmin
   * 📊 Agrupa datos de TODAS las áreas
   *
   * Retorna:
   * - KPIs del hotel
   * - Top 5 áreas
   * - Detalles de cada área
   * - Tendencias (últimos 30 días)
   * - Estadísticas de entrega
   */
  async obtenerReporteHotelConsolidado(
    idHotel: number,
    fechaDesde?: Date,
    fechaHasta?: Date,
  ): Promise<HotelReportConsolidadoDto> {
    // Valores por defecto: últimos 30 días
    const hasta = fechaHasta || new Date();
    const desde = fechaDesde || new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Obtener TODOS los pedidos del hotel en el rango
    const todosLosPedidos = await this.pedidoRepository
      .createQueryBuilder('p')
      .where('p.idHotel = :idHotel', { idHotel })
      .andWhere('p.fechaPedido BETWEEN :desde AND :hasta', { desde, hasta })
      .leftJoinAndSelect('p.items', 'items')
      .orderBy('p.fechaPedido', 'DESC')
      .getMany();

    // ═══════════════════════════════════════════════════════════════
    // 1. CALCULAR KPIs GLOBALES
    // ═══════════════════════════════════════════════════════════════

    const totalPedidos = todosLosPedidos.length;

    // Sumar ingresos
    const ingresoTotal = todosLosPedidos.reduce(
      (sum, p) => sum + parseFloat(String(p.totalPedido || 0)),
      0,
    );

    // Estado
    const entregados = todosLosPedidos.filter((p) => p.estadoPedido === 'entregado');
    const ingresoEntregado = entregados.reduce(
      (sum, p) => sum + parseFloat(String(p.totalPedido || 0)),
      0,
    );

    const ingresoPendiente = todosLosPedidos
      .filter((p) => ['pendiente', 'en_preparacion', 'listo'].includes(p.estadoPedido))
      .reduce((sum, p) => sum + parseFloat(String(p.totalPedido || 0)), 0);

    const ticketPromedioGlobal =
      totalPedidos > 0 ? parseFloat((ingresoTotal / totalPedidos).toFixed(2)) : 0;

    const noches = Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24));
    const pedidosPorDia = noches > 0 ? parseFloat((totalPedidos / noches).toFixed(2)) : 0;

    const tasaEntregaGlobal =
      totalPedidos > 0
        ? parseFloat(((entregados.length / totalPedidos) * 100).toFixed(2))
        : 0;

    // ═══════════════════════════════════════════════════════════════
    // 2. AGRUPAR POR ÁREA
    // ═══════════════════════════════════════════════════════════════

    const porArea = new Map<string, Pedido[]>();
    for (const pedido of todosLosPedidos) {
      const cat = pedido.categoria || 'sin_categoria';
      if (!porArea.has(cat)) {
        porArea.set(cat, []);
      }
      const areaArray = porArea.get(cat);
      if (areaArray) {
        areaArray.push(pedido);
      }
    }

    // Calcular resumen por área
    const areasDetalle: AreaResumenDto[] = [];
    const topAreas: { categoria: string; ingresos: number; pedidos: number }[] = [];

    for (const [categoria, pedidos] of porArea.entries()) {
      const entregadosArea = pedidos.filter((p) => p.estadoPedido === 'entregado');
      const ingresoTotalArea = pedidos.reduce(
        (sum, p) => sum + parseFloat(String(p.totalPedido || 0)),
        0,
      );
      const ingresoEntregadoArea = entregadosArea.reduce(
        (sum, p) => sum + parseFloat(String(p.totalPedido || 0)),
        0,
      );
      const ingresoPendienteArea = pedidos
        .filter((p) => ['pendiente', 'en_preparacion', 'listo'].includes(p.estadoPedido))
        .reduce((sum, p) => sum + parseFloat(String(p.totalPedido || 0)), 0);

      const ticketPromedioArea =
        pedidos.length > 0 ? parseFloat((ingresoTotalArea / pedidos.length).toFixed(2)) : 0;

      const tasaEntregaArea =
        pedidos.length > 0
          ? parseFloat(((entregadosArea.length / pedidos.length) * 100).toFixed(2))
          : 0;

      // Tipo preferido
      const deliveries = pedidos.filter((p) => p.tipoEntrega === 'delivery').length;
      const recogidas = pedidos.filter((p) => p.tipoEntrega === 'recogida').length;
      const tipoPrefijo = deliveries >= recogidas ? 'delivery' : 'recogida';

      const resumenArea: AreaResumenDto = {
        categoria,
        totalPedidos: pedidos.length,
        ingresoTotal: parseFloat(ingresoTotalArea.toFixed(2)),
        ingresoEntregado: parseFloat(ingresoEntregadoArea.toFixed(2)),
        ingresoPendiente: parseFloat(ingresoPendienteArea.toFixed(2)),
        ticketPromedio: ticketPromedioArea,
        tasaEntrega: tasaEntregaArea,
        tipoPrefijo,
        contadores: {
          pendiente: pedidos.filter((p) => p.estadoPedido === 'pendiente').length,
          en_preparacion: pedidos.filter((p) => p.estadoPedido === 'en_preparacion').length,
          listo: pedidos.filter((p) => p.estadoPedido === 'listo').length,
          entregado: entregadosArea.length,
          cancelado: pedidos.filter((p) => p.estadoPedido === 'cancelado').length,
        },
      };

      areasDetalle.push(resumenArea);
      topAreas.push({
        categoria,
        ingresos: parseFloat(ingresoTotalArea.toFixed(2)),
        pedidos: pedidos.length,
      });
    }

    // Ordenar y tomar top 5
    topAreas.sort((a, b) => b.ingresos - a.ingresos);
    const top5Areas: TopAreaDto[] = topAreas.slice(0, 5).map((area, idx) => ({
      ranking: idx + 1,
      categoria: area.categoria,
      ingresos: area.ingresos,
      pedidos: area.pedidos,
      ticketPromedio: area.pedidos > 0 ? parseFloat((area.ingresos / area.pedidos).toFixed(2)) : 0,
      porcentajeDelTotal:
        ingresoTotal > 0
          ? parseFloat(((area.ingresos / ingresoTotal) * 100).toFixed(2))
          : 0,
    }));

    // ═══════════════════════════════════════════════════════════════
    // 3. ESTADÍSTICAS DE ENTREGA
    // ═══════════════════════════════════════════════════════════════

    const deliveries = todosLosPedidos.filter((p) => p.tipoEntrega === 'delivery');
    const recogidas = todosLosPedidos.filter((p) => p.tipoEntrega === 'recogida');

    const ingresoDelivery = deliveries.reduce(
      (sum, p) => sum + parseFloat(String(p.totalPedido || 0)),
      0,
    );
    const ingresoRecogida = recogidas.reduce(
      (sum, p) => sum + parseFloat(String(p.totalPedido || 0)),
      0,
    );

    const estadisticasEntrega: EstadisticasEntregaConsolidadoDto = {
      delivery: {
        cantidad: deliveries.length,
        ingresos: parseFloat(ingresoDelivery.toFixed(2)),
        porcentaje:
          totalPedidos > 0
            ? parseFloat(((deliveries.length / totalPedidos) * 100).toFixed(2))
            : 0,
      },
      recogida: {
        cantidad: recogidas.length,
        ingresos: parseFloat(ingresoRecogida.toFixed(2)),
        porcentaje:
          totalPedidos > 0
            ? parseFloat(((recogidas.length / totalPedidos) * 100).toFixed(2))
            : 0,
      },
    };

    // ═══════════════════════════════════════════════════════════════
    // 4. TENDENCIAS (Últimos 30 días, por día)
    // ═══════════════════════════════════════════════════════════════

    const tendenciasMap = new Map<string, { pedidos: number; ingresos: number }>();

    for (const pedido of todosLosPedidos) {
      const fecha = new Date(pedido.fechaPedido);
      fecha.setHours(0, 0, 0, 0);
      const fechaStr = fecha.toISOString().split('T')[0];

      if (!tendenciasMap.has(fechaStr)) {
        tendenciasMap.set(fechaStr, { pedidos: 0, ingresos: 0 });
      }

      const tendencia = tendenciasMap.get(fechaStr);
      if (tendencia) {
        tendencia.pedidos += 1;
        tendencia.ingresos += parseFloat(String(pedido.totalPedido || 0));
      }
    }

    const tendencias = Array.from(tendenciasMap.entries())
      .map(([fechaStr, data]) => ({
        fecha: new Date(fechaStr),
        pedidos: data.pedidos,
        ingresos: parseFloat(data.ingresos.toFixed(2)),
      }))
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

    // ═══════════════════════════════════════════════════════════════
    // 5. CONSTRUIR RESPUESTA
    // ═══════════════════════════════════════════════════════════════

    const kpis: HotelKpisDto = {
      totalPedidos,
      totalIngresos: parseFloat(ingresoTotal.toFixed(2)),
      ingresoEntregado: parseFloat(ingresoEntregado.toFixed(2)),
      ingresoPendiente: parseFloat(ingresoPendiente.toFixed(2)),
      ticketPromedio: ticketPromedioGlobal,
      pedidosPorDia,
      tasaEntregaGlobal,
      areaConMasIngresos: {
        categoria: top5Areas[0]?.categoria || 'N/A',
        ingresos: top5Areas[0]?.ingresos || 0,
      },
      pedidosHoy: todosLosPedidos.filter((p) => {
        const hoy = new Date();
        const fechaPedido = new Date(p.fechaPedido);
        return fechaPedido.toDateString() === hoy.toDateString();
      }).length,
      ingresosHoy: todosLosPedidos
        .filter((p) => {
          const hoy = new Date();
          const fechaPedido = new Date(p.fechaPedido);
          return fechaPedido.toDateString() === hoy.toDateString();
        })
        .reduce((sum, p) => sum + parseFloat(String(p.totalPedido || 0)), 0),
      periodo: { desde, hasta },
    };

    const reporte: HotelReportConsolidadoDto = {
      idHotel,
      kpis,
      topAreas: top5Areas,
      areasDetalle: areasDetalle.sort((a, b) => b.ingresoTotal - a.ingresoTotal),
      estadisticasEntrega,
      tendencias,
      consultadoEn: new Date(),
      consultadoPor: {
        idAdmin: 0, // será sobrescrito por el controlador
        rol: 'admin',
      },
    };

    return reporte;
  }
}

