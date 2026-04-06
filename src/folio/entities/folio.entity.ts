import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Habitacion } from '../../habitacion/entities/habitacion.entity';
import { Reserva } from '../../reserva/entities/reserva.entity';

export interface Cargo {
  idCargo: string; // UUID o ID único
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  monto: number;
  categoria: string; // 'SERVICIO', 'ADICIONAL', 'INCIDENCIA', 'OTRO'
  fechaAñadido: Date;
  agregadoPor: string; // nombre del usuario que agregó el cargo
  referencia?: string;
  automatico?: boolean;
}

@Entity('folios')
export class Folio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  idHabitacion: number;

  @Column({ type: 'int', nullable: true })
  idReserva: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number; // Suma de cargos

  @Column({ type: 'json', default: () => "'[]'" })
  cargos: Cargo[]; // Array de cargos agregados

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number; // Subtotal final (incluyendo impuestos si aplica)

  @Column({
    type: 'enum',
    enum: ['ACTIVO', 'CERRADO', 'PAGADO'],
    default: 'ACTIVO',
  })
  estadoPago: 'ACTIVO' | 'CERRADO' | 'PAGADO';

  @CreateDateColumn()
  fechaApertura: Date;

  @Column({ type: 'datetime', nullable: true })
  fechaCierre: Date;

  @Column({ type: 'int', nullable: true })
  registradoPor: number; // ID del recepcionista que abrió el folio

  @Column({ type: 'int', nullable: true })
  idMedioPago?: number; // FASE 5: Trazabilidad del medio de pago usado

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenciaPago?: string; // FASE 5: Referencia de transacción

  @Column({ type: 'json', nullable: true })
  historicosPagos?: Array<{ idMedioPago: number; monto: number; referencia?: string; fecha: Date; cobrador?: string; }>;

  @ManyToOne(() => Habitacion, { eager: true })
  @JoinColumn({ name: 'idHabitacion' })
  habitacion: Habitacion;

  @ManyToOne(() => Reserva, { eager: true, nullable: true })
  @JoinColumn({ name: 'idReserva' })
  reserva: Reserva;

  @UpdateDateColumn()
  updatedAt: Date;
}
