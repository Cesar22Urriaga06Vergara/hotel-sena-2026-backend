/**
 * data-source.ts
 *
 * DataSource independiente para la CLI de TypeORM.
 * Usado por los scripts npm:
 *   - migration:run     → ejecuta migraciones pendientes
 *   - migration:revert  → revierte la última migración
 *   - migration:generate → genera una nueva migración comparando entidades vs BD
 *   - migration:show    → lista el estado de todas las migraciones
 *
 * Las variables de entorno se leen desde .env (dotenv).
 * En Railway las variables se inyectan directamente en el entorno del proceso.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'hotel',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: ['migration'],
});

export default AppDataSource;
