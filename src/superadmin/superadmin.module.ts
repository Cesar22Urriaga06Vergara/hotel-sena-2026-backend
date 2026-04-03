import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';
import { Hotel } from '../hotel/entities/hotel.entity';
import { Empleado } from '../empleado/entities/empleado.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';
import { Servicio } from '../servicio/entities/servicio.entity';
import { Reserva } from '../reserva/entities/reserva.entity';
import { CategoriaServicio } from '../categoria-servicios/entities/categoria-servicio.entity';
import { HotelModule } from '../hotel/hotel.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Hotel,
      Empleado,
      Cliente,
      Habitacion,
      Servicio,
      Reserva,
      CategoriaServicio,
    ]),
    HotelModule,
  ],
  controllers: [SuperadminController],
  providers: [SuperadminService],
})
export class SuperadminModule {}
