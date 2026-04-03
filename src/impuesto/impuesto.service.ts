import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxRate } from 'src/tax-rates/entities/tax-rate.entity';

export interface TaxCalculationResult {
  iva: number;
  inc: number;
  otros: number;
  subtotalPorCategoria: {
    [categoria: string]: {
      monto: number;
      iva: number;
      inc: number;
      otros: number;
      total: number;
    };
  };
  totales: {
    ivaTotal: number;
    incTotal: number;
    otrosTotal: number;
    total: number;
  };
}

export interface LineaImpuestosInput {
  subtotal: number;
  categoriaServiciosId: number;
  hotelId: number;
  taxProfile: 'RESIDENT' | 'FOREIGN_TOURIST' | 'ENTITY';
}

export interface LineaImpuestosResult {
  iva: number;
  inc: number;
  total: number;
  appliedTaxes: Array<{
    tipoImpuesto: 'IVA' | 'INC' | 'OTROS';
    tasaPorcentaje: number;
    monto: number;
  }>;
}

@Injectable()
export class ImpuestoService {
  constructor(
    @InjectRepository(TaxRate)
    private taxRateRepository: Repository<TaxRate>,
  ) {}

  /**
   * Obtiene las tasas de impuesto aplicables para una categoría según el perfil del cliente
   */
  async getTaxRatesForCategoria(
    hotelId: number,
    categoriaServiciosId: number,
    taxProfile: 'RESIDENT' | 'FOREIGN_TOURIST' | 'ENTITY',
    fecha?: Date,
  ): Promise<TaxRate[]> {
    const queryDate = fecha || new Date();

    const query = this.taxRateRepository
      .createQueryBuilder('tr')
      .where('tr.idHotel = :hotelId', { hotelId })
      .andWhere('tr.categoriaServiciosId = :categoriaServiciosId', {
        categoriaServiciosId,
      })
      .andWhere('tr.activa = true')
      .andWhere('tr.fechaVigenciaInicio <= :queryDate', { queryDate })
      .andWhere(
        '(tr.fechaVigenciaFin IS NULL OR tr.fechaVigenciaFin >= :queryDate)',
        { queryDate },
      );

    // Filtrar por residencia
    if (taxProfile === 'RESIDENT') {
      query.andWhere('tr.aplicaAResidentes = true');
    } else if (taxProfile === 'FOREIGN_TOURIST') {
      query.andWhere('tr.aplicaAExtranjeros = true');
    } else if (taxProfile === 'ENTITY') {
      // Las entidades pueden aplicar cualquiera de las tasas vigentes
      query.andWhere(
        '(tr.aplicaAResidentes = true OR tr.aplicaAExtranjeros = true)',
      );
    }

    return query.orderBy('tr.tipoImpuesto', 'ASC').getMany();
  }

  /**
   * Calcula el monto de un impuesto específico
   */
  calculateTaxAmount(baseAmount: number, taxPercentage: number): number {
    return parseFloat(((baseAmount * taxPercentage) / 100).toFixed(2));
  }

  // FIX: Cálculo tributario por línea (item), sin agregación previa por categoría
  async calculateLineaImpuestos(
    input: LineaImpuestosInput,
  ): Promise<LineaImpuestosResult> {
    const subtotal = Number(input.subtotal || 0);
    if (subtotal < 0) {
      throw new BadRequestException('El subtotal de la línea no puede ser negativo');
    }

    const taxRates = await this.getTaxRatesForCategoria(
      input.hotelId,
      input.categoriaServiciosId,
      input.taxProfile,
    );

    let iva = 0;
    let inc = 0;
    const appliedTaxes: LineaImpuestosResult['appliedTaxes'] = [];

    for (const rate of taxRates) {
      const monto = this.calculateTaxAmount(subtotal, Number(rate.tasaPorcentaje));

      if (rate.tipoImpuesto === 'IVA') {
        iva = parseFloat((iva + monto).toFixed(2));
      } else if (rate.tipoImpuesto === 'INC') {
        inc = parseFloat((inc + monto).toFixed(2));
      }

      appliedTaxes.push({
        tipoImpuesto: rate.tipoImpuesto,
        tasaPorcentaje: Number(rate.tasaPorcentaje),
        monto,
      });
    }

    // FIX: Validación explícita de conflicto tributario en una misma línea
    if (iva > 0 && inc > 0) {
      throw new BadRequestException(
        `Conflicto tributario en línea (categoría ${input.categoriaServiciosId}): no se permite aplicar IVA e INC simultáneamente`,
      );
    }

    const total = parseFloat((subtotal + iva + inc).toFixed(2));

    return {
      iva: parseFloat(iva.toFixed(2)),
      inc: parseFloat(inc.toFixed(2)),
      total,
      appliedTaxes,
    };
  }

