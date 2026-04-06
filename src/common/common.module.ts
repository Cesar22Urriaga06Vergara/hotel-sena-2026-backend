import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from './services/audit-log.service';
import { AuditLogController } from './controllers/audit-log.controller';
import { ApiResponseService } from './services/api-response.service';
import { KpisService } from './services/kpis.service';
import { KpisController } from './controllers/kpis.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogService, ApiResponseService, KpisService],
  controllers: [AuditLogController, KpisController],
  exports: [AuditLogService, ApiResponseService, KpisService],
})
export class CommonModule {}
