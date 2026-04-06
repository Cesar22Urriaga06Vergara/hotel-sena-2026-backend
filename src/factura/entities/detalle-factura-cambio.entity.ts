import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DetalleFactura } from './detalle-factura.entity';

/**
 * FASE 8: Entidad de auditoría para cambios en detalles de factura
 * Registra cada cambio de estado, cantidad, monto, precio en detalles
 * Cumplimiento: Trazabilidad completa de modificaciones de líneas
 */
@Entity('detalle_factura_cambios')
@Index('idx_detalle', ['idDetalle'])
@Index('idx_fecha', ['fecha'])
@Index('idx_tipo_cambio', ['tipoCambio'])
@Index('idx_detalle_fecha', ['idDetalle', 'fecha'])
export class DetalleFacturaCambio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_detalle' })
  idDetalle: number;

  @ManyToOne(() => DetalleFactura, (d) => d.cambios, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'id_detalle' })
  detalle?: DetalleFactura;

  @Column({
    name: 'tipo_cambio',
    type: 'enum',
    enum: [
      'CAMBIO_ESTADO',
      'CAMBIO_MONTO',
      'CAMBIO_CANTIDAD',
      'CREACION',
      'ELIMINACION',
    ],
  })
  tipoCambio: string;

  @Column({ name: 'descripcion', type: 'text' })
  descripcion: string;

  @Column({ name: 'valor_anterior', type: 'json', nullable: true })
  valorAnterior?: any;

  @Column({ name: 'valor_nuevo', type: 'json', nullable: true })
  valorNuevo?: any;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: number;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;
}
