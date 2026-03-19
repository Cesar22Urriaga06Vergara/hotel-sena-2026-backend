import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturaService } from './factura.service';
import { FacturaController } from './factura.controller';
import { Factura } from './entities/factura.entity';
import { DetalleFactura } from './entities/detalle-factura.entity';
import { ReservaModule } from '../reserva/reserva.module';
import { ServicioModule } from '../servicio/servicio.module';
import { ImpuestoModule } from '../impuesto/impuesto.module';
import { ClienteModule } from '../cliente/cliente.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Factura, DetalleFactura]),
    forwardRef(() => ReservaModule),
    forwardRef(() => ServicioModule),
    ImpuestoModule,
    forwardRef(() => ClienteModule),
  ],
  controllers: [FacturaController],
  providers: [FacturaService],
  exports: [FacturaService],
})
export class FacturaModule {}
