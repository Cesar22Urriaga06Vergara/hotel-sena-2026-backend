import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicioService } from './servicio.service';
import { ServicioController } from './servicio.controller';
import { Servicio } from './entities/servicio.entity';
import { Pedido } from './entities/pedido.entity';
import { PedidoItem } from './entities/pedido-item.entity';
import { Reserva } from '../reserva/entities/reserva.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Servicio, Pedido, PedidoItem, Reserva])],
  controllers: [ServicioController],
  providers: [ServicioService],
  exports: [ServicioService],
})
export class ServicioModule {}
