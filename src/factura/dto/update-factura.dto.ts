import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum } from 'class-validator';

export class UpdateFacturaDto {
  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsEnum(['BORRADOR', 'EDITABLE', 'EMITIDA', 'PAGADA', 'ANULADA'])
  estadoFactura?: 'BORRADOR' | 'EDITABLE' | 'EMITIDA' | 'PAGADA' | 'ANULADA';

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  cufe?: string;

  @IsOptional()
  fechaEmision?: Date;

  // Campos opcionales para ajustes de montos (solo en BORRADOR/EDITABLE)
  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  montoIva?: number;

  @IsOptional()
  @IsNumber()
  montoInc?: number;

  @IsOptional()
  @IsNumber()
  total?: number;

  // Flag para indicar que debe recalcularse desglose de impuestos
  @IsOptional()
  @IsBoolean()
  recalcularImpuestos?: boolean;
}
