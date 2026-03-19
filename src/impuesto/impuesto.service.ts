import { Injectable } from '@nestjs/common';
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
    const taxRates = await this.getTaxRatesForCategoria(
      hotelId,
      categoriaServiciosId,
      taxProfile,
    );

    const result = {
      iva: 0,
      inc: 0,
      otros: 0,
    };

    for (const rate of taxRates) {
      const taxAmount = this.calculateTaxAmount(monto, rate.tasaPorcentaje);

      if (rate.tipoImpuesto === 'IVA') {
        result.iva += taxAmount;
      } else if (rate.tipoImpuesto === 'INC') {
        result.inc += taxAmount;
      } else {
        result.otros += taxAmount;
      }
    }

    return {
      iva: parseFloat(result.iva.toFixed(2)),
      inc: parseFloat(result.inc.toFixed(2)),
      otros: parseFloat(result.otros.toFixed(2)),
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

    // Agrupar detalles por categoría
    const detallesPorCategoria: {
      [key: number]: { subtotal: number; nombre?: string };
    } = {};

    for (const detalle of detalles) {
      if (!detallesPorCategoria[detalle.categoriaServiciosId]) {
        detallesPorCategoria[detalle.categoriaServiciosId] = {
          subtotal: 0,
          nombre: detalle.categoriaNombre || `Categoría ${detalle.categoriaServiciosId}`,
        };
      }
      detallesPorCategoria[detalle.categoriaServiciosId].subtotal +=
        detalle.subtotal;
    }

    // Calcular impuestos por categoría
    for (const [catId, { subtotal, nombre }] of Object.entries(
      detallesPorCategoria,
    )) {
      const categoryId = parseInt(catId);
      const taxes = await this.calculateDetailTaxes(
        subtotal,
        categoryId,
        hotelId,
        taxProfile,
      );

      const categoryTotal = subtotal + taxes.iva + taxes.inc + taxes.otros;

      result.subtotalPorCategoria[nombre || `Categoría ${categoryId}`] = {
        monto: parseFloat(subtotal.toFixed(2)),
        iva: taxes.iva,
        inc: taxes.inc,
        otros: taxes.otros,
        total: parseFloat(categoryTotal.toFixed(2)),
      };

      result.iva += taxes.iva;
      result.inc += taxes.inc;
      result.otros += taxes.otros;
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
