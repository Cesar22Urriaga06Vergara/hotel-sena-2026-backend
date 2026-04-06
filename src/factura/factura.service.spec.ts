import { Test, TestingModule } from '@nestjs/testing';
import { FacturaService } from './factura.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Factura } from './entities/factura.entity';
import { DetalleFactura } from './entities/detalle-factura.entity';
import { Pedido } from '../servicio/entities/pedido.entity';
import { PedidoItem } from '../servicio/entities/pedido-item.entity';
import { Servicio } from '../servicio/entities/servicio.entity';
import { CategoriaServicio } from '../categoria-servicios/entities/categoria-servicio.entity';
import { ReservaService } from '../reserva/reserva.service';
import { ImpuestoService } from '../impuesto/impuesto.service';
import { ClienteService } from '../cliente/cliente.service';
import { HotelService } from '../hotel/hotel.service';
import { IntegridadService } from './integridad.service';
import { ESTADOS_FACTURA, TRANSICIONES_FACTURA, EstadoFactura } from '../common/constants/estados.constants';

describe('FacturaService - State Machine & Validations', () => {
  let service: FacturaService;
  let facturaRepository: Repository<Factura>;
  let integridadService: IntegridadService;

  // Mock factories
  const createMockFactura = (estado: EstadoFactura, overrides = {}): Partial<Factura> => ({
    id: 1,
    uuid: 'test-uuid',
    numeroFactura: 'F-001',
    estadoFactura: estado,
    estado: estado.toLowerCase(),
    idCliente: 1,
    idHotel: 1,
    subtotal: 100000,
    montoIva: 19000,
    porcentajeIva: 19,
    montoInc: 0,
    porcentajeInc: 0,
    total: 119000,
    detalles: [],
    pagos: [],
    ...overrides,
  });

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    const mockDataSource = {
      getRepository: jest.fn(() => ({
        save: jest.fn(),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacturaService,
        {
          provide: getRepositoryToken(Factura),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(DetalleFactura),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Pedido),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PedidoItem),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Servicio),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(CategoriaServicio),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ReservaService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: ImpuestoService,
          useValue: { calculateFacturaDesglose: jest.fn() },
        },
        {
          provide: ClienteService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: HotelService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: IntegridadService,
          useValue: {
            validarFacturaParaEmision: jest.fn(),
            validarTotalesFactura: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
            emitAsync: jest.fn(),
            on: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FacturaService>(FacturaService);
    facturaRepository = module.get<Repository<Factura>>(getRepositoryToken(Factura));
    integridadService = module.get<IntegridadService>(IntegridadService);
  });

  describe('emitir()', () => {
    it('debe emitir factura desde estado BORRADOR', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.BORRADOR, {
        detalles: [{ id: 1, descripcion: 'Test' }],
      });

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);
      jest.spyOn(integridadService, 'validarFacturaParaEmision').mockReturnValue({
        valida: true,
        errores: [],
      });
      jest.spyOn(facturaRepository, 'save').mockResolvedValue({
        ...factura,
        estadoFactura: ESTADOS_FACTURA.EMITIDA,
      } as Factura);

      const result = await service.emitir(1);

      expect(result.estadoFactura).toBe(ESTADOS_FACTURA.EMITIDA);
      expect(integridadService.validarFacturaParaEmision).toHaveBeenCalled();
    });

    it('debe emitir factura desde estado EDITABLE', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.EDITABLE, {
        detalles: [{ id: 1, descripcion: 'Test' }],
      });

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);
      jest.spyOn(integridadService, 'validarFacturaParaEmision').mockReturnValue({
        valida: true,
        errores: [],
      });
      jest.spyOn(facturaRepository, 'save').mockResolvedValue({
        ...factura,
        estadoFactura: ESTADOS_FACTURA.EMITIDA,
      } as Factura);

      const result = await service.emitir(1);

      expect(result.estadoFactura).toBe(ESTADOS_FACTURA.EMITIDA);
    });

    it('NO debe emitir factura desde estado EMITIDA', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.EMITIDA);

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);

      await expect(service.emitir(1)).rejects.toThrow(BadRequestException);
      await expect(service.emitir(1)).rejects.toThrow(/No se puede emitir una factura en estado EMITIDA/);
    });

    it('NO debe emitir factura desde estado PAGADA', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.PAGADA);

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);

      await expect(service.emitir(1)).rejects.toThrow(BadRequestException);
    });

    it('NO debe emitir factura con errores de integridad', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.BORRADOR, {
        detalles: [], // Sin detalles = error de integridad
      });

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);
      jest.spyOn(integridadService, 'validarFacturaParaEmision').mockReturnValue({
        valida: false,
        errores: ['La factura no tiene detalles'],
      });

      await expect(service.emitir(1)).rejects.toThrow(BadRequestException);
      await expect(service.emitir(1)).rejects.toThrow(/errores de integridad/);
    });
  });

  describe('anular()', () => {
    it('debe anular factura desde estado BORRADOR', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.BORRADOR, { pagos: [] });

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);
      jest.spyOn(facturaRepository, 'save').mockImplementation(async (facturaToSave: any) => {
        return {
          ...facturaToSave,
          estadoFactura: ESTADOS_FACTURA.ANULADA,
        } as Factura;
      });

      const result = await service.anular(1, 'Motivo de prueba');

      expect(result.estadoFactura).toBe(ESTADOS_FACTURA.ANULADA);
      expect(result.observaciones).toContain('ANULADA');
      expect(result.observaciones).toContain('Motivo de prueba');
    });

    it('debe anular factura desde estado EMITIDA sin pagos', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.EMITIDA, { pagos: [] });

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);
      jest.spyOn(facturaRepository, 'save').mockResolvedValue({
        ...factura,
        estadoFactura: ESTADOS_FACTURA.ANULADA,
      } as Factura);

      const result = await service.anular(1, 'Error en cálculo');

      expect(result.estadoFactura).toBe(ESTADOS_FACTURA.ANULADA);
    });

    it('NO debe anular factura desde estado PAGADA', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.PAGADA);

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);

      await expect(service.anular(1, 'Motivo')).rejects.toThrow(BadRequestException);
      await expect(service.anular(1, 'Motivo')).rejects.toThrow(/estado final/);
    });

    it('NO debe anular factura desde estado ANULADA', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.ANULADA);

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);

      await expect(service.anular(1, 'Motivo')).rejects.toThrow(BadRequestException);
    });

    it('NO debe anular factura con pagos completados', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.EMITIDA, {
        pagos: [{ id: 1, estado: 'completado', monto: 119000 }],
      });

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);

      await expect(service.anular(1, 'Motivo')).rejects.toThrow(BadRequestException);
      await expect(service.anular(1, 'Motivo')).rejects.toThrow(/pagos registrados/);
    });

    it('NO debe anular factura sin motivo', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.BORRADOR, { pagos: [] });

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);

      await expect(service.anular(1, '')).rejects.toThrow(BadRequestException);
      await expect(service.anular(1, '   ')).rejects.toThrow(BadRequestException);
      await expect(service.anular(1, '   ')).rejects.toThrow(/motivo/);
    });
  });

  describe('marcarComoPagada()', () => {
    it('debe marcar como pagada factura desde estado EMITIDA', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.EMITIDA, {
        pagos: [{ id: 1, estado: 'completado', monto: 119000 }],
      });

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);
      jest.spyOn(facturaRepository, 'save').mockResolvedValue({
        ...factura,
        estadoFactura: ESTADOS_FACTURA.PAGADA,
      } as Factura);

      const result = await service.marcarComoPagada(1);

      expect(result.estadoFactura).toBe(ESTADOS_FACTURA.PAGADA);
    });

    it('NO debe marcar como pagada desde estado BORRADOR', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.BORRADOR);

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);

      await expect(service.marcarComoPagada(1)).rejects.toThrow(BadRequestException);
      await expect(service.marcarComoPagada(1)).rejects.toThrow(/Solo se pueden pagar facturas en estado EMITIDA/);
    });

    it('NO debe marcar como pagada sin pagos registrados', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.EMITIDA, {
        pagos: [],
      });

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);

      await expect(service.marcarComoPagada(1)).rejects.toThrow(BadRequestException);
      await expect(service.marcarComoPagada(1)).rejects.toThrow(/al menos un pago/);
    });
  });

  describe('update() - State Machine', () => {
    it('debe permitir transición BORRADOR → EDITABLE', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.BORRADOR);

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);
      jest.spyOn(facturaRepository, 'save').mockResolvedValue({
        ...factura,
        estadoFactura: ESTADOS_FACTURA.EDITABLE,
      } as Factura);

      const result = await service.update(1, { estadoFactura: ESTADOS_FACTURA.EDITABLE });

      expect(result.estadoFactura).toBe(ESTADOS_FACTURA.EDITABLE);
    });

    it('debe permitir transición EDITABLE → EMITIDA', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.EDITABLE);

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);
      jest.spyOn(facturaRepository, 'save').mockResolvedValue({
        ...factura,
        estadoFactura: ESTADOS_FACTURA.EMITIDA,
      } as Factura);

      const result = await service.update(1, { estadoFactura: ESTADOS_FACTURA.EMITIDA });

      expect(result.estadoFactura).toBe(ESTADOS_FACTURA.EMITIDA);
    });

    it('NO debe permitir transición BORRADOR → PAGADA (salto de estados)', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.BORRADOR);

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);

      await expect(service.update(1, { estadoFactura: ESTADOS_FACTURA.PAGADA })).rejects.toThrow(BadRequestException);
      await expect(service.update(1, { estadoFactura: ESTADOS_FACTURA.PAGADA })).rejects.toThrow(/No se puede cambiar de estado/);
    });

    it('NO debe permitir transición PAGADA → BORRADOR (estado final)', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.PAGADA);

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);

      await expect(service.update(1, { estadoFactura: ESTADOS_FACTURA.BORRADOR })).rejects.toThrow(BadRequestException);
    });

    it('NO debe permitir editar montos en estado EMITIDA', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.EMITIDA);

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);

      await expect(service.update(1, { subtotal: 200000 })).rejects.toThrow(BadRequestException);
      await expect(service.update(1, { subtotal: 200000 })).rejects.toThrow(/No se pueden actualizar montos en estado EMITIDA/);
    });

    it('debe permitir editar montos en estado BORRADOR', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.BORRADOR);

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);
      jest.spyOn(facturaRepository, 'save').mockResolvedValue({
        ...factura,
        subtotal: 200000,
      } as Factura);

      const result = await service.update(1, { subtotal: 200000 });

      expect(result.subtotal).toBe(200000);
    });

    it('NO debe permitir editar factura en estado ANULADA', async () => {
      const factura = createMockFactura(ESTADOS_FACTURA.ANULADA);

      jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(factura as Factura);

      await expect(service.update(1, { observaciones: 'Nueva observación' })).rejects.toThrow(BadRequestException);
      await expect(service.update(1, { observaciones: 'Nueva observación' })).rejects.toThrow(/No se puede editar una factura en estado ANULADA/);
    });
  });

  describe('Validación de transiciones usando TRANSICIONES_FACTURA', () => {
    it('todas las transiciones válidas deben estar permitidas', () => {
      Object.entries(TRANSICIONES_FACTURA).forEach(([estadoOrigen, estadosDestino]) => {
        expect(estadosDestino).toBeDefined();
        expect(Array.isArray(estadosDestino)).toBe(true);
      });
    });

    it('estados finales no deben tener transiciones salientes', () => {
      expect(TRANSICIONES_FACTURA[ESTADOS_FACTURA.PAGADA]).toEqual([]);
      expect(TRANSICIONES_FACTURA[ESTADOS_FACTURA.ANULADA]).toEqual([]);
    });

    it('BORRADOR debe poder transicionar a EDITABLE, EMITIDA, ANULADA', () => {
      const transiciones = TRANSICIONES_FACTURA[ESTADOS_FACTURA.BORRADOR];
      expect(transiciones).toContain(ESTADOS_FACTURA.EDITABLE);
      expect(transiciones).toContain(ESTADOS_FACTURA.EMITIDA);
      expect(transiciones).toContain(ESTADOS_FACTURA.ANULADA);
      expect(transiciones).not.toContain(ESTADOS_FACTURA.PAGADA);
    });

    it('EMITIDA solo debe poder transicionar a PAGADA o ANULADA', () => {
      const transiciones = TRANSICIONES_FACTURA[ESTADOS_FACTURA.EMITIDA];
      expect(transiciones).toContain(ESTADOS_FACTURA.PAGADA);
      expect(transiciones).toContain(ESTADOS_FACTURA.ANULADA);
      expect(transiciones).toHaveLength(2);
    });
  });
});
