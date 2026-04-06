# 🔐 SECURITY AUDIT: RBAC & GUARDS - Hotel Sena 2026 Backend

**Fecha:** 5 Abril 2026  
**Alcance:** `src/` - Exploración completa de autenticación, autorización y seguridad  
**Estado:** IMPLEMENTACIÓN PARCIAL - Brechas detectadas

---

## 1️⃣ AUTH STRUCTURE

### 🔑 Roles Definidos (src/auth/constants/roles.ts)

```typescript
export const Rol = {
  SUPERADMIN: 'superadmin',      // ✅ Implementado
  ADMIN: 'admin',                // ✅ Implementado
  RECEPCIONISTA: 'recepcionista',// ✅ Implementado
  CAFETERIA: 'cafeteria',        // ✅ Implementado
  LAVANDERIA: 'lavanderia',      // ✅ Implementado
  SPA: 'spa',                    // ✅ Implementado
  ROOM_SERVICE: 'room_service',  // ✅ Implementado
  CLIENTE: 'cliente',            // ✅ Implementado
}
```

### 📊 Rol Grupos (Agregaciones de roles)
```typescript
EMPLEADOS_AREA: ['cafeteria','lavanderia','spa','room_service']
RECEPCION: ['recepcionista','admin','superadmin']
GESTION: ['admin','superadmin']
TODOS_EMPLEADOS: [todos excepto cliente]
```

### 🔐 Asignación de Roles
| Entidad | Tabla | Campo | Valor | Quién Asigna |
|---------|-------|-------|-------|-------------|
| **Cliente** | `clientes` | `rol` | `'cliente'` (hardcoded) | Sistema auto POST /auth/register |
| **Empleado** | `empleados` | `rol` | `'admin'\|'recepcionista'\|'cafeteria'...` | SuperAdmin/AdminPOST /empleados |

### 🛡️ Estrategias de Autenticación
1. **JWT (Bearer Token)**
   - Archivo: `src/auth/strategies/jwt.strategy.ts`
   - Extractor: `ExtractJwt.fromAuthHeaderAsBearerToken()`
   - Validación: `sub`, `email`, `rol` obligatorios
   - Payload: `{ id, sub, email, rol, idHotel, idCliente, idEmpleado }`

2. **Google OAuth 2.0** (HABILITADO pero sin protección de endpoint)
   - Archivo: `src/auth/strategies/google.strategy.ts`
   - Servicio: `GoogleStrategy` en `PassportModule`
   - Auto-crea cliente si no existe
   - Rol asignado: `cliente`

---

## 2️⃣ GUARDS IMPLEMENTADOS (5 Total)

### ✅ Guard #1: JwtAuthGuard
**Archivo:** `src/auth/guards/jwt-auth.guard.ts`  
**Tipo:** Extends `AuthGuard('jwt')`  
**Función:** Valida presencia de JWT válido en header Authorization  
**Protege:** ✅ Token expirado, ✅ Signature inválida, ❌ NO valida rol

**Uso (19 controllers):**
```
@UseGuards(JwtAuthGuard)
```

---

### ✅ Guard #2: RolesGuard
**Archivo:** `src/auth/guards/roles.guard.ts`  
**Tipo:** Implementa `CanActivate`  
**Función:** Valida que `user.rol` esté en decorator `@Roles(...)`  
**Requisito:** Debe estar combinado con `@Roles()`  
**Protege:** ✅ Rol requerido, ❌ NO valida propiedad del recurso

