# L&E Multiservices LLC

Aplicación web full stack para el sitio público y la administración interna de L&E Multiservices LLC. Incluye gestión de clientes, movimientos contables, monitoreo de envíos de dinero, comprobantes y reportes mensuales en Excel.

## Tecnologías

- Frontend: React 19, TypeScript, Vite y React Router.
- Backend: Node.js, Express 5 y TypeScript.
- Base de datos: MySQL/MariaDB con Prisma ORM.
- Reportes: ExcelJS.
- Pruebas y calidad: Vitest, ESLint y Prettier.
- Organización: monorepo con npm workspaces.

## Requisitos

- Node.js 22 o superior.
- npm 10 o superior.
- MySQL 8 o MariaDB 10.4 o superior (incluido en XAMPP).
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
DATABASE_URL=mysql://lily_app:LilyDb2026%21ChangeMe@127.0.0.1:3306/lily_mysql
JWT_SECRET=reemplazar-por-un-secreto-seguro-de-al-menos-32-caracteres
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD=1234
```

Configuración del frontend (`frontend/.env`):

```env
VITE_API_URL=http://localhost:3000/api/v1
```

No se deben subir los archivos `.env` al repositorio. Antes de publicar la aplicación, cambia `JWT_SECRET`, la contraseña de MySQL y la contraseña administrativa.

## 3. Preparar MySQL

Inicia MySQL desde el panel de XAMPP. Luego ejecuta desde la raíz:

```powershell
./database/setup-mysql.ps1
```

El script crea una base separada `lily_mysql` y el usuario local `lily_app`, aplica las migraciones y ejecuta el seed. No borra ni modifica PostgreSQL. Si root tiene contraseña, usa `-AskPassword`.

Para una base ya creada y configurada en `backend/.env`:

```bash
npm run db:setup -w backend
```

MySQL debe estar activo cada vez que ejecutes `npm run dev`.

### Historial anterior y datos

El esquema y las migraciones anteriores se conservan en `backend/prisma/schema.postgresql.prisma` y `backend/prisma/migrations-postgresql`. Son un archivo histórico y no se ejecutan contra MySQL. La migración MySQL crea una base nueva; no convierte automáticamente bases PostgreSQL existentes. Nunca ejecutes `migrate reset` para cambiar de motor.

La configuración y los datos locales anteriores se respaldaron en `.local-migration/` (ignorado por Git). Esa carpeta contiene secretos y no debe subirse ni compartirse. Los adjuntos antiguos de disco no se convierten automáticamente; los nuevos se guardan en MySQL.

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

Los nuevos documentos y comprobantes se guardan de forma privada en MySQL, en `StoredFile` y `FileChunk`. No dependen del disco ni de la carpeta reemplazada por los despliegues. Se descargan únicamente por las rutas administrativas autenticadas. Los archivos anteriores en disco se mantienen como compatibilidad de lectura; si existen, deben respaldarse y migrarse antes de desplegar.

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
│   │   ├── migrations/   # Migraciones MySQL
│   │   ├── schema.prisma # Modelos de datos
│   │   └── seed.mjs      # Datos iniciales
│   └── src/
│       ├── config/       # Entorno y Prisma
│       ├── middleware/   # Autenticación y errores
│       ├── modules/      # Clientes, movimientos, envíos y dashboard
│       └── routes/       # Enrutador de la API
├── database/             # Preparación de MySQL
├── package.json          # Scripts y workspaces
└── README.md
```

## Verificación antes de publicar cambios

```bash
npm run lint
npm test
npm run build
```

Los datos de MySQL, documentos adjuntos, comprobantes, archivos `.env`, `node_modules` y carpetas `dist` no deben subirse al repositorio.

## Hostinger: configuración MySQL

Crea una base y un usuario desde hPanel, usando nombres cortos, por ejemplo `lily` y `lilyapp`. Hostinger añade su prefijo; copia los nombres completos y el host que indique el panel. No ejecutes el SQL de creación local en el hosting.

Configura como variables privadas del backend:

```env
NODE_ENV=production
DATABASE_URL=mysql://USUARIO_COMPLETO:CONTRASENA_CODIFICADA@HOST_MYSQL:3306/BASE_COMPLETA
JWT_SECRET=GENERAR_UN_SECRETO_NUEVO_DE_AL_MENOS_32_CARACTERES
CORS_ORIGIN=https://mymultiservicesllc.com
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD=ESTABLECER_UNA_CONTRASENA_SEGURA
```

Codifica los caracteres especiales del usuario/contraseña con `encodeURIComponent`. Nunca pongas `DATABASE_URL` ni secretos en variables `VITE_`. Conserva el puerto que Hostinger asigne. Configura `VITE_API_URL` con la URL HTTPS pública real de la API antes de compilar el frontend.

