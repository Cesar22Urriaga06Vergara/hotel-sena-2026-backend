import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsPositive,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';

export class CreatePagoDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'ID debe ser número' },
  )
  @IsNotEmpty({ message: 'ID es requerido' })
  @ValidateIf((obj) => obj.idFactura !== undefined)
  @IsPositive({ message: 'ID debe ser positivo' })
  idFactura: number;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'ID de habitación debe ser número' },
  )
  @IsNotEmpty({ message: 'ID de habitación es requerido' })
  @ValidateIf((obj) => obj.idHabitacion !== undefined)
  @IsPositive({ message: 'ID de habitación debe ser positivo' })
  idHabitacion: number;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'ID de medio pago debe ser número' },
  )
  @IsNotEmpty({ message: 'ID de medio pago es requerido' })
  @ValidateIf((obj) => obj.idMedioPago !== undefined)
  @IsPositive({ message: 'ID de medio pago debe ser positivo' })
  idMedioPago: number;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Monto a cobrar debe ser número' },
  )
  @IsNotEmpty({ message: 'Monto a cobrar es requerido' })
  @ValidateIf((obj) => obj.montoCobrar !== undefined)
  @IsPositive({ message: 'Monto a cobrar debe ser positivo' })
  montoCobrar: number;

  // Monto recibido en efectivo (solo requerido si medioPago = 'efectivo')
  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Monto recibido debe ser número' },
  )
  @Min(0, { message: 'Monto recibido debe ser mayor o igual a 0' })
  montoRecibido?: number;

  @IsOptional()
  @IsString()
  referenciaPago?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
