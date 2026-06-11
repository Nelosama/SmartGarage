# Smart Garage - Gestión de Taller

Este es un proyecto de [Next.js](https://nextjs.org) para la gestión integral de un taller mecánico, utilizando [Prisma](https://www.prisma.io/) con [PostgreSQL](https://www.postgresql.org/) (Supabase).

## Guía de Configuración Local

Si acabas de clonar el proyecto, sigue estos pasos para ponerlo en marcha:

### 1. Instalación de Dependencias

Ejecuta el siguiente comando para instalar todos los paquetes necesarios:

```bash
npm install
```

> **Nota:** El proceso de instalación ejecutará automáticamente `prisma generate` para crear el cliente de base de datos basado en el esquema.

### 2. Configuración de Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en el archivo `.env.example`:

```bash
cp .env.example .env
```

Asegúrate de configurar `DATABASE_URL` con tu contraseña de Supabase y el **Connection Pooler** activado:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://mgxqbkfiqfmtydydhfgl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aquí

# Base de Datos (Prisma con Connection Pooler)
DATABASE_URL="postgresql://postgres.mgxqbkfiqfmtydydhfgl:tu_password_aquí@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 3. Ejecución en Desarrollo

Para iniciar el servidor de desarrollo, utiliza:

```bash
npm run dev --webpack
```

> **Importante:** Según las instrucciones internas del proyecto, es necesario incluir el flag `--webpack` al ejecutar los scripts de desarrollo y construcción.

### 4. Estructura de Base de Datos

El esquema de Prisma está sincronizado con las 15 tablas principales del taller. Si realizas cambios en el archivo `prisma/schema.prisma`, recuerda ejecutar:

```bash
npx prisma generate
```

## Scripts Disponibles

- `npm run dev --webpack`: Inicia el servidor de desarrollo.
- `npm run build --webpack`: Genera la versión de producción.
- `npm run lint`: Ejecuta el linter para verificar la calidad del código.
- `npx prisma studio`: Abre una interfaz visual para explorar tus datos.

## Tecnologías

- **React**
- **Next.js**
- **Prisma**
- **PostgreSQL (Supabase)**
- **Tailwind CSS**
