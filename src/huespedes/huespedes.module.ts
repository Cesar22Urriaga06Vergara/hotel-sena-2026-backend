import { Module } from '@nestjs/common';
import { ClienteModule } from '../cliente/cliente.module';
import { HuespedesController } from './huespedes.controller';

/**
 * Módulo HUÉSPEDES
 * Expone un alias del módulo CLIENTES con mejor UX para RECEPCIONISTA
 */
@Module({
  imports: [ClienteModule],
  controllers: [HuespedesController],
})
export class HuespedesModule {}
