# SmartGarage

SmartGarage es una plataforma web para la gestion de un taller mecanico.  
La base de datos esta disenada en PostgreSQL y alojada en Supabase.

## Modulos principales

- Usuarios y roles
- Clientes
- Mecanicos
- Vehiculos
- Ordenes de trabajo
- Diagnosticos
- Historial de estados
- Servicios
- Repuestos
- Facturas
- Alertas de mantenimiento

## Orden de ejecucion de scripts

Ejecutar los archivos SQL en este orden:

1. `00_test_connection.sql`
2. `00_reset.sql`
3. `01_create_tables.sql`
4. `02_insert_catalogs.sql`
5. `03_insert_test_data.sql`
6. `04_validation_queries.sql`
7. `05_create_views.sql`
8. `06_test_queries.sql`

## Nota importante

No subir archivos `.env`, contrasenas, connection strings ni credenciales de Supabase al repositorio.