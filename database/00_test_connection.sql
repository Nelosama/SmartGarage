-- 00_test_connection.sql
-- Script de prueba para confirmar conexion con Supabase

SELECT current_database() AS base_de_datos,
       current_user AS usuario_conectado,
       version() AS version_postgresql;