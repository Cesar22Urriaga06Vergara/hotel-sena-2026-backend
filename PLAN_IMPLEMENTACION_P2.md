# 📋 PLAN DE IMPLEMENTACIÓN: KPIs y Reportes Facturación - FASE 8 P2

**Fecha**: 5 de Abril 2026  
**Duración Total**: 13 horas  
**Esfuerzo**: 1-2 desarrolladores backend  
**Ejecución**: Secuencial (dependencias entre endpoints)  

---

## 📑 TABLA DE CONTENIDOS

1. [Paso 1: Preparación](#paso-1-preparación-1-hora)
2. [Paso 2-4: DTOs y Validaciones](#paso-2-4-dtos-y-validaciones-1-hora)
3. [Paso 5-7: Métodos KpisService](#paso-5-7-métodos-kpisservice-6-horas)
4. [Paso 8-10: Endpoints REST](#paso-8-10-endpoints-rest-3-horas)
5. [Paso 11: Exportación](#paso-11-exportación-2-horas)
6. [Paso 12-13: Tests y Deploy](#paso-12-13-tests-y-deploy-2-horas)

---

## PASO 1: PREPARACIÓN (1 hora)

### 1.1 Instalar Librerías

```bash
# Navegar a proyecto
cd c:\Users\urria\Hotel\ Sena\ 2026

# Instalar librerías de PDF y Excel
npm install pdfkit xlsx
npm install --save-dev @types/pdfkit @types/xlsx

# Verificar instalación
npm list pdfkit xlsx

# Revisar package.json se actualizó
cat package.json | grep -E "pdfkit|xlsx"
```

### 1.2 Crear Estructura de Carpetas

```bash
# Nuevos DTOs para KPIs
mkdir -p src/factura/dto/kpi
mkdir -p src/factura/dto/reportes

# Nuevo servicio de reportes (opcional, pero recomendado separar lógica)
# No crear archivo aún, primero modificar FacturaService
```

### 1.3 Crear Branch de Desarrollo

```bash
git checkout -b feature/fase8-p2-kpis-reportes
git pull origin main
```

---

## PASO 2-4: DTOs Y VALIDACIONES (1 hora)

### 2.1 Crear `src/factura/dto/kpi/kpi-admin-facturacion.dto.ts`

```typescript
import { 
  IsNumber, 
  IsEnum, 
  IsOptional, 
  IsDateString, 
  Type 
} from 'class-validator';

export class GetKpisAdminQueryDto {
  @IsNumber()
  @Type(() => Number)
  idHotel: number;

  @IsEnum(['dia', 'mes', 'trimestre', 'año'])
  @IsOptional()
  periodo?: 'dia' | 'mes' | 'trimestre' | 'año' = 'mes';

  @IsDateString()
  @IsOptional()
  fechaInicio?: string; // YYYY-MM-DD

  @IsDateString()
  @IsOptional()
  fechaFin?: string; // YYYY-MM-DD
}

// Response DTOs
export class KpiMontoDto {
  cantidad: number;
  valor: number;
}

export class KpiClienteDto {
  idCliente: number;
  nombreCliente: string;
  gastosTotal: number;
  facturasTotales: number;
}

export class KpiFlujoDiaDto {
  fecha: string; // YYYY-MM-DD
  ingresos: number;
  cantidad: number;
}

export class KpiAdminFacturacionDto {
  periodo: {
    inicio: string;
    fin: string;
    etiqueta: string;
  };

  kpis: {
    totalFacturas: KpiMontoDto;
    facturasPagadas: KpiMontoDto;
    facturasPendientes: KpiMontoDto;
    tasaMorosidad: number;
    promedioFactura: number;
    ingresosPorCategoria: Record<string, number>;
    flujoXDia: KpiFlujoDiaDto[];
    top10Clientes: KpiClienteDto[];
  };

  resumen: {
    periodo: string;
    generadoEn: Date;
    actualizado: boolean;
  };
}
```

### 2.2 Crear `src/factura/dto/kpi/kpi-recepcionista-facturacion.dto.ts`

```typescript
import { IsNumber, IsOptional, IsDateString, Type } from 'class-validator';

export class GetKpisRecepcionistaQueryDto {
  @IsNumber()
  @Type(() => Number)
  idHotel: number;

  @IsDateString()
  @IsOptional()
  fecha?: string; // YYYY-MM-DD (defecto: hoy)
}

export class AlertaFacturaVencidaDto {
  idFactura: number;
  numeroFactura: string;
  diasVencida: number;
  monto: number;
}

export class HuespedSinFacturarDto {
  idReserva: number;
  nombreHuesped: string;
  tipo: 'residente' | 'extranjero';
  horaCheckOut: string; // HH:mm
}

export class KpiRecepcionistaFacturacionDto {
  fecha: string; // YYYY-MM-DD

  kpis: {
    facturasCreadas: number;
    facturasEmitidas: number;
    facturasPagadas: number;
    ingresoHoy: number;
    pendientesHoy: number;
    huespedSinFacturar: HuespedSinFacturarDto[];
    alertasVencidas: AlertaFacturaVencidaDto[];
  };

  resumen: {
    generadoEn: Date;
    actualizado: boolean;
  };
}
```

### 2.3 Crear `src/factura/dto/reportes/reporte-ingresos.dto.ts`

```typescript
export class ReporteIngresosQueryDto {
  idHotel: number;

  agruparPor: 'categoria' | 'dia' | 'semana' | 'mes';
  
  periodo?: 'mes' | 'trimestre' | 'año';
  fechaInicio?: string;
  fechaFin?: string;
}

export class ReporteIngresoPorCategoriaDto {
  categoria: string;
  cantidad: number;
  subtotal: number;
  iva: number;
  inc: number;
  total: number;
  porcentajeTotal: number;
}

export class ReporteIngresoPorDiaDto {
  fecha: string; // YYYY-MM-DD
  cantidad: number;
  total: number;
}
```

### 2.4 Crear `src/factura/dto/reportes/reporte-clientes.dto.ts`

```typescript
export class ReporteClienteTopDto {
  idCliente: number;
  nombreCliente: string;
  cedulaCliente: string;
  emailCliente: string;
  facturasTotales: number;
  gastosTotal: number;
  salidoActual: number;
  taxProfile: 'RESIDENT' | 'FOREIGNER';
  últimaCompra: string;
}
```

### 2.5 Crear `src/factura/dto/reportes/reporte-morosidad.dto.ts`

```typescript
export class ReporteMorosidadDto {
  idFactura: number;
  numeroFactura: string;
  idCliente: number;
  nombreCliente: string;
  montoTotal: number;
  montoSaldo: number;
  fechaEmision: string;
  fechaVencimiento: string;
  diasAtrasada: number;
  tasaInteresMora: number; // Porcentaje mensual
  interesesAcumulados: number;
  estado: string;
}

export class ReporteMorosidadAnálisisDto {
  cantidadVencidas: number;
  valorVencido: number;
  porcentajeMorosidad: number;
  interesesTotales: number;
  periodo: {
    inicio: string;
    fin: string;
  };
}
```

### 2.6 Crear `src/factura/dto/exportar-factura.dto.ts`

```typescript
import { IsArray, IsNumber, IsEnum, IsOptional, IsDateString } from 'class-validator';

export class ExportarFacturasLoteDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  idFacturas?: number[]; // Si no se proporciona, usar filtros

  @IsEnum(['EMITIDA', 'PAGADA', 'ANULADA', 'PENDIENTE'])
  @IsOptional()
  estado?: string;

  @IsEnum(['dia', 'mes', 'trimestre', 'año'])
  @IsOptional()
  periodo?: string = 'mes';

  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @IsDateString()
  @IsOptional()
  fechaFin?: string;
}
```

---

## PASO 5-7: MÉTODOS KPISSERVICE (6 horas)

### 5.1 Actualizar `src/common/services/kpis.service.ts`

Reemplazar métodos placeholder con implementación real:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Factura } from '../../factura/entities/factura.entity';
import { addDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';

@Injectable()
export class KpisService {
  private kpiCache = new Map<string, { data: any; timestamp: number }>();

  constructor(
    @InjectRepository(Factura)
    private facturaRepository: Repository<Factura>,
  ) {}

  // ==================== KPIS ADMIN ====================

  /**
   * KPI: Admin - Resumen de facturación del hotel
   * Retorna: totales, pendientes, morosidad, flujo diario, top clientes
   */
  async getKpisAdmin(
    idHotel: number,
    periodo: 'dia' | 'mes' | 'trimestre' | 'año' = 'mes',
    fechaInicio?: string,
    fechaFin?: string,
  ) {
    // Determinar rango de fechas
    const hoy = new Date();
    let inicio: Date;
    let fin: Date;
    let etiqueta: string;

    if (fechaInicio && fechaFin) {
      inicio = new Date(fechaInicio);
      fin = new Date(fechaFin);
      etiqueta = `${fechaInicio} - ${fechaFin}`;
    } else if (periodo === 'dia') {
      inicio = new Date(hoy);
      inicio.setHours(0, 0, 0, 0);
      fin = new Date(hoy);
      fin.setHours(23, 59, 59, 999);
      etiqueta = hoy.toISOString().split('T')[0];
    } else if (periodo === 'mes') {
      inicio = startOfMonth(hoy);
      fin = endOfMonth(hoy);
      etiqueta = `${hoy.getMonth() + 1}/${hoy.getFullYear()}`;
    } else if (periodo === 'trimestre') {
      const mes = hoy.getMonth();
      const trimestre = Math.floor(mes / 3);
      inicio = new Date(hoy.getFullYear(), trimestre * 3, 1);
      fin = endOfMonth(new Date(hoy.getFullYear(), trimestre * 3 + 2, 1));
      etiqueta = `Q${trimestre + 1} ${hoy.getFullYear()}`;
    } else {
      inicio = startOfYear(hoy);
      fin = endOfYear(hoy);
      etiqueta = hoy.getFullYear().toString();
    }

    // Ejecutar queries optimizadas (sin N+1)
    const [
      totalFacturas,
      facturasPagadas,
      facturasPendientes,
      morosidad,
      ingresosPorCategoria,
      flujoXDia,
      top10Clientes,
    ] = await Promise.all([
      this.getTotalFacturas(idHotel, inicio, fin),
      this.getFacturasPagadas(idHotel, inicio, fin),
      this.getFacturasPendientes(idHotel, inicio, fin),
      this.getMorosidad(idHotel),
      this.getIngresosPorCategoria(idHotel, inicio, fin),
      this.getFlujoXDia(idHotel, inicio, fin),
      this.getTop10Clientes(idHotel, inicio, fin),
    ]);

    return {
      periodo: {
        inicio: inicio.toISOString().split('T')[0],
        fin: fin.toISOString().split('T')[0],
        etiqueta,
      },
      kpis: {
        totalFacturas,
        facturasPagadas,
        facturasPendientes,
        tasaMorosidad: morosidad.porcentaje,
        promedioFactura:
          totalFacturas.cantidad > 0 ? totalFacturas.valor / totalFacturas.cantidad : 0,
        ingresosPorCategoria,
        flujoXDia,
        top10Clientes,
      },
      resumen: {
        periodo: etiqueta,
        generadoEn: new Date(),
        actualizado: true,
      },
    };
  }

  private async getTotalFacturas(
    idHotel: number,
    inicio: Date,
    fin: Date,
  ): Promise<{ cantidad: number; valor: number }> {
    const result = await this.facturaRepository.query(
      `
      SELECT
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as valor
      FROM facturas
      WHERE id_hotel = ? AND fecha_emision BETWEEN ? AND ?
      `,
      [idHotel, inicio, fin],
    );

    const row = result[0];
    return {
      cantidad: parseInt(row.cantidad) || 0,
      valor: parseFloat(row.valor) || 0,
    };
  }

  private async getFacturasPagadas(
    idHotel: number,
    inicio: Date,
    fin: Date,
  ): Promise<{ cantidad: number; valor: number }> {
    const result = await this.facturaRepository.query(
      `
      SELECT
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as valor
      FROM facturas
      WHERE id_hotel = ? 
        AND estado_factura = 'PAGADA'
        AND fecha_emision BETWEEN ? AND ?
      `,
      [idHotel, inicio, fin],
    );

    const row = result[0];
    return {
      cantidad: parseInt(row.cantidad) || 0,
      valor: parseFloat(row.valor) || 0,
    };
  }

  private async getFacturasPendientes(
    idHotel: number,
    inicio: Date,
    fin: Date,
  ): Promise<{ cantidad: number; valor: number }> {
    const result = await this.facturaRepository.query(
      `
      SELECT
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as valor
      FROM facturas
      WHERE id_hotel = ? 
        AND estado_factura IN ('EMITIDA', 'BORRADOR', 'EDITABLE')
        AND fecha_emision BETWEEN ? AND ?
      `,
      [idHotel, inicio, fin],
    );

    const row = result[0];
    return {
      cantidad: parseInt(row.cantidad) || 0,
      valor: parseFloat(row.valor) || 0,
    };
  }

  private async getMorosidad(idHotel: number): Promise<{ cantidad: number; porcentaje: number }> {
    const result = await this.facturaRepository.query(
      `
      SELECT
        COUNT(*) as cantidad_vencidas,
        (
          SELECT COUNT(*)
          FROM facturas f2
          WHERE f2.id_hotel = f.id_hotel
            AND f2.estado_factura = 'EMITIDA'
        ) as total_emitidas
      FROM facturas f
      WHERE f.id_hotel = ?
        AND f.estado_factura = 'EMITIDA'
        AND DATE(f.fecha_vencimiento) < CURDATE()
      `,
      [idHotel],
    );

    const row = result[0];
    const cantidad = parseInt(row.cantidad_vencidas) || 0;
    const total = parseInt(row.total_emitidas) || 1; // Evitar división por 0
    const porcentaje = (cantidad / total) * 100;

    return { cantidad, porcentaje: parseFloat(porcentaje.toFixed(2)) };
  }

  private async getIngresosPorCategoria(
    idHotel: number,
    inicio: Date,
    fin: Date,
  ): Promise<Record<string, number>> {
    const result = await this.facturaRepository.query(
      `
      SELECT
        COALESCE(df.categoria_nombre, 'Otros') as categoria,
        SUM(df.total) as total
      FROM detalle_facturas df
      JOIN facturas f ON df.id_factura = f.id
      WHERE f.id_hotel = ?
        AND f.estado_factura = 'PAGADA'
        AND f.fecha_emision BETWEEN ? AND ?
      GROUP BY df.categoria_nombre
      ORDER BY total DESC
      `,
      [idHotel, inicio, fin],
    );

    const ingresos: Record<string, number> = {};
    result.forEach((row) => {
      ingresos[row.categoria] = parseFloat(row.total) || 0;
    });

    return ingresos;
  }

  private async getFlujoXDia(
    idHotel: number,
    inicio: Date,
    fin: Date,
  ): Promise<Array<{ fecha: string; ingresos: number; cantidad: number }>> {
    const result = await this.facturaRepository.query(
      `
      SELECT
        DATE(f.fecha_emision) as fecha,
        COUNT(*) as cantidad,
        COALESCE(SUM(f.total), 0) as ingresos
      FROM facturas f
      WHERE f.id_hotel = ?
        AND f.estado_factura = 'PAGADA'
        AND f.fecha_emision BETWEEN ? AND ?
      GROUP BY DATE(f.fecha_emision)
      ORDER BY fecha DESC
      `,
      [idHotel, inicio, fin],
    );

    return result.map((row) => ({
      fecha: row.fecha,
      ingresos: parseFloat(row.ingresos) || 0,
      cantidad: parseInt(row.cantidad) || 0,
    }));
  }

  private async getTop10Clientes(
    idHotel: number,
    inicio: Date,
    fin: Date,
  ): Promise<
    Array<{
      idCliente: number;
      nombreCliente: string;
      gastosTotal: number;
      facturasTotales: number;
    }>
  > {
    const result = await this.facturaRepository.query(
      `
      SELECT
        f.id_cliente,
        f.nombre_cliente,
        COUNT(*) as facturas_totales,
        COALESCE(SUM(f.total), 0) as gastos_total
      FROM facturas f
      WHERE f.id_hotel = ?
        AND f.fecha_emision BETWEEN ? AND ?
      GROUP BY f.id_cliente, f.nombre_cliente
      ORDER BY gastos_total DESC
      LIMIT 10
      `,
      [idHotel, inicio, fin],
    );

    return result.map((row) => ({
      idCliente: row.id_cliente,
      nombreCliente: row.nombre_cliente,
      gastosTotal: parseFloat(row.gastos_total) || 0,
      facturasTotales: parseInt(row.facturas_totales) || 0,
    }));
  }

  // ==================== KPIS RECEPCIONISTA ====================

  async getKpisRecepcionista(idHotel: number, fecha?: string) {
    const fechaQuery = fecha
      ? new Date(fecha)
      : new Date();

    const fechaInicio = new Date(fechaQuery);
    fechaInicio.setHours(0, 0, 0, 0);

    const fechaFin = new Date(fechaQuery);
    fechaFin.setHours(23, 59, 59, 999);

    const [
      facturasCreadas,
      facturasEmitidas,
      facturasPagadas,
      ingresoHoy,
      alertasVencidas,
    ] = await Promise.all([
      this.getFacturasCreadas(idHotel, fechaInicio, fechaFin),
      this.getFacturasEmitidas(idHotel, fechaInicio, fechaFin),
      this.getFacturasPagadasHoy(idHotel, fechaInicio, fechaFin),
      this.getIngresoHoy(idHotel, fechaInicio, fechaFin),
      this.getAlertasVencidas(idHotel),
    ]);

    return {
      fecha: fechaQuery.toISOString().split('T')[0],
      kpis: {
        facturasCreadas,
        facturasEmitidas,
        facturasPagadas,
        ingresoHoy,
        pendientesHoy: facturasCreadas - facturasPagadas,
        huespedSinFacturar: [], // TODO: Integrar con ReservaService
        alertasVencidas,
      },
      resumen: {
        generadoEn: new Date(),
        actualizado: true,
      },
    };
  }

  private async getFacturasCreadas(
    idHotel: number,
    inicio: Date,
    fin: Date,
  ): Promise<number> {
    const result = await this.facturaRepository.query(
      `
      SELECT COUNT(*) as cantidad
      FROM facturas
      WHERE id_hotel = ? AND created_at BETWEEN ? AND ?
      `,
      [idHotel, inicio, fin],
    );

    return parseInt(result[0]?.cantidad) || 0;
  }

  private async getFacturasEmitidas(
    idHotel: number,
    inicio: Date,
    fin: Date,
  ): Promise<number> {
    const result = await this.facturaRepository.query(
      `
      SELECT COUNT(*) as cantidad
      FROM facturas
      WHERE id_hotel = ?
        AND estado_factura = 'EMITIDA'
        AND fecha_emision BETWEEN ? AND ?
      `,
      [idHotel, inicio, fin],
    );

    return parseInt(result[0]?.cantidad) || 0;
  }

  private async getFacturasPagadasHoy(
    idHotel: number,
    inicio: Date,
    fin: Date,
  ): Promise<number> {
    const result = await this.facturaRepository.query(
      `
      SELECT COUNT(*) as cantidad
      FROM facturas
      WHERE id_hotel = ?
        AND estado_factura = 'PAGADA'
        AND updated_at BETWEEN ? AND ?
      `,
      [idHotel, inicio, fin],
    );

    return parseInt(result[0]?.cantidad) || 0;
  }

  private async getIngresoHoy(
    idHotel: number,
    inicio: Date,
    fin: Date,
  ): Promise<number> {
    const result = await this.facturaRepository.query(
      `
      SELECT COALESCE(SUM(total), 0) as total
      FROM facturas
      WHERE id_hotel = ?
        AND estado_factura = 'PAGADA'
        AND updated_at BETWEEN ? AND ?
      `,
      [idHotel, inicio, fin],
    );

    return parseFloat(result[0]?.total) || 0;
  }

  private async getAlertasVencidas(idHotel: number): Promise<any[]> {
    const result = await this.facturaRepository.query(
      `
      SELECT
        id,
        numero_factura,
        total,
        DATEDIFF(CURDATE(), fecha_vencimiento) as dias_vencida
      FROM facturas
      WHERE id_hotel = ?
        AND estado_factura = 'EMITIDA'
        AND DATE(fecha_vencimiento) < CURDATE()
      ORDER BY dias_vencida DESC
      LIMIT 5
      `,
      [idHotel],
    );

    return result.map((row) => ({
      idFactura: row.id,
      numeroFactura: row.numero_factura,
      diasVencida: parseInt(row.dias_vencida),
      monto: parseFloat(row.total),
    }));
  }

  // ==================== KPIS SUPERADMIN ====================

  async getKpisSuperadmin(
    periodo: 'dia' | 'mes' | 'trimestre' | 'año' = 'mes',
    fechaInicio?: string,
    fechaFin?: string,
  ) {
    // Determinar rango de fechas (igual que admin)
    const hoy = new Date();
    let inicio: Date;
    let fin: Date;

    if (fechaInicio && fechaFin) {
      inicio = new Date(fechaInicio);
      fin = new Date(fechaFin);
    } else if (periodo === 'mes') {
      inicio = startOfMonth(hoy);
      fin = endOfMonth(hoy);
    } else if (periodo === 'trimestre') {
      const mes = hoy.getMonth();
      const trimestre = Math.floor(mes / 3);
      inicio = new Date(hoy.getFullYear(), trimestre * 3, 1);
      fin = endOfMonth(new Date(hoy.getFullYear(), trimestre * 3 + 2, 1));
    } else {
      inicio = startOfYear(hoy);
      fin = endOfYear(hoy);
    }

    const [
      totalFacturas,
      facturasPorEstado,
      topHoteles,
    ] = await Promise.all([
      this.getTotalFacturasGlobal(inicio, fin),
      this.getFacturasPorEstadoGlobal(inicio, fin),
      this.getTopHotelesGlobal(inicio, fin),
    ]);

    return {
      periodo: {
        inicio: inicio.toISOString().split('T')[0],
        fin: fin.toISOString().split('T')[0],
      },
      kpis: {
        totalFacturas,
        facturasPorEstado,
        topHoteles,
        análisisMorosidad: await this.getAnálisisMorosidadGlobal(),
      },
      resumen: {
        generadoEn: new Date(),
        actualizado: true,
      },
    };
  }

  private async getTotalFacturasGlobal(
    inicio: Date,
    fin: Date,
  ): Promise<{ cantidad: number; valor: number }> {
    const result = await this.facturaRepository.query(
      `
      SELECT
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as valor
      FROM facturas
      WHERE fecha_emision BETWEEN ? AND ?
      `,
      [inicio, fin],
    );

    const row = result[0];
    return {
      cantidad: parseInt(row.cantidad) || 0,
      valor: parseFloat(row.valor) || 0,
    };
  }

  private async getFacturasPorEstadoGlobal(
    inicio: Date,
    fin: Date,
  ): Promise<Record<string, { cantidad: number; valor: number }>> {
    const result = await this.facturaRepository.query(
      `
      SELECT
        estado_factura,
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as valor
      FROM facturas
      WHERE fecha_emision BETWEEN ? AND ?
      GROUP BY estado_factura
      `,
      [inicio, fin],
    );

    const porEstado: Record<string, { cantidad: number; valor: number }> = {};
    result.forEach((row) => {
      porEstado[row.estado_factura] = {
        cantidad: parseInt(row.cantidad),
        valor: parseFloat(row.valor),
      };
    });

    return porEstado;
  }

  private async getTopHotelesGlobal(
    inicio: Date,
    fin: Date,
  ): Promise<
    Array<{
      idHotel: number;
      nombre: string;
      ingresos: number;
      facturas: number;
    }>
  > {
    const result = await this.facturaRepository.query(
      `
      SELECT
        f.id_hotel,
        h.nombre,
        COUNT(*) as facturas,
        COALESCE(SUM(f.total), 0) as ingresos
      FROM facturas f
      LEFT JOIN hoteles h ON f.id_hotel = h.id
      WHERE f.fecha_emision BETWEEN ? AND ?
      GROUP BY f.id_hotel, h.nombre
      ORDER BY ingresos DESC
      LIMIT 10
      `,
      [inicio, fin],
    );

    return result.map((row) => ({
      idHotel: row.id_hotel,
      nombre: row.nombre || 'Hotel desconocido',
      facturas: parseInt(row.facturas),
      ingresos: parseFloat(row.ingresos),
    }));
  }

  private async getAnálisisMorosidadGlobal(): Promise<{
    cantidadVencidas: number;
    valorVencido: number;
    porcentajeMorosidad: number;
  }> {
    const result = await this.facturaRepository.query(
      `
      SELECT
        COUNT(*) as cantidad_vencidas,
        COALESCE(SUM(total), 0) as valor_vencido,
        (
          SELECT COUNT(*)
          FROM facturas
          WHERE estado_factura = 'EMITIDA'
        ) as total_emitidas
      FROM facturas
      WHERE estado_factura = 'EMITIDA'
        AND DATE(fecha_vencimiento) < CURDATE()
      `,
    );

    const row = result[0];
    const cantidadVencidas = parseInt(row.cantidad_vencidas) || 0;
    const totalEmitidas = parseInt(row.total_emitidas) || 1;

    return {
      cantidadVencidas,
      valorVencido: parseFloat(row.valor_vencido) || 0,
      porcentajeMorosidad: parseFloat(((cantidadVencidas / totalEmitidas) * 100).toFixed(2)),
    };
  }
}
```

### 5.2 Agregar Métodos de Reportes a FacturaService

En `src/factura/factura.service.ts`, agregar:

```typescript
/**
 * Generar reporte de ingresos agrupados por categoría
 */
async getReporteIngresos(
  idHotel: number,
  agruparPor: 'categoria' | 'dia' | 'semana' | 'mes',
  periodo: 'mes' | 'trimestre' | 'año' = 'mes',
  fechaInicio?: string,
  fechaFin?: string,
) {
  // Determinar rango de fechas
  const hoy = new Date();
  let inicio: Date;
  let fin: Date;

  if (fechaInicio && fechaFin) {
    inicio = new Date(fechaInicio);
    fin = new Date(fechaFin);
  } else if (periodo === 'mes') {
    inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  } else if (periodo === 'trimestre') {
    const trimestre = Math.floor(hoy.getMonth() / 3);
    inicio = new Date(hoy.getFullYear(), trimestre * 3, 1);
    fin = new Date(hoy.getFullYear(), trimestre * 3 + 3, 0);
  } else {
    inicio = new Date(hoy.getFullYear(), 0, 1);
    fin = new Date(hoy.getFullYear(), 11, 31);
  }

  if (agruparPor === 'categoria') {
    const query = `
      SELECT
        COALESCE(df.categoria_nombre, 'Otros') as categoria,
        COUNT(*) as cantidad,
        SUM(df.subtotal) as subtotal,
        SUM(df.monto_iva) as iva,
        SUM(COALESCE(df.monto_inc, 0)) as inc,
        SUM(df.total) as total,
        ROUND(
          SUM(df.total) * 100 /
          (SELECT SUM(total) FROM detalle_facturas df2 
           JOIN facturas f2 ON df2.id_factura = f2.id
           WHERE f2.id_hotel = ? AND f2.estado_factura = 'PAGADA'
           AND f2.fecha_emision BETWEEN ? AND ?),
          2
        ) as porcentaje_total
      FROM detalle_facturas df
      JOIN facturas f ON df.id_factura = f.id
      WHERE f.id_hotel = ?
        AND f.estado_factura = 'PAGADA'
        AND f.fecha_emision BETWEEN ? AND ?
      GROUP BY df.categoria_nombre
      ORDER BY total DESC
    `;

    const result = await this.dataSource.query(query, [
      idHotel,
      inicio,
      fin,
      idHotel,
      inicio,
      fin,
    ]);

    return result.map((row) => ({
      categoria: row.categoria,
      cantidad: parseInt(row.cantidad),
      subtotal: parseFloat(row.subtotal),
      iva: parseFloat(row.iva),
      inc: parseFloat(row.inc),
      total: parseFloat(row.total),
      porcentajeTotal: parseFloat(row.porcentaje_total),
    }));
  } else if (agruparPor === 'dia') {
    const query = `
      SELECT
        DATE(f.fecha_emision) as fecha,
        COUNT(*) as cantidad,
        SUM(f.total) as total
      FROM facturas f
      WHERE f.id_hotel = ?
        AND f.estado_factura = 'PAGADA'
        AND f.fecha_emision BETWEEN ? AND ?
      GROUP BY DATE(f.fecha_emision)
      ORDER BY fecha DESC
    `;

    const result = await this.dataSource.query(query, [idHotel, inicio, fin]);

    return result.map((row) => ({
      fecha: row.fecha,
      cantidad: parseInt(row.cantidad),
      total: parseFloat(row.total),
    }));
  }

  return [];
}

/**
 * Obtener top clientes
 */
async getReporteClientes(
  idHotel: number,
  limit: number = 10,
  periodo: 'mes' | 'trimestre' | 'año' | 'todo' = 'mes',
) {
  const hoy = new Date();
  let inicio: Date;
  let fin: Date;

  if (periodo === 'mes') {
    inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  } else if (periodo === 'trimestre') {
    const trimestre = Math.floor(hoy.getMonth() / 3);
    inicio = new Date(hoy.getFullYear(), trimestre * 3, 1);
    fin = new Date(hoy.getFullYear(), trimestre * 3 + 3, 0);
  } else if (periodo === 'año') {
    inicio = new Date(hoy.getFullYear(), 0, 1);
    fin = new Date(hoy.getFullYear(), 11, 31);
  } else {
    inicio = new Date(1970, 0, 1);
    fin = new Date(2099, 11, 31);
  }

  const query = `
    SELECT
      f.id_cliente,
      f.nombre_cliente,
      f.cedula_cliente,
      f.email_cliente,
      COUNT(*) as facturas_totales,
      SUM(f.total) as gastos_total,
      COALESCE(SUM(CASE WHEN f.estado_factura != 'PAGADA' THEN f.total ELSE 0 END), 0) as salido_actual,
      MAX(f.fecha_emision) as última_compra
    FROM facturas f
    WHERE f.id_hotel = ? AND f.fecha_emision BETWEEN ? AND ?
    GROUP BY f.id_cliente, f.nombre_cliente
    ORDER BY gastos_total DESC
    LIMIT ?
  `;

  const result = await this.dataSource.query(query, [idHotel, inicio, fin, limit]);

  return result.map((row) => ({
    idCliente: row.id_cliente,
    nombreCliente: row.nombre_cliente,
    cedulaCliente: row.cedula_cliente,
    emailCliente: row.email_cliente,
    facturasTotales: parseInt(row.facturas_totales),
    gastosTotal: parseFloat(row.gastos_total),
    salidoActual: parseFloat(row.salido_actual),
    últimaCompra: row.última_compra,
  }));
}

/**
 * Obtener análisis de morosidad
 */
async getReporteMorosidad(
  idHotel: number,
  diasAtrasados: number = 30,
  periodo: 'mes' | 'trimestre' | 'año' = 'mes',
) {
  const hoy = new Date();
  let inicio: Date;
  let fin: Date;

  if (periodo === 'mes') {
    inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  } else if (periodo === 'trimestre') {
    const trimestre = Math.floor(hoy.getMonth() / 3);
    inicio = new Date(hoy.getFullYear(), trimestre * 3, 1);
    fin = new Date(hoy.getFullYear(), trimestre * 3 + 3, 0);
  } else {
    inicio = new Date(hoy.getFullYear(), 0, 1);
    fin = new Date(hoy.getFullYear(), 11, 31);
  }

  const query = `
    SELECT
      f.id,
      f.numero_factura,
      f.id_cliente,
      f.nombre_cliente,
      f.total as monto_total,
      COALESCE(f.total - SUM(COALESCE(p.monto, 0)), f.total) as monto_saldo,
      f.fecha_emision,
      f.fecha_vencimiento,
      DATEDIFF(CURDATE(), f.fecha_vencimiento) as dias_atrasada,
      ROUND(DATEDIFF(CURDATE(), f.fecha_vencimiento) * f.total * 0.005 / 30, 2) as intereses_acumulados,
      f.estado_factura as estado
    FROM facturas f
    LEFT JOIN pagos p ON f.id = p.id_factura
    WHERE f.id_hotel = ?
      AND f.estado_factura = 'EMITIDA'
      AND DATE(f.fecha_vencimiento) <= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY f.id
    ORDER BY dias_atrasada DESC
  `;

  const result = await this.dataSource.query(query, [idHotel, diasAtrasados]);

  return result.map((row) => ({
    idFactura: row.id,
    numeroFactura: row.numero_factura,
    idCliente: row.id_cliente,
    nombreCliente: row.nombre_cliente,
    montoTotal: parseFloat(row.monto_total),
    montoSaldo: parseFloat(row.monto_saldo),
    fechaEmision: row.fecha_emision,
    fechaVencimiento: row.fecha_vencimiento,
    diasAtrasada: parseInt(row.dias_atrasada),
    tasaInteresMora: 0.5, // 0.5% mensual
    interesesAcumulados: parseFloat(row.intereses_acumulados),
    estado: row.estado,
  }));
}
```

---

## PASO 8-10: ENDPOINTS REST (3 horas)

### 8.1 Actualizar `src/common/controllers/kpis.controller.ts`

Reemplazar métodos placeholder:

```typescript
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { KpisService } from '../services/kpis.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('KPIs - Facturación')
@Controller('kpis/facturacion')
@ApiBearerAuth()
export class KpisController {
  constructor(private readonly kpisService: KpisService) {}

  /**
   * GET /kpis/facturacion/admin
   * Obtener KPIs del hotel (admin scope)
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Obtener KPIs de facturación por hotel' })
  @ApiQuery({ name: 'idHotel', type: Number, required: true })
  @ApiQuery({ name: 'periodo', enum: ['dia', 'mes', 'trimestre', 'año'], required: false })
  @ApiQuery({ name: 'fechaInicio', type: String, required: false })
  @ApiQuery({ name: 'fechaFin', type: String, required: false })
  @ApiResponse({ status: 200, description: 'KPIs obtenidos exitosamente' })
  @ApiResponse({ status: 403, description: 'No tiene acceso a este hotel' })
  async getKpisAdmin(
    @Query('idHotel', ParseIntPipe) idHotel: number,
    @Query('periodo') periodo: 'dia' | 'mes' | 'trimestre' | 'año' = 'mes',
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Request() req?: any,
  ) {
    // Validación RBAC
    if (req.user.rol === 'admin' && req.user.idHotel !== idHotel) {
      throw new ForbiddenException('No tiene acceso a este hotel');
    }

    return this.kpisService.getKpisAdmin(idHotel, periodo, fechaInicio, fechaFin);
  }

  /**
   * GET /kpis/facturacion/recepcionista
   * Obtener KPIs del día (recepcionista scope)
   */
  @Get('recepcionista')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recepcionista', 'admin', 'superadmin')
  @ApiOperation({ summary: 'Obtener KPIs de facturación diarios' })
  @ApiQuery({ name: 'idHotel', type: Number, required: true })
  @ApiQuery({ name: 'fecha', type: String, required: false })
  @ApiResponse({ status: 200, description: 'KPIs obtenidos exitosamente' })
  async getKpisRecepcionista(
    @Query('idHotel', ParseIntPipe) idHotel: number,
    @Query('fecha') fecha?: string,
    @Request() req?: any,
  ) {
    // Validación RBAC
    if (
      (req.user.rol === 'admin' || req.user.rol === 'recepcionista') &&
      req.user.idHotel !== idHotel
    ) {
      throw new ForbiddenException('No tiene acceso a este hotel');
    }

    return this.kpisService.getKpisRecepcionista(idHotel, fecha);
  }

  /**
   * GET /kpis/facturacion/superadmin
   * Obtener KPIs consolidados de toda la plataforma
   */
  @Get('superadmin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiOperation({ summary: 'Obtener KPIs consolidados de plataforma' })
  @ApiQuery({ name: 'periodo', enum: ['dia', 'mes', 'trimestre', 'año'], required: false })
  @ApiQuery({ name: 'fechaInicio', type: String, required: false })
  @ApiQuery({ name: 'fechaFin', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Métricas consolidadas' })
  async getKpisSuperadmin(
    @Query('periodo') periodo: 'dia' | 'mes' | 'trimestre' | 'año' = 'mes',
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.kpisService.getKpisSuperadmin(periodo, fechaInicio, fechaFin);
  }
}
```

### 8.2 Crear `src/factura/reportes.controller.ts`

```typescript
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { FacturaService } from './factura.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Facturas - Reportes')
@Controller('facturas/reportes')
@ApiBearerAuth()
export class ReportesController {
  constructor(private readonly facturaService: FacturaService) {}

  /**
   * GET /facturas/reportes/ingresos
   * Reporte de ingresos agrupados por categoría o período
   */
  @Get('ingresos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Reporte de ingresos' })
  @ApiQuery({ name: 'idHotel', type: Number })
  @ApiQuery({ name: 'agruparPor', enum: ['categoria', 'dia', 'semana', 'mes'] })
  @ApiQuery({ name: 'periodo', enum: ['mes', 'trimestre', 'año'] })
  @ApiResponse({ status: 200, description: 'Reporte generado' })
  async getReporteIngresos(
    @Query('idHotel', ParseIntPipe) idHotel: number,
    @Query('agruparPor') agruparPor: 'categoria' | 'dia' | 'semana' | 'mes',
    @Query('periodo') periodo: 'mes' | 'trimestre' | 'año' = 'mes',
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Request() req?: any,
  ) {
    if (req.user.rol === 'admin' && req.user.idHotel !== idHotel) {
      throw new ForbiddenException('No tiene acceso a este hotel');
    }

    return this.facturaService.getReporteIngresos(
      idHotel,
      agruparPor,
      periodo,
      fechaInicio,
      fechaFin,
    );
  }

  /**
   * GET /facturas/reportes/clientes
   * Top clientes por gasto
   */
  @Get('clientes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Top clientes por gasto' })
  @ApiQuery({ name: 'idHotel', type: Number })
  @ApiQuery({ name: 'limit', type: Number })
  @ApiQuery({ name: 'periodo', enum: ['mes', 'trimestre', 'año', 'todo'] })
  async getReporteClientes(
    @Query('idHotel', ParseIntPipe) idHotel: number,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('periodo') periodo: 'mes' | 'trimestre' | 'año' | 'todo' = 'mes',
    @Request() req?: any,
  ) {
    if (req.user.rol === 'admin' && req.user.idHotel !== idHotel) {
      throw new ForbiddenException('No tiene acceso a este hotel');
    }

    return this.facturaService.getReporteClientes(idHotel, limit, periodo);
  }

  /**
   * GET /facturas/reportes/morosidad
   * Análisis de facturas morosas
   */
  @Get('morosidad')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Análisis de morosidad' })
  @ApiQuery({ name: 'idHotel', type: Number })
  @ApiQuery({ name: 'diasAtrasados', type: Number })
  @ApiQuery({ name: 'periodo', enum: ['mes', 'trimestre', 'año'] })
  async getReporteMorosidad(
    @Query('idHotel', ParseIntPipe) idHotel: number,
    @Query('diasAtrasados', ParseIntPipe) diasAtrasados: number = 30,
    @Query('periodo') periodo: 'mes' | 'trimestre' | 'año' = 'mes',
    @Request() req?: any,
  ) {
    if (req.user.rol === 'admin' && req.user.idHotel !== idHotel) {
      throw new ForbiddenException('No tiene acceso a este hotel');
    }

    return this.facturaService.getReporteMorosidad(idHotel, diasAtrasados, periodo);
  }
}
```

---

## PASO 11: EXPORTACIÓN (2 horas)

### 11.1Agregar métodos de exportación a FacturaService

```typescript
import * as XLSX from 'xlsx';
import * as PDFDocument from 'pdfkit';

/**
 * Exportar factura como PDF
 */
async exportarPdf(idFactura: number): Promise<Buffer> {
  const factura = await this.facturaRepository.findOne({
    where: { id: idFactura },
    relations: ['detalles'],
  });

  if (!factura) {
    throw new NotFoundException('Factura no encontrada');
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('FACTURA', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(factura.numeroFactura, { align: 'center' });

    doc.moveTo(50, 80).lineTo(550, 80).stroke();

    // Datos cliente
    doc.fontSize(10).text('Cliente:', 50, 100);
    doc.text(factura.nombreCliente, 100, 100);
    doc.text(`Cédula: ${factura.cedulaCliente}`, 100, 115);
    doc.text(`Email: ${factura.emailCliente}`, 100, 130);

    // Fechas
    doc.text(`Fecha Emisión: ${factura.fechaEmision}`, 350, 100);
    doc.text(`Fecha Vencimiento: ${factura.fechaVencimiento}`, 350, 115);

    // Tabla de detalles
    doc.moveTo(50, 180).lineTo(550, 180).stroke();

    const tableY = 190;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Descripción', 50, tableY);
    doc.text('Cantidad', 300, tableY);
    doc.text('Precio', 380, tableY);
    doc.text('Total', 480, tableY);

    doc.moveTo(50, tableY + 15).lineTo(550, tableY + 15).stroke();

    let currentY = tableY + 25;
    doc.font('Helvetica').fontSize(9);

    factura.detalles?.forEach((detalle) => {
      doc.text(detalle.descripcion.substring(0, 40), 50, currentY);
      doc.text(detalle.cantidad.toString(), 300, currentY);
      doc.text(detalle.precioUnitario.toString(), 380, currentY);
      doc.text(detalle.total.toString(), 480, currentY);
      currentY += 20;
    });

    // Totales
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 10;

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(`Subtotal: $${factura.subtotal.toFixed(2)}`, 380, currentY);
    currentY += 20;
    doc.text(`IVA (${factura.porcentajeIva}%): $${factura.montoIva.toFixed(2)}`, 380, currentY);
    currentY += 20;
    doc.text(`TOTAL: $${factura.total.toFixed(2)}`, 380, currentY);

    doc.end();
  });
}

/**
 * Exportar múltiples facturas como Excel
 */
async exportarExcelLote(
  idFacturas: number[],
  estado?: string,
  periodo?: string,
  fechaInicio?: string,
  fechaFin?: string,
): Promise<Buffer> {
  let facturas: Factura[];

  if (idFacturas && idFacturas.length > 0) {
    facturas = await this.facturaRepository.findByIds(idFacturas);
  } else {
    // Usar filtros
    const hoy = new Date();
    let inicio: Date = new Date();
    let fin: Date = new Date();

    if (fechaInicio && fechaFin) {
      inicio = new Date(fechaInicio);
      fin = new Date(fechaFin);
    } else if (periodo === 'mes') {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    }

    const query = this.facturaRepository.createQueryBuilder('f');

    if (estado) {
      query.where('f.estadoFactura = :estado', { estado });
    }

    query.andWhere('f.fechaEmision BETWEEN :inicio AND :fin', { inicio, fin });

    facturas = await query.getMany();
  }

  // Crear libro de Excel
  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumen
  const resumenData = [
    ['RESUMEN DE FACTURAS'],
    [],
    ['Total Facturas', facturas.length],
    ['Total Ingresos', facturas.reduce((sum, f) => sum + f.total, 0)],
    ['Promedio', facturas.reduce((sum, f) => sum + f.total, 0) / facturas.length],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');

  // Sheet 2: Detalle
  const detalleData = [
    ['ID', 'Número', 'Cliente', 'Estado', 'Total', 'Fecha Emisión'],
    ...facturas.map((f) => [
      f.id,
      f.numeroFactura,
      f.nombreCliente,
      f.estadoFactura,
      f.total,
      f.fechaEmision,
    ]),
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(detalleData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Facturas');

  // Generar buffer
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  return buffer;
}
```

### 11.2 Agregar endpoints de exportación a FacturaController

```typescript
// En factura.controller.ts

/**
 * POST /facturas/:id/exportar?formato=pdf
 * Descargar factura como PDF
 */
@Post(':id/exportar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin', 'cliente')
@ApiBearerAuth()
@ApiOperation({ summary: 'Exportar factura como PDF' })
@ApiQuery({ name: 'formato', enum: ['pdf', 'xml'], required: false })
@ApiResponse({ status: 200, description: 'PDF descargado' })
async exportarFactura(
  @Param('id', ParseIntPipe) id: number,
  @Query('formato') formato: 'pdf' | 'xml' = 'pdf',
  @Request() req: any,
  @Response() res: any,
) {
  const factura = await this.facturaService.findOne(id);

  // Validar acceso
  if (req.user.rol === 'cliente' && factura.idCliente !== req.user.idCliente) {
    throw new ForbiddenException('No tiene acceso a esta factura');
  }

  if (req.user.rol === 'admin' && factura.idHotel !== req.user.idHotel) {
    throw new ForbiddenException('No tiene acceso a esta factura');
  }

  if (formato === 'pdf') {
    const pdf = await this.facturaService.exportarPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="FAC-${factura.numeroFactura}.pdf"`);
    res.send(pdf);
  } else {
    // XML (simplificado)
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Factura>
  <NumeroFactura>${factura.numeroFactura}</NumeroFactura>
  <Total>${factura.total}</Total>
</Factura>`;
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="FAC-${factura.numeroFactura}.xml"`);
    res.send(xml);
  }
}

/**
 * POST /facturas/exportar/lote
 * Descargar múltiples facturas como Excel
 */
@Post('exportar/lote')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@ApiBearerAuth()
@ApiOperation({ summary: 'Exportar múltiples facturas como Excel' })
async exportarLote(
  @Body() dto: ExportarFacturasLoteDto,
  @Request() req: any,
  @Response() res: any,
) {
  const excel = await this.facturaService.exportarExcelLote(
    dto.idFacturas,
    dto.estado,
    dto.periodo,
    dto.fechaInicio,
    dto.fechaFin,
  );

  res.setHeader('Content-Type', 'application/vnd.ms-excel');
  res.setHeader('Content-Disposition', `attachment; filename="Facturas_${this.getDateString()}.xlsx"`);
  res.send(excel);
}

private getDateString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}
```

---

## PASO 12-13: TESTS Y DEPLOY (2 horas)

### 12.1 Test E2E Básico

Crear `test/kpis-facturacion.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('KPIs Facturación (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Obtener token de prueba (mock)
    authToken = 'test-token-admin-hotel-1';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /kpis/facturacion/admin', () => {
    it('debe retornar KPIs de admin', () => {
      return request(app.getHttpServer())
        .get('/kpis/facturacion/admin?idHotel=1&periodo=mes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('kpis');
          expect(res.body.kpis).toHaveProperty('totalFacturas');
          expect(res.body.kpis).toHaveProperty('facturasPagadas');
        });
    });
  });

  describe('GET /facturas/reportes/ingresos', () => {
    it('debe retornar reporte de ingresos', () => {
      return request(app.getHttpServer())
        .get('/facturas/reportes/ingresos?idHotel=1&agruparPor=categoria&periodo=mes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
```

### 12.2 Actualizar FacturaModule

En `src/factura/factura.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturaController } from './factura.controller';
import { ReportesController } from './reportes.controller';
import { FacturaService } from './factura.service';
// ... imports

@Module({
  imports: [
    TypeOrmModule.forFeature([Factura, DetalleFactura, ...]),
    // ... otros imports
  ],
  controllers: [FacturaController, ReportesController], // Agregar ReportesController
  providers: [FacturaService],
  exports: [FacturaService],
})
export class FacturaModule {}
```

### 12.3 Actualizar CommonModule

En `src/common/common.module.ts`, asegurar que KpisService está registrado:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KpisService } from './services/kpis.service';
import { KpisController } from './controllers/kpis.controller';
import { Factura } from '../factura/entities/factura.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Factura])],
  controllers: [KpisController],
  providers: [KpisService],
  exports: [KpisService],
})
export class CommonModule {}
```

### 12.4 BUILD Y VALIDACIÓN

```bash
# Compilar
npm run build

# Validación de tipos
npx tsc --noEmit

# Linting
npm run lint

# Tests
npm run test:e2e

# Verificar que no hay errores
echo "Build check complete"
```

### 12.5 Checklist Pre-Release

- [ ] ✅ Todos los métodos KpisService implementados
- [ ] ✅ Todos los endpoints wired en controllers
- [ ] ✅ DTOs con validaciones
- [ ] ✅ RBAC configurado en endpoints
- [ ] ✅ Queries SQL sin N+1
- [ ] ✅ Librerías instaladas (pdfkit, xlsx)
- [ ] ✅ npm run build sin errores
- [ ] ✅ Tests E2E pasando
- [ ] ✅ Documentación Swagger visible
- [ ] ✅ Performance < 2 segundos para KPIs
- [ ] ✅ Índices BD createidos
- [ ] ✅ Cache strategy implementada
- [ ] ✅ Logs agregados para monitoreo

### 12.6 Deploy

```bash
# 1. Push cambios
git add -A
git commit -m "feat: FASE 8 P2 KPIs y Reportes Facturación

- Implementar getKpisAdmin() con 8 KPIs
- Implementar getKpisRecepcionista() con alertas
- Implementar getKpisSuperadmin() consolidado
- Agregar 3 reportes (ingresos, clientes, morosidad)
- Agregar exportación PDF/Excel
- DTOs con validaciones
- RBAC en todos endpoints
- Tests E2E básicos"

git push origin feature/fase8-p2-kpis-reportes

# 2. Pull Request -> Review -> Merge

# 3. Deploy a staging
npm run build
docker build -t hotel-sena:fase8-p2 .
docker push hotel-sena:fase8-p2

# 4. Pruebas en staging
curl -H "Authorization: Bearer $TOKEN" \
  http://staging-api.hotelsena.com/kpis/facturacion/admin?idHotel=1

# 5. Deploy a producción (si todo bien)
kubectl set image deployment/hotel-api \
  hotel-api=hotel-sena:fase8-p2 -n production
```

---

## RESUMEN TIEMPOS

| Paso | Componente | Duración | Inicio Estimado |
|------|-----------|----------|-----------------|
| 1 | Preparación | 1h | 09:00 |
| 2-4 | DTOs | 1h | 10:00 |
| 5-7 | KpisService | 6h | 11:00 |
| 8-10 | Controllers | 3h | 17:00 |
| 11 | Exportación | 2h | 20:00 |
| 12-13 | Tests + Deploy | 2h | 22:00 |
| **TOTAL** | **P2 Completo** | **13h** | **09:00 → 22:00** |

---

## CHECKLIST FINAL

- [ ] Paso 1: Librerías instaladas
- [ ] Paso 2-4: DTOs creados y validando
- [ ] Paso 5: KpisService completamente implementado
- [ ] Paso 6: KpisController actualizado
- [ ] Paso 7: ReportesController creado
- [ ] Paso 8: Métodos reportes en FacturaService
- [ ] Paso 9: Endpoints exportación funcionando
- [ ] Paso 10: Módulos actualizados
- [ ] Paso 11: Tests E2E pasando
- [ ] Paso 12: npm run build exitoso
- [ ] Paso 13: Deploy completado
- [ ] Documentación SWAGGER visible

---

**Referencia**: [ANALISIS_KPI_FACTURACION_P2.md](ANALISIS_KPI_FACTURACION_P2.md)
