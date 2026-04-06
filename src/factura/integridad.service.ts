import { Injectable } from '@nestjs/common';
import { Factura } from './entities/factura.entity';
import { DetalleFactura } from './entities/detalle-factura.entity';

/**
 * Servicio de validación de integridad de datos de facturas
 * Fase 4: Validaciones de negocio para asegurar consistencia
 */
@Injectable()
export class IntegridadService {
  /**
   * Validar que los totales de una factura sean consistentes
   */
  validarTotalesFactura(factura: Factura): {
    valida: boolean;
    errores: string[];
  } {
    const errores: string[] = [];

    if (!factura.detalles || factura.detalles.length === 0) {
      errores.push('La factura no tiene detalles');
      return { valida: false, errores };
    }

    const sumaSubtotal = factura.detalles.reduce((sum, d) => sum + Number(d.subtotal ||0), 0);
    const sumaIva = factura.detalles.reduce((sum, d) => sum + Number((d as any).montoIva || 0), 0);
    const sumaInc = factura.detalles.reduce((sum, d) => sum + Number(d.montoInc || 0), 0);
    const sumaTotal = factura.detalles.reduce((sum, d) => sum + Number(d.total || 0), 0);

    const tolerancia = 0.01;

    if (Math.abs(sumaSubtotal - Number(factura.subtotal)) > tolerancia) {
      errores.push(`Subtotal inconsistente`);
    }

    if (Math.abs(sumaIva - Number(factura.montoIva)) > tolerancia) {
      errores.push(`IVA inconsistente`);
    }

    if (Math.abs(sumaInc - Number(factura.montoInc)) > tolerancia) {
      errores.push(`INC inconsistente`);
    }

    if (Math.abs(sumaTotal - Number(factura.total)) > tolerancia) {
      errores.push(`Total inconsistente`);
    }

    return { valida: errores.length === 0, errores };
  }

  /**
   * Validar que una factura pueda ser emitida
   */
  validarFacturaParaEmision(factura: Factura): {
    valida: boolean;
    errores: string[];
  } {
    const errores: string[] = [];

    if (!factura.detalles || factura.detalles.length === 0) {
      errores.push('La factura debe tener al menos un detalle');
    }

    const totalesValidos = this.validarTotalesFactura(factura);
    if (!totalesValidos.valida) {
      errores.push(...totalesValidos.errores);
    }

    if (!factura.idCliente || !factura.nombreCliente) {
      errores.push('La factura debe tener un cliente asignado');
    }

    if (!factura.idHotel) {
      errores.push('La factura debe tener un hotel asignado');
    }

    if (Number(factura.total) <= 0) {
      errores.push('El total de la factura debe ser mayor a 0');
    }

    if (!factura.uuid) {
      errores.push('La factura debe tener un UUID');
    }

    return { valida: errores.length === 0, errores };
  }
}
