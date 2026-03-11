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

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
