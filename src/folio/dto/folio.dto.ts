import { IsNumber, IsNotEmpty, IsArray, ValidateNested, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFolioDto {
  @IsNumber()
  @IsNotEmpty()
  idHabitacion: number;

  @IsNumber()
  @IsOptional()
  idReserva?: number;
}

export class AgregarCargoDto {
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsNumber()
  @IsNotEmpty()
  cantidad: number;

  @IsNumber()
  @IsNotEmpty()
  precioUnitario: number;

  @IsString()
  @IsNotEmpty()
  categoria: 'SERVICIO' | 'ADICIONAL' | 'INCIDENCIA' | 'OTRO';
}

export class CobrarFolioDto {
  @IsNumber()
  @IsNotEmpty()
  monto: number;

  @IsString()
  @IsOptional()
  concepto?: string;

  @IsString()
  @IsOptional()
  referencia?: string;
}

export class EliminarCargoDto {
  @IsString()
  @IsNotEmpty()
  idCargo: string;
}
