import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Habitacion } from '../../habitacion/entities/habitacion.entity';
import { TipoHabitacion } from '../../tipo-habitacion/entities/tipo-habitacion.entity';
import { Cliente } from '../../cliente/entities/cliente.entity';

@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_cliente' })
  idCliente: number;

  @Column({ name: 'id_hotel' })
  idHotel: number;

  @Column({ name: 'id_tipo_habitacion', nullable: true })
  idTipoHabitacion: number;

  @Column({ name: 'id_habitacion', nullable: true })
  idHabitacion: number;

  @Column({ name: 'checkin_previsto', type: 'date' })
  checkinPrevisto: Date;

  @Column({ name: 'checkout_previsto', type: 'date' })
  checkoutPrevisto: Date;

  @Column({ name: 'checkin_real', nullable: true })
  checkinReal: Date;

  @Column({ name: 'checkout_real', nullable: true })
  checkoutReal: Date;

  @Column({ name: 'numero_huespedes', type: 'smallint' })
  numeroHuespedes: number;

  @Column({ name: 'estado_reserva', default: 'reservada' })
  estadoReserva: string; // reservada, confirmada, cancelada, rechazada, completada

  @Column({ name: 'origen_reserva', default: 'web' })
  origenReserva: string; // web, mostrador, telefono

  @Column({ name: 'codigo_confirmacion', unique: true })
  codigoConfirmacion: string;

  @Column({ name: 'precio_noche_snapshot', type: 'decimal', precision: 12, scale: 2, nullable: true })
  precioNocheSnapshot: number;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'cedula_cliente', nullable: true })
  cedulaCliente: string;

  @Column({ name: 'nombre_cliente', nullable: true })
  nombreCliente: string;

  @Column({ name: 'email_cliente', nullable: true })
  emailCliente: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Habitacion, { eager: true, nullable: true })
  @JoinColumn({ name: 'id_habitacion' })
  habitacion: Habitacion;

  @ManyToOne(() => TipoHabitacion, { eager: true, nullable: true })
  @JoinColumn({ name: 'id_tipo_habitacion' })
  tipoHabitacion: TipoHabitacion;

  @ManyToOne(() => Cliente, { nullable: true })
  @JoinColumn({ name: 'id_cliente' })
  cliente: Cliente;
}
