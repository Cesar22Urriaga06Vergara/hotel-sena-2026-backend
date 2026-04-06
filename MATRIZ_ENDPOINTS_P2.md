# 📡 MATRIZ ENDPOINTS: KPIs y Reportes Facturación - FASE 8 P2

**Fecha**: 5 de Abril 2026  
**Propósito**: Referencia rápida de todos 8 endpoints  
**Status**: ✅ LISTO PARA IMPLEMENTACIÓN

---

## ENDPOINTS QUICKREF

### GROUP 1: KPIs Admin/Recepcionista/Superadmin (3 endpoints)

| # | Endpoint | Método | Parámetros | Retorna | RBAC | Prioridad | Duración |
|---|----------|--------|-----------|---------|------|----------|----------|
| 1 | `/kpis/facturacion/admin` | GET | idHotel, periodo?, fechas? | KpiAdminDto | admin (su), super (todos) | 🔴 P0 | 2h |
| 2 | `/kpis/facturacion/recepcionista` | GET | idHotel, fecha? | KpiRecepDto | recep (su), admin (su), super | 🔴 P0 | 2h |
| 3 | `/kpis/facturacion/superadmin` | GET | periodo?, fechas? | KpiSuperadminDto | super | 🔴 P0 | 2h |

---

### GROUP 2: Reportes (3 endpoints)

| # | Endpoint | Método | Parámetros | Retorna | RBAC | Prioridad | Duración |
|---|----------|--------|-----------|---------|------|----------|----------|
| 4 | `/facturas/reportes/ingresos` | GET | idHotel, agruparPor, periodo?, fechas? | ReporteIngreso[] | admin (su), super | 🟠 P1 | 2h |
| 5 | `/facturas/reportes/clientes` | GET | idHotel, limit, periodo? | ReporteCliente[] | admin (su), super | 🟠 P1 | 2h |
| 6 | `/facturas/reportes/morosidad` | GET | idHotel, diasAtrasados, periodo? | ReporteMorosidad[] | admin (su), super | 🟠 P1 | 2h |

---

### GROUP 3: Exportación (2 endpoints)

| # | Endpoint | Método | Parámetros | Retorna | RBAC | Prioridad | Duración |
|---|----------|--------|-----------|---------|------|----------|----------|
| 7 | `/facturas/:id/exportar` | POST | id, formato? | Buffer (PDF) | admin (su), super, cliente | 🟡 P2 | 2h |
| 8 | `/facturas/exportar/lote` | POST | Body: ids?, filtros | Buffer (Excel) | admin (su), super | 🟡 P2 | 1h |

---

## DETALLES POR ENDPOINT

### 1️⃣ GET /kpis/facturacion/admin

```
Descripción: Obtener KPIs de facturación por hotel
Parámetros Query:
  - idHotel: number (requerido)
  - periodo: enum ['dia', 'mes', 'trimestre', 'año'] (default: mes)
  - fechaInicio: YYYY-MM-DD (opcional, override periodo)
  - fechaFin: YYYY-MM-DD (opcional, override periodo)

Retorna: KpiAdminFacturacionDto {
  periodo: {inicio, fin, etiqueta},
  kpis: {
    totalFacturas: {cantidad, valor},
    facturasPagadas: {cantidad, valor},
    facturasPendientes: {cantidad, valor},
    tasaMorosidad: number,
    promedioFactura: number,
    ingresosPorCategoria: Record<string, number>,
    flujoXDia: [{fecha, ingresos, cantidad}],
    top10Clientes: [{idCliente, nombre, gastosTotal, facturasTotales}]
  },
  resumen: {periodo, generadoEn, actualizado}
}

Status Code: 200
RBAC: 
  - admin: ✅ (solo su hotel)
  - superadmin: ✅ (desde query param)
  - others: ❌ ForbiddenException

Ejemplo:
  GET /kpis/facturacion/admin?idHotel=1&periodo=mes
  
  Response:
  {
    "periodo": {"inicio": "2026-04-01", "fin": "2026-04-30", "etiqueta": "Abril 2026"},
    "kpis": {
      "totalFacturas": {"cantidad": 45, "valor": 2250000},
      "tasaMorosidad": 4.25,
      "flujoXDia": [{"fecha": "2026-04-05", "ingresos": 125000}]
    }
  }

Implementación: KpisService.getKpisAdmin()
  - Determina rango fechas
  - Lanza 7 queries paralelas
  - Retorna response tipada
  - Tiempo: < 500ms
```

