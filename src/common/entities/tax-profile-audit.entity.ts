import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('tax_profile_audit')
@Index(['entidad'])
@Index(['idEntidad'])
@Index(['usuarioId'])
@Index(['fecha'])
export class TaxProfileAudit {
  @PrimaryGeneratedColumn()
  id: number;

  // 'cliente' | 'empleado'
  @Column({ type: 'varchar', length: 50 })
  entidad: string;

  @Column({ type: 'int', name: 'id_entidad' })
  idEntidad: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'tax_profile_anterior',
  })
  taxProfileAnterior?: string;

  @Column({ type: 'varchar', length: 50, name: 'tax_profile_nuevo' })
  taxProfileNuevo: string;

  @Column({ type: 'text', nullable: true, name: 'razon_cambio' })
  razonCambio?: string;

  @Column({ type: 'int', nullable: true, name: 'usuario_id' })
  usuarioId?: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'usuario_email' })
  usuarioEmail?: string;

  @CreateDateColumn({ type: 'datetime' })
  fecha: Date;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'ip_address' })
  ipAddress?: string;
}
