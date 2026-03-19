import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';

@Entity('categoria_servicios')
@Index(['idHotel'])
@Index(['codigo'])
@Index(['activa'])
export class CategoriaServicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'id_hotel' })
  idHotel: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo: string;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  @Column({ type: 'int', nullable: true, name: 'deleted_by' })
  deletedBy: number | null;

  // RELACIONES
  // @OneToMany(() => Servicio, (servicio) => servicio.categoriaServicio)
  // servicios: Servicio[];

  // @OneToMany(() => TipoHabitacion, (tipo) => tipo.categoriaServicio)
  // tiposHabitacion: TipoHabitacion[];
}