Genera Prisma antes de compilar (`npm run db:generate -w backend`), aplica `npm run db:deploy -w backend` y ejecuta el seed solo para la creación inicial: el seed actualiza la contraseña del administrador y las categorías. Ejecuta el backend con `npm run start -w backend`. El despliegue también debe configurar la publicación del frontend, las rutas de React y HTTPS. Los nuevos adjuntos se conservan en MySQL; cambiar el motor de datos no publica automáticamente la aplicación.

### Despliegue unificado en Hostinger

- Directorio raíz: `./`
- Node.js: `22.x`
- Instalar dependencias de desarrollo durante la compilación: `npm ci --include=dev`
- Compilar: `npm run build`
- Arrancar: `npm start`
- Si el panel pide un archivo de entrada: `backend/scripts/start-production.mjs`
- La salida del frontend es `frontend/dist`; Express sirve esa carpeta y las rutas de React en producción.
- `VITE_API_URL=https://mymultiservicesllc.com/api/v1`
- Para Node.js dentro de Hostinger, el host MySQL es `127.0.0.1:3306`.

El arranque de producción aplica `prisma migrate deploy` y el seed en modo `--initial-only`: crea usuarios y categorías ausentes, sin actualizar los existentes. Si falta la conexión, el secreto JWT o la contraseña inicial, el arranque falla con un mensaje de configuración. La entrada directa `backend/dist/server.js` también prepara la base de datos al iniciar en producción. Mantén disponibles Prisma CLI y las carpetas `backend/prisma` y `frontend/dist` en el entorno de ejecución.

Guía de conexión del proveedor: https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/

## Adjuntos privados y persistentes

- Los escaneos, documentos y comprobantes nuevos se guardan en MySQL. Cada archivo y su registro se crean en una sola transacción: si falla el registro, se revierte el archivo.
- Se usan bloques de 256 KiB para evitar enviar todo el archivo en una única sentencia MySQL. Los límites actuales son 10 MiB para clientes y giros, y 8 MiB para movimientos.
- Se validan el tipo declarado y la firma básica de PDF/JPG/PNG/DOC/DOCX. Esta comprobación no sustituye un antivirus ni valida por completo documentos complejos.
- Las descargas requieren una cuenta administrativa activa, se entregan como adjunto con `Cache-Control: private, no-store` y se verifica tamaño y SHA-256. No existe una carpeta pública de archivos nuevos.
- Al reemplazar el documento del cliente, se actualiza el registro y se elimina el archivo anterior de MySQL en la misma transacción. No se conserva un historial de versiones.
- La base crecerá con los adjuntos: vigila la cuota de MySQL de tu plan. La permanencia entre despliegues no sustituye un respaldo.

### Respaldos y restauración

Configura y comprueba los respaldos desde hPanel. El respaldo MySQL debe incluir todas las tablas de la aplicación, especialmente `StoredFile` y `FileChunk`; estas contienen los documentos. Un respaldo solo del código Git no contiene los adjuntos. Guarda las exportaciones fuera del repositorio y restringe su acceso, pues contienen información personal. Antes de confiar en el respaldo, restaura una copia en una base separada y verifica una descarga. No se ha configurado una tarea automática de respaldo desde este repositorio ni se asume una política de cifrado del proveedor.

### Verificación local de almacenamiento

Con MySQL local activo, migraciones aplicadas y backend compilado:

```powershell
node backend/scripts/verify-file-storage.mjs
```

Usa únicamente datos ficticios y rechaza bases remotas/producción. Verifica subidas de 6 MiB, descargas tras reiniciar otro proceso Node, autenticación, reemplazo y reversión si falla el registro. Elimina solo los registros creados para la prueba.

## Expiración de identificaciones

El formulario de creación y edición de clientes incluye `Fecha de expiración del ID` como calendario. El campo es opcional para clientes anteriores y documentos sin vencimiento. Se guarda como fecha MySQL (`DATE`), sin hora. No se modifica ninguna identificación ni archivo existente al aplicar esta migración.

El dashboard y la sección Clientes muestran los clientes activos cuyo ID ya venció o vence en siete días o menos. Se usa el día de calendario de `America/New_York`; los avisos se consultan al abrir la página, recuperar el foco y cada minuto mientras permanece abierta. No dependen del filtro financiero mensual ni de la búsqueda de clientes. El perfil y la tabla muestran la fecha y su estado. Al renovar el documento, actualiza también su fecha para retirar el aviso. Los avisos aparecen dentro del panel administrativo.
