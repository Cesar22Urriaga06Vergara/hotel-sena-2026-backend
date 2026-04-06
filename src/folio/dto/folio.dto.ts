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

// FASE 5: Importar del nuevo archivo de operaciones para trazabilidad mejorada
export { CobrarFolioDto, CerrarFolioDto } from './folio-operaciones.dto';

export class EliminarCargoDto {
  @IsString()
  @IsNotEmpty()
  idCargo: string;
}
