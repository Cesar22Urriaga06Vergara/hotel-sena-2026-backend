import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturaService } from './factura.service';
import { FacturaController } from './factura.controller';
import { IntegridadService } from './integridad.service';
import { Factura } from './entities/factura.entity';
import { DetalleFactura } from './entities/detalle-factura.entity';
import { FacturaCambio } from './entities/factura-cambio.entity';
import { DetalleFacturaCambio } from './entities/detalle-factura-cambio.entity';
import { CategoriaServicio } from '../categoria-servicios/entities/categoria-servicio.entity';
import { ReservaModule } from '../reserva/reserva.module';
import { ServicioModule } from '../servicio/servicio.module';
import { ImpuestoModule } from '../impuesto/impuesto.module';
import { ClienteModule } from '../cliente/cliente.module';
import { HotelModule } from '../hotel/hotel.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Factura,
      DetalleFactura,
      FacturaCambio,
      DetalleFacturaCambio,
      CategoriaServicio,
    ]),
    forwardRef(() => ReservaModule),
    forwardRef(() => ServicioModule),
    ImpuestoModule,
    forwardRef(() => ClienteModule),
    HotelModule,
  ],
  controllers: [FacturaController],
  providers: [FacturaService, IntegridadService],
  exports: [FacturaService],
})
export class FacturaModule {}
