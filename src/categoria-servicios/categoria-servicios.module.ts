import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaServicio } from './entities/categoria-servicio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaServicio])],
  exports: [TypeOrmModule],
})
export class CategoriaServiciosModule {}