  /**
   * Calcula los impuestos para un detalle de factura
   * @param monto Base (sin impuestos)
   * @param categoriaServiciosId ID de la categoría
   * @param hotelId ID del hotel
   * @param taxProfile Perfil tributario del cliente
   * @returns Objeto con IVA, INC y otros impuestos
   */
  async calculateDetailTaxes(
    monto: number,
    categoriaServiciosId: number,
    hotelId: number,
    taxProfile: 'RESIDENT' | 'FOREIGN_TOURIST' | 'ENTITY',
  ): Promise<{ iva: number; inc: number; otros: number }> {
    const linea = await this.calculateLineaImpuestos({
      subtotal: monto,
      categoriaServiciosId,
      hotelId,
      taxProfile,
    });

    const otros = linea.appliedTaxes
      .filter((t) => t.tipoImpuesto === 'OTROS')
      .reduce((sum, t) => sum + Number(t.monto), 0);

    return {
      iva: parseFloat(linea.iva.toFixed(2)),
      inc: parseFloat(linea.inc.toFixed(2)),
      otros: parseFloat(otros.toFixed(2)),
    };
  }

  /**
   * Calcula el desglose completo de impuestos para una factura
   * Agrupa por categoría de servicio
   */
  async calculateFacturaDesglose(
    detalles: Array<{
      categoriaServiciosId: number;
      subtotal: number;
      categoriaNombre?: string;
    }>,
    hotelId: number,
    taxProfile: 'RESIDENT' | 'FOREIGN_TOURIST' | 'ENTITY',
  ): Promise<TaxCalculationResult> {
    const result: TaxCalculationResult = {
      iva: 0,
      inc: 0,
      otros: 0,
      subtotalPorCategoria: {},
      totales: {
        ivaTotal: 0,
        incTotal: 0,
        otrosTotal: 0,
        total: 0,
      },
    };

    // FIX: cálculo por línea y agregación posterior para compatibilidad
    for (const detalle of detalles) {
      const linea = await this.calculateLineaImpuestos({
        subtotal: detalle.subtotal,
        categoriaServiciosId: detalle.categoriaServiciosId,
        hotelId,
        taxProfile,
      });

      const categoriaNombre =
        detalle.categoriaNombre || `Categoría ${detalle.categoriaServiciosId}`;

      if (!result.subtotalPorCategoria[categoriaNombre]) {
        result.subtotalPorCategoria[categoriaNombre] = {
          monto: 0,
          iva: 0,
          inc: 0,
          otros: 0,
          total: 0,
        };
      }

      result.subtotalPorCategoria[categoriaNombre].monto = parseFloat(
        (result.subtotalPorCategoria[categoriaNombre].monto + Number(detalle.subtotal)).toFixed(2),
      );
      result.subtotalPorCategoria[categoriaNombre].iva = parseFloat(
        (result.subtotalPorCategoria[categoriaNombre].iva + linea.iva).toFixed(2),
      );
      result.subtotalPorCategoria[categoriaNombre].inc = parseFloat(
        (result.subtotalPorCategoria[categoriaNombre].inc + linea.inc).toFixed(2),
      );

      const otrosLinea = linea.appliedTaxes
        .filter((t) => t.tipoImpuesto === 'OTROS')
        .reduce((sum, t) => sum + Number(t.monto), 0);

      result.subtotalPorCategoria[categoriaNombre].otros = parseFloat(
        (result.subtotalPorCategoria[categoriaNombre].otros + otrosLinea).toFixed(2),
      );
      result.subtotalPorCategoria[categoriaNombre].total = parseFloat(
        (
          result.subtotalPorCategoria[categoriaNombre].monto +
          result.subtotalPorCategoria[categoriaNombre].iva +
          result.subtotalPorCategoria[categoriaNombre].inc +
          result.subtotalPorCategoria[categoriaNombre].otros
        ).toFixed(2),
      );

      result.iva = parseFloat((result.iva + linea.iva).toFixed(2));
      result.inc = parseFloat((result.inc + linea.inc).toFixed(2));
      result.otros = parseFloat((result.otros + otrosLinea).toFixed(2));
    }

    // Calcular totales
    const subtotalTotal = detalles.reduce((sum, d) => sum + d.subtotal, 0);
    result.totales.ivaTotal = parseFloat(result.iva.toFixed(2));
    result.totales.incTotal = parseFloat(result.inc.toFixed(2));
    result.totales.otrosTotal = parseFloat(result.otros.toFixed(2));
    result.totales.total = parseFloat(
      (
        subtotalTotal +
        result.totales.ivaTotal +
        result.totales.incTotal +
        result.totales.otrosTotal
      ).toFixed(2),
    );

    return result;
  }
}
