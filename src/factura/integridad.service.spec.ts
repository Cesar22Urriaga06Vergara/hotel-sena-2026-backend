import { Test, TestingModule } from '@nestjs/testing';
import { IntegridadService } from './integridad.service';
import { Factura } from './entities/factura.entity';
import { DetalleFactura } from './entities/detalle-factura.entity';

describe('IntegridadService - Validaciones', () => {
  let service: IntegridadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntegridadService],
    }).compile();

    service = module.get<IntegridadService>(IntegridadService);
  });

  describe('validarTotalesFactura()', () => {
    it('debe validar correctamente cuando totales coinciden exactamente', () => {
      const detalles: Partial<DetalleFactura>[] = [
        { subtotal: 50000, montoIva: 9500, montoInc: 0, total: 59500 },
        { subtotal: 50000, montoIva: 9500, montoInc: 0, total: 59500 },
      ];

      const factura: Partial<Factura> = {
        subtotal: 100000,
        montoIva: 19000,
        montoInc: 0,
        total: 119000,
        detalles: detalles as DetalleFactura[],
      };

      const resultado = service.validarTotalesFactura(factura as Factura);

      expect(resultado.valida).toBe(true);
      expect(resultado.errores).toHaveLength(0);
    });

    it('debe validar correctamente con tolerancia de ±0.01', () => {
      const detalles: Partial<DetalleFactura>[] = [
        { subtotal: 50000.005, montoIva: 9500.001, montoInc: 0, total: 59500.006 },
        { subtotal: 49999.995, montoIva: 9499.999, montoInc: 0, total: 59499.994 },
      ];

      const factura: Partial<Factura> = {
        subtotal: 100000,
        montoIva: 19000,
        montoInc: 0,
        total: 119000,
        detalles: detalles as DetalleFactura[],
      };

      const resultado = service.validarTotalesFactura(factura as Factura);

      expect(resultado.valida).toBe(true);
      expect(resultado.errores).toHaveLength(0);
    });

    it('debe detectar descuadre en subtotal', () => {
      const detalles: Partial<DetalleFactura>[] = [
        { subtotal: 50000, montoIva: 9500, montoInc: 0, total: 59500 },
        { subtotal: 60000, montoIva: 11400, montoInc: 0, total: 71400 },
      ];

      const factura: Partial<Factura> = {
        subtotal: 100000,
        montoIva: 19000,
        montoInc: 0,
        total: 119000,
        detalles: detalles as DetalleFactura[],
      };

      const resultado = service.validarTotalesFactura(factura as Factura);

      expect(resultado.valida).toBe(false);
      expect(resultado.errores).toContain('Subtotal inconsistente');
    });

    it('debe detectar descuadre en IVA', () => {
      const detalles: Partial<DetalleFactura>[] = [
        { subtotal: 50000, montoIva: 9500, montoInc: 0, total: 59500 },
        { subtotal: 50000, montoIva: 9500, montoInc: 0, total: 59500 },
      ];

      const factura: Partial<Factura> = {
        subtotal: 100000,
        montoIva: 20000,
        montoInc: 0,
        total: 120000,
        detalles: detalles as DetalleFactura[],
      };

      const resultado = service.validarTotalesFactura(factura as Factura);

      expect(resultado.valida).toBe(false);
      expect(resultado.errores).toContain('IVA inconsistente');
    });

    it('debe detectar descuadre en INC', () => {
      const detalles: Partial<DetalleFactura>[] = [
        { subtotal: 50000, montoIva: 9500, montoInc: 4000, total: 63500 },
        { subtotal: 50000, montoIva: 9500, montoInc: 4000, total: 63500 },
      ];

      const factura: Partial<Factura> = {
        subtotal: 100000,
        montoIva: 19000,
        montoInc: 10000,
        total: 129000,
        detalles: detalles as DetalleFactura[],
      };

      const resultado = service.validarTotalesFactura(factura as Factura);

      expect(resultado.valida).toBe(false);
      expect(resultado.errores).toContain('INC inconsistente');
    });

    it('debe detectar descuadre en total', () => {
      const detalles: Partial<DetalleFactura>[] = [
        { subtotal: 50000, montoIva: 9500, montoInc: 0, total: 59500 },
        { subtotal: 50000, montoIva: 9500, montoInc: 0, total: 59500 },
      ];

      const factura: Partial<Factura> = {
        subtotal: 100000,
        montoIva: 19000,
        montoInc: 0,
        total: 120000,
        detalles: detalles as DetalleFactura[],
      };

      const resultado = service.validarTotalesFactura(factura as Factura);

      expect(resultado.valida).toBe(false);
      expect(resultado.errores).toContain('Total inconsistente');
    });

    it('debe manejar factura sin detalles', () => {
      const factura: Partial<Factura> = {
        subtotal: 100000,
        montoIva: 19000,
        montoInc: 0,
        total: 119000,
        detalles: [],
      };

      const resultado = service.validarTotalesFactura(factura as Factura);

      expect(resultado.valida).toBe(false);
    });

    it('debe detectar múltiples errores simultáneamente', () => {
      const detalles: Partial<DetalleFactura>[] = [
        { subtotal: 50000, montoIva: 9500, montoInc: 0, total: 59500 },
        { subtotal: 60000, montoIva: 11400, montoInc: 0, total: 71400 },
      ];

      const factura: Partial<Factura> = {
        subtotal: 100000,
        montoIva: 30000,
        montoInc: 5000,
        total: 135000,
        detalles: detalles as DetalleFactura[],
      };

      const resultado = service.validarTotalesFactura(factura as Factura);

      expect(resultado.valida).toBe(false);
      expect(resultado.errores.length).toBeGreaterThan(1);
    });
  });

  describe('validarFacturaParaEmision()', () => {
    it('debe validar correctamente factura completa y correcta', () => {
      const factura: Partial<Factura> = {
        uuid: 'valid-uuid-123',
        numeroFactura: 'F-001',
        idCliente: 1,
        nombreCliente: 'Juan Pérez',
        idHotel: 1,
        subtotal: 100000,
        montoIva: 19000,
        montoInc: 0,
        total: 119000,
        detalles: [
          {
            id: 1,
            descripcion: 'Habitación Doble',
            subtotal: 100000,
            montoIva: 19000,
            montoInc: 0,
            total: 119000,
          } as DetalleFactura,
        ],
      };

      const resultado = service.validarFacturaParaEmision(factura as Factura);

      expect(resultado.valida).toBe(true);
      expect(resultado.errores).toHaveLength(0);
    });

    it('debe detectar falta de UUID', () => {
      const factura: Partial<Factura> = {
        uuid: undefined,
        numeroFactura: 'F-001',
        idCliente: 1,
        nombreCliente: 'Juan Pérez',
        idHotel: 1,
        subtotal: 100000,
        montoIva: 19000,
        montoInc: 0,
        total: 119000,
        detalles: [
          { id: 1, subtotal: 100000, montoIva: 19000, montoInc: 0, total: 119000 } as DetalleFactura,
        ],
      };

      const resultado = service.validarFacturaParaEmision(factura as Factura);

      expect(resultado.valida).toBe(false);
      expect(resultado.errores).toContain('La factura debe tener un UUID');
    });

    it('debe detectar falta de cliente', () => {
      const factura: Partial<Factura> = {
        uuid: 'valid-uuid',
        numeroFactura: 'F-001',
        idCliente: undefined,
        nombreCliente: undefined,
        idHotel: 1,
        subtotal: 100000,
        montoIva: 19000,
        montoInc: 0,
        total: 119000,
        detalles: [
          { id: 1, subtotal: 100000, montoIva: 19000, montoInc: 0, total: 119000 } as DetalleFactura,
        ],
      };

      const resultado = service.validarFacturaParaEmision(factura as Factura);

      expect(resultado.valida).toBe(false);
      expect(resultado.errores).toContain('La factura debe tener un cliente asignado');
    });

    it('debe detectar falta de hotel', () => {
      const factura: Partial<Factura> = {
        uuid: 'valid-uuid',
        numeroFactura: 'F-001',
        idCliente: 1,
        nombreCliente: 'Juan Pérez',
        idHotel: undefined,
        subtotal: 100000,
        montoIva: 19000,
        montoInc: 0,
        total: 119000,
        detalles: [
          { id: 1, subtotal: 100000, montoIva: 19000, montoInc: 0, total: 119000 } as DetalleFactura,
        ],
      };

      const resultado = service.validarFacturaParaEmision(factura as Factura);

      expect(resultado.valida).toBe(false);
      expect(resultado.errores).toContain('La factura debe tener un hotel asignado');
    });

    it('debe detectar total cero o negativo', () => {
      const facturaZero: Partial<Factura> = {
        uuid: 'valid-uuid',
        numeroFactura: 'F-001',
        idCliente: 1,
        nombreCliente: 'Juan Pérez',
        idHotel: 1,
        subtotal: 0,
        montoIva: 0,
        montoInc: 0,
        total: 0,
        detalles: [
          { id: 1, subtotal: 0, montoIva: 0, montoInc: 0, total: 0 } as DetalleFactura,
        ],
      };

      const resultadoZero = service.validarFacturaParaEmision(facturaZero as Factura);
      expect(resultadoZero.valida).toBe(false);
      expect(resultadoZero.errores).toContain('El total de la factura debe ser mayor a 0');

      const facturaNegativa: Partial<Factura> = {
        uuid: 'valid-uuid',
        numeroFactura: 'F-001',
        idCliente: 1,
        nombreCliente: 'Juan Pérez',
        idHotel: 1,
        subtotal: -5000,
        montoIva: -950,
        montoInc: 0,
        total: -5950,
        detalles: [
          { id: 1, subtotal: -5000, montoIva: -950, montoInc: 0, total: -5950 } as DetalleFactura,
        ],
      };

      const resultadoNegativo = service.validarFacturaParaEmision(facturaNegativa as Factura);
      expect(resultadoNegativo.valida).toBe(false);
      expect(resultadoNegativo.errores).toContain('El total de la factura debe ser mayor a 0');
    });

    it('debe detectar falta de detalles', () => {
      const facturaVacia: Partial<Factura> = {
        uuid: 'valid-uuid',
        numeroFactura: 'F-001',
        idCliente: 1,
        nombreCliente: 'Juan Pérez',
        idHotel: 1,
        subtotal: 0,
        montoIva: 0,
        montoInc: 0,
        total: 0,
        detalles: [],
      };

      const resultadoVacia = service.validarFacturaParaEmision(facturaVacia as Factura);
      expect(resultadoVacia.valida).toBe(false);
      expect(resultadoVacia.errores).toContain('La factura debe tener al menos un detalle');

      const facturaSinDetalles: Partial<Factura> = {
        uuid: 'valid-uuid',
        numeroFactura: 'F-001',
        idCliente: 1,
        nombreCliente: 'Juan Pérez',
        idHotel: 1,
        subtotal: 0,
        montoIva: 0,
        montoInc: 0,
        total: 0,
        detalles: undefined,
      };

      const resultadoSinDetalles = service.validarFacturaParaEmision(facturaSinDetalles as Factura);
      expect(resultadoSinDetalles.valida).toBe(false);
      expect(resultadoSinDetalles.errores).toContain('La factura debe tener al menos un detalle');
    });

    it('debe acumular múltiples errores', () => {
      const factura: Partial<Factura> = {
        uuid: undefined,
        numeroFactura: undefined,
        idCliente: undefined,
        nombreCliente: undefined,
        idHotel: undefined,
        total: 0,
        detalles: [],
      };

      const resultado = service.validarFacturaParaEmision(factura as Factura);

      expect(resultado.valida).toBe(false);
      expect(resultado.errores.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar valores null en detalles', () => {
      const detalles: Partial<DetalleFactura>[] = [
        { subtotal: undefined, montoIva: undefined, montoInc: undefined, total: undefined },
      ];

      const factura: Partial<Factura> = {
        subtotal: 0,
        montoIva: 0,
        montoInc: 0,
        total: 0,
        detalles: detalles as DetalleFactura[],
      };

      const resultado = service.validarTotalesFactura(factura as Factura);

      expect(resultado).toBeDefined();
      expect(typeof resultado.valida).toBe('boolean');
    });

    it('debe manejar números muy grandes', () => {
      const detalles: Partial<DetalleFactura>[] = [
        { subtotal: 999999999, montoIva: 189999999.81, montoInc: 0, total: 1189999998.81 },
      ];

      const factura: Partial<Factura> = {
        subtotal: 999999999,
        montoIva: 189999999.81,
        montoInc: 0,
        total: 1189999998.81,
        detalles: detalles as DetalleFactura[],
      };

      const resultado = service.validarTotalesFactura(factura as Factura);

      expect(resultado.valida).toBe(true);
    });

    it('debe manejar números con muchos decimales', () => {
      const detalles: Partial<DetalleFactura>[] = [
        { subtotal: 33.333333, montoIva: 6.333333, montoInc: 0, total: 39.666666 },
        { subtotal: 66.666667, montoIva: 12.666667, montoInc: 0, total: 79.333334 },
      ];

      const factura: Partial<Factura> = {
        subtotal: 100,
        montoIva: 19,
        montoInc: 0,
        total: 119,
        detalles: detalles as DetalleFactura[],
      };

      const resultado = service.validarTotalesFactura(factura as Factura);

      expect(resultado).toBeDefined();
    });
  });
});
