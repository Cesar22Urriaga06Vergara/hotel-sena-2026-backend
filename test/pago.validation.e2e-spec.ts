import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('CreatePagoDto Validation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Property Validation', () => {
    it('should reject property "monto" - property monto should not exist', async () => {
      const invalidPayload = {
        idFactura: 1,
        idHabitacion: 1,
        idMedioPago: 1,
        monto: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(invalidPayload)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('monto');
    });

    it('should reject property "concepto" - property concepto should not exist', async () => {
      const invalidPayload = {
        idFactura: 1,
        idHabitacion: 1,
        idMedioPago: 1,
        montoCobrar: 100,
        concepto: 'pago de factura',
      };

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(invalidPayload)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('concepto');
    });
  });

  describe('ID Factura Validation', () => {
    it('should reject when ID is not a number - ID debe ser número', async () => {
      const invalidPayload = {
        idFactura: 'abc',
        idHabitacion: 1,
        idMedioPago: 1,
        montoCobrar: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(invalidPayload)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('ID debe ser número');
    });

    it('should reject when ID is not positive - ID debe ser positivo', async () => {
      const invalidPayload = {
        idFactura: -1,
        idHabitacion: 1,
        idMedioPago: 1,
        montoCobrar: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(invalidPayload)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('ID debe ser positivo');
    });

    it('should reject when ID is missing - ID es requerido', async () => {
      const invalidPayload = {
        idHabitacion: 1,
        idMedioPago: 1,
        montoCobrar: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(invalidPayload)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('ID es requerido');
    });
  });

  describe('ID Habitación Validation', () => {
    it('should reject when ID de habitación is missing - ID de habitación es requerido', async () => {
      const invalidPayload = {
        idFactura: 1,
        idMedioPago: 1,
        montoCobrar: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(invalidPayload)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'ID de habitación es requerido',
      );
    });
  });

  describe('ID Medio Pago Validation', () => {
    it('should reject when ID de medio pago is not a number - ID de medio pago debe ser número', async () => {
      const invalidPayload = {
        idFactura: 1,
        idHabitacion: 1,
        idMedioPago: 'tarjeta',
        montoCobrar: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(invalidPayload)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'ID de medio pago debe ser número',
      );
    });

    it('should reject when ID de medio pago is not positive - ID de medio pago debe ser positivo', async () => {
      const invalidPayload = {
        idFactura: 1,
        idHabitacion: 1,
        idMedioPago: -5,
        montoCobrar: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(invalidPayload)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'ID de medio pago debe ser positivo',
      );
    });

    it('should reject when ID de medio pago is missing - ID de medio pago es requerido', async () => {
      const invalidPayload = {
        idFactura: 1,
        idHabitacion: 1,
        montoCobrar: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(invalidPayload)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'ID de medio pago es requerido',
      );
    });
  });

  describe('Monto a Cobrar Validation', () => {
    it('should reject when Monto a cobrar is not a number - Monto a cobrar debe ser número', async () => {
      const invalidPayload = {
        idFactura: 1,
        idHabitacion: 1,
        idMedioPago: 1,
        montoCobrar: 'cien',
      };

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(invalidPayload)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Monto a cobrar debe ser número');
    });

    it('should reject when Monto a cobrar is negative - Monto a cobrar debe ser positivo', async () => {
      const invalidPayload = {
        idFactura: 1,
        idHabitacion: 1,
        idMedioPago: 1,
        montoCobrar: -50,
      };

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(invalidPayload)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Monto a cobrar debe ser positivo');
    });

    it('should reject when Monto a cobrar is zero - Monto a cobrar debe ser positivo', async () => {
      const invalidPayload = {
        idFactura: 1,
        idHabitacion: 1,
        idMedioPago: 1,
        montoCobrar: 0,
      };

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(invalidPayload)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Monto a cobrar debe ser positivo');
    });

    it('should reject when Monto a cobrar is missing - Monto a cobrar es requerido', async () => {
      const invalidPayload = {
        idFactura: 1,
        idHabitacion: 1,
        idMedioPago: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(invalidPayload)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Monto a cobrar es requerido');
    });
  });

  describe('Valid Payload', () => {
    it('should accept valid payload with all required fields', async () => {
      const validPayload = {
        idFactura: 1,
        idHabitacion: 1,
        idMedioPago: 1,
        montoCobrar: 100.5,
      };

      // This should pass validation (though may fail on business logic for missing records)
      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(validPayload)
        .set('Authorization', 'Bearer invalid-token');

      // Should not be a validation error (might be auth or not found)
      expect(response.status).not.toBe(400);
    });

    it('should accept valid payload with optional fields', async () => {
      const validPayload = {
        idFactura: 1,
        idHabitacion: 1,
        idMedioPago: 1,
        montoCobrar: 100.5,
        montoRecibido: 100.5,
        referenciaPago: 'REF-123',
        observaciones: 'Pago completo',
      };

      // This should pass validation
      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send(validPayload)
        .set('Authorization', 'Bearer invalid-token');

      // Should not be a validation error
      expect(response.status).not.toBe(400);
    });
  });
});
