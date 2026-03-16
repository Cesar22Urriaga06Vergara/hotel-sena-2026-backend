import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from './entities/servicio.entity';
import { Pedido } from './entities/pedido.entity';
import { PedidoItem } from './entities/pedido-item.entity';
import { Reserva } from '../reserva/entities/reserva.entity';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdateEstadoPedidoDto } from './dto/update-estado-pedido.dto';

@Injectable()
export class ServicioService {
  constructor(
    @InjectRepository(Servicio)
    private servicioRepository: Repository<Servicio>,
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(PedidoItem)
    private pedidoItemRepository: Repository<PedidoItem>,
    @InjectRepository(Reserva)
    private reservaRepository: Repository<Reserva>,
  ) {}

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
    const servicios = await this.servicioRepository.findByIds(idsServicios);

    if (servicios.length !== idsServicios.length) {
      throw new BadRequestException('Uno o más servicios no existen');
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

    await this.pedidoRepository.save(pedido);
    return await this.obtenerPedido(idPedido);
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
    if (!estado) {
      query.andWhere('p.estadoPedido NOT IN (:...estados)', {
        estados: ['entregado', 'cancelado'],
      });
    } else {
      query.andWhere('p.estadoPedido = :estado', { estado });
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

      query.andWhere('pedido.createdAt >= :fechaInicio', { fechaInicio });
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
}
