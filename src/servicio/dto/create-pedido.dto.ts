import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PedidoItemDto {
  @ApiProperty({ example: 1, description: 'ID del servicio' })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idServicio: number;

  @ApiProperty({ example: 2, description: 'Cantidad' })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  cantidad: number;

  @ApiPropertyOptional({ example: 'Sin azúcar', description: 'Observación especial' })
  @IsString()
  @IsOptional()
  observacion?: string;
}

export class CreatePedidoDto {
  @ApiProperty({ example: 1, description: 'ID de la reserva' })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  idReserva: number;

  @ApiProperty({
    example: 'delivery',
    enum: ['delivery', 'recogida'],
    description: 'Tipo de entrega',
  })
  @IsEnum(['delivery', 'recogida'], {
    message: 'tipoEntrega debe ser "delivery" o "recogida"',
  })
  @IsNotEmpty()
  tipoEntrega: string;

  @ApiProperty({
    type: [PedidoItemDto],
    description: 'Items del pedido (debe ser de una sola categoría)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'Debe tener al menos un item en el pedido' })
  @Type(() => PedidoItemDto)
  @IsNotEmpty()
  items: PedidoItemDto[];

  @ApiPropertyOptional({ example: 'Llevar a las 3 PM', description: 'Nota del cliente' })
  @IsString()
  @IsOptional()
  notaCliente?: string;
}
