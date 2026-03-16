import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Reserva } from '../../reserva/entities/reserva.entity';

@Entity('facturas')
export class Factura {
  @PrimaryGeneratedColumn()
  id: number;

  // Número único legible: FAC-2026-00001
  @Column({ unique: true, name: 'numero_factura' })
  numeroFactura: string;

  // UUID único para identificación electrónica
  @Column({ unique: true, nullable: true })
  uuid: string;

  @Column({ name: 'id_reserva' })
  idReserva: number;

  @ManyToOne(() => Reserva)
  @JoinColumn({ name: 'id_reserva' })
  reserva: Reserva;

  // Datos del cliente (desnormalizados para integridad histórica)
  @Column({ name: 'id_cliente' })
  idCliente: number;

  @Column({ name: 'nombre_cliente' })
  nombreCliente: string;

  @Column({ name: 'cedula_cliente' })
  cedulaCliente: string;

  @Column({ name: 'email_cliente' })
  emailCliente: string;

  @Column({ name: 'id_hotel' })
  idHotel: number;

  // Montos
  @Column({ name: 'subtotal', type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({
    name: 'porcentaje_iva',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 19,
  })
  porcentajeIva: number;

  @Column({ name: 'monto_iva', type: 'decimal', precision: 12, scale: 2 })
  montoIva: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  // Estado: 'pendiente' | 'pagada' | 'anulada' | 'emitida'
  @Column({ default: 'pendiente' })
  estado: string;

  @Column({ name: 'fecha_emision', nullable: true })
  fechaEmision: Date;

  @Column({ name: 'fecha_vencimiento', nullable: true })
  fechaVencimiento: Date;

  @Column({ nullable: true, type: 'text' })
  observaciones: string;

  // Datos XML de la factura (para DIAN)
  @Column({ name: 'xml_data', nullable: true, type: 'longtext' })
  xmlData: string;

  // Datos JSON de la factura (para respaldo interno)
  @Column({ name: 'json_data', nullable: true, type: 'longtext' })
  jsonData: string;

  // Código Único de Factura Electrónica (futuro: DIAN Colombia)
  @Column({ nullable: true })
  cufe: string;

  @OneToMany('DetalleFactura', 'factura', {
    cascade: true,
    eager: true,
  })
  detalles: any[];

  @OneToMany('Pago', 'factura')
  pagos: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