**Uso obligatorio:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
```

---

### ✅ Guard #3: HotelScopeGuard
**Archivo:** `src/common/guards/hotel-scope.guard.ts`  
**Tipo:** Implementa `CanActivate` (async)  
**Función:** Valida que usuario solo acceda a recursos de su hotel  
**Lógica:**
- Superadmin: ✅ Acceso a todo
- Admin/Recepcionista: ✅ Valida `idHotel` asignado, ❌ Falla si sin hotel

**PROBLEMA:** No está registrado en ningún controller  
**Estado:** ❌ IMPLEMENTADO PERO NUNCA USADO

---

### ✅ Guard #4: ResourceOwnershipGuard
**Archivo:** `src/common/guards/resource-ownership.guard.ts`  
**Tipo:** Implementa `CanActivate` (async)  
**Función:** Previene que clientes accedan a recursos de otros clientes  
**Lógica:**
- Solo aplica a rol `'cliente'`
- Busca `idCliente` en params/query
- Compara con `user.idCliente` del token

**PROBLEMA:** No está registrado en ningún controller  
**Estado:** ❌ IMPLEMENTADO PERO NUNCA USADO

---

### ⚠️ Guard #5: GoogleAuthGuard
**Archivo:** `src/auth/guards/google-auth.guard.ts`  
**Tipo:** Extends `AuthGuard('google')`  
**Función:** Valida flujo OAuth de Google  
**Protege:** ✅ Token Google, ❌ Sin endpoint que lo use

**Endpoint:** `GET /auth/google` (NO ENCONTRADO)  
**Estado:** ❌ HUÉRFANO - Estrategia definida pero sin controller

---

## 3️⃣ MIDDLEWARE & DECORADORES

### 📍 Decorador: @Roles()
**Archivo:** `src/auth/decorators/roles.decorator.ts`  
**Función:** Marca metadata `'roles'` que `RolesGuard` lee  
**Requisito:** Debe acompañarse con `RolesGuard`

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')  // ← Metadata para RolesGuard
```

---

### 🛡️ Middleware: AdminAccessMiddleware
**Archivo:** `src/common/middleware/admin-access.middleware.ts`  
**Función:** Auditoría de acceso a endpoints admin  
**Configurado en:** `app.module.ts`

**Rutas Monitoreadas:**
```typescript
'/users', '/usuarios', '/habitaciones', '/empleados',
'/hoteles', '/amenidades', '/medios-pago', '/tipos-habitacion'
```

**Registro:** Cada petición → tabla `audit_logs`  
**Niveles:** IP address, User-Agent, Usuario, Rol, Ruta, Parámetros  
**PROBLEMA:** ⚠️ Solo registra, NO BLOQUEA. Middleware de auditoría, no de validación.

---

### 📋 Global Middleware en main.ts
```typescript
- ValidationPipe: ✅ Whitelist, ✅ Transform DTOs
- CORS: Abierto a localhost:3000, :3001, :3003
- Swagger: Disponible en /api/docs
```

---

## 4️⃣ LISTA COMPLETA DE CONTROLLERS & ENDPOINTS

### 📌 ESTRUCTURA
| Controller | Ruta | Endpoints Protegidos | Endpoints Públicos |
|-----------|------|----------------------|-------------------|

---

### 🔵 AUTH Controller
**Ruta:** `GET /auth/profile` - ✅ `@UseGuards(JwtAuthGuard)`

| Método | Endpoint | Guard | Roles Requeridos | Estado |
|--------|----------|-------|------------------|--------|
| POST | `/auth/register` | ❌ NINGUNO | - | 🔴 PÚBLICO - Cualquiera crea cliente |
| POST | `/auth/login` | ❌ NINGUNO | - | 🟢 CORRECTO - Login público |
| POST | `/auth/register-superadmin` | ❌ NINGUNO | - | 🟡 Bootstrap, solo si no existe SA |
| GET | `/auth/profile` | ✅ JwtAuthGuard | - | 🟢 Protegido |

---

### 🔵 USUARIOS Controller (`/users`)
**Protección:** `@UseGuards(JwtAuthGuard, RolesGuard)` a nivel controller

| Método | Endpoint | Roles | Estado |
|--------|----------|-------|--------|
| GET | `/users` | `'admin', 'superadmin'` | ✅ |
| POST | `/users` | `'admin', 'superadmin'` | ✅ |
| DELETE | `/users/:id` | `'admin', 'superadmin'` | ✅ |
| PATCH | `/users/:id/roles` | `'admin', 'superadmin'` | ✅ |

---

### 🔵 EMPLEADOS Controller (`/empleados`)
**Protección:** `@UseGuards(JwtAuthGuard, RolesGuard)` por endpoint

