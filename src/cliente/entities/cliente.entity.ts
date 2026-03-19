import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  tipoDocumento: string;

  @Column({ default: 'cliente', nullable: false })
  rol: string; // Siempre será 'cliente'

  @Column({ nullable: true })
  direccion: string;

  @Column({ nullable: true })
  paisNacionalidad: string;

  @Column({ nullable: true })
  paisResidencia: string;

  @Column({ nullable: true })
  idiomaPreferido: string;

  @Column({ nullable: true })
  fechaNacimiento: Date;

  @Column({ nullable: true })
  tipoVisa: string;

  @Column({ nullable: true })
  numeroVisa: string;

  @Column({ nullable: true })
  visaExpira: Date;

  // TAX PROFILE - Para cálculo de impuestos en facturas
  @Column({
    type: 'enum',
    enum: ['RESIDENT', 'FOREIGN_TOURIST', 'ENTITY'],
    default: 'RESIDENT',
    nullable: false,
    name: 'tax_profile',
  })
  taxProfile: 'RESIDENT' | 'FOREIGN_TOURIST' | 'ENTITY';

  @Column({ nullable: true, length: 50, name: 'tipo_documento_estandar' })
  tipoDocumentoEstandar?: string;

  @Column({ default: false, nullable: false, name: 'documento_validado' })
  documentoValidado: boolean;

  @Column({
    nullable: true,
    name: 'fecha_validacion_documento',
  })
  fechaValidacionDocumento?: Date;

  @Column({
    type: 'int',
    nullable: true,
    name: 'validado_por_usuario_id',
  })
  validadoPorUsuarioId?: number;

  // Google OAuth
  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ default: 'local' })
  authProvider: string; // 'local' o 'google'

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy?: number;
}
