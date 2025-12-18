# smartview Backend

Backend del proyecto smartview desarrollado con Node.js y Express.

## Instalación

### Opción 1: Instalación Local

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Iniciar el servidor:
```bash
# Modo desarrollo (con watch)
npm run dev

# Modo producción
npm start
```

### Opción 2: Docker Compose (Recomendado)

1. Configurar variables de entorno:
```bash
cp .docker-compose.env.example .env
# Edita el archivo .env con tus valores
```

2. Construir y levantar los servicios:
```bash
# Modo producción
docker-compose up -d

# Modo desarrollo (con hot reload)
docker-compose -f docker-compose.dev.yml up -d
```

3. Ver logs:
```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo base de datos
docker-compose logs -f postgres
```

4. Detener servicios:
```bash
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Esto elimina la base de datos)
docker-compose down -v
```

**Nota:** La aplicación estará disponible en `http://localhost:5000` y PostgreSQL en `localhost:5432`

## Estructura del Proyecto

```
backend/
├── src/
│   ├── server.js          # Punto de entrada del servidor
│   ├── routes/            # Definición de rutas
│   ├── controllers/        # Lógica de controladores
│   ├── models/            # Modelos de datos
│   ├── middleware/        # Middlewares personalizados
│   └── utils/             # Utilidades
├── .env.example           # Ejemplo de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## Configuración de Variables de Entorno

El proyecto utiliza PostgreSQL con Sequelize y Power BI. Asegúrate de crear el archivo `.env` en la raíz del proyecto con las siguientes variables:

### Base de Datos
```env
DB_HOST=72.60.52.166
DB_NAME=smartview_db
DB_USER=smartview_db
DB_PASSWORD=sm4rtv13w
DB_PORT=5432
```

### Servidor
```env
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
```

### Power BI / Azure AD
```env
AZURE_CLIENT_ID=tu-client-id-de-azure
AZURE_CLIENT_SECRET=tu-client-secret-de-azure
AZURE_TENANT_ID=tu-tenant-id-guid-especifico
POWERBI_WORKSPACE_ID=tu-workspace-id
POWERBI_SCOPE=https://analysis.windows.net/powerbi/api/.default
```

**Nota:** 
- Las variables de Power BI son opcionales, pero son necesarias para usar los endpoints de Power BI.
- `AZURE_TENANT_ID` debe ser un GUID específico (ej: `12345678-1234-1234-1234-123456789abc`), NO puede ser "common", "organizations" o "consumers" cuando se usa el flujo client_credentials.
- `POWERBI_AUTHORITY_URL` ya no es necesaria, se construye automáticamente usando el tenant ID.

**⚠️ Limitación importante con Power BI Pro:**
- Los Service Principals pueden tener limitaciones para generar embed tokens en workspaces Pro compartidos.
- Para usar Service Principals con embed tokens, se recomienda que el workspace esté en una capacidad Premium (Premium Per User, Premium Per Capacity, o Embedded).
- Alternativa: Usar el flujo de autenticación de usuario (on-behalf-of) en lugar de client_credentials.

## Endpoints

### Información General
- `GET /` - Información de la API
- `GET /health` - Health check del servidor

### Autenticación (`/api/auth`)
- `POST /api/auth/login` - Iniciar sesión (retorna token JWT)
- `POST /api/auth/register` - Registrar nuevo usuario (retorna token JWT)
- `GET /api/auth/verify` - Verificar si un token JWT es válido
- `POST /api/auth/verify` - Verificar si un token JWT es válido (también acepta token en body)
- `GET /api/auth/me` - Obtener información del usuario autenticado (requiere token)
- `GET /login` - Endpoint de login para redirección del frontend

**Nota:** El login y register retornan un token JWT que debe incluirse en el header `Authorization: Bearer <token>` para acceder a rutas protegidas.

**Endpoint verify:**
- Puede recibir el token en el header: `Authorization: Bearer <token>`
- O en el body (POST): `{ "token": "..." }`
- Retorna `valid: true/false` indicando si el token es válido

### Empresas (`/api/companies`)
- `GET /api/companies` - Obtener todas las empresas
  - Query params: `is_active` (true/false)
- `GET /api/companies/:id` - Obtener una empresa por ID
- `POST /api/companies` - Crear una nueva empresa
- `PUT /api/companies/:id` - Actualizar una empresa
- `DELETE /api/companies/:id` - Eliminar/desactivar empresa
  - Query params: `hard=true` para eliminación permanente

### Usuarios (`/api/users`)
- `GET /api/users` - Obtener todos los usuarios
  - Query params: `company_id`, `is_active`, `role_id`
- `GET /api/users/:id` - Obtener un usuario por ID
- `POST /api/users` - Crear un nuevo usuario
- `PUT /api/users/:id` - Actualizar un usuario
- `DELETE /api/users/:id` - Eliminar/desactivar usuario
  - Query params: `hard=true` para eliminación permanente

### Dashboards (`/api/dashboards`)
- `GET /api/dashboards` - Obtener todos los dashboards
  - Query params: `company_id`, `is_active`
- `GET /api/dashboards/:id` - Obtener un dashboard por ID
- `POST /api/dashboards` - Crear un nuevo dashboard
- `PUT /api/dashboards/:id` - Actualizar un dashboard
- `DELETE /api/dashboards/:id` - Eliminar/desactivar dashboard
  - Query params: `hard=true` para eliminación permanente

### Permisos Usuario-Dashboard (`/api/user-dashboards`)
- `GET /api/user-dashboards` - Obtener todos los permisos
  - Query params: `user_id`, `dashboard_id`
- `GET /api/user-dashboards/user/:user_id` - Obtener dashboards de un usuario
- `GET /api/user-dashboards/dashboard/:dashboard_id` - Obtener usuarios con acceso a un dashboard
- `POST /api/user-dashboards` - Asignar dashboard a usuario
- `POST /api/user-dashboards/bulk` - Asignar múltiples dashboards a un usuario
- `DELETE /api/user-dashboards` - Remover permiso (requiere body con `user_id` y `dashboard_id`)

### Power BI (`/api/powerbi`)
- `GET /api/powerbi/dashboards` - Obtener lista de dashboards/reportes de Power BI
- `GET /api/powerbi/dashboards/:id` - Obtener información de un dashboard específico
- `GET /api/powerbi/dashboards/:id/embed-token` - Obtener embed token para un dashboard
  - Query params: `accessLevel` ('View' o 'Edit', default: 'View')

## Modelos de Base de Datos

### Company (Empresas/Clientes)
- `id` (UUID, PK)
- `name` (VARCHAR 100, NOT NULL)
- `industry` (VARCHAR 50)
- `is_active` (BOOLEAN, default: true)
- `createdAt` (TIMESTAMP)

### User (Usuarios)
- `id` (UUID, PK)
- `company_id` (UUID, FK, nullable)
- `name` (VARCHAR 100)
- `email` (VARCHAR 120, UNIQUE, NOT NULL)
- `password_hash` (TEXT, NOT NULL)
- `role_id` (VARCHAR 20, default: 'user') - admin | user
- `is_active` (BOOLEAN, default: true)
- `createdAt` (TIMESTAMP)

### Dashboard
- `id` (UUID, PK)
- `company_id` (UUID, FK, NOT NULL)
- `name` (VARCHAR 100, NOT NULL)
- `description` (TEXT)
- `powerbi_report_id` (VARCHAR 100, NOT NULL)
- `powerbi_workspace_id` (VARCHAR 100, NOT NULL)
- `is_active` (BOOLEAN, default: true)
- `createdAt` (TIMESTAMP)

### UserDashboard (Permisos)
- `user_id` (UUID, PK, FK)
- `dashboard_id` (UUID, PK, FK)