| Método | Endpoint | Roles | Estado |
|--------|----------|-------|--------|
| POST | `/empleados` | `'superadmin', 'admin'` | ✅ |
| GET | `/empleados` | `'superadmin', 'admin', 'recepcionista'` | ✅ |
| GET | `/empleados/:id` | `'superadmin', 'admin', 'recepcionista'` | ✅ |
| PATCH | `/empleados/:id` | `'superadmin', 'admin'` | ✅ |
| DELETE | `/empleados/:id` | `'superadmin', 'admin'` | ✅ |

---

### 🔵 CLIENTES & HUÉSPEDES Controllers (`/clientes`, `/huespedes`)

| Endpoint | Roles | Estado |
|----------|-------|--------|
| POST | `'admin'` | ✅ Protegido |
| GET | `'admin', 'recepcionista', 'superadmin'` | ✅ Protegido |
| GET `/:id` | ❌ SIN GUARD | 🔴 PÚBLICO |
| PATCH `/:id` | `'admin', 'superadmin'` | ✅ Protegido |
| DELETE `/:id` | `'admin', 'superadmin'` | ✅ Protegido |

**BRECHA:** `GET /clientes/:id` y `GET /huespedes/:id` sin protección

---

### 🔵 RESERVAS Controller (`/reservas`)

| Endpoint | Roles | Estado |
|----------|-------|--------|
| POST | `'cliente', 'recepcionista', 'admin', 'superadmin'` | ✅ |
| GET | `'recepcionista', 'admin', 'superadmin'` | ✅ |
| GET `/disponibilidad` | ❌ SIN GUARD | 🟢 PÚBLICO (correcto) |
| GET `/codigo/:codigoConfirmacion` | ❌ SIN GUARD | 🔴 INFORMACIÓN SENSIBLE |
| GET `/activa/:idCliente` | `'cliente', 'recepcionista'...` | ✅ |
| GET `/cliente/:idCliente` | `'cliente', 'admin', 'superadmin'` | ✅ |
| GET `/hotel/:idHotel` | `'recepcionista', 'admin'` | ✅ |

**BRECHA:** `GET /reservas/codigo/:codigoConfirmacion` expone reservas sin autenticación

---

### 🔵 FACTURAS Controller (`/facturas`)

| Endpoint | Roles | Estado |
|----------|-------|--------|
| GET `/catalogo/estados` | ❌ SIN GUARD | 🟢 PÚBLICO (correcto) |
| POST `/generar/:idReserva` | `'recepcionista', 'admin', 'superadmin'` | ✅ |
| GET | `'admin', 'superadmin'` | ✅ |
| GET `/:id` | `'recepcionista', 'admin', 'superadmin', 'cliente'` | ✅ |
| GET `/reserva/:idReserva` | `'recepcionista', 'admin', 'superadmin', 'cliente'` | ✅ |
| GET `/cliente/:idCliente` | `'admin', 'superadmin', 'cliente'` | ✅ |
| PATCH `/:id/emitir` | `'admin', 'superadmin'` | ✅ |
| PATCH `/:id/anular` | `'admin', 'superadmin'` | ✅ |

---

### 🔵 PAGOS Controller (`/pagos`)

| Endpoint | Roles | Estado |
|----------|-------|--------|
| POST | `'recepcionista', 'superadmin'` | ✅ (Segregación de funciones) |
| GET | `'admin', 'superadmin'` | ✅ |
| GET `/factura/:idFactura` | `'recepcionista', 'admin', 'superadmin', 'cliente'` | ✅ |
| PATCH `/:id/devolver` | `'recepcionista'` | ✅ |

---

### 🔵 SERVICIOS / PEDIDOS Controller (`/servicios`)

| Endpoint | Roles | Estado |
|----------|-------|--------|
| POST `/catalogo` | `'admin', 'superadmin'` | ✅ |
| GET `/catalogo/:idHotel` | ❌ SIN GUARD | 🟢 PÚBLICO (correcto) |
| GET `/catalogo-agrupado/:idHotel` | ❌ SIN GUARD | 🟢 PÚBLICO (correcto) |
| POST `/pedidos` | `'cliente'` | ✅ |
| GET `/pedidos/mis-pedidos/:idReserva` | `'cliente'` | ✅ |
| DELETE `/pedidos/:id/cancelar` | `'cliente'` | ✅ |

