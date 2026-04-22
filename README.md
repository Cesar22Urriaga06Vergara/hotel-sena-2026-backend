# Hotel Sena 2026 - Backend API

<div align="center">

**Backend REST API** para el sistema de gestión hotelera integral Hotel Sena 2026.

Construido con **NestJS**, **TypeORM**, **MySQL** y autenticación con **Passport**.

[![Node.js](https://img.shields.io/badge/node.js-v18+-brightgreen)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/license-UNLICENSED-red)](#license)

</div>

---

## 📋 Descripción

API REST completa para la gestión integral de un hotel, incluyendo:

- 👥 **Gestión de Usuarios y Roles** con RBAC (Control de Acceso Basado en Roles)
- 🏨 **Administración de Hoteles** y Categorías
- 📅 **Sistema de Reservas** y Check-in/Check-out
- 💰 **Facturación** y Gestión de Pagos
- 📊 **Reportes y KPIs** en tiempo real
- 📸 **Gestión de Multimedia** con Cloudinary
- 🔐 **Autenticación OAuth2** con Google
- 📄 **Generación de Reportes** en Excel y PDF

---

## 🚀 Requisitos Previos

- **Node.js** v18+ 
- **npm** o **yarn**
- **MySQL** 8.0+
- **Variables de entorno** configuradas (`.env`)

---

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd "Hotel Sena 2026"
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Editar `.env` con las credenciales de base de datos y servicios externos.

4. **Ejecutar migraciones de base de datos**
   ```bash
   npm run typeorm migration:run
   ```

---

## 🛠️ Scripts Disponibles

### Desarrollo
```bash
# Iniciar en modo desarrollo con hot-reload
npm run start:dev

# Iniciar en modo debug
npm run start:debug
```

### Producción
```bash
# Compilar el proyecto
npm run build

# Ejecutar en producción
npm run start:prod
```

### Testing
```bash
# Tests unitarios
npm run test

# Tests con cobertura
npm run test:cov

# Tests e2e
npm run test:e2e

# Tests en modo watch
npm run test:watch
```

### Calidad de Código
```bash
# Lint y fix automático
npm run lint

# Formatear código con Prettier
npm run format
```

---

## 📁 Estructura del Proyecto

```
src/
├── modules/              # Módulos de la aplicación
│   ├── auth/            # Autenticación y autorización
│   ├── usuarios/        # Gestión de usuarios
│   ├── hoteles/         # Administración de hoteles
│   ├── reservas/        # Sistema de reservas
│   ├── facturacion/     # Módulo de facturación
│   ├── reportes/        # Generación de reportes
│   └── servicios/       # Servicios auxiliares
├── common/              # Guardias, interceptores, decoradores comunes
├── config/              # Configuración de la aplicación
├── database/            # Configuración de TypeORM
├── main.ts              # Punto de entrada
└── app.module.ts        # Módulo raíz

test/                    # Tests e2e
scripts/                 # Scripts de base de datos y migraciones
```

---

## 🔑 Variables de Entorno

Crear archivo `.env` con:

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_NAME=hotel_sena

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRATION=3600

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Cloudinary
CLOUDINARY_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Puerto
PORT=3000
```

---

## 📚 Documentación API

Una vez ejecutando el servidor, accede a la documentación Swagger:

```
http://localhost:3000/api/docs
```

---

## 🗄️ Base de Datos

### Migraciones
```bash
# Crear nueva migración
npm run typeorm migration:create

# Ejecutar migraciones
npm run typeorm migration:run

# Revertir última migración
npm run typeorm migration:revert
```

### Seeders
```bash
# Ejecutar seeders
npm run seed
```

---

## 🔐 Autenticación

- **JWT Bearer Token** para API
- **Google OAuth2** para usuarios
- **RBAC** para control de acceso basado en roles

---

## 📊 Características Principales

- ✅ Gestión completa de usuarios con roles
- ✅ Sistema de reservas con validaciones
- ✅ Facturación automatizada
- ✅ Reportes en múltiples formatos
- ✅ Integración con Cloudinary para imágenes
- ✅ Swagger/OpenAPI documentación
- ✅ Validación con class-validator
- ✅ Manejo de errores centralizado

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es **UNLICENSED** y es propiedad privada.
