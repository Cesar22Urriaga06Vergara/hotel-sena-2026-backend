import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, MoreThan, Between } from 'typeorm';
import { Reserva } from './entities/reserva.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';
import { TipoHabitacion } from '../tipo-habitacion/entities/tipo-habitacion.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { DisponibilidadQueryDto } from './dto/disponibilidad-query.dto';
import { DisponibilidadResponseDto, HabitacionDisponibleDto } from './dto/disponibilidad.dto';
import { FacturaService } from '../factura/factura.service';
import { Factura } from '../factura/entities/factura.entity';

@Injectable()
export class ReservaService {
  constructor(
    @InjectRepository(Reserva)
    private reservaRepository: Repository<Reserva>,
    @InjectRepository(Habitacion)
    private habitacionRepository: Repository<Habitacion>,
    @InjectRepository(TipoHabitacion)
    private tipoHabitacionRepository: Repository<TipoHabitacion>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    private dataSource: DataSource,
    @Inject(forwardRef(() => FacturaService))
    private facturaService: FacturaService,
  ) {}

  /**
   * Enriquecer reservas con datos de cliente si están faltando
   * Método auxiliar para rellenar campos desnormalizados que puedan haber quedado NULL
   */
  private async enriquecerReservas(reservas: Reserva[]): Promise<Reserva[]> {
    // Simplificado: solo retornar las reservas como están
    // La población de cliente ya se hace en create(), así que no es necesario rellenar después
    return reservas;
  }