---

### 🔵 HABITACIONES Controller (`/habitaciones`)

| Endpoint | Roles | Estado |
|----------|-------|--------|
| POST | `'admin', 'superadmin'` | ✅ |
| GET | ❌ SIN GUARD | 🟢 PÚBLICO |
| GET `/:id` | ❌ SIN GUARD | 🟢 PÚBLICO |
| PATCH `/:id` | `'admin', 'superadmin'` | ✅ |
| PATCH `/:id/imagenes` | `'admin', 'superadmin'` | ✅ |
| POST `/:id/checkin` | `'recepcionista', 'admin', 'superadmin'` | ✅ |
| POST `/:id/checkout` | `'recepcionista', 'admin', 'superadmin'` | ✅ |
| DELETE `/:id` | `'admin', 'superadmin'` | ✅ |

---

### 🔵 HOTELES Controller (`/hoteles`)

| Endpoint | Roles | Estado |
|----------|-------|--------|
| POST | `'superadmin'` | ✅ |
| GET | `'superadmin', 'admin'` | ✅ |
| GET `/:id` | ❌ SIN GUARD | 🟢 PÚBLICO |
| PATCH `/:id` | `'superadmin'` | ✅ |
| DELETE `/:id` | `'superadmin'` | ✅ |

---

### 🔵 TIPOS HABITACIÓN Controller (`/tipos-habitacion`)

| Endpoint | Roles | Estado |
|----------|-------|--------|
| POST | `'admin', 'superadmin'` | ✅ |
| GET | ❌ SIN GUARD | 🟢 PÚBLICO |
| GET `/:id` | ❌ SIN GUARD | 🟢 PÚBLICO |

---

### 🔵 AMENIDADES Controller (`/amenidades`)

| Endpoint | Roles | Estado |
|----------|-------|--------|
| POST | ✅ `JwtAuthGuard` but NO RolesGuard | ⚠️ SOLO AUTENTICADO |
| GET | ✅ `JwtAuthGuard` but NO RolesGuard | ⚠️ SOLO AUTENTICADO |
| GET `/:id` | ✅ `JwtAuthGuard` but NO RolesGuard | ⚠️ SOLO AUTENTICADO |
| PATCH `/:id` | ✅ Guard JWT + RolesGuard | ✅ |
| DELETE `/:id` | ✅ Guard JWT + RolesGuard | ✅ |

**PROBLEMA:** POST/GET amenidades requieren autenticación pero NO especifican rol

---

### 🔵 INCIDENCIAS Controller (`/incidencias`)

| Endpoint | Roles | Estado |
|----------|-------|--------|
| GET `/catalogo/estados` | ❌ SIN GUARD | 🟢 PÚBLICO (correcto) |
| POST | `'recepcionista', 'admin', 'superadmin'` | ✅ |
| GET | `'recepcionista', 'admin', 'superadmin'` | ✅ |
| PATCH | `'recepcionista', 'admin'` | ✅ |
| DELETE | `'recepcionista', 'admin'` | ✅ |

---

### 🔵 MEDIOS PAGO Controller (`/medios-pago`)

| Endpoint | Roles | Estado |
|----------|-------|--------|
| GET | `'recepcionista', 'admin', 'superadmin', 'cliente'` | ✅ |
| POST | `'superadmin'` | ✅ |
| PATCH `/:id/toggle` | `'admin', 'superadmin'` | ✅ |

---

### 🔵 FOLIOS Controller (`/folios`)

| Endpoint | Roles | Estado |
|----------|-------|--------|
| POST | `'recepcionista', 'admin', 'superadmin'` | ✅ |
| GET `/:id` | `'recepcionista', 'admin', 'superadmin'` | ✅ |
| PATCH `/:id/cargo` | `'recepcionista', 'admin'` | ✅ |
| DELETE `/:id/cargo` | `'recepcionista', 'admin'` | ✅ |

---

### 🔵 SUPERADMIN Controller (`/superadmin`)
**Protección Global:** `@UseGuards(JwtAuthGuard, RolesGuard) @Roles('superadmin')`  
**Todos los endpoints:** ✅ Solo superadmin

