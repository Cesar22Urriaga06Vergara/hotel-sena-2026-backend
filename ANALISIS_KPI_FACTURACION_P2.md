# 📊 ANÁLISIS EXHAUSTIVO: KPIs y Reportes de Facturación - FASE 8 P2

**Fecha**: 5 de Abril 2026  
**Esfuerzo Estimado**: 13 horas  
**Prioridad**: MEDIA (Post-FASE 7)  
**Status**: ✅ ANÁLISIS COMPLETO  

---

## 📋 TABLA DE CONTENIDOS

1. [Status Actual](#1-status-actual)
2. [Endpoints Necesarios](#2-endpoints-necesarios)
3. [DTOs y Validaciones](#3-dtos-y-validaciones)
4. [Queries SQL Optimizadas](#4-queries-sql-optimizadas)
5. [Estructura de Respuesta KPI](#5-estructura-de-respuesta-kpi)
6. [Validaciones RBAC](#6-validaciones-rbac)
7. [Matriz de Endpoints](#7-matriz-de-endpoints)
8. [Dependencias y Librerías](#8-dependencias-y-librerías)

---

## 1. STATUS ACTUAL

### Servicios KPI Existentes

#### ✅ KpisService (src/common/services/kpis.service.ts)
```typescript
// Métodos existentes (PLACEHOLDERS - retornan mock data):
- getFlujoDiaRecepcionista(idHotel: number) → {pendientesCheckin, ...}
- getCajaDiaRecepcionista(idHotel: number) → {movimientosHoy, ingresoTotal, ...}
- getEstadoHotel(idHotel: number) → {ocupacionActual, ingresosMes, ...}
- getMetricasPlataforma() → {hotelesActivos, usuariosTotales, ...}
- getCrecimientoPlataforma(periodo) → {hotelesNuevos, usuariosNuevos, ...}
```

**Status**: 5 de 5 métodos son PLACEHOLDERS (TODO)
**Prioridad**: Implementar con datos reales de BD

#### ✅ KpisController (src/common/controllers/kpis.controller.ts)
```
5 endpoints existentes:
├─ GET /kpis/recepcionista/flujo-dia
├─ GET /kpis/recepcionista/caja
├─ GET /kpis/admin/hotel
├─ GET /kpis/superadmin/plataforma
└─ GET /kpis/superadmin/crecimiento
```

**Status**: All wired up, need implementation

### ❌ Faltantes para P2

| Recurso | Necesario | Existe | Status |
|---------|-----------|--------|--------|
| GET KPIs Admin | ✅ | ⏳ (parcial) | Completar |
| GET KPIs Recepcionista | ✅ | ⏳ (parcial) | Completar |
| GET KPIs Superadmin | ✅ | ⏳ (parcial) | Completar |
| GET Reportes Ingresos | ✅ | ❌ | Crear |
| GET Reportes Clientes | ✅ | ❌ | Crear |
| GET Reportes Morosidad | ✅ | ❌ | Crear |
| POST Exportar PDF | ✅ | ❌ | Crear |
| POST Exportar Excel | ✅ | ❌ | Crear |

---

## 2. ENDPOINTS NECESARIOS

### 2.1 KPIs Admin (Por Hotel)

**GET /kpis/facturacion/admin?idHotel=1&periodo=mes**

```
Parámetros:
- idHotel: number (requerido para admin, opcional para superadmin)
- periodo: 'dia'|'mes'|'trimestre'|'año' (default: mes)
- fechaInicio?: YYYY-MM-DD (override periodo)
- fechaFin?: YYYY-MM-DD

Retorna: KpiAdminFacturacionDto
RBAC: admin (su hotel) | superadmin (cualquier hotel)
```

**KPIs a incluir:**
- `totalFacturas`: {cantidad, valor}
- `facturasPagadas`: {cantidad, valor}
- `facturasPendientes`: {cantidad, valor}
- `tasaMorosidad`: porcentaje (facturas > 30 días sin pagar)
- `promedioFactura`: (total/cantidad)
- `ingresosPorCategoria`: {[categoria]: valor}
- `flujoXDia`: [{fecha, ingresos}] (últimos 30 días)
- `top10Clientes`: [{idCliente, nombre, total}]

---

### 2.2 KPIs Recepcionista (Por Hotel, Período Diario)

**GET /kpis/facturacion/recepcionista?idHotel=1&fecha=2026-04-05**

```
Parámetros:
- idHotel: number (requerido)
- fecha?: YYYY-MM-DD (default: hoy)

Retorna: KpiRecepcionistaFacturacionDto
RBAC: recepcionista (su hotel) | admin (su hotel) | superadmin
```

**KPIs a incluir:**
- `facturasCreadas`: cantidad (creadas hoy)
- `facturasEmitidas`: cantidad (emitidas hoy)
- `facturasPagadas`: cantidad (pagadas hoy)
- `ingresoHoy`: valor (suma de pagadas hoy)
- `pendientesHoy`: cantidad (creadas pero no pagadas)
- `huespedSinFacturar`: [{idReserva, nombreHuesped, tipo}] (check-out sin factura)
- `alertasVencidas`: [{idFactura, diasVencida, monto}]

---

### 2.3 KPIs Superadmin (Consolidado)

**GET /kpis/facturacion/superadmin?periodo=mes**

```
Parámetros:
- periodo: 'dia'|'mes'|'trimestre'|'año'
- fechaInicio?: YYYY-MM-DD
- fechaFin?: YYYY-MM-DD

Retorna: KpiSuperadminFacturacionDto
RBAC: superadmin solo
```

**KPIs a incluir:**
- `totalFacturas`: {cantidad, valor} (todos hoteles)
- `facturasPorEstado`: {[estado]: {cantidad, valor}}
- `topHoteles`: [{idHotel, nombre, ingresos, facturas}]
- `comparativaPeríodos`: [{período, ingresos, facturas, morosidad}]
- `análisisMorosidad`: {cantidad, porcentaje, valor_atrasado}
- `crecimiento`: {MoM%, QoQ%}

---

### 2.4 Reportes de Ingresos

**GET /facturas/reportes/ingresos?idHotel=1&agruparPor=categoria&periodo=mes**

```
Parámetros:
- idHotel: number (requerido para admin)
- agruparPor: 'categoria'|'dia'|'semana'|'mes'
- periodo: 'mes'|'trimestre'|'año'
- fechaInicio?: YYYY-MM-DD
- fechaFin?: YYYY-MM-DD

Retorna: ReporteIngresosDto[] (array de puntos)
RBAC: admin (su hotel) | superadmin
```

**Estructura por agrupación:**
```typescript
// Por categoría
{
  categoria: "ALOJAMIENTO",
  cantidad: 45,
  subtotal: 4500000,
  iva: 855000,
  inc: 0,
  total: 5355000,
  porcentajeTotal: 35.2
}

// Por día
{
  fecha: "2026-04-05",
  cantidad: 12,
  total: 2400000
}
```

---

### 2.5 Reportes de Clientes Top

**GET /facturas/reportes/clientes?idHotel=1&limit=10&periodo=mes**

```
Parámetros:
- idHotel: number
- limit: number (default: 10, max: 50)
- periodo: 'mes'|'trimestre'|'año'|'todo'

Retorna: ReporteClientesDto[]
RBAC: admin (su hotel) | superadmin
```

**Estructura:**
```typescript
{
  idCliente: 15,
  nombreCliente: "Juan García",
  cedulaCliente: "1234567890",
  emailCliente: "juan@example.com",
  facturasTotales: 5,
  gastosTotal: 1500000,
  salidoActual: 250000,
  taxProfile: "RESIDENT",
  últimaCompra: "2026-04-03"
}
```

---

### 2.6 Reportes de Morosidad

**GET /facturas/reportes/morosidad?idHotel=1&diasAtrasados=30&periodo=mes**

```
Parámetros:
- idHotel: number
- diasAtrasados: number (default: 30)
- periodo: 'mes'|'trimestre'|'año'
- ordenarPor: 'dias'|'monto' (default: monto)

Retorna: ReporteMorosidadDto[]
RBAC: admin (su hotel) | superadmin
```

**Estructura:**
```typescript
{
  idFactura: 42,
  numeroFactura: "FAC-2026-00042",
  idCliente: 8,
  nombreCliente: "María Rodríguez",
  montoTotal: 850000,
  montoSaldo: 850000,
  fechaEmision: "2026-03-01",
  fechaVencimiento: "2026-04-01",
  diasAtrasada: 4,
  tasaInteresMora: 0.5,
  interesesAcumulados: 4250,
  estado: "EMITIDA"
}
```

---

### 2.7 Exportación PDF

**POST /facturas/:id/exportar**

```
Path parameters:
- id: facturaId

Query parameters:
- formato: 'pdf'|'xml' (default: pdf)

Returns: Buffer (application/pdf o application/xml)
Content-Disposition: attachment; filename="FAC-2026-00042.pdf"

RBAC: Cualquiera que pueda ver la factura (cliente, admin, superadmin)
```

**Contenido PDF:**
- Header: Logo hotel, nombre hotel, dirección
- Invoice section: Número, fecha, cliente
- Details table: Descripción, cantidad, precio, subtotal, impuestos
- Totals: Subtotal, IVA, INC, TOTAL
- Footer: Términos, gracias por su compra

---

### 2.8 Exportación Excel (Lote)

**POST /facturas/exportar/lote?idHotel=1&estado=pagada**

```
Body:
{
  "idFacturas"?: [1, 2, 3],  // o ninguno = todas las de los filtros
  "estado"?: "PAGADA",
  "periodo": "mes",
  "fechaInicio"?: "2026-04-01",
  "fechaFin"?: "2026-04-31"
}

Returns: Buffer (application/vnd.ms-excel)
Content-Disposition: attachment; filename="Facturas_Abril2026.xlsx"

RBAC: admin (su hotel) | superadmin
```

**Estructura Excel:**
- Sheet 1: Resumen (totales, qty, promedio)
- Sheet 2: Detalle de facturas (id, número, cliente, estado, total)
- Sheet 3: Desglose por categoría

---

## 3. DTOs Y VALIDACIONES

### 3.1 Request DTOs

#### GetKpisAdminDto
```typescript
import { IsNumber, IsEnum, IsOptional, IsDateString } from 'class-validator';

export class GetKpisAdminDto {
  @IsNumber()
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
```

#### ExportarFacturasLoteDto
```typescript
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

### 3.2 Response DTOs

#### KpiAdminFacturacionDto
```typescript
export class KpiAdminFacturacionDto {
  periodo: {
    inicio: Date;
    fin: Date;
    etiqueta: string; // "Abril 2026" o "Hoy"
  };

  kpis: {
    totalFacturas: {
      cantidad: number;
      valor: number;
    };
    facturasPagadas: {
      cantidad: number;
      valor: number;
    };
    facturasPendientes: {
      cantidad: number;
      valor: number;
    };
    tasaMorosidad: number; // porcentaje
    promedioFactura: number;
    ingresosPorCategoria: Record<string, number>;
    flujoXDia: Array<{
      fecha: string; // YYYY-MM-DD
      ingresos: number;
      cantidad: number;
    }>;
    top10Clientes: Array<{
      idCliente: number;
      nombreCliente: string;
      gastosTotal: number;
      facturasTotales: number;
    }>;
  };

  resumen: {
    periodo: string;
    generadoEn: Date;
    actualizado: boolean;
  };
}
```

#### ReporteIngresosDto
```typescript
export class ReporteIngresosDto {
  // Acuerdo al agruparPor:
  
  // Por categoría
  categoria?: string;
  cantidad?: number;
  subtotal?: number;
  iva?: number;
  inc?: number;
  total?: number;
  porcentajeTotal?: number;

  // Por día/período
  fecha?: string;
  periodo?: string;
  ingresos?: number;
  cantidadFacturas?: number;
}
```

---

## 4. QUERIES SQL OPTIMIZADAS

### 4.1 Total de Facturas y Montos (Sin N+1)

```sql
-- Patrón: No hacer loop en TypeORM, usar RAW QUERY de agregación
SELECT
  COUNT(*) as cantidad,
  SUM(total) as valor,
  COALESCE(ROUND(AVG(total), 2), 0) as promedio,
  estado_factura
FROM facturas
WHERE id_hotel = ? 
  AND fecha_emision BETWEEN ? AND ?
GROUP BY estado_factura;

-- Retorna:
-- { cantidad: 45, valor: 2250000, promedio: 50000, estado: 'PAGADA' }
-- { cantidad: 12, valor: 300000, promedio: 25000, estado: 'EMITIDA' }
-- { cantidad: 3, valor: 0, promedio: 0, estado: 'BORRADOR' }
```

### 4.2 Cálculo de Morosidad

```sql
-- Facturas vencidas (> 30 días sin pagar)
SELECT
  COUNT(*) as cantidad_vencidas,
  SUM(total) as valor_vencido,
  CAST(
    COUNT(*) * 100.0 / 
    (SELECT COUNT(*) FROM facturas WHERE id_hotel = ? AND estado_factura = 'EMITIDA')
    AS DECIMAL(5,2)
  ) as porcentaje_morosidad
FROM facturas
WHERE id_hotel = ?
  AND estado_factura = 'EMITIDA'
  AND DATE(fecha_vencimiento) < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Retorna:
-- { cantidad_vencidas: 5, valor_vencido: 125000, porcentaje_morosidad: 4.25 }
```

### 4.3 Ingresos por Categoría

```sql
-- Usar desglose_monetario JSON (ya desnormalizado en Factura)
-- Pero si necesitas desde detalles:
SELECT
  SUM(CASE WHEN df.tipo_concepto = 'habitacion' THEN df.total ELSE 0 END) as alojamiento,
  SUM(CASE WHEN df.categoria_nombre = 'Restaurante' THEN df.total ELSE 0 END) as restaurante,
  SUM(CASE WHEN df.categoria_nombre = 'Spa' THEN df.total ELSE 0 END) as spa,
  SUM(df.total) as total
FROM facturas f
JOIN detalle_facturas df ON f.id = df.id_factura
WHERE f.id_hotel = ?
  AND f.estado_factura = 'PAGADA'
  AND f.fecha_emision BETWEEN ? AND ?
GROUP BY f.id_hotel;
```

### 4.4 Flujo Diario (Últimos 30 días)

```sql
-- Ingresos por día para gráfico de línea
SELECT
  DATE(fecha_emision) as fecha,
  COUNT(*) as cantidad_facturas,
  SUM(total) as ingresos,
  ROUND(AVG(total), 2) as promedio_dia
FROM facturas
WHERE id_hotel = ?
  AND estado_factura = 'PAGADA'
  AND fecha_emision >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(fecha_emision)
ORDER BY fecha DESC;

-- Retorna:
-- { fecha: '2026-04-05', cantidad_facturas: 3, ingresos: 125000, promedio_dia: 41666.67 }
-- { fecha: '2026-04-04', cantidad_facturas: 5, ingresos: 250000, promedio_dia: 50000 }
```

### 4.5 Top 10 Clientes

```sql
SELECT
  f.id_cliente,
  f.nombre_cliente,
  f.cedula_cliente,
  f.email_cliente,
  COUNT(*) as facturas_totales,
  SUM(f.total) as gastos_total,
  COALESCE(SUM(CASE WHEN f.estado_factura != 'PAGADA' THEN f.total ELSE 0 END), 0) as salido_actual
FROM facturas f
WHERE f.id_hotel = ?
  AND f.fecha_emision BETWEEN ? AND ?
GROUP BY f.id_cliente, f.nombre_cliente
ORDER BY gastos_total DESC
LIMIT 10;
```

### 4.6 Facturas Atrasadas (Morosidad Detallada)

```sql
SELECT
  f.id,
  f.numero_factura,
  f.id_cliente,
  f.nombre_cliente,
  f.total,
  COALESCE(f.total - SUM(COALESCE(p.monto, 0)), f.total) as saldo_actual,
  DATEDIFF(CURDATE(), f.fecha_vencimiento) as dias_atrasada,
  ROUND(DATEDIFF(CURDATE(), f.fecha_vencimiento) * f.total * 0.005 / 30, 2) as intereses_acumulados
FROM facturas f
LEFT JOIN pagos p ON f.id = p.id_factura
WHERE f.id_hotel = ?
  AND f.estado_factura = 'EMITIDA'
  AND DATE(f.fecha_vencimiento) < CURDATE()
GROUP BY f.id
ORDER BY dias_atrasada DESC;
```

---

## 5. ESTRUCTURA DE RESPUESTA KPI

### Patrón Estándar (Consistencia con KpisService)

```typescript
// Respuesta base para todos los KPIs
interface BasKpiResponse {
  periodo: {
    inicio: Date | string;
    fin: Date | string;
    etiqueta: string; // "Hoy", "Abril 2026", "Trimestre Q2 2026"
  };

  kpis: Record<string, any>; // Objeto con KPIs específicos

  metadata: {
    generadoEn: Date; // ISO 8601
    versión: string; // "1.0"
    región: string; // "COLOMBIA"
    idHotel?: number;
    rol: string; // Rol de quien solicita (para auditoría)
  };

  links: {
    self: string; // Link a este mismo endpoint
    relatedData?: string[]; // Links a reportes relacionados
  };
}

// Ejemplo real:
{
  "periodo": {
    "inicio": "2026-04-01",
    "fin": "2026-04-30",
    "etiqueta": "Abril 2026"
  },
  "kpis": {
    "totalFacturas": {
      "cantidad": 45,
      "valor": 2250000
    },
    "facturasPagadas": {
      "cantidad": 38,
      "valor": 1900000
    },
    "facturasPendientes": {
      "cantidad": 7,
      "valor": 350000
    },
    "tasaMorosidad": 4.25,
    "promedioFactura": 50000,
    "ingresosPorCategoria": {
      "ALOJAMIENTO": 1500000,
      "RESTAURANTE": 400000,
      "SPA": 350000
    },
    "flujoXDia": [
      {"fecha": "2026-04-05", "ingresos": 125000, "cantidad": 3},
      {"fecha": "2026-04-04", "ingresos": 250000, "cantidad": 5}
    ],
    "top10Clientes": [
      {
        "idCliente": 15,
        "nombreCliente": "Juan García",
        "gastosTotal": 500000,
        "facturasTotales": 5
      }
    ]
  },
  "metadata": {
    "generadoEn": "2026-04-05T14:30:45.123Z",
    "versión": "1.0",
    "región": "COLOMBIA",
    "rol": "admin"
  }
}
```

---

## 6. VALIDACIONES RBAC

### Matriz de Permisos

| Endpoint | Rol | Acceso | Alcance |
|----------|-----|--------|---------|
| GET /kpis/facturacion/admin | admin | ✅ | Su hotel solo |
| GET /kpis/facturacion/admin | superadmin | ✅ | Cualquier hotel |
| GET /kpis/facturacion/admin | recepcionista | ❌ | No permitido |
| GET /kpis/facturacion/recepcionista | recepcionista | ✅ | Su hotel solo |
| GET /kpis/facturacion/recepcionista | admin | ✅ | Su hotel solo |
| GET /kpis/facturacion/recepcionista | superadmin | ✅ | Cualquier hotel |
| GET /kpis/facturacion/superadmin | superadmin | ✅ | Consolidado (todos) |
| GET /facturas/reportes/* | admin | ✅ | Su hotel solo |
| GET /facturas/reportes/* | superadmin | ✅ | Cualquier hotel |
| POST /facturas/:id/exportar | cliente | ✅ | Sus facturas solo |
| POST /facturas/:id/exportar | admin | ✅ | Facturas de su hotel |
| POST /facturas/exportar/lote | admin | ✅ | Su hotel solo |
| POST /facturas/exportar/lote | superadmin | ✅ | Cualquier hotel |

### Implementación Guard Pattern

```typescript
// En cada endpoint:
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@Get('kpis/facturacion/admin')
async getKpisAdmin(
  @Query('idHotel', ParseIntPipe) idHotel: number,
  @Request() req: any
) {
  // Validación en controller:
  if (req.user.rol === 'admin' && req.user.idHotel !== idHotel) {
    throw new ForbiddenException('No tiene acceso a este hotel');
  }
  // Y en servicio, filtrar por hotelId
}
```

---

## 7. MATRIZ DE ENDPOINTS

| # | Endpoint | Método | Roles | Parámetros | Retorna | Prioridad |
|---|----------|--------|-------|-----------|---------|-----------|
| 1 | `/kpis/facturacion/admin` | GET | admin, superadmin | idHotel, periodo, fechas | KpiAdminDto | 🔴 P0 |
| 2 | `/kpis/facturacion/recepcionista` | GET | recepcionista, admin, superadmin | idHotel, fecha | KpiRecepcionistDto | 🔴 P0 |
| 3 | `/kpis/facturacion/superadmin` | GET | superadmin | periodo, fechas | KpiSuperadminDto | 🔴 P0 |
| 4 | `/facturas/reportes/ingresos` | GET | admin, superadmin | idHotel, agruparPor, periodo | ReporteIngresos[] | 🟠 P1 |
| 5 | `/facturas/reportes/clientes` | GET | admin, superadmin | idHotel, limit, periodo | ReporteClientes[] | 🟠 P1 |
| 6 | `/facturas/reportes/morosidad` | GET | admin, superadmin | idHotel, diasAtrasados, periodo | ReporteMorosidad[] | 🟠 P1 |
| 7 | `/facturas/:id/exportar` | POST | cliente, admin, superadmin | id, formato | Buffer (PDF/XML) | 🟡 P2 |
| 8 | `/facturas/exportar/lote` | POST | admin, superadmin | idFacturas, filtros | Buffer (Excel) | 🟡 P2 |

---

## 8. DEPENDENCIAS Y LIBRERÍAS

### Librerías Ya Presentes en package.json
```json
- typeorm: "^0.3.27" → RAW QUERIES
- class-validator: "^0.14.2" → DTOs
- class-transformer: "^0.5.1" → Response mapping
- @nestjs/swagger: "^11.2.6" → Documentación
```

### Librerías Requeridas

#### Para PDF
```bash
npm install pdfkit
npm install @types/pdfkit --save-dev
```

**Alternativas:**
- `puppeteer`: Más pesado, más control
- `html-pdf`: Deprecated
- **RECOMENDADO**: pdfkit (ligero, buena calidad)

#### Para Excel
```bash
npm install xlsx
npm install @types/xlsx --save-dev
```

**Alternativas:**
- `exceljs`: Más control, más pesado
- `fast-xlsx`: Más ligero
- **RECOMENDADO**: xlsx (estándar, rápido)

#### Para Generación de Documentos
```bash
npm install date-fns
```

**Ya incluye:**
- uuid: "^10.0.0" ✅
- reflect-metadata: "^0.2.2" ✅

---

## 9. ÍNDICES BD RECOMENDADOS

Para optimizar las queries de KPIs, crear índices:

```sql
-- Ya existentes (FASE 7):
- idx_factura_estado (estado_factura)
- idx_factura_fecha (fecha_emision)
- idx_factura_hotel (id_hotel)

-- Nuevos a crear (FASE 8 P2):
CREATE INDEX idx_factura_hotel_estado_fecha 
  ON facturas(id_hotel, estado_factura, fecha_emision);

CREATE INDEX idx_factura_cliente_hotel 
  ON facturas(id_cliente, id_hotel);

CREATE INDEX idx_detalle_factura_categoria 
  ON detalle_facturas(categoria_nombre);

-- Verificar cobertura:
ANALYZE TABLE facturas;
ANALYZE TABLE detalle_facturas;
```

---

## 10. ANOTACIONES POR TIPO DE KPI

### KPI: Total Facturas
- **Query**: COUNT(*) con GROUP BY estado
- **Caché**: 1 hora (no cambia frecuente)
- **Complejidad**: O(n) con índice

### KPI: Flujo Diario
- **Query**: GROUP BY DATE(fecha)
- **Caché**: 1 hora
- **Complejidad**: O(n)
- **Nota**: Útil para gráficos, no cachear si es real-time

### KPI: Morosidad
- **Query**: DATEDIFF + SUM condicional
- **Caché**: 24 horas (cambia por día)
- **Complejidad**: O(n)
- **Critical**: Para decisiones crediticias

### KPI: Top Clientes
- **Query**: ORDER BY gastos DESC LIMIT 10
- **Caché**: 24 horas
- **Complejidad**: O(n log n)

---

## 11. CONSIDERAR PARA PRODUCCIÓN

### Caching Strategy
```typescript
// Usar cache simple en servicio:
private kpiCache = new Map<string, { data: any; timestamp: number }>();

private getCacheKey(rol: string, idHotel?: number, periodo?: string): string {
  return `${rol}:${idHotel}:${periodo}:${new Date().toISOString().split('T')[0]}`;
}

private isCacheValid(key: string, ttlMinutes: number = 60): boolean {
  const cached = this.kpiCache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < ttlMinutes * 60 * 1000;
}
```

### Performance Targets
- KPI Admin: < 500ms (desde BD)
- KPI Recepcionista: < 200ms
- KPI Superadmin: < 1000ms
- Reportes: < 2000ms
- PDF export: < 3000ms
- Excel export: < 5000ms

### Monitoreo
```typescript
// En cada endpoint, loguear tiempo:
const inicio = performance.now();
const result = await this.kpisService.getKpisAdmin(idHotel, periodo);
const tiempo = performance.now() - inicio;
this.logger.log(`KPI Admin generado en ${tiempo.toFixed(2)}ms`);
```

---

## 12. MATRIZ DE DEPENDENCIAS (ENTRE KPIS)

```
KPI Admin
├─ Necesita: Facturas con estado_factura, total, fecha_emision, id_cliente
├─ Necesita: Detalles con categoria_nombre
├─ Depende: IntegridadService.validarFactura()
└─ Depende: ImpuestoService.getTaxRate()

KPI Recepcionista
├─ Necesita: Facturas creadas hoy
├─ Necesita: Pagos registrados hoy
├─ Depende: ReservaService.findCheckOutHoy()
└─ Depende: PagoService.findMovimientosHoy()

KPI Superadmin
├─ Necesita: Todas las facturas (sin filtro hotel)
├─ Depende: HotelService.findAll()
└─ Produce: Comparativas entre hoteles

Reportes Ingresos
├─ Necesita: DetalleFactura con categoría
└─ Nota: Usar desglose_monetario si está lleno

Reportes Morosidad
├─ Necesita: Facturas con fecha_vencimiento
└─ Depende: CálculoInteresesMora()

PDF Export
├─ Necesita: Factura completa + detalles
├─ Depende: ImpuestoService
└─ Genera: Buffer

Excel Export
├─ Necesita: Array de facturas
├─ Depende: Reportes Ingresos/Clientes
└─ Genera: FileBuffer
```

---

## 13. ROADMAP P2 (Tiempo de Implementación)

| Componente | Duración | Prioridad | Bloqueante |
|------------|----------|-----------|-----------|
| DTOs + Validaciones | 1h | 🔴 | Sí |
| GetKpisAdmin (implementación) | 2h | 🔴 | Sí |
| GetKpisRecepcionista (implementación) | 2h | 🔴 | Sí |
| GetKpisSuperadmin (implementación) | 2h | 🔴 | Sí |
| Reportes Ingresos/Clientes | 2h | 🟠 | No |
| Reportes Morosidad | 2h | 🟠 | No |
| PDF Export | 2h | 🟡 | No |
| Excel Export | 1h | 🟡 | No |
| Tests E2E | 1h | 🟡 | No |
| Ajustes + Deploy | 1h | Verde | No |

**TOTAL: 13 horas** (2-3 días)

---

## 14. CHECKLIST ANÁLISIS COMPLETO

- ✅ Endpoints mapeados (8 totales)
- ✅ DTOs diseñados (con validaciones)
- ✅ Queries SQL optimizadas (sin N+1)
- ✅ Acceso RBAC definido
- ✅ Librerías identificadas
- ✅ Estructura de respuesta estandarizada
- ✅ Índices BD recomendados
- ✅ Roadmap detallado

---

**Siguiente paso:** [PLAN_IMPLEMENTACION_P2.md](PLAN_IMPLEMENTACION_P2.md)
