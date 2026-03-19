import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { CategoriaServicio } from 'src/categoria-servicios/entities/categoria-servicio.entity';

@Entity('tax_rates')
@Index(['idHotel'])
@Index(['categoriaServiciosId'])
@Index(['tipoImpuesto'])
@Index(['activa'])
export class TaxRate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'id_hotel' })
  idHotel: number;

  @Column({ type: 'int', name: 'categoria_servicios_id' })
  categoriaServiciosId: number;

  @Column({
    type: 'enum',
    enum: ['IVA', 'INC', 'OTROS'],
    default: 'IVA',
    name: 'tipo_impuesto',
  })
  tipoImpuesto: 'IVA' | 'INC' | 'OTROS';

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'tasa_porcentaje' })
  tasaPorcentaje: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion?: string;

  @Column({ type: 'boolean', default: true, name: 'aplica_a_residentes' })
  aplicaAResidentes: boolean;

  @Column({ type: 'boolean', default: true, name: 'aplica_a_extranjeros' })
  aplicaAExtranjeros: boolean;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @Column({
    type: 'date',
    default: () => 'CURDATE()',
    name: 'fecha_vigencia_inicio',
  })
  fechaVigenciaInicio: Date;

  @Column({ type: 'date', nullable: true, name: 'fecha_vigencia_fin' })
  fechaVigenciaFin?: Date;

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;

  @Column({ type: 'int', nullable: true, name: 'deleted_by' })
  deletedBy?: number;

  // RELACIONES
  // @ManyToOne(() => CategoriaServicio)
  // @JoinColumn({ name: 'categoria_servicios_id' })
  // categoriaServicio: CategoriaServicio;
}
