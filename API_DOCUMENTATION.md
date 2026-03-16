# Documentación de la API — Hotel SENA 2026

## 📘 Acceso a Swagger UI

La documentación interactiva de la API está disponible en:

```
http://localhost:3001/api/docs
```

> **Para desarrollo:** Asegúrate de que el servidor backend está corriendo (`npm run start:dev`)

---

## 🔐 Autenticación

La mayoría de endpoints están protegidos con **JWT (JSON Web Token)**.

### Flujo de autenticación:

1. **Registro de cliente** (público)
   ```bash
   POST /auth/register
   Content-Type: application/json
   
   {
     "nombre": "Juan",
     "apellido": "Pérez",
     "email": "juan@correo.com",
     "password": "Secure123!"
   }
   ```

2. **Login** (público)
   ```bash
   POST /auth/login
   Content-Type: application/json
   
   {
     "email": "juan@correo.com",
     "password": "Secure123!"
   }
   
   # Response:
   {
     "access_token": "eyJhbGciOiJIUzI1NiIs...",
     "token_type": "Bearer",
     "expires_in": 604800
   }
   ```

3. **Usar el token en requests protegidos**
   ```bash
   GET /auth/profile
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

---

## 🌐 Endpoints principales

### Auth (`/auth`)

| Método | Endpoint | Protegido | Descripción |
|--------|----------|-----------|-------------|
| POST | `/register` | ❌ | Registro de clientes |
| POST | `/login` | ❌ | Login de usuarios |
| POST | `/register-superadmin` | ❌ | Crear primer admin (bootstrap) |
| GET | `/profile` | ✅ | Obtener perfil del usuario |
| PUT | `/me` | ✅ | Actualizar perfil |
| PUT | `/me/complete-profile` | ✅ | Completar datos del cliente |

### Habitaciones (`/habitacion`)

| Método | Endpoint | Protegido | Descripción |
|--------|----------|-----------|-------------|
| GET | `/` | ❌ | Listar todas las habitaciones |
| GET | `/:id` | ❌ | Obtener detalles de una habitación |
| POST | `/` | ✅ | Crear habitación (admin) |
| PUT | `/:id` | ✅ | Actualizar habitación (admin) |
| DELETE | `/:id` | ✅ | Eliminar habitación (admin) |

### Reservas (`/reserva`)

| Método | Endpoint | Protegido | Descripción |
|--------|----------|-----------|-------------|
| GET | `/` | ✅ | Listar mis reservas |
| POST | `/` | ✅ | Crear nueva reserva |
| PUT | `/:id` | ✅ | Actualizar reserva |
| DELETE | `/:id` | ✅ | Cancelar reserva |

### Servicios (`/servicio`)

| Método | Endpoint | Protegido | Descripción |
|--------|----------|-----------|-------------|
| GET | `/` | ❌ | Listar servicios disponibles |
| GET | `/:id` | ❌ | Obtener detalles de un servicio |
| POST | `/` | ✅ | Crear servicio (admin) |

### Empleados (`/empleado`)

| Método | Endpoint | Protegido | Descripción |
|--------|----------|-----------|-------------|
| GET | `/` | ✅ | Listar empleados (admin) |
| POST | `/` | ✅ | Crear empleado (admin) |
| PUT | `/:id` | ✅ | Actualizar empleado (admin) |
| DELETE | `/:id` | ✅ | Eliminar empleado (admin) |

---

## 📋 Ejemplos de uso

### Registrar un cliente

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María",
    "apellido": "García",
    "email": "maria@correo.com",
    "password": "SecurePass123!"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@correo.com",
    "password": "SecurePass123!"
  }'
```

### Obtener perfil (con autenticación)

```bash
curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Listar habitaciones

```bash
curl -X GET http://localhost:3001/habitacion
```

### Crear una reserva

```bash
curl -X POST http://localhost:3001/reserva \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "habitacionId": 1,
    "fechaEntrada": "2026-04-01",
    "fechaSalida": "2026-04-05",
    "numeroHuespedes": 2
  }'
```

---

## ⚠️ Códigos de error

| Código | Significado |
|--------|-------------|
| **200** | OK - Operación exitosa |
| **201** | Created - Recurso creado |
| **400** | Bad Request - Datos inválidos |
| **401** | Unauthorized - Sin autenticación |
| **403** | Forbidden - Sin permisos suficientes |
| **404** | Not Found - Recurso no encontrado |
| **409** | Conflict - El recurso ya existe |
| **500** | Internal Server Error - Error del servidor |

---

## 🛠️ Variables de entorno requeridas

Configurar en `.env`:

```dotenv
PORT=3001
NODE_ENV=development
JWT_SECRET=tu_secreto_muy_seguro_aqui
JWT_EXPIRES_IN=7d
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=tu_password
DB_NAME=hotel_sena_db
CORS_ORIGIN=http://localhost:3000
```

---

## 📚 Referencias

- [NestJS Documentation](https://docs.nestjs.com/)
- [Swagger/OpenAPI](https://swagger.io/)
- [JWT Documentation](https://jwt.io/)
- [TypeORM Documentation](https://typeorm.io/)

---

*Última actualización: 15 de marzo de 2026*
