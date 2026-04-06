# 🚨 QUICK REFERENCE: RBAC & SECURITY STATUS

## 8 ROLES IMPLEMENTADOS ✅
```
superadmin, admin, recepcionista, cliente, cafeteria, lavanderia, spa, room_service
```

## 5 GUARDS (2 NUNCA USADOS ⚠️)
| Guard | Usado | Crítico |
|-------|-------|---------|
| **JwtAuthGuard** | ✅ 19 controllers | Validación de token |
| **RolesGuard** | ✅ 15+ controllers | Validación de rol |
| **HotelScopeGuard** | ❌ NUNCA | IMPLEMENTADO pero NO USADO |
| **ResourceOwnershipGuard** | ❌ NUNCA | IMPLEMENTADO pero NO USADO |
| **GoogleAuthGuard** | ❌ HUÉRFANO | Estrategia sin endpoint |

## AUTENTICACIÓN
- ✅ JWT con Bearer token
- ✅ Google OAuth (habilitado)
- ✅ SuperAdmin bootstrap único
- ✅ Cliente solo puede ser autoregistro

## 🔴 BRECHAS CRÍTICAS (5)

### 1. Información Personal Sin Guard
```
❌ GET /clientes/:id          → Devuelve cédula, email, dirección, etc.
❌ GET /huespedes/:id         → Mismo que arriba
```

### 2. Enumeration Attack de Reservas  
```
❌ GET /reservas/codigo/:codigoConfirmacion  → Expone reserva SIN autenticación
```

### 3. Guards Huérfanos
- HotelScopeGuard: Implementado, código muerto
- ResourceOwnershipGuard: Implementado, código muerto

### 4. Rol Indefinido en Amenidades
```
⚠️  POST /amenidades  → Requiere autenticación pero NO especifica rol
⚠️  GET /amenidades   → Requiere autenticación pero NO especifica rol
```

### 5. Falta Validación de Pertenencia
```
⚠️ Cliente A puede ver factura de Cliente B accediendo a ID correcto
⚠️ Admin A puede ver recursos de hotel B accediendo a ID correcto
```

## ✅ BIEN PROTEGIDOS
- Creación de usuarios (superadmin/admin)
- Creación de empleados (superadmin/admin)
- Crear/anular facturas (admin/superadmin)
- Check-in/checkout (recepcionista/admin)
- Pago (recepcionista - embargo de caja)
- SuperAdmin (todo requiere superadmin)

## 📊 ENDPOINTS POR STATUS
| Status | Cantidad | Ejemplos |
|--------|----------|----------|
| ✅ Bien protegidos | ~45 | POST /empleados, POST /facturas, etc |
| ⚠️ Públicos (correcto?) | ~8 | GET /disponibilidad, GET /catalogo, GET /tipos-habitacion |
| 🔴 Sin protección indeebida | 5 | GET /clientes/:id, GET /reservas/codigo |
| ⚠️ Rol indefinido | 3 | POST/GET /amenidades |

## 🎯 QUICK ACTION ITEMS
```
URGENTE:
  1. Agregar ResourceOwnershipGuard a GET /clientes/:id, GET /huespedes/:id
  2. Agregar JwtAuthGuard a GET /reservas/codigo/:codigoConfirmacion
  3. Especificar rol en POST/GET /amenidades

IMPORTANTE:
  4. Implementar HotelScopeGuard en habitaciones, folios, reservas
  5. Validar que admin solo ve su hotel
  6. Validar que cliente solo ve sus reservas

MEJORA:
  7. Remover GoogleAuthGuard si no se usa
  8. Implementar rate limiting en GET /reservas/codigo
  9. Auditar acceso a GET /habitaciones pública
```

## 📁 ARCHIVO COMPLETO
Ver: `SECURITY_AUDIT_RBAC_BACKEND.md` (documento exhaustivo)

---
Generado: 5 Abril 2026
