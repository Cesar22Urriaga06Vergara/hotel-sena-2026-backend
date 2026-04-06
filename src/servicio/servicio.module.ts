import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicioService } from './servicio.service';
import { ServicioController } from './servicio.controller';
import { Servicio } from './entities/servicio.entity';
import { Pedido } from './entities/pedido.entity';
import { PedidoItem } from './entities/pedido-item.entity';
import { PedidoCambio } from './entities/pedido-cambio.entity';
import { Reserva } from '../reserva/entities/reserva.entity';
import { Cliente } from '../cliente/entities/cliente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Servicio, Pedido, PedidoItem, PedidoCambio, Reserva, Cliente])],
  controllers: [ServicioController],
  providers: [ServicioService],
  exports: [ServicioService, TypeOrmModule],
})
export class ServicioModule {}
