import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('factura_cambios')
@Index(['idFactura'])
@Index(['usuarioId'])
@Index(['fecha'])
export class FacturaCambios {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'id_factura' })
  idFactura: number;

  @Column({ type: 'int', nullable: true, name: 'usuario_id' })
  usuarioId?: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'usuario_email' })
  usuarioEmail?: string;

  @Column({ type: 'varchar', length: 100, name: 'tipo_cambio' })
  tipoCambio: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'json', nullable: true, name: 'valor_anterior' })
  valorAnterior?: any;

  @Column({ type: 'json', nullable: true, name: 'valor_nuevo' })
  valorNuevo?: any;

  @CreateDateColumn({ type: 'datetime' })
  fecha: Date;
}
