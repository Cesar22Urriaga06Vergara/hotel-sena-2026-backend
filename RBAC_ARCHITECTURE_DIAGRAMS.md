# 📐 RBAC ARCHITECTURE DIAGRAM

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLIENTE ACCEDE                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
         ┌──────▼──────┐      ┌──────▼──────┐
         │   JWT       │      │   Google    │
         │   Login     │      │   OAuth 2.0 │
         └──────┬──────┘      └──────┬──────┘
                │                     │
                │  POST /auth/login   │  SETUP: /auth/google
                │  + credentials      │  + callback
                │                     │
         ┌──────▼─────────────────────▼──────┐
         │   JwtStrategy.validate()          │
         │   - Valida firma                  │
         │   - Extrae sub, email, rol        │
         └──────┬────────────────────────────┘
                │
         ┌──────▼──────────────────────────┐
         │   Payload en Request            │
         │   req.user = {                  │
         │     id, sub, email, rol,        │
         │     idHotel, idCliente,         │
         │     idEmpleado                  │
         │   }                             │
         └─────────────────────────────────┘
```

---

## 🚪 Authorization Flow (Guards)

```
┌──────────────────────────────────────┐
│  Cliente Hace Petición a Endpoint    │
│  GET /clientes/123                   │
│  Header: Authorization: Bearer <JWT> │
└──────────────────┬───────────────────┘
                   │
            ┌──────▼────────┐
            │  @UseGuards() │
            │  Define qué   │
            │  guards validar
            └──────┬────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼─────┐      ┌───────▼───────┐
   │ GUARD #1 │      │   GUARD #2    │
   │ JwtAuth  │ OR   │   Roles       │
   │ Guard    │      │   Guard       │
   └────┬─────┘      └───────┬───────┘
        │                    │
        │ Valida JWT         │ Lee @Roles() metadata
        │ expiración, firma  │ Compara user.rol
        │                    │
        ├─────────┬──────────┤
        │         │          │
    ✅ PASS   ❌ FAIL   🔄 NEXT
        │         │          │
        │         │      ┌───▼──────────┐
        │         │      │ @Roles()     │
        │         │      │ Metadata?    │
        │         │      └───┬──────────┘
        │         │          │
        │      ❌ 401    ┌────▼────────────┬─────────┐
        │      Unauth   │                 │         │
        │               │Sí: Validar  Sí: Skip  No: 403
        │               │
        │          matches?
        │              │
        │           Yes│
        │              │
   ┌────▼──────────────▼─────────┐
   │   Ejecutar Endpoint         │
   │   Controller Method         │
   └────────────┬────────────────┘
                │
         ┌──────▼────────┐
         │  Response     │
         │  200 + Data   │
         └───────────────┘
```

---

## 📊 Guard Decision Tree

```
REQUEST ARRIVES → @UseGuards([GuardA, GuardB])
                       │
                  ┌────┴────┐
                  │ GuardA   │
                  └────┬────┘
                       │
            ┌──────────┼──────────┐
            │          │          │
         ✅Pass    ⏹️Block    🔄Next
            │          │          │
            │          │    ┌─────▼─────┐
            │          │    │  GuardB   │
            │          │    └─────┬─────┘
            │          │          │
            │          │   ┌──────┼──────┐
            │          │   │      │      │
            │          │  ✅Pass │    🔄To Method
            │          │   │      │
         CONTINUE  ❌401 STOP
             │          │
             │          │
        ┌────▼──────────▼──────┐
        │  @Roles() Metadata?  │
        └────┬───────┬─────────┘
             │       │
          Yes│      No (Skip RolesGuard)
             │       │
        ┌────▼──┐   │
        │ user. │   │
        │ rol ∈ │   │
        │roles? │   │
        └────┬──┘   │
             │      │
          ✅Yes  No│
             │      │
             │   ❌403 Forbidden
             │      │
             └──┬───┘
                │
             EXECUTE METHOD
