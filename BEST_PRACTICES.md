# 🎯 Guía de Mejores Prácticas — Hotel SENA 2026

## 📝 Convención de commits (OBLIGATORIO)

Todos los commits deben seguir **Conventional Commits** con el siguiente formato:

```
<tipo>(<scope>): <descripción corta en imperativo>

[cuerpo opcional — por qué y qué, no cómo]

[footer opcional — referencias a issues/PRs]
```

### Tipos de commit

| Tipo | Cuándo | Ejemplo |
|------|--------|---------|
| `feat` | Nueva funcionalidad | `feat(reserva): agregar endpoint de cancelación` |
| `fix` | Corrección de bug | `fix(auth): corregir validación de JWT expirado` |
| `refactor` | Refactorización sin cambio de comportamiento | `refactor(auth): mejorar estructura del servicio` |
| `chore` | Tareas de mantenimiento (deps, config) | `chore: actualizar dependencias de seguridad` |
| `docs` | Cambios en documentación | `docs: agregar guía de instalación` |
| `style` | Cambios de formato (no lógica) | `style(auth): corregir indentación` |
| `test` | Agregar o corregir tests | `test(reserva): agregar tests para cancelación` |
| `perf` | Mejoras de rendimiento | `perf(db): agregar índices en tabla reserva` |

### ✅ Commits buenos

```bash
git commit -m "feat(habitacion): agregar filtro por disponibilidad y rango de precios"

git commit -m "fix(auth): corregir validación de contraseña débil

- Cambiar longitud mínima de 6 a 8 caracteres
- Requerir al menos un número
- Requerir al menos un carácter especial

Fixes #42"

git commit -m "chore(deps): actualizar nestjs a v11.1.0"
```

### ❌ Commits malos

```bash
# No hacer esto:
git commit -m "Cambios 15-03-2026"
git commit -m "Partes Finales"
git commit -m "fix things"
git commit -m "actualizando"
```

---

## 🌿 Estrategia de ramas

```
main (producción)
  ↑ (PR + review required)
  
develop (integración)
  ↑ (PR recomendado)
  
feature/* (desarrollo de features)
feature/modulo-reportes
feature/integracion-pago

fix/* (correcciones de bugs)
fix/error-login-jwt

chore/* (mantenimiento)
chore/actualizar-deps
```

### Flujo correcto

```bash
# 1. Actualizar develop local
git checkout develop
git pull origin develop

# 2. Crear rama de feature
git checkout -b feature/nueva-funcionalidad

# 3. Hacer trabajo
# ... editar archivos ...

# 4. Commit con convención
git add .
git commit -m "feat(modulo): descripción clara"

# 5. Push y crear PR
git push origin feature/nueva-funcionalidad

# 6. En GitHub: abrir PR desde feature/nueva-funcionalidad hacia develop
# 7. Esperar review y merge
# 8. Eliminar rama remota después del merge
```

---

## 🧪 Testing

### Backend - NestJS

**Ubicación:** `src/**/*.spec.ts`

```bash
# Correr tests
npm run test

# Tests con coverage
npm run test:cov

# Tests en modo watch
npm run test:watch
```

**Ejemplo de test:**
```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('debe retornar token si las credenciales son válidas', async () => {
      const result = await authService.login({ email: 'test@correo.com', password: 'Secure123!' });
      expect(result).toHaveProperty('access_token');
    });

    it('debe lanzar excepción si las credenciales son inválidas', async () => {
      await expect(
        authService.login({ email: 'test@correo.com', password: 'WrongPassword' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

### Frontend - Nuxt 3 / Vitest

**Ubicación:** `components/**/*.spec.ts`

```bash
# Tests
npm run test

# Coverage
npm run test:cov
```

---

## 📐 Estructura de código

### Backend - NestJS

```
src/
  modulo/
    ├── modulo.controller.ts     # Endpoints HTTP
    ├── modulo.service.ts        # Lógica de negocio
    ├── modulo.module.ts         # Configuración del módulo
    ├── dto/                      # Data Transfer Objects
    │   ├── create-modulo.dto.ts
    │   └── update-modulo.dto.ts
    ├── entities/                 # Entidades (DB)
    │   └── modulo.entity.ts
    ├── guards/                   # Guards (protección)
    ├── interceptors/             # Interceptadores
    └── modulo.spec.ts           # Tests