  /**
   * Generar código de confirmación único
   */
  private generarCodigoConfirmacion(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RES-${timestamp}-${random}`;
  }

  /**
   * Consultar disponibilidad de habitaciones
   * IMPORTANTE: No usa transacción, solo consulta
   */
  async consultarDisponibilidad(
    query: DisponibilidadQueryDto,
  ): Promise<DisponibilidadResponseDto> {
    const checkinFecha = new Date(query.checkinFecha);
    const checkoutFecha = new Date(query.checkoutFecha);

    // Validaciones básicas
    if (checkinFecha >= checkoutFecha) {
      throw new BadRequestException('La fecha de check-in debe ser anterior a check-out');
    }

    // Calcular número de noches
    const numeroNoches = Math.ceil(
      (checkoutFecha.getTime() - checkinFecha.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Obtener todas las habitaciones del hotel que están disponibles por estado
    const habitacionesDisponibles = await this.habitacionRepository.find({
      where: {
        idHotel: query.idHotel,
        estado: 'disponible',
      },
      relations: ['tipoHabitacion', 'tipoHabitacion.amenidades'],
    });

    if (habitacionesDisponibles.length === 0) {
      return {
        idHotel: query.idHotel,
        checkinFecha,
        checkoutFecha,
        numeroNoches,
        habitacionesDisponibles: [],
        totalDisponibles: 0,
        tiposHabitacionDisponibles: [],
      };
    }

    // Obtener todas las reservas que solapan con el rango de fechas solicitado
    const reservasConflictivas = await this.reservaRepository.find({
      where: [
        {
          idHotel: query.idHotel,
          estadoReserva: 'reservada', // Contar reservas reservadas
          checkinPrevisto: LessThan(checkoutFecha),
          checkoutPrevisto: MoreThan(checkinFecha),
        },
        {
          idHotel: query.idHotel,
          estadoReserva: 'confirmada', // Contar reservas confirmadas
          checkinPrevisto: LessThan(checkoutFecha),
          checkoutPrevisto: MoreThan(checkinFecha),
        },
      ],
    });

    // Crear un set de IDs de habitaciones ocupadas
    const habitacionesOcupadasIds = new Set(
      reservasConflictivas
        .filter(r => r.idHabitacion)
        .map(r => r.idHabitacion),
    );

    // Filtrar habitaciones disponibles
    let habitacionesResult = habitacionesDisponibles.filter(
      h => !habitacionesOcupadasIds.has(h.id),
    );

    // Aplicar filtro por tipo si se proporciona
    if (query.idTipoHabitacion) {
      habitacionesResult = habitacionesResult.filter(
        h => h.idTipoHabitacion === query.idTipoHabitacion,
      );
    }

    // Mapear a DTO
    const habitacionesDisponiblesDto: HabitacionDisponibleDto[] =
      habitacionesResult.map(h => ({
        id: h.id,
        numeroHabitacion: h.numeroHabitacion,
        piso: h.piso,
        imagenes: h.imagenes,
        tipoHabitacionId: h.idTipoHabitacion,
        tipoHabitacionNombre: h.tipoHabitacion?.nombreTipo || '',
        capacidadPersonas: h.tipoHabitacion?.capacidadPersonas || 0,
        precioBase: h.tipoHabitacion?.precioBase || 0,
        amenidades: h.tipoHabitacion?.amenidades?.map(a => ({
          id: a.id,
          nombre: a.nombre,
          icono: a.icono,
        })) || [],
        disponibleDesde: checkinFecha,
        disponibleHasta: checkoutFecha,
      }));

    // Agrupar por tipo de habitación para el resumen
    const tiposMap = new Map<number, { nombre: string; cantidad: number }>();
    habitacionesDisponiblesDto.forEach(h => {
      const existing = tiposMap.get(h.tipoHabitacionId);
      if (existing) {
        existing.cantidad++;
      } else {
        tiposMap.set(h.tipoHabitacionId, {
          nombre: h.tipoHabitacionNombre,
          cantidad: 1,
        });
      }
    });

    const tiposHabitacionDisponibles = Array.from(tiposMap.entries()).map(
      ([id, data]) => ({
        id,
        ...data,
      }),
    );

    return {
      idHotel: query.idHotel,
      checkinFecha,
      checkoutFecha,
      numeroNoches,
      habitacionesDisponibles: habitacionesDisponiblesDto,
      totalDisponibles: habitacionesDisponiblesDto.length,
      tiposHabitacionDisponibles,
    };
  }

  /**
   * Crear una nueva reserva
   * IMPORTANTE: Usa transacción con bloqueo para evitar race conditions
   */
  async create(createReservaDto: CreateReservaDto): Promise<Reserva> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const checkinPrevisto = new Date(createReservaDto.checkinPrevisto);
      const checkoutPrevisto = new Date(createReservaDto.checkoutPrevisto);

      // Validaciones
      if (checkinPrevisto >= checkoutPrevisto) {
        throw new BadRequestException('La fecha de check-in debe ser anterior a check-out');
      }

      // Obtener datos del cliente
      const cliente = await queryRunner.manager.findOne(Cliente, {
        where: { id: createReservaDto.idCliente },
      });

      if (!cliente) {
        throw new NotFoundException('Cliente no encontrado');
      }

      // Obtener el tipo de habitación
      const tipoHabitacion = await queryRunner.manager.findOne(
        TipoHabitacion,
        {
          where: { id: createReservaDto.idTipoHabitacion },
        },
      );

      if (!tipoHabitacion) {
        throw new NotFoundException('Tipo de habitación no encontrado');
      }

      // BLOQUEO: Obtener una habitación disponible del tipo solicitado con SELECT FOR UPDATE
      const habitacionDisponible = await queryRunner.manager
        .createQueryBuilder(Habitacion, 'h')
        .leftJoinAndSelect(
          Reserva,
          'r',
          `r.id_habitacion = h.id AND 
           r.id_hotel = :idHotel AND 
           r.estado_reserva = 'confirmada' AND 
           r.checkin_previsto < :checkoutFecha AND 
           r.checkout_previsto > :checkinFecha`,
          {
            idHotel: createReservaDto.idHotel,
            checkinFecha: checkinPrevisto,
            checkoutFecha: checkoutPrevisto,
          },
        )
        .where('h.id_hotel = :idHotel', { idHotel: createReservaDto.idHotel })
        .andWhere('h.id_tipo_habitacion = :idTipoHabitacion', {
          idTipoHabitacion: createReservaDto.idTipoHabitacion,
        })
        .andWhere('h.estado = :estado', { estado: 'disponible' })
        .andWhere('r.id IS NULL') // No tiene reservas conflictivas
        .setLock('pessimistic_write') // Bloqueo exclusivo
        .getOne();

      if (!habitacionDisponible) {
        throw new ConflictException(
          'No hay habitaciones disponibles de este tipo para las fechas solicitadas',
        );
      }

      // Crear la reserva
      const codigoConfirmacion = this.generarCodigoConfirmacion();
      const nuevaReserva = queryRunner.manager.create(Reserva, {
        ...createReservaDto,
        idHabitacion: habitacionDisponible.id,
        checkinPrevisto,
        checkoutPrevisto,
        estadoReserva: 'reservada',
        codigoConfirmacion,
        precioNocheSnapshot: tipoHabitacion.precioBase,
        // Datos del cliente obtenidos de la base de datos
        nombreCliente: cliente.nombre,
        cedulaCliente: cliente.cedula,
        emailCliente: cliente.email,
      });

      await queryRunner.manager.save(nuevaReserva);

      // Commit de la transacción
      await queryRunner.commitTransaction();

      // Recargar la reserva con relaciones
      const reservaCompleta = await this.reservaRepository.findOne({
        where: { id: nuevaReserva.id },
        relations: ['habitacion', 'tipoHabitacion', 'tipoHabitacion.amenidades'],
      });

      if (!reservaCompleta) {
        throw new NotFoundException('Error al recuperar la reserva creada');
      }

      return reservaCompleta;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtener todas las reservas de un cliente
   */
  async findByCliente(idCliente: number): Promise<Reserva[]> {
    const reservas = await this.reservaRepository.find({
      where: { idCliente },
      relations: ['habitacion', 'tipoHabitacion', 'tipoHabitacion.amenidades'],
      order: { createdAt: 'DESC' },
    });
    return await this.enriquecerReservas(reservas);
  }

  /**
   * Obtener reservas de cliente con filtrado por rol del requester
   * - Si es cliente: solo sus propias reservas
   * - Si es recepcionista/admin: solo de su hotel
   * - Si es superadmin: todas las del cliente
   */
  async findByClienteWithHotel(
    idCliente: number,
    userIdHotel: number,
    userRole: string,
  ): Promise<Reserva[]> {
    let query = this.reservaRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.habitacion', 'habitacion')
      .leftJoinAndSelect('reserva.tipoHabitacion', 'tipoHabitacion')
      .where('reserva.id_cliente = :idCliente', { idCliente });

    // Filtrar por hotel si es recepcionista o admin
    if (userRole === 'recepcionista' || userRole === 'admin') {
      query = query.andWhere('reserva.id_hotel = :idHotel', { idHotel: userIdHotel });
    }

    query = query.orderBy('reserva.created_at', 'DESC');

    return await query.getMany();
  }

  /**
   * Obtener reservas por hotel
   */
  async findByHotel(idHotel: number): Promise<Reserva[]> {
    const reservas = await this.reservaRepository.find({
      where: { idHotel },
      relations: ['habitacion', 'tipoHabitacion'],
      order: { checkinPrevisto: 'ASC' },
    });
    return await this.enriquecerReservas(reservas);
  }

  /**
   * Buscar reservas por cédula del cliente
   */
  async findByCedula(cedulaCliente: string, idHotel: number): Promise<Reserva[]> {
    try {
      // Buscar por el campo desnormalizado cedula_cliente en la tabla reservas
      // NOTA: tipoHabitacion.amenidades están configuradas como eager, no hacer JOIN explícito
      const reservas = await this.reservaRepository
        .createQueryBuilder('reserva')
        .leftJoinAndSelect('reserva.habitacion', 'habitacion')
        .leftJoinAndSelect('reserva.tipoHabitacion', 'tipoHabitacion')
        .where('reserva.cedula_cliente = :cedula', { cedula: cedulaCliente })
        .andWhere('reserva.id_hotel = :idHotel', { idHotel })
        .orderBy('reserva.created_at', 'DESC')
        .getMany();

      console.log(`findByCedula - Encontradas ${reservas.length} reservas para cédula ${cedulaCliente} en hotel ${idHotel}`);
      
      // Enriquecer reservas con datos del cliente si están faltando
      return await this.enriquecerReservas(reservas);
    } catch (error) {
      console.error(`Error en findByCedula - cedula: ${cedulaCliente}, hotel: ${idHotel}`, error);
      throw error;
    }
  }

  /**
   * Obtener todas las reservas del sistema (solo para superadmin)
   */
  async findAll(): Promise<Reserva[]> {
    const reservas = await this.reservaRepository.find({
      relations: ['habitacion', 'tipoHabitacion', 'tipoHabitacion.amenidades', 'cliente'],
      order: { checkinPrevisto: 'ASC' },
    });
    return await this.enriquecerReservas(reservas);
  }

  /**
   * Obtener una reserva por ID
   */
  async findOne(id: number): Promise<Reserva> {
    const reserva = await this.reservaRepository.findOne({
      where: { id },
      relations: ['habitacion', 'tipoHabitacion', 'tipoHabitacion.amenidades'],
    });

    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    return reserva;
  }

  /**
   * Obtener una reserva por código de confirmación
   */
  async findByCodigoConfirmacion(codigoConfirmacion: string): Promise<Reserva> {
    const reserva = await this.reservaRepository.findOne({
      where: { codigoConfirmacion },
      relations: ['habitacion', 'tipoHabitacion', 'tipoHabitacion.amenidades'],
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return reserva;
  }

  /**
   * Actualizar una reserva
   */
  async update(id: number, updateReservaDto: UpdateReservaDto): Promise<Reserva> {
    const reserva = await this.findOne(id);

    // Validar cambios de fechas
    if (updateReservaDto.checkinPrevisto && updateReservaDto.checkoutPrevisto) {
      const checkinPrevisto = new Date(updateReservaDto.checkinPrevisto);
      const checkoutPrevisto = new Date(updateReservaDto.checkoutPrevisto);

      if (checkinPrevisto >= checkoutPrevisto) {
        throw new BadRequestException('La fecha de check-in debe ser anterior a check-out');
      }

      reserva.checkinPrevisto = checkinPrevisto;
      reserva.checkoutPrevisto = checkoutPrevisto;
    }

    if (updateReservaDto.estadoReserva) {
      reserva.estadoReserva = updateReservaDto.estadoReserva;
    }

    if (updateReservaDto.observaciones) {
      reserva.observaciones = updateReservaDto.observaciones;
    }

    return await this.reservaRepository.save(reserva);
  }

  /**
   * Cancelar una reserva
   */
  async cancelar(id: number, motivo?: string): Promise<Reserva> {
    const reserva = await this.findOne(id);

    if (reserva.estadoReserva?.toLowerCase() === 'cancelada') {
      throw new BadRequestException('La reserva ya está cancelada');
    }

    reserva.estadoReserva = 'cancelada';
    if (motivo) {
      reserva.observaciones = (reserva.observaciones ? reserva.observaciones + '\n' : '') + `Cancelación: ${motivo}`;
    }

    return await this.reservaRepository.save(reserva);
  }

  /**
   * Completar reserva (Check-out)
   * Cambia de 'confirmada' → 'completada'
   */
  async completarReserva(id: number): Promise<Reserva> {
    const reserva = await this.findOne(id);

    if (reserva.estadoReserva?.toLowerCase() !== 'confirmada') {
      throw new BadRequestException('Solo se pueden completar reservas confirmadas');
    }

    reserva.checkoutReal = new Date();
    reserva.estadoReserva = 'completada';

    return await this.reservaRepository.save(reserva);
  }

  /**
   * Confirmar reserva (recepcionista confirma que la reserva es válida)
   * Cambia estado de 'reservada' a 'confirmada' sin hacer check-in
   */
  async confirmarReserva(id: number): Promise<Reserva> {
    const reserva = await this.findOne(id);

    if (reserva.estadoReserva?.toLowerCase() !== 'reservada') {
      throw new BadRequestException('Solo se pueden confirmar reservas en estado reservada');
    }

    reserva.estadoReserva = 'confirmada';

    return await this.reservaRepository.save(reserva);
  }

  /**
   * Confirmar check-in (recepcionista registra la entrada con hora exacta)
   */
  async confirmarCheckin(id: number): Promise<Reserva> {
    const reserva = await this.findOne(id);

    if (reserva.estadoReserva?.toLowerCase() !== 'confirmada') {
      throw new BadRequestException('Solo se pueden hacer check-in en reservas confirmadas');
    }

    reserva.checkinReal = new Date();

    return await this.reservaRepository.save(reserva);
  }

  /**
   * Confirmar check-out (recepcionista registra la salida con hora exacta)
   * Después del checkout, se genera la factura automáticamente
   */
  async confirmarCheckout(id: number): Promise<{ reserva: Reserva; factura?: any }> {
    const reserva = await this.findOne(id);

    if (reserva.estadoReserva?.toLowerCase() !== 'confirmada') {
      throw new BadRequestException('Solo se pueden hacer check-out en reservas confirmadas');
    }

    reserva.checkoutReal = new Date();
    reserva.estadoReserva = 'completada';

    const reservaGuardada = await this.reservaRepository.save(reserva);

    // Generar factura automáticamente al hacer checkout (si FacturaService está disponible)
    let factura: Factura | null = null;
    try {
      if (this.facturaService) {
        console.log(`[FACTURA] Iniciando generación de factura para reserva ${reservaGuardada.id}...`);
        factura = await this.facturaService.generarDesdeReserva(reservaGuardada);
        console.log(`[FACTURA] ✅ Factura generada exitosamente:`, factura?.numeroFactura);
      } else {
        console.warn('[FACTURA] ⚠️ FacturaService no disponible, omitiendo generación');
      }
    } catch (error: any) {
      // Loguear el error completo para debugging
      console.error('❌ [FACTURA] Error al generar factura:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
        reservaId: reservaGuardada.id,
      });
    }

    return { reserva: reservaGuardada, factura };
  }

  /**
   * Eliminar una reserva (solo si no tiene check-in)
   */
  async remove(id: number): Promise<void> {
    const reserva = await this.findOne(id);

    if (reserva.checkinReal) {
      throw new BadRequestException('No se puede eliminar una reserva en la que ya se ha hecho check-in');
    }

    await this.reservaRepository.remove(reserva);
  }

  /**
   * Obtener estadísticas de reservas para un hotel
   * Retorna: total, confirmadas, completadas, canceladas, ingresos brutos
   */
  async getEstadisticas(idHotel: number, periodo?: 'mes_actual' | 'trimestre_actual' | 'anio_actual'): Promise<any> {
    const query = this.reservaRepository
      .createQueryBuilder('reserva')
      .where('reserva.id_hotel = :idHotel', { idHotel });

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

      query.andWhere('reserva.created_at >= :fechaInicio', { fechaInicio });
    }

    const reservas = await query.getMany();

    // Calcular estadísticas
    const total = reservas.length;
    const confirmadas = reservas.filter(r => r.estadoReserva === 'confirmada').length;
    const completadas = reservas.filter(r => r.estadoReserva === 'completada').length;
    const canceladas = reservas.filter(r => r.estadoReserva === 'cancelada').length;
    const pendientes = reservas.filter(r => r.estadoReserva === 'reservada').length;

    // Calcular ingresos brutos (precio * noches por cada reserva completada/confirmada)
    const ingresosBrutos = reservas
      .filter(r => ['confirmada', 'completada'].includes(r.estadoReserva))
      .reduce((sum, r) => {
        const noches = Math.ceil(
          (new Date(r.checkoutPrevisto).getTime() - new Date(r.checkinPrevisto).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        return sum + (r.precioNocheSnapshot * noches);
      }, 0);

    // Tasa de ocupación estimada
    const tasaOcupacion = total > 0 ? (completadas / total * 100).toFixed(2) : '0.00';

    return {
      idHotel,
      periodo: periodo || 'todos',
      totalReservas: total,
      reservasConfirmadas: confirmadas,
      reservasCompletadas: completadas,
      reservasCanceladas: canceladas,
      reservasPendientes: pendientes,
      ingresosBrutos: parseFloat(ingresosBrutos.toFixed(2)),
      tasaOcupacion: parseFloat(tasaOcupacion),
      promedioNochesPorReserva: total > 0 ? (reservas.reduce((sum, r) => {
        const noches = Math.ceil(
          (new Date(r.checkoutPrevisto).getTime() - new Date(r.checkinPrevisto).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        return sum + noches;
      }, 0) / total).toFixed(2) : '0.00',
    };
  }
}
