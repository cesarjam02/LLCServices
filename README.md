# L&E Multiservices LLC

Aplicación web full stack para el sitio público y la administración interna de L&E Multiservices LLC. Incluye gestión de clientes, movimientos contables, monitoreo de envíos de dinero, comprobantes y reportes mensuales en Excel.

## Tecnologías

- Frontend: React 19, TypeScript, Vite y React Router.
- Backend: Node.js, Express 5 y TypeScript.
- Base de datos: PostgreSQL con Prisma ORM.
- Reportes: ExcelJS.
- Pruebas y calidad: Vitest, ESLint y Prettier.
- Organización: monorepo con npm workspaces.

## Requisitos

- Node.js 22 o superior.
- npm 10 o superior.
- PostgreSQL 17 o 18.
- Git, si se va a clonar el proyecto.

## 1. Descargar e instalar

```bash
git clone URL_DEL_REPOSITORIO
cd Lily
npm install
```

`npm install` instala las dependencias del frontend y backend desde la raíz.

## 2. Configurar las variables de entorno

En Windows PowerShell:

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

En macOS o Linux:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Configuración del backend (`backend/.env`):

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://lily_app:LilyDb2026%21ChangeMe@localhost:5432/lily?schema=public
JWT_SECRET=reemplazar-por-un-secreto-seguro-de-al-menos-32-caracteres
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD=1234
```

Configuración del frontend (`frontend/.env`):

```env
VITE_API_URL=http://localhost:3000/api/v1
```

No se deben subir los archivos `.env` al repositorio. Antes de publicar la aplicación, cambia `JWT_SECRET`, la contraseña de PostgreSQL y la contraseña administrativa.

## 3. Preparar PostgreSQL

### Instalación automática en Windows

Después de instalar PostgreSQL, abre PowerShell en la raíz del proyecto y ejecuta:

```powershell
./database/setup-postgres.ps1
```

El script solicita la contraseña del superusuario `postgres`, crea el usuario `lily_app` y la base `lily`, aplica las migraciones de Prisma y ejecuta el seed inicial.

Si PostgreSQL está instalado en otra versión o ubicación:

```powershell
./database/setup-postgres.ps1 -PostgresBin "C:\Program Files\PostgreSQL\18\bin"
```

### Instalación manual

Ejecuta `database/create-database.sql` conectado como el superusuario `postgres`. Después, desde la raíz del proyecto, ejecuta:

```bash
npm run db:generate -w backend
npm run db:deploy -w backend
npm run db:seed -w backend
```

Para realizar los tres pasos juntos:

```bash
npm run db:setup -w backend
```

## 4. Iniciar la aplicación

```bash
npm run dev
```

Este comando inicia frontend y backend simultáneamente con recarga automática:

- Sitio web: http://localhost:5173
- Acceso administrativo: http://localhost:5173/admin/login
- API: http://localhost:3000/api/v1
- Estado de la API: http://localhost:3000/api/v1/health

Credenciales iniciales creadas por el seed:

```text
Usuario: superadmin
Contraseña: 1234
```

Estas credenciales son únicamente para la configuración inicial. Deben cambiarse antes de usar la aplicación en producción.

## Funcionalidades principales

- Página pública adaptable a dispositivos móviles.
- Inicio de sesión privado para administradores.
- Registro y edición de clientes con documentos adjuntos.
- Registro de ingresos y egresos por categoría.
- Comprobantes obligatorios y descargables.
- Filtros por tipo, categoría, cliente y periodo.
- Monitoreo independiente de envíos de dinero y comisiones.
- Dashboard mensual con ingresos, egresos, balance y movimientos recientes.
- Informe mensual de Excel dividido por categorías y con el logo de la empresa.

## Comandos disponibles

| Comando                          | Descripción                                          |
| -------------------------------- | ---------------------------------------------------- |
| `npm run dev`                    | Inicia frontend y backend en desarrollo.             |
| `npm run build`                  | Compila toda la aplicación para producción.          |
| `npm run test`                   | Ejecuta las pruebas automatizadas.                   |
| `npm run lint`                   | Revisa el código con ESLint.                         |
| `npm run format`                 | Formatea el proyecto con Prettier.                   |
| `npm run db:generate -w backend` | Genera el cliente de Prisma.                         |
| `npm run db:migrate -w backend`  | Crea/aplica una migración durante desarrollo.        |
| `npm run db:deploy -w backend`   | Aplica migraciones existentes.                       |
| `npm run db:seed -w backend`     | Crea categorías y administrador inicial.             |
| `npm run db:setup -w backend`    | Genera Prisma, aplica migraciones y ejecuta el seed. |

## Compilar y ejecutar en producción

Configura las variables de entorno de producción y ejecuta:

```bash
npm install
npm run db:deploy -w backend
npm run db:seed -w backend
npm run build
npm run start -w backend
```

El backend utilizará el puerto indicado por `PORT`. Los archivos compilados del frontend estarán en `frontend/dist` y deben publicarse con un servidor web o servicio de hosting. Configura `VITE_API_URL` antes de compilar para que apunte a la URL pública del backend, y `CORS_ORIGIN` con la URL pública del frontend.

Los documentos y comprobantes se guardan en `backend/uploads`. Esta carpeta no se incluye en Git porque puede contener información privada; en producción debe conservarse mediante almacenamiento persistente y respaldos.

## Estructura del proyecto

```text
Lily/
├── frontend/
│   └── src/
│       ├── app/          # Rutas principales
│       ├── components/   # Componentes reutilizables
│       ├── images/       # Recursos gráficos
│       ├── pages/        # Página pública y panel administrativo
│       ├── services/     # Cliente de la API
│       └── styles/       # Estilos de la aplicación
├── backend/
│   ├── prisma/
│   │   ├── migrations/   # Migraciones PostgreSQL
│   │   ├── schema.prisma # Modelos de datos
│   │   └── seed.mjs      # Datos iniciales
│   └── src/
│       ├── config/       # Entorno y Prisma
│       ├── middleware/   # Autenticación y errores
│       ├── modules/      # Clientes, movimientos, envíos y dashboard
│       └── routes/       # Enrutador de la API
├── database/             # Preparación de PostgreSQL
├── package.json          # Scripts y workspaces
└── README.md
```

## Verificación antes de publicar cambios

```bash
npm run lint
npm test
npm run build
```

Los datos de PostgreSQL, documentos adjuntos, comprobantes, archivos `.env`, `node_modules` y carpetas `dist` no deben subirse al repositorio.