---

### 2️⃣ GET /kpis/facturacion/recepcionista

```
Descripción: Obtener KPIs del día para recepcionista
Parámetros Query:
  - idHotel: number (requerido)
  - fecha: YYYY-MM-DD (default: hoy)

Retorna: KpiRecepcionistaFacturacionDto {
  fecha: "2026-04-05",
  kpis: {
    facturasCreadas: number,
    facturasEmitidas: number,
    facturasPagadas: number,
    ingresoHoy: number,
    pendientesHoy: number,
    huespedSinFacturar: [{idReserva, nombre, tipo}],
    alertasVencidas: [{idFactura, numeroFactura, diasVencida, monto}]
  },
  resumen: {generadoEn, actualizado}
}

Status Code: 200
RBAC:
  - recepcionista: ✅ (solo su hotel)
  - admin: ✅ (solo su hotel)
  - superadmin: ✅ (desde query)
  - others: ❌

Ejemplo:
  GET /kpis/facturacion/recepcionista?idHotel=1&fecha=2026-04-05
  
  Response:
  {
    "fecha": "2026-04-05",
    "kpis": {
      "facturasCreadas": 3,
      "facturasEmitidas": 2,
      "facturasPagadas": 1,
      "ingresoHoy": 125000,
      "alertasVencidas": [{"idFactura": 42, "diasVencida": 4}]
    }
  }

Implementación: KpisService.getKpisRecepcionista()
  - Determina rango horas (00:00 - 23:59)
  - Lanza 5 queries paralelas
  - Tiempo: < 200ms
```

---

### 3️⃣ GET /kpis/facturacion/superadmin

```
Descripción: Obtener KPIs consolidados de toda la plataforma
Parámetros Query:
  - periodo: enum ['dia', 'mes', 'trimestre', 'año'] (default: mes)
  - fechaInicio: YYYY-MM-DD (opcional)
  - fechaFin: YYYY-MM-DD (opcional)

Retorna: KpiSuperadminFacturacionDto {
  periodo: {inicio, fin},
  kpis: {
    totalFacturas: {cantidad, valor},
    facturasPorEstado: Record<estado, {cantidad, valor}>,
    topHoteles: [{idHotel, nombre, ingresos, facturas}],
    análisisMorosidad: {cantidadVencidas, valorVencido, porcentaje}
  },
  resumen: {generadoEn, actualizado}
}

Status Code: 200
RBAC:
  - superadmin: ✅
  - others: ❌ ForbiddenException

Ejemplo:
  GET /kpis/facturacion/superadmin?periodo=trimestre
  
  Response:
  {
    "kpis": {
      "totalFacturas": {"cantidad": 450, "valor": 22500000},
      "topHoteles": [
        {"idHotel": 1, "nombre": "Hotel A", "ingresos": 5000000}
      ],
      "análisisMorosidad": {"cantidadVencidas": 15, "porcentajeMorosidad": 3.33}
    }
  }

Implementación: KpisService.getKpisSuperadmin()
  - Lanza 4 queries paralelas
  - Agregaciones globales (todos hoteles)
  - Tiempo: < 1000ms
```

---

### 4️⃣ GET /facturas/reportes/ingresos

```
Descripción: Reporte de ingresos agrupados por categoría o período
Parámetros Query:
  -idHotel: number (requerido)
  - agruparPor: enum ['categoria', 'dia', 'semana', 'mes'] (requerido)
  - periodo: enum ['mes', 'trimestre', 'año'] (default: mes)
  - fechaInicio: YYYY-MM-DD (override periodo)
  - fechaFin: YYYY-MM-DD (override periodo)

Retorna: ReporteIngreso[] [
  {
    // Si agruparPor = 'categoria'
    categoria: "ALOJAMIENTO",
    cantidad: 45,
    subtotal: 4500000,
    iva: 855000,
    inc: 0,
    total: 5355000,
    porcentajeTotal: 35.2
  },
  // Si agruparPor = 'dia'
  {
    fecha: "2026-04-05",
    cantidad: 12,
    total: 2400000
  }
]

Status Code: 200
RBAC:
  - admin: ✅ (su hotel)
  - superadmin: ✅ (cualquier hotel)
  - others: ❌

Ejemplo:
  GET /facturas/reportes/ingresos?idHotel=1&agruparPor=categoria&periodo=mes
  
  Response:
  [
    {"categoria": "ALOJAMIENTO", "cantidad": 45, "subtotal": 4500000, "total": 5355000},
    {"categoria": "RESTAURANTE", "cantidad": 23, "subtotal": 800000, "total": 952000}
  ]

Implementación: FacturaService.getReporteIngresos()
  - 1 query SQL
  - Agrupa por campo seleccionado
  - Calcula porcentajes
  - Tiempo: < 2000ms
```

