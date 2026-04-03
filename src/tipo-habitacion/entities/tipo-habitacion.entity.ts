import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Amenidad } from '../../amenidad/entities/amenidad.entity';
import { Habitacion } from '../../habitacion/entities/habitacion.entity';

@Entity('tipos_habitacion')
export class TipoHabitacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_hotel' })
  idHotel: number;

  @Column({ name: 'id_categoria_servicios', nullable: true })
  idCategoriaServicios: number;

  @Column({ name: 'nombre_tipo', unique: true })
  nombreTipo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'capacidad_personas', type: 'smallint' })
  capacidadPersonas: number;

  @Column({ name: 'precio_base', type: 'decimal', precision: 12, scale: 2, nullable: true })
  precioBase: number;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => Amenidad, (amenidad) => amenidad.tiposHabitacion, { eager: true })
  @JoinTable({
    name: 'tipo_habitacion_amenidades',
    joinColumn: { name: 'id_tipo_habitacion', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_amenidad', referencedColumnName: 'id' },
  })
  amenidades: Amenidad[];

  @OneToMany(() => Habitacion, (habitacion) => habitacion.tipoHabitacion)
  habitaciones: Habitacion[];
}
