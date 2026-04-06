import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Pedido } from './pedido.entity';

/**
 * FASE 6: Entidad de auditoría para cambios de estado en pedidos
 * Registra cada transición de estado con usuario, timestamp y motivo
 */
@Entity('pedido_cambios')
@Index('idx_pedido', ['idPedido'])
@Index('idx_timestamp', ['timestamp'])
@Index('idx_pedido_timestamp', ['idPedido', 'timestamp'])
export class PedidoCambio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_pedido' })
  idPedido: number;

  @Column({
    name: 'estado_anterior',
    type: 'enum',
    enum: ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'],
  })
  estadoAnterior: string;

  @Column({
    name: 'estado_nuevo',
    type: 'enum',
    enum: ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'],
  })
  estadoNuevo: string;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: number;

  @Column({
    name: 'razon_cambio',
    type: 'text',
    nullable: true,
  })
  razonCambio?: string;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @ManyToOne(() => Pedido, (pedido) => pedido.cambios, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'id_pedido' })
  pedido?: Pedido;
}