```

---

## 🔑 Rol Hierarchy (RECOMENDADO - No Implementado)

```
                    ┌──────────────┐
                    │ SUPERADMIN   │ ← Todo acceso global
                    └──────┬───────┘
                           │
                ┌──────────┴──────────────┐
                │                         │
           ┌────▼───────┐          ┌──────▼──────┐
           │   ADMIN    │          │  RECEPT.    │ ← Hotel-local
           │  (x Hotel) │          │  (x Hotel)  │
           └────┬───────┘          └──────┬──────┘
                │                         │
             ┌──┴─────────────┬───────────┴──┐
             │                │               │
        ┌────▼────┐      ┌────▼───┐      ┌──▼──────┐
        │CAFETERIA│      │LAVANDERÍA│   │SPA    │
        │ (Area)  │      │ (Area)   │   │ (Area)│
        └─────────┘      └──────────┘   └───────┘

             CLIENTE <- Acceso limitado a propias reservas
```

**NOTA:** Jerarquía recomendada pero NO implementada en código.  
Actualmente todos los roles están al MISMO nivel.

---

## 📍 Rol Assignment Diagram

```
┌─────────────────────────────────────────────────────────────┐
│         AUTOREGISTRO CLIENTE                                │
│  POST /auth/register (PÚBLICO)                              │
│  + Campo 'rol' en body = IGNORADO                           │
└────────────┬────────────────────────────────────────────────┘
             │
             │ AuthService.register()
             │ + rol = 'cliente' (HARDCODED)
             │
        ┌────▼────────────────────────────────┐
        │ CREATE Cliente                      │
        │ {                                   │
        │   email, nombre, apellido,          │
        │   password (hashed),                │
        │   rol: 'cliente' ← SIEMPRE          │
        │ }                                   │
        └────┬────────────────────────────────┘
             │
    ┌────────▼─────────────────────────────┐
    │  JWT Token                           │
    │  {                                   │
    │    sub: clienteId,                   │
    │    email: cliente.email,             │
    │    rol: 'cliente',                   │
    │    idCliente: clienteId,             │
    │    idHotel: null                     │
    │  }                                   │
    └──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│         CREACIÓN EMPLEADO (ADMIN/SUPERADMIN)               │
│  POST /empleados                                            │
│  @UseGuards(JwtAuthGuard, RolesGuard)                      │
│  @Roles('superadmin', 'admin')                             │
│  + Body: { rol: 'admin' | 'recepcionista' | 'cafeteria'... }│
└────────┬───────────────────────────────────────────────────┘
         │
         │ EmpleadoService.create()
         │ + rol = <requested> (VALIDADO)
         │ + idHotel = Admin's hotel
         │
    ┌────▼────────────────────────────────┐
    │ CREATE Empleado                     │
    │ {                                   │
    │   email, nombre, apellido,          │
    │   password (hashed),                │
    │   rol: <requested>,                 │
    │   id_hotel: <admin's hotel>,        │
    │   tax_profile: 'RESIDENT'           │
    │ }                                   │
    └────┬────────────────────────────────┘
         │
    ┌────▼─────────────────────────────┐
    │  JWT Token                       │
    │  {                               │
    │    sub: empleadoId,              │
    │    email: empleado.email,        │
    │    rol: <assigned>,              │
    │    idHotel: <hotel>,             │
    │    idEmpleado: empleadoId        │
    │  }                               │
    └────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│         BOOTSTRAP SUPERADMIN (UNA SOLA VEZ)                 │
│  POST /auth/register-superadmin (PÚBLICO - SOLO 1X)         │
│  + Devuelve error si ya existe SuperAdmin                   │
└────────┬───────────────────────────────────────────────────┘
         │
         │ AuthService.registerFirstSuperadmin()
         │ - Verifica: SELECT COUNT(*) FROM empleados WHERE rol='superadmin'
         │ - Si > 0 → BadRequestException
         │ - Si = 0 → Crear
         │
    ┌────▼──────────────────────────┐
    │ CREATE Empleado SuperAdmin    │
    │ {                             │
    │   rol: 'superadmin',          │
    │   id_hotel: null,  ← SIN HOTEL│
    │ }                             │
    └────┬───────────────────────────┘
         │
    ┌────▼──────────────────────┐
    │  JWT Token                │
    │  {                         │
    │    rol: 'superadmin',      │
    │    idHotel: null,          │
    │  }                         │
    └───────────────────────────┘
