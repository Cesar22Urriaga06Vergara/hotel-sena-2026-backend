import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

@Entity('servicios')
@Index(['idHotel'])
@Index(['categoria'])
export class Servicio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_hotel' })
  idHotel: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'enum', enum: ['cafeteria', 'lavanderia', 'spa', 'room_service', 'minibar', 'otros'], default: 'otros' })
  categoria: string;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 12, scale: 2 })
  precioUnitario: number;

  @Column({ name: 'unidad_medida', type: 'varchar', length: 50, default: 'unidad' })
  unidadMedida: string;

  @Column({ name: 'imagen_url', type: 'varchar', length: 500, nullable: true })
  imagenUrl: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'disponible_delivery', default: true })
  disponibleDelivery: boolean;

  @Column({ name: 'disponible_recogida', default: true })
  disponibleRecogida: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('PedidoItem', 'servicio')
  items: any[];
}
