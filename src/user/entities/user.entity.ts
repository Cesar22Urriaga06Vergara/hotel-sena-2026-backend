import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';

// Enum para los roles del sistema
export enum UserRole {
  ADMIN = 'admin',
  RECEPCIONISTA = 'recepcionista',
  CLIENTE = 'cliente',
}

// Decorador @Entity define que esta clase es una entidad de base de datos
@Entity('users')
export class User {
  // Clave primaria auto-incremental
  @PrimaryGeneratedColumn()
  id: number;

  // Columna de email única y no nula
  @Column({ unique: true, nullable: false })
  email: string;

  // Columna de contraseña (se guardará encriptada)
  // select: false evita que se devuelva por defecto en las consultas
  @Column({ nullable: false, select: false })
  password: string;

  // Nombre completo del usuario
  @Column({ nullable: false })
  fullName: string;

  // Estado activo del usuario
  @Column({ default: true })
  isActive: boolean;

  // Rol del usuario (por defecto 'cliente')
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENTE,
  })
  role: UserRole;

  // Relación opcional con empleado (para admin y recepcionista)
  @Column({ nullable: true, name: 'id_empleado' })
  idEmpleado: number;

  // Relación opcional con cliente (para rol cliente)
  @Column({ nullable: true, name: 'id_cliente' })
  idCliente: number;

  // Último inicio de sesión
  @Column({ nullable: true })
  lastLogin: Date;

  // Fecha de creación automática
  @CreateDateColumn()
  createdAt: Date;

  // Fecha de actualización automática
  @UpdateDateColumn()
  updatedAt: Date;
}