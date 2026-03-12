import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ESTADOS_PEDIDO = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'];

export class UpdateEstadoPedidoDto {
  @ApiProperty({
    example: 'en_preparacion',
    enum: ESTADOS_PEDIDO,
    description: 'Nuevo estado del pedido',
  })
  @IsEnum(ESTADOS_PEDIDO, {
    message: `Estado debe ser uno de: ${ESTADOS_PEDIDO.join(', ')}`,
  })
  estadoPedido: string;

  @ApiPropertyOptional({ example: 'Cliente llegó más temprano', description: 'Nota del empleado' })
  @IsString()
  @IsOptional()
  notaEmpleado?: string;
}
