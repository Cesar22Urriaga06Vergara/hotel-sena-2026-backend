import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Factura } from './factura.entity';
import { Pedido } from '../../servicio/entities/pedido.entity';

@Entity('detalle_facturas')
@Index('idx_factura', ['idFactura'])
@Index('idx_pedido', ['idPedido'])
@Index('idx_estado', ['estado'])
@Index('idx_factura_estado', ['idFactura', 'estado'])
export class DetalleFactura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_factura' })
  idFactura: number;

  @ManyToOne(() => Factura, (f) => f.detalles)
  @JoinColumn({ name: 'id_factura' })
  factura: Factura;

  // FASE 8: Relación con Pedido si el detalle viene de un pedido
  @Column({ name: 'id_pedido', nullable: true })
  idPedido?: number;

  @ManyToOne(() => Pedido, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_pedido' })
  pedido?: Pedido;

  // 'habitacion' | 'servicio' | 'descuento' | 'cargo_adicional'
  @Column({ name: 'tipo_concepto' })
  tipoConcepto: string;

  // Texto legible en la factura
  // Ej: "Habitación Deluxe – 3 noches (2026-06-01 al 2026-06-04)"
  // Ej: "Servicio Spa Premium (2026-06-02)"
  @Column()
  descripcion: string;

  // ID del recurso de origen (idServicio, idPedido, etc.) — nullable para cargos manuales
  @Column({ name: 'id_referencia', nullable: true })
  idReferencia: number;
  // NUEVO: Categoría de servicio para cálculo de impuestos
  @Column({ name: 'categoria_servicios_id', nullable: true })
  categoriaServiciosId?: number;

  // NUEVO: Nombre legible de la categoría (desnormalizado para integridad histórica)
  @Column({ name: 'categoria_nombre', nullable: true })
  categoriaNombre?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 12, scale: 2 })
  precioUnitario: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ name: 'monto_iva', type: 'decimal', precision: 12, scale: 2, default: 0 })
  montoIva: number;

  @Column({ name: 'porcentaje_inc', type: 'decimal', precision: 5, scale: 2, nullable: true })
  porcentajeInc?: number;

  @Column({ name: 'monto_inc', type: 'decimal', precision: 12, scale: 2, default: 0 })
  montoInc: number;

  // FASE 8: Estado del detalle (para tracking de entrega)
  @Column({
    name: 'estado',
    type: 'enum',
    enum: ['PENDIENTE', 'ENTREGADO', 'CANCELADO'],
    default: 'PENDIENTE',
  })
  estado: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO';

  // FASE 8: Relación con auditoría de cambios
  @OneToMany('DetalleFacturaCambio', 'detalle', {
    cascade: false,
    eager: false,
  })
  cambios?: any[];
}