---

### 🔵 AUDITORÍA Controller (`/auditoria`)

| Endpoint | Roles | Estado |
|----------|-------|--------|
| GET | `'superadmin'` | ✅ |
| GET `/entidad/:entidad/:idEntidad` | `'admin', 'superadmin'` | ✅ |
| GET `/usuario/:usuarioId` | `'admin', 'superadmin'` | ✅ |

---

### 🔵 APP Controller
**Ruta:** `/`  
**GET** `@Get()` - ❌ SIN GUARD - 🟢 PÚBLICO (health check, correcto)

---

## 🚨 ENDPOINTS DESPROTEGIDOS (BRECHAS CRÍTICAS)

### 🔴 CRÍTICO - Información Sensible Expuesta

| Endpoint | Datos Expuestos | Riesgo | Fix |
|----------|-----------------|--------|-----|
| `GET /clientes/:id` | Nombre, email, cédula, teléfono, dirección | Información Personal | Agregar `@UseGuards(JwtAuthGuard, RolesGuard)` |
| `GET /huespedes/:id` | Mismo que clientes | Información Personal | Agregar guards |
| `GET /reservas/codigo/:codigoConfirmacion` | Fechas, cliente, habitación, precio | Enumeration attack | Agregar `@UseGuards(JwtAuthGuard)` + validar pertenencia |
| `GET /habitaciones` | Números, capacidad, fotos | Información sensible | ⚠️ Revisar si debe ser público |
| `GET /habitaciones/:id` | Detalles completos de habitación | Información sensible | ⚠️ Revisar si debe ser público |
| `GET /hoteles/:id` | Detalles hotel públicos | ✅ Probablemente correcto | Mantener |
| `GET /tipos-habitacion` | Catálogo de tipos | ✅ Probablemente correcto | Mantener |

---

### ⚠️ MEDIO - Sin Validación de Rol Específico

| Endpoint | Protección | Falta | Status |
|----------|-----------|-------|--------|
| `POST /amenidades` | ✅ JwtAuthGuard | RolesGuard - No especifica rol | Indefinido - ¿Quién puede crear? |
| `GET /amenidades` | ✅ JwtAuthGuard | RolesGuard - No especifica rol | Indefinido - ¿Quién puede ver? |
| `GET /amenidades/:id` | ✅ JwtAuthGuard | RolesGuard - No especifica rol | Indefinido |

---

## 📋 GUARDS NUNCA UTILIZADOS (Código Muerto)

1. **HotelScopeGuard** - `src/common/guards/hotel-scope.guard.ts`
   - Implementado pero NO importado en ningún controller
   - Intención: Validar scope de hotel
   - **Solución:** Implementar en controllers: habitacion, reserva, folio, incidencia

2. **ResourceOwnershipGuard** - `src/common/guards/resource-ownership.guard.ts`
   - Implementado pero NO importado en ningún controller
   - Intención: Prevenir que cliente1 vea datos de cliente2
   - **Solución:** Usar en GET /clientes/:id, GET /reservas/:id, etc.

---

## 🔑 FLOW DE ASIGNACIÓN DE ROLES

### ✅ Cliente (rol=cliente)
```
POST /auth/register 
  → AuthService.register()
  → ClienteService.create({rol: 'cliente'})
  → JWT token con rol='cliente'
```

### ✅ Empleado (rol=admin|recepcionista|cafeteria...)
```
POST /empleados (protegido: @Roles('superadmin','admin'))
  → EmpleadoService.create({rol: <requested>})
  → JWT token con rol=<assigned>
```

### ✅ SuperAdmin Primera Vez (rol=superadmin)
```
POST /auth/register-superadmin (BOOTSTRAP - sin guard)
  → AuthService.registerFirstSuperadmin()
  → AuthService.verifica que NO exista otro superadmin
  → JWT token con rol='superadmin'
  → Después: endpoint bloqueado (rechaza nuevos superadmin)
```

---

## 📊 MATRIZ DE RESPONSABILIDADES (RACI)

