import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Factura } from './factura.entity';

@Entity('detalle_facturas')
export class DetalleFactura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_factura' })
  idFactura: number;

  @ManyToOne(() => Factura, (f) => f.detalles)
  @JoinColumn({ name: 'id_factura' })
  factura: Factura;

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

  @Column({ name: 'porcentaje_inc', type: 'decimal', precision: 5, scale: 2, nullable: true })
  porcentajeInc?: number;

  @Column({ name: 'monto_inc', type: 'decimal', precision: 12, scale: 2, default: 0 })
  montoInc: number;
}