---

### 5️⃣ GET /facturas/reportes/clientes

```
Descripción: Top clientes por gasto
Parámetros Query:
  - idHotel: number (requerido)
  - limit: number (default: 10, max: 50)
  - periodo: enum ['mes', 'trimestre', 'año', 'todo'] (default: mes)

Retorna: ReporteCliente[] [
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
]

Status Code: 200
RBAC:
  - admin: ✅ (su hotel)
  - superadmin: ✅
  - others: ❌

Ejemplo:
  GET /facturas/reportes/clientes?idHotel=1&limit=10&periodo=mes
  
  Response:
  [
    {"idCliente": 15, "nombre": "Juan", "gastosTotal": 1500000, "facturasTotales": 5},
    {"idCliente": 8, "nombre": "María", "gastosTotal": 1200000, "facturasTotales": 4}
  ]

Implementación: FacturaService.getReporteClientes()
  - 1 query SQL con GROUP BY
  - ORDER BY gastosTotal DESC
  - LIMIT configurado
  - Tiempo: < 2000ms
```

---

### 6️⃣ GET /facturas/reportes/morosidad

```
Descripción: Análisis de facturas morosas (vencidas sin pagar)
Parámetros Query:
  - idHotel: number (requerido)
  - diasAtrasados: number (default: 30)
  - periodo: enum ['mes', 'trimestre', 'año'] (default: mes)
  - ordenarPor: enum ['dias', 'monto'] (default: monto)

Retorna: ReporteMorosidad[] [
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
]

Status Code: 200
RBAC:
  - admin: ✅ (su hotel)
  - superadmin: ✅
  - others: ❌

Ejemplo:
  GET /facturas/reportes/morosidad?idHotel=1&diasAtrasados=30&periodo=mes
  
  Response:
  [
    {
      "numeroFactura": "FAC-2026-00042",
      "montoTotal": 850000,
      "diasAtrasada": 4,
      "interesesAcumulados": 4250
    }
  ]

Implementación: FacturaService.getReporteMorosidad()
  - Query con DATEDIFF
  - Calcula intereses (x/30 mensual)
  - Filtra por diasAtrasados
  - Tiempo: < 2000ms
```

---

### 7️⃣ POST /facturas/:id/exportar

```
Descripción: Descargar factura como PDF o XML
Path Parameters:
  - id: number (idFactura, requerido)

Query Parameters:
  - formato: enum ['pdf', 'xml'] (default: pdf)

Retorna: Buffer (archivo)
Content-Type: application/pdf o application/xml
Content-Disposition: attachment; filename="FAC-{numeroFactura}.pdf"

Status Code: 200
RBAC:
  - admin: ✅ (facturas de su hotel)
  - superadmin: ✅ (cualquier factura)
  - cliente: ✅ (sus propias facturas)
  - others: ❌

Ejemplo:
  POST /facturas/42/exportar?formato=pdf
  
  Response:
  [Buffer binary PDF data]
  Headers:
    Content-Type: application/pdf
    Content-Disposition: attachment; filename="FAC-2026-00042.pdf"

PDF Content:
  - Header con logo y datos hotel
  - Datos cliente y factura
  - Tabla de detalles
  - Totales (subtotal, IVA, INC, TOTAL)
  - Footer

Implementación: FacturaService.exportarPdf()
  - Usa librería pdfkit
  - Genera documento con formato oficial
  - Tiempo: < 3000ms
```

---

### 8️⃣ POST /facturas/exportar/lote

