import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('pedido_items')
export class PedidoItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_pedido' })
  idPedido: number;

  @Column({ name: 'id_servicio' })
  idServicio: number;

  @Column({ type: 'int', default: 1 })
  cantidad: number;

  @Column({ name: 'precio_unitario_snapshot', type: 'decimal', precision: 12, scale: 2 })
  precioUnitarioSnapshot: number;

  @Column({ name: 'subtotal', type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ name: 'nombre_servicio_snapshot', type: 'varchar', length: 150 })
  nombreServicioSnapshot: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  observacion: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne('Pedido', 'items', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_pedido' })
  pedido: any;

  @ManyToOne('Servicio', 'items', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_servicio' })
  servicio: any;
}
