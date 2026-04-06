import { Injectable } from '@nestjs/common';

/**
 * SERVICIO DE KPIs PARA DASHBOARDS
 *
 * Proporciona métricas agregadas por rol:
 * - Recepcionista: flujo del día, caja, check-ins/outs
 * - Admin: estado del hotel, ocupación, ingresos
 * - Superadmin: métricas de plataforma, crecimiento SaaS
 *
 * NOTA: Para evitar circular dependencies, este servicio proporciona
 * la INTERFACE de KPIs. La IMPLEMENTACIÓN de cálculos se hace en:
 * - ReservaService (para flujo de reservas)
 * - FacturaService (para ingresos)
 * - HotelService (para ocupación)
 *
 * Este servicio es un GATEWAY que coordina llamadas a otros servicios
 * y consolida resultados en DTOs tipados.
 *
 * Uso:
 * const kpis = await this.kpisService.getFlujoDiaRecepcionista(idHotel);
 */
@Injectable()
export class KpisService {
  constructor() {}

  /**
   * KPI: Flujo del día para RECEPCIONISTA
   * 
   * Pendientes check-in, check-out, realizados hoy
   * 
   * IMPLEMENTACIÓN: Deferida a FASE 5 (Workflows)
   * Por ahora retorna valores placeholders
   */
  async getFlujoDiaRecepcionista(idHotel: number) {
    // TODO: Implementar con ReservaService.findPendientesCheckinHoy(idHotel)
    return {
      pendientesCheckin: 0,
      pendientesCheckout: 0,
      checkinsRealizados: 0,
      checkoutsRealizados: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * KPI: Caja del día para RECEPCIONISTA
   * 
   * Ingresos, egresos, saldo
   * 
   * IMPLEMENTACIÓN: Deferida a FASE 5 (Workflows)
   * Por ahora retorna valores placeholders
   */
  async getCajaDiaRecepcionista(idHotel: number) {
    // TODO: Implementar con PagoService.findMovimientosHoy(idHotel)
    return {
      movimientosHoy: 0,
      ingresoTotal: 0,
      egresos: 0,
      saldo: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * KPI: Estado del hotel para ADMIN
   * 
   * Ocupación, reservas, ingresos
   * 
   * IMPLEMENTACIÓN: Deferida a FASE 5 (Workflows)
   * Por ahora retorna valores placeholders
   */
  async getEstadoHotel(idHotel: number) {
    // TODO: Implementar con HotelService + ReservaService
    return {
      ocupacionActual: 0,
      reservasProximas7dias: 0,
      ingresosMes: 0,
      estado: 'operativo',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * KPI: Métricas de plataforma para SUPERADMIN
   * 
   * Hoteles, usuarios, ingresos
   * 
   * IMPLEMENTACIÓN: Deferida a FASE 7 (Analytics)
   * Por ahora retorna valores placeholders
   */
  async getMetricasPlataforma() {
    // TODO: Implementar con HotelService.count() + FacturaService.sumIngresos()
    return {
      hotelesActivos: 0,
      usuariosTotales: 0,
      ingresosTotales: 0,
      facturasEmitidas: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * KPI: Crecimiento de plataforma para SUPERADMIN
   * 
   * Tendencias mes/trimestre/año
   * 
   * IMPLEMENTACIÓN: Deferida a FASE 7 (Analytics)
   * Por ahora retorna valores placeholders
   */
  async getCrecimientoPlataforma(periodo: 'mes' | 'trimestre' | 'año' = 'mes') {
    // TODO: Implementar con aggregations en FacturaService
    return {
      hotelesNuevos: 0,
      usuariosNuevos: 0,
      ingresosPeriodo: 0,
      periodo,
      timestamp: new Date().toISOString(),
    };
  }
}