```

---

## 🛡️ Guard Application Matrix

```
                   JwtAuthGuard  RolesGuard  HotelScope  ResourceOwner
Empleados               ✅          ✅           ❌            ❌
Clientes                ✅          ✅           ❌            🔴NEEDED
Reservas                ✅          ✅           ❌            🔴NEEDED
Facturas                ✅          ✅           ❌            ❌
Pagos                   ✅          ✅           ❌            ❌
Habitaciones            ✅          ✅           ❌            ❌
Amenidades              ✅          ❌BUG        ❌            ❌
Incidencias             ✅          ✅           ❌            ❌
Servicios               ✅          ✅           ❌            ❌
Folios                  ✅          ✅           ❌            ❌
```

**Legend:**
- ✅ = Implementado y usado
- ❌ = No implementado
- 🔴 = Debería hacerlo pero no lo hace

---

## 🎯 ROLES & RESOURCES (Permiso Implícito)

```
┌─ SUPERADMIN
│  ├─ Ver: TODOS los recursos de TODOS hoteles
│  ├─ Crear: Usuarios, Hoteles, Admin
│  ├─ Modificar: Todo excepto usuarios otros superadmin
│  └─ Eliminar: Todo
│
├─ ADMIN (por hotel)
│  ├─ Hotel: Su hotel asignado
│  ├─ Ver: Reservas, Facturas, Reportes de su hotel
│  ├─ Crear: Recepcionistas, Habitaciones
│  ├─ Modificar: Su hotel, facturas, empleados de su hotel
│  └─ NO Puede: Crear otros admins, registrar pagos
│
├─ RECEPCIONISTA (por hotel)
│  ├─ Hotel: Su hotel asignado
│  ├─ Crear: Reservas, Facturas, Pagos, Incidencias
│  ├─ Modificar: Reservas, Check-in/out
│  └─ Ver: Solo su hotel
│
├─ EMPLEADO ÁREA (Cafetería, Lavandería, Spa, Room Service)
│  ├─ Hotel: Asignado al hotel
│  ├─ Ver: Pedidos a su área
│  ├─ Crear: Cambios de estado de pedidos
│  └─ No documentado en código actual
│
└─ CLIENTE
   ├─ Hotel: N/A (No acoplado)
   ├─ Ver: Sus reservas, sus facturas, sus pedidos
   ├─ Crear: Reservas, Pedidos de servicio
   └─ Modificar: Perfil personal
```

---

## 🚨 Security Findings Summary

```
IMPLEMENTED & WORKING:
✅ JWT Authentication with expiration
✅ Roles-based access control
✅ Decorators @Roles() 
✅ Client role is always auto-assigned
✅ SuperAdmin bootstrap (1x only)
✅ Admin/Recepcionista scope to hotel

NOT IMPLEMENTED / BROKEN:
❌ HotelScopeGuard used nowhere
❌ ResourceOwnershipGuard used nowhere
❌ Amenidad endpoint role undefined
❌ GET /clientes/:id has no guard
❌ GET /reservas/codigo/:codigoConfirmacion public (enumeration)
❌ Client X cannot access Client Y data (missing validation)
❌ Admin A can see Admin B's hotel resources (missing hotel validation)

ARCHITECTURE ISSUES:
⚠️  No role hierarchy (all roles = same level)
⚠️  No rate limiting observable
⚠️  Middleware only audits, doesn't enforce
⚠️  Some public endpoints unclear (GET /habitaciones, GET /tipos-habitacion)
```

---

Diagrama generado: 5 Abril 2026