```

### Frontend - Nuxt 3

```
components/
  ├── SectionName.vue
  └── subsection/
      └── ComponentName.vue

composables/
  ├── useApi.ts                  # API calls
  ├── useNotification.ts         # Notificaciones
  └── useAuth.ts                 # Lógica de auth

pages/
  ├── index.vue
  ├── login.vue
  └── dashboard/
      ├── index.vue
      └── [id].vue

stores/
  ├── auth.ts
  ├── reservas.ts
  └── servicios.ts
```

---

## 🔒 Control de acceso

### Backend

```typescript
// Usar decoradores de rol
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'recepcionista')
@Post()
crear(@Body() dto: CreateDto) { ... }

// O validar en el servicio
if (req.user.rol !== 'admin') {
  throw new ForbiddenException('Solo admins pueden crear');
}
```

### Frontend

```typescript
// En composables
const { hasRole } = usePermissions();

if (!hasRole('admin')) {
  // No mostrar componente
}

// En middleware
// middleware/role.ts
export default defineRouteMiddleware((to, from) => {
  const { user } = useAuth();
  if (!user.value?.roles.includes('admin')) {
    return navigateTo('/');
  }
});
```

---

## 📊 Variables de entorno

### Backend (.env)

```dotenv
# Servidor
PORT=3001
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=password
DB_NAME=hotel_sena_db

# JWT
JWT_SECRET=secreto_muy_seguro_minimo_32_caracteres
JWT_EXPIRES_IN=7d

# Cloudinary (imágenes)
CLOUDINARY_CLOUD_NAME=cloud_name
CLOUDINARY_API_KEY=api_key
CLOUDINARY_API_SECRET=api_secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)

```dotenv
# API
NUXT_PUBLIC_API_BASE=http://localhost:3001

# Cloudinary
NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME=cloud_name

# (No incluir secrets en el frontend)
```

**IMPORTANTE:** 
- ✅ Commitear `.env.example` con valores de ejemplo
- ❌ NUNCA commitear `.env` con valores reales
- Verificar que `.env` está en `.gitignore`

---

## 🚀 Despliegue

### Checklist antes de hacer merge a `main`:

- [ ] Todos los tests pasan (`npm run test`)
- [ ] Lint sin errores (`npm run lint`)
- [ ] Build success (`npm run build`)
- [ ] Mensaje de commit sigue Conventional Commits
- [ ] PR tiene descripción clara
- [ ] Al menos 1 review aprobado

### Variables de entorno en producción

```bash
# NO hardcodear valores
# Usar variables de entorno del servidor (Railway, Vercel, etc)
```

---

## 🐛 Debugging

### Backend

```bash
# Modo debug
npm run start:debug

# En VSCode: presionar F5 (ver .vscode/launch.json)
```

### Frontend

```bash
# Dev server con sourcemaps
npm run dev

# En Chrome DevTools: Sources → ver archivos .ts
```

---

## 📝 Documentación de código

### Backend - JSDoc

```typescript
/**
 * Registra un nuevo cliente en el sistema
 * @param registerDto - Datos del cliente (nombre, email, password)
 * @returns Usuario creado con access_token
 * @throws BadRequestException Si el email ya existe
 */
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  return this.authService.register(registerDto);
}
```

### Frontend - Comentarios

```typescript
/**
 * Composable para manejar notificaciones toast
 * @param duration - Duración en ms (default: 3000)
 * @returns { show, hide, isVisible }
 */
export const useNotification = (duration = 3000) => {
  // ...
}
```

---

## ✅ Checklist semanal

- [ ] Revisar PRs pendientes
- [ ] Actualizar dependencias (`npm outdated`)
- [ ] Revisar logs de error en producción
- [ ] Actualizar documentación si hay cambios
- [ ] Hacer backup de la base de datos
- [ ] Revisar métricas de performance

---

*Última actualización: 15 de marzo de 2026*
