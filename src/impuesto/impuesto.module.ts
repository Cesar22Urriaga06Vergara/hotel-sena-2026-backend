import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImpuestoService } from './impuesto.service';
import { TaxRate } from 'src/tax-rates/entities/tax-rate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaxRate])],
  providers: [ImpuestoService],
  exports: [ImpuestoService],
})
export class ImpuestoModule {}