| Operación | SuperAdmin | Admin | Recepcionista | Cliente | Empleado Area |
|-----------|-----------|-------|---------------|---------|---------------|
| Crear usuarios | ✅ Sí | ✅ Sí | ❌ No | ❌ No | ❌ No |
| Ver usuarios | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No | ❌ No |
| Crear reserva | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No |
| Ver reservas | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Parcial | ❌ No |
| Generar factura | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No | ❌ No |
| Registrar pago | ✅ Sí | ❌ Reportes solo | ✅ Sí | ❌ No | ❌ No |
| Check-in/out | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No | ❌ No |
| Crear incidencias | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No | ❌ No |
| Pedir servicios | ✅ Sí | ✅ Sí | ⚠️ ? | ✅ Sí | ❌ No |

---

## 🎯 RESUMEN EJECUTIVO

### ✅ Lo que ESTÁ BIEN IMPLEMENTADO:
- ✅ JWT authentication con validación de expiración
- ✅ RolesGuard centralizado y reutilizable
- ✅ Decorador @Roles() elegante y explícito
- ✅ Middleware de auditoría para Admin routes
- ✅ Segregación de funciones (Recepcionista registra pagos, Admin no)
- ✅ SuperAdmin bootstrap único
- ✅ Rol de cliente SIEMPRE asignado en registro público
- ✅ DTOs con validación global (ValidationPipe)

### 🔴 Brechas Críticas:
1. **Endpoints sin autenticación que exponen datos sensibles:**
   - GET /clientes/:id
   - GET /reservas/codigo/:codigoConfirmacion
   - GET /clientes (?revisado)

2. **Guards implementados pero no utilizados:**
   - HotelScopeGuard
   - ResourceOwnershipGuard

3. **Endpoint huérfano:**
   - GoogleAuthGuard importado pero nunca usado

4. **Amenidades sin rol específico:**
   - POST/GET /amenidades permiten cualquier usuario autenticado

5. **Falta de validación de pertenencia:**
   - Cliente A puede ver Factura de Cliente B si conoce el ID

### ⚠️ Problemas de Diseño:
- Información de disponibilidad de habitaciones es pública (considerar si es intención)
- Catálogo de servicios público sin límites
- No hay rate limiting observable
- No hay validación de pertenencia a hotel en varios endpoints

---

## 🔧 PRÓXIMOS PASOS (RECOMENDADOS)

### Fase 1: Cerrar Brechas Críticas (URGENTE)
1. Implementar `ResourceOwnershipGuard` en:
   - `GET /clientes/:id`
   - `GET /reservas/codigo/:codigoConfirmacion`
   - Cualquier GET de recurso específico

2. Implementar `HotelScopeGuard` en:
   - `POST /habitaciones`
   - `PATCH /habitaciones`
   - `GET /folios`

3. Especificar roles para Amenidades:
   - POST/GET: cambiar a `@Roles('admin','superadmin')`

### Fase 2: Validación de Pertenencia
1. Validar que Cliente solo ve sus propias reservas
2. Validar que Admin solo ve recursos de su hotel
3. Validar que Recepcionista solo ve reservas de su hotel

### Fase 3: Rate Limiting
1. Agregar `@nestjs/throttler` para prevenir enumeration
2. Limitar GET /reservas/codigo por IP

---

## 📎 Archivos Clave

| Archivo | Función |
|---------|---------|
| `src/auth/constants/roles.ts` | Definición de roles y grupos |
| `src/auth/guards/roles.guard.ts` | Validación de rol |
| `src/auth/guards/jwt-auth.guard.ts` | Validación de JWT |
| `src/common/guards/hotel-scope.guard.ts` | Scope de hotel (NO USADO) |
| `src/common/guards/resource-ownership.guard.ts` | Propiedad de recurso (NO USADO) |
| `src/auth/decorators/roles.decorator.ts` | Decorador @Roles() |
| `src/auth/strategies/jwt.strategy.ts` | Extractor y validador JWT |
| `src/common/middleware/admin-access.middleware.ts` | Auditoría de admin routes |
| `src/app.module.ts` | Configuración de middleware |
| `src/main.ts` | Global pipes y configuración |

---

**Generado:** 5 Abril 2026  
**Auditor:** GitHub Copilot - Exploración Exhaustiva RBAC
