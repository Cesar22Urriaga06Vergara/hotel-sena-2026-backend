import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Reserva } from '../../reserva/entities/reserva.entity';
import { Cliente } from '../../cliente/entities/cliente.entity';

@Entity('pedidos')
@Index(['idReserva'])
@Index(['idHotel'])
@Index(['estadoPedido'])
@Index(['categoria'])
export class Pedido {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_reserva' })
  idReserva: number;

  @Column({ name: 'id_cliente' })
  idCliente: number;

  @Column({ name: 'id_hotel' })
  idHotel: number;

  @Column({ name: 'tipo_entrega', type: 'enum', enum: ['delivery', 'recogida'], default: 'delivery' })
  tipoEntrega: string;

  @Column({ name: 'estado_pedido', type: 'enum', enum: ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'], default: 'pendiente' })
  estadoPedido: string;

  @Column({ type: 'varchar', length: 50 })
  categoria: string;

  @Column({ name: 'nota_cliente', type: 'text', nullable: true })
  notaCliente: string;

  @Column({ name: 'nota_empleado', type: 'text', nullable: true })
  notaEmpleado: string;

  @Column({ name: 'id_empleado_atiende', nullable: true })
  idEmpleadoAtiende: number;

  @Column({ name: 'fecha_entrega', type: 'datetime', nullable: true })
  fechaEntrega?: Date;

  @Column({ name: 'total_pedido', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalPedido: number;

  @CreateDateColumn({ name: 'fecha_pedido' })
  fechaPedido: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;

  @ManyToOne(() => Reserva)
  @JoinColumn({ name: 'id_reserva' })
  reserva: Reserva;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'id_cliente' })
  cliente: Cliente;

  @OneToMany('PedidoItem', 'pedido', { cascade: true })
  items: any[];

  @OneToMany('PedidoCambio', 'pedido', { cascade: true, eager: false })
  cambios?: any[];
}