```
Descripción: Descargar múltiples facturas como Excel
Query Parameters:
  - idHotel: number (requerido)

Body (JSON):
{
  "idFacturas"?: [1, 2, 3],               // opcional
  "estado"?: "PAGADA",                    // opcional: EMITIDA, PAGADA, ANULADA
  "periodo"?: "mes",                      // default: mes
  "fechaInicio"?: "2026-04-01",           // override periodo
  "fechaFin"?: "2026-04-30"               // override periodo
}

Retorna: Buffer (archivo Excel)
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="Facturas_YYYY-MM-DD.xlsx"

Status Code: 200
RBAC:
  - admin: ✅ (su hotel)
  - superadmin: ✅ (todos los hoteles)
  - others: ❌

Ejemplo:
  POST /facturas/exportar/lote?idHotel=1
  Body:
  {
    "estado": "PAGADA",
    "periodo": "mes",
    "fechaInicio": "2026-04-01",
    "fechaFin": "2026-04-30"
  }
  
  Response:
  [Buffer binary Excel data]
  Headers:
    Content-Type: application/vnd.ms-excel
    Content-Disposition: attachment; filename="Facturas_2026-04-05.xlsx"

Excel Sheets:
  1. "Resumen": Totales, cantidad, promedio
  2. "Facturas": ID, Número, Cliente, Estado, Total, Fecha
  3. "Desg ose": Por categoría/estado

Implementación: FacturaService.exportarExcelLote()
  - Usa librería xlsx
  - Genera libro con 3 hojas
  - Tiempo: < 5000ms
```

---

## FLOW DIAGRAM

```
USER REQUEST
    ↓
JWT Auth Guard
    ↓
Roles Guard (RBAC)
    ↓
┌─ KPI? ──→ KpisController ──→ KpisService ──→ Factura Repository ──→ Query SQL
│  
├─ Reporte? ──→ ReportesController ──→ FacturaService ──→ Query SQL
│
└─ Exportar? ──→ FacturaController ──→ FacturaService ──→ PDF/Excel Buffer
    ↓
Response + Headers
    ↓
USER GETS DATA/FILE
```

---

## ARQUITECTURA DB

```
Tablas usadas:
├─ facturas
│  ├─ id
│  ├─ id_hotel
│  ├─ id_cliente
│  ├─ estado_factura
│  ├─ total
│  ├─ fecha_emision
│  ├─ fecha_vencimiento
│  └─ desglose_monetario (JSON)
│
└─ detalle_facturas
   ├─ id_factura (FK)
   ├─ categoria_nombre
   ├─ total
   ├─ monto_iva
   └─ monto_inc

Índices necesarios:
- idx_factura_hotel_estado_fecha (NUEVO)
- idx_factura_cliente_hotel (NUEVO)
- idx_detalle_factura_categoria (NUEVO)
```

---

## TESTING CHECKLIST

```
Per endpoint:
☐ Happy path (200 OK)
☐ RBAC violation (403 Forbidden)
☐ Invalid params (400 Bad Request)
☐ Not found (404 Not Found)
☐ Performance < target (ms)

KPIs:
☐ GET /kpis/admin (admin su hotel)
☐ GET /kpis/admin (admin otro hotel) → 403
☐ GET /kpis/admin (superadmin) → OK
☐ Performance < 500ms

Reportes:
☐ GET /reportes/ingresos
☐ GET /reportes/clientes
☐ GET /reportes/morosidad

Exportación:
☐ POST /exportar (PDF generado)
☐ POST /exportar/lote (Excel generado)
☐ Headers correctos

RBAC Coverage:
☐ admin: 7/8 endpoints (no superadmin)
☐ superadmin: 8/8 endpoints
☐ recepcionista: 1/8 endpoints
☐ cliente: 1/8 endpoints
```

---

## RESUMEN PARA DEV

```
Endpoints a crear/implementar:
✅ 1. GET /kpis/facturacion/admin          (KpisService.getKpisAdmin)
✅ 2. GET /kpis/facturacion/recepcionista  (KpisService.getKpisRecepcionista)
✅ 3. GET /kpis/facturacion/superadmin     (KpisService.getKpisSuperadmin)
❌ 4. GET /facturas/reportes/ingresos      (FacturaService.getReporteIngresos) - NUEVO
❌ 5. GET /facturas/reportes/clientes      (FacturaService.getReporteClientes) - NUEVO
❌ 6. GET /facturas/reportes/morosidad     (FacturaService.getReporteMorosidad) - NUEVO
❌ 7. POST /facturas/:id/exportar          (FacturaService.exportarPdf) - NUEVO
❌ 8. POST /facturas/exportar/lote         (FacturaService.exportarExcelLote) - NUEVO

Controladores a crear/actualizar:
✅ KpisController (actualizar 3 métodos)
❌ ReportesController (crear nuevo)

Servicios a actualizar:
✅ KpisService (+20 métodos)
❌ FacturaService (+5 métodos)

Librerías a instalar:
npm install pdfkit xlsx

Total líneas de código: ~800 líneas

Total duración: 13-15 horas
```

---

**Referencia rapida**: Usar esta matriz para verificación rápida de endpoints durante implementación.
