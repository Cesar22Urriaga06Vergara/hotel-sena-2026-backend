import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('empleados')
export class Empleado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  id_hotel: number; // NULL si es superadmin (sin hotel asignado)

  @Column({ unique: true, nullable: false })
  cedula: string;

  @Column({ nullable: false })
  nombre: string;

  @Column({ nullable: false })
  apellido: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ select: false, nullable: false })
  password: string;

  @Column({ nullable: false })
  rol: string; // 'recepcionista', 'admin', etc.

  // TAX PROFILE - Para cálculo de impuestos en facturas
  @Column({
    type: 'enum',
    enum: ['RESIDENT', 'FOREIGN_TOURIST', 'ENTITY'],
    default: 'RESIDENT',
    nullable: false,
    name: 'tax_profile',
  })
  taxProfile: 'RESIDENT' | 'FOREIGN_TOURIST' | 'ENTITY';

  @Column({ default: 'activo' })
  estado: string; // 'activo', 'inactivo'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy?: number;
}
