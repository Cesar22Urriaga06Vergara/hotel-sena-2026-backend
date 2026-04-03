import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateHotelDto } from './create-hotel.dto';

export class UpdateHotelDto extends PartialType(CreateHotelDto) {
  @ApiPropertyOptional({ enum: ['activo', 'suspendido'] })
  @IsOptional()
  @IsEnum(['activo', 'suspendido'])
  estado?: 'activo' | 'suspendido';
}
