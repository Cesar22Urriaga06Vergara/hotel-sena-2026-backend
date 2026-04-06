import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Factura } from './factura.entity';

/**
 * FASE 7: Entidad de auditoría para cambios en facturas
 * Registra cada cambio de estado, monto, cliente con valores anteriores y nuevos
 * Cumplimiento tributario: Trazabilidad completa de cambios
 */
@Entity('factura_cambios')
@Index('idx_factura', ['idFactura'])
@Index('idx_fecha', ['fecha'])
@Index('idx_factura_fecha', ['idFactura', 'fecha'])
export class FacturaCambio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_factura' })
  idFactura: number;

  @Column({
    name: 'tipo_cambio',
    type: 'enum',
    enum: ['CAMBIO_ESTADO', 'CAMBIO_MONTO', 'CAMBIO_CLIENTE', 'CREACION'],
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

  @ManyToOne(() => Factura, (factura) => factura.cambios, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'id_factura' })
  factura?: Factura;
}
